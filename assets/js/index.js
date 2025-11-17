// === Initialize Particles.js with Enhanced Visuals ===
document.addEventListener("DOMContentLoaded", () => {
  if (typeof particlesJS !== "undefined" && document.getElementById("particles-js")) {
    particlesJS("particles-js", {
      particles: {
        number: { value: 90, density: { enable: true, value_area: 900 } },
        color: { value: ["#00ff88", "#00d4ff", "#0099ff"] },
        shape: { type: "circle" },
        opacity: {
          value: 0.5,
          random: true,
          anim: { enable: true, speed: 0.8, opacity_min: 0.2 },
        },
        size: {
          value: 3,
          random: true,
          anim: { enable: true, speed: 2, size_min: 0.5 },
        },
        line_linked: {
          enable: true,
          distance: 140,
          color: "#00ffcc",
          opacity: 0.4,
          width: 1,
        },
        move: {
          enable: true,
          speed: 2.5,
          direction: "none",
          random: true,
          straight: false,
          out_mode: "out",
          attract: { enable: true, rotateX: 600, rotateY: 1200 },
        },
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: { enable: true, mode: "grab" },
          onclick: { enable: true, mode: "push" },
          resize: true,
        },
        modes: {
          grab: { distance: 150, line_linked: { opacity: 0.8 } },
          push: { particles_nb: 5 },
          repulse: { distance: 100, duration: 0.4 },
        },
      },
      retina_detect: true,
    });
    console.info("✨ Particles.js initialized successfully.");
  } else {
    console.warn("⚠️ Particles.js not loaded or missing #particles-js element.");
  }

  // === Smooth Scroll for Internal Links & CTA Buttons ===
  const buttons = document.querySelectorAll(".cta-button, .signup-button");
  if (buttons.length > 0) {
    buttons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const targetHref = btn.getAttribute("href");
        if (targetHref && targetHref.startsWith("#")) {
          const target = document.querySelector(targetHref);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    });
  }

  // === Subtle Hover Glow for Buttons ===
  const glowButtons = document.querySelectorAll(".cta-button, .signup-button");
  glowButtons.forEach((btn) => {
    btn.style.transition = "box-shadow 0.3s ease, transform 0.3s ease";
    btn.addEventListener("mouseenter", () => {
      btn.style.boxShadow = "0 0 25px rgba(0, 255, 170, 0.4)";
      btn.style.transform = "translateY(-2px)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.boxShadow = "none";
      btn.style.transform = "translateY(0)";
    });
  });
});
