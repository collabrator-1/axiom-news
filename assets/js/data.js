/* =====================================================================
   AXIOM — content data layer
   Supports both localStorage and Supabase DB. Seeding rich default content
   when empty so every section, category tab, and article works out of the box.
   ===================================================================== */
(function () {
  try {
    var KEY = "axiom-store-v", CURRENT = "3";
    if (localStorage.getItem(KEY) !== CURRENT) {
      // Clear old format if needed
      localStorage.setItem(KEY, CURRENT);
    }
  } catch (e) {}
})();

window.AXIOM = (function () {
  const sections = {
    world:      { name: "World",        g: "g-world",  blurb: "Global affairs, international news, and major world events." },
    business:   { name: "Business",     g: "g-biz",    blurb: "Markets, global economics, financial trends, and corporate news." },
    technology: { name: "Technology",   g: "g-tech",   blurb: "Innovation, artificial intelligence, software, chips, and gadgets." },
    science:    { name: "Science",      g: "g-sci",    blurb: "Space exploration, climate research, environment, and discoveries." },
    sport:      { name: "Sport",        g: "g-sport",  blurb: "Global athletics, tournaments, football, and sporting events." },
    culture:    { name: "Culture",      g: "g-ent",    blurb: "Film, music, books, modern design, lifestyle, and arts." }
  };

  const seedArticles = [
    {
      id: "seed-1",
      title: "Global Summit Agrees on New Framework for Artificial Intelligence Safety",
      category: "technology",
      author: "Elena Rostova",
      excerpt: "Delegates from over 30 nations reached a landmark accord imposing unified safety evaluations for next-generation foundation models.",
      body: "In a historic multi-day gathering in Geneva, international representatives, leading researchers, and technology executives reached consensus on binding safety parameters for frontier AI development.\n\nThe framework establishes independent auditing bodies responsible for evaluating compute thresholds and autonomous capabilities prior to public release. Officials stressed that transparency and safety protocols must keep pace with rapid algorithmic advances.\n\nKey provisions focus on open model transparency, data governance standards, and emergency containment mechanisms for high-capacity systems. Industry leaders welcomed the unified standards, highlighting the need for predictable regulatory environments.",
      status: "published",
      read: "4 min",
      tags: ["AI", "Research", "Policy"],
      date: "2026-08-18",
      image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
      seoTitle: "Global Summit Agrees on New Framework for AI Safety — Axiom",
      seoDesc: "Nations reach landmark accord on unified safety evaluations for next-generation AI foundation models."
    },
    {
      id: "seed-2",
      title: "Central Banks Signal Shift Toward Rate Cuts as Global Inflation Stabilises",
      category: "business",
      author: "Marcus Vance",
      excerpt: "Financial markets rallied globally following coordinated commentary indicating interest rate easing cycles will begin next quarter.",
      body: "Major central banks signaled a decisive transition in monetary policy as core inflation figures across North America and Europe returned to near-target levels.\n\nMarket indices experienced significant gains across technology, banking, and real estate sectors. Analysts noted that while labor markets remain resilient, declining energy prices have alleviated sustained price pressure.\n\nEconomists anticipate measured quarterly reductions, warning that geopolitical tensions and supply chain shifts could still introduce localized volatility.",
      status: "published",
      read: "5 min",
      tags: ["Business", "Markets", "Economy"],
      date: "2026-08-17",
      image_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
      seoTitle: "Central Banks Signal Rate Cut Shift — Axiom",
      seoDesc: "Financial markets rally as global inflation numbers stabilize near central bank targets."
    },
    {
      id: "seed-3",
      title: "Space Exploration Milestone: Deep Space Observatory Captures Atmospheric Biosignatures",
      category: "science",
      author: "Dr. Sarah Chen",
      excerpt: "Astronomers have detected distinct atmospheric chemical signatures on an exoplanet 40 light-years away using next-gen orbital telescopes.",
      body: "Using high-resolution spectroscopic instruments on the orbital observatory, an international research team has identified complex molecular atmospheric signatures surrounding planet K2-18b.\n\nThe findings reveal atmospheric composition containing water vapor, methane, and carbon dioxide in proportions consistent with potential liquid ocean cover.\n\n'This is the clearest atmospheric profile we have ever gathered from a planet in a circumstellar habitable zone,' noted lead researcher Dr. Chen. Further observations are scheduled for late autumn.",
      status: "published",
      read: "6 min",
      tags: ["Science", "Space", "Discovery"],
      date: "2026-08-16",
      image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
      seoTitle: "Deep Space Observatory Detects Exoplanet Biosignatures — Axiom",
      seoDesc: "Astronomers capture atmospheric chemical signatures on planet in habitable zone."
    },
    {
      id: "seed-4",
      title: "Next-Gen Semiconductors: Quantum-Dot Microchips Breakthrough in Efficiency",
      category: "technology",
      author: "David Miller",
      excerpt: "Engineering teams present 1.4-nanometer architecture achieving a 40% reduction in thermal dissipation during heavy computational workloads.",
      body: "Semiconductor engineers have demonstrated functional 1.4nm silicon-nanowire microchips capable of processing complex matrix computations with unprecedented energy efficiency.\n\nThe technological leap comes as data centers face mounting energy costs and cooling infrastructure constraints. Commercial implementation is expected within the next 18 months.\n\nIndustry experts suggest this breakthrough extends silicon hardware capabilities well into the next decade before alternative materials are required.",
      status: "published",
      read: "3 min",
      tags: ["Technology", "Chips", "Software"],
      date: "2026-08-15",
      image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
      seoTitle: "Quantum-Dot Microchips Breakthrough — Axiom",
      seoDesc: "New 1.4nm architecture delivers 40% efficiency gains for computational workloads."
    },
    {
      id: "seed-5",
      title: "Diplomatic Talks Begin on Renewable Energy Infrastructure across Trans-European Grid",
      category: "world",
      author: "Julian Thorne",
      excerpt: "Ministers meet in Brussels to finalize cross-border offshore wind interconnections designed to supply energy to 50 million homes.",
      body: "European energy ministers convened in Brussels to sign agreements for a unified North Sea wind grid system.\n\nThe joint infrastructure investment aims to connect offshore platforms directly to regional high-voltage transmission networks, creating a resilient clean energy pipeline.\n\nThe project represents one of the largest collaborative infrastructure initiatives in modern European history.",
      status: "published",
      read: "4 min",
      tags: ["World", "Politics", "Climate"],
      date: "2026-08-14",
      image_url: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80",
      seoTitle: "Trans-European Renewable Energy Grid Accord — Axiom",
      seoDesc: "Ministers finalize multi-nation offshore wind pipeline to power 50M homes."
    },
    {
      id: "seed-6",
      title: "Championship Final: Thrilling Comeback Victory Secures European Cup Title",
      category: "sport",
      author: "Alex Rivera",
      excerpt: "A dramatic 93rd-minute winner capped a dramatic tactical triumph before 80,000 roaring fans in Munich.",
      body: "In one of the most memorable European cup finals in recent history, a late tactical substitution turned the match around in stoppage time.\n\nDown 2-1 with eight minutes remaining, the relentless pressure paid off with two brilliant team goals that sealed a historic 3-2 victory.\n\nPlayers and coaching staff celebrated on the pitch as fans cheered a game that will be talked about for generations.",
      status: "published",
      read: "3 min",
      tags: ["Sport", "Football", "Matches"],
      date: "2026-08-13",
      image_url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
      seoTitle: "Championship Final Comeback Victory — Axiom",
      seoDesc: "Stoppage-time goal secures dramatic 3-2 victory in European cup final."
    },
    {
      id: "seed-7",
      title: "Modern Architectural Retrospective: The Resurgence of Sustainable Timber Construction",
      category: "culture",
      author: "Claire Moreau",
      excerpt: "Urban design studios are embracing engineered mass timber to create striking, carbon-negative skyscrapers in major cities.",
      body: "Architectural firms globally are revolutionizing urban skylines with cross-laminated timber structures that combine structural durability with natural aesthetics.\n\nRecent completed projects demonstrate how wooden high-rises sequester carbon while creating warmer, biophilic living spaces.\n\nExhibitions opening this month highlight how traditional material wisdom meets contemporary structural engineering.",
      status: "published",
      read: "5 min",
      tags: ["Culture", "Design", "Architecture"],
      date: "2026-08-12",
      image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
      seoTitle: "Resurgence of Sustainable Timber Architecture — Axiom",
      seoDesc: "Urban design studios embrace cross-laminated timber for carbon-negative skyscrapers."
    },
    {
      id: "seed-8",
      title: "Medical Innovation: Targeted Cellular Therapies Show Promise in Clinical Trials",
      category: "health",
      author: "Dr. Amanda Hayes",
      excerpt: "Phase III trial results reveal unprecedented efficacy rates for personalized mRNA targeted immunotherapies.",
      body: "Medical researchers presented groundbreaking clinical trial outcomes showcasing how engineered cellular therapies effectively target auto-immune conditions with minimal adverse reactions.\n\nThe treatment utilizes custom biological markers to retrain immune cells, offering new avenues for long-term recovery.\n\nRegulatory bodies have granted expedited review status to accelerate public availability.",
      status: "published",
      read: "4 min",
      tags: ["Health", "Medicine", "Wellbeing"],
      date: "2026-08-11",
      image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
      seoTitle: "Targeted Cellular Therapies Clinical Breakthrough — Axiom",
      seoDesc: "Phase III trials demonstrate unprecedented efficacy for personalized mRNA immunotherapies."
    }
  ];

  function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
  function articleHref(catSlug, story) {
    const id = story && story.id != null ? story.id : "";
    const sec = sections[catSlug] ? catSlug : "world";
    const t = story && story.t ? story.t : (story && story.title ? story.title : "");
    const read = story && story.read ? story.read : "";
    const sub = story && story.sub ? story.sub : (story && story.excerpt ? story.excerpt : "");
    return "article.html?cat=" + encodeURIComponent(sec) +
      "&id=" + encodeURIComponent(id) +
      "&t=" + encodeURIComponent(t) +
      "&r=" + encodeURIComponent(read) +
      "&d=" + encodeURIComponent(sub) +
      "#cat=" + encodeURIComponent(sec) + "&id=" + encodeURIComponent(id);
  }
  function categoryHref(catSlug, topic) {
    const sec = sections[catSlug] ? catSlug : "world";
    let url = "category.html?cat=" + encodeURIComponent(sec);
    if (topic) url += "&topic=" + encodeURIComponent(topic);
    url += "#cat=" + encodeURIComponent(sec);
    if (topic) url += "&topic=" + encodeURIComponent(topic);
    return url;
  }

  const labelToSlug = {};
  Object.keys(sections).forEach((k) => { labelToSlug[sections[k].name.toLowerCase()] = k; });
  Object.assign(labelToSlug, {
    "politics": "world", "markets": "business", "economy": "business", "deals": "business",
    "startups": "business", "energy": "business", "real estate": "business",
    "artificial intelligence": "technology", "ai": "technology", "space": "science", "climate": "science",
    "gadgets": "technology", "software": "technology", "security": "technology", "chips": "technology",
    "big tech": "technology", "reviews": "technology", "film": "culture", "music": "culture",
    "books": "culture", "tv": "culture", "art": "culture", "regions": "world",
    "united states": "world", "europe": "world", "asia & pacific": "world", "middle east": "world",
    "africa": "world", "americas": "world", "migration": "world", "elections": "world",
    "conflict & security": "world", "wellbeing": "culture", "health": "culture", "design": "culture", "food": "culture", "travel": "culture", "lifestyle": "culture", "gaming": "culture", "live": "world"
  });

  // Shared article store. Public pages read from here with seed fallback.
  function getArticles() {
    try {
      const stored = JSON.parse(localStorage.getItem("axiom-admin-articles"));
      if (stored && Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
    } catch (e) {}
    // Initialise with seed content if none in localStorage
    try {
      localStorage.setItem("axiom-admin-articles", JSON.stringify(seedArticles));
    } catch (e) {}
    return seedArticles;
  }

  function saveLocalArticles(list) {
    try {
      localStorage.setItem("axiom-admin-articles", JSON.stringify(list));
    } catch (e) {}
  }

  function published() {
    return getArticles().filter((a) => a.status === "published").sort((a, b) => (b.date || "").localeCompare(a.date || "") || String(b.id).localeCompare(String(a.id)));
  }
  function bySection(slug) { return published().filter((a) => a.category === slug); }
  function byId(id) { return getArticles().find((a) => String(a.id) === String(id)); }
  function toStory(a) { return { id: a.id, t: a.title, read: a.read || "", sub: a.excerpt || "", category: a.category }; }

  return { sections, seedArticles, slugify, articleHref, categoryHref, labelToSlug, getArticles, saveLocalArticles, published, bySection, byId, toStory };
})();

