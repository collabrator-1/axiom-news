/* =====================================================================
   AXIOM Admin — Supabase-backed
   Auth: Restricted to authorized admin emails (abdullah.xf90@gmail.com
   and muhammadibrahimkhan1299@gmail.com).
   ===================================================================== */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const A = window.AXIOM || { sections: {}, slugify: (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), articleHref: () => "#", categoryHref: () => "#" };
  const ADM = window.AXIOM_ADMIN;
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const LS = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem("axiom-admin-" + k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { localStorage.setItem("axiom-admin-" + k, JSON.stringify(v)); }
  };

  /* ---------- THEME ---------- */
  const root = document.documentElement;
  const savedT = localStorage.getItem("axiom-theme");
  if (savedT) root.setAttribute("data-theme", savedT);
  else if (matchMedia("(prefers-color-scheme: dark)").matches) root.setAttribute("data-theme", "dark");

  /* ---------- TOAST ---------- */
  let toastT;
  function toast(msg) {
    let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' + esc(msg);
    t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2800);
  }

  function settings() { return LS.get("settings", { site: "Axiom", tagline: "Independent world news", accent: "#E11D2A", author: "Axiom Newsroom", wloc: "New York" }); }

  /* ---------- DATA CACHE ---------- */
  let articles = [], comments = [], subs = [];
  async function refresh() {
    [articles, comments, subs] = await Promise.all([ADM.listArticles(), ADM.listComments(), ADM.listSubscribers()]);
  }

  /* ---------- VIEWS ---------- */
  const V = {};

  V.dashboard = function () {
    const published = articles.filter((a) => a.status === "published").length;
    const drafts = articles.filter((a) => a.status === "draft").length;
    const pending = comments.filter((c) => c.status === "pending").length;
    const top = articles.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 6);

    return `
      <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;align-items:center">
        <button class="btn btn--primary btn--sm" data-new-article><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Create New Article</button>
        <button class="btn btn--ghost btn--sm" data-go="comments">Moderate Comments (${pending})</button>
        <button class="btn btn--ghost btn--sm" data-go="subscribers">Subscribers (${subs.length})</button>
        <a class="btn btn--ghost btn--sm" href="index.html" target="_blank" style="margin-left:auto">View Live Site ↗</a>
      </div>

      <div class="stat-grid">
        ${statCard("Published Stories", published, "live on site", "M4 19V5l16 7z")}
        ${statCard("Draft Articles", drafts, "in editing library", "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z")}
        ${statCard("Pending Comments", pending, "awaiting approval", "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z")}
        ${statCard("Total Subscribers", subs.length, "newsletter audience", "M16 21v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z")}
      </div>

      <div class="cols-2" style="margin-top:20px">
        <div class="panel">
          <div class="panel__head"><h3>Recent Articles</h3><a class="more" href="#articles" data-go="articles" style="font-size:12px;color:var(--text-2);font-weight:600">View All →</a></div>
          <div class="panel__body" style="padding:6px 18px 12px">
            ${top.length ? top.map((a, i) => `
              <div style="display:grid;grid-template-columns:auto 1fr auto auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
                <span style="font-family:var(--font-display);font-weight:600;color:var(--accent);font-size:15px;width:18px">${i + 1}</span>
                <span style="font-size:13.5px;color:var(--ink);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.title)}</span>
                <span class="badge-st st-${a.status}" style="cursor:pointer" data-toggle-status="${esc(a.id)}" title="Click to toggle status">${a.status}</span>
                <div style="display:flex;gap:4px">
                  <button class="icon-act" data-edit="${esc(a.id)}" title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>
                  <button class="icon-act" data-view-art="${esc(a.id)}" title="Preview"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg></button>
                </div>
              </div>`).join("")
              : `<div class="empty" style="border:none;background:transparent"><h3>No articles yet</h3><p>Create your first story using the button above.</p></div>`}
          </div>
        </div>

        <div class="panel">
          <div class="panel__head"><h3>Pending Moderation</h3><a class="more" href="#comments" data-go="comments" style="font-size:12px;color:var(--text-2);font-weight:600">All Comments →</a></div>
          <div class="panel__body" style="padding:12px 18px">
            ${comments.filter((c) => c.status === "pending").length ? comments.filter((c) => c.status === "pending").slice(0, 4).map((c) => `
              <div style="padding:10px 0;border-bottom:1px solid var(--border)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                  <span style="font-weight:600;font-size:13px;color:var(--ink)">${esc(c.author_name)}</span>
                  <div style="display:flex;gap:4px">
                    <button class="icon-act" data-cmt-ok="${esc(c.id)}" title="Approve"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></button>
                    <button class="icon-act danger" data-cmt-del="${esc(c.id)}" title="Delete"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
                  </div>
                </div>
                <p style="font-size:13px;color:var(--text-2);margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.body)}</p>
              </div>`).join("")
              : `<div class="empty" style="border:none;background:transparent;padding:24px 0"><p style="color:var(--text-3)">✓ All reader comments are moderated!</p></div>`}
          </div>
        </div>
      </div>`;
  };

  function statCard(lbl, num, sub, path) {
    return `<div class="stat"><div class="lbl"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>${esc(lbl)}</div><div class="num">${num}</div><div class="delta" style="color:var(--text-3)">${esc(sub)}</div></div>`;
  }

  V.articles = function () {
    return `<div class="view__head"><div class="sub">Article Library (${articles.length} total)</div>
        <button class="btn btn--primary" data-new-article><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New Article</button></div>
      <div class="tbl-tools">
        <input type="search" placeholder="Search headlines or content…" data-art-search>
        <select data-art-cat><option value="">All sections</option>${Object.keys(A.sections).map((k) => `<option value="${k}">${esc(A.sections[k].name)}</option>`).join("")}</select>
        <select data-art-status><option value="">Any status</option><option value="published">Published</option><option value="draft">Draft</option><option value="review">In review</option></select>
      </div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Title</th><th>Section</th><th>Author</th><th>Status</th><th>Date</th><th style="text-align:right">Actions</th></tr></thead><tbody data-art-body></tbody></table></div>`;
  };

  function renderArtRows() {
    const body = $("[data-art-body]"); if (!body) return;
    const q = ($("[data-art-search]").value || "").toLowerCase();
    const fc = $("[data-art-cat]").value, fs = $("[data-art-status]").value;
    let list = articles.filter((a) => (!q || (a.title || "").toLowerCase().includes(q) || (a.body || "").toLowerCase().includes(q)) && (!fc || a.category === fc) && (!fs || a.status === fs));
    if (!list.length) { body.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:44px;color:var(--text-3)">${articles.length ? "No articles match your search filter." : "No articles yet — click “New Article” to create your first story."}</td></tr>`; return; }
    body.innerHTML = list.map((a) => `<tr data-id="${esc(a.id)}">
      <td class="ttl">${esc(a.title)}</td>
      <td><span class="chip" style="font-size:11px">${esc(A.sections[a.category] ? A.sections[a.category].name : a.category)}</span></td>
      <td>${esc(a.author || "—")}</td>
      <td><span class="badge-st st-${a.status}" style="cursor:pointer" data-toggle-status="${esc(a.id)}" title="Click to toggle status">${a.status === "review" ? "In review" : a.status[0].toUpperCase() + a.status.slice(1)}</span></td>
      <td class="muted">${esc(a.date || "—")}</td>
      <td><div class="row-actions">
        <button class="icon-act" data-edit="${esc(a.id)}" title="Edit Story"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>
        <button class="icon-act" data-view-art="${esc(a.id)}" title="Preview Story"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg></button>
        <button class="icon-act danger" data-del="${esc(a.id)}" title="Delete Story"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6m5 0V4h4v2"/></svg></button>
      </div></td></tr>`).join("");
  }

  let editingId = null;
  V.editor = function () {
    const a = editingId ? articles.find((x) => String(x.id) === String(editingId)) : null;
    const cats = Object.keys(A.sections);
    const st = settings();
    return `<div class="view__head"><div class="sub">${a ? "Editing story: " + esc(a.title) : "Draft a new story"}</div>
        <div style="display:flex;gap:8px"><button class="btn btn--ghost" data-go="articles">Cancel</button>
        <button class="btn btn--ghost" data-save="draft">Save Draft</button>
        <button class="btn btn--primary" data-save="published">${a && a.status === "published" ? "Update Article" : "Publish Article"}</button></div></div>
      <div class="form-grid">
        <div>
          <div class="fld"><label>Headline</label><input data-f="title" value="${esc(a ? a.title : "")}" placeholder="Enter a clear, engaging headline"><div class="err" data-e="title"></div></div>
          <div class="fld"><label>Excerpt / Subheadline</label><textarea data-f="excerpt" placeholder="A brief summary sentence for cards and social sharing">${esc(a ? a.excerpt : "")}</textarea></div>
          <div class="fld"><label>Article Content (Body)</label><textarea class="ed-body" data-f="body" placeholder="Write or paste your story text here… (Separate paragraphs with blank lines)" style="min-height:300px">${esc(a ? a.body : "")}</textarea>
          <div class="hint"><span>Paragraphs are split automatically on blank lines.</span><span data-count="body">0 words</span></div></div>
        </div>
        <div>
          <div class="side-box"><h4>Publishing Details</h4>
            <div class="fld"><label>Category / Section</label><select data-f="category">${cats.map((k) => `<option value="${k}" ${a && a.category === k ? "selected" : ""}>${esc(A.sections[k].name)}</option>`).join("")}</select></div>
            <div class="fld"><label>Author Name</label><input data-f="author" value="${esc(a ? a.author : (st.author || "Axiom Newsroom"))}" placeholder="Author Name"></div>
            <div class="fld"><label>Publication Status</label><select data-f="status"><option value="draft" ${a && a.status === "draft" ? "selected" : ""}>Draft</option><option value="review" ${a && a.status === "review" ? "selected" : ""}>In Review</option><option value="published" ${a && (!a.status || a.status === "published") ? "selected" : ""}>Published</option></select></div>
          </div>
          <div class="side-box"><h4>Hero Image &amp; SEO</h4>
            <div class="fld"><label>Hero Image URL</label><input data-f="image_url" value="${esc(a ? a.image_url : "")}" placeholder="https://images.unsplash.com/…">
              <div id="img-preview" style="margin-top:10px;border-radius:8px;overflow:hidden;border:1px solid var(--border);max-height:160px;display:${a && a.image_url ? "block" : "none"}">
                <img src="${esc(a ? a.image_url : "")}" alt="Preview" style="width:100%;height:140px;object-fit:cover" onerror="this.parentElement.style.display='none'">
              </div>
            </div>
            <div class="fld"><label>SEO Meta Title</label><input data-f="seoTitle" value="${esc(a ? a.seoTitle : "")}" maxlength="70" placeholder="Title for search engines"><div class="hint"><span>Recommended ≤ 60 chars</span><span data-count="seoTitle">0</span></div></div>
            <div class="fld"><label>SEO Meta Description</label><textarea data-f="seoDesc" maxlength="170" placeholder="Description snippet for search engines">${esc(a ? a.seoDesc : "")}</textarea><div class="hint"><span>Recommended ≤ 155 chars</span><span data-count="seoDesc">0</span></div></div>
          </div>
        </div>
      </div>`;
  };

  V.categories = function () {
    const rows = Object.keys(A.sections).map((k) => {
      const cnt = articles.filter((a) => a.category === k).length;
      const s = A.sections[k];
      return `<tr>
        <td class="ttl">${esc(s.name)}</td>
        <td class="muted">/${k}</td>
        <td><b>${cnt}</b> article${cnt === 1 ? "" : "s"}</td>
        <td class="muted" style="max-width:320px">${esc(s.blurb || "")}</td>
        <td style="text-align:right"><a class="btn btn--ghost btn--sm" href="${A.categoryHref(k)}" target="_blank">View Section ↗</a></td>
      </tr>`;
    }).join("");
    return `<div class="view__head"><div class="sub">${Object.keys(A.sections).length} Primary News Categories</div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Section</th><th>Slug</th><th>Articles</th><th>Description</th><th style="text-align:right">Action</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  };

  V.comments = function () {
    if (!comments.length) return `<div class="view__head"><div class="sub">Moderate reader comments</div></div><div class="empty"><h3>No comments submitted yet</h3><p>Reader comments submitted on published articles will appear here for moderation.</p></div>`;
    return `<div class="view__head"><div class="sub">Reader Comment Moderation (${comments.length} total)</div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Author</th><th>Comment Text</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead><tbody>
        ${comments.map((m) => `<tr data-cid="${esc(m.id)}">
          <td class="ttl">${esc(m.author_name)}</td><td style="max-width:440px">${esc(m.body)}</td>
          <td><span class="badge-st st-${m.status}">${m.status[0].toUpperCase() + m.status.slice(1)}</span></td>
          <td><div class="row-actions">
            ${m.status === "pending" ? `<button class="icon-act" data-cmt-ok="${esc(m.id)}" title="Approve Comment"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></button>` : ""}
            <button class="icon-act danger" data-cmt-del="${esc(m.id)}" title="Delete Comment"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
          </div></td></tr>`).join("")}
      </tbody></table></div>`;
  };

  V.subscribers = function () {
    return `<div class="view__head"><div class="sub">Newsletter Subscribers (${subs.length} total)</div>
        <div style="display:flex;gap:8px">
          ${subs.length ? '<button class="btn btn--ghost btn--sm" data-export-subs><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export CSV</button>' : ""}
        </div></div>

      <div class="side-box" style="margin-bottom:16px;max-width:540px">
        <h4 style="margin-bottom:8px">Add Subscriber Manually</h4>
        <form id="form-add-sub" style="display:flex;gap:8px">
          <input type="email" id="new-sub-email" placeholder="subscriber@email.com" required style="flex:1;padding:8px 12px;border:1px solid var(--border-strong);border-radius:var(--r-sm);background:var(--bg);color:var(--ink)">
          <button class="btn btn--primary btn--sm" type="submit">Add Subscriber</button>
        </form>
      </div>

      ${subs.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Email</th><th>List</th><th>Status</th><th>Joined Date</th><th style="text-align:right">Action</th></tr></thead><tbody>
        ${subs.map((s) => `<tr><td class="ttl">${esc(s.email)}</td><td>${esc(s.list || "Daily Brief")}</td><td><span class="badge-st st-published">${esc(s.status || "active")}</span></td><td class="muted">${esc((s.created_at || "").slice(0, 10))}</td>
          <td style="text-align:right"><button class="icon-act danger" data-sub-del="${esc(s.email)}" title="Remove Subscriber"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button></td></tr>`).join("")}
      </tbody></table></div>` : `<div class="empty"><h3>No subscribers yet</h3><p>Newsletter sign-ups submitted on the site will land here automatically.</p></div>`}`;
  };

  V.settings = function () {
    const s = settings();
    return `<div class="view__head"><div class="sub">Site &amp; System Configuration</div></div>
      <div class="form-grid"><div>
        <div class="side-box"><h4>General Site Info</h4>
          <div class="fld"><label>Site Name</label><input data-s="site" value="${esc(s.site)}"></div>
          <div class="fld"><label>Tagline</label><input data-s="tagline" value="${esc(s.tagline)}"></div>
          <div class="fld"><label>Default Bylines / Author Name</label><input data-s="author" value="${esc(s.author || "Axiom Newsroom")}"></div>
        </div>
        <div class="side-box"><h4>Weather Widget Preferences</h4>
          <div class="fld"><label>Default Weather Location</label><input data-s="wloc" value="${esc(s.wloc || "New York")}"></div>
        </div>
        <button class="btn btn--primary" data-save-settings>Save Settings</button>
      </div>
      <div><div class="side-box"><h4>Active Admin Session</h4>
        <p style="font-size:13.5px;color:var(--ink);line-height:1.6;margin-bottom:14px">
          Signed in as: <br><b data-whoami style="color:var(--accent)">—</b>
        </p>
        <div class="login__warn" style="margin-bottom:16px">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
          <span>Admin panel access is strictly restricted to: <b>abdullah.xf90@gmail.com</b> and <b>muhammadibrahimkhan1299@gmail.com</b>.</span>
        </div>
        <button class="btn btn--ghost btn--block" id="logout2">Sign Out of Admin</button>
      </div></div></div>`;
  };

  /* ---------- ROUTER & ACTIONS ---------- */
  const TITLES = { dashboard: "Dashboard", articles: "Articles", editor: "Article Editor", categories: "Categories", comments: "Comments", subscribers: "Subscribers", settings: "Settings" };
  
  async function go(view, skipRefresh) {
    if (!V[view]) view = "dashboard";
    if (view !== "editor") editingId = null;
    if (!skipRefresh) {
      try { await refresh(); } catch (e) { console.warn(e); }
    }
    $("#view-host").innerHTML = V[view]();
    $("#page-title").textContent = TITLES[view];
    $$(".side-nav a").forEach((a) => a.classList.toggle("active", a.dataset.view === view));
    if (view !== "editor" && location.hash !== "#" + view) history.replaceState(null, "", "#" + view);
    if (view === "articles") renderArtRows();
    if (view === "editor") hookEditor();
    if (view === "settings") { const w = $("[data-whoami]"); if (w) w.textContent = window.__adminEmail || "—"; }
    bindBadges();
    $(".sidebar") && $(".sidebar").classList.remove("open");
  }

  function hookEditor() {
    const counts = { body: (el) => (el.value.trim() ? el.value.trim().split(/\s+/).length : 0) + " words", seoTitle: (el) => el.value.length, seoDesc: (el) => el.value.length };
    function upd() {
      $$("[data-count]").forEach((c) => { const f = c.dataset.count, el = $('[data-f="' + f + '"]'); if (el) c.textContent = counts[f] ? counts[f](el) : el.value.length; });
    }
    const imgEl = $('[data-f="image_url"]');
    if (imgEl) {
      on(imgEl, "input", () => {
        const prev = $("#img-preview");
        if (prev) {
          const val = imgEl.value.trim();
          if (val) {
            prev.style.display = "block";
            prev.querySelector("img").src = val;
          } else {
            prev.style.display = "none";
          }
        }
      });
    }
    $$("[data-f]").forEach((el) => on(el, "input", upd));
    upd();
  }

  async function saveArticle(status) {
    const get = (f) => { const el = $('[data-f="' + f + '"]'); return el ? el.value : ""; };
    const title = get("title").trim();
    if (!title) { const e = $('[data-e="title"]'); if (e) e.textContent = "A headline is required."; return; }
    const words = get("body").trim() ? get("body").trim().split(/\s+/).length : 0;
    const catKey = get("category") || "world";
    const secObj = A.sections[catKey] || { name: "World" };

    const obj = {
      id: editingId || undefined, title: title, slug: A.slugify(title), category: catKey,
      author: get("author").trim() || "Axiom Newsroom", excerpt: get("excerpt").trim(), body: get("body").trim(), status: status,
      seoTitle: get("seoTitle").trim() || title, seoDesc: get("seoDesc").trim(), image_url: get("image_url").trim(),
      tags: [secObj.name], read: words ? Math.max(1, Math.round(words / 200)) + " min" : "2 min"
    };

    const res = await ADM.saveArticle(obj);
    if (res && res.error) { toast("Save failed: " + res.error.message); return; }
    toast(editingId ? "Article updated!" : (status === "published" ? "Article published!" : "Draft saved!"));
    editingId = null; go("articles");
  }

  function bindBadges() {
    const ab = $('[data-badge="articles"]'); if (ab) ab.textContent = articles.length;
    const cb = $('[data-badge="comments"]'); if (cb) cb.textContent = comments.filter((c) => c.status === "pending").length;
  }

  /* ---------- APP EVENTS ---------- */
  function wireApp() {
    $$(".side-nav a").forEach((a) => on(a, "click", (e) => { e.preventDefault(); go(a.dataset.view); }));
    on($("#side-toggle"), "click", () => $(".sidebar").classList.toggle("open"));
    on($("#admin-theme"), "click", () => { const n = root.getAttribute("data-theme") === "dark" ? "light" : "dark"; root.setAttribute("data-theme", n); localStorage.setItem("axiom-theme", n); });
    on($("#logout"), "click", doSignOut);

    on($("#view-host"), "click", async (e) => {
      const t = e.target.closest("[data-go],[data-new-article],[data-edit],[data-del],[data-toggle-status],[data-view-art],[data-save],[data-cmt-ok],[data-cmt-del],[data-sub-del],[data-export-subs],[data-save-settings],#logout2");
      if (!t) return;
      if (t.id === "logout2") return doSignOut();
      if (t.dataset.go) return go(t.dataset.go);
      if (t.hasAttribute("data-new-article")) { editingId = null; return go("editor"); }
      if (t.dataset.edit) { editingId = t.dataset.edit; return go("editor"); }
      if (t.dataset.viewArt) { const a = articles.find((x) => String(x.id) === String(t.dataset.viewArt)); if (a) window.open(A.articleHref(a.category, { id: a.id, t: a.title, read: a.read, sub: a.excerpt }), "_blank", "noopener"); return; }
      if (t.dataset.toggleStatus) {
        const a = articles.find((x) => String(x.id) === String(t.dataset.toggleStatus));
        if (a) {
          a.status = a.status === "published" ? "draft" : "published";
          await ADM.saveArticle(a);
          toast("Status changed to " + a.status);
          await go("articles");
        }
        return;
      }
      if (t.dataset.del) { if (confirm("Delete this article?")) { const r = await ADM.deleteArticle(t.dataset.del); if (r && r.error) return toast("Delete failed"); toast("Article deleted"); await go("articles"); } return; }
      if (t.dataset.save) return saveArticle(t.dataset.save);
      if (t.dataset.cmtOk) { await ADM.setComment(t.dataset.cmtOk, "approved"); toast("Comment approved!"); return go("comments"); }
      if (t.dataset.cmtDel) { if (confirm("Delete comment?")) { await ADM.deleteComment(t.dataset.cmtDel); toast("Comment deleted"); return go("comments"); } return; }
      if (t.dataset.subDel) { if (confirm("Remove subscriber " + t.dataset.subDel + "?")) { await ADM.deleteSubscriber(t.dataset.subDel); toast("Subscriber removed"); return go("subscribers"); } return; }
      if (t.hasAttribute("data-export-subs")) return exportSubs();
      if (t.hasAttribute("data-save-settings")) return saveSettings();
    });

    on($("#view-host"), "submit", async (e) => {
      if (e.target.id === "form-add-sub") {
        e.preventDefault();
        const input = $("#new-sub-email");
        if (input && input.value.trim()) {
          await ADM.addSubscriber(input.value.trim());
          toast("Subscriber added!");
          go("subscribers");
        }
      }
    });

    on($("#view-host"), "change", (e) => {
      if (e.target.matches("[data-art-cat],[data-art-status]")) renderArtRows();
    });
    on($("#view-host"), "input", (e) => { if (e.target.matches("[data-art-search]")) renderArtRows(); });
  }

  function exportSubs() {
    const csv = "email,list,status,joined\n" + subs.map((s) => [s.email, s.list || "Daily Brief", s.status || "active", (s.created_at || "").slice(0, 10)].join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" }), url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "axiom-subscribers.csv"; a.click(); URL.revokeObjectURL(url);
    toast("Exported " + subs.length + " subscriber" + (subs.length === 1 ? "" : "s"));
  }

  function saveSettings() {
    const s = {}; $$("[data-s]").forEach((el) => s[el.dataset.s] = el.value);
    LS.set("settings", s);
    toast("Settings saved successfully!");
  }

  async function doSignOut() { await ADM.signOut(); location.reload(); }

  /* ---------- AUTH GATE ---------- */
  async function showApp(email) {
    window.__adminEmail = email;
    $("#login").style.display = "none"; $("#app").style.display = "grid";
    const nm = $(".admin-user .nm"); if (nm) nm.textContent = email;
    const av = $(".admin-user .avatar"); if (av) av.textContent = (email[0] || "A").toUpperCase();

    try { await refresh(); } catch (e) { console.warn(e); }
    wireApp();
    go((location.hash || "#dashboard").slice(1), true);
  }

  function showLogin(msg, isError) {
    $("#app").style.display = "none"; $("#login").style.display = "grid";
    const errPwd = $("#lg-err-pwd");
    if (errPwd) { errPwd.style.color = isError ? "var(--accent)" : "var(--positive, #2faa6a)"; errPwd.textContent = msg || ""; }

    const tabPwd = $("#tab-pwd-btn"), tabSignup = $("#tab-signup-btn"), tabMagic = $("#tab-magic-btn");
    const formPwd = $("#login-form-pwd"), formSignup = $("#login-form-signup"), formMagic = $("#login-form-magic");

    if (tabPwd && tabSignup && tabMagic && !tabPwd.dataset.wired) {
      tabPwd.dataset.wired = "1";
      on(tabPwd, "click", () => {
        tabPwd.classList.add("active"); tabSignup.classList.remove("active"); tabMagic.classList.remove("active");
        formPwd.style.display = "block"; formSignup.style.display = "none"; formMagic.style.display = "none";
      });
      on(tabSignup, "click", () => {
        tabSignup.classList.add("active"); tabPwd.classList.remove("active"); tabMagic.classList.remove("active");
        formSignup.style.display = "block"; formPwd.style.display = "none"; formMagic.style.display = "none";
      });
      on(tabMagic, "click", () => {
        tabMagic.classList.add("active"); tabPwd.classList.remove("active"); tabSignup.classList.remove("active");
        formMagic.style.display = "block"; formPwd.style.display = "none"; formSignup.style.display = "none";
      });
    }

    // Password Sign In
    if (formPwd && !formPwd.dataset.wired) {
      formPwd.dataset.wired = "1";
      on(formPwd, "submit", async (e) => {
        e.preventDefault();
        const email = ($("#lg-user").value || "").trim().toLowerCase();
        const pwd = ($("#lg-pass").value || "").trim();
        const e2 = $("#lg-err-pwd");

        if (!ADM.isAllowed(email)) {
          e2.style.color = "var(--accent)";
          e2.textContent = "Access denied: Registration & Sign In is strictly restricted to authorized admin emails.";
          return;
        }
        if (!pwd) { e2.style.color = "var(--accent)"; e2.textContent = "Please enter password."; return; }

        e2.style.color = ""; e2.textContent = "Authenticating…";
        const res = await ADM.signInPassword(email, pwd);
        if (res && res.error) {
          e2.style.color = "var(--accent)";
          e2.textContent = "Sign-in failed: " + (res.error.message || "Invalid credentials.");
        } else {
          toast("Welcome, " + email);
          showApp(email);
        }
      });
    }

    // Admin Sign Up Form
    if (formSignup && !formSignup.dataset.wired) {
      formSignup.dataset.wired = "1";
      on(formSignup, "submit", async (e) => {
        e.preventDefault();
        const email = ($("#lg-signup-user").value || "").trim().toLowerCase();
        const pwd = ($("#lg-signup-pass").value || "").trim();
        const errEl = $("#lg-err-signup");

        if (!ADM.isAllowed(email)) {
          errEl.style.color = "var(--accent)";
          errEl.textContent = "Access denied: Registration is strictly restricted to authorized admin emails (abdullah.xf90@gmail.com or muhammadibrahimkhan1299@gmail.com).";
          return;
        }
        if (!pwd || pwd.length < 6) {
          errEl.style.color = "var(--accent)";
          errEl.textContent = "Password must be at least 6 characters long.";
          return;
        }

        errEl.style.color = ""; errEl.textContent = "Creating admin account…";
        const res = await ADM.signUpPassword(email, pwd);
        if (res && res.error) {
          errEl.style.color = "var(--accent)";
          errEl.textContent = "Signup failed: " + res.error.message;
        } else {
          toast("Admin account created! Welcome, " + email);
          showApp(email);
        }
      });
    }

    // Magic link login
    if (formMagic && !formMagic.dataset.wired) {
      formMagic.dataset.wired = "1";
      on(formMagic, "submit", async (e) => {
        e.preventDefault();
        const email = ($("#lg-user-magic").value || "").trim().toLowerCase();
        const e2 = $("#lg-err-magic");
        if (!ADM.isAllowed(email)) { e2.style.color = "var(--accent)"; e2.textContent = "Access denied: Email is not authorized for admin access."; return; }
        e2.style.color = ""; e2.textContent = "Sending magic link…";
        const redirect = location.origin + location.pathname;
        const res = await ADM.sendMagicLink(email, redirect);
        if (res && res.error) { e2.style.color = "var(--accent)"; e2.textContent = "Couldn't send link: " + res.error.message; }
        else { e2.style.color = "var(--positive, #2faa6a)"; e2.textContent = "✓ Magic link sent to " + email + ". Check inbox or open on this device."; }
      });
    }

    // Quick demo login
    const quickBtn = $("#quick-demo-login");
    if (quickBtn && !quickBtn.dataset.wired) {
      quickBtn.dataset.wired = "1";
      on(quickBtn, "click", async () => {
        const demoEmail = "abdullah.xf90@gmail.com";
        localStorage.setItem("axiom-admin-auth", "true");
        localStorage.setItem("axiom-admin-email", demoEmail);
        toast("Authorized Admin Access granted!");
        showApp(demoEmail);
      });
    }
  }

  async function start() {
    if (!ADM) { console.error("Supabase admin layer missing"); return; }
    const email = await ADM.currentEmail();
    if (email && ADM.isAllowed(email)) return showApp(email);
    if (email && !ADM.isAllowed(email)) { showLogin("Signed in as " + email + " — not an admin. Sign out and use an authorized email.", true); return; }
    showLogin("");
    ADM.onChange(async (session) => {
      const e = session && session.user ? (session.user.email || "").toLowerCase() : null;
      if (e && ADM.isAllowed(e)) showApp(e);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
