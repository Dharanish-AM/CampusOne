const axios = require("axios");

const BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const CHAT_MODEL = process.env.OLLAMA_MODEL || "llama3.2";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

// Shared axios instance pointing at the local Ollama server
const ollamaAxios = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000, // LLM inference can be slow — 2 min timeout
});

/**
 * Generates a text embedding vector using Ollama's /api/embeddings endpoint.
 * Falls back to a zero-vector of the expected dimension if Ollama is unreachable,
 * so the app degrades gracefully instead of crashing.
 *
 * @param {string} text  The text to embed
 * @returns {Promise<number[]>}  Float embedding array
 */
const getEmbedding = async (text) => {
  try {
    const { data } = await ollamaAxios.post("/api/embeddings", {
      model: EMBED_MODEL,
      prompt: text,
    });
    return data.embedding;
  } catch (err) {
    console.warn(
      "[Ollama] Embedding failed — returning zero-vector fallback:",
      err.message,
    );
    const dim = parseInt(process.env.QDRANT_VECTOR_SIZE || "768", 10);
    return new Array(dim).fill(0);
  }
};

/**
 * Sends a chat request to Ollama and returns the assistant's reply string.
 * Uses the non-streaming /api/chat endpoint so we can await the full response.
 *
 * @param {string}   systemPrompt  Grounded context injected as the system message
 * @param {{ role: 'user'|'assistant', content: string }[]} messages  Conversation history
 * @returns {Promise<string>}  The assistant reply text
 */
const chat = async (systemPrompt, messages) => {
  try {
    const { data } = await ollamaAxios.post("/api/chat", {
      model: CHAT_MODEL,
      stream: false,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    // Ollama returns: { message: { role, content }, done: true, ... }
    return (
      data.message?.content?.trim() ??
      "I could not generate a response. Please try again."
    );
  } catch (err) {
    console.error("[Ollama] Chat inference failed:", err.message);
    throw new Error(
      "AI service is currently unavailable. Please try again later.",
    );
  }
};

module.exports = {
  getEmbedding,
  chat,
};
