# Jr. TOEFL Daily

주니어토플(TOEFL Junior) 데일리 연습 웹앱 — **개인/가정용**, 서버 없이 브라우저 로컬 저장만 사용합니다.

- 하루 6문제 (어드벤처 2 + LFM 문법·어휘 2 + **리스닝 2**), 한 문제씩 풀고 즉시 채점·해설
- **리스닝**: 음원을 듣고 푸는 문항 — 채점 전 재생 횟수 제한, 채점 후 스크립트 공개
- 스트릭(연속 학습일), 오답노트/집중 복습, 유형별 정답률 통계
- **간격 반복**: 오답을 정복하면 3일 뒤 데일리 세트에서 자동 재확인 (하루 1문제)
- **주간 미션**: 5일 완료 / 정답 20개 / 오답 5개 정복 → 보너스 포인트
- **오늘의 어휘**: 결과 화면에서 그날 지문에 나온 핵심 단어 정리
- 보상 시스템: 포인트(잔액/누적) · 배지 · 레벨 · **부모가 등록한 실제 보상 교환 + PIN 승인**
- **주간 리포트**(부모님 공간): 요일별 완료, 주간 정답률(지난주 비교), 자주 틀린 유형 Top 3
- **데이터 백업/복원**: 설정에서 JSON 파일로 내보내기/불러오기 (기기 이전 지원)
- PWA: 홈 화면 추가, 오프라인 캐시

## 실행 방법

가장 간단한 방법 (Python이 설치되어 있으므로):

```
cd jr-toefl-daily
python -m http.server 8000
```

브라우저에서 http://localhost:8000 접속.
스마트폰에서 쓰려면 같은 Wi-Fi에서 `http://<PC IP>:8000` 접속 후 "홈 화면에 추가".
(무료 정적 호스팅 — GitHub Pages, Netlify 등 — 에 폴더를 올려도 됩니다. HTTPS면 PWA 오프라인 기능이 동작합니다.)

> `index.html`을 더블클릭해 `file://`로 열어도 동작합니다 (PWA/오프라인 캐시만 비활성).

## 문항 (총 1,200개 · 독해 편집 목표 800–900L)

`questions.js`에 **어드벤처 400 + LFM(문법·어휘) 600 = 1,000문항**,
`questions_listening.js`에 **리스닝 200문항**이 들어 있습니다.
- `questions.js`는 독해의 어휘·구문·문맥을 **800–900L 독자층을 목표로 편집**한 버전입니다. 공식 Lexile 측정값은 아닙니다.
- LFM 단문에는 Lexile 수치를 부여하지 않습니다. 복잡한 가정법·도치·강조구문 등을 기본 시제·관계사·문맥 문항으로 교체했습니다.
- 앱의 `difficulty`는 2(기본 확인) 또는 3(문맥·추론·복합 구문)이며 Lexile 점수와 별개입니다. ID 번호는 난이도를 뜻하지 않습니다.
- 기존 1,000개 ID와 트랙 구성을 유지합니다. 리스닝 200문항은 이번 편집 범위에 포함되지 않습니다.
- 원본: `data/questions.before-800-900.js`. 재생성: `node tools/generate_questions.js` 또는 `node tools/relevel_questions.js`.
- 검증: `node tools/relevel_questions.js --check`. 편집 기준은 [data/READABILITY.md](data/READABILITY.md), 문항별 변경 필드는 `data/relevel-report.json`을 참고하세요.

난이도 분포: Lv1 83 · Lv2 609 · **Lv3 145 · Lv4 114 · Lv5 49** (1~5 척도)
→ **상급(Lv3~5)이 30.8%, Lv2 이상이 91.7%**.
데일리 세트는 **최근 정답률에 따라 난이도를 적응적으로 조절**합니다 — 잘 맞히면 더 어려운 문제가 나옵니다.

문항 추가/수정 방법:
1. **`questions.js` 직접 편집** — 파일 안의 주석에 필드 설명이 있습니다.
2. 앱의 **설정 → 부모님 공간 → 문항 JSON 가져오기**로 JSON 배열 파일 업로드
   (같은 `id`는 덮어쓰기, 브라우저에 저장됨).
3. 생성 문항을 다시 만들려면: `node tools/generate_questions.js`
   (수작업 문항 36개는 보존됨)

문항 형식 예:

```json
{
  "id": "lfm_0100",
  "track": "lfm",
  "type": "mcq",
  "passage": "(선택) 지문/대화",
  "stem": "The students ______ their homework before class started.",
  "choices": ["finish", "finishes", "had finished", "will finish"],
  "answer": 2,
  "explanation": "과거 특정 시점 이전 완료 → 과거완료 'had finished'.",
  "difficulty": 2,
  "tags": ["tense", "past-perfect"]
}
```

`track`은 `adventure`(지문 독해·어휘), `lfm`(문법·어휘), `listening`(듣기). `answer`는 0~3 인덱스.

## 리스닝 (200문항)

아이가 약한 **main idea(주제 파악) 100문항 + prosody(강세·억양·어조) 100문항**으로 구성했습니다.
음원은 총 70분 / 23MB이며 `audio/lis_XXXX.m4a`에 들어 있습니다.
하루 2문제 기준 **100일치**이고, 정답 위치는 A~D에 정확히 50개씩 분산돼 있습니다.

