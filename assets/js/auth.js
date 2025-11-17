/* ============================================================
   ALGONIMO — auth.no-xp.js (Core Authentication + Realtime Sync)
   v4.2.1 — DEFAULT AVATAR enforced everywhere
   - All XP / point-based fields and UI removed
   - Leaderboard and dashboard-specific UI/code removed
   - Trace events still available
   Use: <script type="module" src=".../auth.no-xp.js"></script>
============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {
  getDatabase,
  ref as dbRef,
  set as dbSet,
  update as dbUpdate,
  get as dbGet,
  push as dbPush,
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

/* -------------------------
   CONFIG
-------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyBJHDQ0QzPl5pFV8uP_6fHNIbL2TBmd4IY",
  authDomain: "algonimo.firebaseapp.com",
  projectId: "algonimo",
  storageBucket: "algonimo.appspot.com",
  messagingSenderId: "945219788815",
  appId: "1:945219788815:web:e3038de74f66aa58ea437a",
  measurementId: "G-R32HFZK10R",
  databaseURL: "https://algonimo-default-rtdb.firebaseio.com/"
};

/* -------------------------
   INIT
-------------------------- */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/* -------------------------
   DEFAULTS
-------------------------- */
const DEFAULT_AVATAR = "../all imgs/main/bot.png";

/* -------------------------
   localStorage helpers
-------------------------- */
function setLocalUser(obj = {}) {
  try {
    // ensure avatar is the default before storing
    const safe = { ...obj, avatar: DEFAULT_AVATAR };
    localStorage.setItem("alg_user_data", JSON.stringify(safe));
  } catch (err) {
    console.warn("setLocalUser:", err);
  }
}
function getLocalUser() {
  try {
    return JSON.parse(localStorage.getItem("alg_user_data") || "{}");
  } catch (err) {
    console.warn("getLocalUser parse failed:", err);
    return {};
  }
}
function setLoggedIn(val = false) {
  try {
    localStorage.setItem("alg_user_logged_in", val ? "true" : "false");
  } catch (err) {
    console.warn("setLoggedIn:", err);
  }
}
function isLoggedInLocal() {
  try {
    return localStorage.getItem("alg_user_logged_in") === "true";
  } catch {
    return false;
  }
}

/* -------------------------
   UI helper: popup
-------------------------- */
function showPopup(message, type = "success") {
  try {
    const popup = document.getElementById("popupNotification");
    const msg = document.getElementById("popupMessage");
    if (popup && msg) {
      msg.textContent = message;
      popup.classList.add("show");
      popup.dataset.type = type;
      setTimeout(() => popup.classList.remove("show"), 2800);
      return;
    }
  } catch (e) {
    // fallthrough to console log
  }
  try { console.info("[ALGONIMO] popup:", type, message); } catch {}
}

/* -------------------------
   Dates
-------------------------- */
const nowISO = () => new Date().toISOString();
const nowLocale = () => new Date().toLocaleString();

/* -------------------------
   Ensure user node exists
   (removed xp/streak fields)
-------------------------- */
async function ensureUserNode(uid, name = "", email = "") {
  if (!uid) return;
  const userRef = dbRef(db, `users/${uid}`);
  try {
    const snap = await dbGet(userRef);
    if (!snap.exists()) {
      const node = {
        name: name || "",
        email: email || "",
        avatar: DEFAULT_AVATAR,
        joinDate: nowLocale(),
        lastLogin: nowLocale(),
        badges: [],
        progress: {},
        achievements: [],
      };
      try {
        await dbSet(userRef, node);
      } catch (err) {
        console.warn("ensureUserNode: write failed", err);
      }
      return node;
    }
    // existing node: normalize keys, enforce DEFAULT_AVATAR and sensible defaults
    const existing = snap.val() || {};
    const patch = {};
    if (existing.avatar !== DEFAULT_AVATAR) patch.avatar = DEFAULT_AVATAR;
    if (!existing.name && name) patch.name = name; // set name only if provided
    if (Object.keys(patch).length) {
      try { await dbUpdate(userRef, patch); } catch (e) { /* best-effort */ }
      Object.assign(existing, patch);
    } else {
      existing.avatar = DEFAULT_AVATAR;
    }
    return existing;
  } catch (err) {
    console.warn("ensureUserNode failed:", err);
    return {
      name: name || "",
      email: email || "",
      avatar: DEFAULT_AVATAR,
      joinDate: nowLocale(),
      lastLogin: nowLocale(),
      badges: [], progress: {}, achievements: []
    };
  }
}

