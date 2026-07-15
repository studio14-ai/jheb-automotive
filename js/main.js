/* JHEB Automotive — interactions (Mobera-style)
   Vanilla JS, no dependencies. Motion is transform/opacity only and
   is skipped or simplified when prefers-reduced-motion is set. */

(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Nav background on scroll ── */
  var nav = document.getElementById("nav");
  function onScroll() { nav.classList.toggle("is-scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ── Overlay menu ── */
  var burger = document.getElementById("navBurger");
  var omenu = document.getElementById("overlayMenu");
  function setMenu(open) {
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    if (open) {
      omenu.hidden = false;
      void omenu.offsetHeight;
      omenu.classList.add("is-open");
      document.body.style.overflow = "hidden";
    } else {
      omenu.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(function () { if (!omenu.classList.contains("is-open")) omenu.hidden = true; }, 400);
    }
  }
  burger.addEventListener("click", function () { setMenu(!burger.classList.contains("is-open")); });
  omenu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && burger.classList.contains("is-open")) setMenu(false); });

  /* ── Hero typewriter ── */
  var typed = document.getElementById("typed");
  if (typed) {
    var full = "Done Right.";
    if (reduceMotion) {
      typed.textContent = full;
    } else {
      var i = 0;
      setTimeout(function tick() {
        typed.textContent = full.slice(0, i);
        i++;
        if (i <= full.length) setTimeout(tick, 85);
      }, 650);
    }
  }

  /* ── Services accordion (independent toggles, animated height) ── */
  var acc = document.getElementById("acc");
  if (acc) {
    var items = Array.prototype.slice.call(acc.querySelectorAll(".acc__item"));
    function panelOf(it) { return it.querySelector(".acc__panel"); }
    function openItem(it) {
      var p = panelOf(it);
      it.classList.add("is-open");
      it.querySelector(".acc__head").setAttribute("aria-expanded", "true");
      p.style.height = p.scrollHeight + "px";
    }
    function closeItem(it) {
      var p = panelOf(it);
      p.style.height = p.scrollHeight + "px";
      void p.offsetHeight;
      it.classList.remove("is-open");
      it.querySelector(".acc__head").setAttribute("aria-expanded", "false");
      p.style.height = "0px";
    }
    /* init: open the first, others closed */
    items.forEach(function (it, idx) {
      var p = panelOf(it);
      if (idx === 0 && it.classList.contains("is-open")) { p.style.height = "auto"; requestAnimationFrame(function(){ p.style.height = p.scrollHeight + "px"; }); }
      else { p.style.height = "0px"; }
    });
    items.forEach(function (it) {
      it.querySelector(".acc__head").addEventListener("click", function () {
        /* toggle this item only — never touch others, so nothing above the tap
           moves and the panel simply expands down from where it was tapped */
        if (it.classList.contains("is-open")) closeItem(it); else openItem(it);
      });
    });
    /* keep open panel sized correctly on resize */
    var rz;
    window.addEventListener("resize", function () {
      clearTimeout(rz);
      rz = setTimeout(function () {
        items.forEach(function (it) { if (it.classList.contains("is-open")) panelOf(it).style.height = panelOf(it).scrollHeight + "px"; });
      }, 150);
    });
    /* auto-collapse an open service once it has fully scrolled off the BOTTOM of
       the viewport (i.e. the user scrolled back up past it). Only the bottom edge
       is safe — collapsing an item above the viewport would shift the page and
       reintroduce the jump. An item must have been seen first, so the default-open
       first service isn't closed before it ever comes into view. */
    if ("IntersectionObserver" in window) {
      var seen = new WeakSet();
      var accIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var it = entry.target;
          if (entry.isIntersecting) { seen.add(it); return; }
          if (!seen.has(it) || !it.classList.contains("is-open")) return;
          var vpBottom = entry.rootBounds ? entry.rootBounds.bottom : window.innerHeight;
          if (entry.boundingClientRect.top >= vpBottom) closeItem(it);
        });
      }, { threshold: 0 });
      items.forEach(function (it) { accIo.observe(it); });
    }
  }

  /* ── Reviews marquee: pause while a finger is held on it (touch) ── */
  var marquee = document.getElementById("marquee");
  if (marquee) {
    var pause = function () { marquee.classList.add("is-paused"); };
    var resume = function () { marquee.classList.remove("is-paused"); };
    marquee.addEventListener("touchstart", pause, { passive: true });
    marquee.addEventListener("touchend", resume, { passive: true });
    marquee.addEventListener("touchcancel", resume, { passive: true });
  }

  /* ── Scroll reveals (staggered) ── */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var parent = el.parentElement;
        var sibs = parent ? Array.prototype.filter.call(parent.children, function (c) { return c.classList && c.classList.contains("reveal"); }) : [el];
        var idx = sibs.indexOf(el);
        el.style.setProperty("--d", (Math.max(idx, 0) * 70) + "ms");
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ── Counters ── */
  var counters = document.querySelectorAll("[data-count]");
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }
    var dur = 1500, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) { animateCounter(entry.target); cio.unobserve(entry.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else { counters.forEach(animateCounter); }

  /* ── Reviews marquee: duplicate track for a seamless loop ── */
  var marquee = document.getElementById("marquee");
  if (marquee && !reduceMotion) {
    var track = marquee.querySelector(".marquee__track");
    track.innerHTML += track.innerHTML; /* duplicate so -50% translate loops seamlessly */
    track.setAttribute("aria-hidden", "false");
  }

  /* ── Hero image carousel (auto-rotating, indicator synced to rotation) ── */
  var heroSlides = document.getElementById("heroSlides");
  var heroDotsWrap = document.getElementById("heroDots");
  if (heroSlides && heroDotsWrap) {
    var slides = Array.prototype.slice.call(heroSlides.querySelectorAll(".hero__slide"));
    var dots = Array.prototype.slice.call(heroDotsWrap.querySelectorAll(".hero__dot"));
    var SLIDE_MS = 6000;                 /* must match --slide-dur in CSS */
    var cur = 0;
    heroDotsWrap.style.setProperty("--slide-dur", (SLIDE_MS / 1000) + "s");

    function armDot(idx) {
      /* restart the progress-fill animation on the active dot */
      var fill = dots[idx].querySelector(".hero__dot-fill");
      if (!fill) return;
      fill.style.animation = "none";
      void fill.offsetWidth;            /* reflow so the animation replays */
      fill.style.animation = "";
    }
    function show(n) {
      var next = (n + slides.length) % slides.length;
      var incoming = slides[next], outgoing = slides[cur];
      if (incoming !== outgoing) {
        /* park the incoming slide off to the right with no transition, then
           slide it in — so every change reads right-to-left regardless of order */
        incoming.classList.add("no-anim");
        incoming.classList.remove("is-active", "is-prev");
        void incoming.offsetWidth;             /* commit the reset before animating */
        incoming.classList.remove("no-anim");
        outgoing.classList.remove("is-active");
        outgoing.classList.add("is-prev");      /* exits to the left */
        incoming.classList.add("is-active");    /* enters from the right */
      } else {
        incoming.classList.add("is-active");
      }
      cur = next;
      dots.forEach(function (d, x) {
        var on = x === cur;
        d.classList.toggle("is-active", on);
        d.setAttribute("aria-selected", String(on));
      });
      if (!reduceMotion) armDot(cur);
    }
    /* Advance in lockstep with the indicator: when the active fill finishes,
       move to the next slide. Guarantees the dot and image stay in sync. */
    heroDotsWrap.addEventListener("animationend", function (e) {
      if (e.animationName === "heroProgress") show(cur + 1);
    });
    dots.forEach(function (d, x) {
      d.addEventListener("click", function () { show(x); });
    });
    show(0);
  }

  /* ── Sticky mobile bar after hero ── */
  var mbar = document.querySelector(".mbar");
  var hero = document.querySelector(".hero");
  if (mbar && hero && "IntersectionObserver" in window) {
    var mio = new IntersectionObserver(function (entries) { mbar.classList.toggle("is-visible", !entries[0].isIntersecting); }, { threshold: 0.12 });
    mio.observe(hero);
  } else if (mbar) { mbar.classList.add("is-visible"); }

  /* ── Quick-booking select → jumps to the full form with service preselected ── */
  var quickForm = document.getElementById("quickForm");
  if (quickForm) {
    quickForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = quickForm.service.value;
      var full = document.getElementById("fService");
      if (full) { for (var i = 0; i < full.options.length; i++) { if (full.options[i].value === val || full.options[i].text === val) { full.selectedIndex = i; break; } } }
      document.getElementById("contact").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      setTimeout(function () { var n = document.getElementById("fName"); if (n) n.focus({ preventScroll: true }); }, reduceMotion ? 0 : 600);
    });
  }

  /* ── Booking form → mailto ── */
  var form = document.getElementById("bookForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.name.value.trim(), phone = form.phone.value.trim(), ok = true;
      [["name", name], ["phone", phone]].forEach(function (pair) {
        var input = form[pair[0]], field = input.closest(".field"), err = field.querySelector(".ferr");
        if (!pair[1]) {
          ok = false; input.classList.add("is-error");
          if (!err) { err = document.createElement("span"); err.className = "ferr"; err.setAttribute("role", "alert"); err.textContent = "Please add your " + pair[0] + " so we can get back to you."; field.appendChild(err); }
        } else { input.classList.remove("is-error"); if (err) err.remove(); }
      });
      if (!ok) { form.querySelector(".is-error").focus(); return; }
      var lines = [
        "Booking enquiry from the website", "",
        "Name: " + name, "Phone: " + phone,
        "Vehicle: " + (form.vehicle.value.trim() || "-"),
        "Service: " + form.service.value,
        "", "Notes:", form.notes.value.trim() || "-"
      ];
      window.location.href = "mailto:JHEBautomotive@gmail.com?subject=" +
        encodeURIComponent("Booking enquiry — " + name) + "&body=" + encodeURIComponent(lines.join("\n"));
      document.getElementById("formDone").hidden = false;
    });
  }

  /* ── Footer year ── */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
