/* ============================================================
   ARES ANIME – SCRIPT.JS (FINAL VERSION)
   ============================================================ */

/* ==========================
   0. GLOBAL STATE
   ========================== */

let animeData = {};           // full database
const adminPassword = "AresAdmin2025";   // SAME password for Analysis + Admin

/* ==========================
   1. LOAD JSON DATABASE
   ========================== */

async function loadAnimeData() {
  try {
    const res = await fetch("anime-data.json?cache=" + Date.now());
    animeData = await res.json();
    console.log("Loaded animeData:", animeData);
  } catch (err) {
    console.error("Error loading anime-data.json:", err);
  }
}

/* ==========================
   2. INIT PAGE
   ========================== */

document.addEventListener("DOMContentLoaded", async () => {
  await loadAnimeData();

  const page = document.body.dataset.page;

  if (page === "home") renderHomePage();
  if (page === "episodes") renderEpisodesPage();
  if (page === "watch") renderWatchPage();
  if (page === "download") renderDownloadPage();
  if (page === "admin") initAdminPanel();
  if (page === "analysis") initAnalysisPage();
});

/* ============================================================
   3. HOME PAGE (index.html)
   ============================================================ */

function renderHomePage() {
  const listEl = document.getElementById("anime-list");
  const searchEl = document.getElementById("search-input");

  function showList(filter = "") {
    listEl.innerHTML = "";

    Object.entries(animeData).forEach(([id, anime]) => {
      if (
        anime.title.toLowerCase().includes(filter.toLowerCase()) ||
        (anime.tags || "").toLowerCase().includes(filter.toLowerCase())
      ) {
        const card = document.createElement("div");
        card.className = "anime-card";
        card.onclick = () => {
          window.location.href = `episodes.html?id=${id}`;
        };

        card.innerHTML = `
          <div class="anime-poster-wrap">
            <img class="anime-poster" src="${anime.poster}" alt="${anime.title}">
            <div class="anime-tag">${anime.year || ""}</div>
          </div>
          <div class="anime-body">
            <div class="anime-title">${anime.title}</div>
            <div class="anime-meta">${anime.tags || ""}</div>
          </div>
        `;

        listEl.appendChild(card);
      }
    });
  }

  showList();

  searchEl.addEventListener("input", () => {
    showList(searchEl.value);
  });
    }
/* ============================================================
   4. EPISODES PAGE (episodes.html)
   ============================================================ */

function renderEpisodesPage() {
  const params = new URLSearchParams(window.location.search);
  const animeId = params.get("id");

  if (!animeId || !animeData[animeId]) {
    document.body.innerHTML = "<h2 style='color:white;text-align:center;margin-top:50px;'>Anime Not Found</h2>";
    return;
  }

  const anime = animeData[animeId];

  // Set poster, title, description
  document.getElementById("anime-poster").src = anime.poster;
  document.getElementById("anime-title").textContent = anime.title;
  document.getElementById("anime-description").textContent = anime.description;

  // Season dropdown
  const seasonSelect = document.getElementById("season-select");

  const seasons = anime.seasons || {};
  const seasonIds = Object.keys(seasons);

  seasonIds.forEach(seasonId => {
    const opt = document.createElement("option");
    opt.value = seasonId;
    opt.textContent = seasons[seasonId].name || seasonId;
    seasonSelect.appendChild(opt);
  });

  // If no season selected in URL → pick first
  let selectedSeason = params.get("season") || seasonIds[0];
  seasonSelect.value = selectedSeason;

  function renderEpisodes() {
    const epList = document.getElementById("episode-list");
    epList.innerHTML = "";

    const season = anime.seasons[selectedSeason];
    if (!season || !season.episodes) return;

    Object.entries(season.episodes).forEach(([epId, ep]) => {
      const li = document.createElement("li");
      li.className = "episode-item";

      li.innerHTML = `
        <div class="episode-meta">
          <span>Episode ${ep.number}</span>
          <span>${ep.title}</span>
        </div>

        <div class="episode-actions">
          <a href="watch.html?anime=${animeId}&season=${selectedSeason}&episode=${epId}" class="btn-primary">
            Watch Now
          </a>
          <a href="download.html?anime=${animeId}&season=${selectedSeason}&episode=${epId}" class="btn-secondary">
            Download
          </a>
        </div>
      `;

      epList.appendChild(li);
    });
  }

  renderEpisodes();

  // When user changes season
  seasonSelect.onchange = () => {
    selectedSeason = seasonSelect.value;
    renderEpisodes();
  };
        }