/* -------------------------
   Update lastActive / lastLogin
-------------------------- */
async function updateLastActive(uid) {
  if (!uid) return;
  const userRef = dbRef(db, `users/${uid}`);
  try {
    // Do not alter avatar here
    await dbUpdate(userRef, { lastLogin: nowLocale(), lastActive: nowISO() });
  } catch (err) {
    console.warn("updateLastActive failed", err);
  }
}

/* -------------------------
   Write trace event helper
-------------------------- */
async function recordTrace(uid, type, payload = {}) {
  if (!uid) return;
  try {
    const traceRef = dbRef(db, `traces/${uid}`);
    const node = dbPush(traceRef);
    await dbSet(node, { ts: nowISO(), type, payload });
  } catch (err) {
    console.warn("recordTrace failed", err);
  }
}

/* -------------------------
   Small UI refresh helper (profile-focused)
   All xp-related UI updates removed.
-------------------------- */
function refreshUI(local = null) {
  try {
    const u = local || getLocalUser();

    // profile avatar enforcement
    const profileAvatar = document.getElementById("profileAvatar");
    if (profileAvatar) {
      profileAvatar.innerHTML = `<img src="${DEFAULT_AVATAR}" class="avatar-img" alt="Profile avatar" />`;
    }

    // profile name
    const dashName = document.getElementById("dashName");
    if (dashName && u.name) dashName.textContent = u.name;
  } catch (e) {
    // never throw from UI refresh
    console.warn("refreshUI failed", e);
  }
}

/* -------------------------
   Hydrate local from firebase user + DB
   (no xp/streak fields)
-------------------------- */
async function hydrateLocalFromFirebase(firebaseUser) {
  if (!firebaseUser) return;
  const uid = firebaseUser.uid;
  const email = firebaseUser.email || "";
  const name = firebaseUser.displayName || (getLocalUser && getLocalUser().name) || "";

  const node = await ensureUserNode(uid, name, email);

  const merged = {
    name: node?.name || name || "",
    email: email,
    avatar: DEFAULT_AVATAR,
    joinDate: node?.joinDate || nowLocale(),
    lastLogin: node?.lastLogin || nowLocale(),
    badges: Array.isArray(node?.badges) ? node.badges : [],
    uid,
  };

  try {
    setLocalUser(merged);
    setLoggedIn(true);
  } catch (e) {
    console.warn("hydrateLocalFromFirebase: setLocalUser failed", e);
  }

  // async update
  updateLastActive(uid).catch(() => {});
  updateNavbarUserUI(merged);
  // refresh page UI quickly
  refreshUI(merged);

  return merged;
}

/* -------------------------
   Navbar UI sync
-------------------------- */
function updateNavbarUserUI(userData = {}) {
  const profileMenu = document.getElementById("profileMenu");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const profileImg = document.getElementById("profileImg");

  try {
    if (profileMenu) profileMenu.style.display = "none";
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (signupBtn) signupBtn.style.display = "inline-block";

    if (userData && Object.keys(userData).length) {
      if (profileMenu) profileMenu.style.display = "flex";
      if (loginBtn) loginBtn.style.display = "none";
      if (signupBtn) signupBtn.style.display = "none";

      if (profileImg) {
        const titleName = userData.name || "";
        // always display DEFAULT_AVATAR
        profileImg.innerHTML = `<img src="${DEFAULT_AVATAR}" alt="${titleName}" class="avatar-img" />`;
        profileImg.title = titleName ? `Welcome, ${titleName}` : "Welcome";
      }
    }
  } catch (err) {
    console.warn("updateNavbarUserUI error:", err);
  }
}

/* -------------------------
   Default PIN fallback
-------------------------- */
try {
  if (localStorage.getItem("alg_require_pin") === null) {
    localStorage.setItem("alg_require_pin", "false");
  }
} catch (e) { /* ignore */ }

/* -------------------------
   Sign up (email + password)
   Redirects user to main.html after successful signup
-------------------------- */
async function signUpEmail({ username, email, password }) {
  if (!username || !email || !password) {
    throw new Error("Missing signup fields");
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    try {
      await updateProfile(user, { displayName: username, photoURL: DEFAULT_AVATAR });
    } catch (err) {
      console.warn("updateProfile failed", err);
    }

    await ensureUserNode(user.uid, username, email);
    const local = await hydrateLocalFromFirebase(user);

    try { recordTrace(user.uid, "signup", { method: "email", email }); } catch (e) {}

    // Notify then redirect to main.html (consistent with other sign-in flows)
    showPopup("✅ Signup successful! Redirecting...", "success");

    try {
      const container = document.querySelector(".container");
      if (container && container.classList.contains("active")) container.classList.remove("active");
    } catch (e) {}

    try { setTimeout(() => { window.location.href = "main.html"; }, 700); } catch (e) {}

    return local;
  } catch (err) {
    showPopup(err?.message || "Signup failed.", "error");
    throw err;
  }
}

