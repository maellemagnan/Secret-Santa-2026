(() => {
  const { NAMES, SEED, PHOTOS } = window.SANTA_CONFIG;

  /* ---------- Matching (same result for everyone, every time) ---------- */

  function seedFrom(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Sattolo's algorithm builds one big circle, so nobody can draw themselves.
  function buildCircle(names, seed) {
    const rng = mulberry32(seedFrom(seed));
    const circle = [...names].sort((a, b) => a.localeCompare(b));
    for (let i = circle.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * i);
      [circle[i], circle[j]] = [circle[j], circle[i]];
    }
    return circle;
  }

  const clean = (s) => s.trim().replace(/\s+/g, " ").toLowerCase();
  const names = NAMES.map((n) => n.trim()).filter(Boolean);
  const uniqueCount = new Set(names.map(clean)).size;
  const configProblem =
    names.length < 2 ? "Add at least two names in config.js." :
    uniqueCount !== names.length ? "Two names in config.js are the same. Make each one different." : "";

  const circle = configProblem ? [] : buildCircle(names, SEED);

  function lookup(typed) {
    const k = circle.findIndex((n) => clean(n) === clean(typed));
    if (k === -1) return null;
    return { giver: circle[k], receiver: circle[(k + 1) % circle.length] };
  }

  /* ---------- Page ---------- */

  const form = document.getElementById("form");
  const input = document.getElementById("name");
  const error = document.getElementById("error");
  const result = document.getElementById("result");
  const giverEl = document.getElementById("giver");
  const matchEl = document.getElementById("match");
  const again = document.getElementById("again");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (configProblem) { error.textContent = configProblem; return; }
    if (!input.value.trim()) { error.textContent = "Type your name first."; input.focus(); return; }

    const found = lookup(input.value);
    if (!found) {
      error.textContent = "I can’t find that name. Check the spelling and try again.";
      input.select();
      return;
    }
    error.textContent = "";
    giverEl.textContent = found.giver;
    matchEl.textContent = found.receiver;
    form.hidden = true;
    result.hidden = false;
    again.focus();
  });

  again.addEventListener("click", () => {
    result.hidden = true;
    matchEl.textContent = "";
    form.hidden = false;
    input.value = "";
    input.focus();
  });

  /* ---------- Collage ---------- */

  const collage = document.getElementById("collage");
  const TILE = 190;

  function buildCollage() {
    const cols = Math.ceil((window.innerWidth * 1.12) / TILE);
    const rows = Math.ceil((window.innerHeight * 1.12) / TILE);
    collage.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    collage.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    collage.textContent = "";

    // fixed shuffle so the collage doesn't jump around on resize
    const rng = mulberry32(seedFrom("collage"));
    const pool = PHOTOS.length ? [...PHOTOS] : [];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    for (let i = 0; i < cols * rows; i++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      const tilt = (rng() * 8 - 4).toFixed(1);
      tile.style.transform = `rotate(${tilt}deg) scale(1.06)`;

      const fallback = () => { tile.textContent = ""; tile.classList.add("f" + (i % 4)); };

      if (pool.length) {
        const img = new Image();
        img.alt = "";
        img.loading = "lazy";
        img.src = pool[i % pool.length];
        img.onerror = fallback;
        tile.appendChild(img);
      } else {
        fallback();
      }
      collage.appendChild(tile);
    }
  }

  /* ---------- Christmas lights ---------- */

  const lights = document.createElement("div");
  lights.className = "lights";
  lights.setAttribute("aria-hidden", "true");
  document.body.insertBefore(lights, document.querySelector(".stage"));

  function buildLights() {
    const w = window.innerWidth;
    const small = w < 600;
    const swags = Math.max(2, Math.round(w / (small ? 130 : 200)));
    const sw = w / swags;               // width of one droop
    const sag = small ? 30 : 42;        // how far the wire droops
    const perSwag = small ? 3 : 4;      // bulbs per droop
    const H = sag + 52;
    const colors = ["#e0322f", "#23a35a"];

    let wire = "M0 -2";
    let bulbs = "";
    let n = 0;
    for (let i = 0; i < swags; i++) {
      const x0 = i * sw;
      wire += ` Q${(x0 + sw / 2).toFixed(1)} ${sag * 2} ${(x0 + sw).toFixed(1)} -2`;
      for (let j = 0; j < perSwag; j++) {
        const tt = (j + 0.5) / perSwag;
        const x = x0 + tt * sw;
        const y = 4 * sag * tt * (1 - tt) - 2;
        const color = colors[n % 2];
        const delay = n % 2 ? "-1.3s" : "0s";
        bulbs +=
          `<g class="bulb" style="color:${color};animation-delay:${delay}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">` +
            `<rect x="-3" y="0" width="6" height="8" rx="1.5" fill="#2a2320"/>` +
            `<path d="M-6 8 H6 C6 8 9 14 9 19 C9 25 5 28 0 28 C-5 28 -9 25 -9 19 C-9 14 -6 8 -6 8 Z" fill="currentColor"/>` +
            `<ellipse cx="-3" cy="17" rx="1.6" ry="3.4" fill="#fff" opacity=".45"/>` +
          `</g>`;
        n++;
      }
    }

    lights.innerHTML =
      `<svg width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" xmlns="http://www.w3.org/2000/svg">` +
        `<path d="${wire}" fill="none" stroke="#2a2320" stroke-width="2.5" stroke-linecap="round"/>` +
        bulbs +
      `</svg>`;
  }

  let t;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { buildCollage(); buildLights(); }, 200); });
  buildCollage();
  buildLights();
})();
