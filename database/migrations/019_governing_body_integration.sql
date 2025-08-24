-- Migration: Governing Body Integration System
-- Description: Integration with IFAF, Olympic Committee, and research institutions
-- Created: 2025-08-03
-- Supports: Official compliance, research data submission, certification tracking, institutional partnerships

-- =============================================================================
-- GOVERNING BODIES AND INSTITUTIONS
-- =============================================================================

-- Official governing bodies and research institutions
CREATE TABLE governing_bodies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Organization details
    organization_name VARCHAR(255) NOT NULL UNIQUE,
    organization_acronym VARCHAR(20) NOT NULL UNIQUE,
    organization_type VARCHAR(100) NOT NULL, -- 'governing_body', 'research_institution', 'certification_body', 'olympic_committee'
    
    -- Contact information
    headquarters_country VARCHAR(100) NOT NULL,
    headquarters_city VARCHAR(100),
    website_url TEXT NOT NULL,
    official_email VARCHAR(255),
    phone_number VARCHAR(50),
    
    -- API integration details
    api_base_url TEXT,
    api_version VARCHAR(20),
    api_key_required BOOLEAN DEFAULT false,
    authentication_type VARCHAR(50), -- 'api_key', 'oauth2', 'basic_auth', 'certificate'
    
    -- Data exchange capabilities
    supports_data_submission BOOLEAN DEFAULT false,
    supports_certification_query BOOLEAN DEFAULT false,
    supports_standards_sync BOOLEAN DEFAULT false,
    supports_athlete_verification BOOLEAN DEFAULT false,
    
    -- Integration status
    integration_status VARCHAR(50) DEFAULT 'inactive', -- 'active', 'inactive', 'testing', 'maintenance'
    last_successful_sync TIMESTAMP,
    sync_frequency_hours INTEGER DEFAULT 24,
    
    -- Data formats supported
    supported_data_formats TEXT[], -- ['json', 'xml', 'csv', 'pdf']
    required_data_fields JSONB, -- Field mappings for data submission
    
    -- Compliance and certification
    certification_types_offered TEXT[], -- Types of certifications this body provides
    compliance_standards TEXT[], -- Standards they enforce
    audit_requirements TEXT[],
    
    -- Research collaboration
    research_collaboration BOOLEAN DEFAULT false,
    data_sharing_agreements BOOLEAN DEFAULT false,
    publication_requirements TEXT[],
    anonymization_required BOOLEAN DEFAULT true,
    
    -- Geographic scope
    geographic_jurisdiction TEXT[], -- Countries/regions under jurisdiction
    olympic_recognition BOOLEAN DEFAULT false,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    partnership_start_date DATE,
    partnership_end_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- COMPLIANCE STANDARDS AND REQUIREMENTS
-- =============================================================================

-- Official compliance standards and requirements
CREATE TABLE compliance_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    governing_body_id UUID NOT NULL REFERENCES governing_bodies(id) ON DELETE CASCADE,
    
    -- Standard details
    standard_name VARCHAR(255) NOT NULL,
    standard_code VARCHAR(100) NOT NULL, -- Official code/identifier
    standard_version VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'athlete_safety', 'data_privacy', 'competition_rules', 'anti_doping'
    
    -- Standard requirements
    description TEXT NOT NULL,
    requirements JSONB NOT NULL, -- Detailed requirements structure
    compliance_criteria TEXT[] NOT NULL,
    documentation_required TEXT[],
    
    -- Implementation details
    implementation_deadline DATE,
    mandatory BOOLEAN DEFAULT true,
    applies_to_athletes BOOLEAN DEFAULT true,
    applies_to_organizations BOOLEAN DEFAULT true,
    
    -- Compliance measurement
    compliance_metrics TEXT[], -- How compliance is measured
    audit_frequency VARCHAR(50), -- 'annual', 'biannual', 'quarterly', 'monthly'
    self_assessment_allowed BOOLEAN DEFAULT false,
    
    -- Penalties for non-compliance
    penalty_framework JSONB, -- Structure of penalties
    warning_thresholds JSONB,
    suspension_criteria TEXT[],
    
    -- Geographic and temporal scope
    effective_date DATE NOT NULL,
    expiry_date DATE,
    geographic_scope TEXT[], -- Where this standard applies
    
    -- Related standards
    supersedes_standard_id UUID REFERENCES compliance_standards(id),
    related_standards UUID[], -- Array of related standard IDs
    
    -- Change tracking
    last_updated_date DATE NOT NULL,
    change_summary TEXT,
    notification_sent BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(governing_body_id, standard_code, standard_version)
);

