/* ============================================================
 * questions.js 생성기 — adv 500 + lfm 500 문항
 * 사용법: node tools/generate_questions.js
 * - 기존 questions.js의 수작업 문항(adv_0001~0018, lfm_0001~0018)은 보존
 * - 시드 고정 난수 → 재실행해도 동일한 결과
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

const Q_PATH = path.join(__dirname, "..", "questions.js");
const TARGET_PER_TRACK = 500;
const HAND_MAX = 18; // 수작업 문항 번호 상한

// ---------- 시드 난수 (mulberry32) ----------
let _seed = 20260712;
function rnd() {
  _seed |= 0; _seed = (_seed + 0x6D2B79F5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function rint(n) { return Math.floor(rnd() * n); }
function pick(arr) { return arr[rint(arr.length)]; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = rint(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function sample(arr, k) { return shuffle(arr).slice(0, k); }

// ---------- 어형 변화 도우미 ----------
const ING = { run: "running", swim: "swimming", sit: "sitting", get: "getting", put: "putting", shop: "shopping", plan: "planning", chat: "chatting", win: "winning", be: "being", ride: "riding", dance: "dancing", take: "taking", make: "making", write: "writing", bake: "baking", come: "coming", give: "giving", have: "having", use: "using", practice: "practicing", skate: "skating", drive: "driving", lie: "lying" };
function ing(phrase) {
  const [w, ...rest] = phrase.split(" ");
  let g = ING[w];
  if (!g) {
    if (/ee$/.test(w)) g = w + "ing";
    else if (/e$/.test(w)) g = w.slice(0, -1) + "ing";
    else g = w + "ing";
  }
  return [g, ...rest].join(" ");
}
const THIRD = { be: "is", go: "goes", do: "does", have: "has", study: "studies", try: "tries", watch: "watches", wash: "washes", finish: "finishes", fix: "fixes", miss: "misses", catch: "catches", teach: "teaches" };
function third(phrase) {
  const [w, ...rest] = phrase.split(" ");
  let t = THIRD[w];
  if (!t) {
    if (/[^aeiou]y$/.test(w)) t = w.slice(0, -1) + "ies";
    else if (/(s|sh|ch|x|o)$/.test(w)) t = w + "es";
    else t = w + "s";
  }
  return [t, ...rest].join(" ");
}

// ---------- 인물 ----------
const BOYS = ["Jun", "Leo", "Max", "Ben", "Sam", "Noah", "Ethan", "Jack", "Owen", "Liam", "Daniel", "Minho"];
const GIRLS = ["Mina", "Sara", "Emma", "Lucy", "Amy", "Chloe", "Zoe", "Grace", "Lily", "Hana", "Sofia", "Ella"];
function person() {
  const f = rnd() < 0.5;
  const n = f ? pick(GIRLS) : pick(BOYS);
  return f
    ? { n, he: "she", He: "She", his: "her", His: "Her", him: "her" }
    : { n, he: "he", He: "He", his: "his", His: "His", him: "him" };
}
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ---------- MCQ 조립 ----------
function mcq(track, correct, distractorPool, fields) {
  const ds = [];
  for (const d of shuffle(distractorPool)) {
    if (d !== correct && !ds.includes(d)) ds.push(d);
    if (ds.length === 3) break;
  }
  if (ds.length < 3) throw new Error("오답 후보 부족: " + fields.stem + " / " + correct);
  const choices = shuffle([correct, ...ds]);
  return Object.assign({ track, type: "mcq", choices, answer: choices.indexOf(correct) }, fields);
}

// ============================================================
//  LFM 생성기
// ============================================================
function genLFM() {
  const out = [];
  const add = (correct, pool, stem, explanation, difficulty, tags) =>
    out.push(mcq("lfm", correct, pool, { stem, explanation, difficulty, tags }));

  // --- 1) 전치사 연어 ---
  const PREP = [
    { mk: o => `is afraid ___ ${o}`, p: "of", d: ["at", "on", "with"], objs: ["spiders", "the dark", "thunder", "big dogs"], note: "be afraid of = ~을 무서워하다" },
    { mk: o => `is good ___ ${o}`, p: "at", d: ["of", "for", "with"], objs: ["math", "swimming", "drawing", "chess"], note: "be good at = ~을 잘하다" },
    { mk: o => `is interested ___ ${o}`, p: "in", d: ["of", "at", "on"], objs: ["science", "space", "history", "K-pop music"], note: "be interested in = ~에 관심이 있다" },
    { mk: o => `is proud ___ ${o}`, p: "of", d: ["at", "in", "with"], objs: ["her team", "his little sister", "their school"], note: "be proud of = ~을 자랑스러워하다" },
    { mk: o => `is famous ___ ${o}`, p: "for", d: ["of", "at", "in"], objs: ["its beaches", "its old castle", "its delicious food"], note: "be famous for = ~으로 유명하다" },
    { mk: o => `is different ___ ${o}`, p: "from", d: ["of", "at", "in"], objs: ["mine", "my old school", "yours"], note: "be different from = ~과 다르다" },
    { mk: o => `is full ___ ${o}`, p: "of", d: ["with", "at", "on"], objs: ["books", "old toys", "colorful fish"], note: "be full of = ~으로 가득 차다" },
    { mk: o => `is tired ___ ${o}`, p: "of", d: ["at", "with", "on"], objs: ["waiting", "doing the same thing"], note: "be tired of = ~에 싫증나다" },
    { mk: o => `is worried ___ ${o}`, p: "about", d: ["of", "at", "on"], objs: ["the test", "her sick cat", "the weather"], note: "be worried about = ~을 걱정하다" },
    { mk: o => `is excited ___ ${o}`, p: "about", d: ["of", "at", "in"], objs: ["the field trip", "the concert", "the school festival"], note: "be excited about = ~에 신나 있다" },
    { mk: o => `always listens ___ ${o} in the evening`, p: "to", d: ["at", "of", "on"], objs: ["music", "the radio"], note: "listen to = ~을 듣다" },
    { mk: o => `is waiting ___ ${o} at the corner`, p: "for", d: ["at", "of", "on"], objs: ["the bus", "her friend"], note: "wait for = ~을 기다리다" },
    { mk: o => `has to look ___ ${o} this afternoon`, p: "after", d: ["of", "on", "from"], objs: ["her baby brother", "the class hamster"], note: "look after = ~을 돌보다" },
    { mk: o => `says this bag belongs ___ ${o}`, p: "to", d: ["of", "at", "with"], objs: ["me", "the new student"], note: "belong to = ~의 것이다" },
    { mk: o => `says the picnic depends ___ ${o}`, p: "on", d: ["of", "at", "to"], objs: ["the weather", "the bus schedule"], note: "depend on = ~에 달려 있다" },
    { mk: o => `agrees ___ ${o} about the movie`, p: "with", d: ["of", "at", "from"], objs: ["me", "her brother"], note: "agree with + 사람 = ~의 의견에 동의하다" },
    { mk: o => `laughed ___ ${o} during the show`, p: "at", d: ["of", "on", "to"], objs: ["the clown's joke", "the funny dance"], note: "laugh at = ~을 보고 웃다" },
    { mk: o => `paid ___ ${o} at the counter`, p: "for", d: ["of", "at", "on"], objs: ["the tickets", "the snacks"], note: "pay for = ~의 값을 지불하다" },
    { mk: o => `really cares ___ ${o}`, p: "about", d: ["at", "on", "from"], objs: ["his friends", "the environment"], note: "care about = ~에 마음을 쓰다" },
    { mk: o => `arrived ___ ${o} on time`, p: "at", d: ["on", "to", "of"], objs: ["the station", "the airport"], note: "arrive at + 장소 = ~에 도착하다 (arrive to는 틀린 표현)" },
  ];
  for (const it of PREP) for (const o of it.objs) {
    const P = person();
    add(it.p, it.d, `${P.n} ${it.mk(o)}.`, `${it.note}. 빈칸에는 '${it.p}'가 알맞다.`, 2, ["preposition", "collocation"]);
  }

  // --- 2) 동명사 목적어 동사 ---
  const GER_ACT = ["play soccer", "read comic books", "draw cartoons", "swim", "dance", "sing", "cook", "ride a bike", "study math", "clean the classroom", "take photos", "write short stories", "play the piano", "watch movies", "run in the park"];
  const GER_V = [
    { v: "enjoys", tail: "in {his} free time" },
    { v: "finished", tail: "an hour ago" },
    { v: "keeps", tail: "even when it is hard" },
    { v: "practices", tail: "every afternoon" },
    { v: "avoids", tail: "late at night" },
    { v: "doesn't mind", tail: "on weekends" },
  ];
  for (const gv of GER_V) for (const act of sample(GER_ACT, 13)) {
    const P = person();
    const base = act, toInf = "to " + act, ger = ing(act), th = third(act);
    add(ger, [base, toInf, th],
      `${P.n} ${gv.v} ___ ${gv.tail.replace("{his}", P.his)}.`,
      `'${gv.v.replace("doesn't ", "")}'는 동명사(-ing)를 목적어로 취하는 동사이다. 따라서 '${ger}'가 정답.`,
      2, ["gerund", "verb-pattern"]);
  }

  // --- 3) to부정사 목적어 동사 ---
  const INF_ACT = ["visit Jeju Island", "become a scientist", "learn French", "join the soccer team", "buy a new bike", "be a singer", "win the contest", "make new friends", "get a puppy", "see the ocean", "ride a horse", "travel around the world"];
  const INF_V = ["wants", "hopes", "decided", "plans", "promised", "needs", "agreed", "chose", "would like"];
  for (const v of INF_V) for (const act of sample(INF_ACT, 11)) {
    const P = person();
    const base = act, toInf = "to " + act, ger = ing(act), th = third(act);
    add(toInf, [base, ger, th],
      `${P.n} ${v} ___ someday.`,
      `'${v}'는 to부정사를 목적어로 취하는 동사이다. 따라서 '${toInf}'가 정답.`,
      2, ["infinitive", "verb-pattern"]);
  }

  // --- 4) 과거진행형 ---
  const PP_SUBJ = [["I", "was"], ["He", "was"], ["She", "was"], ["My dad", "was"], ["We", "were"], ["They", "were"], ["The kids", "were"]];
  const PP_ACT = ["do homework", "watch TV", "cook dinner", "read a book", "play a board game", "take a shower", "walk the dog"];
  const PP_INT = ["the phone rang", "the lights went out", "the doorbell rang", "it started to rain", "you called me"];
  const PP_OF = { "do homework": "done homework", "watch TV": "watched TV", "cook dinner": "cooked dinner", "read a book": "read a book", "play a board game": "played a board game", "take a shower": "taken a shower", "walk the dog": "walked the dog" };
  for (const [subj, be] of PP_SUBJ) for (const act of sample(PP_ACT, 5)) {
    const cor = `${be} ${ing(act)}`;
    const pool = [third(act), `${be === "was" ? "has" : "have"} ${PP_OF[act]}`, `will ${act}`];
    add(cor, pool, `${subj} ___ when ${pick(PP_INT)}.`,
      `과거의 한 시점에 진행 중이던 동작이므로 과거진행형(was/were + -ing)을 쓴다. 정답 '${cor}'.`,
      2, ["tense", "past-progressive"]);
  }

  // --- 5) since / for ---
  const DUR = ["five years", "two hours", "three days", "a long time", "ten minutes", "six months"];
  const PNT = ["2019", "2023", "last Monday", "this morning", "I was seven", "March"];
  const SF_FRAMES = [t => `She has lived in Busan ___ ${t}.`, t => `He has been sick ___ ${t}.`, t => `We have known each other ___ ${t}.`, t => `I have studied English ___ ${t}.`];
  for (const f of SF_FRAMES) {
    for (const t of sample(DUR, 3)) add("for", ["since", "during", "from"], f(t), `현재완료 + 기간(얼마 동안)에는 for를 쓴다. since는 시작 시점과 함께 쓴다.`, 2, ["present-perfect", "preposition"]);
    for (const t of sample(PNT, 3)) add("since", ["for", "during", "from"], f(t), `현재완료 + 시작 시점(언제부터)에는 since를 쓴다. for는 기간과 함께 쓴다.`, 2, ["present-perfect", "preposition"]);
  }

  // --- 6) 과거완료 ---
  const PPF = [
    ["we got to the station", "the train", "leave", "leaves", "had left", "has left", "will leave"],
    ["we arrived at the theater", "the movie", "start", "starts", "had started", "has started", "will start"],
    ["the teacher came in", "everyone", "finish the quiz", "finishes the quiz", "had finished the quiz", "has finished the quiz", "will finish the quiz"],
    ["the bell rang", "Mina", "pack her bag", "packs her bag", "had packed her bag", "has packed her bag", "will pack her bag"],
    ["I woke up", "Dad", "make breakfast", "makes breakfast", "had made breakfast", "has made breakfast", "will make breakfast"],
    ["we reached the top", "the sun", "set", "sets", "had set", "has set", "will set"],
    ["the guests arrived", "Mom", "clean the house", "cleans the house", "had cleaned the house", "has cleaned the house", "will clean the house"],
    ["the game began", "the rain", "stop", "stops", "had stopped", "has stopped", "will stop"],
    ["I turned on the TV", "the show", "end", "ends", "had ended", "has ended", "will end"],
  ];
  for (const [ev, subj, , pres, hadpp, haspp, will] of PPF) {
    add(hadpp, [pres, haspp, will], `By the time ${ev}, ${subj} already ___.`,
      `과거의 한 시점(${ev}) 이전에 이미 완료된 일이므로 과거완료(had + p.p.)를 쓴다. 정답 '${hadpp}'.`,
      3, ["tense", "past-perfect"]);
  }

  // --- 7) 조건문(1형식) ---
  const COND = [
    ["rains", "we will stay home and play board games"],
    ["rains", "the picnic will be canceled"],
    ["snows", "we will build a snowman"],
    ["snows", "school will start late"],
    ["is sunny", "we will go on a picnic"],
    ["is sunny", "we will play soccer outside"],
  ];
  const COND_T = ["tomorrow", "this weekend", "on Saturday"];
  for (const [v, plan] of COND) for (const t of sample(COND_T, 2)) {
    const past = v === "is sunny" ? "was sunny" : v.replace(/s$/, "ed");
    const fut = "will " + (v === "is sunny" ? "be sunny" : v.replace(/s$/, ""));
    const gerv = v === "is sunny" ? "being sunny" : ing(v.replace(/s$/, ""));
    add(v, [past, fut, gerv], `If it ___ ${t}, ${plan}.`,
      `조건 부사절(if절)에서는 미래의 일이라도 현재시제를 쓴다. 정답 '${v}'.`, 2, ["conditional", "tense"]);
  }

  // --- 8) 비교급/최상급/원급 ---
  const ADJ = [
    ["tall", "taller", "tallest", "more tall", "My brother is ___ than my dad."],
    ["big", "bigger", "biggest", "more big", "An elephant is ___ than a horse."],
    ["happy", "happier", "happiest", "more happy", "Puppies always look ___ than they did yesterday."],
    ["funny", "funnier", "funniest", "more funny", "This cartoon is ___ than that one."],
    ["easy", "easier", "easiest", "more easy", "This quiz is ___ than the last one."],
    ["hot", "hotter", "hottest", "more hot", "Today is ___ than yesterday."],
    ["fast", "faster", "fastest", "more fast", "A cheetah is ___ than a lion."],
    ["smart", "smarter", "smartest", "more smart", "Dolphins are ___ than many other animals."],
    ["strong", "stronger", "strongest", "more strong", "My dad is ___ than my uncle."],
    ["old", "older", "oldest", "more old", "My grandmother is ___ than my grandfather."],
    ["cheap", "cheaper", "cheapest", "more cheap", "This pencil is ___ than that pen."],
    ["heavy", "heavier", "heaviest", "more heavy", "My schoolbag is ___ than my sister's."],
    ["interesting", "more interesting", "most interesting", "interestinger", "This book is ___ than the movie."],
    ["beautiful", "more beautiful", "most beautiful", "beautifuler", "The sunset today is ___ than yesterday's."],
    ["difficult", "more difficult", "most difficult", "difficulter", "This puzzle is ___ than the last one."],
    ["famous", "more famous", "most famous", "famouser", "This singer is ___ than that actor."],
    ["popular", "more popular", "most popular", "popularer", "Soccer is ___ than tennis at my school."],
    ["expensive", "more expensive", "most expensive", "expensiver", "The blue jacket is ___ than the red one."],
    ["exciting", "more exciting", "most exciting", "excitinger", "The second game was ___ than the first one."],
    ["good", "better", "best", "goodest", "Your idea is ___ than mine."],
    ["bad", "worse", "worst", "baddest", "The weather today is ___ than yesterday's."],
  ];
  for (const [base, comp, sup, bad, frame] of ADJ) {
    add(comp, [base, sup, bad], frame, `'than'과 함께 쓰는 비교급 자리이다. '${base}'의 비교급은 '${comp}'.`, 2, ["comparative"]);
  }
  const SUP = [
    ["funny", "funniest", "funnier", "most funny", "movie", "watched"],
    ["interesting", "most interesting", "more interesting", "interestingest", "book", "read"],
    ["difficult", "most difficult", "more difficult", "difficultest", "question", "seen"],
    ["beautiful", "most beautiful", "more beautiful", "beautifulest", "place", "visited"],
    ["exciting", "most exciting", "more exciting", "excitingest", "game", "played"],
    ["delicious", "most delicious", "more delicious", "deliciousest", "food", "eaten"],
    ["good", "best", "better", "goodest", "movie", "seen"],
  ];
  for (const [base, sup, comp, bad, noun, ppv] of SUP) {
    add(sup, [base, comp, bad], `This is the ___ ${noun} I have ever ${ppv}.`,
      `'the + 최상급 + I have ever ~' 구문. '${base}'의 최상급은 '${sup}'.`, 2, ["superlative"]);
  }
  const SUP2 = [
    ["tall", "tallest", "taller", "most tall", "The new tower is the ___ building in our city."],
    ["big", "biggest", "bigger", "most big", "The blue whale is the ___ animal in the world."],
    ["fast", "fastest", "faster", "most fast", "Jiho is the ___ runner in our class."],
    ["popular", "most popular", "more popular", "popularest", "Soccer is the ___ sport at my school."],
    ["old", "oldest", "older", "most old", "This temple is the ___ building in our town."],
  ];
  for (const [base, sup, comp, bad, frame] of SUP2) {
    add(sup, [base, comp, bad], frame, `범위(in ~) 안에서 '가장 ~한'을 나타내는 최상급 자리. '${base}'의 최상급은 '${sup}'.`, 2, ["superlative"]);
  }
  const ASAS = [
    ["heavy", "heavier", "heaviest", "more heavy", "My bag is as ___ as yours."],
    ["easy", "easier", "easiest", "more easy", "This quiz was as ___ as the last one."],
    ["tall", "taller", "tallest", "more tall", "Mina is as ___ as her older brother now."],
    ["cold", "colder", "coldest", "more cold", "Today is as ___ as yesterday."],
  ];
  for (const [base, comp, sup, bad, frame] of ASAS) {
    add(base, [comp, sup, bad], frame, `'as ~ as' 사이에는 형용사/부사의 원급을 쓴다. 정답 '${base}'.`, 2, ["as-as", "comparative"]);
  }

  // --- 9) 수량 표현 ---
  const UNC = ["milk", "water", "homework", "sugar", "bread", "juice", "rice"];
  const CNT = ["books", "friends", "apples", "questions", "cookies", "chairs", "pencils", "stickers"];
  for (const n of sample(UNC, 6)) {
    add("much", ["many", "a few", "few"], `There isn't ___ ${n} left, so we need to get some more.`,
      `'${n}'은(는) 셀 수 없는 명사이므로 much를 쓴다. many/(a) few는 셀 수 있는 명사에 사용.`, 2, ["quantifier", "uncountable"]);
    add("much", ["many", "few", "a few"], `How ___ ${n} do we need for this?`,
      `'${n}'은(는) 셀 수 없는 명사 → How much. How many는 셀 수 있는 명사에 사용.`, 2, ["quantifier", "uncountable"]);
  }
  for (const n of sample(CNT, 6)) {
    add("many", ["much", "a little", "little"], `I don't have ___ ${n} in my bag.`,
      `'${n}'은(는) 셀 수 있는 명사(복수)이므로 many를 쓴다. much는 셀 수 없는 명사에 사용.`, 2, ["quantifier", "countable"]);
    add("many", ["much", "little", "a little"], `How ___ ${n} did you bring today?`,
      `'${n}'은(는) 셀 수 있는 명사 → How many. How much는 셀 수 없는 명사에 사용.`, 2, ["quantifier", "countable"]);
  }
  add("a few", ["a little", "much", "little"], "Hurry up! We only have ___ minutes before the bus leaves.",
    "minutes는 셀 수 있는 명사이므로 'a few(조금 있는)'를 쓴다. a little은 셀 수 없는 명사에 사용.", 2, ["quantifier"]);
  add("a little", ["a few", "many", "few"], "Can I have ___ water? I'm really thirsty.",
    "water는 셀 수 없는 명사이므로 'a little(조금)'을 쓴다. a few는 셀 수 있는 명사에 사용.", 2, ["quantifier"]);

  // --- 10) 조동사 ---
  const MODAL = [
    ["must", ["might", "would", "could"], "You ___ wear a helmet when you ride a bike. It's the rule.", "규칙·의무이므로 must(~해야 한다)."],
    ["must", ["might", "would", "could"], "You ___ wear a seatbelt in the car. It's the law.", "법으로 정해진 의무이므로 must."],
    ["must", ["might", "would", "could"], "Students ___ turn off their phones during class. It's the rule.", "규칙이므로 의무의 must."],
    ["should", ["must not", "don't have to", "would"], "You look really tired. You ___ go to bed early tonight.", "충고·조언이므로 should(~하는 게 좋겠다)."],
    ["should", ["must not", "don't have to", "would"], "You have a big test tomorrow. You ___ review your notes tonight.", "조언이므로 should."],
    ["should", ["must not", "don't have to", "would"], "It's very cold outside. You ___ wear a warm coat.", "조언이므로 should."],
    ["don't have to", ["must", "have to", "should"], "The test was canceled, so you ___ study tonight.", "'~할 필요가 없다'는 don't have to. must not(금지)과 구별할 것."],
    ["don't have to", ["must", "have to", "should"], "It's Saturday, so we ___ wear our school uniforms.", "필요 없음을 나타내는 don't have to."],
    ["don't have to", ["must", "have to", "should"], "I already washed the dishes, so you ___ do them.", "이미 끝났으니 '할 필요가 없다' = don't have to."],
    ["must not", ["don't have to", "may", "can"], "You ___ run near the swimming pool. It's dangerous.", "금지는 must not(~하면 안 된다). don't have to는 '할 필요 없다'."],
    ["must not", ["don't have to", "may", "can"], "You ___ feed the animals at the zoo. It's against the rules.", "규칙 위반 금지이므로 must not."],
    ["must not", ["don't have to", "may", "can"], "You ___ use your phone during the test.", "시험 중 금지이므로 must not."],
    ["might", ["must", "should", "would"], "Take an umbrella with you. It ___ rain this afternoon.", "불확실한 가능성(~일지도 모른다)은 might."],
    ["might", ["must", "should", "would"], "Dress warmly. It ___ snow tonight.", "가능성을 나타내는 might."],
    ["might", ["must", "should", "would"], "Ask Somin. She ___ know the answer.", "추측·가능성이므로 might."],
  ];
  for (const [c, d, stem, note] of MODAL) add(c, d, stem, note, 2, ["modal"]);

  // --- 11) 수동태 ---
  const PASSIVE = [
    ["The letter", false, "write", "wrote", "written", "my grandmother", "fifty years ago"],
    ["This book", false, "write", "wrote", "written", "a famous writer", "in 1995"],
    ["The bridge", false, "build", "built", "built", "hundreds of workers", "a long time ago"],
    ["Our school", false, "build", "built", "built", "the city", "in 1980"],
    ["These cookies", true, "bake", "baked", "baked", "my aunt", "this morning"],
    ["The telephone", false, "invent", "invented", "invented", "Alexander Graham Bell", "in 1876"],
    ["This picture", false, "paint", "painted", "painted", "my little sister", "last week"],
    ["The song", false, "sing", "sang", "sung", "the whole class", "at the festival"],
    ["The trees", true, "plant", "planted", "planted", "the students", "last spring"],
    ["The movie", false, "make", "made", "made", "a Korean director", "in 2019"],
    ["The window", false, "break", "broke", "broken", "the strong wind", "last night"],
    ["The cake", false, "make", "made", "made", "Mom", "for my birthday"],
  ];
  for (const [subj, plural, base, past, pp, agent, time] of PASSIVE) {
    const be = plural ? "were" : "was", isare = plural ? "are" : "is";
    const cor = `${be} ${pp}`;
    add(cor, [past, `${isare} ${ing(base)}`, plural ? base : third(base)],
      `${subj} ___ by ${agent} ${time}.`,
      `주어(${subj})가 동작을 '받는' 대상이므로 수동태(be + p.p.)를 쓴다. 과거이므로 '${cor}'.`, 3, ["passive", "tense"]);
  }

  // --- 12) 대명사 ---
  const POSS = [
    ["hers", ["her", "she", "herself"], "Sara is looking for her umbrella. I think this blue one is ___.", "'그녀의 것'은 소유대명사 hers. her는 뒤에 명사가 필요하다."],
    ["his", ["him", "he", "himself"], "Tom lost his cap yesterday. Maybe this red one is ___.", "'그의 것'은 소유대명사 his."],
    ["mine", ["my", "me", "myself"], "That seat is ___. I put my bag on it first.", "'나의 것'은 소유대명사 mine."],
    ["ours", ["our", "us", "ourselves"], "My class painted this wall, so the design is ___.", "'우리의 것'은 소유대명사 ours."],
    ["theirs", ["their", "them", "themselves"], "The twins built that sandcastle. It's ___.", "'그들의 것'은 소유대명사 theirs."],
    ["yours", ["your", "you", "yourself"], "Is this pencil case ___? It was under your chair.", "'너의 것'은 소유대명사 yours."],
  ];
  for (const [c, d, stem, note] of POSS) add(c, d, stem, note, 1, ["pronoun", "possessive"]);
  const REFL = [
    ["herself", ["her", "hers", "she"], "She baked this cake all by ___.", "'혼자서, 스스로'는 by + 재귀대명사. she → herself."],
    ["himself", ["him", "his", "he"], "He built the model plane all by ___.", "he → himself."],
    ["myself", ["me", "my", "mine"], "I finished the puzzle all by ___.", "I → myself."],
    ["themselves", ["them", "their", "theirs"], "The kids set up the tent all by ___.", "they → themselves."],
    ["ourselves", ["us", "our", "ours"], "We made this poster all by ___.", "we → ourselves."],
  ];
  for (const [c, d, stem, note] of REFL) add(c, d, stem, note, 2, ["pronoun", "reflexive"]);
  const REL = [
    ["who", ["which", "whose", "whom"], "The girl ___ won the speech contest is my neighbor.", "선행사가 사람이고 관계절의 주어 역할 → 주격 who."],
    ["who", ["which", "whose", "whom"], "The man ___ lives next door has two big dogs.", "사람 + 주어 역할 → who."],
    ["who", ["which", "whose", "whom"], "I have a friend ___ can speak three languages.", "사람 + 주어 역할 → who."],
    ["which", ["who", "whose", "whom"], "The movie ___ we watched last night was really funny.", "선행사가 사물(movie) → which. who는 사람에 사용."],
    ["which", ["who", "whose", "whom"], "The cake ___ Mom baked yesterday is already gone.", "사물(cake) → which."],
    ["which", ["who", "whose", "whom"], "This is the song ___ always makes me happy.", "사물(song) → which."],
    ["whose", ["who", "which", "whom"], "The boy ___ bike was stolen looked very sad.", "'~의'라는 소유 관계 + 명사(bike) → 소유격 whose."],
    ["whose", ["who", "which", "whom"], "I met a girl ___ father is a pilot.", "소유 관계(그녀의 아버지) → whose."],
  ];
  for (const [c, d, stem, note] of REL) add(c, d, stem, note, 3, ["relative-clause", "pronoun"]);
  const OBJ = [
    ["him", ["he", "his", "himself"], "Do you see that man over there? I met ___ at the library yesterday.", "동사 met의 목적어 자리 → 목적격 him."],
    ["her", ["she", "hers", "herself"], "Mina is very kind. Everyone in class likes ___.", "동사 likes의 목적어 자리 → 목적격 her."],
    ["them", ["they", "their", "themselves"], "The puppies are so cute. Grandma feeds ___ every morning.", "동사 feeds의 목적어 자리 → 목적격 them."],
    ["us", ["we", "our", "ourselves"], "Our teacher told ___ a funny story before class ended.", "동사 told의 목적어 자리 → 목적격 us."],
  ];
  for (const [c, d, stem, note] of OBJ) add(c, d, stem, note, 1, ["pronoun", "object"]);

  // --- 13) 품사(형용사/부사) ---
  const ADV = [
    ["quiet", "quietly", "Please speak ___. The baby is sleeping."],
    ["careful", "carefully", "He drives very ___ on snowy roads."],
    ["easy", "easily", "She solved the hard puzzle ___."],
    ["beautiful", "beautifully", "The choir sang ___ at the concert."],
    ["slow", "slowly", "Walk ___ on the wet floor."],
    ["polite", "politely", "He answered the teacher's question ___."],
    ["loud", "loudly", "The dog barked ___ at the mail carrier."],
    ["happy", "happily", "She smiled ___ when she saw the puppy."],
    ["quick", "quickly", "Finish your snack ___. The bus is coming."],
    ["safe", "safely", "The plane landed ___ despite the storm."],
  ];
  for (const [adj, adv, frame] of ADV) {
    const long = ["careful", "beautiful", "polite"].includes(adj);
    const comp = adj.endsWith("y") ? adj.slice(0, -1) + "ier" : long ? "more " + adj : adj.endsWith("e") ? adj + "r" : adj + "er";
    const sup = adj.endsWith("y") ? adj.slice(0, -1) + "iest" : long ? "most " + adj : adj.endsWith("e") ? adj + "st" : adj + "est";
    add(adv, [adj, comp, sup], frame, `동사를 꾸미는 자리이므로 부사 '${adv}'를 쓴다. '${adj}'는 형용사.`, 1, ["adverb", "word-form"]);
  }
  const SOTHAT = [
    ["difficult", "The problem was so ___ that nobody could solve it."],
    ["heavy", "The box was so ___ that we couldn't lift it."],
    ["funny", "The video was so ___ that I couldn't stop laughing."],
    ["cold", "It was so ___ that we stayed inside all day."],
    ["loud", "The music was so ___ that I covered my ears."],
    ["dark", "The cave was so ___ that we couldn't see anything."],
    ["tall", "The tower was so ___ that we couldn't see the top."],
    ["sweet", "The candy was so ___ that I drank two glasses of water."],
  ];
  for (const [adj, frame] of SOTHAT) {
    const isLong = ["difficult"].includes(adj);
    const comp = isLong ? "more " + adj : (adj.endsWith("y") ? adj.slice(0, -1) + "ier" : adj + "er");
    const sup = isLong ? "most " + adj : (adj.endsWith("y") ? adj.slice(0, -1) + "iest" : adj + "est");
    const advf = adj.endsWith("y") ? adj.slice(0, -1) + "ily" : adj + "ly";
    add(adj, [advf, comp, sup], frame, `'so + 형용사 + that' 구문. be동사 뒤 보어 자리이므로 형용사 원급 '${adj}'.`, 2, ["word-form", "so-that"]);
  }

  // --- 14) 접속사 ---
  const CONJ = [
    ["Although", ["Because", "If", "Until"], "___ it was raining, they played soccer outside.", "앞뒤 내용이 반대(비가 왔지만 밖에서 축구)이므로 양보의 Although(~에도 불구하고)."],
    ["Although", ["Because", "If", "Until"], "___ he was very tired, he finished all his homework.", "역접 관계이므로 Although."],
    ["because", ["although", "until", "while"], "We took a taxi ___ we missed the bus.", "이유를 나타내므로 because(~때문에)."],
    ["because", ["although", "until", "if"], "She wore a thick coat ___ it was freezing outside.", "이유이므로 because."],
    ["until", ["because", "although", "so"], "Wait at the gate ___ I come back.", "'~할 때까지'는 until."],
    ["until", ["because", "although", "so"], "The baby cried ___ her mom picked her up.", "'~할 때까지'는 until."],
    ["while", ["because", "if", "until"], "Jun likes math, ___ his sister likes art.", "두 사람을 대조하므로 while(반면에)."],
    ["while", ["because", "if", "although"], "Dad cooked dinner ___ I set the table.", "'~하는 동안'의 while."],
    ["If", ["Although", "Until", "While"], "___ you hurry, you will catch the school bus.", "조건을 나타내므로 If(만약 ~라면)."],
    ["if", ["although", "until", "while"], "We will go camping this weekend ___ the weather is nice.", "조건의 if."],
    ["so", ["because", "although", "if"], "It was raining hard, ___ we stayed inside.", "'그래서'라는 결과를 나타내는 so. because는 원인 앞에 쓴다."],
    ["so", ["because", "although", "if"], "I was very hungry, ___ I made a sandwich.", "결과의 so."],
    ["before", ["because", "until", "although"], "Look both ways ___ you cross the street.", "'~하기 전에'는 before."],
    ["After", ["Until", "Although", "If"], "___ the movie ended, we went out for pizza.", "'~한 후에'는 After."],
    ["before", ["because", "until", "although"], "Brush your teeth ___ you go to bed.", "'~하기 전에'는 before."],
  ];
  for (const [c, d, stem, note] of CONJ) add(c, d, stem, note, 3, ["conjunction"]);

  // --- 15) 동사 + 목적어 + to부정사 ---
  const V_OBJ_TO = [
    ["to be", ["be", "being", "been"], "The teacher asked us ___ quiet during the test.", "ask + 목적어 + to부정사: '~에게 …하라고 요청하다'."],
    ["to clean", ["clean", "cleaning", "cleaned"], "Mom told me ___ my room before dinner.", "tell + 목적어 + to부정사: '~에게 …하라고 말하다'."],
    ["to bring", ["bring", "bringing", "brought"], "Mr. Lee told everyone ___ their textbooks tomorrow.", "tell + 목적어 + to부정사."],
    ["to join", ["join", "joining", "joined"], "My friends want me ___ the science club.", "want + 목적어 + to부정사: '~가 …하기를 원하다'."],
    ["to finish", ["finish", "finishing", "finished"], "The coach asked the players ___ the warm-up first.", "ask + 목적어 + to부정사."],
    ["to wash", ["wash", "washing", "washed"], "Dad wants us ___ our hands before every meal.", "want + 목적어 + to부정사."],
    ["to drink", ["drink", "drinking", "drank"], "The doctor advised her ___ more water every day.", "advise + 목적어 + to부정사: '~에게 …하라고 조언하다'."],
    ["to feed", ["feed", "feeding", "fed"], "Grandma asked me ___ the goldfish while she was away.", "ask + 목적어 + to부정사."],
    ["to turn", ["turn", "turning", "turned"], "The librarian told the students ___ off their phones.", "tell + 목적어 + to부정사."],
    ["to try", ["try", "trying", "tried"], "My teacher wants me ___ out for the school play.", "want + 목적어 + to부정사."],
  ];
  for (const [c, d, stem, note] of V_OBJ_TO) add(c, d, stem, note, 2, ["infinitive", "verb-pattern"]);

  // --- 16) 관사 ---
  const ART = [
    ["an", "I eat ___ apple every morning before school.", "apple은 모음 소리로 시작하므로 an."],
    ["an", "Take ___ umbrella with you. It looks like rain.", "umbrella는 모음 소리로 시작 → an."],
    ["an", "We saw ___ elephant at the zoo last weekend.", "elephant는 모음 소리로 시작 → an."],
    ["an", "She had ___ egg and some toast for breakfast.", "egg는 모음 소리로 시작 → an."],
    ["an", "He is ___ honest boy, so everyone trusts him.", "honest는 h가 묵음이라 모음 소리로 시작 → an."],
    ["an", "The show starts in ___ hour, so let's hurry.", "hour는 h가 묵음이라 모음 소리로 시작 → an."],
    ["an", "That's ___ interesting idea! Let's try it.", "interesting은 모음 소리로 시작 → an."],
    ["a", "My aunt is ___ doctor at the children's hospital.", "doctor는 자음 소리로 시작 → a."],
    ["a", "He bought ___ bicycle with his birthday money.", "bicycle은 자음 소리로 시작 → a."],
    ["a", "I made ___ sandwich for the picnic.", "sandwich는 자음 소리로 시작 → a."],
    ["a", "My cousin studies at ___ university in Seoul.", "university는 [ju] 자음 소리로 시작하므로 a. (철자가 아니라 소리 기준!)"],
    ["the", "___ sun rises in the east.", "세상에 하나뿐인 것(the sun) 앞에는 the."],
    ["the", "Look at ___ moon! It's so bright tonight.", "유일한 것(the moon) 앞에는 the."],
    ["the", "She is ___ tallest girl in our class.", "최상급 앞에는 the."],
    ["the", "He won first prize in ___ same contest last year.", "same 앞에는 항상 the."],
  ];
  for (const [c, stem, note] of ART) {
    const cap = /^___/.test(stem);
    add(cap ? c.charAt(0).toUpperCase() + c.slice(1) : c,
      cap ? ["A", "An", "The", "Some"].filter(x => x.toLowerCase() !== c) : ["a", "an", "the", "some"].filter(x => x !== c),
      stem, note, 1, ["article"]);
  }

  // --- 17) 수 일치 ---
  const AGREE = [
    ["is", ["are", "be", "were"], "Everyone in my class ___ excited about the field trip.", "everyone은 단수 취급 → is."],
    ["likes", ["like", "liking", "are liking"], "Everybody ___ the new music teacher.", "everybody는 단수 취급 → likes."],
    ["are", ["is", "be", "been"], "There ___ many students in the gym right now.", "many students(복수)가 실제 주어 → are."],
    ["is", ["are", "be", "were"], "There ___ a big library near my house.", "a big library(단수) → is."],
    ["has", ["have", "having", "are having"], "Each of the students ___ a tablet for class.", "each of + 복수명사는 단수 취급 → has."],
    ["play", ["plays", "playing", "is playing"], "My brother and I ___ badminton every weekend.", "A and B는 복수 주어 → play."],
    ["lives", ["live", "living", "are living"], "One of my best friends ___ in Busan.", "one of + 복수명사는 단수 취급 → lives."],
    ["is", ["are", "be", "were"], "Math ___ my favorite subject this year.", "과목 이름(Math)은 단수 취급 → is."],
    ["is", ["are", "be", "were"], "The news about the contest ___ very surprising.", "news는 셀 수 없는 명사로 단수 취급 → is."],
    ["are", ["is", "be", "been"], "My new shoes ___ a little too big for me.", "shoes(복수) → are."],
    ["wants", ["want", "wanting", "are wanting"], "Nobody in our group ___ to give up.", "nobody는 단수 취급 → wants."],
    ["are", ["is", "be", "been"], "Both of my parents ___ good at cooking.", "both는 복수 취급 → are."],
  ];
  for (const [c, d, stem, note] of AGREE) add(c, d, stem, note, 2, ["subject-verb-agreement"]);

  // --- 18) 의문사 ---
  const QW = [
    ["How", "___ do you get to school? — By bus.", "교통수단을 묻는 의문사는 How."],
    ["Where", "___ is your umbrella? — It's in the car.", "장소를 묻는 의문사는 Where."],
    ["Why", "___ did you call me last night? — Because I needed your help.", "이유(Because ~)로 답했으므로 Why."],
    ["When", "___ is the school festival? — Next Friday.", "때를 묻는 의문사는 When."],
    ["Who", "___ made this delicious cake? — My grandmother did.", "사람을 묻는 의문사는 Who."],
    ["Which", "___ bag is yours, the red one or the blue one?", "정해진 것 중 선택을 물을 때는 Which."],
    ["What", "___ time do you usually get up? — At seven.", "시각을 물을 때는 What time."],
    ["How", "___ often do you exercise? — Three times a week.", "빈도를 물을 때는 How often."],
    ["What", "___ is your favorite season? — I love winter.", "무엇인지 물을 때는 What."],
    ["How", "___ old is your little brother? — He is five.", "나이를 물을 때는 How old."],
  ];
  const QW_ALL = ["What", "When", "Where", "Why", "How", "Which", "Who"];
  for (const [c, stem, note] of QW) add(c, QW_ALL.filter(x => x !== c), stem, note, 1, ["question-word"]);

  return out;
}

// ============================================================
//  ADVENTURE 생성기
// ============================================================
function genADV() {
  const out = [];
  const add = (passage, correct, pool, stem, explanation, difficulty, tags) =>
    out.push(mcq("adventure", correct, pool, { passage, stem, explanation, difficulty, tags }));

  // --- S1) 잃어버린 물건 ---
  const ITEMS = ["library book", "pencil case", "water bottle", "lunch box", "bus card", "music notebook", "red cap", "house key"];
  const PLACES = ["in the kitchen", "under the sofa", "in the car", "on the piano", "inside the washing machine", "on the balcony"];
  const HELPERS = ["little sister", "big brother", "dad", "mom", "grandmother"];
  for (let i = 0; i < 28; i++) {
    const P = person(), item = pick(ITEMS), place = pick(PLACES), helper = pick(HELPERS), day = pick(DAYS.slice(0, 5));
    const passage = `${P.n} could not find ${P.his} ${item} on ${day} morning. ${P.He} looked under the bed and behind the desk. ${P.He} even checked the bathroom. Finally, ${P.his} ${helper} found it ${place}. ${P.n} laughed and said, "I will put it in my backpack tonight!"`;
    add(passage, item, ITEMS, `What was ${P.n} looking for?`,
      `첫 문장에서 '${P.n} could not find ${P.his} ${item}'라고 했으므로 ${P.n}이(가) 찾던 것은 '${item}'이다.`, 1, ["story", "detail"]);
    add(passage, place, PLACES.concat(["under the bed", "behind the desk", "in the bathroom"]), `Where was the ${item}?`,
      `'found it ${place}'라고 했다. 침대 밑, 책상 뒤, 욕실은 찾아봤지만 없던 곳이므로 함정!`, 2, ["story", "detail"]);
    add(passage, `${P.His} ${helper}`, HELPERS.filter(h => h !== helper).map(h => `${P.His} ${h}`).concat([`${P.n}`]), `Who found the ${item}?`,
      `'${P.his} ${helper} found it'라고 했으므로 정답은 '${P.His} ${helper}'.`, 1, ["story", "detail"]);
  }

  // --- S2) 대회 이야기 ---
  const EVENTS2 = ["swimming race", "piano contest", "spelling contest", "taekwondo match", "art contest", "speech contest"];
  const FEELS = ["nervous", "worried", "excited"];
  const ORD = ["first", "second", "third"];
  for (let i = 0; i < 16; i++) {
    const P = person(), ev = pick(EVENTS2), feel = pick(FEELS), ord = pick(ORD);
    const passage = `${P.n} was ${feel} before the ${ev}. ${P.His} teacher patted ${P.his} shoulder and said, "Remember what we practiced. Take a deep breath." ${P.n} nodded and did ${P.his} best. When the results came out, ${P.he} had won ${ord} prize! ${P.He} could not stop smiling.`;
    add(passage, feel, FEELS.concat(["bored", "sleepy", "angry"]), `How did ${P.n} feel before the ${ev}?`,
      `첫 문장 '${P.n} was ${feel}'에서 그대로 알 수 있다. ${feel} = ${feel === "nervous" ? "긴장한" : feel === "worried" ? "걱정하는" : "신난"}.`, 1, ["story", "feeling"]);
    add(passage, `${ord} prize`, ORD.filter(o => o !== ord).map(o => `${o} prize`).concat(["no prize"]), `What did ${P.n} win?`,
      `'${P.he} had won ${ord} prize'라고 했으므로 정답은 '${ord} prize'.`, 1, ["story", "detail"]);
  }

  // --- S3) 계획 대화 ---
  const EVENTS3 = ["school festival", "book fair", "science fair", "basketball game", "magic show", "art exhibition"];
  const CHORES = ["finish my math homework", "walk my dog", "clean my room", "water the plants", "return some library books"];
  const MEET = ["main gate", "bus stop", "library entrance", "school cafeteria", "playground"];
  const TIMES3 = [["2 p.m.", "1:40"], ["3 p.m.", "2:30"], ["5 p.m.", "4:45"], ["noon", "11:30 a.m."]];
  for (let i = 0; i < 21; i++) {
    const A = person(); let B = person(); while (B.n === A.n) B = person();
    const ev = pick(EVENTS3), chore = pick(CHORES), mt = pick(MEET), [t1, t2] = pick(TIMES3), day = pick(DAYS);
    const passage = `${A.n}: Are you coming to the ${ev} on ${day}?\n${B.n}: I want to, but I have to ${chore} first.\n${A.n}: It starts at ${t1}. You have enough time.\n${B.n}: OK! Let's meet at the ${mt} at ${t2}.`;
    add(passage, chore, CHORES, `What does ${B.n} have to do first?`,
      `${B.n}이(가) 'I have to ${chore} first'라고 말했다.`, 1, ["dialogue", "detail"]);
    add(passage, `At the ${mt}`, MEET.filter(m => m !== mt).map(m => `At the ${m}`), `Where will they meet?`,
      `'Let's meet at the ${mt}'라고 했으므로 만나는 장소는 '${mt}'.`, 1, ["dialogue", "detail"]);
    add(passage, t1, TIMES3.flat().filter(t => t !== t1), `What time does the ${ev} start?`,
      `'It starts at ${t1}'라고 했다. ${t2}는 만나기로 한 시각이므로 함정!`, 2, ["dialogue", "detail"]);
  }

  // --- S4) 시설 휴관 공지 ---
  const FAC = [
    ["swimming pool", "do stretching exercises in the gym"],
    ["computer room", "use the library computers"],
    ["music room", "practice singing in Classroom 2B"],
    ["school library", "return books at the front office"],
    ["gym", "exercise outside on the playground"],
  ];
  const REASONS = ["cleaning", "repairs", "painting"];
  const CLOSE = [["from Monday to Wednesday", "Thursday"], ["on Tuesday and Wednesday", "Thursday"], ["on Monday and Tuesday", "Wednesday"], ["from Wednesday to Friday", "Monday"]];
  for (let i = 0; i < 13; i++) {
    const [fac, alt] = pick(FAC), reason = pick(REASONS), [range, reopen] = pick(CLOSE);
    const passage = `NOTICE: The school ${fac} will be closed ${range} for ${reason}. Classes that use the ${fac} will ${alt} instead. The ${fac} will reopen on ${reopen} morning.`;
    add(passage, `On ${reopen}`, ["On Monday", "On Tuesday", "On Wednesday", "On Thursday", "On Friday", "Next Monday"].filter(x => x.toLowerCase() !== ("on " + reopen).toLowerCase()), `When will the ${fac} open again?`,
      `'will reopen on ${reopen} morning'이라고 했다. reopen = 다시 열다.`, 1, ["notice", "detail"]);
    add(passage, `For ${reason}`, REASONS.filter(x => x !== reason).map(x => `For ${x}`).concat(["For a school event"]), `Why will the ${fac} be closed?`,
      `'closed ${range} for ${reason}'에서 휴관 이유는 '${reason}'.`, 1, ["notice", "detail"]);
    add(passage, alt.charAt(0).toUpperCase() + alt.slice(1), FAC.filter(f => f[1] !== alt).map(f => f[1].charAt(0).toUpperCase() + f[1].slice(1)), `What will classes do while the ${fac} is closed?`,
      `'will ${alt} instead'라고 안내되어 있다. instead = 대신에.`, 2, ["notice", "detail"]);
  }

  // --- S5) 현장학습 안내문 ---
  const DEST = ["city museum", "science center", "national park", "art gallery", "fire station", "chocolate factory"];
  const TIMES5 = [["9 a.m.", "8:40"], ["8:30 a.m.", "8:10"], ["10 a.m.", "9:45"]];
  const BRING = ["your lunch and a notebook", "a water bottle and a hat", "your sketchbook and colored pencils", "comfortable shoes and a snack"];
  const BAN = ["money for the game machines", "your tablet", "glass bottles"];
  const TEACH = ["Mr. Park", "Ms. Kim", "Mr. Lee", "Ms. Choi"];
  for (let i = 0; i < 16; i++) {
    const dest = pick(DEST), [t1, t2] = pick(TIMES5), bring = pick(BRING), ban = pick(BAN), t = pick(TEACH), day = pick(DAYS.slice(0, 5));
    const passage = `Dear students,\nOur field trip to the ${dest} is on ${day}. The bus leaves at ${t1} sharp, so please arrive at school by ${t2}. Bring ${bring}. Please do not bring ${ban}.\n- ${t}`;
    add(passage, `By ${t2}`, TIMES5.flat().filter(x => x !== t2).map(x => `By ${x}`), `What time should students arrive at school?`,
      `버스가 ${t1} 정각(sharp)에 출발하므로 '${t2}까지 도착'하라고 안내했다. by = ~까지.`, 2, ["notice", "detail"]);
    add(passage, `To the ${dest}`, DEST.filter(d => d !== dest).map(d => `To the ${d}`), `Where will the students go on ${day}?`,
      `'field trip to the ${dest}'라고 했으므로 목적지는 '${dest}'.`, 1, ["notice", "detail"]);
    add(passage, ban.charAt(0).toUpperCase() + ban.slice(1), BRING.map(b => b.charAt(0).toUpperCase() + b.slice(1)), `What should students NOT bring?`,
      `'do not bring ${ban}'이라고 했다. 가져올 것(${bring})과 혼동하지 않기!`, 2, ["notice", "detail"]);
  }

  // --- S6) 동물 상식 ---
  const ANIMALS = [
    { p: "Dolphins are very smart ocean animals. They talk to each other with clicks and whistles. They also sleep with one eye open to watch for danger.",
      qs: [["How do dolphins talk to each other?", "With clicks and whistles", ["With their tails", "By jumping high", "With bright colors"], "'talk to each other with clicks and whistles'라고 했다."],
           ["Why do dolphins sleep with one eye open?", "To watch for danger", ["To see their dreams", "To count fish", "To find their family"], "'to watch for danger'(위험을 살피기 위해)라고 했다."]] },
    { p: "Camels are perfect desert animals. They store fat in their humps, so they can travel for days without food. Their long eyelashes keep the sand out of their eyes.",
      qs: [["What do camels store in their humps?", "Fat", ["Water", "Sand", "Food"], "'store fat in their humps'라고 했다. 물이 아니라 지방(fat)이라는 점이 포인트!"],
           ["How do long eyelashes help camels?", "They keep sand out of their eyes", ["They keep them cool", "They help them see far", "They attract other camels"], "'keep the sand out of their eyes'(모래가 눈에 들어가지 않게)라고 했다."]] },
    { p: "Penguins are birds, but they cannot fly. Instead, they are excellent swimmers. Penguin parents take turns keeping their egg warm on their feet.",
      qs: [["What can penguins do very well?", "Swim", ["Fly", "Climb trees", "Run fast"], "'they are excellent swimmers'라고 했다. 날지는 못한다(cannot fly)."],
           ["How do penguin parents care for their egg?", "They take turns keeping it warm", ["They bury it in the snow", "They carry it in their beaks", "They leave it in the sun"], "'take turns keeping their egg warm'(번갈아 가며 알을 따뜻하게)이라고 했다. take turns = 교대로 하다."]] },
    { p: "Owls hunt at night. They can turn their heads almost all the way around to look behind them. Their special wings make almost no sound when they fly.",
      qs: [["When do owls hunt?", "At night", ["In the morning", "At noon", "Only in winter"], "첫 문장 'Owls hunt at night'에서 알 수 있다."],
           ["Why are owls quiet when they fly?", "Their special wings make almost no sound", ["They fly very slowly", "They are very small", "They only fly in the rain"], "'special wings make almost no sound'라고 했다."]] },
    { p: "Elephants use their long trunks like hands. They can pick up tiny peanuts or heavy logs with them. Elephants also flap their big ears to stay cool on hot days.",
      qs: [["How do elephants use their trunks?", "Like hands", ["Like wings", "Like umbrellas", "Like pillows"], "'use their long trunks like hands'(코를 손처럼 사용)라고 했다."],
           ["Why do elephants flap their ears?", "To stay cool", ["To fly", "To say hello", "To scare birds"], "'flap their big ears to stay cool'(더울 때 시원해지려고)이라고 했다."]] },
    { p: "Sea turtles travel thousands of kilometers across the ocean. Amazingly, mother turtles return to the same beach where they were born to lay their own eggs.",
      qs: [["Where do mother sea turtles lay their eggs?", "On the beach where they were born", ["On any warm island", "In the deep sea", "In a river"], "'return to the same beach where they were born'(자기가 태어난 바로 그 해변으로 돌아간다)이라고 했다."],
           ["The word \"return\" is closest in meaning to ______.", "go back", ["swim fast", "sleep", "grow up"], "return = 되돌아가다(go back)."]] },
    { p: "An octopus has three hearts and blue blood. It can change the color of its skin in one second to hide from enemies. It can also squeeze its soft body into very small spaces.",
      qs: [["How many hearts does an octopus have?", "Three", ["One", "Two", "Four"], "'has three hearts'라고 했다."],
           ["Why does an octopus change its skin color?", "To hide from enemies", ["To look pretty", "To stay warm", "To call its friends"], "'to hide from enemies'(적에게서 숨기 위해)라고 했다."]] },
    { p: "Kangaroos carry their babies in a pouch on their stomachs. A baby kangaroo is called a joey. Kangaroos can hop very fast, but they cannot walk backward.",
      qs: [["What is a baby kangaroo called?", "A joey", ["A cub", "A pup", "A calf"], "'A baby kangaroo is called a joey'라고 했다."],
           ["What can kangaroos NOT do?", "Walk backward", ["Hop fast", "Carry their babies", "Jump high"], "'they cannot walk backward'(뒤로 걷지 못한다)라고 했다."]] },
    { p: "Polar bears look white, but their skin is actually black. They are strong swimmers and can smell a seal from very far away.",
      qs: [["What color is a polar bear's skin?", "Black", ["White", "Pink", "Brown"], "'their skin is actually black'라고 했다. 털이 아니라 피부 색을 묻는 것이 포인트!"],
           ["What can polar bears smell from far away?", "A seal", ["A fish", "A penguin", "Honey"], "'can smell a seal from very far away'라고 했다."]] },
    { p: "Giraffes are the tallest animals in the world. They use their long purple tongues to grab leaves from tall trees. Giraffes sleep only about thirty minutes a day.",
      qs: [["How do giraffes get leaves from tall trees?", "With their long tongues", ["With their front legs", "By shaking the trees", "By jumping"], "'use their long purple tongues to grab leaves'라고 했다."],
           ["How long do giraffes sleep each day?", "About thirty minutes", ["About eight hours", "About half the day", "They never sleep"], "'sleep only about thirty minutes a day'라고 했다."]] },
    { p: "Ants are tiny but amazingly strong. An ant can carry things fifty times heavier than its own body. Ants leave a special smell on the ground so other ants can follow the same path.",
      qs: [["How strong is an ant?", "It can carry things fifty times heavier than its body", ["It can lift a person", "It is weaker than it looks", "It can only carry leaves"], "'carry things fifty times heavier than its own body'라고 했다."],
           ["Why do ants leave a smell on the ground?", "So other ants can follow the path", ["To scare enemies", "To find water", "To mark their homes"], "'so other ants can follow the same path'(다른 개미들이 길을 따라올 수 있도록)라고 했다."]] },
    { p: "Bats are the only mammals that can truly fly. They make high sounds and listen to the echoes to find insects in the dark. During the day, bats sleep hanging upside down.",
      qs: [["How do bats find insects in the dark?", "By listening to echoes", ["By using their sharp eyes", "By following the moonlight", "By smelling them"], "'listen to the echoes to find insects'(메아리를 듣고 곤충을 찾는다)라고 했다."],
           ["How do bats sleep?", "Hanging upside down", ["Lying on leaves", "Standing on one leg", "Floating on water"], "'sleep hanging upside down'(거꾸로 매달려 잔다)라고 했다."]] },
    { p: "Chameleons can change their skin color when they feel angry or cold. Their eyes can move in two different directions at the same time. They catch bugs with their long, sticky tongues.",
      qs: [["When do chameleons change color?", "When they feel angry or cold", ["Only at night", "When they are hungry", "When they swim"], "'when they feel angry or cold'라고 했다."],
           ["What is special about a chameleon's eyes?", "They can move in two directions at once", ["They glow in the dark", "They are always closed", "They can see through walls"], "'move in two different directions at the same time'라고 했다."]] },
    { p: "Parrots are colorful birds that can copy human words. Some parrots live longer than eighty years. Their strong, curved beaks can crack open hard nuts easily.",
      qs: [["What can parrots copy?", "Human words", ["Dance moves", "Other birds' nests", "Songs on the radio only"], "'can copy human words'(사람의 말을 따라 할 수 있다)라고 했다."],
           ["How long can some parrots live?", "More than eighty years", ["About five years", "About twenty years", "Only one year"], "'live longer than eighty years'라고 했다."]] },
    { p: "In autumn, squirrels hide nuts in the ground for the winter. They forget where some of the nuts are. Those forgotten nuts often grow into new trees in spring.",
      qs: [["Why do squirrels hide nuts?", "To save food for the winter", ["To plant new trees on purpose", "To play a game", "To feed the birds"], "'hide nuts in the ground for the winter'(겨울에 대비해)라고 했다."],
           ["What happens to the forgotten nuts?", "They grow into new trees", ["Birds eat all of them", "They disappear", "Squirrels sell them"], "'often grow into new trees in spring'이라고 했다."]] },
    { p: "Blue whales are the biggest animals that have ever lived on Earth. Even though they live in the sea, they breathe air like we do. Their songs can be heard hundreds of kilometers away.",
      qs: [["What do blue whales breathe?", "Air", ["Water", "Seaweed", "Salt"], "'they breathe air like we do'(우리처럼 공기로 숨 쉰다)라고 했다."],
           ["How far can a blue whale's song travel?", "Hundreds of kilometers", ["Only a few meters", "Across one swimming pool", "To the moon"], "'heard hundreds of kilometers away'라고 했다."]] },
    { p: "Fireflies make their own light to talk to each other. Each kind of firefly flashes its light in a different pattern. On summer nights, fields full of fireflies look like blinking stars.",
      qs: [["Why do fireflies make light?", "To talk to each other", ["To warm their bodies", "To cook food", "To scare cats"], "'make their own light to talk to each other'라고 했다."],
           ["What do fields full of fireflies look like?", "Blinking stars", ["A rainbow", "A campfire", "Street lights"], "'look like blinking stars'(반짝이는 별처럼 보인다)라고 했다."]] },
  ];
  for (const a of ANIMALS) for (const [stem, cor, ds, expl] of a.qs) {
    add(a.p, cor, ds, stem, expl, 2, ["nonfiction", "detail"]);
  }

  // --- S7) 대회 포스터 대화 ---
  const ORGS = ["school library", "art club", "science club", "city library"];
  const CONTESTS = [["book-reading contest", "reads five books"], ["poster contest", "enters a poster"], ["quiz contest", "answers ten questions"], ["photo contest", "sends in three photos"]];
  const PRIZE1 = ["a $30 gift card", "a new backpack", "two movie tickets", "a board game set"];
  const PRIZE2 = ["a free bookmark", "a small sticker set", "a cookie coupon", "a cute keyring"];
  for (let i = 0; i < 13; i++) {
    const A = person(); let B = person(); while (B.n === A.n) B = person();
    const org = pick(ORGS), [contest, cond] = pick(CONTESTS), p1 = pick(PRIZE1), p2 = pick(PRIZE2);
    const passage = `${A.n}: Look at this poster! The ${org} is having a ${contest}.\n${B.n}: Cool! What's the prize?\n${A.n}: The winner gets ${p1}, and everyone who ${cond} gets ${p2}.\n${B.n}: I'm in!`;
    add(passage, p2.charAt(0).toUpperCase() + p2.slice(1), PRIZE2.filter(p => p !== p2).map(p => p.charAt(0).toUpperCase() + p.slice(1)).concat([p1.charAt(0).toUpperCase() + p1.slice(1)]), `What does everyone who ${cond} get?`,
      `우승자(winner)는 ${p1}, '${cond}'를 한 모든 사람(everyone)은 ${p2}를 받는다. 두 상을 혼동하지 않기!`, 2, ["dialogue", "detail"]);
    add(passage, p1.charAt(0).toUpperCase() + p1.slice(1), PRIZE1.filter(p => p !== p1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).concat([p2.charAt(0).toUpperCase() + p2.slice(1)]), `What does the winner get?`,
      `'The winner gets ${p1}'라고 했다.`, 1, ["dialogue", "detail"]);
    add(passage, `${B.n} wants to join the contest`, [`${B.n} is inside the ${org}`, `${B.n} won the contest before`, `${B.n} is reading a book now`], `What does ${B.n} mean by "I'm in"?`,
      `'I'm in'은 '나도 할래/참가할래'라는 관용 표현이다.`, 3, ["dialogue", "idiom"]);
  }

  // --- S8) 가족 나들이 ---
  const OUTING = [
    ["beach", "build a sandcastle", "look for seashells"],
    ["zoo", "see the lions", "watch the penguin show"],
    ["science museum", "try the robot game", "watch the space movie"],
    ["mountain park", "have a picnic", "climb to the top"],
    ["amusement park", "ride the roller coaster", "see the parade"],
    ["river campground", "fish in the river", "make a campfire"],
  ];
  const SIB = ["brother", "sister"];
  for (let i = 0; i < 16; i++) {
    const P = person(), [place, a1, a2] = pick(OUTING), sib = pick(SIB), day = pick(["Saturday", "Sunday"]);
    const passage = `Last ${day}, ${P.n}'s family went to the ${place}. ${P.n} wanted to ${a1}, but ${P.his} little ${sib} wanted to ${a2}. They decided to ${a2} first and then ${a1}. Everyone had a great time.`;
    add(passage, `To the ${place}`, OUTING.filter(o => o[0] !== place).map(o => `To the ${o[0]}`), `Where did ${P.n}'s family go last ${day}?`,
      `'went to the ${place}'라고 했다.`, 1, ["story", "detail"]);
    add(passage, a2.charAt(0).toUpperCase() + a2.slice(1), [a1.charAt(0).toUpperCase() + a1.slice(1)].concat(OUTING.filter(o => o[0] !== place).map(o => o[1].charAt(0).toUpperCase() + o[1].slice(1))), `What did the family do FIRST?`,
      `'decided to ${a2} first and then ${a1}'라고 했으므로 먼저 한 일은 '${a2}'. ${P.n}이(가) 원한 일(${a1})과 순서를 혼동하지 않기!`, 2, ["story", "sequence"]);
    add(passage, `${P.His} little ${sib}`, [`${P.n}`, `${P.His} dad`, `${P.His} grandmother`], `Who wanted to ${a2}?`,
      `'${P.his} little ${sib} wanted to ${a2}'라고 했다.`, 1, ["story", "detail"]);
  }

  // --- S9) 도서관 행사 공지 ---
  const THEMES = ["Ocean Animals", "Space Travel", "Fairy Tales", "Dinosaur World"];
  const ROOMS = ["Reading Room", "Kids' Corner"];
  const STIMES = ["4 p.m.", "3:30 p.m.", "5 p.m."];
  for (let i = 0; i < 10; i++) {
    const theme = pick(THEMES), room = pick(ROOMS), st = pick(STIMES), day = pick(DAYS), n = pick([3, 4, 5]);
    const passage = `LIBRARY NEWS: Story Time is every ${day} at ${st} in the ${room}. This month's theme is "${theme}." Children can borrow up to ${n} books after each event. Please bring your library card.`;
    add(passage, theme, THEMES, `What is this month's Story Time theme?`,
      `'This month's theme is "${theme}"'라고 안내되어 있다.`, 1, ["notice", "detail"]);
    add(passage, `Up to ${n}`, [3, 4, 5, 10].filter(x => x !== n).map(x => `Up to ${x}`), `How many books can children borrow after the event?`,
      `'borrow up to ${n} books'라고 했다. up to = 최대 ~까지.`, 2, ["notice", "detail"]);
  }

  // --- S10) 격려 이야기 ---
  const SETBACK = [
    ["lost the soccer game two to one", "you made the best passes of the season", "practice corner kicks"],
    ["got a low score on the math test", "you solved the hardest problem correctly", "review fractions together"],
    ["dropped the baton in the relay race", "your start was the fastest of all", "practice handoffs"],
    ["forgot some lines in the school play", "your singing was wonderful", "practice with a partner"],
  ];
  const ENC = ["coach", "teacher", "mom", "dad"];
  for (let i = 0; i < 13; i++) {
    const P = person(), [setback, positive, plan] = pick(SETBACK), enc = pick(ENC);
    const passage = `${P.n} ${setback}. On the way home, ${P.he} was very quiet. Then ${P.his} ${enc} said, "Don't worry. ${positive.charAt(0).toUpperCase() + positive.slice(1)}. Next week, let's ${plan}." ${P.n} felt much better and smiled again.`;
    add(passage, `${P.His} ${enc} encouraged ${P.him}`, [`${P.He} won a prize`, `${P.His} friend told a joke`, `${P.He} watched a funny movie`], `Why did ${P.n} feel better?`,
      `${enc}이(가) 잘한 점을 말해 주며 격려(encourage)하자 기분이 나아졌다.`, 2, ["story", "cause-effect"]);
    add(passage, plan.charAt(0).toUpperCase() + plan.slice(1), SETBACK.filter(s => s[2] !== plan).map(s => s[2].charAt(0).toUpperCase() + s[2].slice(1)), `What will they do next week?`,
      `'Next week, let's ${plan}'이라고 했다.`, 1, ["story", "detail"]);
    add(passage, "Upset", ["Excited", "Proud", "Sleepy"], `How did ${P.n} probably feel on the way home at first?`,
      `'${P.he} was very quiet'(아주 조용했다)에서 속상한(upset) 기분을 추론할 수 있다.`, 3, ["story", "inference"]);
  }

  // --- S11) 만들기 설명문 ---
  const CRAFT = [
    ["a paper boat", "fold a square piece of paper in half", "fold the corners to the middle", "open the bottom and press it flat", "a square piece of paper"],
    ["fruit salad", "wash the fruit well", "cut it into small pieces", "mix everything with yogurt", "fresh fruit and yogurt"],
    ["a bookmark", "cut a strip of thick paper", "draw your favorite animal on it", "tape a ribbon to the top", "thick paper and a ribbon"],
    ["a sock puppet", "put a clean sock on your hand", "glue on two button eyes", "draw a mouth with a marker", "a sock and two buttons"],
    ["lemonade", "squeeze three lemons into a jug", "add cold water and sugar", "stir well and add ice", "lemons, sugar, and water"],
    ["a seed pot", "fill a paper cup with soil", "push the seed gently into the soil", "water it a little every day", "a paper cup, soil, and a seed"],
    ["a jam sandwich", "spread jam on a slice of bread", "add some banana slices", "put another slice of bread on top", "bread, jam, and a banana"],
    ["a paper airplane", "fold a sheet of paper in half the long way", "fold the top corners down to the middle", "fold the wings down on both sides", "a sheet of paper"],
  ];
  for (const [thing, s1, s2, s3, mat] of CRAFT) {
    const passage = `How to make ${thing}: First, ${s1}. Next, ${s2}. Finally, ${s3}. Now enjoy ${thing.startsWith("a ") ? "your new " + thing.slice(2) : "your " + thing}!`;
    add(passage, s1.charAt(0).toUpperCase() + s1.slice(1), [s2, s3].map(s => s.charAt(0).toUpperCase() + s.slice(1)).concat(CRAFT.filter(c => c[0] !== thing).map(c => c[1].charAt(0).toUpperCase() + c[1].slice(1))), `What should you do FIRST to make ${thing}?`,
      `'First, ${s1}'라고 했다. Next/Finally 단계와 순서를 혼동하지 않기!`, 2, ["how-to", "sequence"]);
    add(passage, mat.charAt(0).toUpperCase() + mat.slice(1), CRAFT.filter(c => c[4] !== mat).map(c => c[4].charAt(0).toUpperCase() + c[4].slice(1)), `What do you need to make ${thing}?`,
      `만들기 과정에 쓰인 재료는 '${mat}'이다.`, 1, ["how-to", "detail"]);
  }

  // --- S12) 펜팔 편지 ---
  const CITIES = ["Sydney, Australia", "Toronto, Canada", "London, England", "Auckland, New Zealand", "San Diego, USA", "Singapore"];
  const PETS = ["two cats", "a small white dog", "three goldfish", "a talking parrot"];
  const SUBJ = [["science", "we do fun experiments every week"], ["art", "I love drawing animals"], ["P.E.", "we play exciting games outside"], ["music", "I am learning to play the guitar"]];
  for (let i = 0; i < 14; i++) {
    const P = person(); let F = person(); while (F.n === P.n) F = person();
    const city = pick(CITIES), pets = pick(PETS), [sub, reason] = pick(SUBJ), age = 10 + rint(4);
    const passage = `Dear ${F.n},\nHello! My name is ${P.n}, and I am ${age} years old. I live in ${city}. I have ${pets} at home. My favorite subject is ${sub} because ${reason}. What is your favorite subject? Please write back soon!\nYour friend, ${P.n}`;
    add(passage, `In ${city}`, CITIES.filter(c => c !== city).map(c => `In ${c}`), `Where does ${P.n} live?`,
      `'I live in ${city}'라고 썼다.`, 1, ["letter", "detail"]);
    add(passage, `Because ${reason}`, SUBJ.filter(s => s[1] !== reason).map(s => `Because ${s[1]}`), `Why does ${P.n} like ${sub}?`,
      `'because ${reason}'라고 이유를 밝혔다.`, 2, ["letter", "detail"]);
    add(passage, pets.charAt(0).toUpperCase() + pets.slice(1), PETS.filter(p => p !== pets).map(p => p.charAt(0).toUpperCase() + p.slice(1)), `What pets does ${P.n} have?`,
      `'I have ${pets} at home'이라고 썼다.`, 1, ["letter", "detail"]);
  }

  return out;
}

// ============================================================
//  LFM 상위 난이도 생성기 (Lv3~5) — 고급 문법
// ============================================================
function genLfmHard() {
  const out = [];
  const add = (correct, pool, stem, explanation, difficulty, tags) =>
    out.push(mcq("lfm", correct, pool, { stem, explanation, difficulty, tags }));

  // 1) 가정법 과거 (If + 과거, would + 동사원형)
  const COND2 = [
    ["a bird", "I would fly to school every day", "were", ["am", "was", "will be"]],
    ["you", "I would tell the teacher the truth", "were", ["am", "was", "will be"]],
    ["rich", "she would travel around the world", "were", ["is", "was", "will be"]],
    ["taller", "he would join the basketball team", "were", ["is", "was", "will be"]],
    ["a superhero", "I would help people in trouble", "were", ["am", "was", "will be"]],
  ];
  for (const [cond, result, cor, d] of COND2)
    add(cor, d, `If I ___ ${cond}, ${result}.`,
      `가정법 과거(현재 사실의 반대)에서 be동사는 인칭과 관계없이 'were'를 쓴다. 'If I were ~, I would ~' 구문.`, 3, ["conditional", "subjunctive"]);
  const COND2B = [
    ["had", "more time, I would learn the piano", "would", "will"],
    ["knew", "her number, I would call her", "would", "will"],
    ["lived", "near the sea, we would swim every day", "would", "will"],
    ["won", "the lottery, they would buy a big house", "would", "will"],
  ];
  for (const [ifv, rest] of COND2B)
    add("would", ["will", "would have", "am going to"], `If I ${ifv} ${rest.replace("would ", "___ ")}.`,
      `가정법 과거의 주절은 'would + 동사원형'을 쓴다.`, 3, ["conditional", "subjunctive"]);

  // 2) 가정법 과거완료 (If + had p.p., would have p.p.)
  const COND3 = [
    ["had left earlier", "caught", "the bus", "would have caught", ["would catch", "will catch", "caught"]],
    ["had studied harder", "passed", "the exam", "would have passed", ["would pass", "will pass", "passed"]],
    ["had known", "told", "you the news", "would have told", ["would tell", "will tell", "told"]],
    ["had saved money", "bought", "a new bike", "would have bought", ["would buy", "will buy", "bought"]],
    ["had brought an umbrella", "stayed", "dry", "would have stayed", ["would stay", "will stay", "stayed"]],
  ];
  for (const [ifpart, , obj, cor, d] of COND3)
    add(cor, d, `If we ${ifpart}, we ___ ${obj}.`,
      `가정법 과거완료(과거 사실의 반대)는 'If + had p.p., 주어 + would have p.p.' 형태를 쓴다.`, 4, ["conditional", "past-perfect", "subjunctive"]);

  // 3) I wish
  const WISH = [
    ["were", ["am", "was", "will be"], "I wish I ___ taller.", "wish + 가정법 과거(현재의 아쉬움): be동사는 were."],
    ["had", ["have", "will have", "am having"], "I wish I ___ more free time these days.", "wish + 가정법 과거: 현재 사실의 반대이므로 had."],
    ["knew", ["know", "will know", "have known"], "I wish I ___ the answer to this question.", "wish + 가정법 과거: 현재 모른다는 아쉬움 → knew."],
    ["had studied", ["studied", "study", "have studied"], "I wish I ___ harder for yesterday's test.", "wish + 가정법 과거완료(과거의 후회): had p.p."],
    ["hadn't eaten", ["didn't eat", "don't eat", "haven't eaten"], "I feel sick. I wish I ___ so much cake.", "과거의 후회이므로 wish + had (not) p.p."],
  ];
  for (const [c, d, stem, note] of WISH) add(c, d, stem, note, 4, ["subjunctive", "wish"]);

  // 4) 요구·제안 동사 + (should) 동사원형
  const SUBJ = [
    ["read", ["reads", "read to", "reading"], "The teacher suggested that he ___ more books.", "suggest that + 주어 + (should) 동사원형 → read(원형)."],
    ["be", ["is", "was", "being"], "The doctor recommended that she ___ more careful.", "recommend that + 주어 + (should) 동사원형 → be."],
    ["arrive", ["arrives", "arrived", "arriving"], "It is important that everyone ___ on time.", "It is important that + 주어 + (should) 동사원형 → arrive."],
    ["clean", ["cleans", "cleaned", "cleaning"], "The coach insisted that each player ___ the locker.", "insist that + 주어 + (should) 동사원형 → clean."],
    ["take", ["takes", "took", "taking"], "The teacher suggested that Mina ___ a short break.", "suggest that + 주어 + (should) 동사원형 → take."],
  ];
  for (const [c, d, stem, note] of SUBJ) add(c, d, stem, note, 5, ["subjunctive", "verb-pattern"]);

  // 5) 화법 전환 (간접화법)
  const REPORT = [
    ["was", ["is", "will be", "has been"], "She said that she ___ very tired.", "주절이 과거(said)이면 종속절 시제도 한 단계 과거로: is → was."],
    ["would", ["will", "would have", "is going to"], "He told me that he ___ finish it the next day.", "직접화법의 will은 간접화법에서 would가 된다."],
    ["had", ["has", "will have", "having"], "Tom said that he ___ already finished his lunch.", "직접화법의 현재완료/과거는 간접화법에서 과거완료(had p.p.)가 된다."],
    ["could", ["can", "will", "could have"], "She said that she ___ swim very well.", "직접화법의 can은 간접화법에서 could가 된다."],
    ["lived", ["live", "will live", "have lived"], "He said that he ___ in Busan.", "주절이 과거이므로 현재(live)는 과거(lived)로 바뀐다."],
  ];
  for (const [c, d, stem, note] of REPORT) add(c, d, stem, note, 4, ["reported-speech", "tense"]);

  // 6) 동명사 vs to부정사 (의미 차이)
  const GVI = [
    ["to lock", ["locking", "lock", "locked"], "Remember ___ the door before you leave home.", "remember + to부정사: (앞으로) ~할 것을 기억하다. remember + -ing: (이미) ~한 것을 기억하다."],
    ["seeing", ["to see", "see", "saw"], "I'll never forget ___ the ocean for the first time.", "forget + -ing: (과거에) ~한 것을 잊다. 첫 경험을 잊지 못한다는 의미이므로 -ing."],
    ["to tell", ["telling", "tell", "told"], "She stopped ___ me the good news, so I finally heard it.", "stop + to부정사: ~하기 위해 멈추다. (소식을 전하려고 멈췄다)"],
    ["talking", ["to talk", "talk", "talked"], "Please stop ___ during the movie. It's rude.", "stop + -ing: ~하던 것을 멈추다. (말하던 것을 멈춰라)"],
    ["to bring", ["bringing", "bring", "brought"], "He forgot ___ his umbrella, so he got wet.", "forget + to부정사: ~할 것을 잊다. (가져오는 것을 잊었다)"],
    ["studying", ["to study", "study", "studied"], "I remember ___ this topic last year in class.", "remember + -ing: (과거에) ~한 것을 기억하다."],
  ];
  for (const [c, d, stem, note] of GVI) add(c, d, stem, note, 4, ["gerund", "infinitive", "verb-pattern"]);

  // 7) 분사 (현재분사/과거분사, 분사구문)
  const PART = [
    ["standing", ["stood", "stand", "to stand"], "The boy ___ by the window is my cousin.", "능동(서 있는)이므로 현재분사 standing이 명사를 뒤에서 수식."],
    ["broken", ["breaking", "broke", "break"], "Be careful of the ___ glass on the floor.", "수동(깨진)이므로 과거분사 broken이 명사를 수식."],
    ["excited", ["exciting", "excite", "excites"], "The children were ___ about the trip.", "사람이 감정을 '느끼는' 경우 과거분사(-ed): excited(신이 난)."],
    ["boring", ["bored", "bore", "bores"], "The lecture was so ___ that many students fell asleep.", "감정을 '유발하는' 대상은 현재분사(-ing): boring(지루하게 하는)."],
    ["Feeling", ["Felt", "Feel", "To feeling"], "___ tired, she went to bed early.", "분사구문(이유): 능동이므로 현재분사 Feeling. (피곤해서)"],
    ["surprised", ["surprising", "surprise", "surprises"], "We were ___ by the sudden news.", "사람이 감정을 느끼는 경우 과거분사: surprised(놀란)."],
  ];
  for (const [c, d, stem, note] of PART) add(c, d, stem, note, 4, ["participle", "word-form"]);

  // 8) 사역동사 (have/get + 목적어 + p.p. / make·let·have + 목적어 + 원형)
  const CAUS = [
    ["fixed", ["fix", "fixing", "to fix"], "I had my bike ___ at the shop yesterday.", "have + 목적어(사물) + p.p.: ~이 …되게 하다. 자전거는 '수리되는' 대상이므로 fixed."],
    ["cut", ["cutting", "to cut", "cuts"], "She got her hair ___ last weekend.", "get + 목적어(사물) + p.p.: 머리는 '잘리는' 대상이므로 cut."],
    ["clean", ["to clean", "cleaning", "cleaned"], "My mom made me ___ my room before dinner.", "make + 목적어(사람) + 동사원형: ~에게 …하게 하다 → clean(원형)."],
    ["go", ["to go", "going", "went"], "Her parents let her ___ to the concert.", "let + 목적어 + 동사원형: ~가 …하게 허락하다 → go(원형)."],
    ["carry", ["to carry", "carrying", "carried"], "The teacher had a student ___ the box to the office.", "have + 목적어(사람) + 동사원형: ~에게 …하게 하다 → carry(원형)."],
    ["painted", ["paint", "painting", "to paint"], "We had the fence ___ a bright blue color.", "have + 목적어(사물) + p.p.: 울타리는 '칠해지는' 대상이므로 painted."],
  ];
  for (const [c, d, stem, note] of CAUS) add(c, d, stem, note, 4, ["causative", "verb-pattern"]);

  // 9) 도치 (부정어 강조)
  const INV = [
    ["have", ["had", "did", "was"], "Never ___ I seen such a beautiful sunset.", "부정어(Never)가 문두에 오면 주어와 조동사가 도치된다: Never have I seen ~."],
    ["had", ["have", "did", "was"], "Hardly ___ we arrived when it started to rain.", "Hardly가 문두에 오면 도치: Hardly had we arrived ~ (과거완료)."],
    ["did", ["do", "had", "was"], "Not only ___ he win the race, but he also broke the record.", "Not only가 문두에 오면 도치: Not only did he win ~."],
    ["can", ["could", "do", "will"], "Only then ___ I understand the problem clearly.", "Only ~ 부사구가 문두에 오면 도치가 일어난다."],
    ["has", ["had", "have", "did"], "Seldom ___ she been so happy as on that day.", "Seldom(좀처럼 ~않다)이 문두에 오면 도치: Seldom has she been ~."],
  ];
  for (const [c, d, stem, note] of INV) add(c, d, stem, note, 5, ["inversion"]);

  // 10) 관계사 (전치사 + 관계대명사 / whose / what)
  const REL2 = [
    ["which", ["that", "who", "whom"], "This is the house in ___ my grandparents lived.", "'전치사 + 관계대명사'에서는 which/whom만 쓰며 that은 불가. 사물이므로 which."],
    ["whom", ["who", "which", "whose"], "The friend with ___ I traveled is a doctor.", "전치사(with) 뒤에는 목적격 whom을 쓴다."],
    ["whose", ["who", "which", "whom"], "I know a girl ___ father is a famous chef.", "소유 관계(그녀의 아버지)를 나타내는 관계대명사 whose."],
    ["what", ["that", "which", "the thing"], "Please tell me ___ you want for your birthday.", "선행사를 포함하는 관계대명사 what(= the thing which)."],
    ["where", ["which", "that", "when"], "This is the park ___ we first met.", "장소를 나타내는 관계부사 where(= in which)."],
  ];
  for (const [c, d, stem, note] of REL2) add(c, d, stem, note, 4, ["relative-clause"]);

  // 11) 상관접속사 + 수 일치
  const CORR = [
    ["were", ["was", "is", "has"], "Neither the teacher nor the students ___ in the room.", "neither A nor B는 B(students, 복수)에 동사를 일치시킨다 → were."],
    ["was", ["were", "are", "have"], "Neither the students nor the teacher ___ in the room.", "neither A nor B는 B(teacher, 단수)에 일치 → was."],
    ["does", ["do", "is", "has"], "Not only the players but also the coach ___ practice hard.", "not only A but also B는 B(coach, 단수)에 일치 → does."],
    ["are", ["is", "was", "has"], "Both the teacher and the students ___ excited about the trip.", "both A and B는 항상 복수 취급 → are."],
    ["has", ["have", "are", "were"], "Either Mina or her sister ___ the key.", "either A or B는 B(sister, 단수)에 일치 → has."],
  ];
  for (const [c, d, stem, note] of CORR) add(c, d, stem, note, 5, ["correlative", "subject-verb-agreement"]);

  // 12) the 비교급, the 비교급
  const THE = [
    ["better", ["good", "best", "well"], "The harder you practice, the ___ you become.", "'the + 비교급, the + 비교급'(~할수록 더 …하다) 구문. good의 비교급 better."],
    ["more", ["much", "most", "many"], "The more you read, the ___ you learn.", "the 비교급 구문. much의 비교급 more."],
    ["colder", ["cold", "coldest", "more cold"], "The higher we climbed, the ___ it got.", "the 비교급 구문. cold의 비교급 colder."],
    ["easier", ["easy", "easiest", "more easy"], "The more you practice, the ___ it becomes.", "the 비교급 구문. easy의 비교급 easier."],
  ];
  for (const [c, d, stem, note] of THE) add(c, d, stem, note, 3, ["comparative"]);

  // 13) so / such
  const SOSUCH = [
    ["such", ["so", "very", "too"], "It was ___ a cold day that we stayed inside.", "such + a + 형용사 + 명사 + that 구문. (so는 뒤에 명사가 없을 때)"],
    ["so", ["such", "very", "much"], "The movie was ___ boring that I fell asleep.", "so + 형용사 + that 구문. (뒤에 명사가 없으므로 so)"],
    ["such", ["so", "very", "too"], "They were ___ kind people that everyone liked them.", "such + 형용사 + 복수명사 + that 구문."],
    ["so", ["such", "very", "too"], "She ran ___ fast that no one could catch her.", "so + 부사 + that 구문."],
  ];
  for (const [c, d, stem, note] of SOSUCH) add(c, d, stem, note, 3, ["so-that", "conjunction"]);

  // 14) too / enough
  const TOOEN = [
    ["too", ["so", "very", "enough"], "He is ___ young to drive a car.", "too + 형용사 + to부정사: 너무 ~해서 …할 수 없다."],
    ["enough", ["too", "so", "very"], "She isn't old ___ to watch that movie.", "형용사 + enough + to부정사: …할 만큼 충분히 ~한. enough는 형용사 뒤에 온다."],
    ["too", ["so", "enough", "very"], "This box is ___ heavy for me to lift.", "too + 형용사 + for + 목적어 + to부정사 구문."],
    ["enough", ["too", "so", "very"], "Is the water warm ___ to swim in?", "형용사(warm) + enough + to부정사."],
  ];
  for (const [c, d, stem, note] of TOOEN) add(c, d, stem, note, 3, ["infinitive", "word-form"]);

  // 15) used to / be used to / get used to
  const USED = [
    ["used to", ["am used to", "use to", "was used to"], "I ___ live in a small village when I was young.", "used to + 동사원형: (과거에) ~하곤 했다."],
    ["getting", ["get", "got", "to get"], "I'm slowly getting used to ___ up early for school.", "be/get used to + -ing: ~하는 데 익숙해지다. 뒤에 동명사."],
    ["living", ["live", "to live", "lived"], "She isn't used to ___ in a big city yet.", "be used to + -ing: ~하는 데 익숙하다. 뒤에 동명사."],
    ["used to", ["am used to", "use to", "used"], "There ___ be a bakery on this corner, but it closed.", "used to + 동사원형: 과거의 상태(예전엔 ~이 있었다)."],
  ];
  for (const [c, d, stem, note] of USED) add(c, d, stem, note, 4, ["used-to", "verb-pattern"]);

  // 16) 완료 조동사 (should have / must have / can't have)
  const PMODAL = [
    ["should have", ["should", "must have", "can't have"], "You ___ studied harder. You failed the test.", "should have p.p.: (과거에) ~했어야 했는데 (하지 않은 것에 대한 후회)."],
    ["must have", ["should have", "can't have", "might"], "The ground is wet. It ___ rained last night.", "must have p.p.: ~했음에 틀림없다 (과거 사실의 강한 추측)."],
    ["can't have", ["must have", "should have", "might have"], "She ___ finished already; she only started five minutes ago.", "can't have p.p.: ~했을 리가 없다 (과거에 대한 부정적 확신)."],
    ["might have", ["must", "should", "can't"], "I'm not sure where he is. He ___ have gone home.", "might have p.p.: ~했을지도 모른다 (과거에 대한 약한 추측)."],
  ];
  for (const [c, d, stem, note] of PMODAL) add(c, d, stem, note, 4, ["modal", "perfect-modal"]);

  // 17) 부가의문문
  const TAG = [
    ["haven't you", ["have you", "didn't you", "don't you"], "You have finished your homework, ___?", "현재완료(have finished) 평서문의 부가의문문은 haven't you."],
    ["isn't it", ["is it", "doesn't it", "wasn't it"], "It's a beautiful day, ___?", "be동사(is) 긍정문의 부가의문문은 isn't it."],
    ["can't you", ["can you", "don't you", "couldn't you"], "You can swim, ___?", "조동사 can 긍정문의 부가의문문은 can't you."],
    ["did you", ["didn't you", "do you", "were you"], "You didn't see him, ___?", "부정문(didn't)의 부가의문문은 긍정형 did you."],
    ["will you", ["won't you", "do you", "shall you"], "Close the window, ___?", "명령문의 부가의문문은 will you."],
  ];
  for (const [c, d, stem, note] of TAG) add(c, d, stem, note, 3, ["tag-question"]);

  // 18) 고급 전치사 연어 (형용사/동사 + 전치사)
  const PREP2 = [
    ["of", ["to", "in", "for"], "She is capable ___ solving very hard puzzles.", "be capable of: ~할 능력이 있다."],
    ["in", ["on", "at", "for"], "After years of effort, he finally succeeded ___ passing the exam.", "succeed in: ~에 성공하다."],
    ["for", ["of", "to", "with"], "The city is known ___ its beautiful old temples.", "be known for: ~으로 유명하다."],
    ["to", ["with", "for", "of"], "This new phone is superior ___ the old one.", "be superior to: ~보다 우수하다."],
    ["with", ["of", "at", "to"], "The classroom was crowded ___ excited students.", "be crowded with: ~으로 붐비다."],
    ["on", ["of", "in", "at"], "Whether we go camping depends ___ the weather.", "depend on: ~에 달려 있다 (고급 문맥)."],
    ["from", ["of", "to", "with"], "Good exercise can prevent you ___ getting sick.", "prevent A from -ing: A가 ~하지 못하게 막다."],
    ["into", ["to", "in", "at"], "The scientist looked ___ the strange results carefully.", "look into: ~을 조사하다."],
  ];
  for (const [c, d, stem, note] of PREP2) add(c, d, stem, note, 3, ["preposition", "collocation"]);

  return out;
}

// ============================================================
//  ADVENTURE 상위 난이도 생성기 (Lv3~5) — 긴 지문 + 추론·주제·어휘
// ============================================================
function genAdvHard() {
  const out = [];
  const add = (passage, correct, pool, stem, explanation, difficulty, tags) =>
    out.push(mcq("adventure", correct, pool, { passage, stem, explanation, difficulty, tags }));

  // 여러 문항을 가진 긴 지문 세트 (전부 수작업, 추론·주제·어휘·지시어)
  const SETS = [
    {
      p: "For hundreds of years, sailors told stories about giant sea monsters with long arms that could pull ships underwater. Most people thought these were just made-up tales. However, we now know that giant squid are real. They can grow longer than a school bus and live deep in the dark ocean. Because they live so far below the surface, scientists rarely see them alive. In fact, the first video of a living giant squid was not taken until 2012.",
      qs: [
        ["What is the main idea of the passage?", "Giant squid, once thought to be myths, are real but rarely seen", ["Sailors were afraid of the ocean", "Giant squid attack ships on purpose", "Scientists have studied giant squid for hundreds of years"], "옛날엔 전설로 여겨졌지만 실제로 존재하며, 깊은 바다에 살아 관찰이 드물다는 것이 글 전체의 요지이다.", 4, ["nonfiction", "main-idea"]],
        ["Why do scientists rarely see giant squid alive?", "They live deep in the dark ocean", ["They swim too fast to film", "They only come out at night", "They hide inside sunken ships"], "'Because they live so far below the surface'에서 깊은 바다에 살기 때문임을 알 수 있다.", 3, ["nonfiction", "cause-effect"]],
        ["What can be inferred from the passage?", "People's beliefs can change when new evidence appears", ["Sailors never told the truth", "All sea monster stories are real", "Giant squid are easy to catch"], "전설로 여기던 것이 증거(영상)로 사실이 된 흐름에서, 새 증거가 믿음을 바꾼다는 점을 추론할 수 있다.", 5, ["nonfiction", "inference"]],
      ]
    },
    {
      p: "Maya had practiced her violin piece for weeks, but on the morning of the concert her hands would not stop shaking. Backstage, she peeked at the huge audience and felt her heart race. Her teacher noticed and quietly said, \"The nerves you feel just mean you care. Let that energy move your bow.\" Maya took a deep breath. When her turn came, she still felt the flutter in her chest, but this time she let it flow into the music. She played better than she ever had in practice.",
      qs: [
        ["What is the main lesson Maya learns?", "Nervous energy can be turned into a good performance", ["It is better to avoid concerts", "Practice is not important", "Teachers should play for their students"], "선생님의 조언대로 긴장을 음악으로 흘려보내 더 잘 연주한 데서 얻는 교훈이다.", 4, ["story", "main-idea"]],
        ["How did Maya feel just before she played?", "Nervous but determined", ["Bored and sleepy", "Angry at her teacher", "Completely calm"], "손이 떨리고 심장이 뛰었지만 심호흡을 하고 연주에 임했으므로 '긴장했지만 마음을 다잡은' 상태이다.", 3, ["story", "feeling"]],
        ["What does the teacher mean by \"The nerves you feel just mean you care\"?", "Feeling nervous shows the performance matters to her", ["She should stop caring about the concert", "Nervous people cannot play well", "She needs more practice"], "긴장은 그만큼 중요하게 여긴다는 뜻이라는 격려의 말이다.", 5, ["story", "inference"]],
      ]
    },
    {
      p: "Notice to all residents: Starting next month, our town will collect food waste separately from other trash. Food waste will be turned into compost, a rich soil that helps plants grow. Please place food scraps in the green bins, which will be given to each home for free. Do not put plastic bags or metal in the green bins, as these cannot break down and will ruin the compost. Collection will happen every Tuesday and Friday.",
      qs: [
        ["What is the main purpose of this notice?", "To explain a new food waste collection program", ["To sell green bins to residents", "To warn about a plastic shortage", "To announce a change in trash pickup days only"], "새로운 음식물 쓰레기 분리 수거 프로그램을 안내하는 것이 목적이다.", 3, ["notice", "purpose"]],
        ["Why should residents keep plastic out of the green bins?", "Plastic cannot break down and ruins the compost", ["Plastic is too heavy", "Plastic bins cost extra money", "Plastic attracts animals"], "'these cannot break down and will ruin the compost'에서 이유를 알 수 있다.", 3, ["notice", "detail"]],
        ["What does the word \"compost\" mean in the passage?", "Rich soil made from food waste", ["A kind of green bin", "A type of plastic bag", "A collection truck"], "'compost, a rich soil that helps plants grow'라는 동격 설명에서 뜻을 알 수 있다.", 4, ["notice", "vocabulary"]],
      ]
    },
    {
      p: "Long ago, people believed that the sun moved around the Earth because that is what they saw every day: the sun rose in the east and set in the west. It took brave thinkers, careful measurements, and better telescopes to show that the Earth actually travels around the sun. Many people at the time refused to accept this idea because it went against what everyone had always been taught. Over time, however, the evidence became too strong to ignore.",
      qs: [
        ["What is the passage mainly about?", "How a long-held belief about the sun was slowly replaced by evidence", ["How to build a telescope", "Why the sun rises in the east", "Which thinkers were the bravest"], "오래된 믿음이 증거에 의해 서서히 바뀌는 과정을 다룬다.", 4, ["nonfiction", "main-idea"]],
        ["Why did many people first reject the new idea?", "It went against what they had always been taught", ["Telescopes were too expensive", "The sun was too bright to study", "They could not see the stars"], "'because it went against what everyone had always been taught'에서 이유를 알 수 있다.", 3, ["nonfiction", "cause-effect"]],
        ["What can be inferred about scientific ideas from this passage?", "New ideas may be resisted at first but can win out with strong evidence", ["Old ideas are always correct", "Science never changes", "People accept new ideas immediately"], "처음엔 거부되지만 강한 증거로 결국 받아들여지는 흐름에서 추론할 수 있다.", 5, ["nonfiction", "inference"]],
      ]
    },
    {
      p: "Ravi: Did you hear that the school is thinking about starting classes an hour later?\nJoon: Really? I'd love that. I'm always so sleepy in first period.\nRavi: Some studies say teenagers actually need more sleep in the morning. But my dad worries we'd get home too late for after-school clubs.\nJoon: That's a fair point. Maybe they could make the school day shorter instead of just moving it later.\nRavi: Good idea. We should write a letter to the principal with both sides.",
      qs: [
        ["What are Ravi and Joon mainly discussing?", "Whether the school should start classes later", ["What time their clubs meet", "How to write a letter", "Why Joon is always tired"], "수업을 한 시간 늦게 시작하는 문제를 두고 이야기하고 있다.", 3, ["dialogue", "main-idea"]],
        ["What is Ravi's dad worried about?", "Getting home too late for after-school clubs", ["Students sleeping in class", "The cost of the change", "Teachers being late"], "'my dad worries we'd get home too late for after-school clubs'에서 알 수 있다.", 3, ["dialogue", "detail"]],
        ["What can be inferred about Joon?", "He tries to consider both sides of the issue", ["He dislikes school completely", "He never feels tired", "He disagrees with Ravi about everything"], "아빠의 걱정을 'fair point'라 인정하고 절충안을 제시한 데서 균형 잡힌 태도를 추론할 수 있다.", 5, ["dialogue", "inference"]],
      ]
    },
    {
      p: "The little seed sat in the dark, cool soil for many days. At first, nothing seemed to happen. But underground, the seed was quietly drinking water and growing tiny roots. One morning, a small green sprout finally pushed through the surface and felt the warm sun for the first time. If the seed had given up in those first quiet days, it would never have become the tall sunflower that later filled the garden with color.",
      qs: [
        ["What is the main message of this story?", "Important growth can happen even when nothing seems to be happening", ["Sunflowers grow faster than other plants", "Seeds need very little water", "Gardens should be planted in winter"], "겉으로 아무 일 없어 보여도 중요한 성장이 일어난다는 교훈적 메시지이다.", 4, ["story", "main-idea"]],
        ["What was the seed doing during the quiet days underground?", "Drinking water and growing roots", ["Sleeping and doing nothing", "Waiting for someone to dig it up", "Making flowers right away"], "'the seed was quietly drinking water and growing tiny roots'에서 알 수 있다.", 3, ["story", "detail"]],
        ["What does the last sentence suggest?", "Patience during hard early stages leads to later success", ["Sunflowers are hard to grow", "Seeds should be planted deeper", "The garden had too many flowers"], "초반의 조용한 시기를 견딘 덕에 큰 해바라기가 되었다는 데서 인내의 가치를 시사한다.", 5, ["story", "inference"]],
      ]
    },
    {
      p: "Some animals have found clever ways to survive cold winters. Bears eat a huge amount of food in autumn and then sleep deeply for months, using the fat they stored. Certain frogs do something even stranger: parts of their bodies actually freeze, and their hearts nearly stop. When spring warms the air, the frogs thaw out and hop away as if nothing happened. Each method looks very different, yet both solve the same problem — how to live through a season with little food and freezing temperatures.",
      qs: [
        ["What is the passage mainly comparing?", "Different ways animals survive the winter", ["Which animal is the strongest", "How bears and frogs are related", "Why winters are getting colder"], "겨울을 나는 서로 다른 방법(곰의 겨울잠, 개구리의 결빙)을 비교한다.", 4, ["nonfiction", "main-idea"]],
        ["How do the bear and the frog methods relate to each other?", "They look different but solve the same problem", ["They are exactly the same", "One works and the other fails", "Neither one really works"], "'Each method looks very different, yet both solve the same problem'에서 알 수 있다.", 4, ["nonfiction", "inference"]],
        ["The word \"thaw\" is closest in meaning to ______.", "become unfrozen", ["fall asleep", "grow larger", "run away"], "봄에 몸이 녹아 뛰어간다는 맥락에서 thaw는 '(얼었던 것이) 녹다'라는 뜻이다.", 5, ["nonfiction", "vocabulary"]],
      ]
    },
    {
      p: "Dear Grandma,\nThank you so much for the paint set you sent for my birthday. At first I was nervous to use it because I didn't want to waste the nice paints on a bad picture. But Mom reminded me that every artist has to practice, so I finally started. I've already filled three pages, and even though they aren't perfect, I'm having so much fun. I can't wait to show you my favorite one when you visit.\nLove, Dahlia",
      qs: [
        ["Why was Dahlia nervous to use the paint set at first?", "She didn't want to waste the paints on a bad picture", ["She didn't like the colors", "She had never seen paint before", "She wanted a different gift"], "'I didn't want to waste the nice paints on a bad picture'에서 이유를 알 수 있다.", 3, ["letter", "cause-effect"]],
        ["What finally made Dahlia start painting?", "Her mom reminded her that every artist has to practice", ["Grandma called her", "She ran out of other things to do", "She won an art contest"], "'Mom reminded me that every artist has to practice, so I finally started'에서 알 수 있다.", 3, ["letter", "detail"]],
        ["What can be inferred about how Dahlia feels now?", "She feels more confident and enjoys painting", ["She regrets using the paints", "She wants to return the gift", "She is bored with painting"], "세 페이지나 그렸고 재미있다고 한 데서 자신감이 생기고 즐긴다는 것을 추론할 수 있다.", 4, ["letter", "inference"]],
      ]
    },
    {
      p: "Many people think that eating carrots gives you super-sharp night vision. This idea actually began during a war, when one country spread the story to hide the real reason its pilots could see so well at night — a new secret radar. Carrots do contain vitamin A, which is good for healthy eyes, but they will not give a normal person the power to see in the dark. Sometimes a clever story spreads so widely that people accept it as fact.",
      qs: [
        ["What is the main point of the passage?", "A popular belief about carrots came from a wartime trick, not the truth", ["Carrots are the healthiest vegetable", "Radar was invented by pilots", "Vitamin A is bad for the eyes"], "당근 야간 시력 이야기가 전쟁 중 속임수에서 나왔다는 것이 핵심이다.", 4, ["nonfiction", "main-idea"]],
        ["Why did the country spread the carrot story?", "To hide the real reason its pilots could see well at night", ["To sell more carrots", "To help farmers", "To teach children about vitamins"], "'to hide the real reason its pilots could see so well at night — a new secret radar'에서 알 수 있다.", 4, ["nonfiction", "detail"]],
        ["What can be inferred from the passage?", "A false story can be widely believed if it sounds convincing", ["Carrots have no vitamins", "All wartime stories are true", "Radar does not really work"], "마지막 문장에서 그럴듯한 이야기가 사실처럼 퍼질 수 있다는 점을 추론할 수 있다.", 5, ["nonfiction", "inference"]],
      ]
    },
    {
      p: "The city library was about to close for the night when the lights suddenly went out. A few visitors gasped, but the librarian calmly took out a flashlight and said, \"Don't worry, this happens sometimes during storms.\" She guided everyone toward the exit, then noticed a small boy sitting alone, clutching a book and looking frightened. Instead of rushing him out, she knelt down, turned on a soft light, and read the last page of his story aloud before walking him to his waiting mother.",
      qs: [
        ["What best describes the librarian?", "Calm and caring", ["Careless and rude", "Angry and impatient", "Shy and fearful"], "침착하게 대피시키고 겁먹은 아이를 챙긴 데서 침착하고 배려심 있는 성격을 알 수 있다.", 4, ["story", "inference"]],
        ["Why did the librarian kneel down by the small boy?", "He looked frightened and was sitting alone", ["He had broken a rule", "He was blocking the exit", "He had lost his library card"], "'noticed a small boy sitting alone, clutching a book and looking frightened'에서 이유를 알 수 있다.", 3, ["story", "cause-effect"]],
        ["What does the librarian's action at the end suggest about her?", "She cares about people's feelings, not just rules", ["She wanted to keep the library open", "She was afraid of the dark", "She disliked reading aloud"], "서둘러 내보내는 대신 아이의 이야기를 끝까지 읽어준 데서 규칙보다 사람의 마음을 살핀다는 점을 시사한다.", 5, ["story", "inference"]],
      ]
    },
    {
      p: "Should students be allowed to use phones during lunch? Some say phones let students relax and stay in touch with family. Others argue that lunch is a rare chance for friends to talk face to face, and that screens get in the way of real conversation. At our school, a small group of students tried a \"phone-free lunch\" for two weeks. Afterward, most of them said the lunchroom felt noisier and friendlier, and they had made plans with classmates they rarely spoke to before.",
      qs: [
        ["What is the main purpose of this passage?", "To explore both sides of allowing phones at lunch and share what one test found", ["To ban all phones from school", "To explain how phones work", "To describe school lunch menus"], "찬반 양측을 소개하고 실험 결과를 전하는 글이다.", 4, ["nonfiction", "purpose"]],
        ["What did most students say after the phone-free lunch?", "The lunchroom felt noisier and friendlier", ["They were bored the whole time", "They missed their phones too much", "The food tasted better"], "'the lunchroom felt noisier and friendlier'에서 알 수 있다.", 3, ["nonfiction", "detail"]],
        ["What can be inferred from the students' experience?", "Putting phones away can lead to more face-to-face connection", ["Phones should never be used", "Students dislike talking to classmates", "Lunch is too short for conversation"], "잘 대화하지 않던 친구와 계획을 세운 결과에서 대면 소통이 늘어남을 추론할 수 있다.", 5, ["nonfiction", "inference"]],
      ]
    },
    {
      p: "When Ben's family moved to a new town, he was sure he would hate it. He missed his old friends and his old room, and for the first week he barely left the house. Then a neighbor invited him to join a weekend soccer game in the park. Ben almost said no, but he made himself go. He wasn't the best player, yet the other kids cheered every time he tried. Walking home, muddy and out of breath, Ben realized he was smiling for the first time since the move.",
      qs: [
        ["What is the main idea of the story?", "Taking a small chance helped Ben start to feel at home", ["Ben was the best soccer player in town", "Moving is always a happy event", "Ben decided to move back to his old town"], "억지로라도 나가 본 작은 시도가 새 동네에 적응하는 계기가 된다는 이야기이다.", 4, ["story", "main-idea"]],
        ["Why did Ben almost say no to the soccer game?", "He was still sad about the move and missed his old life", ["He didn't know how to play soccer", "He had homework to finish", "It was raining outside"], "이사 후 친구와 방을 그리워하며 집에만 있었다는 앞부분에서 이유를 알 수 있다.", 3, ["story", "cause-effect"]],
        ["What does Ben's smile at the end suggest?", "He is beginning to feel happier in his new town", ["He won the soccer game", "He wants to go home and sleep", "He is angry at his neighbor"], "이사 후 처음으로 웃었다는 데서 새 동네에 마음을 열기 시작했음을 시사한다.", 5, ["story", "inference"]],
      ]
    },
    {
      p: "Honey never spoils. Archaeologists have found pots of honey in ancient tombs that are over three thousand years old, and the honey was still safe to eat. The secret lies in how bees make it. They remove most of the water from flower nectar and add special substances that stop bacteria from growing. As long as the honey is sealed and kept dry, it can last almost forever. This is why honey is one of the very few foods that never goes bad.",
      qs: [
        ["What is the passage mainly explaining?", "Why honey can last an extremely long time without spoiling", ["How bees build their hives", "Where ancient tombs are found", "Why people eat honey"], "꿀이 상하지 않는 이유를 설명하는 글이다.", 3, ["nonfiction", "main-idea"]],
        ["According to the passage, what helps stop bacteria in honey?", "Low water and special substances bees add", ["The cold of the tombs", "Sunlight", "Sugar from fruit"], "'remove most of the water ~ and add special substances that stop bacteria'에서 알 수 있다.", 4, ["nonfiction", "detail"]],
        ["What condition is needed for honey to last almost forever?", "It must be sealed and kept dry", ["It must be frozen", "It must be over 3,000 years old", "It must stay in a tomb"], "'As long as the honey is sealed and kept dry'에서 조건을 알 수 있다.", 4, ["nonfiction", "detail"]],
      ]
    },
    {
      p: "The old lighthouse keeper had watched over the rocky coast for forty years. Ships passed safely because his light never failed, even on the wildest nights. When the town finally built an automatic light, some said the keeper was no longer needed. But on the night the new machine broke during a fierce storm, it was the old keeper who climbed the tower, lit the lamp by hand, and guided a lost fishing boat home. The next morning, the town thanked him — and decided to keep him on, just in case.",
      qs: [
        ["What is the main lesson of the story?", "Human experience can still matter even when machines take over", ["Lighthouses are no longer useful", "Storms are dangerous for ships", "Old people should retire early"], "자동화되어도 사람의 경험이 여전히 중요하다는 교훈이다.", 4, ["story", "main-idea"]],
        ["Why did the town decide to keep the keeper on?", "He saved a boat when the automatic light failed", ["He asked for more money", "The machine was too expensive", "He was the mayor's friend"], "폭풍우에 기계가 고장 났을 때 직접 등을 밝혀 배를 구한 일 때문이다.", 3, ["story", "cause-effect"]],
        ["What does the phrase \"just in case\" suggest at the end?", "They want him ready in case the machine fails again", ["They no longer trust him", "They plan to remove the light", "They want him to leave soon"], "혹시 기계가 또 고장 날 경우를 대비한다는 의미이다.", 5, ["story", "inference"]],
      ]
    },
    {
      p: "Coral reefs are sometimes called the rainforests of the sea because so many living things depend on them. Tiny animals called coral polyps build the reef over thousands of years, creating homes for fish, crabs, and countless other creatures. But reefs are in danger. When the ocean gets too warm, the coral turns white and can die, a process called bleaching. Protecting reefs matters not only for the animals that live there but also for the millions of people who rely on healthy oceans for food.",
      qs: [
        ["Why are coral reefs called \"the rainforests of the sea\"?", "So many living things depend on them", ["They are the same color as forests", "They grow on land", "They are always warm"], "'because so many living things depend on them'에서 이유를 알 수 있다.", 4, ["nonfiction", "detail"]],
        ["What causes coral bleaching?", "Ocean water that gets too warm", ["Too many fish", "Heavy rain", "Bright sunlight at night"], "'When the ocean gets too warm, the coral turns white'에서 알 수 있다.", 3, ["nonfiction", "cause-effect"]],
        ["What is the main idea of the passage?", "Coral reefs support much ocean life and need protection", ["Coral polyps are the largest sea animals", "Reefs are easy to rebuild", "Only fish care about reefs"], "산호초가 많은 생물을 지탱하며 보호가 필요하다는 것이 요지이다.", 4, ["nonfiction", "main-idea"]],
      ]
    },
    {
      p: "Aisha had always been the quietest student in class, so no one expected her to enter the school science fair. For weeks she worked in secret on a small machine that could sort trash into paper, plastic, and metal. On the day of the fair, her hands trembled as she explained her project. To her surprise, a crowd gathered, asking question after question. She didn't win first prize, but her teacher said something Aisha would never forget: \"The bravest thing isn't winning — it's showing the world what you can do.\"",
      qs: [
        ["What is the main idea of the story?", "Sharing your work can be an act of courage, even without winning", ["Quiet students never do well", "Science fairs are only about prizes", "Machines can sort trash perfectly"], "이기지 않아도 자신의 것을 보여주는 용기가 중요하다는 교훈이다.", 4, ["story", "main-idea"]],
        ["Why were people surprised that Aisha entered the fair?", "She had always been the quietest student", ["She had never seen a machine", "She disliked science", "She was new to the school"], "'the quietest student in class, so no one expected her to enter'에서 알 수 있다.", 3, ["story", "detail"]],
        ["What does the teacher's comment suggest is most important?", "Having the courage to share your work", ["Winning first prize", "Building the fastest machine", "Being the loudest student"], "'The bravest thing isn't winning — it's showing the world what you can do'에서 알 수 있다.", 5, ["story", "inference"]],
      ]
    },
  ];
  for (const s of SETS) for (const [stem, cor, ds, expl, diff, tags] of s.qs)
    add(s.p, cor, ds, stem, expl, diff, tags);

  return out;
}

// ============================================================
//  메인
// ============================================================
function main() {
  // 기존 파일에서 수작업 문항 보존
  global.window = {};
  eval(fs.readFileSync(Q_PATH, "utf8"));
  const existing = global.window.QUESTION_BANK || [];
  const isHand = q => { const n = parseInt(q.id.slice(-4), 10); return n >= 1 && n <= HAND_MAX; };
  const handAdv = existing.filter(q => q.track === "adventure" && isHand(q));
  const handLfm = existing.filter(q => q.track === "lfm" && isHand(q));
  console.log(`수작업 보존: adventure ${handAdv.length}, lfm ${handLfm.length}`);

  // 생성 + 중복 제거
  function dedupe(list) {
    const seen = new Set();
    return list.filter(q => {
      const key = (q.passage || "") + "|" + q.stem + "|" + q.choices[q.answer];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  const genLfm = dedupe(genLFM());
  const genAdv = dedupe(genADV());
  console.log(`생성 풀: adventure ${genAdv.length}, lfm ${genLfm.length}`);

  const needAdv = TARGET_PER_TRACK - handAdv.length;
  const needLfm = TARGET_PER_TRACK - handLfm.length;
  if (genAdv.length < needAdv || genLfm.length < needLfm) {
    throw new Error(`풀 부족: adv ${genAdv.length}/${needAdv}, lfm ${genLfm.length}/${needLfm}`);
  }
  const pickedAdv = shuffle(genAdv).slice(0, needAdv);
  const pickedLfm = shuffle(genLfm).slice(0, needLfm);

  // id 부여 (base: 0019 ~ 0500) — 여기까지의 난수 시퀀스가 기존과 동일해야 ID가 보존된다
  const pad = n => String(n).padStart(4, "0");
  pickedAdv.forEach((q, i) => { q.id = "adv_" + pad(HAND_MAX + 1 + i); });
  pickedLfm.forEach((q, i) => { q.id = "lfm_" + pad(HAND_MAX + 1 + i); });

  // 상위 난이도(Lv3~5) 문항 — base 픽 이후에 생성하여 append (기존 ID 불변)
  const baseKeys = new Set([...pickedAdv, ...pickedLfm, ...handAdv, ...handLfm]
    .map(q => (q.passage || "") + "|" + q.stem + "|" + q.choices[q.answer]));
  const notInBase = q => !baseKeys.has((q.passage || "") + "|" + q.stem + "|" + q.choices[q.answer]);
  const hardAdv = dedupe(genAdvHard()).filter(notInBase);
  const hardLfm = dedupe(genLfmHard()).filter(notInBase);
  hardAdv.forEach((q, i) => { q.id = "adv_" + pad(TARGET_PER_TRACK + 1 + i); }); // 0501 ~
  hardLfm.forEach((q, i) => { q.id = "lfm_" + pad(TARGET_PER_TRACK + 1 + i); });
  console.log(`상위 난이도 추가: adventure +${hardAdv.length}, lfm +${hardLfm.length}`);

  const all = [...handAdv, ...pickedAdv, ...hardAdv, ...handLfm, ...pickedLfm, ...hardLfm];

  // 검증
  const ids = new Set();
  for (const q of all) {
    if (ids.has(q.id)) throw new Error("중복 id: " + q.id);
    ids.add(q.id);
    if (!["adventure", "lfm"].includes(q.track)) throw new Error("track 오류: " + q.id);
    if (!Array.isArray(q.choices) || q.choices.length !== 4) throw new Error("보기 4개 아님: " + q.id);
    if (new Set(q.choices).size !== 4) throw new Error("보기 중복: " + q.id + " " + JSON.stringify(q.choices));
    if (!(q.answer >= 0 && q.answer <= 3)) throw new Error("answer 범위 오류: " + q.id);
    if (!q.stem || !q.explanation) throw new Error("stem/explanation 누락: " + q.id);
    if (!(q.difficulty >= 1 && q.difficulty <= 5)) throw new Error("difficulty 범위 오류: " + q.id);
    if (!q.tags) q.tags = [];
  }
  const advCnt = all.filter(q => q.track === "adventure").length;
  const lfmCnt = all.filter(q => q.track === "lfm").length;
  if (advCnt < TARGET_PER_TRACK || lfmCnt < TARGET_PER_TRACK) throw new Error(`개수 오류 adv=${advCnt} lfm=${lfmCnt}`);
  // 정답 위치 분포 & 난이도 분포
  const dist = [0, 0, 0, 0];
  const diff = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  all.forEach(q => { dist[q.answer]++; diff[q.difficulty]++; });
  console.log(`검증 통과: adventure ${advCnt} + lfm ${lfmCnt} = ${all.length}문항, 정답 분포 A${dist[0]} B${dist[1]} C${dist[2]} D${dist[3]}`);
  console.log(`난이도 분포: Lv1 ${diff[1]} · Lv2 ${diff[2]} · Lv3 ${diff[3]} · Lv4 ${diff[4]} · Lv5 ${diff[5]}`);

  // 출력
  const header = `// ============================================================
// Jr. TOEFL Daily - 문항 데이터 파일 (총 ${all.length}문항: adventure ${advCnt} / lfm ${lfmCnt})
// ------------------------------------------------------------
// adv_0001~0018, lfm_0001~0018은 수작업 문항, 나머지는
// tools/generate_questions.js 로 생성한 문항입니다.
// 직접 편집해도 되고, 재생성하려면: node tools/generate_questions.js
//
// 필드: id(고유), track("adventure"|"lfm"), type("mcq"),
//       passage(선택 지문), stem(질문), choices(보기 4개),
//       answer(정답 인덱스 0~3), explanation(해설),
//       difficulty(1~5), tags(태그 배열)
//
// ※ 앱의 [부모님 공간 > 문항 JSON 가져오기]로 JSON 파일을
//    추가로 불러올 수도 있습니다 (같은 id는 덮어씀).
// ============================================================
window.QUESTION_BANK = [
`;
  const order = ["id", "track", "type", "passage", "stem", "choices", "answer", "explanation", "difficulty", "tags"];
  const lines = all.map(q => {
    const o = {};
    for (const k of order) if (q[k] !== undefined) o[k] = q[k];
    return "  " + JSON.stringify(o);
  });
  fs.writeFileSync(Q_PATH, header + lines.join(",\n") + "\n];\n", "utf8");
  console.log(`저장 완료: ${Q_PATH} (${Math.round(fs.statSync(Q_PATH).size / 1024)}KB)`);

  // 샘플 출력 (눈으로 품질 확인용)
  console.log("\n--- 샘플 (lfm) ---");
  for (const q of sample(pickedLfm, 5)) console.log(`[${q.id}] ${q.stem}\n  → ${q.choices[q.answer]} | 오답: ${q.choices.filter((_, i) => i !== q.answer).join(" / ")}`);
  console.log("\n--- 샘플 (adventure) ---");
  for (const q of sample(pickedAdv, 3)) console.log(`[${q.id}] ${q.stem}\n  지문: ${(q.passage || "").slice(0, 90)}...\n  → ${q.choices[q.answer]} | 오답: ${q.choices.filter((_, i) => i !== q.answer).join(" / ")}`);
}

main();
