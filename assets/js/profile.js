/* profile.js — cleaned version
   Enforces default avatar, hydrates profile from AlgAuth/localStorage,
   wires course progress using course-tracker (dynamic import).
   NOTE: All XP/points, Level, Streak and any dashboard/leaderboard references removed.
*/

document.addEventListener("DOMContentLoaded", async () => {
  const DEFAULT_AVATAR = "../all imgs/main/bot.png";
  const TRACKER_PATH = "../assets/js/course-tracker.js"; // adjust if needed

  // safe helpers
  const safeGetLocalUser = () => {
    try {
      if (window.AlgAuth && typeof window.AlgAuth.getLocalUser === "function") return window.AlgAuth.getLocalUser() || {};
      return JSON.parse(localStorage.getItem("alg_user_data") || "{}");
    } catch (e) { return {}; }
  };

  const safeSetLocalUser = (obj = {}) => {
    try {
      const safe = { ...obj, avatar: DEFAULT_AVATAR };
      if (window.AlgAuth && typeof window.AlgAuth.setLocalUser === "function") {
        window.AlgAuth.setLocalUser(safe);
        window.AlgAuth.setLoggedIn?.(true);
      } else {
        localStorage.setItem("alg_user_data", JSON.stringify(safe));
        localStorage.setItem("alg_user_logged_in", "true");
      }
      // NOTE: intentionally NOT writing legacy alg_xp (XP removed)
    } catch (e) {
      console.warn("safeSetLocalUser failed", e);
    }
  };

  const setText = (id, value) => {
    try {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = value ?? "";
    } catch (e) {}
  };

  const setHTML = (id, html) => {
    try {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = html;
    } catch (e) {}
  };

  // require logged-in (fast check)
  try {
    const logged = localStorage.getItem("alg_user_logged_in");
    if (logged !== "true" && !(window.AlgAuth && window.AlgAuth.auth && window.AlgAuth.auth.currentUser)) {
      // allow auth listener to populate if available; if not, redirect
      if (window.AlgAuth && window.AlgAuth.auth) {
        // wait briefly for auth state to resolve (non-blocking)
        try {
          const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js");
          const authUser = await new Promise((resolve) => {
            const unsub = onAuthStateChanged(window.AlgAuth.auth, (u) => { try { unsub(); } catch {} resolve(u); });
            setTimeout(() => { try { unsub(); } catch {} resolve(null); }, 1400);
          });
          if (!authUser) { window.location.href = "../pages/signup.html"; return; }
        } catch (e) {
          window.location.href = "../pages/signup.html"; return;
        }
      } else {
        window.location.href = "../pages/signup.html"; return;
      }
    }
  } catch (e) {
    console.warn("auth quick-check failed", e);
  }

  // load local/remote user data
  let local = safeGetLocalUser();
  let uid = local.uid || null;

  // try to obtain uid from AlgAuth if available
  try {
    if ((!uid) && window.AlgAuth && window.AlgAuth.auth && window.AlgAuth.auth.currentUser) {
      uid = window.AlgAuth.auth.currentUser.uid || uid;
    }
    // one-shot onAuth fallback
    if (!uid && window.AlgAuth && window.AlgAuth.auth) {
      try {
        const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js");
        const authUser = await new Promise((resolve) => {
          const unsub = onAuthStateChanged(window.AlgAuth.auth, (u) => { try { unsub(); } catch {} resolve(u); });
          setTimeout(() => { try { unsub(); } catch {} resolve(null); }, 1200);
        });
        if (authUser) uid = authUser.uid;
      } catch (e) { /* ignore */ }
    }
  } catch (e) { console.warn("uid detection failed", e); }

  if (!uid) {
    // final fallback: redirect to signup
    try { window.location.href = "../pages/signup.html"; } catch (e) {}
    return;
  }

  // try to ensure remote node (if AlgAuth available)
  let userNode = {};
  try {
    if (window.AlgAuth && typeof window.AlgAuth.ensureUserNode === "function") {
      userNode = await window.AlgAuth.ensureUserNode(uid, local.name || local.displayName || "", local.email || "") || {};
    } else {
      userNode = local || {};
    }
  } catch (e) {
    console.warn("ensureUserNode fallback", e);
    userNode = local || {};
  }

  // merge user (remote overrides local), but DO NOT trust remote avatar
  const user = {
    name: userNode.name || local.name || "",
    email: userNode.email || local.email || "",
    avatar: DEFAULT_AVATAR,
    joinDate: userNode.joinDate || local.joinDate || "",
    lastActive: userNode.lastActive || userNode.lastLogin || local.lastActive || local.lastLogin || "",
    // XP/streak/level removed
    badges: Array.isArray(userNode.badges) ? userNode.badges : (Array.isArray(local.badges) ? local.badges : []),
    certificates: Array.isArray(userNode.certificates) ? userNode.certificates : (Array.isArray(local.certificates) ? local.certificates : []),
    courses: userNode.courses || local.courses || []
  };

  // persist merged local user
  safeSetLocalUser(user);

  // populate DOM
  setText("userName", user.name);
  setText("userEmail", user.email);
  setText("joinDate", user.joinDate);
  setText("lastActive", user.lastActive);

  // Removed: userXP, userStreak, userLevel, profileXPFill updates

  // update badge/cert/course counts (UI elements still present)
  setText("userBadgesCount", String((user.badges || []).length));
  setText("badgesCountGrid", String((user.badges || []).length));
  setText("userCertCount", String((user.certificates || []).length));
  setText("certCountGrid", String((user.certificates || []).length));
  setText("coursesCount", String((user.courses || []).length));

  // avatar nodes (enforced default)
  try {
    const profileAvatar = document.getElementById("profileAvatar");
    if (profileAvatar) profileAvatar.innerHTML = `<img src="${DEFAULT_AVATAR}" class="avatar-img" alt="User Avatar" />`;
  } catch (e) {}
  try {
    const navAvatar = document.getElementById("profileImg");
    if (navAvatar) navAvatar.innerHTML = `<img src="${DEFAULT_AVATAR}" class="avatar-img" alt="User Avatar" />`;
  } catch (e) {}

  // show profile menu and hide guest controls
  try {
    const profileMenu = document.getElementById("profileMenu");
    if (profileMenu) profileMenu.style.display = "flex";
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    if (loginBtn) loginBtn.style.display = "none";
    if (signupBtn) signupBtn.style.display = "none";
  } catch (e) {}

  // render badges preview
  try {
    const badgePreview = document.getElementById("badgePreview");
    if (badgePreview) {
      badgePreview.innerHTML = "";
      const badgesArr = Array.isArray(user.badges) ? user.badges : [];
      if (badgesArr.length === 0) {
        const p = document.createElement("p");
        p.className = "muted";
        p.textContent = "No badges earned yet.";
        badgePreview.appendChild(p);
      } else {
        badgesArr.forEach((b) => {
          const el = document.createElement("div");
          el.className = "badge-pill";
          el.textContent = b;
          badgePreview.appendChild(el);
        });
      }
    }
  } catch (e) {}

  // security status
  try {
    const secStatus = document.getElementById("securityStatus");
    if (secStatus) {
      const hasPin = localStorage.getItem("alg_require_pin") === "true";
      if (hasPin) {
        secStatus.textContent = "PIN Enabled";
        secStatus.classList.add("secure");
        secStatus.classList.remove("warning");
      } else {
        secStatus.textContent = "No PIN Set";
        secStatus.classList.remove("secure");
        secStatus.classList.add("warning");
      }
    }
  } catch (e) {}

  /* -------------------------
     Course progress wiring (dynamic import)
     - uses CourseTracker.getCourseProgress() and subscribeToCourse()
  -------------------------*/
  try {
    // dynamic import so this file can be used as a plain script tag (non-module)
    const CourseTrackerModule = await import(TRACKER_PATH).catch((err) => {
      console.warn("CourseTracker import failed", err);
      return null;
    });
    const CourseTracker = CourseTrackerModule ? (CourseTrackerModule.default || CourseTrackerModule) : null;
    if (!CourseTracker) return;

    // Example courses metadata — update to match your real syllabus
    const coursesMeta = [
      { id: "c-course", title: "C Programming", lessons: 60 },
      { id: "js-course", title: "JavaScript", lessons: 45 }
    ];

    const coursesGrid = document.getElementById("coursesGrid");
    if (!coursesGrid) return;

    // Render quick course cards (async per course)
    coursesGrid.innerHTML = "";
    for (const c of coursesMeta) {
      const { completedCount = 0, totalLessons = c.lessons, progress = 0 } =
        (await CourseTracker.getCourseProgress(c.id, c.lessons)) || { completedCount: 0, totalLessons: c.lessons, progress: 0 };

      const percent = (progress === null || typeof progress === "undefined")
        ? Math.round(((completedCount || 0) / (c.lessons || 1)) * 100)
        : progress;

      const card = document.createElement("div");
      card.className = "course-card";
      card.innerHTML = `
        <h3>${c.title}</h3>
        <p>${completedCount} / ${c.lessons || "?"} lessons completed</p>
        <div class="progress-bar" aria-hidden="true"><div class="fill" style="width:${percent || 0}%"></div></div>
      `;
      coursesGrid.appendChild(card);
    }

    // update coursesCount on profile (simple heuristic)
    try {
      document.getElementById("coursesCount") && (document.getElementById("coursesCount").textContent = String(coursesMeta.length));
    } catch(e){}

    // subscribe to c-course changes as an example to update certCountGrid or other UI quickly
    try {
      const unsub = CourseTracker.subscribeToCourse(uid, "c-course", (data) => {
        try {
          const completedCount = Object.values(data || {}).filter(x => x && x.status === "completed").length;
          const certEl = document.getElementById("certCountGrid");
          if (certEl) certEl.textContent = String(completedCount);
        } catch (e) { console.warn("subscribeToCourse callback error", e); }
      });
      // store unsubscribe for later removal if appropriate
      window._alg_profile_course_unsub = unsub;
    } catch (e) {
      console.warn("subscribeToCourse failed", e);
    }

  } catch (err) {
    console.warn("Course progress wiring failed", err);
  }

}); // DOMContentLoaded end

/* ============================
   NAVBAR DROPDOWN — UNIVERSAL FIX
   (keeps behavior but is defensive)
   ============================ */
document.addEventListener("click", (e) => {
  try {
    const menu = document.getElementById("profileMenu");
    if (!menu) return;
    const profileImgEl = document.getElementById("profileImg");

    if (profileImgEl && e.target && typeof e.target.closest === "function" && e.target.closest("#profileImg")) {
      menu.classList.toggle("active");
      return;
    }

    if (!e.target || typeof e.target.closest !== "function" || !e.target.closest("#profileMenu")) {
      menu.classList.remove("active");
    }
  } catch (err) {
    console.warn("Navbar dropdown handler error", err);
  }
});