-- =============================================================================
-- ATHLETE CERTIFICATIONS AND VERIFICATIONS
-- =============================================================================

-- Athlete certifications from governing bodies
CREATE TABLE athlete_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    governing_body_id UUID NOT NULL REFERENCES governing_bodies(id),
    
    -- Certification details
    certification_type VARCHAR(100) NOT NULL, -- 'athlete_registration', 'anti_doping', 'medical_clearance', 'eligibility'
    certification_name VARCHAR(255) NOT NULL,
    certification_number VARCHAR(255), -- Official certification number
    
    -- Status and validity
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'expired', 'revoked', 'suspended'
    issue_date DATE,
    expiry_date DATE,
    last_verification_date DATE,
    
    -- Certification data
    certification_data JSONB, -- All certification-specific data
    supporting_documents TEXT[], -- URLs or references to supporting documents
    
    -- Verification process
    verification_method VARCHAR(100), -- 'api_query', 'manual_upload', 'third_party_verification'
    verification_status VARCHAR(50) DEFAULT 'unverified', -- 'verified', 'unverified', 'failed', 'pending'
    verification_attempts INTEGER DEFAULT 0,
    last_verification_error TEXT,
    
    -- Compliance tracking
    compliance_requirements_met BOOLEAN DEFAULT false,
    outstanding_requirements TEXT[],
    compliance_notes TEXT,
    
    -- Renewal tracking
    renewal_required BOOLEAN DEFAULT true,
    renewal_notification_sent BOOLEAN DEFAULT false,
    auto_renewal_enabled BOOLEAN DEFAULT false,
    
    -- Integration metadata
    external_reference_id VARCHAR(255), -- ID in the governing body's system
    sync_status VARCHAR(50) DEFAULT 'pending', -- 'synced', 'pending', 'failed', 'conflict'
    last_sync_attempt TIMESTAMP,
    sync_error_message TEXT,
    
    -- Notes and comments
    internal_notes TEXT,
    athlete_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- RESEARCH DATA SUBMISSIONS
-- =============================================================================

-- Data submissions to research institutions
CREATE TABLE research_data_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    governing_body_id UUID NOT NULL REFERENCES governing_bodies(id),
    
    -- Submission details
    submission_title VARCHAR(255) NOT NULL,
    submission_type VARCHAR(100) NOT NULL, -- 'performance_data', 'injury_data', 'training_data', 'nutrition_data'
    research_project_name VARCHAR(255),
    principal_investigator VARCHAR(255),
    
    -- Data details
    data_period_start DATE NOT NULL,
    data_period_end DATE NOT NULL,
    athlete_count INTEGER NOT NULL,
    data_points_count BIGINT NOT NULL,
    
    -- Data composition
    included_data_types TEXT[] NOT NULL, -- Types of data included
    exclusion_criteria TEXT[], -- What data was excluded and why
    anonymization_method VARCHAR(100) NOT NULL,
    
    -- Consent and privacy
    athlete_consent_obtained BOOLEAN NOT NULL DEFAULT false,
    consent_type VARCHAR(100), -- 'explicit', 'opt_in', 'opt_out', 'anonymous'
    privacy_level VARCHAR(50) NOT NULL, -- 'anonymous', 'pseudonymous', 'identifiable'
    
    -- Data quality
    data_quality_score DECIMAL(3,2) CHECK (data_quality_score BETWEEN 0 AND 1),
    completeness_percentage DECIMAL(5,2),
    validation_checks_passed BOOLEAN DEFAULT false,
    known_limitations TEXT[],
    
    -- Submission process
    submission_method VARCHAR(100), -- 'api_upload', 'secure_transfer', 'physical_media', 'cloud_sync'
    submission_status VARCHAR(50) NOT NULL DEFAULT 'preparing', -- 'preparing', 'submitted', 'under_review', 'accepted', 'rejected'
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    
    -- Review and feedback
    reviewer_name VARCHAR(255),
    review_comments TEXT,
    acceptance_conditions TEXT[],
    rejection_reasons TEXT[],
    
    -- Data usage and publications
    intended_use TEXT NOT NULL,
    publication_restrictions TEXT[],
    data_retention_period_months INTEGER,
    destruction_date DATE,
    
    -- Attribution and citation
    citation_requirements TEXT,
    acknowledgment_text TEXT,
    co_authorship_offered BOOLEAN DEFAULT false,
    
    -- Technical details
    file_format VARCHAR(50),
    file_size_mb DECIMAL(10,2),
    encryption_used BOOLEAN DEFAULT true,
    checksum_verification VARCHAR(255),
    
    -- Compliance and ethics
    ethics_approval_number VARCHAR(100),
    institutional_approval BOOLEAN DEFAULT false,
    data_sharing_agreement_signed BOOLEAN DEFAULT false,
    
    -- Follow-up tracking
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    additional_data_requested BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- OFFICIAL COMMUNICATIONS AND UPDATES
-- =============================================================================

