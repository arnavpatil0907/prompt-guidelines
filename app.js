/* MILEAGE — app logic (vanilla, no dependencies, no API) */
(function () {
  "use strict";
  var D = window.DATA;
  var STORE = "mileage:v2";

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function platBadge(id, small) {
    var p = D.platforms[id] || { label: id, tone: "text" };
    return '<span class="plat plat--' + p.tone + (small ? " plat--sm" : "") + '">' + esc(p.label) + "</span>";
  }
  function gauge(value, size) {
    var cx = size / 2, cy = size * 0.82, r = size * 0.62, ang = Math.PI * (1 - value);
    var nx = cx + Math.cos(ang) * (r - 5), ny = cy - Math.sin(ang) * (r - 5);
    function arc(a0, a1, c) {
      var x0 = cx + Math.cos(a0) * r, y0 = cy - Math.sin(a0) * r, x1 = cx + Math.cos(a1) * r, y1 = cy - Math.sin(a1) * r;
      return '<path d="M ' + x0 + ' ' + y0 + ' A ' + r + ' ' + r + ' 0 0 1 ' + x1 + ' ' + y1 + '" stroke="' + c + '" stroke-width="6" fill="none" stroke-linecap="round"/>';
    }
    return '<svg width="' + size + '" height="' + (size * 0.62) + '" viewBox="0 0 ' + size + ' ' + (size * 0.62) + '" aria-hidden="true">' +
      arc(Math.PI, Math.PI * 0.72, "var(--coral)") + arc(Math.PI * 0.7, Math.PI * 0.42, "var(--amber)") + arc(Math.PI * 0.4, 0, "var(--mint)") +
      '<line x1="' + cx + '" y1="' + cy + '" x2="' + nx + '" y2="' + ny + '" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="3.5" fill="var(--ink)"/></svg>';
  }
  function fmtInt(n) { return Math.round(n).toLocaleString(); }
  function fmtMoney(n) { return CURRENCY + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }); }
  function fmtCpc(n) { return CURRENCY + Number(n).toLocaleString(undefined, { maximumFractionDigits: 4 }); }

  // ---------- persistence ----------
  function loadStore() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify({ tab: TAB, usage: USAGE, plans: PLANS, currency: CURRENCY })); } catch (e) {}
  }
  var saved = loadStore();
  var TAB = saved.tab || "home";
  var CURRENCY = saved.currency || "$";
  var USAGE = saved.usage || [{ label: "Social reels", qty: 40, each: 5 }, { label: "Photo upscales", qty: 60, each: 2 }];
  var PLANS = saved.plans || [{ name: "Starter", price: 10, credits: 300 }, { name: "Pro", price: 24, credits: 900 }, { name: "Studio", price: 60, credits: 2500 }];

  // ---------- masthead ----------
  $("brandGauge").innerHTML = gauge(0.8, 34);
  $("platStack").innerHTML = Object.keys(D.platforms).map(function (id) { return platBadge(id, true); }).join("");
  $("foot").textContent = "Seed data, reviewed Jun 2026 — models, settings and credit costs shift fast, so verify before trusting a number. Fully static: no account, no API, no tokens.";

  // ---------- tabs ----------
  var TABS = [
    { id: "home", label: "Home" },
    { id: "recommender", label: "Recommender" },
    { id: "models", label: "Models" },
    { id: "rules", label: "Rule Book" },
    { id: "plan", label: "Plans" },
  ];
  $("tabs").innerHTML = TABS.map(function (t) { return '<button class="tab" role="tab" data-tab="' + t.id + '">' + esc(t.label) + "</button>"; }).join("");
  function setTab(id) {
    TAB = id;
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (b) {
      var on = b.getAttribute("data-tab") === id;
      b.classList.toggle("tab--on", on); b.setAttribute("aria-selected", on ? "true" : "false");
    });
    Array.prototype.forEach.call(document.querySelectorAll(".view"), function (v) { v.classList.toggle("view--on", v.id === "view-" + id); });
    window.scrollTo({ top: 0, behavior: "smooth" });
    save();
  }
  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (b) {
    b.addEventListener("click", function () { setTab(b.getAttribute("data-tab")); });
  });

  // ---------- home tiles ----------
  var TILES = [
    { go: "recommender", t: "Recommend my setup", d: "Tell it what you're making — get the model and settings.", primary: true },
    { go: "models", t: "Compare models", d: "Kling, Seedance, Nano Banana, Seedream and more, by strength." },
    { go: "rules", t: "Check the rules", d: "Fast if-then checklist for not wasting credits." },
    { go: "plan", t: "Pick a credit plan", d: "Match your monthly burn to the cheapest plan that covers it." },
  ];
  $("tiles").innerHTML = TILES.map(function (t) {
    return '<button class="tile' + (t.primary ? " tile--primary" : "") + '" data-goto="' + t.go + '">' +
      '<span class="tile__t">' + esc(t.t) + '<span class="arr">→</span></span>' +
      '<span class="tile__d">' + esc(t.d) + "</span></button>";
  }).join("");
  Array.prototype.forEach.call(document.querySelectorAll("[data-goto]"), function (b) {
    b.addEventListener("click", function () { setTab(b.getAttribute("data-goto")); });
  });

  // ---------- RECOMMENDER ----------
  var REC = { medium: null, video: {}, image: {}, text: {} };
  var MEDIA = [{ id: "video", label: "Video" }, { id: "image", label: "Image" }, { id: "text", label: "Text" }];

  function optBtn(key, val, label, on) {
    return '<button class="q__opt' + (on ? " q__opt--on" : "") + '" data-k="' + key + '" data-v="' + val + '">' + esc(label) + "</button>";
  }
  function qBlock(label, key, options, current) {
    return '<div class="q"><span class="q__label">' + esc(label) + '</span><div class="q__opts">' +
      options.map(function (o) { return optBtn(key, o.id, o.label, current === o.id); }).join("") + "</div></div>";
  }

  function renderRec() {
    // medium selector
    $("recMedium").innerHTML = '<div class="q"><span class="q__label">What are you making?</span><div class="q__opts">' +
      MEDIA.map(function (m) { return optBtn("medium", m.id, m.label, REC.medium === m.id); }).join("") + "</div></div>";

    // dependent questions
    var qhtml = "", cfg, a;
    if (REC.medium === "video") {
      cfg = D.recommend.video; a = REC.video;
      qhtml += qBlock(cfg.q1.label, "v_purpose", cfg.q1.options, a.purpose);
      if (a.purpose) qhtml += qBlock(cfg.q2.label, "v_priority", cfg.q2.options, a.priority);
    } else if (REC.medium === "image") {
      cfg = D.recommend.image; a = REC.image;
      qhtml += qBlock(cfg.q1.label, "i_task", cfg.q1.options, a.task);
      if (a.task) {
        var needStyle = cfg.q2.onlyFor.indexOf(a.task) >= 0;
        if (needStyle) qhtml += qBlock(cfg.q2.label, "i_style", cfg.q2.options, a.style);
        if (!needStyle || a.style) qhtml += qBlock(cfg.q3.label, "i_priority", cfg.q3.options, a.priority);
      }
    } else if (REC.medium === "text") {
      cfg = D.recommend.text; a = REC.text;
      qhtml += qBlock(cfg.q1.label, "t_task", cfg.q1.options, a.task);
    }
    $("recQuestions").innerHTML = qhtml;

    bindRec();
    renderRecResult();
  }

  function bindRec() {
    var btns = $("recMedium").querySelectorAll(".q__opt");
    Array.prototype.forEach.call(btns, function (b) { b.addEventListener("click", recPick); });
    Array.prototype.forEach.call($("recQuestions").querySelectorAll(".q__opt"), function (b) { b.addEventListener("click", recPick); });
  }
  function recPick() {
    var k = this.getAttribute("data-k"), v = this.getAttribute("data-v");
    if (k === "medium") { REC.medium = v; }
    else if (k === "v_purpose") { REC.video.purpose = v; }
    else if (k === "v_priority") { REC.video.priority = v; }
    else if (k === "i_task") { REC.image.task = v; REC.image.style = null; REC.image.priority = null; }
    else if (k === "i_style") { REC.image.style = v; }
    else if (k === "i_priority") { REC.image.priority = v; }
    else if (k === "t_task") { REC.text.task = v; }
    renderRec();
  }

  function findOpt(options, id) { for (var i = 0; i < options.length; i++) if (options[i].id === id) return options[i]; return null; }

  function scoreModels(type, want, boost, hard, priority) {
    var cands = D.models.filter(function (m) {
      if (m.type !== type) return false;
      if (hard && m.tags.indexOf(hard) < 0) return false;
      return true;
    });
    cands.forEach(function (m) {
      var s = 0;
      want.forEach(function (t) { if (m.tags.indexOf(t) >= 0) s += 2; });
      boost.forEach(function (t) { if (m.tags.indexOf(t) >= 0) s += 3; });
      m._s = s;
    });
    cands.sort(function (a, b) {
      if (b._s !== a._s) return b._s - a._s;
      return priority === "cost" ? a.tier - b.tier : b.tier - a.tier;
    });
    return cands;
  }

  function recoCard(eyebrow, name, badges, settings, whyHtml, altHtml, tips, credit) {
    var chip = settings && settings.length ? '<div class="chipset">' + settings.map(function (s) { return '<span class="c">' + esc(s) + "</span>"; }).join("") + "</div>" : "";
    var tipsHtml = "";
    if (tips) {
      tipsHtml = '<div class="tips"><div class="tips__col tips__col--do"><span class="l">Feed it</span><ul>' +
        tips.do.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + '</ul></div>' +
        '<div class="tips__col tips__col--dont"><span class="l">Avoid</span><ul>' +
        tips.dont.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div></div>";
    }
    return '<div class="reco"><p class="reco__eyebrow">' + esc(eyebrow) + '</p>' +
      '<h3 class="reco__name">' + esc(name) + "</h3>" +
      (badges ? '<div class="reco__row">' + badges + "</div>" : "") +
      chip +
      '<p class="reco__why">' + whyHtml + "</p>" +
      (altHtml ? '<p class="reco__alt">' + altHtml + "</p>" : "") +
      tipsHtml +
      (credit ? '<p class="reco__credit">' + esc(credit) + "</p>" : "") + "</div>";
  }

  function renderRecResult() {
    var out = $("recResult"), m = REC.medium;
    if (!m) { out.innerHTML = ""; return; }

    if (m === "text") {
      var t = REC.text.task ? findOpt(D.recommend.text.q1.options, REC.text.task) : null;
      if (!t) { out.innerHTML = ""; return; }
      var badges = t.platforms.map(function (p) { return platBadge(p, true); }).join("");
      var tips = D.inputTips[t.platforms[0]];
      out.innerHTML = recoCard("Use this", t.pick + " — " + t.detail, badges, t.settings,
        t.why, "", tips,
        "These are model tiers, not credit caps. Match the tier to the task and you spend far less than defaulting to the top model.");
      return;
    }

    if (m === "video") {
      var p = REC.video.purpose ? findOpt(D.recommend.video.q1.options, REC.video.purpose) : null;
      if (!p) { out.innerHTML = ""; return; }
      var pr = REC.video.priority ? findOpt(D.recommend.video.q2.options, REC.video.priority) : null;
      var ranked = scoreModels("video", p.want, pr ? pr.boost : [], null, REC.video.priority);
      finishCard(out, ranked, p.settings, p.label, pr);
      return;
    }

    if (m === "image") {
      var task = REC.image.task ? findOpt(D.recommend.image.q1.options, REC.image.task) : null;
      if (!task) { out.innerHTML = ""; return; }
      var needStyle = D.recommend.image.q2.onlyFor.indexOf(task.id) >= 0;
      var style = REC.image.style ? findOpt(D.recommend.image.q2.options, REC.image.style) : null;
      if (needStyle && !style) { out.innerHTML = ""; return; }
      var ipr = REC.image.priority ? findOpt(D.recommend.image.q3.options, REC.image.priority) : null;
      var want = (style ? style.want : []).slice();
      var ranked = scoreModels("image", want, ipr ? ipr.boost : [], task.hard, REC.image.priority);
      var label = task.label + (style ? " · " + style.label : "");
      finishCard(out, ranked, task.settings, label, ipr);
      return;
    }
  }

  function finishCard(out, ranked, settings, contextLabel, priorityOpt) {
    if (!ranked.length) { out.innerHTML = recoCard("Hmm", "No model fits that combination", "", null, "Try a different priority — every path here should land on a model.", "", null, ""); return; }
    var primary = ranked[0];
    var alt = null;
    for (var i = 1; i < ranked.length; i++) { if (ranked[i].id !== primary.id) { alt = ranked[i]; break; } }
    var badges = primary.platforms.map(function (p) { return platBadge(p, true); }).join("");
    var why = "Best for <b>" + esc(contextLabel.toLowerCase()) + "</b>" + (priorityOpt ? " when you want " + esc(priorityOpt.label.toLowerCase()) : "") + ". " + esc(primary.bestFor);
    var altHtml = alt ? "Leaning another way? <b>" + esc(alt.label) + "</b> — " + esc(alt.bestFor) : "";
    var tips = D.inputTips[primary.platforms[0]];
    out.innerHTML = recoCard("Use this model", primary.label, badges, settings, why, altHtml, tips,
      "Settings are the starting point that looks good without overspending. Nudge up only if the final medium actually shows it.");
  }

  // ---------- MODELS ----------
  var mCat = "All";
  var mCats = ["All", "Video", "Image"];
  $("modelChips").innerHTML = mCats.map(function (c) { return '<button class="chip' + (c === mCat ? " chip--on" : "") + '" data-c="' + c + '">' + c + "</button>"; }).join("");
  function tierDots(tier) {
    var s = "";
    for (var i = 1; i <= 3; i++) s += '<i class="' + (i <= tier ? "on" + tier : "") + '"></i>';
    var lbl = tier === 1 ? "cheap" : tier === 2 ? "mid" : "premium";
    return '<span class="tier">' + s + "<b>" + lbl + "</b></span>";
  }
  function renderModels() {
    var q = $("modelSearch").value.toLowerCase().trim();
    var list = D.models.filter(function (m) {
      var typeOk = mCat === "All" || m.type === mCat.toLowerCase();
      var txt = (m.label + " " + m.bestFor + " " + m.tags.join(" ") + " " + m.strengths.join(" ")).toLowerCase();
      return typeOk && (q === "" || txt.indexOf(q) >= 0);
    });
    $("modelGrid").innerHTML = list.map(function (m) {
      return '<article class="mcard"><div class="mcard__top"><h3 class="mcard__name">' + esc(m.label) + "</h3>" + tierDots(m.tier) + "</div>" +
        '<div class="mcard__row">' + m.platforms.map(function (p) { return platBadge(p, true); }).join("") + "</div>" +
        '<p class="mcard__best"><b>Best for:</b> ' + esc(m.bestFor) + "</p>" +
        '<span class="mcard__l mcard__l--s">Strengths</span><ul class="mcard__str">' +
        m.strengths.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>" +
        '<span class="mcard__l mcard__l--w">Watch out</span><p class="mcard__weak">' + esc(m.weakness) + "</p></article>";
    }).join("");
    $("modelEmpty").style.display = list.length ? "none" : "block";
  }
  Array.prototype.forEach.call($("modelChips").children, function (b) {
    b.addEventListener("click", function () {
      mCat = b.getAttribute("data-c");
      Array.prototype.forEach.call($("modelChips").children, function (x) { x.classList.toggle("chip--on", x === b); });
      renderModels();
    });
  });
  $("modelSearch").addEventListener("input", renderModels);

  // ---------- RULE BOOK ----------
  var rCat = "All";
  var rCats = ["All", "Video", "Image & Upscale", "Text & Reasoning", "Every tool"];
  var TAGLBL = { always: "Always", default: "Default", avoid: "Avoid" };
  $("rulesChips").innerHTML = rCats.map(function (c) { return '<button class="chip' + (c === rCat ? " chip--on" : "") + '" data-c="' + esc(c) + '">' + esc(c) + "</button>"; }).join("");
  function renderRules() {
    var q = $("rulesSearch").value.toLowerCase().trim(), html = "", total = 0;
    rCats.filter(function (c) { return c !== "All"; }).forEach(function (cat) {
      var items = D.rules.filter(function (r) {
        return r.cat === cat && (rCat === "All" || r.cat === rCat) &&
          (q === "" || (r.if + " " + r.then + " " + r.why).toLowerCase().indexOf(q) >= 0);
      });
      if (!items.length) return;
      total += items.length;
      html += '<section class="group"><div class="group__head"><h2 class="group__name">' + esc(cat) + '</h2><span class="group__count">' + items.length + "</span></div>";
      items.forEach(function (r) {
        html += '<article class="rule rule--' + r.tag + '"><span class="rule__tag">' + TAGLBL[r.tag] + "</span>" +
          '<div class="rule__line rule__line--if"><span class="rule__kw">IF</span><span class="rule__text">you\'re ' + esc(r.if) + "</span></div>" +
          '<div class="rule__line rule__line--then"><span class="rule__kw then">THEN</span><span class="rule__text">' + esc(r.then) + "</span></div>" +
          '<p class="rule__why">' + esc(r.why) + "</p></article>";
      });
      html += "</section>";
    });
    $("rulesList").innerHTML = html;
    $("rulesEmpty").style.display = total ? "none" : "block";
  }
  Array.prototype.forEach.call($("rulesChips").children, function (b) {
    b.addEventListener("click", function () {
      rCat = b.getAttribute("data-c");
      Array.prototype.forEach.call($("rulesChips").children, function (x) { x.classList.toggle("chip--on", x === b); });
      renderRules();
    });
  });
  $("rulesSearch").addEventListener("input", renderRules);

  // ---------- PLAN PICKER ----------
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }
  function renderUsageRows() {
    $("usageRows").innerHTML = USAGE.map(function (u, i) {
      var sub = num(u.qty) * num(u.each);
      return '<div class="row row--usage">' +
        '<input class="fld" data-u="' + i + '" data-f="label" value="' + esc(u.label) + '" placeholder="e.g. reels" />' +
        '<input class="fld fld--num mono" data-u="' + i + '" data-f="qty" type="number" min="0" value="' + esc(u.qty) + '" />' +
        '<input class="fld fld--num mono" data-u="' + i + '" data-f="each" type="number" min="0" value="' + esc(u.each) + '" />' +
        '<span class="sub" data-sub="' + i + '">' + fmtInt(sub) + "</span>" +
        '<button class="xbtn" data-rm-u="' + i + '" aria-label="Remove">\u00d7</button></div>';
    }).join("");
    Array.prototype.forEach.call($("usageRows").querySelectorAll("input"), function (inp) {
      inp.addEventListener("input", function () {
        var i = +inp.getAttribute("data-u"), f = inp.getAttribute("data-f");
        USAGE[i][f] = f === "label" ? inp.value : num(inp.value);
        var sc = $("usageRows").querySelector('[data-sub="' + i + '"]');
        if (sc) sc.textContent = fmtInt(num(USAGE[i].qty) * num(USAGE[i].each));
        recompute();
      });
    });
    Array.prototype.forEach.call($("usageRows").querySelectorAll("[data-rm-u]"), function (btn) {
      btn.addEventListener("click", function () {
        USAGE.splice(+btn.getAttribute("data-rm-u"), 1);
        if (!USAGE.length) USAGE.push({ label: "", qty: 0, each: 0 });
        renderUsageRows(); recompute();
      });
    });
  }
  function renderPlanRows() {
    $("planRows").innerHTML = PLANS.map(function (p, i) {
      return '<div class="row row--plan">' +
        '<input class="fld" data-p="' + i + '" data-f="name" value="' + esc(p.name) + '" placeholder="Plan name" />' +
        '<input class="fld fld--num mono" data-p="' + i + '" data-f="price" type="number" min="0" value="' + esc(p.price) + '" />' +
        '<input class="fld fld--num mono" data-p="' + i + '" data-f="credits" type="number" min="0" value="' + esc(p.credits) + '" />' +
        '<button class="xbtn" data-rm-p="' + i + '" aria-label="Remove">\u00d7</button></div>';
    }).join("");
    Array.prototype.forEach.call($("planRows").querySelectorAll("input"), function (inp) {
      inp.addEventListener("input", function () {
        var i = +inp.getAttribute("data-p"), f = inp.getAttribute("data-f");
        PLANS[i][f] = f === "name" ? inp.value : num(inp.value);
        recompute();
      });
    });
    Array.prototype.forEach.call($("planRows").querySelectorAll("[data-rm-p]"), function (btn) {
      btn.addEventListener("click", function () {
        PLANS.splice(+btn.getAttribute("data-rm-p"), 1);
        if (!PLANS.length) PLANS.push({ name: "", price: 0, credits: 0 });
        renderPlanRows(); recompute();
      });
    });
  }
  function planReco(kind, name, body) {
    return '<div class="reco' + (kind === "warn" ? " reco--warn" : "") + '"><p class="reco__eyebrow">' +
      (kind === "warn" ? "Heads-up" : "Recommended") + '</p><h3 class="reco__name">' + esc(name) + '</h3><p class="reco__why">' + body + "</p></div>";
  }
  function recompute() {
    var usage = USAGE.reduce(function (s, u) { return s + num(u.qty) * num(u.each); }, 0);
    $("usageTotal").textContent = fmtInt(usage);
    var valid = PLANS.filter(function (p) { return num(p.credits) > 0; }).map(function (p) {
      var price = num(p.price), credits = num(p.credits);
      return { name: p.name || "Unnamed", price: price, credits: credits, cpc: price / credits,
        covers: credits >= usage, headroom: credits - usage,
        headroomPct: usage > 0 ? Math.round(((credits - usage) / usage) * 100) : null, shortfall: usage - credits };
    });
    var out = $("planResults");
    if (usage <= 0) { out.innerHTML = planReco("warn", "Add your usage", "Estimate your monthly burn on the left and a recommendation appears here."); return; }
    if (!valid.length) { out.innerHTML = planReco("warn", "Add a plan", "Drop in at least one plan with a credit amount to compare."); return; }
    var byPrice = valid.slice().sort(function (a, b) { return a.price - b.price; });
    var covering = byPrice.filter(function (p) { return p.covers; });
    var bestValue = valid.slice().sort(function (a, b) { return a.cpc - b.cpc; })[0];
    var pickName, card;
    if (covering.length) {
      var fit = covering[0]; pickName = fit.name;
      var body = "<b>" + esc(fit.name) + "</b> is the cheapest plan that covers your ~" + fmtInt(usage) + " credits/mo, at <b>" +
        fmtCpc(fit.cpc) + "/credit</b>, leaving " + fmtInt(fit.headroom) + " credits (" + fit.headroomPct + "%) of headroom.";
      if (fit.headroomPct !== null && fit.headroomPct < 12) { var next = covering[1]; body += " That headroom is thin" + (next ? " — if usage swings, " + esc(next.name) + " gives more room." : "."); }
      if (bestValue && bestValue.name !== fit.name && bestValue.credits > fit.credits) {
        body += " If you expect to grow, <b>" + esc(bestValue.name) + "</b> is cheaper per credit (" + fmtCpc(bestValue.cpc) + ") but buys " + fmtInt(bestValue.credits - usage) + " credits you wouldn't use yet.";
      }
      card = planReco("ok", fit.name, body);
    } else {
      var biggest = valid.slice().sort(function (a, b) { return b.credits - a.credits; })[0]; pickName = biggest.name;
      card = planReco("warn", biggest.name + " + top-ups", "No single plan covers your ~" + fmtInt(usage) + " credits/mo. The largest, <b>" + esc(biggest.name) + "</b>, gives " + fmtInt(biggest.credits) + " — short " + fmtInt(usage - biggest.credits) + ". Buy it plus top-ups, stack two plans, or trim usage.");
    }
    var rows = byPrice.map(function (p) {
      var cover = p.covers ? '<span class="pill pill--ok">covers +' + fmtInt(p.headroom) + "</span>" : '<span class="pill pill--short">short ' + fmtInt(p.shortfall) + "</span>";
      return '<tr class="' + (p.name === pickName ? "is-pick" : "") + '"><td>' + esc(p.name) + "</td><td>" + fmtMoney(p.price) + "</td><td>" + fmtInt(p.credits) + "</td><td>" + fmtCpc(p.cpc) + "</td><td>" + cover + "</td></tr>";
    }).join("");
    out.innerHTML = card + '<table class="ptable"><thead><tr><th>Plan</th><th>Price</th><th>Credits</th><th>Per credit</th><th>Fit</th></tr></thead><tbody>' + rows + "</tbody></table>" +
      '<p class="note">Per-credit ranks raw value; "fit" checks each plan against your ~' + fmtInt(usage) + "/mo burn. Most credits expire monthly and don't roll over, so buying far above your usage is wasted unless the plan carries credits forward.</p>";
  }
  $("currSel").value = CURRENCY;
  $("currSel").addEventListener("change", function () { CURRENCY = $("currSel").value; recompute(); save(); });
  $("addUsage").addEventListener("click", function () { USAGE.push({ label: "", qty: 0, each: 0 }); renderUsageRows(); recompute(); });
  $("addPlan").addEventListener("click", function () { PLANS.push({ name: "", price: 0, credits: 0 }); renderPlanRows(); recompute(); });
  document.addEventListener("input", save);
  document.addEventListener("click", function (e) { if (e.target.closest(".xbtn,.addbtn,.tab,.tile")) save(); });

  // ---------- init ----------
  renderRec();
  renderModels();
  renderRules();
  renderUsageRows();
  renderPlanRows();
  recompute();
  setTab(TAB);
})();
