/* MILEAGE — app logic (vanilla, no dependencies, no API) */
(function () {
  "use strict";
  var D = window.DATA;
  var STORE = "mileage:v1";

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function platBadge(id, small) {
    var p = D.platforms[id] || { label: id, tone: "text" };
    return '<span class="plat plat--' + p.tone + (small ? " plat--sm" : "") + '">' + esc(p.label) + "</span>";
  }
  function gauge(value, label, size) {
    var cx = size / 2, cy = size * 0.82, r = size * 0.62;
    var ang = Math.PI * (1 - value);
    var nx = cx + Math.cos(ang) * (r - 6), ny = cy - Math.sin(ang) * (r - 6);
    function arc(a0, a1, color) {
      var x0 = cx + Math.cos(a0) * r, y0 = cy - Math.sin(a0) * r;
      var x1 = cx + Math.cos(a1) * r, y1 = cy - Math.sin(a1) * r;
      return '<path d="M ' + x0 + ' ' + y0 + ' A ' + r + ' ' + r + ' 0 0 1 ' + x1 + ' ' + y1 + '" stroke="' + color + '" stroke-width="7" fill="none" stroke-linecap="round"/>';
    }
    return '<svg width="' + size + '" height="' + (size * 0.62) + '" viewBox="0 0 ' + size + ' ' + (size * 0.62) + '" aria-hidden="true">' +
      arc(Math.PI, Math.PI * 0.72, "var(--coral)") +
      arc(Math.PI * 0.7, Math.PI * 0.42, "var(--amber)") +
      arc(Math.PI * 0.4, 0, "var(--mint)") +
      '<line x1="' + cx + '" y1="' + cy + '" x2="' + nx + '" y2="' + ny + '" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="4.5" fill="var(--ink)"/>' +
      (label ? '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" class="gauge__lbl">' + esc(label) + "</text>" : "") +
      "</svg>";
  }
  function fmtInt(n) { return Math.round(n).toLocaleString(); }
  function fmtMoney(n) { return CURRENCY + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }); }
  function fmtCpc(n) { return CURRENCY + Number(n).toLocaleString(undefined, { maximumFractionDigits: 4 }); }
  var COST = { 1: "low", 2: "med", 3: "high" };

  // ---------- persistence ----------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({ tab: TAB, usage: USAGE, plans: PLANS, currency: CURRENCY }));
    } catch (e) { /* private mode etc. — fail quietly */ }
  }

  var saved = load();
  var TAB = saved.tab || "picker";
  var CURRENCY = saved.currency || "$";
  var USAGE = saved.usage || [
    { label: "Social reels", qty: 40, each: 5 },
    { label: "Photo upscales", qty: 60, each: 2 },
  ];
  var PLANS = saved.plans || [
    { name: "Starter", price: 10, credits: 300 },
    { name: "Pro", price: 24, credits: 900 },
    { name: "Studio", price: 60, credits: 2500 },
  ];

  // ---------- masthead ----------
  $("brandGauge").innerHTML = gauge(0.8, "", 64);
  $("platStack").innerHTML = Object.keys(D.platforms).map(function (id) { return platBadge(id, true); }).join("");
  $("foot").textContent =
    "Seed data, reviewed Jun 2026 — models, parameters and credit costs shift fast, so verify before trusting a number. Fully static: no account, no API, no tokens.";

  // ---------- tabs ----------
  var TABS = [
    { id: "picker", label: "Tool picker", blurb: "Which model for the job" },
    { id: "recipes", label: "Recipes", blurb: "Settings that don't waste" },
    { id: "inputs", label: "Inputs", blurb: "What to feed each tool" },
    { id: "rules", label: "Rule Book", blurb: "If \u2192 then, every time" },
    { id: "plan", label: "Plan picker", blurb: "Which pack to buy" },
  ];
  $("tabs").innerHTML = TABS.map(function (t) {
    return '<button class="tab" role="tab" data-tab="' + t.id + '">' +
      '<span class="tab__label">' + esc(t.label) + "</span>" +
      '<span class="tab__blurb">' + t.blurb + "</span></button>";
  }).join("");
  function setTab(id) {
    TAB = id;
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (b) {
      var on = b.getAttribute("data-tab") === id;
      b.classList.toggle("tab--on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    Array.prototype.forEach.call(document.querySelectorAll(".view"), function (v) {
      v.classList.toggle("view--on", v.id === "view-" + id);
    });
    save();
  }
  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (b) {
    b.addEventListener("click", function () { setTab(b.getAttribute("data-tab")); });
  });

  // ---------- picker ----------
  var pCat = "All";
  var pCats = ["All", "Video", "Image / Upscale", "Text / Reasoning"];
  $("pickerChips").innerHTML = pCats.map(function (c) {
    return '<button class="chip' + (c === pCat ? " chip--on" : "") + '" data-c="' + esc(c) + '">' + esc(c) + "</button>";
  }).join("");
  function renderPicker() {
    var q = $("pickerSearch").value.toLowerCase().trim();
    var rows = D.picker.filter(function (r) {
      return (pCat === "All" || r.cat === pCat) &&
        (q === "" || (r.task + r.pick + r.why).toLowerCase().indexOf(q) >= 0);
    });
    $("pickerGrid").innerHTML = rows.length ? rows.map(function (r) {
      return '<article class="pcard">' +
        '<div class="pcard__head"><span class="pcard__task">' + esc(r.task) + "</span>" +
        '<span class="costpill cost--' + r.cost + '">' + ".".repeat(r.cost) + " <em>" + COST[r.cost] + "</em></span></div>" +
        '<div class="pcard__pick">' + platBadge(r.plat) + '<span class="pcard__settings">' + esc(r.pick) + "</span></div>" +
        '<p class="pcard__why">' + esc(r.why) + "</p></article>";
    }).join("") : '<p class="empty">No task matches that. Try a broader word, or clear the filter.</p>';
  }
  Array.prototype.forEach.call($("pickerChips").children, function (b) {
    b.addEventListener("click", function () {
      pCat = b.getAttribute("data-c");
      Array.prototype.forEach.call($("pickerChips").children, function (x) { x.classList.toggle("chip--on", x === b); });
      renderPicker();
    });
  });
  $("pickerSearch").addEventListener("input", renderPicker);

  // ---------- recipes ----------
  function renderRecipes() {
    $("recipesGrid").innerHTML = D.recipes.map(function (r) {
      var pct = Math.round(r.save * 100);
      return '<article class="rcard">' +
        '<div class="rcard__top">' + platBadge(r.plat, true) + '<h3 class="rcard__title">' + esc(r.title) + "</h3></div>" +
        '<div class="rcard__cols"><div><span class="rcard__lbl rcard__lbl--opt">Use this</span><ul class="taglist">' +
        r.optimal.map(function (t) { return '<li class="tag tag--opt">' + esc(t) + "</li>"; }).join("") +
        '</ul></div><div><span class="rcard__lbl rcard__lbl--bad">Skip</span><ul class="taglist">' +
        r.overkill.map(function (t) { return '<li class="tag tag--bad">' + esc(t) + "</li>"; }).join("") +
        "</ul></div></div>" +
        '<div class="wm" title="~' + pct + '% credits saved vs the wasteful default">' +
        '<div class="wm__track"><div class="wm__opt" style="width:' + (100 - pct) + '%"></div>' +
        '<div class="wm__waste" style="width:' + pct + '%"></div></div>' +
        '<span class="wm__pct">\u2212' + pct + "%</span></div>" +
        '<p class="rcard__note">' + esc(r.note) + "</p></article>";
    }).join("");
  }

  // ---------- inputs ----------
  function renderInputs() {
    $("inputsGrid").innerHTML = D.inputs.map(function (b) {
      return '<article class="icard"><div class="icard__top">' + platBadge(b.plat) +
        '<span class="icard__sub">' + esc(D.platforms[b.plat].kind) + "</span></div>" +
        '<div class="icol"><span class="icol__lbl icol__lbl--do">Feed it</span><ul>' +
        b.do.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div>" +
        '<div class="icol"><span class="icol__lbl icol__lbl--dont">Avoid</span><ul>' +
        b.dont.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div></article>";
    }).join("");
  }

  // ---------- rule book ----------
  var rCat = "All";
  var rCats = ["All", "Video", "Image & Upscale", "Text & Reasoning", "Prompts & Tokens", "Every tool"];
  var TAGLBL = { always: "Always", default: "Default", avoid: "Avoid" };
  $("rulesChips").innerHTML = rCats.map(function (c) {
    return '<button class="chip' + (c === rCat ? " chip--on" : "") + '" data-c="' + esc(c) + '">' + esc(c) + "</button>";
  }).join("");
  function renderRules() {
    var q = $("rulesSearch").value.toLowerCase().trim();
    var html = "", total = 0;
    rCats.filter(function (c) { return c !== "All"; }).forEach(function (cat) {
      var items = D.rules.filter(function (r) {
        return r.cat === cat && (rCat === "All" || r.cat === rCat) &&
          (q === "" || (r.if + " " + r.then + " " + r.why).toLowerCase().indexOf(q) >= 0);
      });
      if (!items.length) return;
      total += items.length;
      html += '<section class="group"><div class="group__head"><h2 class="group__name">' + esc(cat) +
        '</h2><span class="group__count">' + items.length + "</span></div>";
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

  // ---------- plan picker ----------
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }

  function renderUsageRows() {
    $("usageRows").innerHTML = USAGE.map(function (u, i) {
      var sub = num(u.qty) * num(u.each);
      return '<div class="row row--usage">' +
        '<input class="fld" data-u="' + i + '" data-f="label" value="' + esc(u.label) + '" placeholder="e.g. reels" />' +
        '<input class="fld fld--num mono" data-u="' + i + '" data-f="qty" type="number" min="0" value="' + esc(u.qty) + '" />' +
        '<input class="fld fld--num mono" data-u="' + i + '" data-f="each" type="number" min="0" value="' + esc(u.each) + '" />' +
        '<span class="sub" data-sub="' + i + '">' + fmtInt(sub) + "</span>" +
        '<button class="xbtn" data-rm-u="' + i + '" title="Remove" aria-label="Remove activity">\u00d7</button></div>';
    }).join("");
    bindUsage();
  }
  function bindUsage() {
    Array.prototype.forEach.call($("usageRows").querySelectorAll("input"), function (inp) {
      inp.addEventListener("input", function () {
        var i = +inp.getAttribute("data-u"), f = inp.getAttribute("data-f");
        USAGE[i][f] = f === "label" ? inp.value : num(inp.value);
        var row = $("usageRows").querySelector('[data-sub="' + i + '"]');
        if (row) row.textContent = fmtInt(num(USAGE[i].qty) * num(USAGE[i].each));
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
        '<button class="xbtn" data-rm-p="' + i + '" title="Remove" aria-label="Remove plan">\u00d7</button></div>';
    }).join("");
    bindPlans();
  }
  function bindPlans() {
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

  function recompute() {
    var usage = USAGE.reduce(function (s, u) { return s + num(u.qty) * num(u.each); }, 0);
    $("usageTotal").textContent = fmtInt(usage);

    var valid = PLANS.filter(function (p) { return num(p.credits) > 0; }).map(function (p) {
      var price = num(p.price), credits = num(p.credits);
      return {
        name: (p.name || "Unnamed"), price: price, credits: credits,
        cpc: credits > 0 ? price / credits : 0,
        covers: credits >= usage, headroom: credits - usage,
        headroomPct: usage > 0 ? Math.round(((credits - usage) / usage) * 100) : null,
        shortfall: usage - credits,
      };
    });

    var out = $("planResults");
    if (usage <= 0) { out.innerHTML = reco("warn", "Add your usage", "Estimate your monthly burn on the left and a recommendation appears here."); return; }
    if (!valid.length) { out.innerHTML = reco("warn", "Add a plan", "Drop in at least one plan with a credit amount on the right to compare."); return; }

    var byPrice = valid.slice().sort(function (a, b) { return a.price - b.price; });
    var covering = byPrice.filter(function (p) { return p.covers; });
    var byValue = valid.slice().sort(function (a, b) { return a.cpc - b.cpc; });
    var bestValue = byValue[0];

    var pickName, card;
    if (covering.length) {
      var fit = covering[0]; pickName = fit.name;
      var body = "<b>" + esc(fit.name) + "</b> is the cheapest plan that covers your ~" + fmtInt(usage) +
        " credits/mo, at <b>" + fmtCpc(fit.cpc) + "/credit</b>, leaving " + fmtInt(fit.headroom) +
        " credits (" + fit.headroomPct + "%) of headroom.";
      if (fit.headroomPct !== null && fit.headroomPct < 12) {
        var next = covering[1];
        body += " That headroom is thin" + (next ? " — if your usage swings month to month, " + esc(next.name) + " gives you more room." : ".");
      }
      if (bestValue && bestValue.name !== fit.name && bestValue.credits > fit.credits) {
        body += " If you expect to grow, <b>" + esc(bestValue.name) + "</b> is cheaper per credit (" + fmtCpc(bestValue.cpc) +
          ") but buys " + fmtInt(bestValue.credits - usage) + " credits you wouldn't use yet.";
      }
      card = reco("ok", fit.name, body);
    } else {
      var biggest = valid.slice().sort(function (a, b) { return b.credits - a.credits; })[0];
      pickName = biggest.name;
      card = reco("warn", biggest.name + " + top-ups",
        "No single plan covers your ~" + fmtInt(usage) + " credits/mo. The largest, <b>" + esc(biggest.name) + "</b>, gives " +
        fmtInt(biggest.credits) + " — you'd be short " + fmtInt(usage - biggest.credits) +
        ". Buy it plus top-ups, stack two plans, or trim usage.");
    }

    var rows = byPrice.map(function (p) {
      var cover = p.covers
        ? '<span class="pill pill--ok">covers +' + fmtInt(p.headroom) + "</span>"
        : '<span class="pill pill--short">short ' + fmtInt(p.shortfall) + "</span>";
      return '<tr class="' + (p.name === pickName ? "is-pick" : "") + '"><td>' + esc(p.name) + "</td><td>" +
        fmtMoney(p.price) + "</td><td>" + fmtInt(p.credits) + "</td><td>" + fmtCpc(p.cpc) + "</td><td>" + cover + "</td></tr>";
    }).join("");

    out.innerHTML = card +
      '<table class="ptable"><thead><tr><th>Plan</th><th>Price</th><th>Credits</th><th>Per credit</th><th>Fit</th></tr></thead><tbody>' +
      rows + "</tbody></table>" +
      '<p class="note">Cost-per-credit ranks raw value; "fit" checks the plan against your ~' + fmtInt(usage) +
      "/mo burn. Heads-up: most credits expire monthly and don't roll over, so buying far above your usage is wasted unless the plan rolls credits forward.</p>";
  }
  function reco(kind, name, body) {
    return '<div class="reco' + (kind === "warn" ? " reco--warn" : "") + '">' +
      '<p class="reco__eyebrow">' + (kind === "warn" ? "Heads-up" : "Recommended") + "</p>" +
      '<h3 class="reco__name">' + esc(name) + "</h3>" +
      '<p class="reco__body">' + body + "</p></div>";
  }

  // currency + add buttons
  $("currSel").value = CURRENCY;
  $("currSel").addEventListener("change", function () { CURRENCY = $("currSel").value; recompute(); save(); });
  $("addUsage").addEventListener("click", function () { USAGE.push({ label: "", qty: 0, each: 0 }); renderUsageRows(); recompute(); });
  $("addPlan").addEventListener("click", function () { PLANS.push({ name: "", price: 0, credits: 0 }); renderPlanRows(); recompute(); });

  // save on any change (debounced-ish via input events already wired; also catch periodically)
  document.addEventListener("input", save);
  document.addEventListener("click", function (e) { if (e.target.closest(".xbtn,.addbtn,.tab")) save(); });

  // ---------- init ----------
  renderPicker();
  renderRecipes();
  renderInputs();
  renderRules();
  renderUsageRows();
  renderPlanRows();
  recompute();
  setTab(TAB);
})();
