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
const THIRD = { go: "goes", do: "does", have: "has", study: "studies", try: "tries", watch: "watches", wash: "washes", finish: "finishes", fix: "fixes", miss: "misses", catch: "catches", teach: "teaches" };
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

  // id 부여
  const pad = n => String(n).padStart(4, "0");
  pickedAdv.forEach((q, i) => { q.id = "adv_" + pad(HAND_MAX + 1 + i); });
  pickedLfm.forEach((q, i) => { q.id = "lfm_" + pad(HAND_MAX + 1 + i); });

  const all = [...handAdv, ...pickedAdv, ...handLfm, ...pickedLfm];

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
    if (!q.difficulty) q.difficulty = 2;
    if (!q.tags) q.tags = [];
  }
  const advCnt = all.filter(q => q.track === "adventure").length;
  const lfmCnt = all.filter(q => q.track === "lfm").length;
  if (advCnt !== TARGET_PER_TRACK || lfmCnt !== TARGET_PER_TRACK) throw new Error(`개수 오류 adv=${advCnt} lfm=${lfmCnt}`);
  // 정답 위치 분포
  const dist = [0, 0, 0, 0];
  all.forEach(q => dist[q.answer]++);
  console.log(`검증 통과: adventure ${advCnt} + lfm ${lfmCnt} = ${all.length}문항, 정답 분포 A${dist[0]} B${dist[1]} C${dist[2]} D${dist[3]}`);

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
