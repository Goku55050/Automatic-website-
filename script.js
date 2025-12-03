/* ===========================================================
   LOAD ANIME DATA
=========================================================== */
let animeList = [];

async function loadAnimeData() {
  try {
    const res = await fetch("animeData.json?nocache=" + Date.now());
    animeList = await res.json();
    initPage();
  } catch (err) {
    console.error("Error loading animeData.json:", err);
  }
}

loadAnimeData();

/* ===========================================================
   PAGE ROUTER
=========================================================== */
function initPage() {
  const page = document.body.dataset.page;

  switch (page) {
    case "home": initHomePage(); break;
    case "browse": initBrowsePage(); break;
    case "episodes": initEpisodesPage(); break;
    case "watch": initWatchPage(); break;
    case "download": initDownloadPage(); break;
    case "admin": initAdminPage(); break;
  }
}

/* ===========================================================
   HOME PAGE (Hero + Sections)
=========================================================== */
let heroIndex = 0;
let heroList = [];

function initHomePage() {
  if (!animeList.length) return;

  renderHomeSections();
  renderHeroBanner();
}

/* HERO AUTO ROTATION (5 sec) */
function renderHeroBanner() {
  heroList = [...animeList].sort((a, b) => b.popularity - a.popularity);

  setHeroAnime(heroList[0]);

  setInterval(() => {
    heroIndex = (heroIndex + 1) % heroList.length;
    fadeHero(() => setHeroAnime(heroList[heroIndex]));
  }, 5000);
}

function fadeHero(callback) {
  const hero = document.querySelector(".hero-inner");

  hero.classList.add("fade-out");

  setTimeout(() => {
    callback();
    hero.classList.remove("fade-out");
    hero.classList.add("fade-in");

    setTimeout(() => hero.classList.remove("fade-in"), 800);
  }, 800);
}

/* Set hero banner content */
function setHeroAnime(anime) {
  if (!anime) return;

  document.getElementById("hero-title").textContent = anime.title;
  document.getElementById("hero-meta").textContent =
    `${anime.seasons.length} Seasons`;

  document.getElementById("hero-poster").src = anime.poster;
  document.getElementById("hero-pill").textContent = "Hindi Dub • Updated";

  document.getElementById("hero-watch-btn").onclick = () =>
    (location.href = `episodes.html?id=${anime.id}`);
}

/* ===========================================================
   TOUCH SWIPE SUPPORT FOR HERO SLIDER
=========================================================== */
let startX = 0;
let endX = 0;

const heroEl = document.querySelector(".hero-inner");

if (heroEl) {
  heroEl.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  heroEl.addEventListener("touchend", (e) => {
    endX = e.changedTouches[0].clientX;

    if (startX - endX > 50) {
      heroIndex = (heroIndex + 1) % heroList.length;
      setHeroAnime(heroList[heroIndex]);
    } else if (endX - startX > 50) {
      heroIndex = (heroIndex - 1 + heroList.length) % heroList.length;
      setHeroAnime(heroList[heroIndex]);
    }
  });
}

/* ===========================================================
   HOME ROWS
=========================================================== */
function renderHomeSections() {
  renderHomeRow("latest-row", [...animeList].sort((a, b) => b.updated - a.updated));
  renderHomeRow("popular-row", [...animeList].sort((a, b) => b.popularity - a.popularity));
  renderHomeRow("trending-row", [...animeList].sort((a, b) => b.trending - a.trending));
}

function renderHomeRow(id, list) {
  const row = document.getElementById(id);
  if (!row) return;

  row.innerHTML = "";

  list.forEach(a => {
    row.innerHTML += `
      <div class="anime-card" onclick="location.href='episodes.html?id=${a.id}'">
        <img src="${a.poster}">
        <div class="card-title">${a.title}</div>
      </div>`;
  });
}
/* ===========================================================
   BROWSE PAGE
=========================================================== */
function initBrowsePage() {
  const searchBox = document.getElementById("browse-search-input");

  renderBrowseList(animeList);

  searchBox.addEventListener("input", () => {
    const q = searchBox.value.toLowerCase();
    const filtered = animeList.filter(a => a.title.toLowerCase().includes(q));
    renderBrowseList(filtered);
  });
}

