# Evidence-Based Knowledge Base Setup Guide

## Overview

This guide explains how to build and maintain the evidence-based knowledge database for FlagFit Pro's AI chatbot. The system fetches 100-1000+ research articles from open sources and processes them into structured knowledge entries.

## Architecture

### Database Schema

The knowledge base consists of three main tables:

1. **`research_articles`** - Raw research articles from open sources
2. **`knowledge_base_entries`** - Processed, structured knowledge entries
3. **`article_search_index`** & **`knowledge_search_index`** - Full-text search indexes

### Data Sources

- **Europe PMC** - PubMed + open access articles (primary source)
- **Semantic Scholar** - Academic paper database with open access filter
- **Future**: arXiv, PLOS ONE, Frontiers journals

## Setup Instructions

### 1. Install Dependencies

```bash
npm install pg node-fetch dotenv
```

### 2. Run Database Migration

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL -f database/migrations/028_evidence_based_knowledge_base.sql
```

### 3. Fetch Research Articles

```bash
# Set your database URL in .env
echo "DATABASE_URL=your_database_url" >> .env

# Run the fetch script
node scripts/fetch-research-articles.js
```

This will:
- Search for articles across all categories (injuries, nutrition, recovery, training, psychology)
- Fetch from Europe PMC and Semantic Scholar
- Insert articles into the database
- Target: 100-1000+ articles

### 4. Process Articles into Knowledge Base

```bash
node scripts/process-knowledge-base.js
```

This will:
- Extract structured knowledge from articles
- Create knowledge base entries for supplements, injuries, recovery methods, etc.
- Link articles to knowledge entries

### 5. Update Chatbot Integration

The chatbot automatically queries the knowledge base when available. Update `src/js/components/chatbot.js` to use the knowledge base service:

```javascript
import { knowledgeBaseService } from '../services/knowledge-base-service.js';

// In getResponse method:
const kbAnswer = await knowledgeBaseService.getEvidenceBasedAnswer(userMessage);
if (kbAnswer) {
  return kbAnswer.answer;
}
```

## Categories Covered

### 1. Injuries
- Ankle sprains
- Hamstring strains
- ACL injuries
- Shoulder impingement
- Injury prevention strategies
- Rehabilitation protocols

### 2. Nutrition & Supplements
- Iron supplementation
- Protein requirements
- Creatine protocols
- Magnesium for athletes
- Vitamin D
- Pre/post-workout nutrition
- Hydration strategies

### 3. Recovery Methods
- Sauna therapy protocols
- Cold water immersion
- Cryotherapy
- Massage therapy
- Compression therapy
- Sleep optimization
- Active recovery

### 4. Training
- Speed training
- Agility training
- Strength training periodization
- Plyometric training
- Training load monitoring
- Overtraining prevention

### 5. Sports Psychology
- Performance anxiety management
- Visualization techniques
- Confidence building
- Mental toughness
- Goal setting
- Pre-competition routines

## Maintenance

### Regular Updates

Run the fetch script monthly to get new articles:

```bash
node scripts/fetch-research-articles.js
```

### Quality Control

Articles are automatically:
- Filtered for open access only
- Categorized by topic
- Rated by evidence level (A/B/C)
- Indexed for full-text search

### Manual Review

Review high-impact articles manually:

```sql
SELECT title, journal, citation_count, evidence_level
FROM research_articles
WHERE citation_count > 50
ORDER BY citation_count DESC;
```

## API Endpoints

### Search Knowledge Base

```javascript
POST /api/knowledge/search
{
  "query": "iron supplementation",
  "category": "nutrition",
  "limit": 5
}
```

### Get Specific Entry

```javascript
GET /api/knowledge/entry/iron_supplementation
```

### Search Articles

```javascript
POST /api/knowledge/articles
{
  "query": "cold therapy recovery",
  "categories": ["recovery"],
  "limit": 10
}
```

## Performance

- **Search Speed**: < 100ms for knowledge base queries
- **Cache**: 1-hour cache for frequent queries
- **Indexes**: Full-text search indexes for fast queries
- **Scalability**: Handles 1000+ articles efficiently

## Future Enhancements

1. **NLP Processing**: Use NLP to extract structured data from abstracts
2. **Auto-categorization**: ML-based article categorization
3. **Citation Networks**: Build citation graphs
4. **Confidence Scoring**: ML-based answer confidence
5. **Multi-language**: Support for non-English articles

## Troubleshooting

### No articles fetched

- Check internet connection
- Verify API rate limits (add delays if needed)
- Check database connection string

### Duplicate articles

- Normal - articles are deduplicated by DOI
- Check for unique constraint violations

### Search not working

- Verify search indexes are created
- Check full-text search configuration
- Rebuild indexes if needed

## Support

For issues or questions, check:
- Database logs
- Script output logs
- API response errors

