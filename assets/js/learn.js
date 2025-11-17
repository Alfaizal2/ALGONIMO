/**
 * ALGONIMO Learn Page Script
 * -----------------------------------------
 * Features:
 * - Smart global search for language links
 * - Keyboard navigation and active state
 * - Topic filter search for learning cards
 * - Quantum Flow Wave Background (Smooth Motion)
 * -----------------------------------------
 * Author: ALGONIMO Development Team
 * Version: 4.6.0
 */

document.addEventListener("DOMContentLoaded", () => {

  /* ------------------------------
     🔍 Global Search Functionality
  ------------------------------ */
  const globalInput = document.getElementById("globalSearchInput");
  const suggestionList = document.getElementById("suggestionList");

  if (globalInput && suggestionList) {
    const languageLinks = Array.from(document.querySelectorAll(".features li a"));
    const languages = languageLinks.map(link => ({
      name: link.textContent.trim(),
      href: link.getAttribute("href")
    }));

    let activeIndex = -1;
    let debounceTimer = null;

    const highlightMatch = (text, query) => {
      const regex = new RegExp(`(${query})`, "gi");
      return text.replace(regex, "<strong>$1</strong>");
    };

    const renderSuggestions = (query) => {
      suggestionList.innerHTML = "";
      activeIndex = -1;
      const searchTerm = query.toLowerCase().trim();
      if (!searchTerm) return;

      const filtered = languages.filter(lang =>
        lang.name.toLowerCase().includes(searchTerm)
      );

      if (!filtered.length) {
        suggestionList.innerHTML = `<li class="no-result">No matches found</li>`;
        return;
      }

      filtered.forEach(lang => {
        const li = document.createElement("li");
        li.classList.add("suggestion-item");
        li.innerHTML = highlightMatch(lang.name, searchTerm);
        li.addEventListener("click", () => window.location.href = lang.href);
        suggestionList.appendChild(li);
      });
    };

    const debounce = (callback, delay) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(callback, delay);
    };

    globalInput.addEventListener("input", () => {
      const query = globalInput.value;
      debounce(() => renderSuggestions(query), 200);
    });

    globalInput.addEventListener("keydown", (e) => {
      const items = suggestionList.querySelectorAll(".suggestion-item");
      if (!items.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
        setActiveItem(items);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + items.length) % items.length;
        setActiveItem(items);
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        items[activeIndex].click();
      }
    });

    const setActiveItem = (items) => {
      items.forEach(item => item.classList.remove("active"));
      if (activeIndex >= 0) {
        items[activeIndex].classList.add("active");
        items[activeIndex].scrollIntoView({ block: "nearest" });
      }
    };

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".global-search")) {
        suggestionList.innerHTML = "";
      }
    });
  }

  /* ------------------------------
     🧠 Topic Card Filtering
  ------------------------------ */
  const searchInput = document.getElementById("searchInput");
  const topicCards = document.querySelectorAll(".topic-card");

  if (searchInput && topicCards.length) {
    searchInput.addEventListener("input", () => {
      const keyword = searchInput.value.toLowerCase().trim();
      topicCards.forEach(card => {
        const text = `${card.dataset.keywords || ""} ${card.innerText}`.toLowerCase();
        card.style.display = text.includes(keyword) ? "block" : "none";
      });
    });
  }

  /* ------------------------------
     🌊 Quantum Flow Wave Background (Slow & Cinematic)
  ------------------------------ */
  const canvas = document.createElement("canvas");
  canvas.id = "bg-animation";
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  let t = 0;
  const waveLayers = 4;

  function drawWaves() {
    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#000814");
    bgGrad.addColorStop(1, "#001933");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle moving grid
    ctx.strokeStyle = "rgba(56,189,248,0.05)";
    ctx.lineWidth = 0.5;
    const spacing = 80;
    const offset = Math.sin(t / 600) * 12; // slower grid movement

    ctx.save();
    ctx.translate(offset, offset);
    for (let x = 0; x < width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // Flowing neon waves (slower)
    for (let i = 0; i < waveLayers; i++) {
      const hue = 180 + i * 10;
      const alpha = 0.08 + i * 0.05;
      const waveColor = `hsla(${hue},100%,70%,${alpha})`;
      const amplitude = 35 + i * 10;
      const frequency = 0.0025 + i * 0.0008;

      ctx.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const y = height / 2 + Math.sin(x * frequency + t / (80 - i * 8)) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 1.3;
      ctx.shadowBlur = 6 + i * 2;
      ctx.shadowColor = `hsla(${hue},100%,60%,0.4)`;
      ctx.stroke();
    }

    // Gentle pulsing glow overlay (slower)
    const pulseIntensity = 0.025 + Math.sin(t / 300) * 0.015;
    const glowGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, height / 1.5);
    glowGrad.addColorStop(0, `rgba(56,189,248,${pulseIntensity})`);
    glowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, height);

    t += 0.5; // 🐢 slowed down motion
    requestAnimationFrame(drawWaves);
  }

  drawWaves();

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  Object.assign(canvas.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: "-1",
    pointerEvents: "none",
    background: "radial-gradient(circle at 50% 50%, #001933, #000c1f)"
  });
});