function renderBrowseList(list) {
  const grid = document.getElementById("browse-list");
  grid.innerHTML = "";

  list.forEach(a => {
    grid.innerHTML += `
      <div class="browse-card" onclick="location.href='episodes.html?id=${a.id}'">
        <img src="${a.poster}">
        <h3>${a.title}</h3>
      </div>`;
  });
}

/* ===========================================================
   EPISODES PAGE
=========================================================== */
function initEpisodesPage() {
  const p = new URLSearchParams(location.search);
  const id = p.get("id");

  const anime = animeList.find(a => a.id === id);
  if (!anime) return;

  document.getElementById("anime-title").textContent = anime.title;
  document.getElementById("anime-description").textContent = anime.description;
  document.getElementById("anime-poster").src = anime.poster;

  const seasonSelect = document.getElementById("season-select");
  seasonSelect.innerHTML = "";

  anime.seasons.forEach((s, index) => {
    seasonSelect.innerHTML += `<option value="${index}">${s.name}</option>`;
  });

  seasonSelect.onchange = () =>
    renderEpisodes(anime, parseInt(seasonSelect.value));

  renderEpisodes(anime, 0);
}

function renderEpisodes(anime, sIndex) {
  const list = document.getElementById("episodes-list");
  list.innerHTML = "";

  anime.seasons[sIndex].episodes.forEach(ep => {
    list.innerHTML += `
      <div class="episode-card">
        <div>
          <h3>${ep.title}</h3>
          <p>Episode ${ep.number}</p>
        </div>

        <button class="btn-primary"
          onclick="location.href='watch.html?id=${anime.id}&s=${sIndex}&e=${ep.number}'">
          Watch
        </button>
      </div>`;
  });
}

/* ===========================================================
   WATCH PAGE
=========================================================== */
function initWatchPage() {
  const p = new URLSearchParams(location.search);
  const id = p.get("id");
  const s = parseInt(p.get("s"));
  const e = parseInt(p.get("e"));

  const anime = animeList.find(a => a.id === id);
  const season = anime.seasons[s];
  const ep = season.episodes.find(x => x.number === e);

  document.getElementById("watch-title").textContent =
    `${anime.title} – Episode ${e}`;
  document.getElementById("watch-subtitle").textContent = season.name;

  const serverList = document.getElementById("server-list");
  serverList.innerHTML = "";

  ep.stream_servers.forEach(srv => {
    serverList.innerHTML += `
      <button class="btn-primary small-btn" onclick="loadServer('${srv.url}')">
        ${srv.name}
      </button>`;
  });

  loadServer(ep.stream_servers[0].url);

  document.getElementById("prev-ep").onclick = () => {
    if (e > 1)
      location.href = `watch.html?id=${id}&s=${s}&e=${e - 1}`;
  };

  document.getElementById("next-ep").onclick = () => {
    if (e < season.episodes.length)
      location.href = `watch.html?id=${id}&s=${s}&e=${e + 1}`;
  };

  document.getElementById("download-btn").onclick = () => {
    location.href = `download.html?id=${id}&s=${s}&e=${e}`;
  };
}

function loadServer(url) {
  document.getElementById("video-player").src = url;
}

/* ===========================================================
   DOWNLOAD PAGE
=========================================================== */
function initDownloadPage() {
  const p = new URLSearchParams(location.search);
  const id = p.get("id");
  const s = parseInt(p.get("s"));
  const e = parseInt(p.get("e"));

  const anime = animeList.find(a => a.id === id);
  const season = anime.seasons[s];
  const ep = season.episodes.find(x => x.number === e);

  document.getElementById("download-title").textContent =
    `${anime.title} – Episode ${e}`;
  document.getElementById("download-subtitle").textContent = season.name;

  const box = document.getElementById("download-buttons");
  box.innerHTML = "";

  ep.download_servers.forEach(srv => {
    box.innerHTML += `
      <a class="btn-primary" href="${srv.url}" target="_blank">${srv.name}</a>`;
  });

  startCountdown();
}

