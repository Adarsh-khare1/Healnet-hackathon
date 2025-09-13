// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

dotenv.config();

// __dirname fix for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Check API keys
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY in .env");
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error("❌ Missing MONGO_URI in .env");
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));

// Token schema
const tokenSchema = new mongoose.Schema({
  user: { type: String, required: true },
  totalTokens: { type: Number, default: 0 }
});
const Token = mongoose.model("Token", tokenSchema);

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 60000 });

// Fetch live data from SerpAPI
const fetchSerpData = async (query) => {
  if (!process.env.SERP_API_KEY) return null;
  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&hl=en&gl=us&api_key=${process.env.SERP_API_KEY}`;
    const resp = await axios.get(url);
    if (resp.data.organic_results) {
      return resp.data.organic_results
        .slice(0, 5)
        .map(r => `- ${r.title}: ${r.snippet}`)
        .join("\n");
    }
    return null;
  } catch (err) {
    console.error("❌ SerpAPI Error:", err.message);
    return null;
  }
};

// Chat endpoint
app.post('/chat', async (req, res) => {
  const { user, message } = req.body;
  if (!message) return res.status(400).json({ reply: "Provide a message", tokensUsed: 0 });

  try {
    // GPT response
    const gptReply = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: 'user', content: message }]
    });

    let reply = gptReply?.choices?.[0]?.message?.content || "No reply";
    let tokensUsed = gptReply?.usage?.total_tokens || 0;

    // Use SerpAPI if GPT cannot answer or question is live-sensitive
    if (/I don't know|cannot provide|Sorry/i.test(reply) || /today|latest|weather|news|update/i.test(message)) {
      const serpData = await fetchSerpData(message);
      if (serpData) {
        const enhancedReply = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: `Live search results:\n${serpData}` },
            { role: "user", content: message }
          ]
        });
        reply = enhancedReply?.choices?.[0]?.message?.content || serpData;
        tokensUsed += enhancedReply?.usage?.total_tokens || 0;
      }
    }

    // Update tokens in MongoDB
    let tokenRecord = await Token.findOne({ user });
    if (!tokenRecord) {
      tokenRecord = new Token({ user, totalTokens: tokensUsed });
    } else {
      tokenRecord.totalTokens += tokensUsed;
    }
    await tokenRecord.save();

    res.json({ reply, tokensUsed, totalTokensUsed: tokenRecord.totalTokens });

  } catch (err) {
    console.error(err.response?.data || err.message || err);
    res.status(500).json({ reply: "Error processing request", tokensUsed: 0 });
  }
});

// Start server
app.listen(PORT, () => console.log(`🚀 Chatbot running on http://localhost:${PORT}`));
