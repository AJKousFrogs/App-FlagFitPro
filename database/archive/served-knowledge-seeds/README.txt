One-time knowledge-base seed SQL, already applied to production. Confirmed
2026-07-02: knowledge_base_entries has 104 live rows, matching the count these
seeds were meant to produce (docs/SOURCE_OF_TRUTH.md's documented figure).

Archived rather than deleted so the content is still available for reference
or to re-seed a fresh environment. Not referenced by any script — safe to
delete outright if that's ever confirmed unnecessary. Canonical migrations
live in supabase/migrations/; this is seed data, not schema.
