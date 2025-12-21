-- =============================================================================
-- EVIDENCE-BASED KNOWLEDGE BASE SYSTEM
-- Comprehensive research database for flag football athletes
-- Targets: 100-1000+ evidence-based articles from open sources
-- =============================================================================

-- Research Articles Table
CREATE TABLE IF NOT EXISTS research_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Article Identification
    title TEXT NOT NULL,
    authors TEXT[],
    publication_year INTEGER,
    journal VARCHAR(300),
    publisher VARCHAR(200),
    
    -- Identifiers
    doi VARCHAR(100) UNIQUE,
    pubmed_id VARCHAR(20),
    pmc_id VARCHAR(20),
    arxiv_id VARCHAR(50),
    semantic_scholar_id VARCHAR(100),
    
    -- Content
    abstract TEXT,
    full_text TEXT, -- Full article text if available
    full_text_url TEXT,
    pdf_url TEXT,
    
    -- Categorization
    primary_category VARCHAR(100), -- 'injury', 'nutrition', 'recovery', 'training', 'psychology', etc.
    categories TEXT[], -- Multiple categories
    tags TEXT[], -- Specific tags for searchability
    
    -- Research Quality
    study_type VARCHAR(50), -- 'meta_analysis', 'systematic_review', 'rct', 'cohort', 'case_control', 'case_study', 'review'
    evidence_level VARCHAR(20), -- 'A' (strong), 'B' (moderate), 'C' (limited), 'D' (expert opinion)
    sample_size INTEGER,
    population_type VARCHAR(100), -- 'elite_athletes', 'amateur_athletes', 'general_population', etc.
    sport_type VARCHAR(100), -- 'flag_football', 'football', 'sprint', 'team_sports', etc.
    
    -- Key Findings (structured)
    key_findings TEXT,
    methodology TEXT,
    results_summary TEXT,
    conclusions TEXT,
    practical_applications TEXT[],
    
    -- Specific Topics (for targeted queries)
    injury_types TEXT[], -- 'ankle_sprain', 'hamstring_strain', etc.
    supplement_types TEXT[], -- 'iron', 'creatine', 'protein', etc.
    recovery_methods TEXT[], -- 'sauna', 'cold_therapy', 'massage', etc.
    training_types TEXT[], -- 'speed', 'strength', 'endurance', etc.
    psychological_topics TEXT[], -- 'anxiety', 'confidence', 'visualization', etc.
    
    -- Nutrition Specific
    food_sources JSONB, -- {food: "spinach", iron_mg_per_100g: 2.7, bioavailability: "low"}
    absorption_tips TEXT[],
    supplement_guidance JSONB, -- {supplement: "iron", dosage: "10-15mg/day", timing: "with_vitamin_c", contraindications: ["calcium", "coffee"]}
    safety_warnings TEXT[],
    
    -- Recovery Specific
    sauna_protocols JSONB, -- {temperature: "80-90C", duration: "15-20min", frequency: "3-4x/week"}
    cold_therapy_protocols JSONB, -- {temperature: "10-15C", duration: "10-15min", method: "ice_bath"}
    massage_gun_protocols JSONB, -- {pressure: "moderate", duration: "10min", frequency: "post_training"}
    
    -- Training Specific
    training_protocols JSONB, -- {type: "speed", frequency: "2-3x/week", volume: "varies", intensity: "high"}
    periodization_phases TEXT[],
    
    -- Psychology Specific
    psychological_techniques TEXT[],
    mental_training_methods TEXT[],
    
    -- Citation & Impact
    citation_count INTEGER DEFAULT 0,
    altmetric_score DECIMAL(10,2),
    impact_factor DECIMAL(5,2),
    
    -- Source Information
    source_type VARCHAR(50), -- 'pubmed', 'europe_pmc', 'arxiv', 'plos', 'frontiers', etc.
    is_open_access BOOLEAN DEFAULT true,
    license_type VARCHAR(50), -- 'CC-BY', 'CC-BY-NC', etc.
    
    -- Quality Control
    verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(100),
    verification_date TIMESTAMP,
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 10),
    
    -- Integration
    integrated_into_chatbot BOOLEAN DEFAULT false,
    chatbot_usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    
    -- Metadata
    keywords TEXT[],
    mesh_terms TEXT[], -- Medical Subject Headings
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Base Entries (Processed, structured knowledge)
CREATE TABLE IF NOT EXISTS knowledge_base_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Entry Type
    entry_type VARCHAR(50) NOT NULL, -- 'supplement', 'injury', 'recovery_method', 'training_method', 'nutrition', 'psychology'
    topic VARCHAR(200) NOT NULL, -- 'iron_supplementation', 'ankle_sprain_treatment', etc.
    
    -- Content
    question TEXT, -- Common question this entry answers
    answer TEXT NOT NULL, -- Structured answer
    summary TEXT, -- Brief summary
    
    -- Evidence
    supporting_articles UUID[] REFERENCES research_articles(id),
    evidence_strength VARCHAR(20), -- 'strong', 'moderate', 'limited'
    consensus_level VARCHAR(20), -- 'high', 'moderate', 'low'
    
    -- Structured Data
    dosage_guidelines JSONB, -- For supplements
    protocols JSONB, -- For recovery/training methods
    contraindications TEXT[],
    safety_warnings TEXT[],
    best_practices TEXT[],
    
    -- Context
    applicable_to TEXT[], -- 'elite_athletes', 'amateur', 'youth', etc.
    sport_specificity VARCHAR(100), -- 'flag_football', 'general', etc.
    
    -- Usage Tracking
    query_count INTEGER DEFAULT 0,
    last_queried_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Article Search Index (for full-text search)
