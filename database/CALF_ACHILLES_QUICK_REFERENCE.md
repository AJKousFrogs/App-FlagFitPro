# Calf & Achilles Knowledge - Quick Reference

## Import to Database

```bash
cd "/Users/aljosaursakous/Desktop/Flag football HTML - APP"
./scripts/import-calf-achilles-knowledge.sh
```

## Verify Import

```sql
-- Check if imported
SELECT COUNT(*) FROM knowledge_base_entries WHERE topic LIKE 'calf_achilles_%';
-- Should return: 5

-- View all entries
SELECT topic, entry_type, evidence_strength
FROM knowledge_base_entries
WHERE topic LIKE 'calf_achilles_%';
```

## Query Examples

### Get All Calf/Achilles Knowledge
```typescript
const { data } = await supabase
  .from('knowledge_base_entries')
  .select('*')
  .ilike('topic', 'calf_achilles_%');
```

### Get Injury Information
```typescript
const { data } = await supabase
  .from('knowledge_base_entries')
  .select('*')
  .eq('topic', 'calf_achilles_injuries_pathologies');
```

### Get Rehabilitation Protocols
```typescript
const { data } = await supabase
  .from('knowledge_base_entries')
  .select('topic, protocols, best_practices')
  .eq('topic', 'calf_achilles_rehabilitation');
```

### Search for Tendinopathy Info
```typescript
const { data } = await supabase
  .from('knowledge_base_entries')
  .select('*')
  .contains('tags', ['achilles_tendinopathy']);
```

### Get Prevention Strategies
```typescript
const { data } = await supabase
  .from('knowledge_base_entries')
  .select('*')
  .eq('topic', 'calf_achilles_injury_prevention');
```

## AI Chat Integration

```typescript
// Example: Athlete reports Achilles pain
async function handleAchillesPain(athleteId: string) {
  // Get injury and rehab information
  const { data } = await supabase
    .from('knowledge_base_entries')
    .select('question, answer, best_practices, contraindications')
    .in('topic', [
      'calf_achilles_injuries_pathologies',
      'calf_achilles_rehabilitation'
    ]);

  return data;
}

// Example: Injury prevention for runners
async function getRunningPreventionTips() {
  const { data } = await supabase
    .from('knowledge_base_entries')
    .select('best_practices, protocols')
    .eq('topic', 'calf_achilles_injury_prevention')
    .single();

  return data?.best_practices;
}
```

## Use Cases by Position

### Running Backs (High Risk)
- Topic: `calf_achilles_injury_prevention`
- Topic: `calf_achilles_assessment_protocols`
- Focus: Acceleration mechanics, load management

### Wide Receivers & Defensive Backs
- Topic: `calf_achilles_injury_prevention`
- Topic: `calf_achilles_injuries_pathologies`
- Focus: Explosive movements, change of direction

### All Positions
- Topic: `calf_achilles_anatomy_biomechanics`
- Topic: `calf_achilles_assessment_protocols`
- Topic: `calf_achilles_rehabilitation` (if injured)

## Knowledge Entry Topics

| Topic | Type | Use For |
|-------|------|---------|
| `calf_achilles_anatomy_biomechanics` | training_method | Education, understanding basics |
| `calf_achilles_assessment_protocols` | training_method | Testing, monitoring strength |
| `calf_achilles_injuries_pathologies` | injury | Injury identification, risk factors |
| `calf_achilles_rehabilitation` | recovery_method | Rehab programs, return to play |
| `calf_achilles_injury_prevention` | training_method | Prevention programs, screening |

## Common Injuries Covered

1. **Achilles Tendinopathy** (Most Common)
   - Overuse injury
   - Progressive loading treatment
   - Eccentric training essential

2. **Calf Strains**
   - Acute muscle tears
   - Usually medial gastrocnemius
   - Occurs during acceleration

3. **Achilles Ruptures**
   - Complete tendon failure
   - Often with tendinopathy history
   - Requires surgery typically