| 초점 | 세부 유형 | 문항 |
|---|---|---|
| main idea | 학교생활 대화 38 · 교내 안내방송 22 · 짧은 학술 토크 40 | 100 |
| prosody | 어조·태도 46 · 대비 강세 30 · 억양 24 | 100 |

난이도는 Lv2 61 · Lv3 104 · Lv4 35입니다.

- prosody 문항은 **스크립트를 읽어서는 풀 수 없습니다** — 소리를 들어야만 답이 나옵니다.
  그래서 채점 후 평문 스크립트와 함께 **강세 표기본**을 따로 보여 줍니다.
- 재생 횟수는 채점 전 2회(prosody는 3회), 채점 후 무제한입니다.
- 오늘 세트에 리스닝이 있으면 해당 음원만 미리 캐시에 받아 둡니다. 전량 프리캐시가 아니라
  **그날 쓸 것만** 받으므로, 지하철 등 오프라인에서도 재생되면서 설치는 가볍습니다.

### 음원 다시 만들기

대본·문항은 `tools/listening/*.json`(주제별)과 `tools/listening_source.json`(배역·기본값)에 있고,
여기서 음원과 문항 데이터를 함께 생성합니다. 내용 해시로 **바뀐 문항만** 다시 뽑습니다.

```
setx AZURE_SPEECH_KEY "<Azure Speech 키>"
setx AZURE_SPEECH_REGION "koreacentral"
python tools/build_listening.py            # 바뀐 문항만 재생성
python tools/build_listening.py --force    # 전부 재생성
python tools/build_listening.py --only lis_0009
```

Azure Speech **무료 F0 티어**(월 50만 자)로 충분합니다 — 200문항 전체를 한 번 뽑는 데
약 7만 6천 자(월 한도의 15%)가 듭니다. 과금 문자에는 `<speak>`·`<voice>`를 뺀 SSML 태그도
포함되므로 대본 원문보다 약 1.3배 잡으면 됩니다.

`ffmpeg`가 PATH에 있어야 합니다. **키를 저장소에 커밋하지 마세요** (환경 변수로만 씁니다).

정답 위치가 앞쪽(A·B)으로 쏠리면 아이가 내용이 아니라 위치로 찍는 법을 배웁니다.
문항을 추가한 뒤에는 균등화 도구를 돌리세요 — 보기 순서만 바꾸므로 음원은 재생성되지 않습니다.

```
python tools/balance_answers.py          # 현재 분포 확인만
python tools/balance_answers.py --apply  # 실제로 균등화
python tools/build_listening.py          # questions_listening.js 갱신
```

> 해설에서 보기를 'A', 'D' 같은 **문자로 지칭하지 마세요.** 순서를 섞는 순간 해설이 틀려집니다.
> 보기 '내용'으로 쓰면 됩니다. 균등화 도구가 문자 지칭을 발견하면 실행을 거부합니다.

대본에서 쓸 수 있는 마크업:

| 표기 | 의미 |
|---|---|
| `<em>word</em>` | 대비 강세 (`<prosody pitch="+25Hz" rate="-18%">`로 변환) |
| `[p700]` | 700ms 휴지 |
| `"style": "unfriendly"` | Azure 감정 스타일 (비꼼은 `unfriendly`로 근사) |

> Azure SSML 제약 두 가지 — `<prosody volume="+3dB">`는 400 오류이므로 `loud`/`soft` 라벨을 써야 하고,
> `sarcastic`·`disgruntled` 스타일은 존재하지 않습니다.

## 부모님 공간

설정 탭 → 부모님 공간 (최초 진입 시 숫자 4자리 PIN 설정)

- 오늘 요약(완료 여부·정답률·오답·포인트)
- 보상 항목 등록/숨김/삭제 (예: "게임 30분 = 300P")
- 자녀의 교환 신청 승인/거절
- 포인트 규칙 조정 (풀이/첫 정답/완료/연속/복습 보상)
- 문항 JSON 가져오기, PIN 변경, 데이터 초기화

## 데이터

모든 데이터는 브라우저 `localStorage`에만 저장됩니다 (외부 전송 없음).
기기를 바꾸면 기록이 이전되지 않으니, 같은 기기·같은 브라우저로 사용하세요.

## 파일 구조

```
index.html                   앱 진입점
privacy.html                 개인정보처리방침 (정적 페이지)
contact.html                 문의하기 (정적 페이지)
styles.css                   스타일
app.js                       앱 로직 (상태/화면/보상 엔진)
questions.js                 문항 데이터 1,000개 (부모가 편집 가능)
questions_listening.js       리스닝 문항 200개 — 자동 생성물, 직접 편집 금지
audio/lis_XXXX.m4a           리스닝 음원 200개 (23MB)
tools/generate_questions.js  문항 생성기 (node로 실행)
tools/listening_source.json  리스닝 배역·기본값 (+ 초기 16문항)
tools/listening/*.json       리스닝 대본·문항 (주제별) ← 여기를 편집
tools/build_listening.py     리스닝 빌드 (Azure TTS + ffmpeg)
tools/balance_answers.py     정답 위치 균등화
manifest.webmanifest         PWA 매니페스트
sw.js                        서비스 워커 (오프라인 캐시)
icon.svg                     앱 아이콘
```
