#!/usr/bin/env node
/**
 * Seed Knowledge Base Embeddings
 *
 * Generates embeddings for all knowledge base entries that don't have them.
 * Run this script after setting up an embedding provider (OpenAI, Cohere, or HuggingFace).
 *
 * Usage:
 *   node scripts/seed-knowledge-embeddings.cjs
 *
 * Environment variables required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - One of: OPENAI_API_KEY, COHERE_API_KEY, or HUGGINGFACE_API_KEY
 */

require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const EMBEDDING_DIMENSION = 1536;
const BATCH_SIZE = 10;

// Check which provider is available
function getProvider() {
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

// Generate embeddings using OpenAI
async function embedWithOpenAI(texts) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts,
      dimensions: EMBEDDING_DIMENSION,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI error: ${error.error?.message}`);
  }

  const data = await response.json();
  return data.data.map((item) => item.embedding);
}

// Generate embeddings using Cohere
async function embedWithCohere(texts) {
  const response = await fetch("https://api.cohere.ai/v1/embed", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      texts,
      model: "embed-english-v3.0",
      input_type: "search_document",
      truncate: "END",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Cohere error: ${error.message}`);
  }

  const data = await response.json();
  // Pad to 1536 dimensions
  return data.embeddings.map((emb) => padEmbedding(emb, EMBEDDING_DIMENSION));
}

// Pad embedding to target dimension
function padEmbedding(embedding, targetDim) {
  if (embedding.length >= targetDim) {
    return embedding.slice(0, targetDim);
  }
  return [...embedding, ...new Array(targetDim - embedding.length).fill(0)];
}

// Main seeding function
async function seedEmbeddings() {
  const provider = getProvider();

  if (!provider) {
    console.error("❌ No embedding provider configured!");
    console.error(
      "Set one of: OPENAI_API_KEY, COHERE_API_KEY, or HUGGINGFACE_API_KEY",
    );
    process.exit(1);
  }

  console.log(
    `🚀 Starting embedding generation using ${provider.toUpperCase()}`,
  );
  console.log(`📊 Batch size: ${BATCH_SIZE}`);

  // Get entries without embeddings
  const { data: entries, error } = await supabase
    .from("knowledge_base_entries")
    .select("id, title, content, category")
    .is("content_embedding", null)
    .eq("is_active", true);

  if (error) {
    console.error("❌ Error fetching entries:", error.message);
    process.exit(1);
  }

  if (!entries || entries.length === 0) {
    console.log("✅ All entries already have embeddings!");
    return;
  }

  console.log(`📝 Found ${entries.length} entries without embeddings`);

  let processed = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    // Create text for embedding (combine title and content)
    const texts = batch.map((e) => {
      const title = e.title || "";
      const content = e.content || "";
      const category = e.category || "";
      return `${title}. ${category}. ${content}`.substring(0, 8000);
    });

    try {
      let embeddings;

      if (provider === "openai") {
        embeddings = await embedWithOpenAI(texts);
      } else if (provider === "cohere") {
        embeddings = await embedWithCohere(texts);
      } else {
        // HuggingFace - process one at a time
        embeddings = [];
        for (const text of texts) {
          const response = await fetch(
            "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ inputs: text }),
            },
          );
          const emb = await response.json();
          embeddings.push(padEmbedding(emb, EMBEDDING_DIMENSION));
        }
      }

      // Update entries with embeddings
      for (let j = 0; j < batch.length; j++) {
        const { error: updateError } = await supabase
          .from("knowledge_base_entries")
          .update({
            content_embedding: `[${embeddings[j].join(",")}]`,
            embedding_model: provider,
            embedded_at: new Date().toISOString(),
          })
          .eq("id", batch[j].id);

        if (updateError) {
          console.error(
            `❌ Error updating ${batch[j].id}:`,
            updateError.message,
          );
          failed++;
        } else {
          processed++;
        }
      }

      console.log(
        `✅ Processed ${i + batch.length}/${entries.length} (${Math.round(((i + batch.length) / entries.length) * 100)}%)`,
      );

      // Rate limit protection
      if (provider === "openai") {
        await new Promise((r) => {
          setTimeout(r, 200);
        });
      } else if (provider === "cohere") {
        await new Promise((r) => {
          setTimeout(r, 500);
        });
      } else {
        await new Promise((r) => {
          setTimeout(r, 1000);
        });
      }
    } catch (error) {
      console.error(`❌ Batch error:`, error.message);
      failed += batch.length;

      // Wait longer on rate limit
      if (error.message.includes("rate")) {
        console.log("⏳ Rate limited, waiting 60s...");
        await new Promise((r) => {
          setTimeout(r, 60000);
        });
      }
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   ✅ Processed: ${processed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📝 Total: ${entries.length}`);
}

// Run
seedEmbeddings().catch(console.error);
