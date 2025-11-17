// ======================================================
// 🚀 ALGONIMO Voice Reader + Floating Particle FX Pro
// (Interactive Mic Edition – Compact Professional Style)
// ======================================================

(() => {
  const VoiceReader = (() => {
    let utterance = null,
      isReading = false,
      isPaused = false,
      selectedVoice = null,
      currentIndex = 0,
      elements = [];

    // === Create UI Elements ===
    const btn = document.createElement("button");
    btn.id = "voice-btn";
    btn.innerHTML = "🔊";

    const ring = document.createElement("div");
    const panel = document.createElement("div");
    panel.className = "voice-panel";

    // Mic icon toggle
    const mic = document.createElement("div");
    mic.className = "mic-icon";
    mic.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="#22d3ee">
        <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2z"/>
        <line x1="12" y1="19" x2="12" y2="23" stroke="#22d3ee" stroke-width="1.2"/>
        <line x1="8" y1="23" x2="16" y2="23" stroke="#22d3ee" stroke-width="1.2"/>
      </svg>
    `;

    // Voice selector
    const voiceSelector = document.createElement("select");
    voiceSelector.id = "voice-selector";
    voiceSelector.style.display = "none";
    panel.appendChild(mic);
    panel.appendChild(voiceSelector);

    // === Read Button (Compact Professional Style) ===
    Object.assign(btn.style, {
      all: "unset",
      width: "45px",
      height: "45px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      color: "#fff",
      cursor: "pointer",
      position: "fixed",
      bottom: "22px",
      right: "22px",
      zIndex: "9999",
      background: "linear-gradient(135deg, #0ea5e9, #3b82f6)",
      boxShadow: "0 0 14px rgba(56,189,248,0.4)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(56,189,248,0.3)",
      transition: "all 0.25s ease-in-out",
    });

    btn.onmouseenter = () => {
      btn.style.transform = "scale(1.12)";
      btn.style.boxShadow = "0 0 22px rgba(56,189,248,0.6)";
    };
    btn.onmouseleave = () => {
      btn.style.transform = "scale(1)";
      btn.style.boxShadow = "0 0 14px rgba(56,189,248,0.4)";
    };

    // Glow ring
    Object.assign(ring.style, {
      position: "fixed",
      bottom: "15px",
      right: "15px",
      width: "60px",
      height: "60px",
      borderRadius: "50%",
      border: "1.5px solid rgba(56,189,248,0.35)",
      animation: "ringPulse 3s infinite ease-in-out",
      zIndex: "9998",
      pointerEvents: "none",
      filter: "drop-shadow(0 0 8px rgba(56,189,248,0.3))",
    });

    // === Voice Panel (Top Right Corner) ===
    Object.assign(panel.style, {
      position: "fixed",
      top: "15px",
      right: "15px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "50px",
      height: "50px",
      borderRadius: "50%",
      background: "rgba(8,18,35,0.85)",
      border: "1px solid rgba(56,189,248,0.25)",
      boxShadow: "0 0 18px rgba(56,189,248,0.2)",
      backdropFilter: "blur(10px)",
      zIndex: "9999",
      transition: "all 0.35s ease-in-out",
      overflow: "hidden",
    });

    Object.assign(mic.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      background: "rgba(56,189,248,0.08)",
      animation: "pulseGlow 2.5s infinite ease-in-out",
      cursor: "pointer",
      transition: "transform 0.3s ease, background 0.3s ease",
    });

    mic.onmouseenter = () => {
      mic.style.background = "rgba(56,189,248,0.25)";
      mic.style.transform = "scale(1.15)";
    };
    mic.onmouseleave = () => {
      mic.style.background = "rgba(56,189,248,0.08)";
      mic.style.transform = "scale(1)";
    };

    // Mic toggle
    mic.onclick = (e) => {
      e.stopPropagation();
      const expanded = panel.classList.contains("expanded");
      panel.classList.toggle("expanded", !expanded);
      voiceSelector.style.display = expanded ? "none" : "block";
      voiceSelector.style.opacity = expanded ? "0" : "1";
    };

    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target)) {
        panel.classList.remove("expanded");
        voiceSelector.style.display = "none";
      }
    });

    // Voice selector styles
    Object.assign(voiceSelector.style, {
      marginLeft: "10px",
      borderRadius: "8px",
      padding: "6px 10px",
      fontWeight: "600",
      fontSize: "13px",
      color: "#22d3ee",
      background: "rgba(12,22,45,0.85)",
      border: "1px solid rgba(56,189,248,0.3)",
      outline: "none",
      cursor: "pointer",
      transition: "opacity 0.3s ease, transform 0.3s ease",
      minWidth: "160px",
    });

    // === CSS Animations ===
    const style = document.createElement("style");
    style.textContent = `
      .voice-panel.expanded {
        width: 230px !important;
        height: 65px !important;
        border-radius: 16px !important;
        padding: 0 12px !important;
        justify-content: flex-start !important;
        box-shadow: 0 0 25px rgba(34,211,238,0.45), 0 0 40px rgba(56,189,248,0.3);
      }

      @media (max-width: 768px) {
        .voice-panel {
          top: 10px !important;
          right: 12px !important;
          width: 45px !important;
          height: 45px !important;
        }
        .voice-panel.expanded {
          width: 180px !important;
          height: 55px !important;
        }
        #voice-selector {
          min-width: 120px !important;
          font-size: 12px !important;
        }
      }

      @keyframes ringPulse {
        0%,100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.15); opacity: 1; }
      }

      @keyframes pulseGlow {
        0%,100% { box-shadow: 0 0 4px rgba(56,189,248,0.3); }
        50% { box-shadow: 0 0 12px rgba(56,189,248,0.7); }
      }

      .reading-highlight {
        background: linear-gradient(90deg, rgba(34,211,238,0.22), rgba(59,130,246,0.1));
        border-left: 3px solid #22d3ee;
        border-radius: 4px;
        animation: highlightPulse 1.6s infinite ease-in-out;
      }

      @keyframes highlightPulse {
        0%,100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // === Voice Setup ===
    const synth = window.speechSynthesis;
    function populateVoices() {
      const voices = (synth.getVoices() || []).filter((v) => v.lang && v.lang.startsWith("en"));
      voiceSelector.innerHTML = "";
      voices.forEach((v) => {
        const opt = document.createElement("option");
        opt.textContent =
          (/female/i.test(v.name) ? "🎤 " : /male/i.test(v.name) ? "🎙️ " : "🤖 ") + v.name;
        opt.value = v.name;
        voiceSelector.appendChild(opt);
      });
      selectedVoice =
        voices.find((v) => /Google|Amy|Joanna|Female/i.test(v.name)) || voices[0] || null;
      if (selectedVoice) voiceSelector.value = selectedVoice.name;
    }
    populateVoices();
    synth.onvoiceschanged = populateVoices;

    voiceSelector.addEventListener("change", () => {
      selectedVoice = synth.getVoices().find((v) => v.name === voiceSelector.value);
    });

    // === Reading Logic ===
    function clearHighlights() {
      elements.forEach((el) => el.classList.remove("reading-highlight"));
    }

    function highlightElement(index) {
      clearHighlights();
      const el = elements[index];
      if (!el) return;
      el.classList.add("reading-highlight");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function startReading() {
      if (synth.speaking) synth.cancel();

      elements = Array.from(document.querySelectorAll("main h1, main h2, main p, main li, main pre, main code"))
        .filter((el) => el.innerText.trim().length > 0);

      if (elements.length === 0) return updateButton("error");

      currentIndex = 0;
      isReading = true;
      isPaused = false;
      updateButton("stop");
      readNext();
    }

    function readNext() {
      if (currentIndex >= elements.length) {
        stopReading();
        return;
      }

      const el = elements[currentIndex];
      const text = el.innerText.trim();
      if (!text) {
        currentIndex++;
        readNext();
        return;
      }

      utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.voice = selectedVoice;

      utterance.onstart = () => highlightElement(currentIndex);
      utterance.onend = () => {
        currentIndex++;
        if (isReading && !isPaused) setTimeout(readNext, 150);
      };

      synth.speak(utterance);
    }

    function stopReading() {
      synth.cancel();
      clearHighlights();
      updateButton("read");
      isReading = false;
      isPaused = false;
    }

    function toggle() {
      if (!isReading) startReading();
      else if (!isPaused && synth.speaking) {
        synth.pause();
        isPaused = true;
        updateButton("resume");
      } else if (isPaused) {
        synth.resume();
        isPaused = false;
        updateButton("stop");
      } else {
        stopReading();
      }
    }

    // === Button States ===
    function updateButton(state) {
      switch (state) {
        case "read":
          btn.innerHTML = "🔊";
          btn.style.background = "linear-gradient(135deg, #0ea5e9, #3b82f6)";
          break;
        case "stop":
          btn.innerHTML = "⏹";
          btn.style.background = "linear-gradient(135deg, #ef4444, #b91c1c)";
          break;
        case "resume":
          btn.innerHTML = "▶";
          btn.style.background = "linear-gradient(135deg, #10b981, #047857)";
          break;
        case "error":
          btn.innerHTML = "⚠";
          btn.style.background = "linear-gradient(135deg, #f59e0b, #b45309)";
          break;
      }
    }

    // Attach UI
    btn.onclick = toggle;
    document.body.appendChild(ring);
    document.body.appendChild(btn);
    document.body.appendChild(panel);
  })();

  // === Particle Background ===
  const ParticleFX = (() => {
    const c = document.createElement("div");
    c.className = "particles";
    document.body.prepend(c);
    for (let i = 0; i < 25; i++) {
      const p = document.createElement("div");
      Object.assign(p.style, {
        position: "absolute",
        width: `${Math.random() * 3 + 1.5}px`,
        height: `${Math.random() * 3 + 1.5}px`,
        background: `rgba(56,189,248,${Math.random() * 0.4 + 0.3})`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        borderRadius: "50%",
        animation: `float ${Math.random() * 7 + 3}s ease-in-out infinite`,
        opacity: `${Math.random() * 0.5 + 0.4}`,
      });
      c.appendChild(p);
    }
    const s = document.createElement("style");
    s.textContent = `
      @keyframes float {
        0% { transform: translateY(0) scale(1); opacity: 0.8; }
        50% { transform: translateY(-18px) scale(1.15); opacity: 1; }
        100% { transform: translateY(0) scale(1); opacity: 0.8; }
      }
      .particles { position: fixed; inset: 0; pointer-events: none; z-index: -1; }
    `;
    document.head.appendChild(s);
  })();

  console.log("%cALGONIMO Voice Reader – Compact Professional Edition", "color:#22d3ee;font-weight:bold;");
})();
