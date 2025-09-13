// chatbot.js
const chatBody = document.getElementById("chatBody");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Generate a unique user ID for session (or use login info)
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "Guest-" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("userId", userId);
}

// Helper to append messages
function appendMessage(text, sender = "bot") {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "user-message" : "bot-message";
  msg.innerHTML = text.replace(/\n/g, "<br>");
  chatBody.appendChild(msg);
  chatBody.scrollTop = chatBody.scrollHeight;
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
      body: JSON.stringify({ user: userId, message: msg }),
    });

    if (!res.ok) throw new Error("Server error");

    const data = await res.json();
    appendMessage(data.reply, "bot");

    // Display token info
    const tokenDiv = document.createElement("div");
    tokenDiv.className = "token-info";
    tokenDiv.textContent = `Total tokens used: ${data.totalTokensUsed}`;
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
