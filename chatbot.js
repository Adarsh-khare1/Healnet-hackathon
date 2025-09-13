// Get DOM elements
const chatBody = document.getElementById("chatBody");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Helper to append messages
function appendMessage(text, sender = "bot") {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "user-message" : "bot-message";
  msg.innerHTML = text.replace(/\n/g, "<br>");
  chatBody.appendChild(msg);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Load global tokens from DB
async function loadTokens() {
  try {
    const res = await fetch("/tokens");
    if (!res.ok) throw new Error("Failed to fetch tokens");
    const data = await res.json();

    const tokenDiv = document.createElement("div");
    tokenDiv.className = "token-info";
    tokenDiv.textContent = `🌐 Total tokens used (all users): ${data.totalTokens}`;
    chatBody.appendChild(tokenDiv);

    chatBody.scrollTop = chatBody.scrollHeight;
  } catch (err) {
    console.error("Error loading tokens:", err);
  }
}

// Send message
async function sendMessage() {
  const msg = userInput.value.trim();
  if (!msg) return;

  appendMessage(msg, "user");
  userInput.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });

    if (!res.ok) throw new Error("Server error");

    const data = await res.json();

    appendMessage(data.reply, "bot");

    // Show global tokens from DB
    const tokenDiv = document.createElement("div");
    tokenDiv.className = "token-info";
    tokenDiv.textContent = `🌐 Total tokens used (all users): ${data.totalTokens}`;
    chatBody.appendChild(tokenDiv);

    chatBody.scrollTop = chatBody.scrollHeight;
  } catch (err) {
    console.error("Chat error:", err);
    appendMessage("⚠️ Sorry, I’m having trouble right now. Please try again.", "bot");
  }
}

// Send on Enter
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Send on button click
sendBtn.addEventListener("click", sendMessage);

// ✅ Load tokens on page load
loadTokens();
