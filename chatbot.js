// chatbot.js
const chatBody = document.getElementById("chatBody");
const userInput = document.getElementById("userInput");
const sendBtn = document.querySelector("button");

// Initialize total tokens from localStorage
let totalTokensUsed = parseInt(localStorage.getItem('totalTokensUsed')) || 0;

// Helper to append messages
function appendMessage(text, sender = "bot") {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "user-message" : "bot-message";
  msg.innerHTML = text.replace(/\n/g, "<br>");
  chatBody.appendChild(msg);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Append token info
function appendTokenInfo() {
  const tokenDiv = document.createElement("div");
  tokenDiv.className = "token-info";
  tokenDiv.textContent = `Total tokens used: ${totalTokensUsed}`;
  chatBody.appendChild(tokenDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Send message
async function sendMessage() {
  const msg = userInput.value.trim();
  if (!msg) return;

  appendMessage(msg, "user");
  userInput.value = "";

  try {
    const res = await fetch("https://healnet-hackathon.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });

    if (!res.ok) throw new Error("Server error");
    const data = await res.json();

    appendMessage(data.reply, "bot");

    // Update total tokens
    totalTokensUsed += data.tokensUsed || 0;
    localStorage.setItem("totalTokensUsed", totalTokensUsed);

    appendTokenInfo();

  } catch (err) {
    console.error("Chat error:", err);
    appendMessage("⚠️ Sorry, I’m having trouble right now. Please try again.", "bot");
  }
}

// Send on Enter key
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Send on button click
sendBtn.addEventListener("click", sendMessage);

// Optional: reset tokens
function resetTokens() {
  totalTokensUsed = 0;
  localStorage.setItem("totalTokensUsed", 0);
  const resetDiv = document.createElement("div");
  resetDiv.className = "token-info";
  resetDiv.textContent = "Tokens reset to 0";
  chatBody.appendChild(resetDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}
