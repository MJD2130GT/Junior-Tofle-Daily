# Jr. TOEFL Daily

주니어토플(TOEFL Junior) 데일리 연습 웹앱 — **개인/가정용**, 서버 없이 브라우저 로컬 저장만 사용합니다.

- 하루 6문제 (어드벤처 3 + LFM 문법·어휘 3), 한 문제씩 풀고 즉시 채점·해설
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

## 문항 (총 1,000개)

`questions.js`에 **어드벤처 500 + LFM(문법·어휘) 500 = 1,000문항**이 들어 있습니다.
- `adv_0001~0018`, `lfm_0001~0018`: 수작업 문항
- 나머지: `tools/generate_questions.js`로 생성한 문항 (시드 고정 → 재실행해도 동일)

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

`track`은 `adventure`(지문 독해·어휘) 또는 `lfm`(문법·어휘). `answer`는 0~3 인덱스.

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

## Google AdSense 승인 대비

- **개인정보처리방침**: [privacy.html](privacy.html) — 로컬 저장 안내, Google AdSense 쿠키·맞춤광고 고지,
  옵트아웃 링크(Google 광고 설정 / aboutads.info), 만 14세 미만 이용자 보호 문구 포함.
- **문의하기**: [contact.html](contact.html) — 이메일(mailto) 연락처.
- 두 페이지는 첫 화면(온보딩)과 설정 화면 하단에서 링크로 연결되어 있어 리뷰어가 쉽게 찾을 수 있습니다.
- 실제 광고 스크립트(`adsbygoogle.js` 등)는 AdSense 승인 후 `index.html`의 `<head>`에 추가하면 됩니다.
- 운영자·연락처 정보를 바꾸려면 `privacy.html`, `contact.html`을 직접 편집하세요.

## 파일 구조

```
index.html                   앱 진입점
privacy.html                 개인정보처리방침 (정적 페이지)
contact.html                 문의하기 (정적 페이지)
styles.css                   스타일
app.js                       앱 로직 (상태/화면/보상 엔진)
questions.js                 문항 데이터 1,000개 (부모가 편집 가능)
tools/generate_questions.js  문항 생성기 (node로 실행)
manifest.webmanifest         PWA 매니페스트
sw.js                        서비스 워커 (오프라인 캐시)
icon.svg                     앱 아이콘
```
