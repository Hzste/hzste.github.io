/* ============================================================
   Clipworth landing interactions
   ============================================================ */
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
  var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 24); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  if (burger) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---- Reveal on scroll ----
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  // ---- Live earnings demo (the signature) ----
  (function () {
    var slider = document.getElementById("viewSlider");
    var viewNum = document.getElementById("viewNum");
    var earnNum = document.getElementById("earnNum");
    var potFill = document.getElementById("potFill");
    var potText = document.getElementById("potText");
    if (!slider) return;

    var CPM = 1;             // $ per 1,000 views
    var MAX_PAYOUT = 1000;   // per-clip cap (aspirational, from a bigger pot)
    var SLIDER_MAX = parseInt(slider.max, 10);

    var displayed = 0;                          // animated number (eases up)
    var target = parseInt(slider.value, 10);    // slider is the source of truth

    function paint() {
      var v = Math.round(displayed);
      var sv = parseInt(slider.value, 10);
      var earn = Math.min(MAX_PAYOUT, Math.floor((v / 1000) * CPM * 100) / 100);
      viewNum.textContent = fmt(v);
      earnNum.textContent = earn.toFixed(2);
      potFill.style.width = Math.min(100, (earn / MAX_PAYOUT) * 100).toFixed(1) + "%";
      potText.textContent = "$" + Math.round(earn).toLocaleString("en-US") + " of $1,000 per clip";
      slider.style.backgroundSize = ((sv / SLIDER_MAX) * 100).toFixed(1) + "% 100%";
    }

    slider.addEventListener("input", function () {
      target = parseInt(slider.value, 10);
      if (reduceMotion) displayed = target;
      paint();
    });

    if (reduceMotion) {
      displayed = target; paint();
    } else {
      var loop = function () {
        displayed += (target - displayed) * 0.14;
        if (Math.abs(target - displayed) < 40) displayed = target;
        paint();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  })();

  // ---- 3D tilt ----
  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      var inner = card.firstElementChild || card;
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = "rotateY(" + (px * 7).toFixed(2) + "deg) rotateX(" + (-py * 7).toFixed(2) + "deg)";
      });
      card.addEventListener("mouseleave", function () { inner.style.transform = ""; });
    });
  }

  // ---- Ambient particles (rising coins/sparks; pre-rendered glow, no per-frame shadowBlur) ----
  if (!reduceMotion) {
    var canvas = document.getElementById("particles");
    var ctx = canvas.getContext("2d");
    var W, H, parts;
    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

    // Render a soft round glow once per colour, then just blit it per particle.
    function makeSprite(rgb) {
      var s = 32, c = document.createElement("canvas");
      c.width = c.height = s;
      var g = c.getContext("2d");
      var grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grad.addColorStop(0, "rgba(" + rgb + ",0.95)");
      grad.addColorStop(0.35, "rgba(" + rgb + ",0.4)");
      grad.addColorStop(1, "rgba(" + rgb + ",0)");
      g.fillStyle = grad; g.fillRect(0, 0, s, s);
      return c;
    }
    var spriteMint = makeSprite("91,240,176"), spriteGold = makeSprite("255,211,122");

    function resize() {
      W = canvas.width = window.innerWidth * DPR;
      H = canvas.height = window.innerHeight * DPR;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      var count = Math.min(28, Math.round(window.innerWidth / 56));
      parts = [];
      for (var i = 0; i < count; i++) parts.push(spawn(true));
    }
    function spawn(scatter) {
      return {
        x: Math.random() * W,
        y: scatter ? Math.random() * H : H + 20 * DPR,
        r: (Math.random() * 2.4 + 1.1) * DPR,
        s: (Math.random() * 0.35 + 0.12) * DPR,
        a: Math.random() * 0.5 + 0.2,
        gold: Math.random() < 0.22,
        drift: (Math.random() - 0.5) * 0.25 * DPR
      };
    }
    // Freeze the canvas while actively scrolling so the scroll stays smooth.
    var scrollingNow = false, scrollIdle;
    window.addEventListener("scroll", function () {
      scrollingNow = true;
      clearTimeout(scrollIdle);
      scrollIdle = setTimeout(function () { scrollingNow = false; }, 140);
    }, { passive: true });

    function tick() {
      if (!scrollingNow) {
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.y -= p.s; p.x += p.drift;
          if (p.y < -10 * DPR) parts[i] = spawn(false);
          var img = p.gold ? spriteGold : spriteMint;
          var d = p.r * 7;
          ctx.globalAlpha = p.a;
          ctx.drawImage(img, p.x - d / 2, p.y - d / 2, d, d);
        }
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(tick);
    }
    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(tick);
  }
})();