function startCountdown() {
  let sec = 10;
  const timer = document.getElementById("download-timer");
  const box = document.getElementById("download-buttons");

  const interval = setInterval(() => {
    sec--;
    timer.textContent = `Please wait ${sec} seconds…`;

    if (sec <= 0) {
      clearInterval(interval);
      timer.style.display = "none";
      box.style.display = "block";
    }
  }, 1000);
}

/* ===========================================================
   ADMIN PAGE
=========================================================== */
let adminAnimeData = [];

function initAdminPage() {
  adminAnimeData = animeList;
  fillAnimeDropdowns();
}

function fillAnimeDropdowns() {
  const select1 = document.getElementById("season-anime-select");
  const select2 = document.getElementById("episode-anime-select");

  select1.innerHTML = "";
  select2.innerHTML = "";

  adminAnimeData.forEach(a => {
    select1.innerHTML += `<option value="${a.id}">${a.title}</option>`;
    select2.innerHTML += `<option value="${a.id}">${a.title}</option>`;
  });

  updateEpisodeSeasonDropdown();
}

function updateEpisodeSeasonDropdown() {
  const id = document.getElementById("episode-anime-select").value;
  const anime = adminAnimeData.find(a => a.id === id);

  const seasonSel = document.getElementById("episode-season-select");
  seasonSel.innerHTML = "";

  anime.seasons.forEach((s, index) => {
    seasonSel.innerHTML += `<option value="${index}">${s.name}</option>`;
  });
}

function addAnime() {
  const title = document.getElementById("anime-title").value;
  const id = document.getElementById("anime-id").value;
  const poster = document.getElementById("anime-poster").value;
  const desc = document.getElementById("anime-description").value;

  adminAnimeData.push({
    id,
    title,
    poster,
    description: desc,
    popularity: 0,
    trending: 0,
    updated: Date.now(),
    seasons: []
  });

  alert("Anime Added!");
  fillAnimeDropdowns();
}

function addSeason() {
  const id = document.getElementById("season-anime-select").value;
  const name = document.getElementById("season-name").value;

  const anime = adminAnimeData.find(a => a.id === id);
  anime.seasons.push({ name, episodes: [] });

  alert("Season Added!");
  fillAnimeDropdowns();
}

function addEpisode() {
  const id = document.getElementById("episode-anime-select").value;
  const anime = adminAnimeData.find(a => a.id === id);

  const sIndex = parseInt(document.getElementById("episode-season-select").value);
  const epNum = parseInt(document.getElementById("ep-number").value);
  const epTitle = document.getElementById("ep-title").value;

  const fm = document.getElementById("stream-filemoon").value;
  const st = document.getElementById("stream-streamtape").value;
  const sh = document.getElementById("stream-streamgh").value;

  const dl_fm = document.getElementById("dl-filemoon").value;
  const dl_sh = document.getElementById("dl-streamgh").value;

  anime.seasons[sIndex].episodes.push({
    number: epNum,
    title: epTitle,
    stream_servers: [
      ...(fm ? [{ name: "Filemoon", url: fm }] : []),
      ...(st ? [{ name: "StreamTape", url: st }] : []),
      ...(sh ? [{ name: "StreamGH", url: sh }] : [])
    ],
    download_servers: [
      ...(dl_fm ? [{ name: "Filemoon DL", url: dl_fm }] : []),
      ...(dl_sh ? [{ name: "StreamGH DL", url: dl_sh }] : [])
    ]
  });

  alert("Episode Added!");
}

/* ===========================================================
   SAVE TO GITHUB
=========================================================== */
async function saveToGitHub() {
  const owner = document.getElementById("github-owner").value;
  const repo = document.getElementById("github-repo").value;
  const branch = document.getElementById("github-branch").value;
  const file = document.getElementById("github-file-path").value;
  const token = document.getElementById("github-token").value;

  const apiURL = `https://api.github.com/repos/${owner}/${repo}/contents/${file}`;

  const getRes = await fetch(apiURL, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const getJSON = await getRes.json();
  const sha = getJSON.sha;

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(adminAnimeData, null, 2))));

  const uploadRes = await fetch(apiURL, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Updated animeData.json via Admin Panel",
      content,
      sha,
      branch
    })
  });

  if (uploadRes.ok) alert("Uploaded! Vercel will auto redeploy.");
  else alert("Failed to upload to GitHub.");
      }
