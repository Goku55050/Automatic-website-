/* ----------------------------------------------------
   LOAD ANIME DATABASE
---------------------------------------------------- */
let animeList = [];

async function loadAnimeData() {
  try {
    const res = await fetch("./animeData.json?nocache=" + Date.now());
    animeList = await res.json();

    initHomePage();
    initBrowsePage();
    initEpisodesPage();
    initWatchPage();
    initDownloadPage();
    initAdminPage();
  } catch (err) {
    console.error("Anime data load error:", err);
  }
}

loadAnimeData();

/* ----------------------------------------------------
   HOME PAGE (index.html)
---------------------------------------------------- */
function initHomePage() {
  if (!document.body.id === "home") return;

  const search = document.getElementById("home-search-input");
  search.addEventListener("input", () => filterHome(search.value.toLowerCase()));

  renderHomeSections(animeList);
  loadHeroBanner();
}

function filterHome(q) {
  const filtered = animeList.filter(a =>
    a.title.toLowerCase().includes(q)
  );
  renderHomeSections(filtered);
}

function renderHomeSections(list) {
  renderSection("latest-row", [...list].sort((a, b) => b.updated - a.updated));
  renderSection("popular-row", [...list].sort((a, b) => b.popularity - a.popularity));
  renderSection("trending-row", [...list].sort((a, b) => b.trending - a.trending));
}

function renderSection(id, items) {
  const box = document.getElementById(id);
  if (!box) return;
  box.innerHTML = "";

  items.forEach(a => {
    box.innerHTML += `
      <div class="anime-card" onclick="location.href='episodes.html?id=${a.id}'">
        <img src="${a.poster}">
        <div class="card-title">${a.title}</div>
      </div>
    `;
  });
}

/* ----------------------------------------------------
   HERO BANNER
---------------------------------------------------- */
function loadHeroBanner() {
  const hero = document.getElementById("hero-banner");
  if (!hero) return;

  const topAnime = [...animeList].sort((a, b) => b.popularity - a.popularity)[0];

  hero.innerHTML = `
    <div class="hero-inner">
      <div class="hero-text">
        <div class="hero-pill">Hindi Dub • Updated</div>
        <h1 class="hero-title">${topAnime.title}</h1>
        <p class="hero-description">${topAnime.description}</p>
        <button class="btn-primary hero-btn"
          onclick="location.href='episodes.html?id=${topAnime.id}'">
          Watch Now
        </button>
      </div>
      <img src="${topAnime.poster}" class="hero-poster">
    </div>
  `;
}

/* ----------------------------------------------------
   BROWSE PAGE (browse.html)
---------------------------------------------------- */
function initBrowsePage() {
  if (document.body.id !== "browse") return;

  const box = document.getElementById("browse-list");
  const search = document.getElementById("browse-search-input");

  function render(list) {
    box.innerHTML = "";
    list.forEach(a => {
      box.innerHTML += `
        <div class="browse-card" onclick="location.href='episodes.html?id=${a.id}'">
          <img src="${a.poster}">
          <h3>${a.title}</h3>
        </div>
      `;
    });
  }

  render(animeList);

  search.addEventListener("input", () => {
    const q = search.value.toLowerCase();
    render(animeList.filter(x => x.title.toLowerCase().includes(q)));
  });
}

/* ----------------------------------------------------
   EPISODE PAGE (episodes.html)
---------------------------------------------------- */
function initEpisodesPage() {
  if (document.body.id !== "episodes") return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const anime = animeList.find(a => a.id === id);

  if (!anime) return;

  document.getElementById("anime-title").innerText = anime.title;
  document.getElementById("anime-description").innerText = anime.description;
  document.getElementById("anime-poster").src = anime.poster;

  const seasonSelect = document.getElementById("season-select");

  anime.seasons.forEach((s, i) => {
    seasonSelect.innerHTML += `<option value="${i}">${s.name}</option>`;
  });

  seasonSelect.onchange = () =>
    loadEpisodes(anime, parseInt(seasonSelect.value));

  loadEpisodes(anime, 0);
}

