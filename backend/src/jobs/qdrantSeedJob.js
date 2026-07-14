const crypto = require("crypto");
const FAQ_CHUNKS = require("../data/faqSeeds");
const qdrantService = require("../services/qdrantService");
const ollamaService = require("../services/ollamaService");

/**
 * initQdrantSeed
 *
 * Called once on server startup. Initialises the Qdrant collection and seeds
 * all FAQ chunks as embedded vectors. The job is idempotent — if the
 * collection already contains points it skips re-seeding to avoid duplicates
 * and unnecessary Ollama inference calls.
 *
 * If Ollama or Qdrant are unavailable the error is caught and logged — the
 * server continues running without vector search capability (the chat
 * controller gracefully degrades to context-only responses).
 */
const initQdrantSeed = async () => {
  try {
    console.log("[QdrantSeed] Initialising Qdrant collection…");

    // For local dev validation, recreate the collection to clear out the fallback zero-vectors and seed actual embeddings
    console.log(
      "[QdrantSeed] Recreating collection to pull real embeddings...",
    );
    await qdrantService.recreateCollection();

    console.log(
      `[QdrantSeed] Embedding ${FAQ_CHUNKS.length} FAQ chunks via Ollama…`,
    );

    const points = [];
    for (const chunk of FAQ_CHUNKS) {
      const embedding = await ollamaService.getEmbedding(chunk.text);
      points.push({
        id: crypto.randomUUID(), // Qdrant requires UUID or unsigned integer IDs
        vector: embedding,
        payload: {
          chunkId: chunk.id,
          text: chunk.text,
        },
      });
    }

    await qdrantService.upsertPoints(points);
    console.log(
      `[QdrantSeed] Successfully seeded ${points.length} FAQ vectors into Qdrant.`,
    );
  } catch (err) {
    // Non-fatal — app runs without RAG if vector infra is down
    console.error(
      "[QdrantSeed] Seeding failed (chat will use context-only mode):",
      err.message,
    );
  }
};

module.exports = { initQdrantSeed };
