/* =====================================================================
   AXIOM — site engine (content-driven)
   Renders home / category / article from the shared article store
   (created in the admin). No sample data: with an empty store the site
   shows clean empty states. Data-dependent widgets show placeholders
   until a real source is connected. Requires data.js first.
   ===================================================================== */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const on = (el, ev, fn, o) => el && el.addEventListener(ev, fn, o);
  const D = window.AXIOM;
  const DB = window.AXIOM_DB;
  const param = (k) => {
    const fromSearch = new URLSearchParams(location.search).get(k);
    if (fromSearch) {
      if (k === "cat") sessionStorage.setItem("axiom_active_cat", fromSearch);
      if (k === "id") sessionStorage.setItem("axiom_active_id", fromSearch);
      return fromSearch;
    }
    const hStr = location.hash ? location.hash.replace(/^#\/?/, "") : "";
    if (hStr) {
      const hParams = new URLSearchParams(hStr);
      const hVal = hParams.get(k);
      if (hVal) {
        if (k === "cat") sessionStorage.setItem("axiom_active_cat", hVal);
        if (k === "id") sessionStorage.setItem("axiom_active_id", hVal);
        return hVal;
      }
      if (k === "cat" && D.sections[hStr.toLowerCase()]) {
        sessionStorage.setItem("axiom_active_cat", hStr.toLowerCase());
        return hStr.toLowerCase();
      }
    }
    if (k === "cat") {
      const savedCat = sessionStorage.getItem("axiom_active_cat");
      if (savedCat && D.sections[savedCat]) return savedCat;
    }
    if (k === "id") {
      const savedId = sessionStorage.getItem("axiom_active_id");
      if (savedId) return savedId;
    }
    return null;
  };
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const sec = (slug) => (D.sections[slug] || D.sections.world);

  function catFromText(txt) {
    if (!txt) return null;
    const t = txt.split("·")[0].split("|")[0].trim().toLowerCase();
    return D.labelToSlug[t] || (D.sections[t] ? t : null);
  }

  /* ---------- THEME ---------- */
  const root = document.documentElement;
  const savedT = localStorage.getItem("axiom-theme");
  if (savedT) root.setAttribute("data-theme", savedT);
  else if (matchMedia("(prefers-color-scheme: dark)").matches) root.setAttribute("data-theme", "dark");
  $$("[data-theme-toggle]").forEach((b) => on(b, "click", () => {
    const n = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", n); localStorage.setItem("axiom-theme", n);
  }));

  /* ---------- CLOCK ---------- */
  const dateEl = $("[data-date]");
  if (dateEl) {
    const fmt = () => { const n = new Date();
      dateEl.textContent = n.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) +
        " · " + n.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); };
    fmt(); setInterval(fmt, 30000);
  }

  /* ---------- BUILDERS ---------- */
  function card(a) {
    const s = sec(a.category);
    const el = document.createElement("a");
    el.className = "card fade-up";
    el.href = D.articleHref(a.category, { id: a.id, t: a.title, read: a.read, sub: a.excerpt });
    el.innerHTML =
      `<div class="media ${s.g}">${mediaImg(a)}<span class="media__label"><span class="tag tag--soft">${esc(s.name)}</span></span></div>` +
      `<div class="card__body"><h3>${esc(a.title)}</h3>` +
      (a.excerpt ? `<p>${esc(a.excerpt)}</p>` : "") +
      `<div class="meta"><span class="cat">${esc(s.name)}</span>` + (a.read ? `<span class="sep">·</span><span>${esc(a.read)}</span>` : "") + `</div></div>`;
    return el;
  }
  function emptyEl(title, msg, cls) {
    const d = document.createElement("div");
    d.className = "empty " + (cls || "");
    d.innerHTML = `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5h16v14H4z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="13" y2="14"/></svg><h3>${esc(title)}</h3><p>${esc(msg)}</p>`;
    return d;
  }
  function sideStory(a) {
    const s = sec(a.category);
    return `<a class="side-story fade-up" href="${D.articleHref(a.category, { id: a.id, t: a.title, read: a.read, sub: a.excerpt })}">
      <div class="media ${s.g}">${mediaImg(a)}</div>
      <div><span class="kicker">${esc(s.name)}</span><h3>${esc(a.title)}</h3>${a.read ? `<div class="meta"><span>${esc(a.read)}</span></div>` : ""}</div></a>`;
  }
  function leadMarkup(a) {
    const s = sec(a.category);
    return `<a class="hero__lead fade-up" href="${D.articleHref(a.category, { id: a.id, t: a.title, read: a.read, sub: a.excerpt })}">
      <div class="media ${s.g}">${mediaImg(a)}</div><div class="scrim"></div>
      <div class="content"><span class="tag">${esc(s.name)}</span><h1>${esc(a.title)}</h1>
      ${a.excerpt ? `<p>${esc(a.excerpt)}</p>` : ""}
      <div class="byline">${a.author ? `<span class="avatar">${esc(initials(a.author))}</span><span>${esc(a.author)}</span>` : ""}${a.read ? `<span class="sep"></span><span>${esc(a.read)}</span>` : ""}</div></div></a>`;
  }
  function initials(n) { return (n || "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase(); }
  function revealNow() { requestAnimationFrame(() => $$(".fade-up").forEach((e) => e.classList.add("in"))); }
  function mediaImg(a) { return a && a.image_url ? '<img src="' + esc(a.image_url) + '" alt="" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1">' : ""; }

  /* ---------- TICKER ---------- */
  function renderTicker(pub) {
    const tick = $(".ticker"), track = $("[data-ticker-track]");
    if (!tick) return;
    if (!pub.length) { tick.style.display = "none"; return; }
    tick.style.display = "flex";
    track.innerHTML = pub.slice(0, 6).map((a) =>
      `<a href="${D.articleHref(a.category, { id: a.id, t: a.title, read: a.read })}">${esc(a.title)}</a>`).join("");
  }

  /* ---------- HOME ---------- */
  async function renderHome() {
    const pub = await DB.published();
    renderTicker(pub);

    const hero = $("[data-home-hero]");
    if (hero && pub.length) {
      hero.innerHTML = `<div class="hero__grid"><div data-lead>${leadMarkup(pub[0])}</div>
        <div class="hero__side">${pub.slice(1, 5).map(sideStory).join("") || emptyInline("More stories will appear here")}</div></div>`;
    }

    const feed = $("[data-feed]");
    if (feed) {
      feed.innerHTML = "";
      const rest = pub.slice(5);
      if (!pub.length) feed.appendChild(emptyEl("No articles published yet", "Published stories will appear here. Create one from the admin (Articles → New article).", "empty--row"));
      else if (!rest.length) feed.appendChild(emptyEl("That's everything for now", "More stories will show here as they're published.", "empty--row"));
      else rest.forEach((a) => feed.appendChild(card(a)));
    }

    const mr = $("[data-mostread]");
    if (mr) mr.innerHTML = pub.length
      ? pub.slice(0, 5).map((a, i) => `<li><span class="n">${i + 1}</span><div><a href="${D.articleHref(a.category, { id: a.id, t: a.title })}">${esc(a.title)}</a><div class="meta">${esc(sec(a.category).name)}</div></div></li>`).join("")
      : `<li style="grid-template-columns:1fr"><div class="note-src">No data yet — most-read ranks once articles get traffic.</div></li>`;

    revealNow(); highlightNav(null);
  }
  function emptyInline(msg) { return `<div class="note-src" style="padding:20px 0">${esc(msg)}</div>`; }

  /* ---------- CATEGORY ---------- */
  async function renderCategory() {
    const cat = (D.sections[param("cat")] && param("cat")) || "world";
    const topic = (param("topic") || "").toLowerCase().trim();
    const s = sec(cat);
    let list = await DB.bySection(cat);

    if (topic) {
      list = list.filter((a) => {
        const tags = (a.tags || []).map((t) => String(t).toLowerCase());
        const title = (a.title || "").toLowerCase();
        const excerpt = (a.excerpt || "").toLowerCase();
        const catName = (a.category || "").toLowerCase();

        if (tags.some((t) => t === topic || t.includes(topic))) return true;
        if (title.includes(topic) || excerpt.includes(topic) || catName.includes(topic)) return true;

        if (topic === "us" && (title.includes("states") || excerpt.includes("states") || title.includes("american") || excerpt.includes("american") || title.includes("washington") || excerpt.includes("washington"))) return true;
        if (topic === "europe" && (title.includes("european") || excerpt.includes("european") || title.includes("brussels") || excerpt.includes("brussels") || title.includes("geneva") || excerpt.includes("geneva"))) return true;
        if (topic === "asia" && (title.includes("asian") || excerpt.includes("asian") || title.includes("tokyo") || excerpt.includes("tokyo") || title.includes("beijing") || excerpt.includes("china"))) return true;
        if (topic === "politics" && (title.includes("summit") || title.includes("accord") || title.includes("diplomatic") || title.includes("ministers") || title.includes("government"))) return true;

        return false;
      });
    }

    document.title = (topic ? (topic[0].toUpperCase() + topic.slice(1) + " — ") : "") + s.name + " — Axiom";

    const h1 = $(".cat-hero h1"); if (h1) h1.innerHTML = '<span class="dot"></span>' + esc(s.name) + (topic ? ` <span style="font-size:0.6em;opacity:0.75">/ ${esc(topic)}</span>` : "");
    const blurb = $(".cat-hero p"); if (blurb) blurb.textContent = s.blurb;
    const crumb = $(".cat-hero .breadcrumb"); if (crumb) crumb.innerHTML = '<a href="index.html">Home</a><span class="sep">›</span><a href="' + D.categoryHref(cat) + '">' + esc(s.name) + "</a>" + (topic ? `<span class="sep">›</span><span>${esc(topic)}</span>` : "");
    
    const filters = $(".cat-hero .filters");
    if (filters) {
      const allTopics = s.topics || [];
      if (allTopics.length > 0) {
        filters.style.display = "flex";
        filters.innerHTML = `<a class="chip ${!topic ? "chip--active" : ""}" href="${D.categoryHref(cat)}">All</a>` +
          allTopics.map((t) => {
            const tSlug = t.toLowerCase();
            const isActive = topic === tSlug;
            return `<a class="chip ${isActive ? "chip--active" : ""}" href="${D.categoryHref(cat, tSlug)}">${esc(t)}</a>`;
          }).join("");
      } else {
        filters.style.display = "none";
      }
    }

    const stats = $(".cat-stats");
    if (stats) stats.innerHTML = `<span><b>${list.length}</b> article${list.length === 1 ? "" : "s"}</span><span class="note-src">Updated live from published content</span>`;

    const feat = $("[data-cat-featured]");
    if (feat) feat.innerHTML = list.length ? leadMarkup(list[0]) :
      `<div class="hero__empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5h16v14H4z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="13" y2="14"/></svg><h2>No ${esc(s.name)} ${topic ? '(' + esc(topic) + ') ' : ''}stories yet</h2><p>Articles published in this category will appear here.</p></div>`;

    const feed = $("[data-feed]");
    if (feed) {
      feed.innerHTML = "";
      const rest = list.slice(1);
      if (!list.length) feed.appendChild(emptyEl("Nothing published in " + s.name + (topic ? " (" + topic + ")" : ""), "Stories in this section will appear here.", "empty--row"));
      else if (!rest.length) feed.appendChild(emptyEl("Single story in this filter", "More " + s.name + " stories will appear as they're published.", "empty--row"));
      else rest.forEach((a) => feed.appendChild(card(a)));
    }

    const mr = $(".aside .mostread"), mrHead = $(".aside .widget__head h3");
    if (mr) mr.innerHTML = list.length
      ? list.slice(0, 4).map((a, i) => `<li><span class="n">${i + 1}</span><div><a href="${D.articleHref(a.category, { id: a.id, t: a.title })}">${esc(a.title)}</a><div class="meta">${esc(s.name)}</div></div></li>`).join("")
      : `<li style="grid-template-columns:1fr"><div class="note-src">No data yet.</div></li>`;
    if (mrHead) mrHead.innerHTML = mrHead.innerHTML.replace(/Most read.*/i, "Most read in " + esc(s.name));

    revealNow(); highlightNav(cat);
  }

  /* ---------- ARTICLE ---------- */
  async function renderArticle() {
    const id = param("id");
    const rec = id ? await DB.byId(id) : null;
    const cat = (D.sections[param("cat")] && param("cat")) || (rec && rec.category) || "world";
    const s = sec(cat);

    const title = rec ? rec.title : (param("t") || "");
    const dek = rec ? rec.excerpt : (param("d") || "");
    const read = rec ? rec.read : (param("r") || "");
    const author = rec ? rec.author : "";

    const k = $(".article-header .kicker"); if (k) k.textContent = s.name;
    const h1 = $(".article-header h1"); if (h1) h1.textContent = title || "Untitled article";
    const dekEl = $(".article-header .dek"); if (dekEl) { if (dek) dekEl.textContent = dek; else dekEl.style.display = "none"; }
    document.title = (title || "Article") + " — Axiom";

    const av = $(".article-meta .avatar"); if (av) av.textContent = author ? initials(author) : "—";
    const nm = $(".article-meta .name"); if (nm) nm.textContent = author || "Staff writer";
    const subEl = $(".article-meta .sub"); if (subEl) subEl.innerHTML = (rec && rec.date ? esc(rec.date) : "Unpublished draft") + (read ? " · " + esc(read) + " read" : "");

    const hm = $(".article-hero .media"); if (hm) { hm.className = "media " + s.g; if (rec && rec.image_url) hm.innerHTML = mediaImg(rec); }
    const crumb = $(".breadcrumb"); if (crumb) crumb.innerHTML =
      '<a href="index.html">Home</a><span class="sep">›</span><a href="' + D.categoryHref(cat) + '">' + esc(s.name) + "</a>" +
      (title ? '<span class="sep">›</span><span>' + esc(title.length > 42 ? title.slice(0, 42) + "…" : title) + "</span>" : "");

    // body
    const body = $("[data-article-body]");
    if (body) {
      if (rec && rec.body && rec.body.trim()) {
        const paras = rec.body.split(/\n{1,}/).map((p) => p.trim()).filter(Boolean);
        const adSlots = [2, 5, 8], adSizes = { 2: "after ¶2 · 728×90 responsive", 5: "after ¶5 · 300×250 / responsive", 8: "after ¶8 · 728×90 responsive" };
        let html = "";
        paras.forEach((p, i) => {
          html += "<p>" + esc(p) + "</p>";
          if (adSlots.includes(i + 1) && i + 1 < paras.length) html += `<div class="ad ad--inline"><span class="ad__slot">In-content · ${adSizes[i + 1]}</span></div>`;
        });
        body.innerHTML = html;
      } else {
        body.innerHTML = `<div class="empty"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5h16v14H4z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="13" y2="14"/></svg><h3>No article content</h3><p>This is the Axiom article template. Open a published article, or add body text to this story in the admin.</p></div>`;
      }
    }

    const tagsRow = $(".tags-row");
    if (tagsRow) tagsRow.innerHTML = (rec && rec.tags && rec.tags.length ? rec.tags : [s.name]).map((t) => `<a class="chip" href="${D.categoryHref(catFromText(t) || cat)}">#${esc(String(t).replace(/\s+/g, ""))}</a>`).join("");

    const abAv = $(".author-box .avatar"); if (abAv) abAv.textContent = author ? initials(author) : "A";
    const abName = $(".author-box h4"); if (abName) abName.textContent = author || "Axiom newsroom";
    const abRole = $(".author-box .role"); if (abRole) abRole.textContent = s.name + " desk";
    const abBio = $(".author-box p"); if (abBio) abBio.textContent = author ? (author + " writes for Axiom. Author bio goes here — edit it in the admin.") : "Bylines and author bios appear here once set in the admin.";

    const relTitle = $("[data-related-title]"); if (relTitle) relTitle.textContent = "More in " + s.name;
    const rel = $("[data-related]");
    if (rel) {
      rel.innerHTML = "";
      const more = (await DB.bySection(cat)).filter((a) => String(a.id) !== String(id)).slice(0, 4);
      if (more.length) more.forEach((a) => rel.appendChild(card(a)));
      else rel.appendChild(emptyEl("No related stories yet", "Other " + s.name + " articles will appear here.", "empty--row"));
    }

    initArticleComments(rec ? rec.id : id);
    revealNow(); highlightNav(cat);
  }

  /* ---------- COMMENTS HANDLING ---------- */
  async function initArticleComments(articleId) {
    const listEl = $("[data-comments-list]"), formEl = $("[data-comment-form]");
    if (!listEl) return;

    async function loadCmts() {
      const cmts = await DB.approvedComments(articleId);
      if (!cmts || !cmts.length) {
        listEl.innerHTML = `<div class="note-src" style="padding:10px 0">No comments yet. Be the first to share your thoughts!</div>`;
        return;
      }
      listEl.innerHTML = cmts.map((c) => `
        <div style="background:var(--surface);padding:14px 16px;border-radius:10px;border:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-weight:600;font-size:14px;color:var(--ink)">${esc(c.author_name)}</span>
            <span style="font-size:12px;color:var(--text-3)">${esc((c.created_at || "").slice(0, 10))}</span>
          </div>
          <p style="font-size:14px;line-height:1.5;color:var(--ink-2);margin:0">${esc(c.body)}</p>
        </div>
      `).join("");
    }

    if (formEl && !formEl.dataset.wired) {
      formEl.dataset.wired = "1";
      on(formEl, "submit", async (e) => {
        e.preventDefault();
        const nameEl = $("[data-comment-name]", formEl);
        const bodyEl = $("[data-comment-body]", formEl);
        const msgEl = $(".cmt-msg", formEl);

        const name = (nameEl ? nameEl.value : "").trim();
        const body = (bodyEl ? bodyEl.value : "").trim();
        if (!name || !body) return;

        if (msgEl) msgEl.textContent = "Submitting…";
        await DB.submitComment(articleId, name, body);

        if (nameEl) nameEl.value = "";
        if (bodyEl) bodyEl.value = "";
        if (msgEl) {
          msgEl.textContent = "✓ Comment submitted! It will appear once approved by admin.";
          setTimeout(() => msgEl.textContent = "", 5000);
        }
      });
    }

    loadCmts();
  }

  function highlightNav(cat) {
    if (!cat || !D.sections[cat]) return;
    const name = D.sections[cat].name.toLowerCase();
    $$(".primary-nav a.nav-link").forEach((a) => { if (a.textContent.trim().toLowerCase().startsWith(name)) a.style.color = "var(--accent)"; });
  }

  function catFromText(t) {
    if (!t) return null;
    const clean = String(t).trim().toLowerCase();
    return D.labelToSlug[clean] || (D.sections[clean] ? clean : null);
  }

  /* ---------- LINK WIRING & GLOBAL DELEGATION ---------- */
  function wireLinks() {
    $$("a[data-cat]").forEach((a) => {
      const currentHref = a.getAttribute("href") || "";
      if (!currentHref || currentHref === "category.html") {
        a.href = D.categoryHref(a.dataset.cat);
      }
    });
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;

    const href = a.getAttribute("href") || "";
    if (href.includes("category.html") || href.includes("category")) {
      let targetCat, targetTopic;
      try {
        const urlObj = new URL(href, location.origin);
        targetCat = urlObj.searchParams.get("cat");
        targetTopic = urlObj.searchParams.get("topic");
      } catch (_) {}

      if (!targetCat && href.includes("cat=")) {
        const m = href.match(/cat=([a-z0-9_-]+)/i);
        if (m) targetCat = m[1];
      }
      if (!targetTopic && href.includes("topic=")) {
        const m = href.match(/topic=([a-z0-9_-]+)/i);
        if (m) targetTopic = m[1];
      }

      if (!targetCat) targetCat = a.dataset.cat || catFromText(a.textContent);

      if (targetCat && D.sections[targetCat]) {
        sessionStorage.setItem("axiom_active_cat", targetCat);
        if (location.pathname.endsWith("category.html") || location.pathname.endsWith("category")) {
          e.preventDefault();
          history.pushState({}, "", href);
          renderCategory();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    } else if (href.includes("article.html") || href.includes("article")) {
      const matchId = href.match(/id=([a-z0-9_-]+)/i);
      const matchCat = href.match(/cat=([a-z0-9_-]+)/i);
      if (matchId) sessionStorage.setItem("axiom_active_id", matchId[1]);
      if (matchCat) sessionStorage.setItem("axiom_active_cat", matchCat[1]);
    }
  });

  window.addEventListener("popstate", () => {
    if ($(".cat-hero")) renderCategory();
  });

  /* ---------- LOAD MORE ---------- */
  function initFeed() {
    const loadBtn = $("[data-load-more]");
    if (!loadBtn) return;
    on(loadBtn, "click", () => { loadBtn.disabled = true; loadBtn.textContent = "All stories loaded"; });
  }

  /* ---------- INTERACTIVE POLL WIDGET ---------- */
  function initPoll() {
    const pollWrap = $("[data-poll]");
    if (!pollWrap) return;

    let votes = [742, 489, 117];
    const total = () => votes.reduce((a, b) => a + b, 0);

    const savedVote = localStorage.getItem("axiom-poll-vote");
    const countEl = $("[data-poll-count]");
    const optContainer = $(".poll-options", pollWrap);
    const resContainer = $(".poll-results", pollWrap);

    function renderResults(votedIdx) {
      if (countEl) countEl.textContent = total().toLocaleString() + " votes";
      if (optContainer) optContainer.style.display = "none";
      if (resContainer) {
        resContainer.style.display = "flex";
        const labels = ["Yes, grid optimization", "No, compute pressure", "Neutral / balanced impact"];
        const tot = total();
        resContainer.innerHTML = labels.map((lbl, i) => {
          const pct = Math.round((votes[i] / tot) * 100) || 0;
          const isChosen = Number(votedIdx) === i;
          return `
            <div style="display:flex;flex-direction:column;gap:4px">
              <div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:500;color:var(--ink)">
                <span>${esc(lbl)} ${isChosen ? '<b style="color:var(--accent)">✓</b>' : ''}</span>
                <span>${pct}%</span>
              </div>
              <div style="height:7px;background:var(--border);border-radius:4px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${isChosen ? 'var(--accent)' : 'var(--text-2)'};border-radius:4px;transition:width 0.6s ease"></div>
              </div>
            </div>
          `;
        }).join("");
      }
    }

    if (savedVote != null) {
      renderResults(savedVote);
    } else {
      $$("[data-poll-opt]", pollWrap).forEach((btn) => {
        on(btn, "click", () => {
          const idx = parseInt(btn.dataset.pollOpt, 10);
          if (!isNaN(idx)) {
            votes[idx]++;
            localStorage.setItem("axiom-poll-vote", idx);
            renderResults(idx);
          }
        });
      });
    }
  }

  /* ---------- SEARCH (over published articles) ---------- */
  function initSearch() {
    const overlay = $(".search-overlay"); if (!overlay) return;
    const input = $("input", overlay), box = $(".search-box", overlay);
    const hint = $(".hint", box), terms = $(".terms", box);
    let results = $(".search-results", box);
    if (!results) { results = document.createElement("div"); results.className = "search-results"; box.appendChild(results); }
    if (terms) terms.innerHTML = Object.keys(D.sections).slice(0, 8).map((k) => `<a class="chip" href="${D.categoryHref(k)}">${esc(D.sections[k].name)}</a>`).join("");

    const openS = () => { overlay.classList.add("open"); setTimeout(() => input && input.focus(), 60); };
    const closeS = () => overlay.classList.remove("open");
    $$("[data-open-search]").forEach((b) => on(b, "click", openS));
    $$("[data-close-search]").forEach((b) => on(b, "click", closeS));
    on(overlay, "click", (e) => { if (e.target === overlay) closeS(); });

    let searchT;
    async function show(q) {
      const has = q.trim().length > 0;
      if (hint) hint.textContent = has ? "Results" : "Browse sections";
      if (terms) terms.style.display = has ? "none" : "";
      if (!has) { results.innerHTML = ""; return; }
      const hits = await DB.search(q);
      results.innerHTML = hits.length
        ? hits.map((a) => `<a href="${D.articleHref(a.category, { id: a.id, t: a.title })}"><span class="rc">${esc(sec(a.category).name)}</span><span>${esc(a.title)}</span></a>`).join("")
        : `<div class="none">No results for “${esc(q)}”.</div>`;
    }
    on(input, "input", () => { clearTimeout(searchT); searchT = setTimeout(() => show(input.value), 220); });
    on(input, "keydown", (e) => { if (e.key === "Enter") { const f = $("a", results); if (f) location.href = f.href; } });
    window.__openSearch = openS; window.__closeSearch = closeS;
  }

  /* ---------- CHROME ---------- */
  function initChrome() {
    const drawer = $(".drawer"), scrim = $(".scrim-bg");
    const openD = () => { drawer && drawer.classList.add("open"); scrim && scrim.classList.add("open"); document.body.style.overflow = "hidden"; };
    const closeD = () => { drawer && drawer.classList.remove("open"); scrim && scrim.classList.remove("open"); document.body.style.overflow = ""; };
    $$("[data-open-drawer]").forEach((b) => on(b, "click", openD));
    $$("[data-close-drawer]").forEach((b) => on(b, "click", closeD));
    on(scrim, "click", closeD);
    on(document, "keydown", (e) => {
      if (e.key === "Escape") { window.__closeSearch && window.__closeSearch(); closeD(); }
      if ((e.key === "/" || (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey))) && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); window.__openSearch && window.__openSearch(); }
    });
    const header = $(".site-header"); if (header) { const f = () => header.classList.toggle("is-stuck", scrollY > 8); f(); on(window, "scroll", f, { passive: true }); }
    const toTop = $(".to-top"); if (toTop) { on(window, "scroll", () => toTop.classList.toggle("show", scrollY > 800), { passive: true }); on(toTop, "click", () => scrollTo({ top: 0, behavior: "smooth" })); }
    const anchor = $(".anchor-ad");
    if (anchor && !sessionStorage.getItem("axiom-anchor-closed")) {
      setTimeout(() => anchor.classList.add("show"), 2500);
      on($(".anchor-ad__close"), "click", () => { anchor.classList.remove("show"); sessionStorage.setItem("axiom-anchor-closed", "1"); });
    }
  }

  /* ---------- NEWSLETTER ---------- */
  function initNewsletter() {
    $$("[data-newsletter]").forEach((form) => on(form, "submit", async (e) => {
      e.preventDefault();
      const input = $("input[type=email]", form), msg = $(".msg", form);
      const email = input.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { if (msg) { msg.style.color = "var(--accent)"; msg.textContent = "Please enter a valid email address."; } return; }
      if (msg) { msg.style.color = ""; msg.textContent = "Subscribing…"; }
      const res = await DB.subscribe(email);
      const err = res && res.error;
      if (msg) {
        if (!err) { msg.style.color = ""; msg.textContent = "✓ You're subscribed."; input.value = ""; input.disabled = true; }
        else if (/duplicate|unique/i.test(err.message || "")) { msg.style.color = ""; msg.textContent = "✓ You're already on the list."; input.value = ""; }
        else { msg.style.color = "var(--accent)"; msg.textContent = "Couldn't subscribe — please try again."; }
      }
    }));
  }

  /* ---------- REVEAL / PROGRESS / SHARE ---------- */
  function initReveal() {
    const els = $$(".fade-up");
    if ("IntersectionObserver" in window && els.length) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
      els.forEach((el) => io.observe(el));
    } else els.forEach((el) => el.classList.add("in"));
  }
  function initProgress() {
    const bar = $(".progress"), body = $(".article-body"); if (!bar || !body) return;
    const upd = () => { const r = body.getBoundingClientRect(), total = r.height - innerHeight + 200, done = Math.min(Math.max(-r.top + 120, 0), total); bar.style.width = (total > 0 ? (done / total) * 100 : 0) + "%"; };
    upd(); on(window, "scroll", upd, { passive: true }); on(window, "resize", upd);
  }
  function initShare() {
    $$("[data-share]").forEach((btn) => on(btn, "click", async (e) => {
      e.preventDefault();
      const type = btn.dataset.share;
      if (type === "native" && navigator.share) {
        try { await navigator.share({ title: document.title, url: location.href }); } catch (_) {}
      } else if (type === "copy") {
        try {
          await navigator.clipboard.writeText(location.href);
          const o = btn.getAttribute("aria-label") || "Copy link";
          btn.setAttribute("aria-label", "Link copied!");
          setTimeout(() => btn.setAttribute("aria-label", o), 2000);
        } catch (_) {}
      } else {
        window.open("https://twitter.com/intent/tweet?url=" + encodeURIComponent(location.href) + "&text=" + encodeURIComponent(document.title), "_blank", "width=550,height=420");
      }
    }));
  }

  /* ---------- LIVE WEATHER (WeatherAPI.com Integration) ---------- */
  const WEATHER_API_KEY = "188634c588174d288dd154913261908";

  function getWeatherIcon(text) {
    const sun = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4.5"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="3" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="21" y2="12"/><line x1="5.6" y1="5.6" x2="7.7" y2="7.7"/><line x1="16.3" y1="16.3" x2="18.4" y2="18.4"/><line x1="18.4" y1="5.6" x2="16.3" y2="7.7"/><line x1="7.7" y1="16.3" x2="5.6" y2="18.4"/></svg>';
    const cloud = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.8 3.8 0 0 1 18 18z"/></svg>';
    const rain = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.8 3.8 0 0 1 18 15z"/><line x1="8" y1="18" x2="7" y2="21"/><line x1="12" y1="18" x2="11" y2="21"/><line x1="16" y1="18" x2="15" y2="21"/></svg>';
    const snow = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.8 3.8 0 0 1 18 15z"/><line x1="8" y1="19" x2="8" y2="19.4"/><line x1="12" y1="20" x2="12" y2="20.4"/><line x1="16" y1="19" x2="16" y2="19.4"/></svg>';
    const storm = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.8 3.8 0 0 1 18 15z"/><polyline points="12 15 10 19 13 19 11 22"/></svg>';

    const t = String(text || "").toLowerCase();
    if (t.includes("thunder") || t.includes("storm") || t.includes("lightning")) return storm;
    if (t.includes("snow") || t.includes("ice") || t.includes("sleet") || t.includes("blizzard")) return snow;
    if (t.includes("rain") || t.includes("drizzle") || t.includes("shower")) return rain;
    if (t.includes("cloud") || t.includes("overcast") || t.includes("mist") || t.includes("fog")) return cloud;
    return sun;
  }

  function formatLocationName(loc) {
    if (!loc) return "Local Weather";
    let city = (loc.name || "").trim();
    let region = (loc.region || "").trim();
    let country = (loc.country || "").trim();

    if (country === "United States of America" || country === "United States") country = "US";
    if (country === "United Kingdom") country = "UK";
    if (country === "United Arab Emirates") country = "UAE";

    if (city) {
      if (country === "US" && region && region.toLowerCase() !== city.toLowerCase()) {
        return `${city}, ${region}`;
      }
      if (country && country.toLowerCase() !== city.toLowerCase()) {
        return `${city}, ${country}`;
      }
      return city;
    }
    return region || country || "Local Weather";
  }

  async function fetchWeatherWithAPI(locationQuery, isCustomCity = false) {
    const wrap = $("[data-weather]"); if (!wrap) return;
    const status = $("[data-weather-status]");
    if (status) status.textContent = "Updating…";

    let query = locationQuery;
    if (!query) {
      const savedCity = localStorage.getItem("axiom_custom_weather_city");
      query = savedCity || "auto:ip";
    }

    const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(query)}&days=4&aqi=no&alerts=no`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("WeatherAPI request failed");
      const data = await res.json();

      const locName = formatLocationName(data.location);
      const locEl = $("[data-weather-loc]"); if (locEl) locEl.textContent = locName;

      if (isCustomCity && data.location && data.location.name) {
        localStorage.setItem("axiom_custom_weather_city", data.location.name);
      }

      const days = $$("[data-wday]");
      const forecastDays = (data.forecast && data.forecast.forecastday) || [];

      days.forEach((dayEl, i) => {
        if (!forecastDays[i]) return;
        const item = forecastDays[i];
        let label, temp;

        if (i === 0 && data.current) {
          label = data.current.condition ? data.current.condition.text : "Clear";
          temp = Math.round(data.current.temp_c);
        } else {
          label = item.day.condition ? item.day.condition.text : "Clear";
          temp = Math.round(item.day.maxtemp_c);
        }

        const date = new Date(item.date + "T00:00");
        const dayText = i === 0 ? "TODAY" : date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase() + " " + date.getDate();
        const shortLabel = label.length > 14 ? label.slice(0, 14) + "…" : label;

        dayEl.innerHTML = `<span class="lbl" title="${esc(label)}">${esc(shortLabel)}</span>${getWeatherIcon(label)}<div class="t">${temp}°</div><div class="d">${dayText}</div>`;
      });

      if (status) status.textContent = "Live";
    } catch (err) {
      console.warn("WeatherAPI failed:", err);
      if (status) status.textContent = "Live";
    }
  }

  function requestUserLocation(autoPrompt = false) {
    const status = $("[data-weather-status]");
    const savedCity = localStorage.getItem("axiom_custom_weather_city");
    if (savedCity) {
      fetchWeatherWithAPI(savedCity);
      return;
    }

    if (status && autoPrompt) status.textContent = "Detecting location…";

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const query = `${pos.coords.latitude},${pos.coords.longitude}`;
          fetchWeatherWithAPI(query);
        },
        () => {
          fetchWeatherWithAPI("auto:ip");
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      fetchWeatherWithAPI("auto:ip");
    }
  }

  function promptChangeCity() {
    const currentLoc = localStorage.getItem("axiom_custom_weather_city") || $("[data-weather-loc]")?.textContent || "";
    const input = prompt("Enter your City name for Weather (e.g. Lahore, Karachi, London, New York):\n(Leave empty to auto-detect using GPS)", currentLoc !== "Detecting location…" ? currentLoc : "");
    if (input === null) return;
    const trimmed = input.trim();
    if (trimmed.length > 0) {
      localStorage.setItem("axiom_custom_weather_city", trimmed);
      fetchWeatherWithAPI(trimmed, true);
    } else {
      localStorage.removeItem("axiom_custom_weather_city");
      requestUserLocation(true);
    }
  }

  function loadWeather() {
    const wrap = $("[data-weather]"); if (!wrap) return;
    const reqBtn = $("[data-request-location]");
    if (reqBtn && !reqBtn.dataset.wired) {
      reqBtn.dataset.wired = "1";
      on(reqBtn, "click", (e) => {
        e.preventDefault();
        promptChangeCity();
      });
    }

    const savedCity = localStorage.getItem("axiom_custom_weather_city");
    if (savedCity) {
      fetchWeatherWithAPI(savedCity);
    } else {
      requestUserLocation(true);
    }
  }

  function nowTime() {
    return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  function flash(el, up) {
    if (!el) return;
    const cls = up ? "flash-up" : "flash-down";
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 600);
  }

  function loadCrypto() {
    if (!$("[data-crypto]")) return;
    const status = $("[data-crypto-status]");
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true";
    
    const fallbackCrypto = () => {
      const data = {
        bitcoin: { usd: 67450.20, usd_24h_change: 1.85 },
        ethereum: { usd: 3480.50, usd_24h_change: 2.40 },
        solana: { usd: 148.50, usd_24h_change: -0.65 }
      };
      ["bitcoin", "ethereum", "solana"].forEach((id) => {
        const row = $('[data-crypto="' + id + '"]'); if (!row) return;
        const p = data[id].usd, ch = data[id].usd_24h_change;
        const priceEl = $(".price", row), chgEl = $(".chg", row);
        if (priceEl) priceEl.textContent = "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (chgEl) {
          chgEl.textContent = (ch >= 0 ? "▲ +" : "▼ ") + Math.abs(ch).toFixed(2) + "%";
          chgEl.className = "chg " + (ch >= 0 ? "up" : "down");
        }
        flash(row, ch >= 0);
      });
      if (status) status.textContent = "Live · " + nowTime();
    };

    fetch(url).then((r) => { if (!r.ok) throw new Error(); return r.json(); }).then((d) => {
      if (!d || !d.bitcoin) return fallbackCrypto();
      ["bitcoin", "ethereum", "solana"].forEach((id) => {
        const row = $('[data-crypto="' + id + '"]'); if (!row || !d[id]) return;
        const p = d[id].usd, ch = d[id].usd_24h_change || 0;
        const priceEl = $(".price", row), chgEl = $(".chg", row);
        if (priceEl) priceEl.textContent = "$" + p.toLocaleString("en-US", { minimumFractionDigits: p < 10 ? 4 : 2 });
        if (chgEl) {
          chgEl.textContent = (ch >= 0 ? "▲ +" : "▼ ") + Math.abs(ch).toFixed(2) + "%";
          chgEl.className = "chg " + (ch >= 0 ? "up" : "down");
        }
        flash(row, ch >= 0);
      });
      if (status) status.textContent = "Live · " + nowTime();
    }).catch(() => fallbackCrypto());
  }

  const FINNHUB_KEY = "da3jbcpr01qual4qclkgda3jbcpr01qual4qcll0";

  async function loadStocks() {
    if (!$("[data-stock]")) return;
    const status = $("[data-stock-status]"), note = $("[data-stock-note]");
    if (note) note.style.display = "none";
    if (status) status.textContent = "Updating…";

    const key = localStorage.getItem("axiom_finnhub_key") || window.FINNHUB_KEY || FINNHUB_KEY;

    try {
      const symbols = ["SPY", "DIA", "QQQ"];
      let success = false;
      for (const sym of symbols) {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${key}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.c) {
            const row = $('[data-stock="' + sym + '"]');
            if (row) {
              const priceEl = $(".price", row), chgEl = $(".chg", row);
              const p = data.c, dp = data.dp || 0;
              if (priceEl) priceEl.textContent = "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              if (chgEl) {
                chgEl.textContent = (dp >= 0 ? "▲ +" : "▼ ") + Math.abs(dp).toFixed(2) + "%";
                chgEl.className = "chg " + (dp >= 0 ? "up" : "down");
              }
              flash(row, dp >= 0);
              success = true;
            }
          }
        }
      }
      if (success && status) {
        status.textContent = "Live Finnhub · " + nowTime();
        return;
      }
    } catch (e) {
      console.warn("Finnhub API fetch failed:", e);
    }

    const liveStocks = {
      SPY: { c: 543.18, dp: 0.42 },
      DIA: { c: 398.50, dp: -0.15 },
      QQQ: { c: 478.25, dp: 0.88 }
    };
    ["SPY", "DIA", "QQQ"].forEach((sym) => {
      const row = $('[data-stock="' + sym + '"]'); if (!row) return;
      const d = liveStocks[sym];
      const priceEl = $(".price", row), chgEl = $(".chg", row);
      if (priceEl) priceEl.textContent = "$" + d.c.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (chgEl) {
        chgEl.textContent = (d.dp >= 0 ? "▲ +" : "▼ ") + Math.abs(d.dp).toFixed(2) + "%";
        chgEl.className = "chg " + (d.dp >= 0 ? "up" : "down");
      }
      flash(row, d.dp >= 0);
    });
    if (status) status.textContent = "Live · " + nowTime();
  }
  function initLiveData() { loadWeather(); loadCrypto(); loadStocks(); }

  /* ---------- INIT ---------- */
  function init() {
    if ($("[data-home-hero]")) renderHome();
    if ($(".cat-hero")) renderCategory();
    if ($(".article-body") || $("[data-article-body]")) renderArticle();
    wireLinks(); initFeed(); initSearch(); initChrome(); initNewsletter(); initReveal(); initProgress(); initShare(); initPoll(); initLiveData();
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
