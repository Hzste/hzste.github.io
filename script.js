/* Clipworth landing interactions */
(function () {
  "use strict";

  var DISCORD_URL = "https://discord.gg/85J8GQTShh";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };

  // ---- Discord links + year ----
  document.querySelectorAll("[data-discord]").forEach(function (a) { a.setAttribute("href", DISCORD_URL); });
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- Nav: scrolled state + mobile menu ----
  var nav = document.getElementById("nav");
  var burger = document.getElementById("burger");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 16); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  if (nav && burger) {
    var setOpen = function (open) {
      nav.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    };
    burger.addEventListener("click", function () { setOpen(!nav.classList.contains("open")); });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { setOpen(false); burger.focus(); }
    });
    window.matchMedia("(min-width: 761px)").addEventListener("change", function (m) { if (m.matches) setOpen(false); });
  }

  // ---- Live earnings demo ----
  (function () {
    var slider = document.getElementById("viewSlider");
    var viewNum = document.getElementById("viewNum");
    var earnNum = document.getElementById("earnNum");
    var potFill = document.getElementById("potFill");
    var potText = document.getElementById("potText");
    if (!slider) return;

    var CPM = 0.5;           // $ per 1,000 views (launch rate)
    var MAX_PAYOUT = 500;    // per-edit cap, matches live campaigns
    var SLIDER_MAX = parseInt(slider.max, 10);

    var displayed = 0;                          // animated number (eases toward target)
    var target = parseInt(slider.value, 10);    // slider is the source of truth
    var running = false;

    function paint() {
      var v = Math.round(displayed);
      var sv = parseInt(slider.value, 10);
      var earn = Math.min(MAX_PAYOUT, Math.floor((v / 1000) * CPM * 100) / 100);
      viewNum.textContent = fmt(v);
      earnNum.textContent = earn.toFixed(2);
      potFill.style.width = Math.min(100, (earn / MAX_PAYOUT) * 100).toFixed(1) + "%";
      potText.textContent = "$" + Math.round(earn).toLocaleString("en-US") + " of $500 per edit";
      slider.style.setProperty("--fill", ((sv / SLIDER_MAX) * 100).toFixed(1) + "%");
      slider.setAttribute("aria-valuetext", fmt(sv) + " views");
    }

    // Only animate while the number is catching up, then stop the loop.
    function step() {
      displayed += (target - displayed) * 0.14;
      if (Math.abs(target - displayed) < 40) displayed = target;
      paint();
      if (displayed !== target) requestAnimationFrame(step); else running = false;
    }
    function go() {
      if (reduceMotion) { displayed = target; paint(); return; }
      if (!running) { running = true; requestAnimationFrame(step); }
    }

    slider.addEventListener("input", function () { target = parseInt(slider.value, 10); go(); });
    go();
  })();
})();
