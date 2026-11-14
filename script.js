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

  let t;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(buildCollage, 200); });
  buildCollage();
})();
