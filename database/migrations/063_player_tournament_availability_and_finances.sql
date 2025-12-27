-- ============================================================================
-- Migration: Player Tournament Availability & Financial Planning
-- Description: Adds tables for player tournament availability, cost tracking,
--              roster audit log, and invitation management improvements
-- Created: 2024-12-27
-- ============================================================================

-- =============================================================================
-- 1. PLAYER TOURNAMENT AVAILABILITY
-- =============================================================================
-- Players can indicate which tournaments they will/won't attend

CREATE TABLE IF NOT EXISTS player_tournament_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Availability status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'confirmed',      -- Player will attend
        'declined',       -- Player cannot attend
        'tentative',      -- Player unsure
        'pending'         -- Player hasn't responded
    )),
    
    -- Additional details
    reason TEXT,                           -- Reason if declined/tentative
    arrival_date DATE,                     -- When player arrives (if different from tournament start)
    departure_date DATE,                   -- When player leaves (if different from tournament end)
    accommodation_needed BOOLEAN DEFAULT true,
    transportation_needed BOOLEAN DEFAULT false,
    dietary_restrictions TEXT,
    
    -- Financial commitment
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
        'not_required',   -- No payment needed
        'pending',        -- Payment not yet made
        'partial',        -- Partial payment made
        'paid',           -- Fully paid
        'waived'          -- Fee waived
    )),
    amount_due DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    payment_deadline DATE,
    
    -- Timestamps
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint - one response per player per tournament
    UNIQUE(player_id, tournament_id)
);

-- =============================================================================
-- 2. TOURNAMENT COSTS/BUDGET
-- =============================================================================
-- Track costs associated with each tournament

CREATE TABLE IF NOT EXISTS tournament_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Registration & Entry
    registration_fee DECIMAL(10,2) DEFAULT 0,
    entry_fee_per_player DECIMAL(10,2) DEFAULT 0,
    
    -- Travel
    estimated_travel_cost DECIMAL(10,2) DEFAULT 0,
    actual_travel_cost DECIMAL(10,2),
    travel_notes TEXT,
    
    -- Accommodation
    accommodation_cost_per_night DECIMAL(10,2) DEFAULT 0,
    total_nights INTEGER DEFAULT 0,
    estimated_accommodation_total DECIMAL(10,2) DEFAULT 0,
    actual_accommodation_cost DECIMAL(10,2),
    accommodation_notes TEXT,
    
    -- Meals & Per Diem
    per_diem_per_player DECIMAL(10,2) DEFAULT 0,
    estimated_meals_total DECIMAL(10,2) DEFAULT 0,
    actual_meals_cost DECIMAL(10,2),
    
    -- Equipment & Other
    equipment_cost DECIMAL(10,2) DEFAULT 0,
    other_costs DECIMAL(10,2) DEFAULT 0,
    other_costs_description TEXT,
    
    -- Totals
    total_estimated_cost DECIMAL(10,2) GENERATED ALWAYS AS (
        COALESCE(registration_fee, 0) + 
        COALESCE(estimated_travel_cost, 0) + 
        COALESCE(estimated_accommodation_total, 0) + 
        COALESCE(estimated_meals_total, 0) + 
        COALESCE(equipment_cost, 0) + 
        COALESCE(other_costs, 0)
    ) STORED,
    
    -- Funding
    team_contribution DECIMAL(10,2) DEFAULT 0,
    sponsor_contribution DECIMAL(10,2) DEFAULT 0,
    player_share_per_person DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    budget_status VARCHAR(20) DEFAULT 'draft' CHECK (budget_status IN (
        'draft',
        'pending_approval',
        'approved',
        'finalized'
    )),
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tournament_id, team_id)
);

-- =============================================================================
-- 3. PLAYER PAYMENTS/TRANSACTIONS
-- =============================================================================
-- Track individual player payments

CREATE TABLE IF NOT EXISTS player_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    
    -- Payment details
    payment_type VARCHAR(30) NOT NULL CHECK (payment_type IN (
        'tournament_fee',
        'membership_fee',
        'equipment',
        'travel',
        'accommodation',
        'other'
    )),
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    
    -- Payment method
    payment_method VARCHAR(20) CHECK (payment_method IN (
        'cash',
        'bank_transfer',
        'card',
        'paypal',
        'other'
    )),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'completed',
        'refunded',
        'cancelled'
    )),
    
    -- Reference
    reference_number VARCHAR(100),
    receipt_url TEXT,
    
    -- Timestamps
    due_date DATE,
    paid_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. SPONSOR CONTRIBUTIONS
