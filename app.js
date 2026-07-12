/* ============================================================
 * Jr. TOEFL Daily - 메인 앱 로직
 * 개인/가정용 · 로컬 저장(localStorage) · 서버 없음
 * ============================================================ */
"use strict";

// ---------------- 상수 ----------------
const STORE_KEY = "jrtoefl.state.v1";
const BANK_KEY = "jrtoefl.customBank.v1";

const LEVELS = [
  { min: 0,    title: "새싹",     icon: "🌱" },
  { min: 200,  title: "브론즈",   icon: "🥉" },
  { min: 500,  title: "실버",     icon: "🥈" },
  { min: 1000, title: "골드",     icon: "🥇" },
  { min: 2000, title: "플래티넘", icon: "💠" },
  { min: 3500, title: "다이아",   icon: "💎" },
  { min: 5000, title: "마스터",   icon: "👑" },
];

const BADGES = [
  { id: "first_done",  icon: "🎉", name: "첫 학습 완료",  desc: "데일리 세트를 처음으로 완료" },
  { id: "streak_3",    icon: "🔥", name: "3일 연속",      desc: "3일 연속 학습" },
  { id: "streak_7",    icon: "🚀", name: "7일 연속",      desc: "7일 연속 학습" },
  { id: "streak_30",   icon: "🌟", name: "30일 연속",     desc: "30일 연속 학습" },
  { id: "streak_100",  icon: "🏆", name: "100일 연속",    desc: "100일 연속 학습" },
  { id: "perfect_day", icon: "💯", name: "올백 데이",     desc: "하루 전 문제 정답" },
  { id: "review_10",   icon: "🛡️", name: "오답 정복자",   desc: "오답 10개 정복" },
  { id: "points_1000", icon: "💰", name: "포인트 부자",   desc: "누적 1,000P 달성" },
  { id: "solve_100",   icon: "📚", name: "100문제 돌파",  desc: "누적 100문제 풀이" },
];

// 주간 미션 (월요일 시작 주 단위, 달성 시 1회 보너스)
const MISSIONS = [
  { id: "m_days", name: "이번 주 5일 학습 완료", target: 5, points: 50, prog: () => completedDaysThisWeek() },
  { id: "m_correct", name: "이번 주 정답 20개 모으기", target: 20, points: 40, prog: () => correctThisWeek() },
  { id: "m_conquer", name: "이번 주 오답 5개 정복", target: 5, points: 30, prog: () => conqueredThisWeek() },
];

// 오늘의 어휘 사전 (오늘 푼 문항의 지문에 등장한 단어만 노출)
const VOCAB = [
  ["attic", "다락방"], ["treasure", "보물"], ["backpack", "배낭"], ["nervous", "긴장한"],
  ["worried", "걱정하는"], ["excited", "신이 난"], ["coach", "코치, 감독"], ["prize", "상"],
  ["contest", "대회"], ["borrow", "빌리다"], ["reopen", "다시 열다"], ["instead", "대신에"],
  ["notice", "공지문"], ["field trip", "현장 학습"], ["arrive", "도착하다"], ["sharp", "(시각 뒤에서) 정각"],
  ["gift card", "상품권"], ["bookmark", "책갈피"], ["theme", "주제"], ["sandcastle", "모래성"],
  ["seashell", "조개껍데기"], ["parade", "퍼레이드, 행진"], ["campfire", "모닥불"], ["picnic", "소풍"],
  ["climb", "오르다"], ["pouch", "(캥거루의) 주머니"], ["joey", "새끼 캥거루"], ["trunk", "코끼리 코"],
  ["flap", "펄럭이다, 파닥이다"], ["hump", "(낙타의) 혹"], ["eyelash", "속눈썹"], ["echo", "메아리"],
  ["upside down", "거꾸로"], ["squeeze", "비집고 들어가다"], ["sticky", "끈적한"], ["tongue", "혀"],
  ["seal", "바다표범"], ["danger", "위험"], ["enemy", "적"], ["hide", "숨다"],
  ["blink", "깜박이다"], ["breathe", "숨을 쉬다"], ["encourage", "격려하다"], ["relay race", "이어달리기"],
  ["baton", "배턴"], ["fold", "접다"], ["spread", "펴 바르다"], ["stir", "휘젓다"],
  ["soil", "흙"], ["seed", "씨앗"], ["ribbon", "리본"], ["take turns", "번갈아 하다"],
  ["look after", "돌보다"], ["belong to", "~의 것이다"], ["depend on", "~에 달려 있다"], ["chore", "집안일"],
  ["helmet", "헬멧"], ["uniform", "교복, 유니폼"], ["aquarium", "수족관"], ["experiment", "실험"],
  ["wing", "날개"], ["insect", "곤충"], ["mammal", "포유류"], ["nectar", "(꽃의) 꿀"],
  ["hive", "벌집"], ["volcano", "화산"], ["fence", "울타리"], ["stroke", "(수영) 팔 젓기"],
  // 아래는 LFM(문법·어휘) 문항에도 걸리도록 추가한 단어. LFM 빈칸은 조사/전치사 자리라
  // 빈칸 앞뒤 단어(형용사·동사·명사)는 그대로 남아 있어 매칭된다.
  ["someday", "언젠가"], ["decided", "결심했다 (decide: 결심하다)"], ["agreed", "동의했다 (agree: 동의하다)"],
  ["promised", "약속했다 (promise: 약속하다)"], ["advised", "조언했다 (advise: 조언하다)"], ["invented", "발명했다 (invent: 발명하다)"],
  ["scientist", "과학자"], ["island", "섬"], ["ocean", "바다"], ["environment", "환경"], ["choir", "합창단"],
  ["afraid", "무서워하는"], ["famous", "유명한"], ["proud", "자랑스러운"], ["tired", "피곤한, 싫증난"],
  ["different", "다른"], ["honest", "정직한"], ["polite", "예의 바른, 공손한"], ["careful", "조심스러운"],
  ["difficult", "어려운"], ["beautiful", "아름다운"], ["exciting", "신나는"], ["delicious", "맛있는"],
  ["popular", "인기 있는"], ["freezing", "몹시 추운"],
];

// 통계·리포트용 태그 한글 이름
const TAG_KO = {
  "tense": "시제", "past-perfect": "과거완료", "past-progressive": "과거진행", "present-perfect": "현재완료",
  "preposition": "전치사", "collocation": "짝꿍 표현", "gerund": "동명사", "infinitive": "to부정사",
  "verb-pattern": "동사 활용", "conditional": "조건문", "comparative": "비교급", "superlative": "최상급",
  "as-as": "원급 비교", "quantifier": "수량 표현", "uncountable": "셀 수 없는 명사", "countable": "셀 수 있는 명사",
  "modal": "조동사", "obligation": "의무 표현", "necessity": "필요 표현", "passive": "수동태",
  "pronoun": "대명사", "possessive": "소유격", "reflexive": "재귀대명사", "object": "목적격",
  "relative-clause": "관계대명사", "adverb": "부사", "word-form": "품사 구별", "so-that": "so~that 구문",
  "conjunction": "접속사", "contrast": "대조 표현", "article": "관사", "subject-verb-agreement": "수 일치",
  "question-word": "의문사", "idiom": "관용 표현", "vocabulary": "어휘", "detail": "세부 정보 찾기",
  "inference": "추론", "main-idea": "주제 찾기", "purpose": "목적 찾기", "cause-effect": "원인과 결과",
  "sequence": "순서 파악", "feeling": "감정 파악", "dialogue": "대화문", "story": "이야기 글",
  "notice": "공지문", "letter": "편지 글", "nonfiction": "설명문", "how-to": "방법 설명 글", "reading": "독해",
};

