"""
리스닝 문항의 정답 위치를 A~D에 고르게 분산시킨다.
    python tools/balance_answers.py            현재 분포만 보고
    python tools/balance_answers.py --apply    실제로 섞어서 저장

손으로 문항을 쓰면 정답을 앞쪽(A·B)에 두는 습관이 나온다. 그대로 두면
아이가 내용이 아니라 위치로 찍는 법을 배우게 되므로 주기적으로 돌린다.

보기 텍스트는 그대로 두고 순서만 바꾸며, answer 인덱스를 함께 옮긴다.
음원은 보기를 읽지 않으므로 재생성이 필요 없다 (빌드 서명에 choices가 없다).
시드가 고정되어 있어 같은 입력이면 항상 같은 결과가 나온다.
"""
import argparse, collections, json, pathlib, random, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "listening_source.json"
SRC_DIR = ROOT / "tools" / "listening"
SEED = 20260809


def load_files():
    """(경로, 문서, 문항리스트) 목록. 두 가지 소스 형태를 모두 다룬다."""
    out = []
    if SRC.exists():
        doc = json.loads(SRC.read_text(encoding="utf-8"))
        if doc.get("items"):
            out.append((SRC, doc, doc["items"]))
    for f in sorted(SRC_DIR.glob("*.json")):
        doc = json.loads(f.read_text(encoding="utf-8"))
        items = doc["items"] if isinstance(doc, dict) and "items" in doc else doc
        out.append((f, doc, items))
    return out


def show(items, label):
    c = collections.Counter(it["answer"] for it in items)
    n = len(items)
    bars = "  ".join(f"{'ABCD'[i]} {c[i]:>3} ({c[i]/n*100:4.1f}%)" for i in range(4))
    print(f"  {label:<8} {bars}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="파일에 실제로 반영")
    args = ap.parse_args()

    files = load_files()
    everything = [it for _, _, items in files for it in items]
    if not everything:
        raise SystemExit("문항이 없습니다.")

    print(f"문항 {len(everything)}개")
    show(everything, "현재")

    # 해설이 보기를 'A'·'D' 같은 문자로 지칭하면, 순서를 섞는 순간 엉뚱한 보기를 가리키게 된다.
    # 조용히 틀린 해설이 되는 게 최악이므로 아예 막는다. 보기 '내용'으로 바꿔 쓸 것.
    letter_ref = re.compile(r"(?:다면 [ABCD](?![a-zA-Z])|[ABCD][는가를의]\s|\([ABCD]\)|[ABCD]가 답|[ABCD]는 오답)")
    offenders = [(it["id"], m.group(0).strip())
                 for it in everything
                 for m in [letter_ref.search(it.get("explanation", ""))] if m]
    if offenders:
        print("\n해설이 보기를 문자로 지칭하고 있습니다. 순서를 섞으면 해설이 틀려집니다:")
        for qid, frag in offenders:
            print(f"  ! {qid}  …{frag}…")
        raise SystemExit("\n해당 해설을 보기 '내용'으로 고친 뒤 다시 실행하세요.")

    # 목표 위치를 균등하게 만들어 섞는다 (0,1,2,3,0,1,2,3,... 을 셔플)
    rng = random.Random(SEED)
    targets = [i % 4 for i in range(len(everything))]
    rng.shuffle(targets)

    for it, t in zip(everything, targets):
        ch = it["choices"]
        correct = ch[it["answer"]]
        others = [c for i, c in enumerate(ch) if i != it["answer"]]
        new = others[:t] + [correct] + others[t:]
        it["choices"] = new
        it["answer"] = t
        assert new[t] == correct

    show(everything, "변경 후")

    if not args.apply:
        print("\n미리보기입니다. 실제로 적용하려면 --apply 를 붙이세요.")
        return

    for path, doc, items in files:
        path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"  저장: {path.relative_to(ROOT)} ({len(items)}문항)")
    print("\nquestions_listening.js를 갱신하려면 build_listening.py를 다시 돌리세요.")
    print("(보기 순서는 음원과 무관하므로 Azure 재호출은 일어나지 않습니다)")


if __name__ == "__main__":
    main()
