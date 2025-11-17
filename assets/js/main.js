// =============================================================
// 🔥 ALGONIMO MAIN SCRIPT — FINAL UPDATED VERSION
// Smooth animations + User System + Firebase + Dynamic Navbar
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  initScrollReveal();
  initParticleField();
  initParallaxGlow();
  initEnergyTrails();
  initUserNavbar(); // ✅ NEW — Update navbar with user info
});

/* ============================================================
   🚀 1. SCROLL REVEAL
============================================================ */
function initScrollReveal() {
  const revealEls = document.querySelectorAll(".reveal");
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealEls.forEach(el => observer.observe(el));
}

/* ============================================================
   🌌 2. PARTICLE FIELD
============================================================ */
function initParticleField() {
  const container = document.querySelector(".particles");
  if (!container) return;

  const numParticles = 45;

  for (let i = 0; i < numParticles; i++) {
    const p = document.createElement("span");
    p.classList.add("particle");

    const size = Math.random() * 3 + 2;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const depth = Math.random() * 0.8 + 0.2;
    const duration = 20 + Math.random() * 15;
    const delay = Math.random() * 12;

    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${posX}vw`;
    p.style.top = `${posY}vh`;
    p.style.animationDelay = `${delay}s`;
    p.style.animationDuration = `${duration}s`;
    p.style.opacity = depth;
    p.style.filter = `blur(${Math.random() * 1.5}px)`;
    p.style.background = `rgba(56,189,248, ${Math.random() * 0.3 + 0.2})`;

    p.style.setProperty("--float-speed", `${depth * 15 + 10}s`);

    container.appendChild(p);
  }
}

/* ============================================================
   ✨ 3. PARALLAX CURSOR GLOW
============================================================ */
function initParallaxGlow() {
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  document.body.appendChild(glow);

  let x = 0, y = 0;
  let targetX = 0, targetY = 0;

  window.addEventListener("mousemove", e => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  function animate() {
    x += (targetX - x) * 0.08;
    y += (targetY - y) * 0.08;
    glow.style.transform = `translate(${x - 75}px, ${y - 75}px)`;
    requestAnimationFrame(animate);
  }

  animate();
}

/* ============================================================
   ⚡ 4. ENERGY TRAILS
============================================================ */
function initEnergyTrails() {
  const container = document.querySelector(".particles");
  if (!container) return;

  const numTrails = 8;
  for (let i = 0; i < numTrails; i++) {
    const trail = document.createElement("div");
    trail.classList.add("energy-trail");

    const left = Math.random() * 100;
    const delay = Math.random() * 10;
    const duration = 8 + Math.random() * 6;

    trail.style.left = `${left}vw`;
    trail.style.animationDelay = `${delay}s`;
    trail.style.animationDuration = `${duration}s`;

    container.appendChild(trail);
  }
}

/* ============================================================
   🧭 5. SMOOTH SCROLLING
============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      e.preventDefault();
      window.scrollTo({
        top: target.offsetTop - 60,
        behavior: "smooth"
      });
    }
  });
});

/* ============================================================
   🎬 6. PAGE FADE-IN
============================================================ */
window.addEventListener("load", () => {
  document.body.style.opacity = 0;
  document.body.style.transition = "opacity 1.2s ease";
  setTimeout(() => (document.body.style.opacity = 1), 150);
});

/* ============================================================
   👤 7. USER NAVBAR HANDLER (NEW)
============================================================ */
function initUserNavbar() {
  const isLoggedIn = localStorage.getItem("alg_user_logged_in") === "true";
  const user = JSON.parse(localStorage.getItem("alg_user_data") || "{}");

  const profileMenu = document.getElementById("profileMenu");
  const navAvatar = document.getElementById("profileImg");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");

  if (isLoggedIn) {
    // Show profile menu
    if (profileMenu) profileMenu.style.display = "flex";

    // Load user avatar
    if (navAvatar) {
      navAvatar.innerHTML = `
        <img src="${user.avatar || "../all imgs/main/bot.png"}" class="avatar-img" />
      `;
    }

    // Hide guest buttons
    if (loginBtn) loginBtn.style.display = "none";
    if (signupBtn) signupBtn.style.display = "none";
  } else {
    // Not logged in → hide profile menu
    if (profileMenu) profileMenu.style.display = "none";

    // Show guest buttons
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (signupBtn) signupBtn.style.display = "inline-block";
  }
}

/* ============================================================
   🔥 8. FIREBASE INITIALIZATION
============================================================ */
(async () => {
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js");
  const { getAnalytics } = await import("https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js");

  const firebaseConfig = {
    apiKey: "AIzaSyBJHDQ0QzPl5pFV8uP_6fHNIbL2TBmd4IY",
    authDomain: "algonimo.firebaseapp.com",
    projectId: "algonimo",
    storageBucket: "algonimo.firebasestorage.app",
    messagingSenderId: "945219788815",
    appId: "1:945219788815:web:e3038de74f66aa58ea437a",
    measurementId: "G-R32HFZK10R"
  };

  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

  console.log("🔥 Firebase initialized:", app.name);
})();
/* ============================================================
   🧭 DROPDOWN TOGGLE HANDLER (FIX)
============================================================ */
document.addEventListener("click", (e) => {
  const menu = document.getElementById("profileMenu");
  const dropdown = menu?.querySelector(".profile-dropdown");

  if (!menu || !dropdown) return;

  // If clicking avatar → toggle dropdown
  if (e.target.closest("#profileImg")) {
    menu.classList.toggle("active");
    return;
  }

  // If clicking outside → close dropdown
  if (!e.target.closest("#profileMenu")) {
    menu.classList.remove("active");
  }
});