-- =============================================================================
-- Track sponsor contributions for tournaments/team

CREATE TABLE IF NOT EXISTS sponsor_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    
    -- Sponsor info
    sponsor_name VARCHAR(255) NOT NULL,
    sponsor_contact_email VARCHAR(255),
    sponsor_contact_phone VARCHAR(50),
    
    -- Contribution details
    contribution_type VARCHAR(30) CHECK (contribution_type IN (
        'monetary',
        'equipment',
        'travel',
        'accommodation',
        'services',
        'other'
    )),
    monetary_value DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pledged' CHECK (status IN (
        'pledged',
        'confirmed',
        'received',
        'cancelled'
    )),
    
    -- Agreement
    agreement_date DATE,
    fulfillment_date DATE,
    contract_url TEXT,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 5. ROSTER AUDIT LOG
-- =============================================================================
-- Track all changes to roster for history/compliance

CREATE TABLE IF NOT EXISTS roster_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- What changed
    action VARCHAR(30) NOT NULL CHECK (action IN (
        'player_added',
        'player_removed',
        'player_updated',
        'status_changed',
        'role_changed',
        'jersey_changed',
        'invitation_sent',
        'invitation_accepted',
        'invitation_declined',
        'invitation_cancelled',
        'bulk_update'
    )),
    
    -- Who/what was affected
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN (
        'player',
        'staff',
        'invitation'
    )),
    target_id UUID,
    target_name VARCHAR(255),
    
    -- Change details
    old_values JSONB,
    new_values JSONB,
    
    -- Who made the change
    performed_by UUID REFERENCES auth.users(id),
    performed_by_name VARCHAR(255),
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 6. INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_player_tournament_availability_player ON player_tournament_availability(player_id);
CREATE INDEX IF NOT EXISTS idx_player_tournament_availability_tournament ON player_tournament_availability(tournament_id);
CREATE INDEX IF NOT EXISTS idx_player_tournament_availability_team ON player_tournament_availability(team_id);
CREATE INDEX IF NOT EXISTS idx_player_tournament_availability_status ON player_tournament_availability(status);

CREATE INDEX IF NOT EXISTS idx_tournament_budgets_tournament ON tournament_budgets(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_budgets_team ON tournament_budgets(team_id);

CREATE INDEX IF NOT EXISTS idx_player_payments_player ON player_payments(player_id);
CREATE INDEX IF NOT EXISTS idx_player_payments_team ON player_payments(team_id);
CREATE INDEX IF NOT EXISTS idx_player_payments_tournament ON player_payments(tournament_id);
CREATE INDEX IF NOT EXISTS idx_player_payments_status ON player_payments(status);

CREATE INDEX IF NOT EXISTS idx_sponsor_contributions_team ON sponsor_contributions(team_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_contributions_tournament ON sponsor_contributions(tournament_id);

CREATE INDEX IF NOT EXISTS idx_roster_audit_log_team ON roster_audit_log(team_id);
CREATE INDEX IF NOT EXISTS idx_roster_audit_log_action ON roster_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_roster_audit_log_target ON roster_audit_log(target_id);
CREATE INDEX IF NOT EXISTS idx_roster_audit_log_created ON roster_audit_log(created_at DESC);

-- =============================================================================
-- 7. TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE TRIGGER update_player_tournament_availability_updated_at
    BEFORE UPDATE ON player_tournament_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_budgets_updated_at
    BEFORE UPDATE ON tournament_budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_payments_updated_at
    BEFORE UPDATE ON player_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsor_contributions_updated_at
    BEFORE UPDATE ON sponsor_contributions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 8. RLS POLICIES
-- =============================================================================

ALTER TABLE player_tournament_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_audit_log ENABLE ROW LEVEL SECURITY;

-- Player Tournament Availability Policies
CREATE POLICY "Team members can view tournament availability"
    ON player_tournament_availability FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.team_id = player_tournament_availability.team_id 
        AND team_members.user_id = auth.uid()
    ));

CREATE POLICY "Players can update own availability"
    ON player_tournament_availability FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.id = player_tournament_availability.player_id 
        AND team_members.user_id = auth.uid()
    ));

CREATE POLICY "Coaches can manage all availability"
    ON player_tournament_availability FOR ALL
    USING (is_team_coach_or_higher(auth.uid(), team_id));

-- Tournament Budgets Policies
CREATE POLICY "Team members can view budgets"
    ON tournament_budgets FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.team_id = tournament_budgets.team_id 
        AND team_members.user_id = auth.uid()
    ));

