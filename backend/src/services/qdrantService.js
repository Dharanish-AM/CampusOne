const { QdrantClient } = require("@qdrant/js-client-rest");

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const COLLECTION = process.env.QDRANT_COLLECTION || "campusone_faq";
const VECTOR_SIZE = parseInt(process.env.QDRANT_VECTOR_SIZE || "768", 10);

let client = null;

/**
 * Returns (and lazily initialises) the shared QdrantClient instance.
 */
const getClient = () => {
  if (!client) {
    client = new QdrantClient({ url: QDRANT_URL });
  }
  return client;
};

/**
 * Creates the FAQ collection if it does not already exist.
 * Safe to call multiple times (idempotent).
 */
const initCollection = async () => {
  const qdrant = getClient();

  const { collections } = await qdrant.getCollections();
  const exists = collections.some((c) => c.name === COLLECTION);

  if (!exists) {
    await qdrant.createCollection(COLLECTION, {
      vectors: {
        size: VECTOR_SIZE,
        distance: "Cosine",
      },
    });
    console.log(
      `[Qdrant] Collection '${COLLECTION}' created (dim=${VECTOR_SIZE}).`,
    );
  } else {
    console.log(
      `[Qdrant] Collection '${COLLECTION}' already exists — skipping creation.`,
    );
  }
};

/**
 * Deletes and recreates the collection.
 */
const recreateCollection = async () => {
  const qdrant = getClient();
  try {
    await qdrant.deleteCollection(COLLECTION);
    console.log(`[Qdrant] Collection '${COLLECTION}' deleted.`);
  } catch (err) {
    // Ignore error if it doesn't exist
  }
  await qdrant.createCollection(COLLECTION, {
    vectors: {
      size: VECTOR_SIZE,
      distance: "Cosine",
    },
  });
  console.log(`[Qdrant] Collection '${COLLECTION}' recreated.`);
};

/**
 * Upserts an array of document chunks as vectors.
 * @param {{ id: string|number, vector: number[], payload: object }[]} points
 */
const upsertPoints = async (points) => {
  const qdrant = getClient();
  await qdrant.upsert(COLLECTION, { points, wait: true });
};

/**
 * Returns the count of vectors in the collection.
 */
const getPointCount = async () => {
  const qdrant = getClient();
  const info = await qdrant.getCollection(COLLECTION);
  return info.points_count ?? 0;
};

/**
 * Performs a cosine similarity search and returns the top-K text chunks.
 * @param {number[]} queryVector  Embedding of the user query
 * @param {number}   topK         Number of results to return (default 3)
 * @returns {string[]}  Array of matching text chunk strings
 */
const search = async (queryVector, topK = 3) => {
  const qdrant = getClient();

  const results = await qdrant.search(COLLECTION, {
    vector: queryVector,
    limit: topK,
    with_payload: true,
  });

  return results.map((r) => r.payload?.text ?? "");
};

module.exports = {
  initCollection,
  recreateCollection,
  upsertPoints,
  getPointCount,
  search,
};