CREATE TABLE IF NOT EXISTS article_search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES research_articles(id) ON DELETE CASCADE,
    
    -- Searchable content
    searchable_text TEXT, -- Combined title, abstract, key findings
    search_vector tsvector, -- PostgreSQL full-text search vector
    
    -- Keywords for quick lookup
    keywords TEXT[],
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Base Search Index
CREATE TABLE IF NOT EXISTS knowledge_search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES knowledge_base_entries(id) ON DELETE CASCADE,
    
    searchable_text TEXT,
    search_vector tsvector,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_articles_category ON research_articles(primary_category);
CREATE INDEX IF NOT EXISTS idx_articles_year ON research_articles(publication_year);
CREATE INDEX IF NOT EXISTS idx_articles_evidence_level ON research_articles(evidence_level);
CREATE INDEX IF NOT EXISTS idx_articles_sport ON research_articles(sport_type);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON research_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_categories ON research_articles USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_articles_supplements ON research_articles USING GIN(supplement_types);
CREATE INDEX IF NOT EXISTS idx_articles_injuries ON research_articles USING GIN(injury_types);
CREATE INDEX IF NOT EXISTS idx_articles_recovery ON research_articles USING GIN(recovery_methods);
CREATE INDEX IF NOT EXISTS idx_articles_doi ON research_articles(doi);
CREATE INDEX IF NOT EXISTS idx_articles_pubmed ON research_articles(pubmed_id);

CREATE INDEX IF NOT EXISTS idx_kb_entry_type ON knowledge_base_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_kb_topic ON knowledge_base_entries(topic);
CREATE INDEX IF NOT EXISTS idx_kb_evidence_strength ON knowledge_base_entries(evidence_strength);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_article_search_vector ON article_search_index USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_knowledge_search_vector ON knowledge_search_index USING GIN(search_vector);

-- Trigger to update search index when articles are inserted/updated
CREATE OR REPLACE FUNCTION update_article_search_index()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO article_search_index (article_id, searchable_text, search_vector, keywords)
    VALUES (
        NEW.id,
        COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.abstract, '') || ' ' || COALESCE(NEW.key_findings, ''),
        to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.abstract, '') || ' ' || COALESCE(NEW.key_findings, '')),
        NEW.keywords
    )
    ON CONFLICT (article_id) DO UPDATE SET
        searchable_text = EXCLUDED.searchable_text,
        search_vector = EXCLUDED.search_vector,
        keywords = EXCLUDED.keywords;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_article_search
AFTER INSERT OR UPDATE ON research_articles
FOR EACH ROW
EXECUTE FUNCTION update_article_search_index();

-- Trigger to update knowledge base search index
CREATE OR REPLACE FUNCTION update_knowledge_search_index()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO knowledge_search_index (entry_id, searchable_text, search_vector)
    VALUES (
        NEW.id,
        COALESCE(NEW.question, '') || ' ' || COALESCE(NEW.answer, '') || ' ' || COALESCE(NEW.summary, ''),
        to_tsvector('english', COALESCE(NEW.question, '') || ' ' || COALESCE(NEW.answer, '') || ' ' || COALESCE(NEW.summary, ''))
    )
    ON CONFLICT (entry_id) DO UPDATE SET
        searchable_text = EXCLUDED.searchable_text,
        search_vector = EXCLUDED.search_vector;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_search
AFTER INSERT OR UPDATE ON knowledge_base_entries
FOR EACH ROW
EXECUTE FUNCTION update_knowledge_search_index();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_research_articles_updated_at
BEFORE UPDATE ON research_articles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_entries_updated_at
BEFORE UPDATE ON knowledge_base_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE research_articles IS 'Evidence-based research articles from open sources (PubMed, Europe PMC, arXiv, etc.)';
COMMENT ON TABLE knowledge_base_entries IS 'Processed, structured knowledge entries derived from research articles';
COMMENT ON TABLE article_search_index IS 'Full-text search index for research articles';
COMMENT ON TABLE knowledge_search_index IS 'Full-text search index for knowledge base entries';

