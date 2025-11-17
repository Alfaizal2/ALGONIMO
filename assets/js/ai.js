/* ============================================================
   ALGONIMO – AI JS (Voice Reader + Line Tracking)
   Updated: uses user-provided Grok-2 RapidAPI request shape.
   NOTE: API key and host are used as given by your snippet.
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- ELEMENTS (queried after DOM ready) ---------- */
  const form = document.getElementById('chatForm');
  const input = document.getElementById('userInput');
  const chatBox = document.getElementById('chatBox');
  const clearBtn = document.getElementById('clearChat');
  const downloadBtn = document.getElementById('downloadChat');
  const particleCanvas = document.getElementById('particleCanvas');

  if (!chatBox) {
    console.warn("chatBox not found in DOM — aborting chat init.");
    return;
  }

  /* ---------- SCROLL ANCHOR ---------- */
  let scrollAnchor = document.createElement('div');
  scrollAnchor.id = "scrollAnchor";
  chatBox.appendChild(scrollAnchor);

  function scrollToBottom() {
    try {
      scrollAnchor.scrollIntoView({ behavior: "smooth", block: "end" });
    } catch (e) { /* ignore */ }
  }

  /* ============================================================
     PARTICLE SYSTEM (non-blocking)
  ============================================================ */
  (function initParticles() {
    if (!particleCanvas) return;

    const ctx = particleCanvas.getContext("2d");
    let dpr = window.devicePixelRatio || 1;
    let w = 0, h = 0, particles = [], mouse;

    function resize() {
      w = particleCanvas.clientWidth = window.innerWidth || 800;
      h = particleCanvas.clientHeight = Math.max(document.documentElement.clientHeight, document.body.scrollHeight || 0);
      particleCanvas.width = Math.round(w * dpr);
      particleCanvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawn();
    }

    function spawn() {
      const count = Math.max(40, Math.floor((w * h) / 28000));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 1.8 + 0.5,
        });
      }
    }

    mouse = { x: -9999, y: -9999 };

    window.addEventListener("mousemove", e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    function loop() {
      try {
        ctx.clearRect(0, 0, w, h);
        for (let p of particles) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 150 * 150) {
            const force = (150 - Math.sqrt(dist2)) * 0.0005;
            p.vx += dx * force;
            p.vy += dy * force;
          }
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -20) p.x = w + 20;
          if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20;
          if (p.y > h + 20) p.y = -20;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(180,245,255,0.65)";
          ctx.fill();
        }
      } catch (err) {
        // safe-guard
      } finally {
        requestAnimationFrame(loop);
      }
    }

    window.addEventListener("resize", () => {
      try { resize(); } catch (e) {}
    });

    try { resize(); } catch (e) {}
    loop();
  })();

  /* ============================================================
     MESSAGE HELPERS
  ============================================================ */
  function addMessage(text, who = "user") {
    const wrapper = document.createElement("div");
    wrapper.className = `message ${who}`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = text;

    wrapper.appendChild(bubble);
    chatBox.insertBefore(wrapper, scrollAnchor);
    scrollToBottom();

    return bubble;
  }

  function addTyping() {
    const wrap = document.createElement("div");
    wrap.className = "message bot";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = `
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;

    wrap.appendChild(bubble);
    chatBox.insertBefore(wrap, scrollAnchor);
    scrollToBottom();
    return wrap;
  }

  /* ============================================================
     FORMATTER
  ============================================================ */
  function escapeHTML(str = "") {
    if (typeof str !== "string") str = String(str || "");
    return str.replace(/[&<>]/g, t => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[t]));
  }

  function formatAIText(t = "") {
    t = escapeHTML(t);

    t = t.replace(/```([\s\S]*?)```/g, (_, c) => `<pre><code>${c}</code></pre>`);
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    t = t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/(^|\n)(\d+)\.\s+(.*)/g,
      "$1<div class='ai-section'><h4>$2.</h4><p>$3</p></div>");
    t = t.replace(/(^|\n)- (.*)/g,
      "$1<div class='ai-bullets'><div class='row'><div class='dot'></div><div class='text'>$2</div></div></div>");
    t = t.replace(/(https?:\/\/[^\s<]+)/g, `<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>`);

    return t;
  }

  /* ============================================================
     TYPEWRITER + VOICE (safer)
  ============================================================ */
  function typeReply(html, bubble, speed = 6) {
    try {
      const temp = document.createElement("div");
      temp.innerHTML = html;
      const plain = temp.innerText || temp.textContent || "";

      let i = 0;
      const id = setInterval(() => {
        try {
          bubble.textContent = plain.slice(0, ++i);
          scrollToBottom();
          if (i >= plain.length) {
            clearInterval(id);
            bubble.innerHTML = html;
            addCopyButton(bubble);
            addSpeakButton(bubble);
          }
        } catch (e) {
          clearInterval(id);
          bubble.innerHTML = html;
          addCopyButton(bubble);
          addSpeakButton(bubble);
        }
      }, speed);
    } catch (e) {
      try { bubble.innerHTML = html; addCopyButton(bubble); addSpeakButton(bubble); } catch (err) {}
    }
  }

  function addCopyButton(bubble) {
    try {
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.type = "button";
      btn.title = "Copy";
      btn.innerHTML = "📋";

      btn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(bubble.innerText || bubble.textContent || "");
          btn.innerHTML = "✅";
          setTimeout(() => (btn.innerHTML = "📋"), 900);
        } catch (e) {
          console.warn("copy failed", e);
        }
      };

      bubble.appendChild(btn);
    } catch (e) {}
  }

  /* ============================================================
     TTS LINE TRACKING
  ============================================================ */
  let currentHighlight = null;

  function highlightLine(el) {
    try {
      if (!el) return;
      if (currentHighlight) currentHighlight.classList.remove("tts-highlight");
      currentHighlight = el;
      currentHighlight.classList.add("tts-highlight");
      currentHighlight.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (e) {}
  }

  function speakText(text, btn, bubble) {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech not supported in this browser.");
      return;
    }

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      btn.innerHTML = "🔊";
      if (currentHighlight) currentHighlight.classList.remove("tts-highlight");
      return;
    }

    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    let index = 0;

    function speakNext() {
      if (index >= lines.length) {
        btn.innerHTML = "🔊";
        if (currentHighlight) currentHighlight.classList.remove("tts-highlight");
        return;
      }

      const line = lines[index];
      const spans = Array.from(bubble.querySelectorAll?.(".tts-line") || []);
      const span = spans.find(s => s.innerText.trim().startsWith(line.trim()));

      if (span) highlightLine(span);

      const utter = new SpeechSynthesisUtterance(line);
      utter.rate = 1;
      utter.pitch = 1;
      utter.lang = "en-US";

      utter.onend = () => {
        index++;
        setTimeout(speakNext, 80);
      };

      utter.onerror = () => {
        index++;
        setTimeout(speakNext, 80);
      };

      speechSynthesis.speak(utter);
    }

    btn.innerHTML = "⏹";
    speakNext();
  }

  function addSpeakButton(bubble) {
    try {
      const textLines = (bubble.innerHTML || "").split(/<br\s*\/?>/i);
      bubble.innerHTML = textLines.map(l => `<span class="tts-line">${l}</span><br>`).join("");

      const btn = document.createElement("button");
      btn.className = "speak-btn";
      btn.type = "button";
      btn.title = "Speak";
      btn.innerHTML = "🔊";

      btn.onclick = () => {
        const text = bubble.innerText.trim();
        speakText(text, btn, bubble);
      };

      bubble.appendChild(btn);
    } catch (e) {}
  }

  /* ============================================================
     CHAT CLEAR & DOWNLOAD
  ============================================================ */
  function getChatPlainText() {
    const lines = [];
    const messages = chatBox.querySelectorAll(".message");
    messages.forEach(m => {
      const bubble = m.querySelector(".bubble");
      if (!bubble) return;
      const who = m.classList.contains("user") ? "You: " : "AI: ";
      lines.push(who + (bubble.innerText || bubble.textContent || "").trim());
    });
    return lines.join("\n\n");
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      chatBox.innerHTML = "";
      chatBox.appendChild(scrollAnchor);
      const welcome = addMessage(`
        <div class="ai-titleline">👋 Welcome to ALGONIMO AI</div>
        <p>I’m <strong>Algonimo</strong> — your personal AI coding mentor. Ask me anything about programming!</p>
      `, "bot");
      addCopyButton(welcome);
      addSpeakButton(welcome);
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      try {
        const text = getChatPlainText();
        const blob = new Blob([text], { type: "text/plain" });
        const link = document.createElement("a");
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        link.href = URL.createObjectURL(blob);
        link.download = `Algonimo-Chat-${stamp}.txt`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      } catch (e) {
        console.warn("download failed", e);
      }
    });
  }

  /* ============================================================
     ✅ Grok-2 API Call via RapidAPI (user-provided format)
     - integrated defensively (handles non-OK and varied response shapes)
  ============================================================ */
  async function fetchBotReply(userInput) {
    const url = 'https://grok-2-by-xai.p.rapidapi.com/';
    const options = {
      method: 'POST',
      headers: {
        'x-rapidapi-key': '4698c70672msh9c88aeae0cdcf4cp12c0e0jsnb157d5b16485',
        'x-rapidapi-host': 'grok-2-by-xai.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'Grok-2',
        messages: [
          {
            role: 'system',
            content: 'You are Algonimo, a personal coding mentor. Provide clear, concise, and accurate answers to programming-related questions. Include code examples where relevant, explain concepts in an educational manner, and focus on helping the user learn programming languages effectively.'
          },
          { role: 'user', content: userInput }
        ],
        max_tokens: 2048,
        temperature: 1
      })
    };

    try {
      const response = await fetch(url, options);
      // If response is not ok, attempt to gather text for debugging
      if (!response.ok) {
        const txt = await response.text().catch(() => "");
        console.error("Grok RapidAPI non-OK:", response.status, txt);
        // try to parse JSON error if possible
        try {
          const parsed = JSON.parse(txt || "{}");
          const msg = parsed?.message || parsed?.error || txt || response.statusText;
          return `⚠️ API Error ${response.status}: ${msg}`;
        } catch (e) {
          return `⚠️ API Error ${response.status}: ${txt || response.statusText}`;
        }
      }

      // parse JSON defensively
      const result = await response.json().catch(() => null);
      if (!result) return "⚠️ API Error: Invalid JSON response.";

      // handle common shapes
      // prefer: result.choices[0].message.content
      if (result.choices && Array.isArray(result.choices) && result.choices.length > 0) {
        const choice = result.choices[0];
        const content = (choice.message && choice.message.content) || choice.text || choice.output_text || null;
        if (content) return (typeof content === "string") ? content.trim() : String(content);
      }

      // fallback: top-level text or output_text
      if (typeof result.output_text === "string" && result.output_text.trim()) return result.output_text.trim();
      if (typeof result.text === "string" && result.text.trim()) return result.text.trim();

      // if nothing matched, provide debug info
      console.warn("Grok response shape unknown:", result);
      return "⚠️ No reply from Grok-2 (unexpected response shape).";
    } catch (err) {
      console.error("fetchBotReply error:", err);
      return "⚠️ API Error: Could not reach Grok-2.";
    }
  }

  /* ============================================================
     FORM SUBMIT — defensive (checks form & elements)
  ============================================================ */
  if (form && input) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      try {
        const userText = (input.value || "").trim();
        if (!userText) return;

        addMessage(escapeHTML(userText), "user");
        input.value = "";

        const typingWrap = addTyping();

        let reply;
        try {
          reply = await fetchBotReply(userText);
        } catch (err) {
          console.error("fetchBotReply threw:", err);
          reply = "⚠️ Server error. Try again.";
        }

        try { typingWrap && typingWrap.remove(); } catch (e) {}

        const botBubble = addMessage("", "bot");
        const formatted = formatAIText(reply || "");
        typeReply(formatted, botBubble);

      } catch (err) {
        console.error("submit handler error:", err);
        try { addMessage("⚠️ Server error. Try again.", "bot"); } catch (e) {}
      }
    });
  } else {
    console.warn("Form or input element missing — chat submit disabled.");
  }

  /* ============================================================
     NAVBAR DROPDOWN — UNIVERSAL FIX (defensive)
  ============================================================ */
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

  // initial welcome if chat empty
  if (chatBox.querySelectorAll(".message").length === 0) {
    const welcome = addMessage(`
      <div class="ai-titleline">👋 Welcome to ALGONIMO AI</div>
      <p>I’m <strong>Algonimo</strong> — your personal AI coding mentor. Ask me anything about programming!</p>
    `, "bot");
    addCopyButton(welcome);
    addSpeakButton(welcome);
  }

}); // DOMContentLoaded end