/* -------------------------
   Sign in (email + password)
-------------------------- */
async function signInEmail({ email, password }) {
  if (!email || !password) throw new Error("Missing credentials");
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    await updateLastActive(user.uid);
    const local = await hydrateLocalFromFirebase(user);
    try { recordTrace(user.uid, "login", { method: "email", email }); } catch (e) {}
    showPopup("✅ Login successful!", "success");

    try { setTimeout(() => { window.location.href = "main.html"; }, 700); } catch (e) {}

    return local;
  } catch (err) {
    showPopup(err?.message || "Login failed.", "error");
    throw err;
  }
}

/* -------------------------
   Google sign-in
-------------------------- */
const googleProvider = new GoogleAuthProvider();

async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    await ensureUserNode(user.uid, user.displayName || "", user.email || "");
    await updateLastActive(user.uid);
    const local = await hydrateLocalFromFirebase(user);

    try { recordTrace(user.uid, "google_signin", { email: user.email }); } catch (e) {}

    showPopup("✅ Google sign-in successful!", "success");

    try { setTimeout(() => { window.location.href = "main.html"; }, 700); } catch (e) {}

    return local;
  } catch (err) {
    showPopup(err?.message || "Google sign-in failed.", "error");
    throw err;
  }
}

/* -------------------------
   Forgot password
-------------------------- */
async function sendResetEmail(email) {
  if (!email) throw new Error("Email required");
  try {
    await sendPasswordResetEmail(auth, email);
    showPopup("📩 Reset link sent to your email.", "success");
  } catch (err) {
    showPopup(err?.message || "Reset failed.", "error");
    throw err;
  }
}

/* -------------------------
   Sign out
-------------------------- */
async function signOutUser(redirect = "../index.html") {
  try {
    try {
      const local = getLocalUser();
      if (local && local.uid) recordTrace(local.uid, "signout", {});
    } catch (e) {}
    await fbSignOut(auth);
  } catch (err) {
    console.warn("signOut failed", err);
  } finally {
    try {
      localStorage.removeItem("alg_user_data");
      localStorage.removeItem("alg_user_logged_in");
    } catch (e) {}
    showPopup("✅ Logged out!", "success");
    setTimeout(() => { if (redirect) window.location.href = redirect; }, 600);
  }
}

/* -------------------------
   Realtime onAuth listener
-------------------------- */
let _authListenerRegistered = false;
function registerAuthListenerOnce() {
  if (_authListenerRegistered) return;
  _authListenerRegistered = true;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        await hydrateLocalFromFirebase(user);
      } catch (err) {
        console.warn("hydrateLocalFromFirebase failed", err);
      }
    } else {
      try {
        updateNavbarUserUI({});
        localStorage.removeItem("alg_user_data");
        localStorage.removeItem("alg_user_logged_in");
      } catch (e) {}
    }
  });
}
registerAuthListenerOnce();

/* -------------------------
   Protect pages (dashboard/leaderboard references removed)
   Usage: protectPages(["profile.html","settings.html"])
-------------------------- */
function protectPages(pages = ["profile.html", "settings.html"]) {
  try {
    const url = window.location.href;
    if (!pages.some((p) => url.includes(p))) return;
    if (auth.currentUser) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      try { unsub(); } catch (e) {}
      if (!user) {
        try { window.location.href = "../pages/signup.html"; } catch (e) {}
      }
    });
  } catch (err) {
    console.warn("protectPages error", err);
  }
}

/* -------------------------
   Expose API + compatibility globals
-------------------------- */
const AlgAuth = {
  auth,
  db,
  DEFAULT_AVATAR,
  signUpEmail,
  signInEmail,
  signInWithGoogle,
  signOutUser,
  sendResetEmail,
  ensureUserNode,
  hydrateLocalFromFirebase,
  updateLastActive,
  setLocalUser,
  getLocalUser,
  setLoggedIn,
  isLoggedInLocal,
  protectPages,
  updateNavbarUserUI,
  recordTrace,
  showPopup,
  refreshUI,
};

window.AlgAuth = AlgAuth;
export default AlgAuth;

/* -------------------------
   Auto-run: quick navbar update + protect (dashboard/leaderboard removed)
-------------------------- */
try {
  const local = getLocalUser();
  if (local && Object.keys(local).length) {
    updateNavbarUserUI(local);
    refreshUI(local);
  }
  protectPages();
} catch (err) {
  console.warn("auth.no-xp.js init warning", err);
}
