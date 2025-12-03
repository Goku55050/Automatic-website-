// ======== Ares Anime – FINAL SCRIPT (external anime-data.json + admin + Netflix-style home) ========

// ---------- Helpers ----------
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// LocalStorage key for custom data made in admin panel (per-browser only)
const STORAGE_KEY = "aresAnimeDataV1";

// Base data loaded from anime-data.json (read-only)
let baseAnimeData = [];

// Active list used everywhere (may include localStorage overrides)
let animeList = [];

// Internal flag
let animeLoaded = false;

// ---------- Data loading ----------

async function loadAnimeData() {
  if (animeLoaded) return animeList;

  try {
    const res = await fetch("anime-data.json", { cache: "no-store" });
    const json = await res.json();
    if (Array.isArray(json)) {
      baseAnimeData = json;
    } else if (Array.isArray(json.anime)) {
      baseAnimeData = json.anime;
    } else {
      console.warn("anime-data.json has unexpected format, using empty list.");
      baseAnimeData = [];
    }
  } catch (e) {
    console.error("Failed to load anime-data.json", e);
    baseAnimeData = [];
  }

  // Try localStorage override (only for this browser)
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      animeList = JSON.parse(stored);
    } catch (e) {
      console.warn("Failed to parse localStorage anime data, ignoring", e);
      animeList = [];
    }
  }

  if (!Array.isArray(animeList) || !animeList.length) {
    animeList = baseAnimeData;
  }

  animeLoaded = true;
  return animeList;
}

function saveAnimeToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(animeList));
  } catch (e) {
    console.warn("Unable to save to localStorage", e);
  }
}

// Simple finder
function findAnime(id) {
  return (animeList || []).find(a => a.id === id);
}

// ---------- HOME PAGE (index.html) ----------

function buildCard(anime) {
  const card = document.createElement("div");
  card.className = "anime-card";
  card.innerHTML = `
    <img src="${anime.poster}" alt="${anime.name} poster">
    <div class="anime-card-body">
      <div class="anime-card-title">${anime.name}</div>
      <div class="anime-card-tag">Season 1 • Hindi Dubbed</div>
      <p class="anime-card-desc">${anime.description || ""}</p>
      <button class="btn-primary btn-small">Watch Now</button>
    </div>
  `;
  card.querySelector("button").onclick = () => {
    window.location.href = "episodes.html?anime=" + encodeURIComponent(anime.id);
  };
  return card;
}

function buildRow(rowId, list) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.innerHTML = "";
  list.forEach(anime => {
    const card = document.createElement("div");
    card.className = "anime-card";
    card.innerHTML = `
      <img src="${anime.poster}" alt="${anime.name} poster">
      <div class="anime-card-body">
        <div class="anime-card-title">${anime.name}</div>
      </div>
    `;
    card.onclick = () => {
      window.location.href = "episodes.html?anime=" + encodeURIComponent(anime.id);
    };
    row.appendChild(card);
  });
}

function initHomePage() {
  if (!document.body.classList.contains("page-home")) return;

  const allContainer = document.getElementById("anime-list");
  const heroBg = document.getElementById("heroBg");
  const heroTitle = document.getElementById("heroTitle");
  const heroDesc = document.getElementById("heroDesc");
  const heroBtn = document.getElementById("heroBtn");

  if (!animeList.length) return;

  // All Anime grid
  if (allContainer) {
    allContainer.innerHTML = "";
    animeList.forEach(anime => {
      allContainer.appendChild(buildCard(anime));
    });
  }

  // Auto lists:
  const latestList = [...animeList].slice().reverse(); // last = newest
  const popularList = [...animeList].slice().sort((a, b) => {
    const ae = Array.isArray(a.episodes) ? a.episodes.length : 0;
    const be = Array.isArray(b.episodes) ? b.episodes.length : 0;
    return be - ae;
  });
  const trendingList = [...animeList].slice().sort(() => Math.random() - 0.5);

  buildRow("row-latest", latestList);
  buildRow("row-popular", popularList);
  buildRow("row-trending", trendingList);

  // HERO banner slideshow
  if (heroBg && heroTitle && heroDesc && heroBtn) {
    let heroIndex = 0;

    function updateHero() {
      if (!animeList.length) return;
      const a = animeList[heroIndex];
      heroBg.style.backgroundImage = `url('${a.banner || a.poster}')`;
      heroTitle.textContent = a.title || a.name;
      heroDesc.textContent = a.description || "";
      heroBtn.onclick = () => {
        window.location.href = "episodes.html?anime=" + encodeURIComponent(a.id);
      };
      heroIndex = (heroIndex + 1) % animeList.length;
    }

    updateHero();
    setInterval(updateHero, 6000);
  }
}

