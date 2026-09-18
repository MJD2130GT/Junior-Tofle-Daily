# 800–900L 목표 문항 편집

## 적용 범위와 측정 상태

`questions.js`의 독해·대화 400문항과 LFM 600문항을 검토하여 목표 독자층에 맞게 조정했다. **800–900L는 편집 목표이며 공식 측정값이 아니다.** 실제로 모든 지문이 이 범위에 들어오는지는 Lexile 분석으로 별도 확인해야 한다. 문장 길이, 단어 수, 앱의 난이도 숫자를 Lexile 점수로 환산하지 않았다.

[MetaMetrics의 Lexile Analyzer 설명](https://lexile.com/educators/tools-to-support-%20reading-at-school/tools-to-determine-a-books-complexity/the-lexile-analyzer/)에 따르면 어휘 빈도와 문장 길이 등이 텍스트 복잡도 분석에 쓰인다. [Text Analyzer 안내](https://hub.lexile.com/text-analyzer-user-guide/)의 결과는 200L 폭의 범위이므로 이 도구의 결과만으로 모든 지문이 정확히 800–900L에 속한다고 단정하지 않는다.

단문 빈칸형 LFM은 독립된 독해 지문과 다르므로 Lexile 값을 붙이지 않았다. 문법 요소, 문맥 단서, 정답의 명확성을 기준으로 조정했다. 리스닝 데이터와 음원은 편집 범위 밖이다.

## 편집 기준

- 독해: 학교·가정·자연 등 익숙한 소재를 유지하며 원인, 대조, 시간 순서, 관계절을 포함하는 연결된 글로 보강했다. 단순한 문장 길이 늘리기를 목표로 삼지 않았다.
- 어휘: 핵심 학습어는 유지하되 `hive`, `ecosystem` 같은 단어는 문맥에서 뜻을 파악할 수 있게 설명했다.
- 문항: 기본적인 정보 확인과 한 단계 추론을 함께 두었다. 일부 무관한 오답을 같은 상황에서 비교할 수 있는 선택지로 바꿨다.
- LFM: 복잡한 가정법, 부정어 도치, 강조구문, 완료 조동사 등을 기본 시제·관계사·문맥 문항으로 바꿨다. 자연스럽지 않은 자동 생성 문장과 중복 문항도 수정했다.
- 해설: 변경된 지문에서 삭제된 문장을 인용하지 않도록 관련 한국어 해설을 수정했다.
- `difficulty`: 2는 기본 확인, 3은 문맥·추론 또는 여러 구문 단서를 함께 보는 문항이다. 독해 지문의 Lexile과 동일한 척도가 아니다.

## 변경 결과

정확한 수치는 재생성할 때 함께 작성되는 `relevel-report.json`을 기준으로 한다.

| 항목 | 편집 전 | 편집 후 |
| --- | ---: | ---: |
| 전체 문항 | 1,000 | 1,000 |
| 독해·대화 / LFM | 400 / 600 | 400 / 600 |
| 서로 다른 독해 지문 | 212 | 212 |
| 지문 평균 단어 수 | 46.6 | 93.8 |
| 지문 단어 수 범위 | 23–117 | 74–117 |
| 앱 난이도 1 / 2 / 3 / 4 / 5 | 83 / 609 / 145 / 114 / 49 | 0 / 762 / 238 / 0 / 0 |

단어 수는 영어 단어 토큰을 세는 기술적 통계이며 난이도 측정값이 아니다. 기존 ID, 배열 순서, 트랙, 정답 위치를 보존했다. 동일 지문을 쓰는 문항에는 같은 수정 지문이 적용된다. 문항별 변경 필드와 편집 사유는 보고서에 있다.

예를 들어 `adv_0002`는 지도 발견 후의 행동을 단순히 찾는 질문에서, 지도를 보관하고 할머니에게 물어보려는 미나의 의도를 추론하는 질문으로 바뀌었다. `lfm_0582`는 정답을 넣으면 `might have have gone`이 되던 오류를 없애고, 불확실한 가능성을 나타내는 `might be` 문항으로 다시 썼다. `lfm_0617`은 모호한 배수 비교 표현을 `three times as long as`로 고쳤다.

## 사실 표현 수정에 참고한 자료

- [Giraffe Conservation Foundation: 기린의 휴식](https://giraffeconservation.org/facts-about-giraffe/do-giraffe-lie-down/): 하루 수면 시간을 단일 수치로 단정하던 문장을 제거하고 휴식 행동을 설명했다.
- [Australian Antarctic Program: 황제펭귄 번식](https://www.antarctica.gov.au/about-antarctica/animals/penguins/emperor-penguin/breeding-cycle/): 모든 펭귄이 번갈아 발 위에서 알을 품는다는 일반화를 황제펭귄 수컷의 행동으로 고쳤다.
- [USDA Forest Service: 제왕나비](https://www.fs.usda.gov/wildflowers/pollinators/Monarch_Butterfly/documents/MonarchButterfliesNorthernGreatPlains.pdf): 봄에 돌아오는 개체를 남하 개체의 증손 세대로 단정하던 설명 대신 여러 세대에 걸친 이동 주기를 설명했다.
- [Smithsonian: 대왕오징어 촬영](https://ocean.si.edu/ocean-life/invertebrates/giant-squid-caught-live-screen), [표본 설명](https://naturalhistory.si.edu/explore/giant-squid): 최초 촬영 연도를 서식 환경 구분 없이 단정하던 문장을 제거했다.
- [National Honey Board: Reference Guide](https://honey.com/images/files/refguide.pdf): 꿀이 절대로 상하지 않는다는 문장을 보관 조건에 따라 달라진다는 설명으로 바꿨다.

## 재생성과 검증

프로젝트 폴더에서 다음 명령을 실행한다.

```sh
node tools/generate_questions.js
node tools/relevel_questions.js --check
```

기존 생성 명령은 이제 편집판 생성기로 연결된다. 기준 원본은 `questions.before-800-900.js`이며 덮어쓰지 않는다. 편집판을 추가 수정할 때는 `tools/relevel_questions.js`를 수정하고 다시 생성한다. `questions.js`에만 직접 수정하면 다음 생성 때 해당 수정은 사라진다.

검증은 1,000개 ID와 순서, 400/600 트랙, 선택지 4개 및 선택지 중복, 정답 인덱스 보존, 빈칸 수, UTF-8, 재생성 일치, 완전 중복 문항을 확인한다. 이 검증은 교육적 타당도나 공식 Lexile 분석을 대신하지 않는다.

서비스 워커 캐시 버전을 올려 새 파일이 오프라인 캐시에도 반영되도록 했다. 기존 학습 기록은 초기화하지 않는다. 사용자가 별도로 가져온 같은 ID의 사용자 문항은 앱의 기존 규칙에 따라 기본 문항보다 우선한다.
