"""
리스닝 음원 + 문항 빌드
====================================================================
  python tools/build_listening.py              변경된 문항만 재생성
  python tools/build_listening.py --force      전부 재생성
  python tools/build_listening.py --only lis_0009 lis_0010

소스를 읽어
  audio/lis_XXXX.m4a      음원
  questions_listening.js  문항 데이터 (index.html이 questions.js 다음에 로드)
를 함께 만든다.

소스 위치:
  tools/listening_source.json   배역(cast) · 기본값(defaults) · 문항(items, 선택)
  tools/listening/*.json        문항 배열. 파일명 순으로 합쳐진다.
                                200문항 규모에서 한 파일이 너무 커지므로 주제별로 나눈다.

필요한 것: 환경변수 AZURE_SPEECH_KEY / AZURE_SPEECH_REGION, PATH에 ffmpeg.
Azure 무료 F0 티어로 충분하다 (파일럿 전체가 월 한도의 1% 미만).

--- 검증으로 확정된 Azure SSML 제약 (2026-08-09) ---
  <prosody volume="+3dB">  → HTTP 400. 상대 dB는 거부된다. loud/soft 라벨만 가능.
  <emphasis level="strong"> → 동작은 하지만 효과가 약해 쓰지 않기로 했다.
                              대비 강세는 <prosody pitch+rate>로 직접 만든다.
  Azure에 sarcastic/disgruntled 스타일은 없다. 비꼼은 unfriendly로 근사한다.
"""
import argparse, hashlib, json, os, pathlib, random, re, shutil, subprocess, sys, tempfile, time
import urllib.error, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "listening_source.json"
SRC_DIR = ROOT / "tools" / "listening"
AUDIO_DIR = ROOT / "audio"
OUT_JS = ROOT / "questions_listening.js"
CACHE = ROOT / "tools" / ".listening_cache.json"

# 대비 강세 파라미터 — 청취 판정에서 채택한 B방식
EMPH_PITCH, EMPH_RATE = "+25Hz", "-18%"
# 출력 인코딩. prosody 문항은 미묘한 억양을 들려줘야 하므로 48kbps로 여유를 뒀다.
AAC_BITRATE, SAMPLE_RATE = "48k", 24000

NS = ('version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
      'xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US"')
SPEAKER_LABEL = {"student_f": "Girl", "student_m": "Boy", "teacher_f": "Teacher",
                 "teacher_m": "Teacher", "announcer_f": "Announcer", "announcer_m": "Announcer"}
MARKUP = re.compile(r"<em>(.*?)</em>|\[p(\d+)\]", re.S)


def xml_escape(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def turn_to_ssml(turn, default_rate):
    """turn 하나를 SSML 조각으로. <em>/[pN] 마크업을 먼저 처리한 뒤 나머지를 이스케이프한다."""
    parts, pos = [], 0
    for m in MARKUP.finditer(turn["t"]):
        if m.start() > pos:
            parts.append(xml_escape(turn["t"][pos:m.start()]))
        if m.group(1) is not None:
            parts.append(f'<prosody pitch="{EMPH_PITCH}" rate="{EMPH_RATE}">'
                         f'{xml_escape(m.group(1))}</prosody>')
        else:
            parts.append(f'<break time="{m.group(2)}ms"/>')
        pos = m.end()
    parts.append(xml_escape(turn["t"][pos:]))
    inner = "".join(parts)

    attrs = " ".join(f'{k}="{turn[k]}"' for k in ("rate", "pitch", "volume") if k in turn)
    if not attrs and default_rate:
        attrs = f'rate="{default_rate}"'
    if attrs:
        inner = f"<prosody {attrs}>{inner}</prosody>"

    if "style" in turn:
        deg = f' styledegree="{turn["styledegree"]}"' if "styledegree" in turn else ""
        inner = f'<mstts:express-as style="{turn["style"]}"{deg}>{inner}</mstts:express-as>'
    return inner


def plain_text(t):
    """마크업을 걷어낸 순수 대본."""
    return re.sub(r"\s{2,}", " ", MARKUP.sub(lambda m: m.group(1) or "", t)).strip()


def synth(ssml, key, region, tries=6):
    """무료 F0 티어는 초당 요청 수가 제한된다. 200문항을 한 번에 돌리면 429가 나므로
    지수 백오프로 재시도한다. 4xx(SSML 오류)는 재시도해도 소용없으니 즉시 중단."""
    url = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
    for attempt in range(tries):
        req = urllib.request.Request(url, data=ssml.encode("utf-8"), headers={
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
            "User-Agent": "jrtoefl-daily",
        })
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            body = e.read()[:400].decode("utf-8", "replace").strip()
            retriable = e.code == 429 or e.code >= 500
            if not retriable or attempt == tries - 1:
                raise SystemExit(
                    f"\nAzure HTTP {e.code}: {body or '(본문 없음 — 대개 SSML 문법 오류)'}\n"
                    f"SSML:\n{ssml}")
            wait = min(60, 2 ** attempt) + random.random()
            # Retry-After를 주면 그 값을 따른다
            hdr = e.headers.get("Retry-After") if e.headers else None
            if hdr and hdr.isdigit():
                wait = max(wait, int(hdr))
            print(f"      HTTP {e.code} — {wait:.1f}초 후 재시도 ({attempt + 1}/{tries - 1})")
            time.sleep(wait)
        except urllib.error.URLError as e:
            if attempt == tries - 1:
                raise SystemExit(f"\n네트워크 오류: {e.reason}")
            wait = min(30, 2 ** attempt) + random.random()
            print(f"      네트워크 오류 — {wait:.1f}초 후 재시도 ({attempt + 1}/{tries - 1})")
            time.sleep(wait)


def ff(args):
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args],
                       capture_output=True, text=True)
    if r.returncode:
        raise SystemExit("ffmpeg 실패:\n" + r.stderr.strip()[:600])


