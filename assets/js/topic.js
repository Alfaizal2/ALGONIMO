/* ======================================================
   🌌 ALGONIMO – Topic Page Script
   Includes:
   - Particle Background Animation
   - C Compiler Integration (Judge0 API)
   - Grok-2 AI Mentor Chat System
====================================================== */

/* === Particle Background Animation === */
const particles = document.getElementById("particles");
for (let i = 0; i < 25; i++) {
  const particle = document.createElement("div");
  particle.classList.add("particle");
  particle.style.width = particle.style.height = Math.random() * 5 + "px";
  particle.style.left = Math.random() * 100 + "%";
  particle.style.top = Math.random() * 100 + "%";
  particle.style.animationDuration = Math.random() * 5 + 5 + "s";
  particles.appendChild(particle);
}

/* === C Compiler Function === */
async function runCCode() {
  const code = document.getElementById("cCode").value.trim();
  const userInput = document.getElementById("userInput").value;
  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = "<strong>Output:</strong> ⏳ Running your code...";

  try {
    const response = await fetch(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": "4698c70672msh9c88aeae0cdcf4cp12c0e0jsnb157d5b16485",
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
        body: JSON.stringify({
          source_code: code,
          language_id: 50,
          stdin: userInput,
        }),
      }
    );

    const data = await response.json();
    if (data.stdout) {
      outputDiv.innerHTML = `<strong>Output:</strong> ${data.stdout}`;
    } else if (data.stderr) {
      outputDiv.innerHTML = `<strong>Error:</strong> ${data.stderr}`;
    } else if (data.compile_output) {
      outputDiv.innerHTML = `<strong>Compilation Error:</strong> ${data.compile_output}`;
    } else {
      outputDiv.innerHTML = `<strong>Unknown Error:</strong> ${JSON.stringify(
        data
      )}`;
    }
  } catch {
    outputDiv.innerHTML =
      "<strong>Error:</strong> ⚠ Please check your connection or API status.";
  }
}

/* === Grok-2 AI Mentor Integration === */
async function askMentor() {
  const question = document.getElementById("mentorQuestion").value.trim();
  const responseBox = document.getElementById("mentorResponse");

  if (!question) {
    responseBox.textContent = "🧠 Please ask a question about C programming.";
    return;
  }

  responseBox.textContent = "⏳ ALGONIMO Mentor is thinking...";

  try {
    const response = await fetch("https://grok-2-by-xai.p.rapidapi.com/", {
      method: "POST",
      headers: {
        "x-rapidapi-key": "4698c70672msh9c88aeae0cdcf4cp12c0e0jsnb157d5b16485",
        "x-rapidapi-host": "grok-2-by-xai.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "Grok-2",
        messages: [
          {
            role: "system",
            content:
              "You are ALGONIMO, an AI mentor that ONLY discusses and teaches C programming. Ignore all unrelated topics. Provide clear, structured answers with examples when possible, formatted neatly for learners.",
          },
          { role: "user", content: question },
        ],
        max_tokens: 1024,
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    let reply = "⚠ Sorry, I couldn’t process your question. Please try again.";
    if (
      data.choices &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      reply = data.choices[0].message.content.trim();
    }

    // Typing effect + auto-scroll
    responseBox.textContent = "";
    let i = 0;
    (function type() {
      if (i < reply.length) {
        responseBox.textContent += reply.charAt(i);
        i++;
        responseBox.scrollTop = responseBox.scrollHeight;
        setTimeout(type, 20);
      }
    })();
  } catch {
    responseBox.textContent =
      "❌ Error fetching mentor response. Please try again.";
  }
}

/* === Clear Chat === */
function clearChat() {
  document.getElementById("mentorQuestion").value = "";
  document.getElementById("mentorResponse").textContent = "Chat cleared.";
}

/* === Copy Chat === */
function copyChat() {
  const chat = document.getElementById("mentorResponse").textContent;
  navigator.clipboard.writeText(chat);
  alert("✅ Mentor chat copied to clipboard!");
}
