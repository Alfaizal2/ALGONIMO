/* ============================================================
   ALGONIMO — SETTINGS PAGE (v9.1) — Hardened + AlgAuth-safe
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const DEFAULT_REDIRECT = "../pages/signup.html";

  // Helpers
  const safe = {
    getAlg() { return window.AlgAuth || null; },
    getLocalUser() {
      try {
        if (window.AlgAuth && typeof window.AlgAuth.getLocalUser === "function") return window.AlgAuth.getLocalUser() || {};
        return JSON.parse(localStorage.getItem("alg_user_data") || "{}");
      } catch (e) { return {}; }
    },
    setLocalUser(obj) {
      try {
        if (window.AlgAuth && typeof window.AlgAuth.setLocalUser === "function") return window.AlgAuth.setLocalUser(obj);
        localStorage.setItem("alg_user_data", JSON.stringify(obj));
      } catch (e) { console.warn("setLocalUser failed", e); }
    },
    showPopup(msg, type = "success") {
      try {
        const host = document.getElementById("popupNotification");
        const message = document.getElementById("popupMessage");
        if (host && message) {
          message.textContent = msg;
          host.dataset.type = type;
          host.classList.add("show");
          setTimeout(() => host.classList.remove("show"), 2400);
          return;
        }
      } catch (e) {}
      // fallback
      try { console.info("popup:", type, msg); } catch {}
    },
  };

  /* ---------------------------
     REQUIRE LOGIN (client-side guard)
     Prefer AlgAuth.isLoggedInLocal() when available
  ----------------------------*/
  try {
    const Alg = safe.getAlg();
    const logged = (Alg && typeof Alg.isLoggedInLocal === "function") ? Alg.isLoggedInLocal() : (localStorage.getItem("alg_user_logged_in") === "true");
    if (!logged) {
      try { window.location.href = DEFAULT_REDIRECT; } catch (e) {}
      return;
    }
  } catch (e) {
    try { if (localStorage.getItem("alg_user_logged_in") !== "true") { window.location.href = DEFAULT_REDIRECT; return; } } catch {}
  }

  // Load user
  let user = safe.getLocalUser() || {};
  const uid = user.uid || "";

  // DOM query helpers (safe)
  const $ = (id) => document.getElementById(id);

  // Populate UI (if elements exist)
  try { if ($("setName")) $("setName").value = user.name || ""; } catch {}
  try { if ($("setEmail")) $("setEmail").value = user.email || ""; } catch {}
  try { if ($("toggleRequirePin")) $("toggleRequirePin").checked = (localStorage.getItem("alg_require_pin") === "true"); } catch {}

  /* ---------------------------
     SAVE ACCOUNT
  ----------------------------*/
  const saveBtn = $("saveAccount");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      try {
        // disable
        saveBtn.disabled = true;
        saveBtn.classList?.add("disabled");

        const nameEl = $("setName");
        const emailEl = $("setEmail");
        const pass1El = $("setPass");
        const pass2El = $("setPass2");

        const name = (nameEl?.value || "").trim();
        const email = (emailEl?.value || "").trim();
        const pass1 = (pass1El?.value || "").trim();
        const pass2 = (pass2El?.value || "").trim();

        if (!name) { safe.showPopup("Name cannot be empty", "error"); return; }
        const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRx.test(email)) { safe.showPopup("Invalid email", "error"); return; }

        // handle password local storage only (per your design)
        if (pass1 || pass2) {
          if (pass1 !== pass2) { safe.showPopup("Passwords do not match", "error"); return; }
          if (pass1.length < 6) { safe.showPopup("Password must be at least 6 characters", "error"); return; }
          try { localStorage.setItem("alg_user_password", pass1); } catch (e) { console.warn("storing password failed", e); }
        }

        // Try to update in Firebase via AlgAuth helpers if available
        try {
          const Alg = safe.getAlg();
          if (Alg && typeof Alg.ensureUserNode === "function") {
            await Alg.ensureUserNode(uid, name, email);
            if (typeof Alg.updateLastActive === "function") await Alg.updateLastActive(uid);
          }
        } catch (e) {
          console.warn("Remote update (ensureUserNode) failed, continuing with local update", e);
        }

        // Update local copy
        user = user || {};
        user.name = name;
        user.email = email;
        safe.setLocalUser(user);

        // Update Navbar/profile/dashboard/leaderboard UI where applicable
        try { if (typeof window.AlgAuth?.updateNavbarUserUI === "function") window.AlgAuth.updateNavbarUserUI(user); } catch (e) {}
        try { syncProfilePage(user); } catch (e) {}
        try { syncDashboard(user); } catch (e) {}
        try { syncLeaderboard(user); } catch (e) {}

        safe.showPopup("✅ Account updated!", "success");
      } catch (err) {
        console.error("saveAccount failed", err);
        safe.showPopup("Update failed", "error");
      } finally {
        // re-enable
        saveBtn.disabled = false;
        saveBtn.classList?.remove("disabled");
      }
    });
  }

  /* ---------------------------
     SAVE SECURITY
  ----------------------------*/
  const saveSecurityBtn = $("saveSecurity");
  if (saveSecurityBtn) {
    saveSecurityBtn.addEventListener("click", () => {
      try {
        const toggle = $("toggleRequirePin")?.checked === true;
        try { localStorage.setItem("alg_require_pin", toggle ? "true" : "false"); } catch (e) {}

        const pin1 = ($("setPin")?.value || "").trim();
        const pin2 = ($("setPin2")?.value || "").trim();

        if (pin1 || pin2) {
          if (pin1 !== pin2) return safe.showPopup("PIN does not match", "error");
          if (!/^\d{4,6}$/.test(pin1)) return safe.showPopup("PIN must be 4-6 digits", "error");
          try { localStorage.setItem("alg_user_pin", pin1); } catch (e) { console.warn("storing pin failed", e); }
        }

        safe.showPopup("🔐 Security settings saved", "success");
      } catch (e) {
        console.error("saveSecurity error", e);
        safe.showPopup("Failed to save security settings", "error");
      }
    });
  }

  /* ---------------------------
     LOGOUT
  ----------------------------*/
  const logoutAllBtn = $("logoutAll");
  if (logoutAllBtn) {
    logoutAllBtn.addEventListener("click", async () => {
      try {
        const Alg = safe.getAlg();
        if (Alg && typeof Alg.signOutUser === "function") {
          await Alg.signOutUser("../index.html");
          return;
        }
      } catch (e) {
        console.warn("AlgAuth.signOutUser failed", e);
      }
      // fallback
      try { localStorage.clear(); } catch (e) {}
      try { window.location.href = "../index.html"; } catch (e) {}
    });
  }

  /* ---------------------------
     DELETE ACCOUNT (LOCAL ONLY)
  ----------------------------*/
  const deleteBtn = $("deleteAccount");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      try {
        if (!confirm("Delete account on this device? This will not delete your Firebase account.")) return;

        const keys = [
          "alg_user_logged_in", "alg_user_data", "alg_user_pin",
          "alg_require_pin", "alg_xp", "alg_badges", "alg_user_last_login",
          "alg_badges_prev", "alg_user_password", "alg_user_prev_xp"
        ];
        try { keys.forEach(k => localStorage.removeItem(k)); } catch (e) { console.warn("local clear failed", e); }

        safe.showPopup("🗑 Account deleted (local)", "success");
        setTimeout(() => { try { window.location.href = "../index.html"; } catch (e) {} }, 900);
      } catch (err) {
        console.error("deleteAccount error", err);
        safe.showPopup("Account deletion failed", "error");
      }
    });
  }

  /* ---------------------------
     DROPDOWN FIX (profile menu)
  ----------------------------*/
  try {
    const menu = $("profileMenu");
    const avatar = $("profileImg");
    if (avatar && menu) {
      avatar.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("active");
      });
      document.addEventListener("click", (e) => {
        try {
          if (!menu.contains(e.target)) menu.classList.remove("active");
        } catch (ex) {}
      });
    }
  } catch (e) { console.warn("dropdown wiring failed", e); }

  /* ==========================================================
     UNIVERSAL SYNC FUNCTIONS (PROFILE / DASHBOARD / LEADERBOARD)
     These are intentionally defensive: they only update if the
     target elements exist on the current page.
  ===========================================================*/

  function syncProfilePage(u) {
    try {
      if (!u) return;
      const nameEl = $("userName");
      if (nameEl) nameEl.textContent = u.name || "";
      const emailEl = $("userEmail");
      if (emailEl) emailEl.textContent = u.email || "";
      const avatarEl = $("profileAvatar");
      if (avatarEl) {
        // keep avatar unchanged (default is enforced globally in auth.js)
        const img = avatarEl.querySelector("img");
        if (img) img.src = img.src || img.getAttribute("src") || "";
      }
      // badges / certs counts if present
      if ($("userBadgesCount")) $("userBadgesCount").textContent = (Array.isArray(u.badges) ? u.badges.length : (u.badges ? Number(u.badges) : 0));
      if ($("userCertCount")) $("userCertCount").textContent = (Array.isArray(u.certificates) ? u.certificates.length : (u.certificates ? Number(u.certificates) : 0));
    } catch (e) { console.warn("syncProfilePage failed", e); }
  }

  function syncDashboard(u) {
    try {
      if (!u) return;
      const n = $("dashName") || $("dashUserName");
      if (n) n.textContent = u.name || "";
      const e = $("dashUserEmail");
      if (e) e.textContent = u.email || "";
      const avatar = $("dashAvatar") || document.getElementById("profileImg");
      if (avatar && avatar.tagName === "IMG") {
        // leave src as-is; default avatar is enforced elsewhere
      }
      // xp/state
      if ($("coursesCount")) $("coursesCount").textContent = Array.isArray(u.courses) ? u.courses.length : (Number(u.courses) || 0);
      if ($("badgesCount")) $("badgesCount").textContent = (Array.isArray(u.badges) ? u.badges.length : (Number(u.badges) || 0));
    } catch (e) { console.warn("syncDashboard failed", e); }
  }

  function syncLeaderboard(u) {
    try {
      if (!u) return;
      const items = document.querySelectorAll(".lb-user-name");
      if (!items) return;
      items.forEach(el => {
        try {
          // if elements have data-uid attribute, match it
          if (el.dataset && el.dataset.uid && u.uid && el.dataset.uid === u.uid) {
            el.textContent = u.name || "";
          } else {
            // fallback: if text equals old name blank or placeholder, prefer to set only if empty
            if (!el.textContent || el.textContent.trim() === "") el.textContent = u.name || "";
          }
        } catch (e) {}
      });
    } catch (e) { console.warn("syncLeaderboard failed", e); }
  }

  // final: ensure UI is synced immediately on load
  try { syncProfilePage(user); } catch {}
  try { syncDashboard(user); } catch {}
  try { syncLeaderboard(user); } catch {}

}); // DOMContentLoaded