function loadEpisodes(anime, sIndex) {
  const list = document.getElementById("episode-list");
  list.innerHTML = "";

  anime.seasons[sIndex].episodes.forEach(ep => {
    list.innerHTML += `
      <div class="episode-card">
        <div class="episode-info">
          <h3>${ep.title}</h3>
        </div>
        <button class="btn-primary"
          onclick="location.href='watch.html?id=${anime.id}&s=${sIndex}&e=${ep.number}'">
          Watch Now
        </button>
      </div>
    `;
  });
}
/* ----------------------------------------------------
   WATCH PAGE (watch.html)
---------------------------------------------------- */
function initWatchPage() {
  if (document.body.id !== "watch") return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const s = parseInt(params.get("s"));
  const e = parseInt(params.get("e"));

  const anime = animeList.find(a => a.id === id);
  const episode = anime.seasons[s].episodes.find(ep => ep.number === e);

  // SET TITLES
  document.getElementById("watch-title").innerText =
    `${anime.title} — Episode ${e}`;

  document.getElementById("watch-subtitle").innerText =
    anime.seasons[s].name;

  // SERVER BUTTONS
  const box = document.getElementById("server-list");
  box.innerHTML = "";

  episode.watch_servers.forEach(server => {
    box.innerHTML += `
      <button class="btn-primary server-btn"
        onclick="changeServer('${server.url}')">
        ${server.name}
      </button>`;
  });

  // LOAD DEFAULT SERVER
  document.getElementById("video-player").src =
    episode.watch_servers[0].url;

  /* -------- NEXT / PREVIOUS EPISODE ---------- */
  const nextBtn = document.getElementById("next-ep");
  const prevBtn = document.getElementById("prev-ep");

  nextBtn.onclick = () => goToEpisode(anime, s, e + 1);
  prevBtn.onclick = () => goToEpisode(anime, s, e - 1);

  // SET DOWNLOAD LINK
  document.getElementById("download-btn").href =
    `download.html?id=${id}&s=${s}&e=${e}`;
}

function changeServer(url) {
  document.getElementById("video-player").src = url;
}

function goToEpisode(anime, s, epNum) {
  const exists = anime.seasons[s].episodes.find(x => x.number === epNum);
  if (!exists) return;
  location.href = `watch.html?id=${anime.id}&s=${s}&e=${epNum}`;
}

/* ----------------------------------------------------
   DOWNLOAD PAGE (download.html)
---------------------------------------------------- */
function initDownloadPage() {
  if (document.body.id !== "download") return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const s = parseInt(params.get("s"));
  const e = parseInt(params.get("e"));

  const anime = animeList.find(a => a.id === id);
  const episode = anime.seasons[s].episodes.find(ep => ep.number === e);

  document.getElementById("download-title").innerText =
    `${anime.title} – Episode ${e}`;

  document.getElementById("download-subtitle").innerText =
    anime.seasons[s].name;

  const timerEl = document.getElementById("download-timer");
  const buttonBox = document.getElementById("download-buttons");

  let left = 10;
  timerEl.innerText = `Please wait ${left} seconds…`;

  const countdown = setInterval(() => {
    left--;
    timerEl.innerText = `Please wait ${left} seconds…`;

    if (left <= 0) {
      clearInterval(countdown);

      timerEl.innerText = "Your download is ready!";
      buttonBox.style.display = "block";

      buttonBox.innerHTML = "";

      episode.download_servers.forEach(d => {
        buttonBox.innerHTML += `
          <a class="btn-primary download-btn" href="${d.url}">
            ${d.name}
          </a>`;
      });
    }
  }, 1000);
}

/* ----------------------------------------------------
   ADMIN PAGE (admin.html)
---------------------------------------------------- */
function initAdminPage() {
  if (document.body.id !== "admin") return;

  setTimeout(refreshAnimeDropdowns, 500);
}

// Refresh season dropdown when anime changes
document.addEventListener("change", (e) => {
  if (e.target.id === "episode-anime-select") {
    refreshSeasonDropdown();
  }
});

/* ----------------------------------------------------
   ADMIN — SAVE TO GITHUB (ready)
---------------------------------------------------- */
async function saveToGitHub() {
  const finalJSON = JSON.stringify(animeList, null, 2);

  alert(
    "animeData.json generated!\n\n" +
    "Copy this JSON and update your GitHub file manually (or use GitHub API)."
  );

  console.log("FINAL JSON:", finalJSON);
}

/* ----------------------------------------------------
   END OF SCRIPT
---------------------------------------------------- */
console.log("Ares Anime script loaded successfully!");
