# Documentation Cleanup Plan

## Files to Delete (Obsolete/Redundant)

### Root Directory - Audit Files (Now Complete)
These were one-time audit reports that are now complete:
- `OBSOLETE_CODE_AUDIT.md` - Detailed audit (424 lines) - Move key info to AUDITS.md
- `CLEANUP_SUMMARY.md` - Cleanup completion summary (222 lines) - Task complete
- `OBSOLETE_CODE_QUICK_GUIDE.md` - Quick guide (146 lines) - Task complete

### docs/ - Redundant Audit Files
These are detailed audit reports that duplicate info now in AUDITS.md:
- `REDUNDANCY_AUDIT.md` - Detailed redundancy audit (520 lines) - Info consolidated
- `REDUNDANCY_AUDIT_SUMMARY.md` - Summary (146 lines) - Referenced in DOCUMENTATION.md
- `CONSISTENCY_CHECK.md` - Consistency check (279 lines) - Task complete
- `PHASE2_VALIDATION_CONSOLIDATION.md` - Phase 2 report (197 lines) - Task complete

## Files to Keep

### Root Directory
- `README.md` - Main project readme
- `CHANGELOG.md` - Version history
- `cleanup-obsolete-code.sh` - Useful script for future cleanups

### docs/ - All Core Documentation
All other docs/ files are actively used and referenced in DOCUMENTATION.md

## Rationale

1. **OBSOLETE_CODE_AUDIT.md** et al. were one-time reports for completed tasks
2. **REDUNDANCY_AUDIT*.md** files contain detailed findings that have been addressed
3. **CONSISTENCY_CHECK.md** was a one-time verification task
4. **PHASE2_VALIDATION_CONSOLIDATION.md** documents a completed migration

All useful information from these files is already consolidated in:
- `docs/AUDITS.md` - High-level summary
- `docs/DOCUMENTATION.md` - Documentation index
- Git history - Full details preserved

## Impact

- **Lines removed**: ~1,934 lines of completed audit documentation
- **Files removed**: 7 obsolete markdown files
- **Maintainability**: Reduced documentation sprawl
- **Clarity**: Focus on active documentation only