4. **Plantaris Injuries**
   - Often misdiagnosed
   - Can mimic calf strain

## Key Protocols

### Assessment Protocol
```json
{
  "equipment": ["ForceFrame", "ForceDecks"],
  "test_positions": [
    "knee_straight_gastrocnemius",
    "knee_bent_soleus"
  ],
  "metrics": [
    "peak_force",
    "rate_of_force_development",
    "bilateral_asymmetry"
  ],
  "frequency": "weekly_during_rehab_monthly_for_monitoring"
}
```

### Rehabilitation Phases
```json
{
  "phases": [
    "pain_management_isometric",
    "heavy_slow_resistance_training",
    "eccentric_loading",
    "plyometric_training",
    "return_to_sport"
  ],
  "return_to_sport_criteria": ">90%_strength_bilateral_symmetry"
}
```

## Quick Stats

- **Total Knowledge Entries**: 5
- **Evidence Level**: Strong
- **Quality Score**: 9/10
- **Applicable To**: All athletes, especially running/jumping
- **Focus**: Running athletes, court sports, field sports
- **Tags**: 28 unique tags
- **Best Practices**: 24 total items

## File Locations

```
database/
├── practitioners_guide_calf_achilles_knowledge.json  # JSON data
├── seed-calf-achilles-knowledge.sql                  # SQL import
├── CALF_ACHILLES_KNOWLEDGE_README.md                 # Full docs
└── CALF_ACHILLES_QUICK_REFERENCE.md                  # This file

scripts/
└── import-calf-achilles-knowledge.sh                 # Import script
```

## Critical Best Practices

### For Prevention
1. Regular calf strengthening (both gastrocnemius and soleus)
2. Eccentric training programs
3. Monitor training loads - avoid spikes
4. Address bilateral asymmetries >10%
5. Progressive load increases (<10% per week)

### For Rehabilitation
1. Progressive loading (not rest) for tendinopathy
2. Isometric exercises for pain management
3. Heavy slow resistance builds tendon capacity
4. Eccentric training essential for Achilles
5. Achieve >90% strength before return to sport

### For Assessment
1. Test both knee-straight and knee-bent positions
2. Use objective force measurement
3. Monitor asymmetries (<10% ideal)
4. Regular monitoring for injury prevention
5. Track rate of force development

## Troubleshooting

### Import fails?
```bash
# Check if tables exist
supabase db execute --sql "
  SELECT * FROM information_schema.tables
  WHERE table_name IN ('research_articles', 'knowledge_base_entries');
"

# If missing, run migration first
supabase db execute -f database/migrations/028_evidence_based_knowledge_base.sql
```

### Need to re-import?
```sql
-- Delete existing entries first
DELETE FROM knowledge_base_entries WHERE topic LIKE 'calf_achilles_%';
DELETE FROM research_articles
WHERE title = 'Practitioner''s Guide to the Calf and Achilles Complex';

-- Then re-run import
```

## Integration with Training Programs

### Pre-Season
- Screen all athletes for calf strength
- Identify bilateral asymmetries
- Implement prevention programs for at-risk athletes

### In-Season
- Monitor calf strength during heavy periods
- Early intervention for pain/tightness
- Load management for high-volume weeks

### Injury Occurred
- Use evidence-based rehab protocols
- Objective return-to-play criteria
- Progressive return to sprinting/cutting

## Next Steps

1. Import data: `./scripts/import-calf-achilles-knowledge.sh`
2. Verify: Check in Supabase dashboard
3. Integrate with AI chat for injury questions
4. Add to training programs (eccentric exercises)
5. Implement screening protocols
6. Create position-specific prevention programs

---

**Created**: 2026-01-05
**Source**: Practitioners Guide to the Calf and Achilles Complex (VALD Performance, 2024)
**Author**: Sue Mayes (Australian Ballet, La Trobe University)