// ---------- EPISODES PAGE (episodes.html) ----------

function initEpisodesPage() {
  if (!document.body.classList.contains("page-episodes")) return;

  const listEl = document.getElementById("episode-list");
  if (!listEl) return;

  const animeId = getQueryParam("anime");
  const anime = animeId && findAnime(animeId);

  const titleEl = document.getElementById("anime-title");
  const metaEl = document.getElementById("anime-meta");
  const descEl = document.getElementById("anime-desc");
  const posterEl = document.getElementById("anime-poster");

  if (!anime) {
    if (titleEl) titleEl.textContent = "Anime not found";
    return;
  }

  if (titleEl) titleEl.textContent = anime.name;
  if (metaEl) metaEl.textContent = "Season 1 • Hindi Dubbed";
  if (descEl) descEl.textContent = anime.description || "";
  if (posterEl) posterEl.src = anime.poster;

  listEl.innerHTML = "";

  const eps = Array.isArray(anime.episodes)
    ? anime.episodes.slice().sort((a, b) => (a.number || 0) - (b.number || 0))
    : [];

  eps.forEach(ep => {
    const li = document.createElement("li");
    li.className = "episode-item";
    li.innerHTML = `
      <div class="ep-text">
        <span class="ep-number">Episode ${ep.number}</span>
        <span class="ep-title">${ep.title || ""}</span>
      </div>
      <a class="btn-primary btn-small" href="watch.html?anime=${anime.id}&ep=${ep.number}">
        Watch Now
      </a>
    `;
    listEl.appendChild(li);
  });
}

// ---------- WATCH PAGE (watch.html) ----------

function initWatchPage() {
  if (!document.body.classList.contains("page-watch")) return;

  const iframe = document.getElementById("video-player");
  if (!iframe) return;

  const animeId = getQueryParam("anime");
  const epNumStr = getQueryParam("ep");
  const epNum = epNumStr ? parseInt(epNumStr, 10) : NaN;
  const anime = animeId && findAnime(animeId);

  const titleEl = document.getElementById("watch-title");
  const downloadBtn = document.getElementById("download-btn");
  const prevBtn = document.getElementById("prev-ep");
  const nextBtn = document.getElementById("next-ep");

  if (!anime || !epNum || !Number.isFinite(epNum)) {
    if (titleEl) titleEl.textContent = "Episode not found";
    iframe.src = "";
    if (downloadBtn) downloadBtn.style.display = "none";
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    return;
  }

  const eps = Array.isArray(anime.episodes)
    ? anime.episodes.slice().sort((a, b) => (a.number || 0) - (b.number || 0))
    : [];
  const epIndex = eps.findIndex(e => e.number === epNum);
  const ep = epIndex >= 0 ? eps[epIndex] : null;

  if (!ep) {
    if (titleEl) titleEl.textContent = "Episode not found";
    iframe.src = "";
    if (downloadBtn) downloadBtn.style.display = "none";
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    return;
  }

  if (titleEl) {
    titleEl.textContent = anime.name + " – Episode " + ep.number + ": " + (ep.title || "");
  }

  iframe.src = ep.streamUrl || "";

  if (downloadBtn) {
    downloadBtn.href = "download.html?anime=" + encodeURIComponent(anime.id) + "&ep=" + ep.number;
  }

  // Prev / Next
  if (prevBtn) {
    if (epIndex > 0) {
      prevBtn.disabled = false;
      prevBtn.onclick = () => {
        window.location.href =
          "watch.html?anime=" + encodeURIComponent(anime.id) + "&ep=" + eps[epIndex - 1].number;
      };
    } else {
      prevBtn.disabled = true;
    }
  }

  if (nextBtn) {
    if (epIndex < eps.length - 1) {
      nextBtn.disabled = false;
      nextBtn.onclick = () => {
        window.location.href =
          "watch.html?anime=" + encodeURIComponent(anime.id) + "&ep=" + eps[epIndex + 1].number;
      };
    } else {
      nextBtn.disabled = true;
    }
  }
}

// ---------- DOWNLOAD PAGE (download.html) ----------

