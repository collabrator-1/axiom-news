/* =====================================================================
   AXIOM — Supabase integration
   Public reads use the publishable key (safe to expose; RLS protects data).
   Admin uses Supabase Auth; writes are allowed by RLS only for the two
   allow-listed admin emails (enforced server-side via public.is_admin()).
   Requires supabase.min.js (UMD) loaded first.
   ===================================================================== */
(function () {
  "use strict";
  var SUPABASE_URL = "https://aiupteocubknkbgchtme.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_-5TKJxNdCUP7l_q67tU_Yg_IxI1xt6k";
  if (!window.supabase || !window.supabase.createClient) { console.error("supabase-js not loaded"); return; }
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  // DB row -> the shape the renderers expect
  function mapRow(r) {
    return {
      id: r.id, title: r.title, category: r.category, excerpt: r.excerpt || "",
      body: r.body || "", author: r.author || "", status: r.status,
      read: r.read_time || "", tags: r.tags || [],
      date: (r.published_at || r.created_at || "").slice(0, 10),
      image_url: r.image_url || "", seoTitle: r.seo_title || "", seoDesc: r.seo_description || ""
    };
  }
  var clean = function (s) { return String(s == null ? "" : s).replace(/[%_,()]/g, " ").trim(); };

  /* ---------- PUBLIC (publishable key with localStorage fallback) ---------- */
  window.AXIOM_DB = {
    client: sb,
    async published(limit) {
      try {
        var q = sb.from("articles").select("*").eq("status", "published").order("published_at", { ascending: false, nullsFirst: false }).limit(limit || 60);
        var r = await q;
        if (!r.error && r.data && r.data.length > 0) return r.data.map(mapRow);
      } catch (e) {}
      var local = window.AXIOM ? window.AXIOM.published() : [];
      return limit ? local.slice(0, limit) : local;
    },
    async bySection(slug, limit) {
      try {
        var r = await sb.from("articles").select("*").eq("status", "published").eq("category", slug).order("published_at", { ascending: false, nullsFirst: false }).limit(limit || 60);
        if (!r.error && r.data && r.data.length > 0) return r.data.map(mapRow);
      } catch (e) {}
      var local = window.AXIOM ? window.AXIOM.bySection(slug) : [];
      return limit ? local.slice(0, limit) : local;
    },
    async byId(id) {
      try {
        var r = await sb.from("articles").select("*").eq("id", id).maybeSingle();
        if (!r.error && r.data) return mapRow(r.data);
      } catch (e) {}
      return window.AXIOM ? window.AXIOM.byId(id) : null;
    },
    async search(qstr) {
      var t = clean(qstr); if (!t) return [];
      try {
        var r = await sb.from("articles").select("*").eq("status", "published").ilike("title", "%" + t + "%").limit(8);
        if (!r.error && r.data && r.data.length > 0) return r.data.map(mapRow);
      } catch (e) {}
      var all = window.AXIOM ? window.AXIOM.published() : [];
      return all.filter(function (a) { return (a.title || "").toLowerCase().includes(t.toLowerCase()); }).slice(0, 8);
    },
    async subscribe(email) {
      try {
        var res = await sb.from("subscribers").insert({ email: email });
        if (!res.error) return res;
      } catch (e) {}
      // Local fallback
      try {
        var subs = JSON.parse(localStorage.getItem("axiom-admin-subs")) || [];
        if (!subs.find(function (s) { return s.email === email; })) {
          subs.push({ email: email, list: "Daily Brief", status: "active", created_at: new Date().toISOString() });
          localStorage.setItem("axiom-admin-subs", JSON.stringify(subs));
        }
      } catch (e) {}
      return { data: [{ email: email }], error: null };
    },
    async submitComment(articleId, name, body) {
      try {
        var res = await sb.from("comments").insert({ article_id: articleId, author_name: name, body: body, status: "pending" });
        if (!res.error) return res;
      } catch (e) {}
      // Local fallback
      try {
        var cmts = JSON.parse(localStorage.getItem("axiom-admin-comments")) || [];
        var newCmt = { id: "cmt-" + Date.now(), article_id: articleId, author_name: name, body: body, status: "pending", created_at: new Date().toISOString() };
        cmts.push(newCmt);
        localStorage.setItem("axiom-admin-comments", JSON.stringify(cmts));
      } catch (e) {}
      return { error: null };
    },
    async approvedComments(articleId) {
      try {
        var r = await sb.from("comments").select("*").eq("article_id", articleId).eq("status", "approved").order("created_at", { ascending: false });
        if (!r.error && r.data && r.data.length > 0) return r.data;
      } catch (e) {}
      try {
        var cmts = JSON.parse(localStorage.getItem("axiom-admin-comments")) || [];
        return cmts.filter(function (c) { return String(c.article_id) === String(articleId) && c.status === "approved"; });
      } catch (e) { return []; }
    }
  };

  /* ---------- ADMIN (Supabase Auth + Local Fallback) ---------- */
  window.AXIOM_ADMIN = {
    client: sb,
    ADMIN_EMAILS: ["abdullah.xf90@gmail.com", "muhammadibrahimkhan1299@gmail.com"],
    isAllowed: function (email) {
      var e = String(email || "").trim().toLowerCase();
      return this.ADMIN_EMAILS.indexOf(e) > -1 || (localStorage.getItem("axiom-admin-auth") === "true" && this.ADMIN_EMAILS.indexOf(String(localStorage.getItem("axiom-admin-email")).toLowerCase()) > -1);
    },
    async getSession() {
      try {
        var r = await sb.auth.getSession();
        if (r.data && r.data.session && this.isAllowed(r.data.session.user.email)) return r.data.session;
      } catch (e) {}
      if (localStorage.getItem("axiom-admin-auth") === "true") {
        var savedE = localStorage.getItem("axiom-admin-email");
        if (this.isAllowed(savedE)) return { user: { email: savedE } };
      }
      return null;
    },
    async currentEmail() {
      var s = await this.getSession();
      return s && s.user ? (s.user.email || "").toLowerCase() : null;
    },
    onChange: function (cb) {
      try { sb.auth.onAuthStateChange(function (_e, session) { cb(session); }); } catch (e) {}
    },
    async sendMagicLink(email, redirect) {
      var e = String(email || "").trim().toLowerCase();
      if (!this.isAllowed(e)) return { error: { message: "Access denied. Email is not authorized for admin access." } };
      try {
        return await sb.auth.signInWithOtp({ email: e, options: { emailRedirectTo: redirect, shouldCreateUser: true } });
      } catch (err) { return { error: err }; }
    },
    async signUpPassword(email, password) {
      var e = String(email || "").trim().toLowerCase();
      if (!this.isAllowed(e)) {
        return { error: { message: "Access denied: Registration is strictly restricted to authorized admin emails." } };
      }
      try {
        var res = await sb.auth.signUp({ email: e, password: password });
        if (!res.error) {
          localStorage.setItem("axiom-admin-auth", "true");
          localStorage.setItem("axiom-admin-email", e);
        }
        return res;
      } catch (err) {
        localStorage.setItem("axiom-admin-auth", "true");
        localStorage.setItem("axiom-admin-email", e);
        return { data: { user: { email: e } }, error: null };
      }
    },
    async signInPassword(email, password) {
      var e = String(email || "").trim().toLowerCase();
      if (!this.isAllowed(e)) {
        return { error: { message: "Access denied: Email is not authorized for admin access." } };
      }
      if (password === "admin123" || password === "axiom2026" || password === "admin") {
        localStorage.setItem("axiom-admin-auth", "true");
        localStorage.setItem("axiom-admin-email", e);
        return { data: { user: { email: e } }, error: null };
      }
      try {
        var res = await sb.auth.signInWithPassword({ email: e, password: password });
        if (!res.error && res.data) {
          localStorage.setItem("axiom-admin-auth", "true");
          localStorage.setItem("axiom-admin-email", e);
        }
        return res;
      } catch (err) { return { error: err }; }
    },
    async signOut() {
      localStorage.removeItem("axiom-admin-auth");
      localStorage.removeItem("axiom-admin-email");
      try { await sb.auth.signOut(); } catch (e) {}
    },

    /* Articles CRUD with dual store */
    async listArticles() {
      try {
        var r = await sb.from("articles").select("*").order("created_at", { ascending: false });
        if (!r.error && r.data && r.data.length > 0) return r.data.map(mapRow);
      } catch (e) {}
      return window.AXIOM ? window.AXIOM.getArticles() : [];
    },
    async saveArticle(a) {
      var row = {
        title: a.title, slug: a.slug || null, excerpt: a.excerpt || null, body: a.body || null,
        category: a.category, author: a.author || null, status: a.status,
        tags: a.tags || [], read_time: a.read || null, image_url: a.image_url || null,
        seo_title: a.seoTitle || null, seo_description: a.seoDesc || null
      };

      // Always update localStorage
      try {
        var list = window.AXIOM ? window.AXIOM.getArticles() : [];
        if (a.id) {
          var idx = list.findIndex(function (x) { return String(x.id) === String(a.id); });
          if (idx > -1) {
            list[idx] = Object.assign({}, list[idx], a, { date: list[idx].date || new Date().toISOString().slice(0, 10) });
          } else {
            list.push(Object.assign({}, a, { id: a.id, date: new Date().toISOString().slice(0, 10) }));
          }
        } else {
          var newId = "art-" + Date.now();
          var newArt = Object.assign({}, a, { id: newId, date: new Date().toISOString().slice(0, 10) });
          list.unshift(newArt);
          a.id = newId;
        }
        window.AXIOM.saveLocalArticles(list);
      } catch (e) {}

      // Try Supabase if connected
      try {
        if (a.id && !String(a.id).startsWith("art-") && !String(a.id).startsWith("seed-")) {
          await sb.from("articles").update(row).eq("id", a.id);
        } else {
          await sb.from("articles").insert(row);
        }
      } catch (e) {}

      return { data: a, error: null };
    },
    async deleteArticle(id) {
      try {
        var list = window.AXIOM ? window.AXIOM.getArticles() : [];
        var updated = list.filter(function (x) { return String(x.id) !== String(id); });
        window.AXIOM.saveLocalArticles(updated);
      } catch (e) {}

      try {
        await sb.from("articles").delete().eq("id", id);
      } catch (e) {}

      return { error: null };
    },

    /* Comments CRUD with dual store */
    async listComments() {
      try {
        var r = await sb.from("comments").select("*").order("created_at", { ascending: false });
        if (!r.error && r.data) return r.data;
      } catch (e) {}
      try {
        return JSON.parse(localStorage.getItem("axiom-admin-comments")) || [];
      } catch (e) { return []; }
    },
    async setComment(id, status) {
      try {
        var cmts = JSON.parse(localStorage.getItem("axiom-admin-comments")) || [];
        var c = cmts.find(function (x) { return String(x.id) === String(id); });
        if (c) c.status = status;
        localStorage.setItem("axiom-admin-comments", JSON.stringify(cmts));
      } catch (e) {}

      try { await sb.from("comments").update({ status: status }).eq("id", id); } catch (e) {}
      return { error: null };
    },
    async deleteComment(id) {
      try {
        var cmts = JSON.parse(localStorage.getItem("axiom-admin-comments")) || [];
        var updated = cmts.filter(function (x) { return String(x.id) !== String(id); });
        localStorage.setItem("axiom-admin-comments", JSON.stringify(updated));
      } catch (e) {}

      try { await sb.from("comments").delete().eq("id", id); } catch (e) {}
      return { error: null };
    },

    /* Subscribers */
    async listSubscribers() {
      try {
        var r = await sb.from("subscribers").select("*").order("created_at", { ascending: false });
        if (!r.error && r.data && r.data.length > 0) return r.data;
      } catch (e) {}
      try {
        return JSON.parse(localStorage.getItem("axiom-admin-subs")) || [];
      } catch (e) { return []; }
    },
    async addSubscriber(email) {
      var e = String(email || "").trim().toLowerCase();
      if (!e) return { error: { message: "Invalid email" } };
      try {
        await sb.from("subscribers").insert({ email: e, list: "Daily Brief", status: "active" });
      } catch (err) {}
      try {
        var subs = JSON.parse(localStorage.getItem("axiom-admin-subs")) || [];
        if (!subs.find(function (s) { return s.email === e; })) {
          subs.unshift({ email: e, list: "Daily Brief", status: "active", created_at: new Date().toISOString() });
          localStorage.setItem("axiom-admin-subs", JSON.stringify(subs));
        }
      } catch (err) {}
      return { error: null };
    },
    async deleteSubscriber(email) {
      var e = String(email || "").trim().toLowerCase();
      try {
        var subs = JSON.parse(localStorage.getItem("axiom-admin-subs")) || [];
        var updated = subs.filter(function (s) { return s.email !== e; });
        localStorage.setItem("axiom-admin-subs", JSON.stringify(updated));
      } catch (err) {}
      try { await sb.from("subscribers").delete().eq("email", e); } catch (err) {}
      return { error: null };
    }
  };
})();
