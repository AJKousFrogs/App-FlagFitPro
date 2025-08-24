-- Migration: Fix Affordable Brands Function
-- This migration fixes the SQL function that has a GROUP BY issue

-- Drop and recreate the function without the problematic ORDER BY
DROP FUNCTION IF EXISTS find_affordable_brand_products(VARCHAR, DECIMAL, VARCHAR);

CREATE OR REPLACE FUNCTION find_affordable_brand_products(
    budget_tier_param VARCHAR DEFAULT NULL,
    max_price_euros DECIMAL DEFAULT NULL,
    category_param VARCHAR DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    products JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'brand_name', abp.brand_name,
            'brand_website', abp.brand_website,
            'product_name', abp.product_name,
            'product_category', abp.product_category,
            'price_euros', abp.price_euros,
            'budget_tier', abp.amateur_budget_tier,
            'affordability_rating', abp.affordability_rating,
            'quality_rating', abp.quality_rating,
            'value_for_money', abp.value_for_money,
            'best_for', abp.best_for,
            'considerations', abp.considerations,
            'budget_alternatives', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'alternative_name', bfa.alternative_name,
                        'alternative_cost', bfa.alternative_cost_euros,
                        'cost_savings', bfa.cost_savings_euros,
                        'effectiveness', bfa.effectiveness_comparison,
                        'best_for_budget', bfa.best_for_budget_tier,
                        'notes', bfa.notes
                    )
                )
                FROM budget_friendly_alternatives bfa
                WHERE bfa.affordable_brand_product_id = abp.id
            )
        )
    ) INTO products
    FROM affordable_brand_products abp
    WHERE (budget_tier_param IS NULL OR abp.amateur_budget_tier = budget_tier_param)
      AND (max_price_euros IS NULL OR abp.price_euros <= max_price_euros)
      AND (category_param IS NULL OR abp.product_category = category_param);
    
    RETURN COALESCE(products, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 'Function fixed successfully' as status;
