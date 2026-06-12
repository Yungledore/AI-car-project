(() => {
  const form = document.getElementById("conceptForm");
  const emptyState = document.getElementById("emptyState");
  const loadingState = document.getElementById("loadingState");
  const resultState = document.getElementById("resultState");
  const formError = document.getElementById("formError");
  const loaderText = document.getElementById("loaderText");
  const generateBtn = document.getElementById("generateBtn");
  const captchaModal = document.getElementById("captchaModal");
  const cancelCaptcha = document.getElementById("cancelCaptcha");

  const LOADER_MSGS = [
    "Querying AI…",
    "Sketching body lines…",
    "Balancing materials…",
    "Dialing the cockpit mood…",
    "Finalizing launch specs…",
  ];

  let loaderInterval = null;
  let captchaWidgetId = null;

  const bindText = (id, value) => {
    document.getElementById(id).textContent = value || "";
  };
  const escHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const listInto = (id, items) => {
    document.getElementById(id).innerHTML = (items || [])
      .map((item) => `<li>${escHtml(item)}</li>`)
      .join("");
  };

  const tagsInto = (id, items) => {
    document.getElementById(id).innerHTML = (items || [])
      .map((item) => `<span class="tag">${escHtml(item)}</span>`)
      .join("");
  };

  window.hcaptchaReady = () => {
    if (
      !window.hcaptcha ||
      !document.getElementById("hcaptchaWidget") ||
      captchaWidgetId !== null
    )
      return;
    captchaWidgetId = window.hcaptcha.render("hcaptchaWidget", {
      sitekey: window.HCAPTCHA_SITE_KEY,
      theme: "dark",
      size: "compact",
      callback: (token) => {
        hideCaptcha();
        runGeneration(token);
      },
      "expired-callback": () => {
        hideCaptcha();
        generateBtn.disabled = false;
        formError.textContent = "CAPTCHA expired. Please try again.";
      },
      "error-callback": () => {
        hideCaptcha();
        generateBtn.disabled = false;
        formError.textContent =
          "CAPTCHA could not load. Refresh and try again.";
      },
    });
  };

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    formError.textContent = "";
    generateBtn.disabled = true;
    if (window.hcaptcha && captchaWidgetId !== null) {
      window.hcaptcha.reset(captchaWidgetId);
      showCaptcha();
      return;
    }
    generateBtn.disabled = false;
    formError.textContent =
      "CAPTCHA is still loading. Please wait a moment and try again.";
  });

  cancelCaptcha?.addEventListener("click", () => {
    hideCaptcha();
    generateBtn.disabled = false;
  });

  async function runGeneration(token) {
    formError.textContent = "";
    toggleStates("loading");
    startLoader();
    try {
      const prefs = Object.fromEntries(new FormData(form).entries());
      prefs["h-captcha-response"] = token;
      const resp = await fetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success)
        throw new Error(data.error || "Something went wrong.");
      renderConcept(data.concept);
      toggleStates("result");
    } catch (error) {
      toggleStates("empty");
      formError.textContent =
        error.message || "Could not generate the concept.";
    } finally {
      stopLoader();
      generateBtn.disabled = false;
      if (window.hcaptcha && captchaWidgetId !== null)
        window.hcaptcha.reset(captchaWidgetId);
    }
  }

  function startLoader() {
    let i = 0;
    loaderText.textContent = LOADER_MSGS[0];
    loaderInterval = window.setInterval(() => {
      i = (i + 1) % LOADER_MSGS.length;
      loaderText.textContent = LOADER_MSGS[i];
    }, 1400);
  }

  function stopLoader() {
    if (loaderInterval) window.clearInterval(loaderInterval);
    loaderInterval = null;
  }

  function showCaptcha() {
    captchaModal.classList.remove("hidden");
  }

  function hideCaptcha() {
    captchaModal.classList.add("hidden");
  }

  function toggleStates(mode) {
    emptyState.classList.toggle("hidden", mode !== "empty");
    loadingState.classList.toggle("hidden", mode !== "loading");
    resultState.classList.toggle("hidden", mode !== "result");
  }

  function renderConcept(concept) {
    const c = concept;
    bindText("carName", c.name);
    bindText("tagline", c.tagline);
    bindText("retailPrice", c.retail_price);
    bindText("description", c.description);
    bindText("powertrain", c.powertrain);
    bindText("cockpitTheme", c.cockpit_theme);
    bindText("targetDriver", c.target_driver);
    listInto("materials", c.materials);
    listInto("features", c.features);
    tagsInto("styleTags", c.style_tags);
    const img = document.getElementById("conceptImage");
    img.src = c.image_url;
    img.alt = `${c.name} concept render`;
    renderColorwayButtons(c.colorways, c.name);
    renderCarSvg(c.colorways?.[0] || {}, c.name);
  }

  function renderColorwayButtons(colorways, name) {
    const mount = document.getElementById("swatchButtons");
    mount.innerHTML = "";
    (colorways || []).forEach((cw, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `swatch-btn ${index === 0 ? "active" : ""}`;
      btn.textContent = cw.name;
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".swatch-btn")
          .forEach((node) => node.classList.remove("active"));
        btn.classList.add("active");
        renderCarSvg(cw, name);
      });
      mount.appendChild(btn);
    });
  }

  function renderCarSvg(cw, name = "") {
    const mount = document.getElementById("carSvgMount");
    mount.innerHTML = `
    <svg viewBox="0 0 780 420" role="img" aria-label="${escHtml(name || cw.name || "Car concept")} colorway preview">
      <defs>
        <linearGradient id="bodyFill" x1="0" x2="1">
          <stop offset="0%" stop-color="${cw.body || "#1d4ed8"}"/>
          <stop offset="100%" stop-color="${shade(cw.body || "#1d4ed8", 32)}"/>
        </linearGradient>
        <linearGradient id="accentFill" x1="0" x2="1">
          <stop offset="0%" stop-color="${cw.accent || "#f97316"}"/>
          <stop offset="100%" stop-color="${shade(cw.accent || "#f97316", 18)}"/>
        </linearGradient>
      </defs>
      <rect width="780" height="420" rx="28" fill="#0d1220"/>
      <ellipse cx="390" cy="336" rx="250" ry="24" fill="${alpha(cw.accent || "#f97316", 0.18)}"/>
      <path d="M128 264 Q176 176 314 160 L468 146 Q576 147 642 223 L684 263 L660 292 L598 292 Q582 239 530 236 Q480 238 458 292 L276 292 Q254 238 204 236 Q151 239 132 292 L98 292 Q75 292 83 270 Z" fill="url(#bodyFill)" stroke="${shade(cw.body || "#1d4ed8", 52)}" stroke-width="4"/>
      <path d="M285 168 L362 132 Q437 118 516 128 L582 214 L352 214 Z" fill="${alpha(cw.cabin || "#d9dce5", 0.86)}"/>
      <path d="M170 248 L102 260" stroke="url(#accentFill)" stroke-width="8" stroke-linecap="round"/>
      <path d="M614 247 L674 256" stroke="#fff2b0" stroke-width="8" stroke-linecap="round"/>
      <path d="M323 158 Q416 135 526 146" stroke="${alpha(cw.accent || "#f97316", 0.95)}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="208" cy="290" r="43" fill="${cw.wheels || "#1b1e28"}"/>
      <circle cx="208" cy="290" r="22" fill="${shade(cw.wheels || "#1b1e28", 70)}"/>
      <circle cx="528" cy="290" r="43" fill="${cw.wheels || "#1b1e28"}"/>
      <circle cx="528" cy="290" r="22" fill="${shade(cw.wheels || "#1b1e28", 70)}"/>
      <text x="40" y="52" fill="#dbeafe" font-size="24" font-family="Inter, Arial" font-weight="700">${escHtml(cw.name || "Launch Spec")}</text>
      <text x="40" y="82" fill="#95a4c6" font-size="14" font-family="Inter, Arial">Body · ${escHtml(cw.body || "#1d4ed8")} · Accent · ${escHtml(cw.accent || "#f97316")}</text>
    </svg>`;
  }

  function shade(hex, amount) {
    const clean = (hex || "#000000").replace("#", "");
    const num = parseInt(clean, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 255) + amount));
    const b = Math.min(255, Math.max(0, (num & 255) + amount));
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }

  function alpha(hex, opacity) {
    const clean = (hex || "#000000").replace("#", "");
    const num = parseInt(clean, 16);
    const r = num >> 16;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
})();