const DEFAULT_RULES = {
  solve: 5,      // 문제 1개 제출(시도 보상)
  correct: 5,    // 첫 정답 보너스
  daily: 30,     // 하루치 완료 보너스
  streak3: 10,   // 3일 단위 연속 보너스
  streak7: 30,   // 7일 단위 연속 보너스
  review: 3,     // 오답 복습 정복 1문제당
};

const DEFAULT_REWARDS = [
  { id: "rw_game30",  name: "게임 30분",          cost: 300, active: true },
  { id: "rw_snack",   name: "좋아하는 간식",      cost: 150, active: true },
  { id: "rw_outing",  name: "주말 외출 선택권",   cost: 800, active: true },
];

// ---------------- 상태 ----------------
let S = null;          // 전역 상태 (localStorage 동기화)
let view = { name: "home" };   // 현재 화면
let quiz = null;       // 진행 중 퀴즈 세션(메모리): {mode, qids, idx, phase, selected, results[]}
let parentUnlocked = false;    // 부모님 공간 잠금 해제 (세션 한정)

function nowISO() { return new Date().toISOString(); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function todayKey(d) {
  const t = d || new Date();
  return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
}
function addDays(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(y, m - 1, d + n);
  return todayKey(t);
}

function defaultState() {
  return {
    version: 1,
    profile: null, // {name, dailyGoal, createdAt}
    attempts: [],  // {id, questionId, selected, isCorrect, date, mode}
    dailySets: {}, // dateKey -> {questionIds, index, answers[], completed, perfect}
    streak: { current: 0, longest: 0, lastActiveDate: null },
    points: { balance: 0, total: 0 },
    pointLog: [],  // {id, delta, reason, date}
    badges: [],    // {id, earnedAt}
    rewards: DEFAULT_REWARDS.map(r => ({ ...r })),
    redemptions: [], // {id, rewardId, name, cost, status, requestedAt, decidedAt}
    settings: { rules: { ...DEFAULT_RULES }, parentPin: null },
    // conquered: 정복한 날짜(구버전은 true), recheck: 간격 반복 재출제 예정일
    meta: { firstCorrect: {}, wrongCount: {}, conquered: {}, recheck: {} },
    missions: {}, // 주차키 -> {미션id: true}
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      S = Object.assign(defaultState(), JSON.parse(raw));
      S.settings.rules = Object.assign({ ...DEFAULT_RULES }, S.settings.rules || {});
      if (!S.meta) S.meta = { firstCorrect: {}, wrongCount: {}, conquered: {}, recheck: {} };
      if (!S.meta.recheck) S.meta.recheck = {};
      if (!S.missions) S.missions = {};
    } else {
      S = defaultState();
    }
  } catch (e) {
    console.error("state load failed", e);
    S = defaultState();
  }
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }

// ---------------- 문항 은행 ----------------
function questionBank() {
  const bundled = Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK : [];
  let custom = [];
  try { custom = JSON.parse(localStorage.getItem(BANK_KEY) || "[]"); } catch (e) { custom = []; }
  const map = new Map();
  bundled.concat(custom).forEach(q => { if (q && q.id) map.set(q.id, q); });
  return [...map.values()];
}
function getQ(id) { return questionBank().find(q => q.id === id); }

// ---------------- 포인트 / 레벨 / 배지 ----------------
function addPoints(delta, reason, opts) {
  if (!delta) return;
  S.points.balance += delta;
  if (delta > 0) S.points.total += delta;
  if (S.points.balance < 0) S.points.balance = 0;
  S.pointLog.unshift({ id: uid(), delta, reason, date: nowISO() });
  if (S.pointLog.length > 500) S.pointLog.length = 500;
  if (delta > 0 && !(opts && opts.silent)) toast(`+${delta}P ${reason}`, "coin");
  checkBadges();
}

function levelInfo(total) {
  let cur = LEVELS[0], next = null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (total >= LEVELS[i].min) { cur = LEVELS[i]; next = LEVELS[i + 1] || null; }
  }
  const pct = next ? Math.min(100, Math.round((total - cur.min) / (next.min - cur.min) * 100)) : 100;
  return { ...cur, next, pct };
}

function hasBadge(id) { return S.badges.some(b => b.id === id); }
function earnBadge(id) {
  if (hasBadge(id)) return;
  const def = BADGES.find(b => b.id === id);
  if (!def) return;
  S.badges.push({ id, earnedAt: nowISO() });
  toast(`${def.icon} 배지 획득! [${def.name}]`);
  burstConfetti();
}
function conqueredCount() { return Object.keys(S.meta.conquered).length; }
function checkBadges() {
  const done = Object.values(S.dailySets).some(s => s.completed);
  if (done) earnBadge("first_done");
  if (S.streak.current >= 3) earnBadge("streak_3");
  if (S.streak.current >= 7) earnBadge("streak_7");
  if (S.streak.current >= 30) earnBadge("streak_30");
  if (S.streak.current >= 100) earnBadge("streak_100");
  if (Object.values(S.dailySets).some(s => s.completed && s.perfect)) earnBadge("perfect_day");
  if (conqueredCount() >= 10) earnBadge("review_10");
  if (S.points.total >= 1000) earnBadge("points_1000");
  if (S.attempts.length >= 100) earnBadge("solve_100");
}

// ---------------- 스트릭 ----------------
function displayedStreak() {
  const last = S.streak.lastActiveDate;
  if (!last) return 0;
  const today = todayKey();
  if (last === today || last === addDays(today, -1)) return S.streak.current;
  return 0;
}
function bumpStreak() {
  const today = todayKey();
  if (S.streak.lastActiveDate === today) return; // 오늘 이미 반영
  if (S.streak.lastActiveDate === addDays(today, -1)) S.streak.current += 1;
  else S.streak.current = 1;
  S.streak.lastActiveDate = today;
  if (S.streak.current > S.streak.longest) S.streak.longest = S.streak.current;
  // 연속 보너스: 7일 단위 우선, 아니면 3일 단위
  const r = S.settings.rules, c = S.streak.current;
  if (c > 1) {
    if (c % 7 === 0) addPoints(r.streak7, `${c}일 연속 보너스`);
    else if (c % 3 === 0) addPoints(r.streak3, `${c}일 연속 보너스`);
  }
  checkBadges();
}

// ---------------- 주간 미션 ----------------
function weekStartKey() { // 이번 주 월요일
  const t = new Date();
  const day = (t.getDay() + 6) % 7; // 월=0 … 일=6
  return todayKey(new Date(t.getFullYear(), t.getMonth(), t.getDate() - day));
}
function attemptsBetween(a, b) {
  return S.attempts.filter(x => { const d = x.date.slice(0, 10); return d >= a && d <= b; });
}
function completedDaysThisWeek() {
  const ws = weekStartKey();
  let n = 0;
  for (let i = 0; i < 7; i++) { const s = S.dailySets[addDays(ws, i)]; if (s && s.completed) n++; }
  return n;
}
function correctThisWeek() {
  const ws = weekStartKey();
  return attemptsBetween(ws, addDays(ws, 6)).filter(a => a.isCorrect).length;
}
function conqueredThisWeek() {
  const ws = weekStartKey(), we = addDays(ws, 6);
  return Object.values(S.meta.conquered).filter(v => typeof v === "string" && v >= ws && v <= we).length;
}
function checkMissions() {
  const wk = weekStartKey();
  if (!S.missions[wk]) S.missions[wk] = {};
  for (const m of MISSIONS) {
    if (!S.missions[wk][m.id] && m.prog() >= m.target) {
      S.missions[wk][m.id] = true;
      addPoints(m.points, `주간 미션 완료: ${m.name}`);
      burstConfetti();
    }
  }
}

