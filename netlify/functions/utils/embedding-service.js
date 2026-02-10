/**
 * Embedding Service
 *
 * Generates text embeddings for semantic search using:
 * 1. OpenAI text-embedding-3-small (primary - best quality)
 * 2. Cohere embed-english-v3.0 (fallback)
 * 3. Local sentence-transformers via HuggingFace API (free fallback)
 *
 * Embeddings are used for:
 * - Semantic knowledge base search
 * - Query understanding
 * - Conversation context retrieval
 */

const EMBEDDING_DIMENSION = 1536; // OpenAI default

// Embedding providers configuration
const PROVIDERS = {
  OPENAI: {
    url: "https://api.openai.com/v1/embeddings",
    model: "text-embedding-3-small",
    dimension: 1536,
  },
  COHERE: {
    url: "https://api.cohere.ai/v1/embed",
    model: "embed-english-v3.0",
    inputType: "search_query", // or "search_document" for indexing
  },
  HUGGINGFACE: {
    url: "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
    dimension: 384, // Will be padded to 1536
  },
};

/**
 * Check which embedding provider is available
 */
function getAvailableProvider() {
  if (process.env.OPENAI_API_KEY) {
    return "openai";
  }
  if (process.env.COHERE_API_KEY) {
    return "cohere";
  }
  if (process.env.HUGGINGFACE_API_KEY) {
    return "huggingface";
  }
  return null;
}

/**
 * Generate embeddings using OpenAI
 */
async function embedWithOpenAI(texts, _isQuery = true) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const response = await fetch(PROVIDERS.OPENAI.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: PROVIDERS.OPENAI.model,
      input: texts,
      dimensions: EMBEDDING_DIMENSION,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI embedding error: ${error.error?.message || response.statusText}`,
    );
  }

  const data = await response.json();
  return data.data.map((item) => item.embedding);
}

/**
 * Generate embeddings using Cohere
 */
async function embedWithCohere(texts, isQuery = true) {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    throw new Error("COHERE_API_KEY not configured");
  }

  const response = await fetch(PROVIDERS.COHERE.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      texts,
      model: PROVIDERS.COHERE.model,
      input_type: isQuery ? "search_query" : "search_document",
      truncate: "END",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Cohere embedding error: ${error.message || response.statusText}`,
    );
  }

  const data = await response.json();

  // Cohere returns 1024d embeddings, pad to 1536d for consistency
  return data.embeddings.map((emb) => padEmbedding(emb, EMBEDDING_DIMENSION));
}

/**
 * Generate embeddings using HuggingFace (free)
 */
async function embedWithHuggingFace(texts) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error("HUGGINGFACE_API_KEY not configured");
  }

  const embeddings = [];

  // HuggingFace inference API processes one at a time
  for (const text of texts) {
    const response = await fetch(PROVIDERS.HUGGINGFACE.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `HuggingFace embedding error: ${error.error || response.statusText}`,
      );
    }

    const embedding = await response.json();
    // Pad from 384d to 1536d
    embeddings.push(padEmbedding(embedding, EMBEDDING_DIMENSION));
  }

  return embeddings;
}

/**
 * Pad embedding to target dimension
 */
function padEmbedding(embedding, targetDimension) {
  if (embedding.length >= targetDimension) {
    return embedding.slice(0, targetDimension);
  }

  // Pad with zeros
  const padded = new Array(targetDimension).fill(0);
  for (let i = 0; i < embedding.length; i++) {
    padded[i] = embedding[i];
  }
  return padded;
}

/**
 * Normalize embedding to unit vector
 */
function normalizeEmbedding(embedding) {
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0),
  );
  if (magnitude === 0) {
    return embedding;
  }
  return embedding.map((val) => val / magnitude);
}

/**
 * Main function to generate embeddings
 * Automatically selects available provider
 *
 * @param {string|string[]} texts - Text(s) to embed
 * @param {Object} options - Options
 * @param {boolean} options.isQuery - Whether this is a search query (vs document for indexing)
 * @param {boolean} options.normalize - Whether to normalize to unit vector
 * @returns {Promise<number[][]>} - Array of embeddings
 */
async function generateEmbeddings(texts, options = {}) {
  const { isQuery = true, normalize = true } = options;

  // Ensure texts is an array
  const textArray = Array.isArray(texts) ? texts : [texts];

  // Clean texts
  const cleanedTexts = textArray.map(
    (t) => (t || "").trim().substring(0, 8000), // Limit length
  );

  const provider = getAvailableProvider();

  if (!provider) {
    console.warn(
      "[Embeddings] No embedding provider configured, returning null embeddings",
    );
    return cleanedTexts.map(() => null);
  }

  console.log(
    `[Embeddings] Using ${provider} for ${cleanedTexts.length} text(s)`,
  );

  let embeddings;

  try {
    switch (provider) {
      case "openai":
        embeddings = await embedWithOpenAI(cleanedTexts, isQuery);
        break;
      case "cohere":
        embeddings = await embedWithCohere(cleanedTexts, isQuery);
        break;
      case "huggingface":
        embeddings = await embedWithHuggingFace(cleanedTexts);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error(`[Embeddings] Error with ${provider}:`, error.message);

    // Try fallback providers
    if (provider === "openai" && process.env.COHERE_API_KEY) {
      console.log("[Embeddings] Falling back to Cohere");
      embeddings = await embedWithCohere(cleanedTexts, isQuery);
    } else if (provider !== "huggingface" && process.env.HUGGINGFACE_API_KEY) {
      console.log("[Embeddings] Falling back to HuggingFace");
      embeddings = await embedWithHuggingFace(cleanedTexts);
    } else {
      throw error;
    }
  }

  // Optionally normalize
  if (normalize) {
    embeddings = embeddings.map(normalizeEmbedding);
  }

  return embeddings;
}

/**
 * Generate embedding for a single text
 */
async function generateEmbedding(text, options = {}) {
  const embeddings = await generateEmbeddings([text], options);
  return embeddings[0];
}

/**
 * Calculate cosine similarity between two embeddings
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}

/**
 * Check if embedding service is available
 */
function isEmbeddingServiceAvailable() {
  return getAvailableProvider() !== null;
}

export { generateEmbedding,
  generateEmbeddings,
  cosineSimilarity,
  normalizeEmbedding,
  isEmbeddingServiceAvailable,
  getAvailableProvider,
  EMBEDDING_DIMENSION, };
