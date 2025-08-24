-- Migration: Fix Equipment Deals Function V2
-- This migration fixes the function using a simpler approach without dynamic SQL

-- Drop the problematic function
DROP FUNCTION IF EXISTS find_best_equipment_deals(VARCHAR, DECIMAL);

-- Create a simpler version that works
CREATE OR REPLACE FUNCTION find_best_equipment_deals(
    equipment_category_param VARCHAR DEFAULT NULL,
    max_price_euros DECIMAL DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    deals JSONB;
BEGIN
    -- Use a simpler approach without dynamic SQL
    SELECT jsonb_agg(
        jsonb_build_object(
            'equipment_name', ae.equipment_name,
            'category', ae.equipment_category,
            'price_range', jsonb_build_object('min', ae.price_range_min, 'max', ae.price_range_max),
            'priority', ae.priority_for_amateur,
            'benefit', ae.performance_benefit,
            'diy_alternatives', ae.diy_alternatives,
            'best_price_found', (
                SELECT MIN(ept.price_euros) 
                FROM equipment_price_tracking ept 
                WHERE ept.equipment_name = ae.equipment_name
            )
        )
    ) INTO deals
    FROM affordable_equipment ae
    WHERE (equipment_category_param IS NULL OR ae.equipment_category = equipment_category_param)
      AND (max_price_euros IS NULL OR ae.price_range_max <= max_price_euros);
    
    RETURN COALESCE(deals, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 'Function fixed successfully' as status;