// ---------------- 데일리 세트 구성 ----------------
// 규칙: 간격 반복(정복 후 3일 뒤 재확인, 하루 1문제) → 안 푼 문제 → 오답(미정복) → 랜덤 보충
function pickForTrack(track, n) {
  const bank = questionBank().filter(q => q.track === track);
  const attemptedIds = new Set(S.attempts.map(a => a.questionId));
  const today = todayKey();
  const due = shuffle(bank.filter(q => S.meta.recheck[q.id] && S.meta.recheck[q.id] <= today)).slice(0, 1);
  const unseen = shuffle(bank.filter(q => !attemptedIds.has(q.id)));
  const wrong = shuffle(bank.filter(q => attemptedIds.has(q.id) && S.meta.wrongCount[q.id] > 0 && !S.meta.conquered[q.id]));
  const usedIds = new Set(due.concat(unseen, wrong).map(q => q.id));
  const rest = shuffle(bank.filter(q => !usedIds.has(q.id)));
  return due.concat(unseen, wrong, rest).slice(0, n).map(q => q.id);
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// 하루 목표 문제 수 → [어드벤처, LFM] 문항 수. 8문제는 어드벤처 3 + LFM 5로 고정 배분.
function trackSplit(goal) {
  if (goal === 8) return [3, 5];
  const half = Math.max(1, Math.round(goal / 2));
  return [half, half];
}

function ensureDailySet() {
  const key = todayKey();
  const existing = S.dailySets[key];
  if (existing) {
    // 문항 파일이 바뀌어 세트의 문항이 사라진 경우(미완료 세트만) 재구성
    if (!existing.completed && existing.questionIds.some(id => !getQ(id))) {
      delete S.dailySets[key];
    } else {
      return existing;
    }
  }
  const goal = (S.profile && S.profile.dailyGoal) || 6;
  const [advN, lfmN] = trackSplit(goal);
  const ids = pickForTrack("adventure", advN).concat(pickForTrack("lfm", lfmN));
  S.dailySets[key] = { questionIds: ids, index: 0, answers: [], completed: false, perfect: false };
  save();
  return S.dailySets[key];
}

// ---------------- 오답노트 ----------------
function wrongList() {
  return Object.keys(S.meta.wrongCount)
    .filter(id => S.meta.wrongCount[id] > 0 && !S.meta.conquered[id] && getQ(id))
    .map(id => ({ q: getQ(id), count: S.meta.wrongCount[id] }));
}

// ---------------- 통계 ----------------
function accuracy(track, days) {
  let list = S.attempts;
  if (track) list = list.filter(a => { const q = getQ(a.questionId); return q && q.track === track; });
  if (days) {
    const from = addDays(todayKey(), -(days - 1));
    list = list.filter(a => a.date.slice(0, 10) >= from);
  }
  if (!list.length) return null;
  return Math.round(list.filter(a => a.isCorrect).length / list.length * 100);
}

// ============================================================
//  렌더링
// ============================================================
const $app = () => document.getElementById("app");

function go(name, params) {
  view = Object.assign({ name }, params || {});
  render();
  window.scrollTo(0, 0);
}

function render() {
  const el = $app();
  if (!S.profile) { el.className = "no-nav"; el.innerHTML = viewOnboarding(); return; }
  const inQuiz = view.name === "quiz" || view.name === "result";
  el.className = inQuiz ? "no-nav" : "";
  let html = "";
  switch (view.name) {
    case "home":    html = viewHome(); break;
    case "quiz":    html = viewQuiz(); break;
    case "result":  html = viewResult(); break;
    case "review":  html = viewReview(); break;
    case "stats":   html = viewStats(); break;
    case "rewards": html = viewRewards(); break;
    case "parent":  html = parentUnlocked ? viewParent() : viewPinGate(); break;
    case "settings":html = viewSettings(); break;
    default:        html = viewHome();
  }
  el.innerHTML = html + (inQuiz ? "" : navHTML());
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function navHTML() {
  const items = [
    { v: "home", ico: "🏠", label: "홈" },
    { v: "review", ico: "📕", label: "오답노트" },
    { v: "stats", ico: "📊", label: "통계" },
    { v: "rewards", ico: "🎁", label: "보상" },
    { v: "settings", ico: "⚙️", label: "설정" },
  ];
  return `<nav class="bottom">` + items.map(i =>
    `<button class="${view.name === i.v ? "active" : ""}" onclick="go('${i.v}')"><span class="ico">${i.ico}</span>${i.label}</button>`
  ).join("") + `</nav>`;
}

function headerChips() {
  const lv = levelInfo(S.points.total);
  return `<div class="chips">
    <span class="chip">🪙 ${S.points.balance.toLocaleString()}P</span>
    <span class="chip">${lv.icon} ${lv.title}</span>
    <span class="chip">🔥 ${displayedStreak()}일</span>
  </div>`;
}

// ---------------- 온보딩 ----------------
function viewOnboarding() {
  return `
  <div class="center" style="padding-top:9vh">
    <div style="font-size:3.4rem">🗺️</div>
    <h1 class="mt12">Jr. TOEFL Daily</h1>
    <p class="sub mt8">매일 조금씩, 꾸준히!<br>주니어토플 데일리 연습</p>
  </div>
  <div class="card mt24">
    <div class="field">
      <label>이름 (별명도 좋아요)</label>
      <input id="ob-name" placeholder="예: 민준" maxlength="12">
    </div>
    <div class="field">
      <label>하루 목표 문제 수</label>
      <select id="ob-goal">
        <option value="4">4문제 (어드벤처 2 + 문법·어휘 2)</option>
        <option value="6" selected>6문제 (어드벤처 3 + 문법·어휘 3) — 추천</option>
        <option value="8">8문제 (어드벤처 3 + 문법·어휘 5)</option>
      </select>
    </div>
    <button class="btn primary mt16" onclick="finishOnboarding()">시작하기 🚀</button>
    <p class="sub small mt12 center">모든 기록은 이 기기에만 저장돼요.</p>
  </div>
  <p class="sub small mt16 center">
    <a class="link-btn" style="font-size:.8rem" href="privacy.html">개인정보처리방침</a>
    &nbsp;·&nbsp;
    <a class="link-btn" style="font-size:.8rem" href="contact.html">문의하기</a>
  </p>`;
}
function finishOnboarding() {
  const name = document.getElementById("ob-name").value.trim() || "학생";
  const goal = parseInt(document.getElementById("ob-goal").value, 10) || 6;
  S.profile = { name, dailyGoal: goal, createdAt: nowISO() };
  save();
  go("home");
  toast(`환영해요, ${name}! 🎉`);
}

// ---------------- 홈 ----------------
function viewHome() {
  const set = ensureDailySet();
  const total = set.questionIds.length;
  const done = set.answers.length;
  const pct = total ? Math.round(done / total * 100) : 0;
  const wrongs = wrongList().length;
  const lv = levelInfo(S.points.total);

  let cta;
  if (set.completed) {
    cta = `<div class="row" style="gap:6px;margin-top:14px">
      <div class="grow center" style="background:rgba(255,255,255,.18);border-radius:12px;padding:12px;font-weight:800">✅ 오늘 학습 완료!</div>
    </div>
    ${wrongs ? `<button class="btn" onclick="go('review')">📕 오답 ${wrongs}개 복습하기</button>` : ""}`;
  } else if (done > 0) {
    cta = `<button class="btn" onclick="startDaily()">이어서 풀기 (${done}/${total}) ▶</button>`;
  } else {
    cta = `<button class="btn" onclick="startDaily()">오늘의 학습 시작! ▶</button>`;
  }

  return `
  <div class="topbar">
    <div><h1>안녕, ${esc(S.profile.name)} 👋</h1><span class="sub">${todayKey()}</span></div>
  </div>
  ${headerChips()}
  <div class="hero mt16">
    <div class="row between">
      <span style="font-weight:700;opacity:.9">오늘의 학습</span>
      <span style="font-weight:800">${done}/${total}</span>
    </div>
    <div class="big mt8">${set.completed ? "완벽해요! 🌈" : done > 0 ? "조금만 더! 💪" : "6분이면 충분해요 ⏱️"}</div>
    <div class="progress-track mt12"><div class="progress-fill" style="width:${pct}%"></div></div>
    ${cta}
  </div>
  <div class="stat-grid mt16">
    <div class="stat-tile"><div class="v">🔥 ${displayedStreak()}</div><div class="k">연속 학습일</div></div>
    <div class="stat-tile"><div class="v">🪙 ${S.points.total.toLocaleString()}</div><div class="k">누적 포인트</div></div>
    <div class="stat-tile"><div class="v">📕 ${wrongs}</div><div class="k">오답 대기</div></div>
  </div>
  <div class="card mt16">
    <h3>🎯 주간 미션</h3>
    ${missionRowsHTML()}
  </div>
  <div class="card mt16">
    <div class="row between">
      <h3>${lv.icon} ${lv.title} 레벨</h3>
      <span class="sub small">${lv.next ? `다음 레벨까지 ${(lv.next.min - S.points.total).toLocaleString()}P` : "최고 레벨!"}</span>
    </div>
    <div class="progress-track mt8"><div class="progress-fill gold" style="width:${lv.pct}%"></div></div>
  </div>`;
}

function missionRowsHTML() {
  const wk = weekStartKey();
  const got = S.missions[wk] || {};
  return MISSIONS.map(m => {
    const p = Math.min(m.prog(), m.target);
    const done = !!got[m.id];
    return `<div class="mt8">
      <div class="row between">
        <span class="small" style="font-weight:600">${m.name}</span>
        <span class="small" style="font-weight:800;color:${done ? "var(--green)" : "var(--sub)"}">${done ? `✅ +${m.points}P` : `${p}/${m.target}`}</span>
      </div>
      <div class="progress-track mt8" style="height:7px"><div class="progress-fill${done ? " gold" : ""}" style="width:${Math.round(p / m.target * 100)}%"></div></div>
    </div>`;
  }).join("");
}

// ---------------- 퀴즈 ----------------
function startDaily() {
  const set = ensureDailySet();
  if (set.completed) { toast("오늘 학습은 이미 완료했어요! 🎉"); return; }
  quiz = {
    mode: "daily",
    qids: set.questionIds,
    idx: set.answers.length,
    phase: "answer", selected: null,
    results: set.answers.slice(),
  };
  // 마지막 문제까지 답하고 결과 직전에 나갔던 경우 → 바로 완료 처리
  if (quiz.idx >= quiz.qids.length) { finishQuiz(); return; }
  go("quiz");
}

function startReview(ids) {
  ids = (ids || []).filter(id => getQ(id));
  if (!ids.length) { toast("복습할 오답이 없어요!"); return; }
  quiz = { mode: "review", qids: shuffle(ids), idx: 0, phase: "answer", selected: null, results: [] };
  go("quiz");
}

function viewQuiz() {
  if (!quiz) return fallbackHome();
  const q = getQ(quiz.qids[quiz.idx]);
  if (!q) return fallbackHome();
  const total = quiz.qids.length;
  const num = quiz.idx + 1;
  const isGraded = quiz.phase === "graded";
  const trackName = q.track === "adventure" ? "🏝️ 어드벤처" : "✏️ 문법·어휘";
  const letters = ["A", "B", "C", "D"];

  const choices = q.choices.map((c, i) => {
    let cls = "choice";
    if (!isGraded && quiz.selected === i) cls += " selected";
    if (isGraded) {
      if (i === q.answer) cls += " correct";
      else if (i === quiz.selected) cls += " wrong";
    }
    return `<button class="${cls}" ${isGraded ? "disabled" : ""} onclick="selectChoice(${i})">
      <span class="letter">${letters[i]}</span><span>${esc(c)}</span>
    </button>`;
  }).join("");

  let gradeHTML = "";
  if (isGraded) {
    const ok = quiz.selected === q.answer;
    gradeHTML = `
      <div class="grade-banner ${ok ? "ok" : "no"} mt16">${ok ? "🎉 정답이에요!" : "😅 아쉬워요! 정답은 " + letters[q.answer]}</div>
      <div class="explain"><b>💡 해설</b>${esc(q.explanation)}</div>
      <button class="btn primary mt16" onclick="nextQuestion()">${num >= total ? "결과 보기 🏁" : "다음 문제 ▶"}</button>`;
  } else {
    gradeHTML = `<button class="btn primary mt16" ${quiz.selected == null ? "disabled" : ""} onclick="gradeCurrent()">확인</button>`;
  }

  return `
  <div class="row between">
    <button class="back-btn" onclick="quitQuiz()">✕</button>
    <span class="sub" style="font-weight:700">${quiz.mode === "review" ? "오답 복습" : "오늘의 학습"} · ${num}/${total}</span>
    <span style="width:34px"></span>
  </div>
  <div class="progress-track mt8"><div class="progress-fill" style="width:${Math.round((num - (isGraded ? 0 : 1)) / total * 100)}%"></div></div>
  <div class="card mt16">
    <span class="track-tag ${q.track}">${trackName}</span>
    ${q.passage ? `<div class="passage">${esc(q.passage)}</div>` : ""}
    <div class="stem">${esc(q.stem)}</div>
    <div class="choices">${choices}</div>
    ${gradeHTML}
  </div>`;
}

function selectChoice(i) {
  if (!quiz || quiz.phase !== "answer") return;
  quiz.selected = i;
  render();
}

function gradeCurrent() {
  if (!quiz || quiz.selected == null || quiz.phase !== "answer") return;
  const q = getQ(quiz.qids[quiz.idx]);
  const ok = quiz.selected === q.answer;
  const r = S.settings.rules;

  S.attempts.push({ id: uid(), questionId: q.id, selected: quiz.selected, isCorrect: ok, date: nowISO(), mode: quiz.mode });
  quiz.results.push({ qid: q.id, selected: quiz.selected, isCorrect: ok });

  if (quiz.mode === "daily") {
    const set = S.dailySets[todayKey()];
    if (set) {
      set.answers.push({ qid: q.id, selected: quiz.selected, isCorrect: ok });
      set.index = set.answers.length;
    }
    let earned = r.solve;
    addPoints(r.solve, "문제 풀이", { silent: true });
    quiz.sessionSolve = (quiz.sessionSolve || 0) + 1;
    if (ok && !S.meta.firstCorrect[q.id]) {
      S.meta.firstCorrect[q.id] = true;
      addPoints(r.correct, "첫 정답 보너스", { silent: true });
      earned += r.correct;
      quiz.sessionBonus = (quiz.sessionBonus || 0) + 1;
    }
    toast(`+${earned}P ${ok ? "획득!" : "(도전 보상)"} 🪙`, "coin");
    // 간격 반복 재확인 문항: 이번 답으로 재확인 완료 (틀리면 아래에서 오답노트로 복귀)
    if (S.meta.recheck[q.id]) delete S.meta.recheck[q.id];
  } else { // review
    if (ok) {
      S.meta.conquered[q.id] = todayKey();
      S.meta.recheck[q.id] = addDays(todayKey(), 3); // 3일 뒤 데일리 세트에서 재확인
      addPoints(r.review, "오답 정복");
    }
  }

  if (!ok) {
    S.meta.wrongCount[q.id] = (S.meta.wrongCount[q.id] || 0) + 1;
    delete S.meta.conquered[q.id]; // 다시 틀리면 오답노트로 복귀
    delete S.meta.recheck[q.id];
  }

  quiz.phase = "graded";
  checkBadges();
  checkMissions();
  save();
  render();
}

function nextQuestion() {
  if (!quiz) return;
  quiz.idx += 1;
  quiz.phase = "answer";
  quiz.selected = null;
  if (quiz.idx >= quiz.qids.length) { finishQuiz(); return; }
  save();
  render();
  window.scrollTo(0, 0);
}

function finishQuiz() {
  const r = S.settings.rules;
  if (quiz.mode === "daily") {
    const set = S.dailySets[todayKey()];
    if (set && !set.completed) {
      set.completed = true;
      set.perfect = set.answers.length > 0 && set.answers.every(a => a.isCorrect);
      addPoints(r.daily, "오늘 학습 완료");
      bumpStreak();
      burstConfetti();
    }
  }
  checkBadges();
  checkMissions();
  save();
  go("result");
}

function quitQuiz() {
  // daily 진행 상황은 이미 저장됨(문항 단위) — 그냥 나가기
  quiz = null;
  go("home");
}

// ---------------- 결과 ----------------
function fallbackHome() {
  return `<div class="card mt24 center" style="padding:32px">
    <p style="font-weight:700">화면을 불러올 수 없어요.</p>
    <button class="btn primary mt12" onclick="quiz=null;go('home')">홈으로</button>
  </div>`;
}

function viewResult() {
  if (!quiz) return fallbackHome();
  const total = quiz.results.length;
  const correct = quiz.results.filter(x => x.isCorrect).length;
  const wrong = total - correct;
  const r = S.settings.rules;
  const isDaily = quiz.mode === "daily";

  let lines = "";
  if (isDaily) {
    const solved = quiz.sessionSolve || 0;
    const bonus = quiz.sessionBonus || 0;
    lines = `
      <div class="point-line"><span>문제 풀이 ×${solved}</span><span class="p">+${r.solve * solved}P</span></div>
      ${bonus ? `<div class="point-line"><span>첫 정답 보너스 ×${bonus}</span><span class="p">+${r.correct * bonus}P</span></div>` : ""}
      <div class="point-line"><span>오늘 학습 완료</span><span class="p">+${r.daily}P</span></div>`;
  } else {
    lines = `<div class="point-line"><span>오답 정복 ×${correct}</span><span class="p">+${r.review * correct}P</span></div>`;
  }

  return `
  <div class="center" style="padding-top:5vh">
    <div style="font-size:3.2rem">${correct === total ? "🏆" : correct >= total / 2 ? "🎉" : "💪"}</div>
    <h1 class="mt8">${isDaily ? "오늘 학습 완료!" : "복습 완료!"}</h1>
    <div class="result-score mt8">${correct}<span class="sub" style="font-size:1.2rem"> / ${total}</span></div>
    ${isDaily ? `<p class="sub mt8">🔥 연속 학습 ${displayedStreak()}일째!</p>` : ""}
  </div>
  <div class="card mt16">
    <h3>🪙 획득 포인트</h3>
    <div class="mt8">${lines}</div>
  </div>
  ${vocabCardHTML()}
  ${wrong ? `<button class="btn ghost mt16" onclick="go('review')">📕 틀린 문제 ${wrong}개 확인하기</button>` : ""}
  <button class="btn primary mt12" onclick="quiz=null;go('home')">홈으로</button>`;
}

// 오늘 푼 문항 텍스트에 등장한 어휘만 골라 보여 준다
function todaysVocab() {
  if (!quiz) return [];
  const text = quiz.qids.map(id => {
    const q = getQ(id);
    return q ? [q.passage || "", q.stem, (q.choices || []).join(" ")].join(" ") : "";
  }).join(" ");
  const found = [];
  for (const [w, k] of VOCAB) {
    const re = new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "e?s?\\b", "i");
    if (re.test(text)) found.push({ w, k });
  }
  return shuffle(found).slice(0, 5);
}
function vocabCardHTML() {
  const words = todaysVocab();
  if (!words.length) return "";
  return `<div class="card mt16">
    <h3>📖 오늘의 어휘</h3>
    <div class="mt8">${words.map(v => `<div class="point-line"><span><b>${esc(v.w)}</b></span><span class="sub">${esc(v.k)}</span></div>`).join("")}</div>
  </div>`;
}

// ---------------- 오답노트 ----------------
function viewReview() {
  const list = wrongList();
  const focus = list.filter(x => x.count >= 3);
  const items = list.map(x => `
    <div class="list-item">
      <span class="track-tag ${x.q.track}">${x.q.track === "adventure" ? "🏝️" : "✏️"}</span>
      <div class="grow">
        <div style="font-size:.9rem;font-weight:600">${esc(truncate(x.q.stem, 46))}</div>
        ${x.count >= 3 ? `<span class="small" style="color:var(--red);font-weight:700">🚨 집중 복습</span>` : ""}
      </div>
      <span class="pill-num">${x.count}회</span>
    </div>`).join("");

  return `
  <h1>📕 오답노트</h1>
  <p class="sub mt8">틀린 문제를 다시 풀어 정복하면 +${S.settings.rules.review}P!</p>
  ${list.length ? `
    <button class="btn primary mt16" onclick="startReview(${esc(JSON.stringify(list.map(x => x.q.id)))})">전체 다시 풀기 (${list.length}문제) ▶</button>
    ${focus.length ? `<button class="btn warn mt8" onclick="startReview(${esc(JSON.stringify(focus.map(x => x.q.id)))})">🚨 집중 복습만 (${focus.length}문제)</button>` : ""}
    <div class="mt16">${items}</div>` :
    `<div class="card mt16 center" style="padding:36px 16px">
      <div style="font-size:2.6rem">🎊</div>
      <p class="mt8" style="font-weight:700">오답이 하나도 없어요!</p>
      <p class="sub small mt8">지금까지 정복한 오답: ${conqueredCount()}개</p>
    </div>`}
  ${conqueredCount() && list.length ? `<p class="sub small mt12 center">지금까지 정복한 오답: ${conqueredCount()}개 🛡️</p>` : ""}`;
}
function truncate(s, n) { return s.length > n ? s.slice(0, n) + "…" : s; }

// ---------------- 통계 ----------------
function viewStats() {
  const days = [];
  const today = todayKey();
  for (let i = 13; i >= 0; i--) days.push(addDays(today, -i));
  const cal = days.map(d => {
    const set = S.dailySets[d];
    let cls = "cal-cell";
    if (set && set.completed) cls += " done";
    else if (set && set.answers.length) cls += " partial";
    if (d === today) cls += " today";
    return `<div class="${cls}" title="${d}">${parseInt(d.slice(8), 10)}</div>`;
  }).join("");

  const rows = [
    ["🏝️ 어드벤처", accuracy("adventure"), accuracy("adventure", 7)],
    ["✏️ 문법·어휘", accuracy("lfm"), accuracy("lfm", 7)],
    ["📚 전체", accuracy(null), accuracy(null, 7)],
  ].map(([name, all, wk]) => `
    <div class="point-line">
      <span>${name}</span>
      <span><b>${all == null ? "-" : all + "%"}</b> <span class="sub small">(최근7일 ${wk == null ? "-" : wk + "%"})</span></span>
    </div>`).join("");

  const learnedDays = Object.values(S.dailySets).filter(s => s.completed).length;

  return `
  <h1>📊 통계</h1>
  <p class="sub mt8">부모님도 이 화면에서 진행 상황을 확인할 수 있어요.</p>
  <div class="stat-grid mt16">
    <div class="stat-tile"><div class="v">${S.attempts.length}</div><div class="k">누적 풀이</div></div>
    <div class="stat-tile"><div class="v">${learnedDays}</div><div class="k">완료한 날</div></div>
    <div class="stat-tile"><div class="v">${S.streak.longest}</div><div class="k">최장 연속</div></div>
  </div>
  <div class="card mt16">
    <h3>정답률</h3>
    <div class="mt8">${rows}</div>
  </div>
  <div class="card mt16">
    <h3>최근 14일</h3>
    <div class="cal-grid mt12">${cal}</div>
    <p class="sub small mt8">🟩 완료 · 연한 초록 = 일부 진행</p>
  </div>`;
}

// ---------------- 보상 ----------------
function viewRewards() {
  const tab = view.tab || "shop";
  const lv = levelInfo(S.points.total);

  let body = "";
  if (tab === "shop") {
    const active = S.rewards.filter(r => r.active);
    const pending = S.redemptions.filter(r => r.status === "pending");
    body = `
      ${pending.length ? `<div class="card mt12" style="background:var(--accent-soft)">
        <b>⏳ 승인 대기 중</b>
        ${pending.map(p => `<div class="point-line"><span>${esc(p.name)}</span><span>${p.cost}P</span></div>`).join("")}
        <p class="sub small mt8">부모님이 [설정 > 부모님 공간]에서 승인해 주세요.</p>
      </div>` : ""}
      <div class="mt12">
      ${active.length ? active.map(r => `
        <div class="list-item">
          <div class="grow">
            <div style="font-weight:700">${esc(r.name)}</div>
            <div class="sub small">🪙 ${r.cost.toLocaleString()}P</div>
          </div>
          <button class="btn primary small-btn" ${S.points.balance < r.cost ? "disabled" : ""} onclick="requestRedeem('${r.id}')">교환 신청</button>
        </div>`).join("") :
        `<div class="card center" style="padding:28px"><p class="sub">등록된 보상이 없어요.<br>부모님 공간에서 보상을 추가해 주세요!</p></div>`}
      </div>`;
  } else if (tab === "badges") {
    body = `<div class="badge-grid mt12">` + BADGES.map(b => {
      const owned = hasBadge(b.id);
      return `<div class="badge-cell ${owned ? "" : "locked"}" title="${esc(b.desc)}">
        <div class="ico">${b.icon}</div><div class="nm">${b.name}</div>
      </div>`;
    }).join("") + `</div>`;
  } else { // history
    const logs = S.pointLog.slice(0, 40).map(l => `
      <div class="point-line">
        <span>${esc(l.reason)}<br><span class="sub small">${l.date.slice(0, 10)}</span></span>
        <span class="p" style="color:${l.delta >= 0 ? "var(--green)" : "var(--red)"}">${l.delta >= 0 ? "+" : ""}${l.delta}P</span>
      </div>`).join("");
    const redeems = S.redemptions.slice().reverse().slice(0, 20).map(r => `
      <div class="point-line">
        <span>${esc(r.name)}<br><span class="sub small">${r.requestedAt.slice(0, 10)}</span></span>
        <span style="font-weight:700">${r.status === "pending" ? "⏳ 대기" : r.status === "approved" ? "✅ 승인" : "❌ 거절"}</span>
      </div>`).join("");
    body = `
      <div class="card mt12"><h3>교환 내역</h3><div class="mt8">${redeems || '<p class="sub small">아직 없어요.</p>'}</div></div>
      <div class="card mt12"><h3>포인트 내역</h3><div class="mt8">${logs || '<p class="sub small">아직 없어요.</p>'}</div></div>`;
  }

  return `
  <h1>🎁 보상</h1>
  ${headerChips()}
  <div class="card mt12">
    <div class="row between">
      <h3>${lv.icon} ${lv.title}</h3>
      <span class="sub small">${lv.next ? `다음: ${lv.next.icon} ${lv.next.title} (${lv.next.min.toLocaleString()}P)` : "최고 레벨!"}</span>
    </div>
    <div class="progress-track mt8"><div class="progress-fill gold" style="width:${lv.pct}%"></div></div>
    <p class="sub small mt8">누적 ${S.points.total.toLocaleString()}P · 사용 가능 ${S.points.balance.toLocaleString()}P</p>
  </div>
  <div class="tabs mt16">
    <button class="${tab === "shop" ? "active" : ""}" onclick="go('rewards',{tab:'shop'})">🛍️ 상점</button>
    <button class="${tab === "badges" ? "active" : ""}" onclick="go('rewards',{tab:'badges'})">🏅 배지</button>
    <button class="${tab === "history" ? "active" : ""}" onclick="go('rewards',{tab:'history'})">📜 내역</button>
  </div>
  ${body}`;
}

function requestRedeem(rewardId) {
  const r = S.rewards.find(x => x.id === rewardId);
  if (!r) return;
  if (S.points.balance < r.cost) { toast("포인트가 부족해요 😢"); return; }
  if (S.redemptions.some(x => x.rewardId === rewardId && x.status === "pending")) {
    toast("이미 승인 대기 중인 항목이에요!"); return;
  }
  S.redemptions.push({ id: uid(), rewardId, name: r.name, cost: r.cost, status: "pending", requestedAt: nowISO(), decidedAt: null });
  save();
  toast("교환 신청 완료! 부모님 승인을 기다려요 ⏳");
  render();
}

// ---------------- 설정 ----------------
function viewSettings() {
  return `
  <h1>⚙️ 설정</h1>
  <div class="card mt16">
    <div class="field">
      <label>이름</label>
      <input id="set-name" value="${esc(S.profile.name)}" maxlength="12">
    </div>
    <div class="field">
      <label>하루 목표 문제 수</label>
      <select id="set-goal">
        ${[4, 6, 8].map(n => { const [a, l] = trackSplit(n); return `<option value="${n}" ${S.profile.dailyGoal === n ? "selected" : ""}>${n}문제 (어드벤처 ${a} + 문법·어휘 ${l})</option>`; }).join("")}
      </select>
      <p class="sub small mt8">변경은 내일 세트부터 적용돼요.</p>
    </div>
    <button class="btn ghost mt12" onclick="saveProfile()">저장</button>
  </div>
  <div class="card mt16">
    <h3>💾 데이터 백업/복원</h3>
    <p class="sub small mt8">학습 기록·포인트·설정을 파일로 저장해 두면, 기기를 바꾸거나 브라우저 데이터를 지워도 복원할 수 있어요.</p>
    <button class="btn ghost mt12" onclick="exportBackup()">📤 백업 파일 내려받기</button>
    <div class="field">
      <label>백업 파일 불러오기 (현재 데이터를 덮어씀)</label>
      <input type="file" id="restore-file" accept=".json" onchange="importBackupFile(this)">
    </div>
  </div>
  <div class="card mt16">
    <h3>👨‍👩‍👧 부모님 공간</h3>
    <p class="sub small mt8">보상 등록 · 교환 승인 · 포인트 규칙 · 문항 관리 · 주간 리포트</p>
    <button class="btn primary mt12" onclick="parentUnlocked=false;go('parent')">들어가기 🔒</button>
  </div>
  <div class="card mt16">
    <h3>ℹ️ 정보</h3>
    <p class="sub small mt8">Jr. TOEFL Daily v0.1 · 개인/가정용<br>모든 데이터는 이 기기(브라우저)에만 저장됩니다.<br>문항 수: ${questionBank().length}개 (어드벤처 ${questionBank().filter(q => q.track === "adventure").length} / 문법·어휘 ${questionBank().filter(q => q.track === "lfm").length})</p>
    <div class="row mt12" style="gap:14px">
      <a class="link-btn small" href="privacy.html">개인정보처리방침</a>
      <a class="link-btn small" href="contact.html">문의하기</a>
    </div>
  </div>`;
}
// ---------------- 백업/복원 ----------------
function buildBackup() {
  let bank = [];
  try { bank = JSON.parse(localStorage.getItem(BANK_KEY) || "[]"); } catch (e) {}
  return { app: "jr-toefl-daily", version: 1, exportedAt: nowISO(), state: S, customBank: bank };
}
function exportBackup() {
  const blob = new Blob([JSON.stringify(buildBackup())], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `jrtoefl-backup-${todayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast("백업 파일을 내려받았어요 💾");
}
function importBackupFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      if (obj.app !== "jr-toefl-daily" || !obj.state) throw new Error("형식 오류");
      if (!confirm(`${(obj.exportedAt || "").slice(0, 10)} 백업으로 현재 데이터를 덮어쓸까요? 되돌릴 수 없습니다.`)) { input.value = ""; return; }
      localStorage.setItem(STORE_KEY, JSON.stringify(obj.state));
      if (Array.isArray(obj.customBank) && obj.customBank.length) localStorage.setItem(BANK_KEY, JSON.stringify(obj.customBank));
      location.reload();
    } catch (e) {
      toast("백업 파일 형식이 올바르지 않아요 ❌");
      input.value = "";
    }
  };
  reader.readAsText(file, "utf-8");
}

function saveProfile() {
  const name = document.getElementById("set-name").value.trim();
  const goal = parseInt(document.getElementById("set-goal").value, 10);
  if (name) S.profile.name = name;
  S.profile.dailyGoal = goal;
  save();
  toast("저장했어요 ✅");
  render();
}

// ---------------- 부모님 공간 ----------------
function viewPinGate() {
  const hasPin = !!S.settings.parentPin;
  return `
  <div class="row"><button class="back-btn" onclick="go('settings')">←</button><h1>👨‍👩‍👧 부모님 공간</h1></div>
  <div class="card mt16 center" style="padding:28px 20px">
    <div style="font-size:2.4rem">🔒</div>
    <p class="mt8" style="font-weight:700">${hasPin ? "PIN을 입력해 주세요" : "부모님 PIN을 만들어 주세요 (숫자 4자리)"}</p>
    <div class="field"><input id="pin-input" type="password" inputmode="numeric" maxlength="4" placeholder="••••" style="text-align:center;font-size:1.4rem;letter-spacing:.4em"></div>
    <button class="btn primary mt12" onclick="submitPin()">${hasPin ? "확인" : "PIN 설정"}</button>
  </div>`;
}
function submitPin() {
  const v = document.getElementById("pin-input").value.trim();
  if (!/^\d{4}$/.test(v)) { toast("숫자 4자리를 입력해 주세요"); return; }
  if (!S.settings.parentPin) {
    S.settings.parentPin = v;
    save();
    parentUnlocked = true;
    toast("PIN이 설정되었습니다 ✅");
    render();
  } else if (S.settings.parentPin === v) {
    parentUnlocked = true;
    render();
  } else {
    toast("PIN이 일치하지 않아요 ❌");
  }
}

function viewParent() {
  const pending = S.redemptions.filter(r => r.status === "pending");
  const r = S.settings.rules;
  const set = S.dailySets[todayKey()];
  const wrongs = wrongList();

  return `
  <div class="row"><button class="back-btn" onclick="go('settings')">←</button><h1>👨‍👩‍👧 부모님 공간</h1></div>

  <div class="card mt16">
    <h3>📋 오늘 요약</h3>
    <div class="mt8">
      <div class="point-line"><span>오늘 학습</span><span><b>${set ? (set.completed ? "✅ 완료" : `진행 중 ${set.answers.length}/${set.questionIds.length}`) : "시작 전"}</b></span></div>
      <div class="point-line"><span>연속 학습</span><span><b>${displayedStreak()}일</b> (최장 ${S.streak.longest}일)</span></div>
      <div class="point-line"><span>전체 정답률</span><span><b>${accuracy(null) == null ? "-" : accuracy(null) + "%"}</b></span></div>
      <div class="point-line"><span>오답 대기 / 정복</span><span><b>${wrongs.length} / ${conqueredCount()}</b></span></div>
      <div class="point-line"><span>포인트 (잔액/누적)</span><span><b>${S.points.balance.toLocaleString()} / ${S.points.total.toLocaleString()}P</b></span></div>
    </div>
  </div>

  ${weeklyReportHTML()}

  <div class="card mt16">
    <h3>⏳ 교환 승인 대기 ${pending.length ? `<span class="pill-num">${pending.length}</span>` : ""}</h3>
    ${pending.length ? pending.map(p => `
      <div class="list-item mt8" style="box-shadow:none;border:1px solid var(--line)">
        <div class="grow"><b>${esc(p.name)}</b><div class="sub small">${p.cost}P · ${p.requestedAt.slice(0, 10)}</div></div>
        <button class="btn primary small-btn" onclick="decideRedeem('${p.id}',true)">승인</button>
        <button class="btn warn small-btn" onclick="decideRedeem('${p.id}',false)">거절</button>
      </div>`).join("") : `<p class="sub small mt8">대기 중인 신청이 없어요.</p>`}
  </div>

  <div class="card mt16">
    <h3>🎁 보상 항목 관리</h3>
    ${S.rewards.map(rw => `
      <div class="list-item mt8" style="box-shadow:none;border:1px solid var(--line);${rw.active ? "" : "opacity:.5"}">
        <div class="grow"><b>${esc(rw.name)}</b><div class="sub small">${rw.cost.toLocaleString()}P</div></div>
        <button class="btn ghost small-btn" onclick="toggleReward('${rw.id}')">${rw.active ? "숨김" : "표시"}</button>
        <button class="btn warn small-btn" onclick="deleteReward('${rw.id}')">삭제</button>
      </div>`).join("")}
    <div class="row mt12" style="gap:6px">
      <input id="rw-name" placeholder="보상 이름 (예: 게임 30분)" style="flex:2;min-width:0;padding:10px;border-radius:10px;border:1.5px solid var(--line)">
      <input id="rw-cost" type="number" min="1" placeholder="포인트" style="flex:1;min-width:0;padding:10px;border-radius:10px;border:1.5px solid var(--line)">
    </div>
    <button class="btn ghost mt8" onclick="addReward()">+ 보상 추가</button>
  </div>

  <div class="card mt16">
    <h3>🪙 포인트 규칙</h3>
    ${[
      ["rule-solve", "문제 1개 풀이", r.solve],
      ["rule-correct", "첫 정답 보너스", r.correct],
      ["rule-daily", "하루치 완료 보너스", r.daily],
      ["rule-streak3", "3일 단위 연속 보너스", r.streak3],
      ["rule-streak7", "7일 단위 연속 보너스", r.streak7],
      ["rule-review", "오답 정복 1문제당", r.review],
    ].map(([id, label, val]) => `
      <div class="row between mt8">
        <span class="small" style="font-weight:600">${label}</span>
        <input id="${id}" type="number" min="0" value="${val}" style="width:80px;padding:8px;border-radius:10px;border:1.5px solid var(--line);text-align:right">
      </div>`).join("")}
    <button class="btn ghost mt12" onclick="saveRules()">규칙 저장</button>
  </div>

  <div class="card mt16">
    <h3>📥 문항 JSON 가져오기</h3>
    <p class="sub small mt8">questions.js와 같은 형식의 JSON 배열 파일을 불러옵니다. (같은 id는 덮어씀)</p>
    <input type="file" id="bank-file" accept=".json" class="mt8" onchange="importBank(this)">
    <p class="sub small mt8">현재 문항: ${questionBank().length}개</p>
  </div>

  <div class="card mt16">
    <h3>🔑 PIN 변경</h3>
    <div class="row mt8" style="gap:6px">
      <input id="new-pin" type="password" inputmode="numeric" maxlength="4" placeholder="새 PIN 4자리" style="flex:1;min-width:0;padding:10px;border-radius:10px;border:1.5px solid var(--line)">
      <button class="btn ghost small-btn" onclick="changePin()">변경</button>
    </div>
  </div>

  <div class="card mt16">
    <h3>⚠️ 데이터 초기화</h3>
    <p class="sub small mt8">모든 학습 기록·포인트·보상 내역이 삭제됩니다.</p>
    <button class="btn warn mt8" onclick="resetAll()">전체 초기화</button>
  </div>`;
}

// ---------------- 주간 리포트 (부모용) ----------------
function weakTags(days) {
  const from = addDays(todayKey(), -(days - 1));
  const cnt = {};
  for (const a of S.attempts) {
    if (a.isCorrect || a.date.slice(0, 10) < from) continue;
    const q = getQ(a.questionId);
    if (!q) continue;
    (q.tags || []).forEach(t => { cnt[t] = (cnt[t] || 0) + 1; });
  }
  return Object.entries(cnt).sort((x, y) => y[1] - x[1]).slice(0, 3);
}
function weeklyReportHTML() {
  const ws = weekStartKey(), we = addDays(ws, 6);
  const today = todayKey();
  const thisAtt = attemptsBetween(ws, we);
  const lastWs = addDays(ws, -7);
  const lastAtt = attemptsBetween(lastWs, addDays(lastWs, 6));
  const pct = list => list.length ? Math.round(list.filter(a => a.isCorrect).length / list.length * 100) : null;
  const trackAtt = (list, tr) => list.filter(a => { const q = getQ(a.questionId); return q && q.track === tr; });

  const dayNames = ["월", "화", "수", "목", "금", "토", "일"];
  const cells = dayNames.map((nm, i) => {
    const k = addDays(ws, i);
    const s = S.dailySets[k];
    let cls = "cal-cell";
    if (s && s.completed) cls += " done";
    else if (s && s.answers.length) cls += " partial";
    if (k === today) cls += " today";
    return `<div class="${cls}" title="${k}">${nm}</div>`;
  }).join("");

  const line = (name, att, lastPct) => {
    const p = pct(att);
    return `<div class="point-line"><span>${name}</span><span><b>${att.length}문제 · ${p == null ? "-" : p + "%"}</b>${lastPct != null ? ` <span class="sub small">(지난주 ${lastPct}%)</span>` : ""}</span></div>`;
  };
  const weak = weakTags(30);

  return `<div class="card mt16">
    <h3>📅 주간 리포트 <span class="sub small">(${ws.slice(5)} ~ ${we.slice(5)})</span></h3>
    <div class="cal-grid mt12">${cells}</div>
    <div class="mt12">
      ${line("📚 전체", thisAtt, pct(lastAtt))}
      ${line("🏝️ 어드벤처", trackAtt(thisAtt, "adventure"), pct(trackAtt(lastAtt, "adventure")))}
      ${line("✏️ 문법·어휘", trackAtt(thisAtt, "lfm"), pct(trackAtt(lastAtt, "lfm")))}
    </div>
    <div class="divider"></div>
    <h3 style="font-size:.9rem">🔎 최근 30일 자주 틀린 유형</h3>
    ${weak.length ? `<div class="chips mt8">${weak.map(([t, n]) => `<span class="chip">${esc(TAG_KO[t] || t)} ${n}회</span>`).join("")}</div>`
      : `<p class="sub small mt8">아직 데이터가 부족해요.</p>`}
  </div>`;
}

function decideRedeem(id, approve) {
  const rd = S.redemptions.find(x => x.id === id);
  if (!rd || rd.status !== "pending") return;
  if (approve) {
    if (S.points.balance < rd.cost) { toast("잔액이 부족해 승인할 수 없어요"); return; }
    rd.status = "approved";
    rd.decidedAt = nowISO();
    addPoints(-rd.cost, `보상 교환: ${rd.name}`, { silent: true });
    toast(`✅ 승인 완료: ${rd.name}`);
  } else {
    rd.status = "rejected";
    rd.decidedAt = nowISO();
    toast("거절했어요");
  }
  save();
  render();
}
function addReward() {
  const name = document.getElementById("rw-name").value.trim();
  const cost = parseInt(document.getElementById("rw-cost").value, 10);
  if (!name || !cost || cost < 1) { toast("이름과 포인트를 입력해 주세요"); return; }
  S.rewards.push({ id: "rw_" + uid(), name, cost, active: true });
  save(); render();
  toast("보상을 추가했어요 🎁");
}
function toggleReward(id) {
  const rw = S.rewards.find(x => x.id === id);
  if (rw) { rw.active = !rw.active; save(); render(); }
}
function deleteReward(id) {
  if (!confirm("이 보상을 삭제할까요?")) return;
  S.rewards = S.rewards.filter(x => x.id !== id);
  save(); render();
}
function saveRules() {
  const g = id => Math.max(0, parseInt(document.getElementById(id).value, 10) || 0);
  S.settings.rules = {
    solve: g("rule-solve"), correct: g("rule-correct"), daily: g("rule-daily"),
    streak3: g("rule-streak3"), streak7: g("rule-streak7"), review: g("rule-review"),
  };
  save();
  toast("포인트 규칙을 저장했어요 ✅");
}
function changePin() {
  const v = document.getElementById("new-pin").value.trim();
  if (!/^\d{4}$/.test(v)) { toast("숫자 4자리를 입력해 주세요"); return; }
  S.settings.parentPin = v;
  save();
  toast("PIN을 변경했어요 🔑");
}
function importBank(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const arr = JSON.parse(reader.result);
      if (!Array.isArray(arr)) throw new Error("배열이 아님");
      const valid = arr.filter(q => q && q.id && q.track && q.stem && Array.isArray(q.choices) && q.choices.length === 4 && typeof q.answer === "number");
      let custom = [];
      try { custom = JSON.parse(localStorage.getItem(BANK_KEY) || "[]"); } catch (e) {}
      const map = new Map(custom.map(q => [q.id, q]));
      valid.forEach(q => map.set(q.id, q));
      localStorage.setItem(BANK_KEY, JSON.stringify([...map.values()]));
      toast(`문항 ${valid.length}개를 가져왔어요 📥`);
      render();
    } catch (e) {
      toast("JSON 형식이 올바르지 않아요 ❌");
    }
  };
  reader.readAsText(file, "utf-8");
}
function resetAll() {
  if (!confirm("정말 모든 데이터를 초기화할까요? 되돌릴 수 없습니다.")) return;
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem(BANK_KEY);
  location.reload();
}

// ---------------- 토스트 / 컨페티 ----------------
function toast(msg, kind) {
  const zone = document.getElementById("toast-zone");
  const el = document.createElement("div");
  el.className = "toast" + (kind === "coin" ? " coin" : "");
  el.textContent = msg;
  zone.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
function burstConfetti() {
  const emojis = ["🎉", "⭐", "🪙", "✨", "🎊"];
  for (let i = 0; i < 14; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * 100 + "vw";
    el.style.animationDelay = (Math.random() * 0.5) + "s";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
}

// ---------------- 초기화 ----------------
function init() {
  load();
  // 진행 중이던 오늘 세트가 있으면 홈에서 "이어서 풀기"로 노출됨 (별도 복원 불필요)
  render();
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}
document.addEventListener("DOMContentLoaded", init);