function initDownloadPage() {
  if (!document.body.classList.contains("page-download")) return;

  const btn = document.getElementById("real-download-btn");
  if (!btn) return;

  const animeId = getQueryParam("anime");
  const epNumStr = getQueryParam("ep");
  const epNum = epNumStr ? parseInt(epNumStr, 10) : NaN;
  const anime = animeId && findAnime(animeId);

  const titleEl = document.getElementById("download-title");

  if (!anime || !epNum || !Number.isFinite(epNum)) {
    if (titleEl) titleEl.textContent = "Download not available";
    btn.style.display = "none";
    return;
  }

  const eps = Array.isArray(anime.episodes)
    ? anime.episodes.slice().sort((a, b) => (a.number || 0) - (b.number || 0))
    : [];
  const ep = eps.find(e => e.number === epNum);

  if (!ep) {
    if (titleEl) titleEl.textContent = "Episode not found";
    btn.style.display = "none";
    return;
  }

  if (titleEl) {
    titleEl.textContent =
      "Download – " + anime.name + ", Episode " + ep.number + ": " + (ep.title || "");
  }

  btn.href = ep.downloadUrl || ep.streamUrl || "#";
}

// ---------- ADMIN PAGE (admin.html) ----------

function updateAdminPreview() {
  const box = document.getElementById("admin-data-preview");
  if (!box) return;
  try {
    box.textContent = JSON.stringify(animeList, null, 2);
  } catch (e) {
    box.textContent = "Error generating JSON preview";
  }
}

function repopulateAdminSelects() {
  const s1 = document.getElementById("admin-season-anime");
  const s2 = document.getElementById("admin-episode-anime");
  const selects = [s1, s2].filter(Boolean);
  if (!selects.length) return;

  selects.forEach(sel => {
    sel.innerHTML = "";
    animeList.forEach(anime => {
      const opt = document.createElement("option");
      opt.value = anime.id;
      opt.textContent = anime.name;
      sel.appendChild(opt);
    });
  });
}

const GH_CONFIG_KEY = "aresGithubConfig";

function loadGithubConfig() {
  try {
    const raw = localStorage.getItem(GH_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to load GitHub config", e);
    return null;
  }
}

function saveGithubConfig(cfg) {
  try {
    localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(cfg));
  } catch (e) {
    console.warn("Failed to save GitHub config", e);
  }
}

