#!/usr/bin/env python3
"""
Remove unused imports from Angular components based on NG8113 warnings
"""
import re
import sys
from pathlib import Path
from typing import Optional

# Map component names to their file patterns
UNUSED_IMPORTS = {
    'AchievementsComponent': ['ButtonComponent'],
    'AiCoachChatComponent': ['ButtonComponent'],
    'CoachDashboardComponent': ['ProgressBar'],
    'DataImportComponent': ['DatePipe'],
    'RosterPlayerCardComponent': ['ButtonComponent'],
    'SleepDebtComponent': ['DatePipe', 'ButtonComponent'],
    'PeriodizationDashboardComponent': ['ButtonComponent'],
    'WellnessCheckinComponent': ['Textarea'],
    'ImportDatasetComponent': ['ButtonComponent'],
    'QbAssessmentToolsComponent': ['MainLayoutComponent'],
    'QbTrainingScheduleComponent': ['MainLayoutComponent'],
    'TodayComponent': ['TodaysScheduleComponent'],
    'VideoCurationPendingComponent': ['ButtonComponent'],
    'VideoCurationPlaylistDialogComponent': ['ButtonComponent'],
    'VideoCurationPlaylistsComponent': ['ButtonComponent'],
    'VideoCurationSuggestionsComponent': ['ButtonComponent'],
    'VideoCurationVideoTableComponent': ['ButtonComponent'],
    'VideoCurationComponent': ['ButtonComponent'],
    'BodyCompositionCardComponent': ['AppLoadingComponent'],
    'CountdownTimerComponent': ['ButtonComponent'],
    'MorningBriefingComponent': ['AppLoadingComponent'],
}

def find_component_file(component_name: str, src_dir: Path) -> Optional[Path]:
    """Find the TypeScript file for a component"""
    # Convert ComponentName to component-name.component.ts
    # Simple heuristic: insert dash before capitals
    file_pattern = re.sub(r'([A-Z])', r'-\1', component_name).lower()[1:]
    file_pattern = file_pattern.replace('-component', '.component.ts')

    # Search for the file
    matches = list(src_dir.rglob(f'*{file_pattern}'))
    return matches[0] if matches else None

def remove_imports_from_file(file_path: Path, imports_to_remove: list[str]) -> bool:
    """Remove specified imports from a TypeScript file"""
    with open(file_path, 'r') as f:
        content = f.read()

    original_content = content
    modified = False

    for import_name in imports_to_remove:
        # Pattern 1: Remove from multi-line imports
        # Match: import { Foo, BarToRemove, Baz } from 'module';
        pattern1 = rf',\s*{import_name}\s*(?=,|\}})'
        if re.search(pattern1, content):
            content = re.sub(pattern1, '', content)
            modified = True

        # Pattern 2: Remove if it's the first import
        pattern2 = rf'{import_name}\s*,\s*'
        if re.search(pattern2, content):
            content = re.sub(pattern2, '', content)
            modified = True

        # Pattern 3: Remove entire line if it's the only import
        pattern3 = rf'import\s+{{\s*{import_name}\s*}}\s+from\s+[\'"][^\'"]+[\'"];?\s*\n'
        if re.search(pattern3, content):
            content = re.sub(pattern3, '', content)
            modified = True

    if modified:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"✓ Removed imports from {file_path.name}")
        return True
    return False

def main():
    src_dir = Path('src/app')
    count = 0

    print("Removing unused imports from components...")
    print()

    for component_name, imports_to_remove in UNUSED_IMPORTS.items():
        file_path = find_component_file(component_name, src_dir)
        if file_path and file_path.exists():
            if remove_imports_from_file(file_path, imports_to_remove):
                count += 1
        else:
            print(f"⚠ Could not find file for {component_name}")

    print()
    print(f"✅ Processed {count} files")

if __name__ == '__main__':
    main()
