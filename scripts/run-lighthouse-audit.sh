#!/bin/bash

# Lighthouse Audit Script for Launch Testing
# Runs comprehensive Lighthouse audits on all critical pages
# Requirement: All pages must score ≥90 for Performance, Accessibility, Best Practices, SEO

set -e

# Configuration
STAGING_URL="${STAGING_URL:-http://localhost:4200}"
OUTPUT_DIR="lighthouse-reports/launch-$(date +%Y%m%d-%H%M%S)"
REQUIRED_SCORE=90

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================================="
echo "🔦 Launch Lighthouse Audit"
echo "=================================================="
echo "Target URL: $STAGING_URL"
echo "Output Dir: $OUTPUT_DIR"
echo "Required Score: ≥$REQUIRED_SCORE"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if lighthouse is installed
if ! command -v lighthouse &> /dev/null; then
    echo "❌ Lighthouse not installed. Installing..."
    npm install -g lighthouse
fi

# Pages to audit
declare -a PAGES=(
    "/:Landing/Login Page"
    "/login:Login Page"
    "/dashboard:Dashboard (Auth Required)"
    "/training:Training Page"
    "/analytics:Analytics Page"
)

# Results tracking
TOTAL_AUDITS=0
PASSED_AUDITS=0
FAILED_AUDITS=0

echo "Starting audits..."
echo ""

# Function to run audit on a single page
run_audit() {
    local url_path=$1
    local page_name=$2
    local output_name=$(echo "$page_name" | tr ' /' '_' | tr '[:upper:]' '[:lower:]')
    
    echo "=================================================="
    echo "Auditing: $page_name"
    echo "URL: ${STAGING_URL}${url_path}"
    echo "=================================================="
    
    TOTAL_AUDITS=$((TOTAL_AUDITS + 1))
    
    # Run Lighthouse
    lighthouse "${STAGING_URL}${url_path}" \
        --output=json \
        --output=html \
        --output-path="${OUTPUT_DIR}/${output_name}" \
        --chrome-flags="--headless --no-sandbox --disable-gpu" \
        --preset=desktop \
        --throttling-method=simulate \
        --only-categories=performance,accessibility,best-practices,seo,pwa \
        --quiet || true
    
    # Parse results
    if [ -f "${OUTPUT_DIR}/${output_name}.report.json" ]; then
        PERF=$(jq -r '.categories.performance.score * 100' "${OUTPUT_DIR}/${output_name}.report.json")
        A11Y=$(jq -r '.categories.accessibility.score * 100' "${OUTPUT_DIR}/${output_name}.report.json")
        BP=$(jq -r '.categories["best-practices"].score * 100' "${OUTPUT_DIR}/${output_name}.report.json")
        SEO=$(jq -r '.categories.seo.score * 100' "${OUTPUT_DIR}/${output_name}.report.json")
        PWA=$(jq -r '.categories.pwa.score * 100' "${OUTPUT_DIR}/${output_name}.report.json")
        
        echo ""
        echo "Results for $page_name:"
        echo "  Performance:      $PERF"
        echo "  Accessibility:    $A11Y"
        echo "  Best Practices:   $BP"
        echo "  SEO:              $SEO"
        echo "  PWA:              $PWA"
        echo ""
        
        # Check if all scores meet requirements
        PASSED=true
        if (( $(echo "$PERF < $REQUIRED_SCORE" | bc -l) )); then
            echo -e "  ${RED}❌ Performance below $REQUIRED_SCORE${NC}"
            PASSED=false
        fi
        if (( $(echo "$A11Y < $REQUIRED_SCORE" | bc -l) )); then
            echo -e "  ${RED}❌ Accessibility below $REQUIRED_SCORE${NC}"
            PASSED=false
        fi
        if (( $(echo "$BP < $REQUIRED_SCORE" | bc -l) )); then
            echo -e "  ${RED}❌ Best Practices below $REQUIRED_SCORE${NC}"
            PASSED=false
        fi
        if (( $(echo "$SEO < $REQUIRED_SCORE" | bc -l) )); then
            echo -e "  ${RED}❌ SEO below $REQUIRED_SCORE${NC}"
            PASSED=false
        fi
        
        if [ "$PASSED" = true ]; then
            echo -e "  ${GREEN}✅ All scores meet requirements${NC}"
            PASSED_AUDITS=$((PASSED_AUDITS + 1))
        else
            echo -e "  ${RED}❌ Some scores below requirements${NC}"
            FAILED_AUDITS=$((FAILED_AUDITS + 1))
        fi
        
        echo ""
        echo "HTML Report: ${OUTPUT_DIR}/${output_name}.report.html"
        echo ""
    else
        echo -e "${RED}❌ Audit failed - no results generated${NC}"
        FAILED_AUDITS=$((FAILED_AUDITS + 1))
    fi
}

# Run audits on all pages
for page_info in "${PAGES[@]}"; do
    IFS=':' read -r url_path page_name <<< "$page_info"
    run_audit "$url_path" "$page_name"
done

# Generate summary
echo "=================================================="
echo "📊 AUDIT SUMMARY"
echo "=================================================="
echo "Total Audits:     $TOTAL_AUDITS"
echo "Passed:           $PASSED_AUDITS"
echo "Failed:           $FAILED_AUDITS"
echo ""

if [ $FAILED_AUDITS -eq 0 ]; then
    echo -e "${GREEN}🎉 LAUNCH GREENLIGHT: All pages score ≥$REQUIRED_SCORE${NC}"
    echo ""
    echo "All HTML reports saved in: $OUTPUT_DIR"
    exit 0
else
    echo -e "${RED}⚠️  LAUNCH HOLD: $FAILED_AUDITS page(s) below $REQUIRED_SCORE${NC}"
    echo ""
    echo "Review HTML reports in: $OUTPUT_DIR"
    exit 1
fi
