/* ============================================================
   ALGONIMO – signup.js (lightweight client logic only)
   Uses AlgAuth (auth.js) for all Authentication & DB operations
   Hardened: safe checks, disable buttons during requests, consistent UX
   Updated: signup -> show login; login/google -> redirect to main.html
============================================================ */

console.log("%c[ALGONIMO] signup.js loaded", "color:#38bdf8");

// small helper to safely query
const $ = (sel) => document.querySelector(sel);

// UI Toggle (Login ↔ Signup)
const container = $(".container");
$(".register-btn")?.addEventListener("click", () => container?.classList?.add("active"));
$(".login-btn")?.addEventListener("click", () => container?.classList?.remove("active"));

// Guard: ensure AlgAuth exists
if (typeof window.AlgAuth === "undefined") {
  console.warn("[ALGONIMO] AlgAuth not found. signup.js will not wire auth actions.");
}

// helper to disable/enable a button
function setDisabled(btn, disabled = true) {
  if (!btn) return;
  btn.disabled = disabled;
  if (disabled) btn.classList?.add("disabled");
  else btn.classList?.remove("disabled");
}

// Utility to switch UI to login view (used after signup)
function showLoginViewAndFocus() {
  try {
    const containerEl = document.querySelector(".container");
    if (containerEl && containerEl.classList.contains("active")) {
      containerEl.classList.remove("active"); // show login
    }
    const loginEmail = document.getElementById("loginEmail");
    if (loginEmail) loginEmail.focus();
  } catch (e) {
    console.warn("showLoginViewAndFocus error", e);
  }
}

// Email Signup
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!window.AlgAuth) return console.warn("AlgAuth missing");

    const usernameEl = document.getElementById("regUsername");
    const emailEl = document.getElementById("regEmail");
    const passwordEl = document.getElementById("regPassword");
    const confirmEl = document.getElementById("regConfirmPassword");
    const submitBtn = registerForm.querySelector('button[type="submit"]');

    const username = usernameEl?.value.trim() || "";
    const email = emailEl?.value.trim() || "";
    const password = passwordEl?.value || "";
    const confirm = confirmEl?.value || "";

    if (username.length < 3) {
      return window.AlgAuth.showPopup?.("Username must be at least 3 characters", "error") ?? alert("Username must be at least 3 characters");
    }

    if (password.length < 6) {
      return window.AlgAuth.showPopup?.("Password must be at least 6 characters", "error") ?? alert("Password must be at least 6 characters");
    }

    if (password !== confirm) {
      return window.AlgAuth.showPopup?.("Passwords do not match", "error") ?? alert("Passwords do not match");
    }

    try {
      setDisabled(submitBtn, true);
      await window.AlgAuth.signUpEmail({ username, email, password });

      // auth.signUpEmail now shows a toast; switch to login UI instead of redirecting
      window.AlgAuth.showPopup?.("🎉 Account created! Please login.", "success");
      showLoginViewAndFocus();
    } catch (err) {
      console.error("signup error", err);
      window.AlgAuth.showPopup?.(err?.message || "Signup failed!", "error");
    } finally {
      setDisabled(submitBtn, false);
    }
  });
}

// Email Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!window.AlgAuth) return console.warn("AlgAuth missing");

    const email = document.getElementById("loginEmail")?.value.trim() || "";
    const password = document.getElementById("loginPassword")?.value || "";
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      return window.AlgAuth.showPopup?.("Email and password required", "error");
    }

    try {
      setDisabled(submitBtn, true);
      await window.AlgAuth.signInEmail({ email, password });
      window.AlgAuth.showPopup?.("🚀 Login successful!", "success");
      // redirect to main.html (as requested)
      setTimeout(() => (window.location.href = "main.html"), 700);
    } catch (err) {
      console.error("login error", err);
      window.AlgAuth.showPopup?.(err?.message || "Login failed!", "error");
    } finally {
      setDisabled(submitBtn, false);
    }
  });
}

// Google Login / Signup (use same handler, no duplicate listeners)
const wireGoogleBtn = (selector, message) => {
  const btn = document.getElementById(selector);
  if (!btn) return;
  btn.addEventListener("click", async () => {
    if (!window.AlgAuth) return console.warn("AlgAuth missing");
    try {
      setDisabled(btn, true);
      await window.AlgAuth.signInWithGoogle();
      window.AlgAuth.showPopup?.(message || "Google Login successful!", "success");
      // redirect to main.html after Google login
      setTimeout(() => (window.location.href = "main.html"), 700);
    } catch (err) {
      console.error("google auth error", err);
      window.AlgAuth.showPopup?.(err?.message || "Google sign-in failed!", "error");
    } finally {
      setDisabled(btn, false);
    }
  });
};

wireGoogleBtn("googleLoginBtn", "🔥 Google Login successful!");
wireGoogleBtn("googleSignupBtn", "🔥 Google Signup successful!");

// Forgot Password
const forgotBtn = document.getElementById("forgotPasswordBtn");
if (forgotBtn) {
  forgotBtn.addEventListener("click", async () => {
    if (!window.AlgAuth) return console.warn("AlgAuth missing");
    const email = prompt("Enter your email to reset password:");
    if (!email) return;
    try {
      await window.AlgAuth.sendResetEmail(email);
      // sendResetEmail already shows popup on success
    } catch (err) {
      console.error("reset error", err);
      window.AlgAuth.showPopup?.(err?.message || "Reset failed!", "error");
    }
  });
}