def assemble(turn_files, gap_ms, dst):
    """턴 사이에 무음을 넣어 이어 붙이고, 음량 정규화 후 AAC로 인코딩."""
    inputs, chain, n = [], "", 0
    for i, f in enumerate(turn_files):
        inputs += ["-i", str(f)]; chain += f"[{n}:a]"; n += 1
        if i < len(turn_files) - 1 and gap_ms > 0:
            inputs += ["-f", "lavfi", "-t", f"{gap_ms/1000:.3f}",
                       "-i", f"anullsrc=r={SAMPLE_RATE}:cl=mono"]
            chain += f"[{n}:a]"; n += 1
    fc = (chain + f"concat=n={n}:v=0:a=1,"
          "loudnorm=I=-16:TP=-1.5:LRA=11,"
          f"aresample={SAMPLE_RATE}[o]")
    ff([*inputs, "-filter_complex", fc, "-map", "[o]",
        "-c:a", "aac", "-b:a", AAC_BITRATE, "-ac", "1", str(dst)])


def duration(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout
    return float(out.strip() or 0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="캐시 무시하고 전부 재생성")
    ap.add_argument("--only", nargs="+", metavar="ID", help="특정 문항만")
    args = ap.parse_args()

    key = os.environ.get("AZURE_SPEECH_KEY")
    region = os.environ.get("AZURE_SPEECH_REGION")
    if not key or not region:
        raise SystemExit("AZURE_SPEECH_KEY / AZURE_SPEECH_REGION 환경변수가 필요합니다.")
    if not shutil.which("ffmpeg"):
        raise SystemExit("PATH에서 ffmpeg를 찾을 수 없습니다.")

    doc = json.loads(SRC.read_text(encoding="utf-8"))
    cast, defaults = doc["cast"], doc["defaults"]
    items = list(doc.get("items", []))
    if SRC_DIR.is_dir():
        for f in sorted(SRC_DIR.glob("*.json")):
            batch = json.loads(f.read_text(encoding="utf-8"))
            batch = batch.get("items", batch) if isinstance(batch, dict) else batch
            items.extend(batch)
            print(f"  소스 {f.name}: {len(batch)}문항")
    if not items:
        raise SystemExit("문항이 없습니다.")

    # ---- 사전 검증: Azure를 한 번이라도 호출하기 전에 전부 확인한다 ----
    # 100개를 뽑은 뒤 101번째에서 죽으면 호출과 시간이 그냥 날아간다.
    problems, seen_ids = [], set()
    for it in items:
        qid = it.get("id", "(id 없음)")
        if qid in seen_ids:
            problems.append(f"{qid}: id 중복")
        seen_ids.add(qid)
        for field in ("kind", "difficulty", "turns", "stem", "choices", "answer", "explanation", "tags"):
            if field not in it:
                problems.append(f"{qid}: '{field}' 누락")
        ch = it.get("choices", [])
        if len(ch) != 4:
            problems.append(f"{qid}: 보기가 {len(ch)}개 (4개여야 함)")
        elif len(set(ch)) != 4:
            problems.append(f"{qid}: 보기 중복")
        if not isinstance(it.get("answer"), int) or not 0 <= it.get("answer", -1) <= 3:
            problems.append(f"{qid}: answer가 0~3이 아님")
        if not 1 <= it.get("difficulty", 0) <= 5:
            problems.append(f"{qid}: difficulty가 1~5가 아님")
        for t in it.get("turns", []):
            if t.get("v") not in cast:
                problems.append(f"{qid}: 미정의 배역 '{t.get('v')}'")
            if not t.get("t", "").strip():
                problems.append(f"{qid}: 빈 대사")
        if "prosody" in it.get("tags", []) and not it.get("transcriptMarked"):
            problems.append(f"{qid}: prosody인데 transcriptMarked 없음")
    if problems:
        print("\n사전 검증 실패 — Azure 호출 없이 중단합니다:")
        for p in problems[:40]:
            print("  !", p)
        if len(problems) > 40:
            print(f"  ... 외 {len(problems) - 40}건")
        raise SystemExit(1)
    print(f"  사전 검증 통과: {len(items)}문항")
    gap_ms = defaults.get("gapMs", 380)
    default_rate = defaults.get("rate", "")
    AUDIO_DIR.mkdir(exist_ok=True)

    cache = {}
    if CACHE.exists() and not args.force:
        try: cache = json.loads(CACHE.read_text(encoding="utf-8"))
        except Exception: cache = {}

    questions, built, skipped, chars = [], 0, 0, 0
    todo = len(args.only) if args.only else len(items)  # 진행률 표시용 상한

    for it in items:
        qid = it["id"]
        m4a = AUDIO_DIR / f"{qid}.m4a"
        ssml_turns = [(t, cast[t["v"]]["voice"], turn_to_ssml(t, default_rate)) for t in it["turns"]]

        sig = hashlib.sha256(json.dumps(
            [[v, s] for _, v, s in ssml_turns] + [gap_ms, AAC_BITRATE],
            ensure_ascii=False).encode("utf-8")).hexdigest()

        selected = (not args.only) or qid in args.only
        if selected and (args.force or cache.get(qid) != sig or not m4a.exists()):
            with tempfile.TemporaryDirectory() as td:
                files = []
                for i, (turn, voice, inner) in enumerate(ssml_turns):
                    ssml = f'<speak {NS}><voice name="{voice}">{inner}</voice></speak>'
                    chars += len(turn["t"])
                    p = pathlib.Path(td) / f"{i}.mp3"
                    p.write_bytes(synth(ssml, key, region))
                    files.append(p)
                assemble(files, gap_ms, m4a)
            cache[qid] = sig
            built += 1
            print(f"  [{built:>3}/{todo}] {qid}  {duration(m4a):5.1f}s  "
                  f"{m4a.stat().st_size/1024:6.1f}KB  ({len(ssml_turns)}턴)")
        else:
            skipped += 1  # 200문항 규모에서는 한 줄씩 찍으면 출력이 묻히므로 개수만 센다

        # ---- 문항 데이터 ----
        multi = len(it["turns"]) > 1
        lines = []
        for t in it["turns"]:
            txt = plain_text(t["t"])
            lines.append(f'{SPEAKER_LABEL.get(t["v"], t["v"])}: {txt}' if multi else txt)
        q = {
            "id": qid, "track": "listening", "type": "mcq",
            "audio": f"audio/{qid}.m4a",
            "transcript": "\n".join(lines),
            "stem": it["stem"], "choices": it["choices"], "answer": it["answer"],
            "explanation": it["explanation"],
            "difficulty": it["difficulty"], "tags": it["tags"],
            "replayLimit": it.get("replayLimit", defaults.get("replayLimit", 2)),
        }
        if it.get("transcriptMarked"):
            q["transcriptMarked"] = it["transcriptMarked"]
        questions.append(q)

    # ---- 검증 ----
    seen = set()
    for q in questions:
        assert q["id"] not in seen, f"중복 id {q['id']}"
        seen.add(q["id"])
        assert len(q["choices"]) == 4 == len(set(q["choices"])), f"보기 오류 {q['id']}"
        assert 0 <= q["answer"] <= 3, f"answer 범위 {q['id']}"
        assert (AUDIO_DIR / f"{q['id']}.m4a").exists(), f"음원 없음 {q['id']}"

    header = f"""// ============================================================
// Jr. TOEFL Daily - 리스닝 문항 ({len(questions)}개)
// ------------------------------------------------------------
// 이 파일은 자동 생성됩니다. 직접 고치지 마세요.
//   원본:   tools/listening_source.json
//   재생성: python tools/build_listening.py
//
// questions.js 가 window.QUESTION_BANK 를 '대입'하므로,
// index.html에서 반드시 questions.js '다음에' 로드해야 합니다.
// ============================================================
window.QUESTION_BANK = (window.QUESTION_BANK || []).concat([
"""
    order = ["id", "track", "type", "audio", "transcript", "transcriptMarked",
             "stem", "choices", "answer", "explanation", "difficulty", "tags", "replayLimit"]
    body = ",\n".join(
        "  " + json.dumps({k: q[k] for k in order if k in q}, ensure_ascii=False)
        for q in questions)
    OUT_JS.write_text(header + body + "\n]);\n", encoding="utf-8")

    total = sum((AUDIO_DIR / f"{q['id']}.m4a").stat().st_size for q in questions)
    secs = sum(duration(AUDIO_DIR / f"{q['id']}.m4a") for q in questions)
    if cache: CACHE.write_text(json.dumps(cache, indent=1), encoding="utf-8")
    print(f"\n생성 {built} · 건너뜀 {skipped}")
    print(f"음원 합계: {secs/60:.1f}분 / {total/1024/1024:.2f}MB")
    if chars: print(f"이번에 소비한 Azure 문자: {chars:,} (무료 월 50만 자)")
    print(f"문항 파일: {OUT_JS.relative_to(ROOT)} ({len(questions)}개)")


if __name__ == "__main__":
    main()