-- Communications from governing bodies
CREATE TABLE governing_body_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    governing_body_id UUID NOT NULL REFERENCES governing_bodies(id),
    
    -- Communication details
    communication_type VARCHAR(100) NOT NULL, -- 'rule_update', 'compliance_notice', 'certification_update', 'research_request'
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    
    -- Targeting
    target_audience VARCHAR(100) NOT NULL, -- 'all_athletes', 'coaches', 'organizations', 'specific_users'
    target_user_ids UUID[], -- Specific users if targeted
    geographic_targeting TEXT[], -- Specific countries/regions
    
    -- Priority and urgency
    priority_level VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high', 'urgent', 'critical'
    requires_acknowledgment BOOLEAN DEFAULT false,
    action_required BOOLEAN DEFAULT false,
    deadline DATE,
    
    -- Content details
    attachments TEXT[], -- URLs to attachments
    related_standards UUID[], -- Related compliance standards
    related_certifications TEXT[], -- Related certification types
    
    -- Distribution tracking
    sent_at TIMESTAMP,
    total_recipients INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    acknowledged_count INTEGER DEFAULT 0,
    
    -- Follow-up tracking
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    reminder_sent BOOLEAN DEFAULT false,
    
    -- Language and localization
    original_language VARCHAR(10) DEFAULT 'en',
    translations_available TEXT[], -- Available translation languages
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'approved', 'sent', 'archived'
    approved_by VARCHAR(255),
    approval_date TIMESTAMP,
    
    -- Metadata
    external_reference VARCHAR(255), -- Reference in governing body's system
    tags TEXT[], -- For categorization and searching
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- API INTEGRATION LOGS
-- =============================================================================

