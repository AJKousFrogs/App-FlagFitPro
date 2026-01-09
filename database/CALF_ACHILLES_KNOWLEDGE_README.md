# Calf & Achilles Knowledge Base - Import Guide

## Overview

This directory contains structured knowledge extracted from **"Practitioner's Guide to the Calf and Achilles Complex"** by Sue Mayes and VALD Performance Contributors (2024).

The data has been converted into formats compatible with your FlagFit Pro database schema.

## Generated Files

### 1. `practitioners_guide_calf_achilles_knowledge.json`

**Purpose**: Structured JSON data ready for import or API consumption

**Contents**:

- 1 research article entry
- 5 detailed knowledge base entries
- Evidence-based protocols
- Best practices

### 2. `seed-calf-achilles-knowledge.sql`

**Purpose**: Direct SQL import into Supabase database

**Usage**:

```bash
# Via Supabase CLI
supabase db execute -f database/seed-calf-achilles-knowledge.sql

# Or via psql
psql $DATABASE_URL -f database/seed-calf-achilles-knowledge.sql
```

## Knowledge Base Entries

### 1. Calf & Achilles Anatomy & Biomechanics

- **Type**: training_method
- **Topic**: calf_achilles_anatomy_biomechanics
- **Key Concepts**:
  - Gastrocnemius (2 heads) and soleus muscles
  - Achilles tendon - strongest in the body
  - Force transmission for running/jumping
  - Independent muscle testing by knee position

### 2. Calf & Achilles Assessment Protocols

- **Type**: training_method
- **Topic**: calf_achilles_assessment_protocols
- **Key Equipment**: ForceFrame, ForceDecks
- **Test Positions**:
  - Knee-straight (gastrocnemius dominant)
  - Knee-bent (soleus dominant)
- **Key Metrics**: Peak force, RFD, bilateral asymmetry
- **Best Practices**:
  - Use objective force measurement
  - Test both positions for complete assessment
  - Monitor asymmetries (<10% ideal)
  - Regular monitoring for injury prevention
  - Track RFD throughout rehabilitation

### 3. Common Calf & Achilles Injuries

- **Type**: injury
- **Topic**: calf_achilles_injuries_pathologies
- **Common Injuries**:
  - Achilles tendinopathy (overuse)
  - Calf strains (medial gastrocnemius most common)
  - Achilles ruptures
  - Plantaris injuries
- **Risk Groups**: Running athletes, jumping athletes, court sports

### 4. Calf & Achilles Rehabilitation

- **Type**: recovery_method
- **Topic**: calf_achilles_rehabilitation
- **Rehab Phases**:
  1. Pain management (isometric)
  2. Heavy slow resistance training
  3. Eccentric loading (critical for tendinopathy)
  4. Plyometric training
  5. Return to sport
- **Key Principle**: Progressive loading, not rest
- **Return Criteria**: >90% strength restoration
- **Best Practices**:
  - Load management is critical for tendinopathy
  - Isometric exercises reduce pain
  - Eccentric training essential for Achilles
  - Objective testing guides progression

### 5. Calf & Achilles Injury Prevention

- **Type**: training_method
- **Topic**: calf_achilles_injury_prevention
- **Focus Areas**:
  - Adequate calf strength (gastrocnemius + soleus)
  - Eccentric training programs
  - Load management (avoid spikes)
  - Bilateral asymmetry monitoring
  - Biomechanical assessment
- **Best Practices**:
  - Regular strength testing
  - Address asymmetries >10%
  - Monitor training loads
  - Progressive load increases (<10% per week)

## Integration with FlagFit Pro

### Use Cases in Your App

#### For Running Athletes (All Positions)

- Calf strength assessment and monitoring
- Achilles injury prevention programs
- Load management during high-volume training
- Return to sport protocols after calf/Achilles injuries

#### For Explosive Athletes (RB, WR, DB)

- Plyometric readiness assessment
- Calf power testing
- Injury risk screening
- Performance optimization

#### For All Athletes

- General lower limb health education
- Injury identification and early intervention
- Evidence-based training methods
- Recovery protocols

### API Integration Examples

```typescript
// Query for calf/Achilles knowledge
const { data: calfKnowledge } = await supabase
  .from("knowledge_base_entries")
  .select("*")
  .ilike("topic", "calf_achilles_%");

// Get rehabilitation protocols
const { data: rehabInfo } = await supabase
  .from("knowledge_base_entries")
  .select("protocols, best_practices")
  .eq("topic", "calf_achilles_rehabilitation")
  .single();

// Search for tendinopathy information
const { data: tendinopathyInfo } = await supabase
  .from("knowledge_base_entries")
  .select("*")
  .contains("tags", ["achilles_tendinopathy"]);
```

