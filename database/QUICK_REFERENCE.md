# Shoulder Knowledge - Quick Reference

## Import to Database

```bash
cd "/Users/aljosaursakous/Desktop/Flag football HTML - APP"
./scripts/import-shoulder-knowledge.sh
```

## Verify Import

```sql
-- Check if imported
SELECT COUNT(*) FROM knowledge_base_entries WHERE topic LIKE 'shoulder_%';
-- Should return: 5

-- View all entries
SELECT topic, entry_type, evidence_strength
FROM knowledge_base_entries
WHERE topic LIKE 'shoulder_%';
```

## Query Examples

### Get All Shoulder Knowledge
```typescript
const { data } = await supabase
  .from('knowledge_base_entries')
  .select('*')
  .ilike('topic', 'shoulder_%');
```

### Get Injury Information
```typescript
const { data } = await supabase
  .from('knowledge_base_entries')
  .select('*')
  .eq('topic', 'shoulder_injuries_pathologies');
```

### Get Prehab/Training Info
```typescript
const { data } = await supabase
  .from('knowledge_base_entries')
  .select('*')
  .eq('topic', 'shoulder_prehab_training');
```

### Search by Tag
```typescript
const { data } = await supabase
  .from('knowledge_base_entries')
  .select('*')
  .contains('tags', ['rotator_cuff']);
```

### Get Rehabilitation Protocols
```typescript
const { data } = await supabase
  .from('knowledge_base_entries')
  .select('topic, protocols, best_practices')
  .eq('entry_type', 'recovery_method')
  .ilike('topic', 'shoulder_%');
```

## AI Chat Integration

```typescript
// Example: QB asks about shoulder health
async function getShoulderAdvice(athleteType: 'quarterback' | 'receiver') {
  const topics = athleteType === 'quarterback'
    ? ['shoulder_prehab_training', 'shoulder_injuries_pathologies']
    : ['shoulder_assessment_protocols', 'shoulder_prehab_training'];

  const { data } = await supabase
    .from('knowledge_base_entries')
    .select('question, answer, best_practices')
    .in('topic', topics);

  return data;
}
```

## Use Cases by Position

### Quarterbacks (Throwing Athletes)
- Topic: `shoulder_prehab_training`
- Topic: `shoulder_injuries_pathologies`
- Focus: Rotator cuff strength, throwing mechanics

### Wide Receivers (Overhead Athletes)
- Topic: `shoulder_assessment_protocols`
- Topic: `shoulder_prehab_training`
- Focus: Overhead stability, catching mechanics

### All Positions
- Topic: `shoulder_anatomy_biomechanics`
- Topic: `shoulder_rehabilitation` (if injured)

## Knowledge Entry Topics

| Topic | Type | Use For |
|-------|------|---------|
| `shoulder_anatomy_biomechanics` | training_method | Education, understanding basics |
| `shoulder_assessment_protocols` | training_method | Testing, monitoring |
| `shoulder_injuries_pathologies` | injury | Injury identification, prevention |
| `shoulder_rehabilitation` | recovery_method | Rehab programs, return to sport |
| `shoulder_prehab_training` | training_method | Injury prevention, training |

## Quick Stats

- **Total Knowledge Entries**: 5
- **Evidence Level**: Strong
- **Quality Score**: 9/10
- **Applicable To**: All athletes, especially overhead/throwing
- **Tags**: 28 unique tags
- **Best Practices**: 18 total items

## File Locations

```
database/
├── practitioners_guide_shoulders_knowledge.json  # JSON data
├── seed-shoulder-knowledge.sql                   # SQL import
├── SHOULDER_KNOWLEDGE_README.md                  # Full docs
├── IMPORT_SUMMARY.txt                            # Summary
└── QUICK_REFERENCE.md                            # This file

scripts/
└── import-shoulder-knowledge.sh                  # Import script
```

## Troubleshooting

### Import fails?
```bash
# Check if tables exist
supabase db execute --sql "SELECT * FROM information_schema.tables WHERE table_name IN ('research_articles', 'knowledge_base_entries');"

# If missing, run migration first
supabase db execute -f database/migrations/028_evidence_based_knowledge_base.sql
```

### Can't find data?
```sql
-- Check what's in database
SELECT * FROM knowledge_base_entries LIMIT 5;

-- Search for shoulder content
SELECT * FROM knowledge_base_entries WHERE answer ILIKE '%shoulder%';
```

### Need to re-import?
```sql
-- Delete existing entries first
DELETE FROM knowledge_base_entries WHERE topic LIKE 'shoulder_%';
DELETE FROM research_articles WHERE title = 'Practitioner''s Guide to Shoulders';

-- Then re-run import
```

## Next Steps

1. Import data: `./scripts/import-shoulder-knowledge.sh`
2. Verify: Check in Supabase dashboard
3. Integrate with AI chat
4. Add to QB training programs
5. Use in athlete education

---

**Created**: 2026-01-05
**Source**: Practitioners Guide to Shoulders (VALD Performance, 2024)
**Authors**: Jo Clubb, Ben Ashworth