CREATE POLICY "Coaches can manage budgets"
    ON tournament_budgets FOR ALL
    USING (is_team_coach_or_higher(auth.uid(), team_id));

-- Player Payments Policies
CREATE POLICY "Players can view own payments"
    ON player_payments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.id = player_payments.player_id 
        AND team_members.user_id = auth.uid()
    ));

CREATE POLICY "Coaches can view all team payments"
    ON player_payments FOR SELECT
    USING (is_team_coach_or_higher(auth.uid(), team_id));

CREATE POLICY "Coaches can manage payments"
    ON player_payments FOR ALL
    USING (is_team_coach_or_higher(auth.uid(), team_id));

-- Sponsor Contributions Policies
CREATE POLICY "Team members can view sponsors"
    ON sponsor_contributions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.team_id = sponsor_contributions.team_id 
        AND team_members.user_id = auth.uid()
    ));

CREATE POLICY "Owners/admins can manage sponsors"
    ON sponsor_contributions FOR ALL
    USING (is_team_owner_or_admin(auth.uid(), team_id));

-- Roster Audit Log Policies
CREATE POLICY "Coaches can view audit log"
    ON roster_audit_log FOR SELECT
    USING (is_team_coach_or_higher(auth.uid(), team_id));

CREATE POLICY "System can insert audit log"
    ON roster_audit_log FOR INSERT
    WITH CHECK (true);

-- =============================================================================
-- 9. HELPER FUNCTIONS
-- =============================================================================

-- Function to get tournament availability summary
CREATE OR REPLACE FUNCTION get_tournament_availability_summary(p_tournament_id UUID, p_team_id UUID)
RETURNS TABLE (
    confirmed_count INTEGER,
    declined_count INTEGER,
    tentative_count INTEGER,
    pending_count INTEGER,
    total_players INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE pta.status = 'confirmed')::INTEGER as confirmed_count,
        COUNT(*) FILTER (WHERE pta.status = 'declined')::INTEGER as declined_count,
        COUNT(*) FILTER (WHERE pta.status = 'tentative')::INTEGER as tentative_count,
        COUNT(*) FILTER (WHERE pta.status = 'pending')::INTEGER as pending_count,
        COUNT(*)::INTEGER as total_players
    FROM team_members tm
    LEFT JOIN player_tournament_availability pta 
        ON tm.id = pta.player_id AND pta.tournament_id = p_tournament_id
    WHERE tm.team_id = p_team_id AND tm.role = 'player';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate tournament cost per player
CREATE OR REPLACE FUNCTION calculate_player_tournament_cost(p_tournament_id UUID, p_team_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_budget tournament_budgets%ROWTYPE;
    v_confirmed_players INTEGER;
    v_cost_per_player DECIMAL(10,2);
BEGIN
    -- Get budget
    SELECT * INTO v_budget 
    FROM tournament_budgets 
    WHERE tournament_id = p_tournament_id AND team_id = p_team_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Get confirmed player count
    SELECT COUNT(*) INTO v_confirmed_players
    FROM player_tournament_availability
    WHERE tournament_id = p_tournament_id 
    AND team_id = p_team_id 
    AND status = 'confirmed';
    
    IF v_confirmed_players = 0 THEN
        RETURN 0;
    END IF;
    
    -- Calculate cost per player
    v_cost_per_player := (
        v_budget.total_estimated_cost - 
        COALESCE(v_budget.team_contribution, 0) - 
        COALESCE(v_budget.sponsor_contribution, 0)
    ) / v_confirmed_players;
    
    RETURN GREATEST(v_cost_per_player, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log roster changes
CREATE OR REPLACE FUNCTION log_roster_change(
    p_team_id UUID,
    p_action VARCHAR(30),
    p_target_type VARCHAR(20),
    p_target_id UUID,
    p_target_name VARCHAR(255),
    p_old_values JSONB,
    p_new_values JSONB
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_performer_name VARCHAR(255);
BEGIN
    -- Get performer name
    SELECT COALESCE(raw_user_meta_data->>'full_name', email)
    INTO v_performer_name
    FROM auth.users
    WHERE id = auth.uid();
    
    INSERT INTO roster_audit_log (
        team_id, action, target_type, target_id, target_name,
        old_values, new_values, performed_by, performed_by_name
    ) VALUES (
        p_team_id, p_action, p_target_type, p_target_id, p_target_name,
        p_old_values, p_new_values, auth.uid(), v_performer_name
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_tournament_availability_summary TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_player_tournament_cost TO authenticated;
GRANT EXECUTE ON FUNCTION log_roster_change TO authenticated;
