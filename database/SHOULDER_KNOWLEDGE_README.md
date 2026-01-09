# Shoulder Knowledge Base - Import Guide

## Overview

This directory contains structured knowledge extracted from **"Practitioner's Guide to Shoulders"** by Jo Clubb and Ben Ashworth (VALD Performance, 2024).

The data has been converted into formats compatible with your FlagFit Pro database schema.

## Generated Files

### 1. `practitioners_guide_shoulders_knowledge.json`

**Purpose**: Structured JSON data ready for import or API consumption

**Contents**:

- 1 research article entry
- 5 detailed knowledge base entries
- Case studies
- Performance metrics

**Structure**:

```json
{
  "metadata": { ... },
  "research_article": { ... },
  "knowledge_base_entries": [
    {
      "entry_type": "training_method|injury|recovery_method",
      "topic": "shoulder_...",
      "question": "...",
      "answer": "...",
      "evidence_strength": "strong|moderate|limited",
      "applicable_to": [...],
      "tags": [...],
      "best_practices": [...]
    }
  ]
}
```

### 2. `seed-shoulder-knowledge.sql`

**Purpose**: Direct SQL import into Supabase database

**Tables populated**:

- `research_articles`
- `knowledge_base_entries`
- `knowledge_search_index`

**Usage**:

```bash
# Via Supabase CLI
supabase db execute -f database/seed-shoulder-knowledge.sql

# Or via psql
psql $DATABASE_URL -f database/seed-shoulder-knowledge.sql
```

## Knowledge Base Entries

### 1. Shoulder Anatomy & Biomechanics

- **Type**: training_method
- **Topic**: shoulder_anatomy_biomechanics
- **Key Concepts**:
  - Multiple joint complex (glenohumeral, AC, SC, scapulothoracic)
  - Rotator cuff muscles and function
  - Kinetic chain relationships

### 2. Shoulder Assessment Protocols

- **Type**: training_method
- **Topic**: shoulder_assessment_protocols
- **Key Equipment**: DynaMo, ForceFrame, ForceDecks
- **Key Metrics**: Peak force, RFD, ROM, asymmetry
- **Best Practices**:
  - Use objective technology-based assessments
  - Monitor both strength and ROM
  - Track rate of force development (RFD)
  - Assess lower body influence
  - Regular monitoring for injury prevention

### 3. Common Shoulder Injuries

- **Type**: injury
- **Topic**: shoulder_injuries_pathologies
- **Common Injuries**:
  - Shoulder impingement
  - Rotator cuff tears
  - Shoulder instability
  - Labral injuries
- **Risk Groups**: Overhead athletes, throwing athletes

### 4. Shoulder Rehabilitation

- **Type**: recovery_method
- **Topic**: shoulder_rehabilitation
- **Rehab Phases**:
  1. Pain management
  2. ROM restoration
  3. Strength building
  4. RFD training
  5. Return to sport
- **Best Practices**:
  - Restore full ROM before heavy strength work
  - Focus on RFD not just peak strength
  - Use objective measures to guide progression
  - Address kinetic chain deficits
  - Gradual return to sport activities

### 5. Shoulder Prehab & Training

- **Type**: training_method
- **Topic**: shoulder_prehab_training
- **Focus Areas**:
  - Rotator cuff strengthening
  - External/internal rotation balance
  - Scapular stability
  - ROM maintenance
  - Progressive loading

## Integration with FlagFit Pro

### AI Chat Integration

This knowledge can be queried by your AI coaching system for:

- Injury prevention advice for overhead athletes
- Rehabilitation guidance for shoulder injuries
- Prehab programming for QBs and WRs
- Assessment protocol recommendations

### Use Cases in Your App

#### For Quarterbacks (Throwing Athletes)

- Shoulder prehab programs
- ROM monitoring
- Injury risk assessment
- Rehabilitation protocols for throwing injuries

#### For Wide Receivers

- Overhead movement assessment
- Scapular stability training
- Injury prevention strategies

#### For All Athletes

- General shoulder health education
- Injury identification
- Evidence-based training methods

### API Integration Example

```typescript
// Query for shoulder knowledge
const { data: shoulderKnowledge } = await supabase
  .from("knowledge_base_entries")
  .select("*")
  .in("topic", [
    "shoulder_anatomy_biomechanics",
    "shoulder_assessment_protocols",
    "shoulder_injuries_pathologies",
    "shoulder_rehabilitation",
    "shoulder_prehab_training",
  ]);

// Search for specific topics
const { data: assessmentInfo } = await supabase
  .from("knowledge_base_entries")
  .select("*")
  .eq("topic", "shoulder_assessment_protocols")
  .single();
```

## Database Schema Compatibility

These entries match your existing schema from:

- `database/migrations/028_evidence_based_knowledge_base.sql`

**Key fields mapped**:

- ✅ entry_type
- ✅ topic
- ✅ question
- ✅ answer
- ✅ summary
- ✅ evidence_strength
- ✅ consensus_level
- ✅ applicable_to
- ✅ sport_specificity
- ✅ best_practices
- ✅ protocols (JSONB)
- ✅ contraindications
- ✅ safety_warnings
- ✅ tags

## Import Instructions

### Option 1: SQL Import (Recommended)

```bash
cd "/Users/aljosaursakous/Desktop/Flag football HTML - APP"

# Import via Supabase
supabase db execute -f database/seed-shoulder-knowledge.sql

# Or via environment
PGPASSWORD="your-password" psql -h your-db-host -U postgres -d postgres -f database/seed-shoulder-knowledge.sql
```

### Option 2: JSON Import via API

```typescript
import shoulderData from "./database/practitioners_guide_shoulders_knowledge.json";

// Import research article
await supabase.from("research_articles").insert(shoulderData.research_article);

// Import knowledge entries
await supabase
  .from("knowledge_base_entries")
  .insert(shoulderData.knowledge_base_entries);
```

### Option 3: Manual Review First

1. Open `practitioners_guide_shoulders_knowledge.json`
2. Review the extracted content
3. Modify if needed
4. Then run SQL import

## Verification

After import, verify with:

```sql
-- Check research article
SELECT title, authors, quality_score
FROM research_articles
WHERE title = 'Practitioner''s Guide to Shoulders';

-- Check knowledge entries
SELECT topic, entry_type, evidence_strength
FROM knowledge_base_entries
WHERE topic LIKE 'shoulder_%';

-- Test search
SELECT * FROM knowledge_base_entries
WHERE 'rotator_cuff' = ANY(tags);
```

## Source Document Details

- **Title**: Practitioner's Guide to Shoulders
- **Authors**: Jo Clubb, Ben Ashworth
- **Publisher**: VALD Performance
- **Year**: 2024
- **Pages**: 66
- **Quality Score**: 9/10
- **Evidence Level**: B (Moderate-Strong)
- **Focus**: Sports science, injury prevention, assessment technology

## Notes

- Evidence-based content from sports science experts
- Emphasis on objective measurement using technology
- Applicable to overhead and throwing athletes (QBs, WRs)
- Compatible with ACWR load monitoring system
- Integrates with existing training and injury prevention features

## Next Steps

1. ✅ Import SQL file into Supabase
2. ✅ Verify data in database
3. ✅ Integrate with AI chat system
4. ✅ Add to athlete education materials
5. ✅ Use for QB-specific prehab programs

---

**Generated**: 2026-01-05
**Extraction Method**: Automated PDF parsing with pypdf
**Schema Version**: Compatible with migration 028_evidence_based_knowledge_base.sql
