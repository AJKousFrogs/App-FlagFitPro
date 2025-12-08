-- =============================================================================
-- SPONSORS TABLE
-- Stores sponsor information and logos for display on login and other pages
-- =============================================================================

CREATE TABLE IF NOT EXISTS sponsors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    logo_url TEXT NOT NULL,
    website_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active sponsors ordered by display_order
CREATE INDEX IF NOT EXISTS idx_sponsors_active_order ON sponsors(is_active, display_order) WHERE is_active = true;

-- Insert sponsor data
INSERT INTO sponsors (name, logo_url, website_url, display_order, is_active) VALUES
('LA PRIMAFIT', 'https://www.laprimafit.com/image/cache/catalog/logo/La_primafit_logo_black_linear_white_600w-1062x185.png', 'https://www.laprimafit.com', 1, true),
('Chemius', 'https://www.chemius.net/wp-content/uploads/2021/09/logo-chemius-header.png', 'https://www.chemius.net', 2, true),
('GEAR XPRO', 'https://gearxpro-sports.com/cdn/shop/files/Secondary_logo_Positive.png?v=1737387514&width=290', 'https://gearxpro-sports.com', 3, true)
ON CONFLICT DO NOTHING;

COMMIT;





