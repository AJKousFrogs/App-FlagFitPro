# Large Component Decomposition Plan

## Overview
Breaking down components >1,000 LOC into focused sub-components for better maintainability.

## Strategy
1. Identify logical sections in template
2. Extract presentation logic into separate smart/presentational components
3. Keep state management in parent (smart component)
4. Each sub-component handles single responsibility

## Target: training-schedule.component.ts (1,297 LOC)

### Current Structure Analysis
- Main responsibilities:
  1. Training schedule data management
  2. Week view rendering
  3. Session editing
  4. Time-based scrolling
  5. Drag-and-drop functionality
  6. Error handling

### Proposed Breakdown

#### 1. training-schedule.component (Smart Component - 400-500 LOC)
- Responsibilities:
  - Load and manage schedule data
  - Handle session updates
  - Manage error states
  - Provide data to child components
  
- Signals to expose:
  - schedule
  - isLoading
  - error
  - selectedSession
  - showAddDialog

#### 2. training-schedule-week-grid.component (Presentation - 300-400 LOC)
- Responsibilities:
  - Render week grid layout
  - Display sessions
  - Handle click events
  - Time-based styling

- Inputs:
  - schedule: WeekSchedule
  - selectedSessionId: string
  
- Outputs:
  - sessionSelected: EventEmitter<Session>
  - sessionDoubleClicked: EventEmitter<Session>

#### 3. training-schedule-session-card.component (Presentation - 150-200 LOC)
- Responsibilities:
  - Display individual session
  - Show session details
  - Highlight selected state
  
- Inputs:
  - session: Session
  - isSelected: boolean
  - timeOfDay: string
  
- Outputs:
  - clicked: EventEmitter<Session>
  - doubleClicked: EventEmitter<Session>

#### 4. training-schedule-edit-dialog.component (Smart - 200-300 LOC)
- Responsibilities:
  - Handle session editing form
  - Save changes
  - Validate inputs

- Inputs:
  - session: Session
  - isVisible: boolean
  
- Outputs:
  - saved: EventEmitter<Session>
  - closed: EventEmitter<void>

#### 5. training-schedule-header.component (Presentation - 100-150 LOC)
- Responsibilities:
  - Display header info
  - Navigation controls
  - Current week indicator

### Migration Path
Phase 1: Extract presentation components (week-grid, session-card)
Phase 2: Extract dialog component
Phase 3: Refactor parent to use extracted components
Phase 4: Testing and validation

### Expected Outcome
- training-schedule.component: 1,297 LOC → 400-500 LOC (-60% reduction)
- 4 new focused components: 150-400 LOC each
- Better reusability
- Easier testing
- Clearer responsibility separation

## Similar Opportunities
- today.component.ts (1,354 LOC) → 500-600 LOC
- game-tracker.component.ts (1,206 LOC) → 400-500 LOC
- tournaments.component.ts (1,181 LOC) → 400-500 LOC

## Service Refactoring (Phase 2)
- acwr.service.ts (1,429 LOC) → Split into:
  - AcwrCalculationService (calculations)
  - AcwrDataService (data loading)
  - AcwrRiskService (risk assessment)
  - AcwrToleranceService (tolerance detection)

## Timeline to 10/10
1. Component decomposition: 2-3 days (600-800 lines saved)
2. Service refactoring: 1-2 days (400-600 lines saved)
3. Add test coverage: 1 day (target >75%)
4. Code review & polish: 0.5 days