/* ============================================================
   5. WATCH PAGE (watch.html)
   ============================================================ */

function renderWatchPage() {
  const params = new URLSearchParams(window.location.search);
  const animeId = params.get("anime");
  const seasonId = params.get("season");
  const episodeId = params.get("episode");

  if (!animeId || !seasonId || !episodeId) return;

  const anime = animeData[animeId];
  const season = anime?.seasons?.[seasonId];
  const episode = season?.episodes?.[episodeId];

  if (!episode) {
    document.body.innerHTML = `<h2 style="margin-top:60px;text-align:center;color:white;">Episode Not Found</h2>`;
    return;
  }

  /* ----------------------------
       SET TITLE + SUBTITLE
     ---------------------------- */
  document.getElementById("watch-title").textContent =
    `${anime.title} – Episode ${episode.number}`;

  document.getElementById("watch-subtitle").textContent =
    `${season.name || "Season"} • ${episode.title}`;

  /* ----------------------------
       SERVER BUTTONS
     ---------------------------- */
  const serverBox = document.getElementById("server-buttons");
  const player = document.getElementById("video-player");

  serverBox.innerHTML = "";

  const servers = episode.watchLinks || [];

  servers.forEach((srv, i) => {
    const btn = document.createElement("button");
    btn.className = "server-btn";
    btn.textContent = srv.label || `Server ${i + 1}`;

    btn.onclick = () => {
      document
        .querySelectorAll(".server-btn")
        .forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      player.src = srv.url;
    };

    // Select first server by default
    if (i === 0) {
      setTimeout(() => btn.click(), 50);
    }

    serverBox.appendChild(btn);
  });

  /* ----------------------------
       DOWNLOAD BUTTON
     ---------------------------- */
  const dlBtn = document.getElementById("download-btn");
  dlBtn.href = `download.html?anime=${animeId}&season=${seasonId}&episode=${episodeId}`;

  /* ----------------------------
       WATERMARK
     ---------------------------- */
  const w = document.getElementById("ares-watermark");
  if (w) w.style.display = "block";
         }
/* ============================================================
   6. DOWNLOAD PAGE (download.html)
   ============================================================ */

function renderDownloadPage() {
  const params = new URLSearchParams(window.location.search);

  const animeId = params.get("anime");
  const seasonId = params.get("season");
  const episodeId = params.get("episode");

  if (!animeId || !seasonId || !episodeId) return;

  const anime = animeData[animeId];
  const season = anime?.seasons?.[seasonId];
  const episode = season?.episodes?.[episodeId];

  if (!episode) {
    document.body.innerHTML = `<h2 style="margin-top:60px;text-align:center;color:white;">Episode Not Found</h2>`;
    return;
  }

  /* ----------------------------
        SET TITLE + SUBTITLE
     ---------------------------- */
  document.getElementById("download-title").textContent =
    `${anime.title} – Episode ${episode.number}`;

  document.getElementById("download-subtitle").textContent =
    `${season.name || "Season"} • ${episode.title}`;

  /* ----------------------------
        COUNTDOWN SYSTEM
     ---------------------------- */

  const countdownEl = document.getElementById("countdown");
  const scrollMsg = document.getElementById("scroll-msg");
  const linksBox = document.getElementById("download-links");

  let timeLeft = 15;

  const timer = setInterval(() => {
    timeLeft--;
    countdownEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);

      scrollMsg.style.display = "block";
      linksBox.classList.remove("hidden");

      loadDownloadButtons();
    }
  }, 1000);

  /* ----------------------------
        LOAD DOWNLOAD BUTTONS
     ---------------------------- */

  function loadDownloadButtons() {
    linksBox.innerHTML = "";

    const dlLinks = episode.downloadLinks || [];

    if (dlLinks.length === 0) {
      linksBox.innerHTML = `<p style="color:#ccc;margin-top:10px;">No Download Links Available</p>`;
      return;
    }

    dlLinks.forEach(link => {
      const a = document.createElement("a");
      a.textContent = link.label || "Download";
      a.href = link.url;
      a.target = "_blank";
      linksBox.appendChild(a);
    });
  }
  }
