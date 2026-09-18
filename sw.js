/* Jr. TOEFL Daily - Service Worker (오프라인 캐시) */
const CACHE = "jrtoefl-v8-reading-800-900";
const AUDIO_CACHE = "jrtoefl-audio"; // app.js의 prefetchAudio()와 같은 이름을 쓴다
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./questions.js",
  "./questions_listening.js",
  "./manifest.webmanifest",
  "./icon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      // 음원 캐시는 버전과 무관하게 유지한다 (재다운로드 방지)
      Promise.all(keys.filter((k) => k !== CACHE && k !== AUDIO_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  // 음원은 캐시 우선. 한번 받은 파일은 내용이 바뀌지 않으므로 매번 받을 이유가 없고,
  // 네트워크 우선으로 두면 문제를 들을 때마다 모바일 데이터를 쓴다.
  if (/\.(m4a|mp3|ogg|wav)$/i.test(new URL(e.request.url).pathname)) {
    e.respondWith(
      caches.open(AUDIO_CACHE).then((c) =>
        c.match(e.request).then((hit) =>
          hit || fetch(e.request).then((res) => {
            if (res.ok) c.put(e.request, res.clone());
            return res;
          })
        )
      )
    );
    return;
  }

  // 나머지는 네트워크 우선, 실패 시 캐시 (문항 파일 수정이 바로 반영되도록)
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
