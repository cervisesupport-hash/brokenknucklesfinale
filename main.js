/* ==========================================================================
   Broken Knuckles Auto Repair — main.js
   No dependencies. Everything degrades gracefully without JS.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CONFIG — paste your Google Apps Script Web App URL here.
      Full setup steps are in README.md (takes about 5 minutes).
      Until it is filled in, the form falls back to opening the customer's
      email app so no request is ever lost.
   -------------------------------------------------------------------------- */
const GOOGLE_SHEET_ENDPOINT = ""; // e.g. "https://script.google.com/macros/s/AKfy.../exec"
const FALLBACK_EMAIL = "";        // optional: your shop email, used if the endpoint ever fails
const SHOP_PHONE = "(425) 308-2231";

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---------------------------------------------------------------- Year */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------- Scroll reveal (new) */
  const animated = $$("[data-anim]");
  if (!("IntersectionObserver" in window) || reduceMotion) {
    animated.forEach((el) => el.classList.add("in"));
  } else {
    const revealer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const delay = parseInt(el.dataset.delay || "0", 10);
          setTimeout(() => el.classList.add("in"), delay);
          revealer.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    animated.forEach((el) => revealer.observe(el));

    // Anything already on screen at load (the hero) shows immediately.
    requestAnimationFrame(() => {
      animated.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
          const delay = parseInt(el.dataset.delay || "0", 10);
          setTimeout(() => el.classList.add("in"), delay);
          revealer.unobserve(el);
        }
      });
    });
  }

  /* ------------------------------------------------ Counting stats (new) */
  const counters = $$("[data-count]");
  if (counters.length) {
    const runCount = (el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const suffix = el.dataset.suffix || "";
      if (reduceMotion) {
        el.textContent = target.toFixed(decimals) + suffix;
        return;
      }
      const duration = 1500;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = (target * eased).toFixed(decimals) + (p === 1 ? suffix : "");
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if ("IntersectionObserver" in window) {
      const countObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              runCount(e.target);
              countObserver.unobserve(e.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach((el) => countObserver.observe(el));
    } else {
      counters.forEach(runCount);
    }
  }

  /* ------------------------------- Header shrink + scroll progress (new) */
  const header = $("#siteHeader");
  const progress = $("#scrollProgress");
  const heroImg = $("#heroImg");
  const roadsideImg = $(".roadside-img");

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY || window.pageYOffset;

      if (header) header.classList.toggle("shrunk", y > 40);

      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = max > 0 ? (y / max) * 100 + "%" : "0%";
      }

      // Parallax (new) — hero and roadside images drift slower than the page.
      if (!reduceMotion) {
        if (heroImg && y < window.innerHeight * 1.2) {
          heroImg.style.transform = "translate3d(0," + y * 0.22 + "px,0) scale(1.06)";
        }
        if (roadsideImg) {
          const r = roadsideImg.parentElement.getBoundingClientRect();
          if (r.bottom > 0 && r.top < window.innerHeight) {
            const offset = (window.innerHeight - r.top) * 0.06;
            roadsideImg.style.transform = "translate3d(0," + (offset - 30) + "px,0) scale(1.12)";
          }
        }
      }

      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* -------------------------------------------- Active nav link (new) */
  const navLinks = $$(".site-nav a");
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id)
          );
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => navObserver.observe(s));
  }

  /* ---------------------------------------------------- Booking form */
  const form = $("#bookingForm");
  if (!form) return;

  const btn = $("#submitBtn");
  const statusEl = $("#formStatus");
  const label = $(".btn-label", btn);

  const setStatus = (msg, kind) => {
    statusEl.textContent = msg;
    statusEl.className = "form-status show " + (kind || "");
  };

  const markInvalid = (field) => {
    field.classList.add("invalid");
    field.addEventListener("input", () => field.classList.remove("invalid"), { once: true });
  };

  const validate = () => {
    let firstBad = null;
    ["#f-name", "#f-phone", "#f-issue"].forEach((sel) => {
      const field = $(sel);
      if (!field.value.trim()) {
        markInvalid(field);
        if (!firstBad) firstBad = field;
      }
    });
    const phone = $("#f-phone");
    const digits = phone.value.replace(/\D/g, "");
    if (phone.value.trim() && digits.length < 10) {
      markInvalid(phone);
      if (!firstBad) firstBad = phone;
    }
    return firstBad;
  };

  const collect = () => {
    const data = {};
    new FormData(form).forEach((v, k) => (data[k] = String(v).trim()));
    data.submittedAt = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
    data.source = "brokenknuckles.website";
    return data;
  };

  const mailtoFallback = (data) => {
    if (!FALLBACK_EMAIL) {
      setStatus("Form isn't connected yet — please call " + SHOP_PHONE + ".", "err");
      return;
    }
    const body = [
      "Name: " + data.name,
      "Phone: " + data.phone,
      "Vehicle: " + (data.vehicle || "—"),
      "Service type: " + data.serviceType,
      "Preferred day: " + (data.preferredDate || "—"),
      "Preferred time: " + data.preferredTime,
      "",
      "Issue:",
      data.issue
    ].join("\n");
    window.location.href =
      "mailto:" + FALLBACK_EMAIL +
      "?subject=" + encodeURIComponent("Service request — " + data.name) +
      "&body=" + encodeURIComponent(body);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Honeypot: silently accept and discard bot submissions.
    if ($("#f-company").value) return;

    const bad = validate();
    if (bad) {
      setStatus("Please fill in your name, a valid phone number, and the issue.", "err");
      bad.focus();
      return;
    }

    const data = collect();

    if (!GOOGLE_SHEET_ENDPOINT) {
      if (FALLBACK_EMAIL) setStatus("Opening your email app…", "ok");
      mailtoFallback(data);
      return;
    }

    btn.disabled = true;
    btn.classList.add("loading");
    label.textContent = "Sending…";
    setStatus("", "");

    try {
      // text/plain avoids a CORS preflight that Apps Script cannot answer.
      const res = await fetch(GOOGLE_SHEET_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      });

      let ok = res.ok;
      try {
        const json = await res.json();
        ok = ok && json.result !== "error";
      } catch (_) {
        /* Apps Script sometimes returns a redirect/HTML body — status is enough. */
      }
      if (!ok) throw new Error("Bad response");

      form.reset();
      label.textContent = "Request Sent";
      setStatus("Got it. Mike will call you back with a quote and a time.", "ok");
      setTimeout(() => { label.textContent = "Send Request"; }, 6000);
    } catch (err) {
      if (FALLBACK_EMAIL) {
        setStatus("Couldn't send that — press send again to email it instead, or call " + SHOP_PHONE + ".", "err");
        label.textContent = "Email It Instead";
        btn.onclick = () => mailtoFallback(data);
      } else {
        setStatus("Couldn't send that right now — please call " + SHOP_PHONE + ".", "err");
      }
    } finally {
      btn.disabled = false;
      btn.classList.remove("loading");
    }
  });
})();