async function pushAnimeDataToGitHub(repo, branch, path, token, statusEl) {
  try {
    if (statusEl) statusEl.textContent = "Saving to GitHub…";

    const [owner, name] = repo.split("/");
    if (!owner || !name) {
      alert("Repo must be in format owner/name");
      if (statusEl) statusEl.textContent = "";
      return;
    }

    const apiBase = `https://api.github.com/repos/${owner}/${name}/contents/${encodeURIComponent(
      path
    )}`;
    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`
    };

    // Get current file to obtain sha (if exists)
    let sha = undefined;
    const getRes = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, { headers });
    if (getRes.status === 200) {
      const current = await getRes.json();
      sha = current.sha;
    }

    const contentString = JSON.stringify(animeList, null, 2);
    const encoded = btoa(unescape(encodeURIComponent(contentString)));

    const body = {
      message: "Update anime-data via Ares admin panel",
      content: encoded,
      branch
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers,
      body: JSON.stringify(body)
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      console.error("GitHub PUT failed", errText);
      if (statusEl) statusEl.textContent = "GitHub error: " + putRes.status;
      alert("GitHub error: " + putRes.status);
      return;
    }

    if (statusEl) statusEl.textContent =
      "Saved to GitHub! Vercel will auto-redeploy if GitHub repo connected.";
    alert("Anime data pushed to GitHub successfully.");
  } catch (e) {
    console.error("GitHub sync error", e);
    if (statusEl) statusEl.textContent = "GitHub sync failed (see console).";
    alert("GitHub sync failed, check console/logs.");
  }
}

function initAdminPage() {
  if (document.body.dataset.page !== "admin") return;

  const addAnimeForm = document.getElementById("admin-add-anime");
  const addSeasonForm = document.getElementById("admin-add-season");
  const addEpisodeForm = document.getElementById("admin-add-episode");

  // GitHub elements
  const ghRepoInput = document.getElementById("gh-repo");
  const ghBranchInput = document.getElementById("gh-branch");
  const ghPathInput = document.getElementById("gh-path");
  const ghTokenInput = document.getElementById("gh-token");
  const ghBtn = document.getElementById("gh-save-btn");
  const ghStatus = document.getElementById("gh-status");

  // Ensure arrays
  if (!Array.isArray(animeList)) animeList = [];

  // On first load, clone base data so you don't edit the original array
  animeList = JSON.parse(JSON.stringify(animeList || []));

  repopulateAdminSelects();
  updateAdminPreview();

  // Load GitHub config from localStorage
  const ghCfg = loadGithubConfig();
  if (ghCfg && ghRepoInput && ghBranchInput && ghPathInput) {
    ghRepoInput.value = ghCfg.repo || "";
    ghBranchInput.value = ghCfg.branch || "main";
    ghPathInput.value = ghCfg.path || "anime-data.json";
  }

  if (ghBtn) {
    ghBtn.onclick = async () => {
      if (!ghRepoInput || !ghBranchInput || !ghPathInput || !ghTokenInput) return;
      const repo = ghRepoInput.value.trim();
      const branch = ghBranchInput.value.trim() || "main";
      const path = ghPathInput.value.trim() || "anime-data.json";
      const token = ghTokenInput.value.trim();

      if (!repo || !token) {
        alert("Please enter repo and GitHub token.");
        return;
      }

      saveGithubConfig({ repo, branch, path });

      await pushAnimeDataToGitHub(repo, branch, path, token, ghStatus);
    };
  }

  if (addAnimeForm) {
    addAnimeForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(addAnimeForm);
      const id = String(fd.get("id") || "").trim();
      const title = String(fd.get("title") || "").trim();
      const cover = String(fd.get("cover") || "").trim();
      const description = String(fd.get("description") || "").trim();
      const totalEpisodes = parseInt(fd.get("totalEpisodes") || "0", 10);

      if (!id || !title || !cover || !description || !totalEpisodes) {
        alert("Please fill all fields.");
        return;
      }

      if (animeList.find(a => a.id === id)) {
        alert("Anime ID already exists. Use a different ID.");
        return;
      }

      const episodes = [];
      for (let i = 1; i <= totalEpisodes; i++) {
        episodes.push({
          number: i,
          title: "Episode " + i,
          streamUrl: "",
          downloadUrl: ""
        });
      }

      animeList.push({
        id,
        name: title,
        poster: cover,
        description,
        episodes
      });

      saveAnimeToLocalStorage();
      repopulateAdminSelects();
      updateAdminPreview();
      addAnimeForm.reset();
      alert("Anime added locally. Click 'Save to GitHub' below to push changes for everyone.");
    };
  }

  if (addSeasonForm) {
    addSeasonForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(addSeasonForm);
      const animeId = String(fd.get("animeId") || "").trim();
      const totalEpisodes = parseInt(fd.get("totalEpisodes") || "0", 10);

      const anime = animeList.find(a => a.id === animeId);
      if (!anime) {
        alert("Anime not found.");
        return;
      }
      if (!Array.isArray(anime.episodes)) anime.episodes = [];

      let startNum = anime.episodes.length + 1;
      for (let i = 0; i < totalEpisodes; i++) {
        const n = startNum + i;
        anime.episodes.push({
          number: n,
          title: "Episode " + n,
          streamUrl: "",
          downloadUrl: ""
        });
      }

      saveAnimeToLocalStorage();
      updateAdminPreview();
      addSeasonForm.reset();
      alert("Season episodes added locally. Click 'Save to GitHub' below to push changes.");
    };
  }

  if (addEpisodeForm) {
    addEpisodeForm.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(addEpisodeForm);
      const animeId = String(fd.get("animeId") || "").trim();
      const epNumber = parseInt(fd.get("episodeNumber") || "0", 10);
      const title = String(fd.get("episodeTitle") || "").trim();
      const streamUrl = String(fd.get("streamUrl") || "").trim();
      const downloadUrl = String(fd.get("downloadUrl") || "").trim();

      const anime = animeList.find(a => a.id === animeId);
      if (!anime) {
        alert("Anime not found.");
        return;
      }
      if (!Array.isArray(anime.episodes)) anime.episodes = [];

      let ep = anime.episodes.find(e => e.number === epNumber);
      if (!ep) {
        ep = { number: epNumber };
        anime.episodes.push(ep);
      }

      ep.title = title || "Episode " + epNumber;
      ep.streamUrl = streamUrl;
      ep.downloadUrl = downloadUrl;

      // keep sorted
      anime.episodes.sort((a, b) => (a.number || 0) - (b.number || 0));

      saveAnimeToLocalStorage();
      updateAdminPreview();
      alert("Episode saved locally. Click 'Save to GitHub' below to push changes.");
    };
  }
}

// ---------- INITIALISE ON EVERY PAGE ----------

document.addEventListener("DOMContentLoaded", () => {
  loadAnimeData().then(() => {
    initHomePage();
    initEpisodesPage();
    initWatchPage();
    initDownloadPage();
    initAdminPage();
  });
});