-- API integration activity logs
CREATE TABLE governing_body_api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    governing_body_id UUID NOT NULL REFERENCES governing_bodies(id),
    
    -- API call details
    api_endpoint VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    request_type VARCHAR(100) NOT NULL, -- 'data_submission', 'certification_query', 'compliance_check', 'sync'
    
    -- Request details
    request_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    request_size_bytes INTEGER,
    request_headers JSONB,
    request_body_summary TEXT, -- Summary of request body (no sensitive data)
    
    -- Response details
    response_timestamp TIMESTAMP,
    response_status_code INTEGER,
    response_size_bytes INTEGER,
    response_time_ms INTEGER,
    response_headers JSONB,
    
    -- Success/failure tracking
    success BOOLEAN NOT NULL,
    error_code VARCHAR(100),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Data processing
    records_processed INTEGER DEFAULT 0,
    records_successful INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    processing_notes TEXT,
    
    -- Rate limiting
    rate_limit_remaining INTEGER,
    rate_limit_reset_time TIMESTAMP,
    rate_limited BOOLEAN DEFAULT false,
    
    -- Security and compliance
    authentication_method VARCHAR(50),
    encryption_used BOOLEAN DEFAULT true,
    data_classification VARCHAR(50), -- 'public', 'internal', 'confidential', 'restricted'
    
    -- Monitoring and alerting
    alert_triggered BOOLEAN DEFAULT false,
    alert_type VARCHAR(100),
    performance_threshold_exceeded BOOLEAN DEFAULT false,
    
    -- Context
    user_id UUID REFERENCES users(id), -- User who triggered the API call
    related_submission_id UUID REFERENCES research_data_submissions(id),
    related_certification_id UUID REFERENCES athlete_certifications(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Governing bodies indexes
CREATE INDEX idx_governing_bodies_type ON governing_bodies(organization_type);
CREATE INDEX idx_governing_bodies_status ON governing_bodies(integration_status);
CREATE INDEX idx_governing_bodies_country ON governing_bodies(headquarters_country);
CREATE INDEX idx_governing_bodies_active ON governing_bodies(is_active);

-- Compliance standards indexes
CREATE INDEX idx_compliance_standards_body ON compliance_standards(governing_body_id);
CREATE INDEX idx_compliance_standards_category ON compliance_standards(category);
CREATE INDEX idx_compliance_standards_mandatory ON compliance_standards(mandatory);
CREATE INDEX idx_compliance_standards_effective ON compliance_standards(effective_date, expiry_date);

-- Athlete certifications indexes
CREATE INDEX idx_athlete_certifications_user ON athlete_certifications(user_id);
CREATE INDEX idx_athlete_certifications_body ON athlete_certifications(governing_body_id);
CREATE INDEX idx_athlete_certifications_type ON athlete_certifications(certification_type);
CREATE INDEX idx_athlete_certifications_status ON athlete_certifications(status);
CREATE INDEX idx_athlete_certifications_expiry ON athlete_certifications(expiry_date);

-- Research data submissions indexes
CREATE INDEX idx_research_submissions_body ON research_data_submissions(governing_body_id);
CREATE INDEX idx_research_submissions_type ON research_data_submissions(submission_type);
CREATE INDEX idx_research_submissions_status ON research_data_submissions(submission_status);
CREATE INDEX idx_research_submissions_period ON research_data_submissions(data_period_start, data_period_end);

-- Communications indexes
CREATE INDEX idx_communications_body ON governing_body_communications(governing_body_id);
CREATE INDEX idx_communications_type ON governing_body_communications(communication_type);
CREATE INDEX idx_communications_priority ON governing_body_communications(priority_level);
CREATE INDEX idx_communications_status ON governing_body_communications(status);
CREATE INDEX idx_communications_sent ON governing_body_communications(sent_at);

-- API logs indexes
CREATE INDEX idx_api_logs_body_time ON governing_body_api_logs(governing_body_id, request_timestamp);
CREATE INDEX idx_api_logs_endpoint ON governing_body_api_logs(api_endpoint);
CREATE INDEX idx_api_logs_success ON governing_body_api_logs(success);
CREATE INDEX idx_api_logs_user ON governing_body_api_logs(user_id);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Active certifications dashboard
CREATE OR REPLACE VIEW active_certifications_dashboard AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    gb.organization_name,
    gb.organization_acronym,
    ac.certification_type,
    ac.certification_name,
    ac.status,
    ac.issue_date,
    ac.expiry_date,
    CASE 
        WHEN ac.expiry_date IS NULL THEN 'no_expiry'
        WHEN ac.expiry_date <= CURRENT_DATE THEN 'expired'
        WHEN ac.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
        ELSE 'active'
    END as expiry_status,
    ac.verification_status,
    ac.compliance_requirements_met
FROM users u
JOIN athlete_certifications ac ON u.id = ac.user_id
JOIN governing_bodies gb ON ac.governing_body_id = gb.id
WHERE u.is_active = true
  AND ac.status IN ('active', 'pending')
ORDER BY u.last_name, u.first_name, ac.expiry_date;

-- Compliance status summary
CREATE OR REPLACE VIEW compliance_status_summary AS
SELECT 
    gb.organization_name,
    cs.category,
    COUNT(*) as total_standards,
    COUNT(*) FILTER (WHERE cs.mandatory = true) as mandatory_standards,
    COUNT(*) FILTER (WHERE cs.effective_date <= CURRENT_DATE AND (cs.expiry_date IS NULL OR cs.expiry_date > CURRENT_DATE)) as active_standards,
    COUNT(*) FILTER (WHERE cs.expiry_date <= CURRENT_DATE + INTERVAL '90 days' AND cs.expiry_date IS NOT NULL) as expiring_soon
FROM governing_bodies gb
JOIN compliance_standards cs ON gb.id = cs.governing_body_id
WHERE gb.is_active = true
  AND cs.is_active = true
GROUP BY gb.organization_name, cs.category
ORDER BY gb.organization_name, cs.category;

-- API integration health
CREATE OR REPLACE VIEW api_integration_health AS
SELECT 
    gb.organization_name,
    gb.integration_status,
    COUNT(logs.id) as total_calls_24h,
    COUNT(logs.id) FILTER (WHERE logs.success = true) as successful_calls_24h,
    COUNT(logs.id) FILTER (WHERE logs.success = false) as failed_calls_24h,
    ROUND(AVG(logs.response_time_ms), 2) as avg_response_time_ms,
    MAX(logs.request_timestamp) as last_api_call,
    gb.last_successful_sync
FROM governing_bodies gb
LEFT JOIN governing_body_api_logs logs ON gb.id = logs.governing_body_id 
    AND logs.request_timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
WHERE gb.is_active = true
GROUP BY gb.organization_name, gb.integration_status, gb.last_successful_sync
ORDER BY gb.organization_name;

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert major governing bodies
INSERT INTO governing_bodies (
    organization_name, organization_acronym, organization_type, headquarters_country, 
    website_url, supports_data_submission, supports_certification_query, olympic_recognition
) VALUES
('International Federation of American Football', 'IFAF', 'governing_body', 'France', 
 'https://www.ifaf.org', true, true, true),
('International Olympic Committee', 'IOC', 'olympic_committee', 'Switzerland', 
 'https://www.olympic.org', true, true, true),
('World Anti-Doping Agency', 'WADA', 'certification_body', 'Canada', 
 'https://www.wada-ama.org', true, true, true),
('USA Football', 'USAF', 'governing_body', 'United States', 
 'https://www.usafootball.com', true, true, false),
('Flag Football Research Institute', 'FFRI', 'research_institution', 'United States', 
 'https://www.ffri.org', true, false, false);

-- Insert sample compliance standards
INSERT INTO compliance_standards (
    governing_body_id, standard_name, standard_code, standard_version, category,
    description, requirements, compliance_criteria, effective_date
) VALUES
((SELECT id FROM governing_bodies WHERE organization_acronym = 'IFAF'), 
 'Athlete Safety Protocol', 'IFAF-ASP-2025', '1.0', 'athlete_safety',
 'Comprehensive safety requirements for flag football athletes',
 '{"medical_clearance": true, "equipment_standards": true, "injury_reporting": true}'::jsonb,
 ARRAY['Valid medical clearance', 'Approved safety equipment', 'Injury reporting compliance'],
 '2025-01-01'),
((SELECT id FROM governing_bodies WHERE organization_acronym = 'WADA'), 
 'Anti-Doping Code', 'WADA-ADC-2025', '2025.1', 'anti_doping',
 'World Anti-Doping Code compliance requirements',
 '{"drug_testing": true, "whereabouts_program": true, "education_program": true}'::jsonb,
 ARRAY['Participate in drug testing', 'Maintain whereabouts information', 'Complete anti-doping education'],
 '2025-01-01');

-- Insert sample certification types
INSERT INTO athlete_certifications (
    user_id, governing_body_id, certification_type, certification_name, status, issue_date, expiry_date
) VALUES
((SELECT id FROM users LIMIT 1), 
 (SELECT id FROM governing_bodies WHERE organization_acronym = 'IFAF'),
 'athlete_registration', 'IFAF Athlete Registration', 'active', '2025-01-01', '2025-12-31'),
((SELECT id FROM users LIMIT 1), 
 (SELECT id FROM governing_bodies WHERE organization_acronym = 'WADA'),
 'anti_doping', 'WADA Anti-Doping Clearance', 'active', '2025-01-01', '2026-01-01');