### AI Chat Integration

```typescript
// Example: Athlete asks about Achilles pain
async function getAchillesAdvice(symptom: string) {
  const topics = symptom.includes("pain")
    ? ["calf_achilles_injuries_pathologies", "calf_achilles_rehabilitation"]
    : ["calf_achilles_injury_prevention", "calf_achilles_assessment_protocols"];

  const { data } = await supabase
    .from("knowledge_base_entries")
    .select("question, answer, best_practices")
    .in("topic", topics);

  return data;
}
```

## Database Schema Compatibility

These entries match your existing schema from:

- `database/migrations/028_evidence_based_knowledge_base.sql`

**Key fields mapped**:

- ✅ entry_type (training_method, injury, recovery_method)
- ✅ topic (unique identifiers)
- ✅ question/answer (searchable content)
- ✅ evidence_strength (strong)
- ✅ consensus_level (high)
- ✅ applicable_to (athlete categories)
- ✅ sport_specificity
- ✅ best_practices (actionable items)
- ✅ protocols (JSONB with structured data)
- ✅ contraindications
- ✅ safety_warnings
- ✅ tags (searchable keywords)

## Import Instructions

### Option 1: Automated Script

```bash
cd "/Users/aljosaursakous/Desktop/Flag football HTML - APP"
./scripts/import-calf-achilles-knowledge.sh
```

### Option 2: SQL Import

```bash
supabase db execute -f database/seed-calf-achilles-knowledge.sql
```

### Option 3: Manual via Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Open SQL Editor
4. Copy/paste contents of seed-calf-achilles-knowledge.sql
5. Execute

## Verification

After import, verify with:

```sql
-- Check if imported
SELECT COUNT(*) FROM knowledge_base_entries WHERE topic LIKE 'calf_achilles_%';
-- Should return: 5

-- View all entries
SELECT topic, entry_type, evidence_strength
FROM knowledge_base_entries
WHERE topic LIKE 'calf_achilles_%';

-- Search by tag
SELECT topic, question
FROM knowledge_base_entries
WHERE 'achilles_tendinopathy' = ANY(tags);

-- Get rehabilitation protocols
SELECT topic, protocols
FROM knowledge_base_entries
WHERE entry_type = 'recovery_method' AND topic LIKE 'calf_achilles_%';
```

## Source Document Details

- **Title**: Practitioner's Guide to the Calf and Achilles Complex
- **Authors**: Sue Mayes (Australian Ballet, La Trobe University), VALD Performance Contributors
- **Publisher**: VALD Performance
- **Year**: 2024
- **Pages**: 37
- **Quality Score**: 9/10
- **Evidence Level**: B (Moderate-Strong)
- **Focus**: Sports science, injury prevention, isometric testing

## Key Insights for Flag Football

### Relevance to Your Athletes

**High-Risk Positions**:

- **Running Backs**: Repeated acceleration/deceleration
- **Wide Receivers**: Explosive starts, jumping
- **Defensive Backs**: Change of direction, backpedaling
- **All positions**: Sprint mechanics, agility

**Common Scenarios**:

- Achilles tendinopathy from high training volumes
- Calf strains during acceleration
- Chronic overload during speed work
- Inadequate calf strength for explosive movements

### Training Integration

1. **Pre-Season Screening**
   - Isometric calf testing (if equipment available)
   - Bilateral asymmetry assessment
   - Identify at-risk athletes

2. **In-Season Monitoring**
   - Track calf strength during heavy periods
   - Monitor for asymmetries
   - Early intervention for pain/dysfunction

3. **Injury Prevention Programs**
   - Eccentric calf training 2-3x/week
   - Progressive loading principles
   - Load management education

4. **Rehabilitation**
   - Evidence-based protocols for injuries
   - Objective return-to-play criteria
   - Progressive return to sprinting/cutting

## Next Steps

1. ✅ Import SQL file into Supabase
2. ✅ Verify data in database
3. ✅ Integrate with AI chat system
4. ✅ Add to athlete education materials
5. ✅ Create position-specific calf/Achilles programs
6. ✅ Implement injury prevention protocols

---

**Generated**: 2026-01-05
**Extraction Method**: Automated PDF parsing with pypdf
**Schema Version**: Compatible with migration 028_evidence_based_knowledge_base.sql