/* ============================================================
   7. ADMIN PANEL (admin-ares-panel.html)
   ============================================================ */

function initAdminPanel() {
  // Password check is handled by analysis page
  // Admin page is open access (link hidden)

  const animeSelect = document.getElementById("select-anime");
  const refreshJsonBtn = document.getElementById("refresh-json");
  const downloadJsonBtn = document.getElementById("download-json");
  const jsonViewer = document.getElementById("json-viewer");

  /* -------------------------
       LOAD JSON INTO VIEWER
     ------------------------- */
  function refreshJSONViewer() {
    jsonViewer.value = JSON.stringify(animeData, null, 2);
  }

  refreshJsonBtn.onclick = refreshJSONViewer;
  refreshJSONViewer();

  /* -------------------------
       FILL ANIME DROPDOWN
     ------------------------- */
  function loadAnimeDropdown() {
    animeSelect.innerHTML = `<option value="">-- Select Anime --</option>`;

    Object.entries(animeData).forEach(([id, anime]) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = anime.title;
      animeSelect.appendChild(opt);
    });
  }

  loadAnimeDropdown();

  /* ============================================================
       ANIME EDITING
     ============================================================ */

  const animeEditor = document.getElementById("anime-editor");
  const editAnimeTitle = document.getElementById("edit-anime-title");
  const editAnimePoster = document.getElementById("edit-anime-poster");
  const editAnimeDescription = document.getElementById("edit-anime-description");
  const editAnimeYear = document.getElementById("edit-anime-year");
  const editAnimeTags = document.getElementById("edit-anime-tags");

  const saveAnimeBtn = document.getElementById("save-anime-changes");

  let currentAnimeId = null;

  animeSelect.onchange = () => {
    currentAnimeId = animeSelect.value;
    if (!currentAnimeId) {
      animeEditor.classList.add("hidden");
      return;
    }

    animeEditor.classList.remove("hidden");

    const a = animeData[currentAnimeId];

    editAnimeTitle.value = a.title;
    editAnimePoster.value = a.poster;
    editAnimeDescription.value = a.description;
    editAnimeYear.value = a.year || "";
    editAnimeTags.value = a.tags || "";

    loadSeasonsPanel();
    loadEpisodeTable();
  };

  saveAnimeBtn.onclick = () => {
    if (!currentAnimeId) return;

    const a = animeData[currentAnimeId];
    a.title = editAnimeTitle.value.trim();
    a.poster = editAnimePoster.value.trim();
    a.description = editAnimeDescription.value.trim();
    a.year = editAnimeYear.value.trim();
    a.tags = editAnimeTags.value.trim();

    loadAnimeDropdown();
    animeSelect.value = currentAnimeId;

    refreshJSONViewer();
    alert("Anime updated!");
  };

  /* ============================================================
       ADD NEW ANIME
     ============================================================ */

  document.getElementById("add-anime").onclick = () => {
    const id = document.getElementById("new-anime-id").value.trim();
    const title = document.getElementById("new-anime-title").value.trim();
    const poster = document.getElementById("new-anime-poster").value.trim();
    const desc = document.getElementById("new-anime-description").value.trim();
    const year = document.getElementById("new-anime-year").value.trim();
    const tags = document.getElementById("new-anime-tags").value.trim();

    if (!id || !title) {
      alert("ID & Title are required");
      return;
    }

    animeData[id] = {
      title,
      poster,
      description: desc,
      year,
      tags,
      seasons: {}
    };

    loadAnimeDropdown();
    refreshJSONViewer();
    alert("New Anime Added!");
  };

  /* ============================================================
       SEASONS PANEL
     ============================================================ */

  const seasonBox = document.getElementById("season-box");
  const selectSeason = document.getElementById("select-season");
  const editSeasonName = document.getElementById("edit-season-name");
  const saveSeasonBtn = document.getElementById("save-season-changes");

  let currentSeasonId = null;

  function loadSeasonsPanel() {
    const anime = animeData[currentAnimeId];
    const seasons = anime.seasons;

    seasonBox.classList.remove("hidden");
    selectSeason.innerHTML = "";

    Object.entries(seasons).forEach(([sid, s]) => {
      const opt = document.createElement("option");
      opt.value = sid;
      opt.textContent = s.name;
      selectSeason.appendChild(opt);
    });

    currentSeasonId = Object.keys(seasons)[0];
    selectSeason.value = currentSeasonId;
    editSeasonName.value = seasons[currentSeasonId].name;
  }

  selectSeason.onchange = () => {
    currentSeasonId = selectSeason.value;
    editSeasonName.value =
      animeData[currentAnimeId].seasons[currentSeasonId].name;

    loadEpisodeTable();
  };

  saveSeasonBtn.onclick = () => {
    animeData[currentAnimeId].seasons[currentSeasonId].name =
      editSeasonName.value.trim();

    refreshJSONViewer();
    alert("Season updated!");
  };

  /* ============================================================
       ADD NEW SEASON
     ============================================================ */
  document.getElementById("add-season").onclick = () => {
    const sid = document.getElementById("new-season-id").value.trim();
    const name = document.getElementById("new-season-name").value.trim();

    if (!sid || !name) {
      alert("Season ID & Name required");
      return;
    }

    animeData[currentAnimeId].seasons[sid] = {
      name,
      episodes: {}
    };

    loadSeasonsPanel();
    refreshJSONViewer();
    alert("Season Added!");
  };

  /* ============================================================
       EPISODES TABLE
     ============================================================ */

  const epTableBox = document.getElementById("episode-list-box");
  const epTableBody = document.getElementById("episode-table-body");

  function loadEpisodeTable() {
    const season = animeData[currentAnimeId].seasons[currentSeasonId];
    epTableBox.classList.remove("hidden");

    epTableBody.innerHTML = "";

    Object.entries(season.episodes).forEach(([eid, ep]) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${ep.number}</td>
        <td>${ep.title}</td>
        <td>${(ep.watchLinks || []).length}</td>
        <td>${(ep.downloadLinks || []).length}</td>
        <td><button class="btn-secondary" onclick="openEpisodeEditor('${eid}')">Edit</button></td>
      `;

      epTableBody.appendChild(tr);
    });
  }

  /* ============================================================
       ADD NEW EPISODE
     ============================================================ */

  document.getElementById("add-episode").onclick = () => {
    const eid = document.getElementById("new-ep-id").value.trim();
    const num = document.getElementById("new-ep-number").value.trim();
    const title = document.getElementById("new-ep-title").value.trim();

    if (!eid || !num || !title) {
      alert("All episode fields required");
      return;
    }

    animeData[currentAnimeId].seasons[currentSeasonId].episodes[eid] = {
      number: Number(num),
      title,
      watchLinks: [],
      downloadLinks: []
    };

    loadEpisodeTable();
    refreshJSONViewer();
    alert("Episode Added!");
  };

  /* ============================================================
       EPISODE EDITOR POPUP
     ============================================================ */

  window.openEpisodeEditor = function (epId) {
    currentEditingEpisode = epId;

    const season = animeData[currentAnimeId].seasons[currentSeasonId];
    const ep = season.episodes[epId];

    document.getElementById("edit-episode-box").classList.remove("hidden");

    document.getElementById("edit-ep-number").value = ep.number;
    document.getElementById("edit-ep-title").value = ep.title;

    loadWatchLinks(ep.watchLinks || []);
    loadDownloadLinks(ep.downloadLinks || []);
  };

  /* ---------------- WATCH LINKS ---------------- */

  const watchLinksBox = document.getElementById("watch-links-box");

  function loadWatchLinks(list) {
    watchLinksBox.innerHTML = "";

    list.forEach((link, i) => {
      const row = document.createElement("div");
      row.style.marginBottom = "8px";

      row.innerHTML = `
        <input type="text" class="watch-label" value="${link.label}" placeholder="Label (e.g., Filemoon)">
        <input type="text" class="watch-url" value="${link.url}" placeholder="URL">
        <button class="remove-episode-btn" onclick="this.parentElement.remove()">×</button>
      `;

      watchLinksBox.appendChild(row);
    });
  }

  document.getElementById("add-watch-link").onclick = () => {
    const row = document.createElement("div");
    row.style.marginBottom = "8px";

    row.innerHTML = `
      <input type="text" class="watch-label" placeholder="Label">
      <input type="text" class="watch-url" placeholder="URL">
      <button class="remove-episode-btn" onclick="this.parentElement.remove()">×</button>
    `;

    watchLinksBox.appendChild(row);
  };

  /* ---------------- DOWNLOAD LINKS ---------------- */

  const dlLinksBox = document.getElementById("download-links-box");

  function loadDownloadLinks(list) {
    dlLinksBox.innerHTML = "";

    list.forEach(link => {
      const row = document.createElement("div");
      row.style.marginBottom = "8px";

      row.innerHTML = `
        <input type="text" class="dl-label" value="${link.label}" placeholder="Label (e.g., 480p)">
        <input type="text" class="dl-url" value="${link.url}" placeholder="URL">
        <button class="remove-episode-btn" onclick="this.parentElement.remove()">×</button>
      `;

      dlLinksBox.appendChild(row);
    });
  }

  document.getElementById("add-download-link").onclick = () => {
    const row = document.createElement("div");
    row.style.marginBottom = "8px";

    row.innerHTML = `
      <input type="text" class="dl-label" placeholder="Label">
      <input type="text" class="dl-url" placeholder="URL">
      <button class="remove-episode-btn" onclick="this.parentElement.remove()">×</button>
    `;

    dlLinksBox.appendChild(row);
  };

  /* ---------------- SAVE EPISODE CHANGES ---------------- */

  let currentEditingEpisode = null;

  document.getElementById("save-episode-changes").onclick = () => {
    const season = animeData[currentAnimeId].seasons[currentSeasonId];
    const ep = season.episodes[currentEditingEpisode];

    ep.number = Number(document.getElementById("edit-ep-number").value);
    ep.title = document.getElementById("edit-ep-title").value.trim();

    /* WATCH LINKS SAVE */
    ep.watchLinks = [];
    document.querySelectorAll("#watch-links-box > div").forEach(row => {
      const label = row.querySelector(".watch-label").value.trim();
      const url = row.querySelector(".watch-url").value.trim();
      if (label && url) ep.watchLinks.push({ label, url });
    });

    /* DOWNLOAD LINKS SAVE */
    ep.downloadLinks = [];
    document.querySelectorAll("#download-links-box > div").forEach(row => {
      const label = row.querySelector(".dl-label").value.trim();
      const url = row.querySelector(".dl-url").value.trim();
      if (label && url) ep.downloadLinks.push({ label, url });
    });

    loadEpisodeTable();
    refreshJSONViewer();
    alert("Episode Updated!");
  };

  /* ============================================================
       DOWNLOAD JSON BUTTON
     ============================================================ */

  downloadJsonBtn.onclick = () => {
    const blob = new Blob([JSON.stringify(animeData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "anime-data-updated.json";
    a.click();

    URL.revokeObjectURL(url);
  };
   }
/* ============================================================
   8. ANALYSIS PAGE (analysis.html)
   ============================================================ */

function initAnalysisPage() {
  const panel = document.getElementById("analysis-panel");
  const jsonBox = document.getElementById("analysis-json");
  const statsBox = document.getElementById("stats-box");

  // This function only runs AFTER unlock button matches adminPassword.
  // Unlock code is inside analysis.html itself.

  if (!panel) return;

  /* -----------------------------
        FILL JSON PREVIEW
     ----------------------------- */
  jsonBox.value = JSON.stringify(animeData, null, 2);

  /* -----------------------------
        CALCULATE STATS
     ----------------------------- */
  let animeCount = 0;
  let seasonCount = 0;
  let episodeCount = 0;
  let watchLinkCount = 0;
  let downloadLinkCount = 0;

  Object.values(animeData).forEach(anime => {
    animeCount++;

    Object.values(anime.seasons).forEach(season => {
      seasonCount++;

      Object.values(season.episodes).forEach(ep => {
        episodeCount++;

        watchLinkCount += (ep.watchLinks || []).length;
        downloadLinkCount += (ep.downloadLinks || []).length;
      });
    });
  });

  statsBox.innerHTML = `
    <b>Total Anime:</b> ${animeCount}<br>
    <b>Total Seasons:</b> ${seasonCount}<br>
    <b>Total Episodes:</b> ${episodeCount}<br>
    <b>Total Watch Links:</b> ${watchLinkCount}<br>
    <b>Total Download Links:</b> ${downloadLinkCount}
  `;
}

/* ============================================================
   9. GLOBAL HELPER FUNCTIONS
   ============================================================ */

// GET PARAMETER FROM URL
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// SMOOTH SCROLL
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

console.log("%cAres Anime powered by your custom CMS ✔",
  "color:#00e0ff;font-size:14px;font-weight:bold;");
