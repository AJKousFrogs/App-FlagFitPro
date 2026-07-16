import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, HeadingLevel, WidthType, BorderStyle, PageBreak, PageOrientation, UnderlineType, convertInchesToTwip } from 'docx';
import { writeFileSync } from 'fs';

const doc = new Document({
  page: { size: { width: 12240, height: 15840 } },
  sections: [
    {
      children: [
        // Title Page
        new Paragraph({
          text: '',
          spacing: { line: 400 },
        }),
        new Paragraph({
          text: 'FlagFit Pro',
          heading: HeadingLevel.HEADING_1,
          alignment: 'center',
          spacing: { before: 400, after: 100 },
          thematicBreak: false,
        }),
        new Paragraph({
          text: 'Business Development Plan',
          heading: HeadingLevel.HEADING_2,
          alignment: 'center',
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: 'Market Research, Competitive Analysis & Pricing Strategy',
          alignment: 'center',
          spacing: { after: 600 },
        }),
        new Paragraph({
          text: '',
          spacing: { line: 800 },
        }),
        new Paragraph({
          text: 'Ljubljana Flag Football Organization',
          alignment: 'center',
          spacing: { before: 400 },
        }),
        new Paragraph({
          text: 'July 2026',
          alignment: 'center',
          spacing: { after: 600 },
        }),

        new PageBreak(),

        // Executive Summary
        new Paragraph({
          text: 'Executive Summary',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          text: 'Overview',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'FlagFit Pro is an athlete load-management and performance analytics platform targeting competitive flag football leagues and recreational teams. The platform combines training load monitoring, recovery optimization, injury risk assessment, and team analytics—solving a critical gap in the flag football market where coaches currently lack data-driven insights for player management.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Strategic Opportunity',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Flag football is the fastest-growing team sport in America. Youth participation grew 14% (2019–2024), with women\'s flag football achieving 60% high school growth (2024–2025). The NFL recently committed $32 million to launching a professional flag football league. This explosive growth creates an immediate market for player development tools.',
          spacing: { after: 150 },
        }),
        new Paragraph({
          text: 'The athlete management software market is projected to grow from $1.2B (2024) to $3.8B (2032) at 13.4% CAGR. Load-management platforms are increasingly viewed as injury-prevention infrastructure, with the potential to reduce sports-related injuries by up to 40%. FlagFit Pro enters a market with established enterprise players (Catapult, Kinduct, Kitman Labs) but significant white space in the recreational and semi-professional segment.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Market Position & Financial Opportunity',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'FlagFit Pro targets the recreational-to-competitive league operator and team coach segments, where pricing sensitivity is higher than enterprise but willingness-to-pay for injury prevention and competitive advantage is strong. A hybrid freemium + team subscription model captures casual users while monetizing serious competitors.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Recommended Pricing: $299–499/team/season (12-week competitive season) or $25–40/player/month for individual subscriptions. This positions the product above consumer fitness apps (Strava: $80/year) but below enterprise solutions (Kitman Labs: $50K+/year).',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Business Impact Year 1: 150–200 team signups + 500–750 individual player subscriptions = $65K–90K ARR. Year 3 projection: 1,200+ teams + 5K+ individuals = $800K–1.2M ARR, with path to profitability.',
          spacing: { after: 200, line: 360 },
        }),

        new PageBreak(),

        // Market Analysis
        new Paragraph({
          text: '1. Market Analysis & Sizing',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          text: '1.1 Flag Football Market Size',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Metric')], width: { size: 40, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('2024 Baseline')], width: { size: 30, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('Growth Rate')], width: { size: 30, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Total U.S. Flag Football Participants')] }),
                new TableCell({ children: [new Paragraph('7.8M')] }),
                new TableCell({ children: [new Paragraph('~5% YoY')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Youth Flag Football (6–17 yrs)')] }),
                new TableCell({ children: [new Paragraph('2.4M (organized programs)')] }),
                new TableCell({ children: [new Paragraph('14% (2019–2024 CAGR)')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('High School Girls Flag Football')] }),
                new TableCell({ children: [new Paragraph('68.8K (2024–25 season)')] }),
                new TableCell({ children: [new Paragraph('60% YoY (2023–25)')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Professional League Funding')] }),
                new TableCell({ children: [new Paragraph('$32M NFL investment (Dec 2025)')] }),
                new TableCell({ children: [new Paragraph('Men\'s + women\'s leagues launching')] }),
              ],
            }),
          ],
        }),

        new Paragraph({
          text: '',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Key Insight: Flag football is at an inflection point. Youth participation is growing faster than tackle football; high school adoption is exploding; and institutional backing (NFL investment) signals long-term viability. Recreational leagues will proliferate as grassroots supply meets growing demand.',
          spacing: { after: 200, before: 100 },
        }),

        new Paragraph({
          text: '1.2 Athlete Management & Load-Monitoring Market (TAM)',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),

        new Paragraph({
          text: 'Global Market Size:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          text: 'The athlete management software market is valued at $1.2B–$3.1B (2024, depending on scope). Conservative estimate: $1.2B; aggressive: $3.1B. Market is expected to reach $3.8B by 2032 at a 13.4% CAGR.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Market Drivers:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),

        new Paragraph({
          text: 'Injury Prevention (40% reduction potential)',
          spacing: { before: 50, after: 50, beforeAutospacing: false },
        }),
        new Paragraph({
          text: 'Performance Optimization & Competitive Advantage',
          spacing: { before: 50, after: 50, beforeAutospacing: false },
        }),
        new Paragraph({
          text: 'Cloud-based Accessibility (60%+ of deployments)',
          spacing: { before: 50, after: 50, beforeAutospacing: false },
        }),
        new Paragraph({
          text: 'Data-Driven Coaching & Return-to-Play Decisions',
          spacing: { before: 50, after: 200, beforeAutospacing: false },
        }),

        new Paragraph({
          text: 'Competitive Consolidation: Catapult + Kinduct control ~25% of the market. Major acquisitions in 2023–2024 (Catapult–SBG, Hudl–Sportscode, Orreco–Kitman) signal that consolidation is accelerating, creating acquisition targets and partnership opportunities for emerging players.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '1.3 TAM for FlagFit Pro (Addressable Market)',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),

        new Paragraph({
          text: 'Segmentation:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),

        new Paragraph({
          text: 'Competitive Flag Football Leagues: ~800 organized recreational leagues in U.S. (AFFL + USA Flag Football + local leagues). Avg. league: 12–20 teams.',
          spacing: { after: 150, beforeAutospacing: false },
        }),
        new Paragraph({
          text: 'Youth Competitive Programs: ~500 structured youth flag programs + club teams offering performance training.',
          spacing: { after: 150, beforeAutospacing: false },
        }),
        new Paragraph({
          text: 'Individual Athletes (Secondary): ~2.4M youth flag players; 5–10% willing to pay for personal performance tracking ($30–50/mo).',
          spacing: { after: 200, beforeAutospacing: false },
        }),

        new Paragraph({
          text: 'Addressable Market Sizing (Conservative):',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),

        new Paragraph({
          text: 'League Operators & Coaches: 800 leagues × 15 teams/league = 12,000 teams. Capture rate: 10–15% = 1,200–1,800 paying teams by Year 3.',
          spacing: { after: 150, beforeAutospacing: false },
        }),
        new Paragraph({
          text: 'Individual Subscribers: 2–3% of youth players (50K–75K individuals). Conversion target: 5K–8K paid subscriptions by Year 3.',
          spacing: { after: 200, beforeAutospacing: false },
        }),

        new Paragraph({
          text: 'Year 3 Revenue Projection: (1,500 teams × $400/season) + (6,000 individuals × $36/mo × 12) = $600K + $2.59M = $3.19M. This assumes market maturation and ~10–12% penetration.',
          spacing: { after: 200 },
        }),

        new PageBreak(),

        // Competitive Landscape
        new Paragraph({
          text: '2. Competitive Landscape & Positioning',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          text: '2.1 Competitive Map',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Competitor')], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('Segment')], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('Pricing Model')], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('Strength')], width: { size: 25, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('Weakness')], width: { size: 25, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Strava')] }),
                new TableCell({ children: [new Paragraph('Consumer / Individual')] }),
                new TableCell({ children: [new Paragraph('$80/yr')] }),
                new TableCell({ children: [new Paragraph('Large user base; social features')] }),
                new TableCell({ children: [new Paragraph('No team/coach features; running-focused')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('WHOOP')] }),
                new TableCell({ children: [new Paragraph('Consumer Wearable')] }),
                new TableCell({ children: [new Paragraph('$199–359/yr')] }),
                new TableCell({ children: [new Paragraph('Injury prevention focus; HRV data')] }),
                new TableCell({ children: [new Paragraph('Hardware-dependent; no sport-specific features')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('TrainHeroic')] }),
                new TableCell({ children: [new Paragraph('Coach / Team')] }),
                new TableCell({ children: [new Paragraph('$9.99–275/mo')] }),
                new TableCell({ children: [new Paragraph('Marketplace programs; strong UI')] }),
                new TableCell({ children: [new Paragraph('Strength-training focus; not sport-agnostic')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Catapult / Kinduct')] }),
                new TableCell({ children: [new Paragraph('Enterprise (Pro & College)')] }),
                new TableCell({ children: [new Paragraph('$50K–250K+/yr')] }),
                new TableCell({ children: [new Paragraph('Comprehensive wearable integration; market leader')] }),
                new TableCell({ children: [new Paragraph('Expensive; complex; overkill for recreational')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Kitman Labs')] }),
                new TableCell({ children: [new Paragraph('Enterprise (Pro teams)')] }),
                new TableCell({ children: [new Paragraph('Custom / $50K–150K+/yr')] }),
                new TableCell({ children: [new Paragraph('AI/ML-driven predictive models')] }),
                new TableCell({ children: [new Paragraph('Enterprise-only; not accessible to recreational')] }),
              ],
            }),
          ],
        }),

        new Paragraph({
          text: '',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '2.2 FlagFit Pro Competitive Advantage',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),

        new Paragraph({
          text: 'Sport-Specific Optimization',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          text: 'FlagFit Pro is built for flag football, not generic athleticism. This means: Flag-specific ACWR calculations, Non-contact injury models tailored to flag football biomechanics, Agility, speed, and lateral movement focus.',
          spacing: { after: 150, line: 360 },
        }),

        new Paragraph({
          text: 'Accessibility & Affordability',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          text: 'Pricing is 5–10× lower than enterprise (Catapult, Kitman) but includes team features missing from consumer apps (Strava, WHOOP). Target: league operators and coaches with $5K–10K annual tech budgets, not Fortune 500 spending.',
          spacing: { after: 150 },
        }),

        new Paragraph({
          text: 'Growth Timing',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          text: 'Launch at peak market inflection: 60% YoY growth in high school girls\' flag football, $32M NFL investment, and 2026 professional league launch. No competitor is specifically targeting recreational flag leagues.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '2.3 Defensibility',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),

        new Paragraph({
          text: 'Moat Strategy:',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          text: 'Data Network Effect: As more flag football teams use FlagFit, the platform accumulates flag-specific training load benchmarks, injury databases, and performance profiles. This data becomes defensible IP and improves AI/ML recommendations.',
          spacing: { after: 150 },
        }),
        new Paragraph({
          text: 'Community & Ecosystem: Build a league-operator community (forums, best-practices guides, webinars). Deep integration with league management platforms (league websites, scheduling apps).',
          spacing: { after: 150 },
        }),
        new Paragraph({
          text: 'Specialized Expertise: Hire sports scientists with flag football or similar track-and-field experience. Make the product the "category creator" for flag-specific load management.',
          spacing: { after: 200 },
        }),

        new PageBreak(),

        // Pricing Strategy
        new Paragraph({
          text: '3. Pricing Strategy & Business Model',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          text: '3.1 Pricing Architecture',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),

        new Paragraph({
          text: 'FlagFit Pro will use a hybrid model targeting two customer types:',
          spacing: { after: 100 },
        }),

        new Paragraph({
          text: 'A. Team/League Subscriptions (Primary Revenue)',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Tier')], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('Price')], width: { size: 15, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('Target')], width: { size: 25, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('Features')], width: { size: 40, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Starter')] }),
                new TableCell({ children: [new Paragraph('$199/season')] }),
                new TableCell({ children: [new Paragraph('Small teams (8–12)')] }),
                new TableCell({ children: [new Paragraph('Manual workload logging, injury tracking, team dashboard')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Pro')] }),
                new TableCell({ children: [new Paragraph('$399/season')] }),
                new TableCell({ children: [new Paragraph('Competitive leagues (12–30)')] }),
                new TableCell({ children: [new Paragraph('All Starter + wearable integration, ACWR alerts, analytics')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Elite')] }),
                new TableCell({ children: [new Paragraph('$599/season')] }),
                new TableCell({ children: [new Paragraph('High-performance (30+)')] }),
                new TableCell({ children: [new Paragraph('All Pro + multi-team, ML models, custom reports, API access')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('League')] }),
                new TableCell({ children: [new Paragraph('$2,499–4,999/season')] }),
                new TableCell({ children: [new Paragraph('League operators (100+)')] }),
                new TableCell({ children: [new Paragraph('All features + league benchmarking, draft insights, rev share')] }),
              ],
            }),
          ],
        }),

        new Paragraph({
          text: '',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Rationale: $199–599 price point is 5–10× lower than enterprise, but above consumer apps. Seasonal billing aligns with football calendar. League tier enables partnerships.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'B. Individual Player Subscriptions (Secondary Revenue)',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),

        new Paragraph({
          text: 'Basic (Free): Team dashboard access, basic stats.',
          spacing: { after: 100, beforeAutospacing: false },
        }),
        new Paragraph({
          text: 'Premium ($24.99/mo or $199/year): Personal load tracking, injury alerts, recovery recommendations.',
          spacing: { after: 100, beforeAutospacing: false },
        }),
        new Paragraph({
          text: 'Elite ($39.99/mo or $299/year): AI coaching, predictive modeling, benchmarks.',
          spacing: { after: 200, beforeAutospacing: false },
        }),

        new Paragraph({
          text: '3.2 Pricing Justification & Benchmarking',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Competitor')], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('Segment')], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('Price Point')], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('FlagFit Positioning')], width: { size: 40, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Strava')] }),
                new TableCell({ children: [new Paragraph('Consumer')] }),
                new TableCell({ children: [new Paragraph('$80/yr')] }),
                new TableCell({ children: [new Paragraph('Pro tier ($399) targets teams; 3× higher value')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('TrainHeroic')] }),
                new TableCell({ children: [new Paragraph('Coach-Led')] }),
                new TableCell({ children: [new Paragraph('$29.99–275/mo')] }),
                new TableCell({ children: [new Paragraph('$399 Pro is comparable entry point')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Catapult')] }),
                new TableCell({ children: [new Paragraph('Enterprise')] }),
                new TableCell({ children: [new Paragraph('$50K–250K/yr')] }),
                new TableCell({ children: [new Paragraph('League tier ($2.5K) is 10× cheaper')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('WHOOP')] }),
                new TableCell({ children: [new Paragraph('Consumer')] }),
                new TableCell({ children: [new Paragraph('$16.60–30/mo')] }),
                new TableCell({ children: [new Paragraph('Individual Premium ($24.99/mo) parity')] }),
              ],
            }),
          ],
        }),

        new Paragraph({
          text: '',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '3.3 Unit Economics & Gross Margin',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),

        new Paragraph({
          text: 'Year 1 Revenue Mix: 60% Starter (100 teams @ $199), 30% Pro (50 teams @ $399), 10% Elite (20 teams @ $599), 100 individual Premium @ $199/yr = $71.73K/season.',
          spacing: { after: 100 },
        }),

        new Paragraph({
          text: 'COGS (hosting, payment, support): ~20% = $14.3K',
          spacing: { after: 100 },
        }),

        new Paragraph({
          text: 'Gross Margin: 80% ($57.43K per season)',
          spacing: { after: 200 },
        }),

        new PageBreak(),

        // Go-to-Market
        new Paragraph({
          text: '4. Go-to-Market Strategy',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          text: '4.1 Target Customer Personas',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),

        new Paragraph({
          text: 'Persona 1: League Operator ("Growth CEO")',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          text: 'Runs 8–15 teams, $50K–150K annual revenue. Pain: Players quit due to injury; no data visibility. Buying cycle: 4–8 weeks. Entry point: League benchmarking.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Persona 2: Competitive Coach ("Data Enthusiast")',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          text: 'Coaches 1–2 teams, $500–2K/year budget. Pain: Can\'t track fatigue; unsure injury risk. Buying cycle: 2–4 weeks. Entry point: Free trial + testimonials.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Persona 3: Ambitious Athlete ("Performance Optimizer")',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          text: 'High school/college player, $200–300/year budget. Pain: Wants competitive advantage vs. peers. Buying cycle: Immediate. Entry point: Freemium + scouting angle.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '4.2 Acquisition Channels',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),

        new Paragraph({
          text: 'Priority 1: Direct Outreach to Leagues (Month 1–3) — Target AFFL, USA Flag Football. Expected: 10–15% conversion.',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Priority 2: Coach & Player Communities (Month 2–6) — Facebook groups, Reddit. Expected: 30–50 signups.',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Priority 3: Wearable Partnerships (Month 3–9) — Apple, Garmin, Oura integrations.',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Priority 4: Paid Digital (Month 4+) — Facebook/Instagram ads, Google Ads. Budget: $2K–5K/mo.',
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: 'Priority 5: Press & Influencer (Month 6+) — Sports tech blogs, flag football media.',
          spacing: { after: 200 },
        }),

        new PageBreak(),

        // Financial Projections
        new Paragraph({
          text: '5. Financial Projections & Path to Profitability',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          text: '5.1 Revenue Projections (3-Year Outlook)',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Metric')], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('Year 1')], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('Year 2')], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('Year 3')], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
                new TableCell({ children: [new Paragraph('CAGR')], width: { size: 20, type: WidthType.PERCENTAGE }, shading: { type: 'clear', color: 'E8E8E8' } }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Total ARR')], shading: { type: 'clear', color: 'F0F0F0' } }),
                new TableCell({ children: [new Paragraph('$91.6K')], shading: { type: 'clear', color: 'F0F0F0' } }),
                new TableCell({ children: [new Paragraph('$449K')], shading: { type: 'clear', color: 'F0F0F0' } }),
                new TableCell({ children: [new Paragraph('$3.37M')], shading: { type: 'clear', color: 'F0F0F0' } }),
                new TableCell({ children: [new Paragraph('191%')], shading: { type: 'clear', color: 'F0F0F0' } }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Gross Margin')] }),
                new TableCell({ children: [new Paragraph('80%')] }),
                new TableCell({ children: [new Paragraph('80%')] }),
                new TableCell({ children: [new Paragraph('80%')] }),
                new TableCell({ children: [new Paragraph('—')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Gross Profit')], shading: { type: 'clear', color: 'F0F0F0' } }),
                new TableCell({ children: [new Paragraph('$73.3K')], shading: { type: 'clear', color: 'F0F0F0' } }),
                new TableCell({ children: [new Paragraph('$359K')], shading: { type: 'clear', color: 'F0F0F0' } }),
                new TableCell({ children: [new Paragraph('$2.70M')], shading: { type: 'clear', color: 'F0F0F0' } }),
                new TableCell({ children: [new Paragraph('—')], shading: { type: 'clear', color: 'F0F0F0' } }),
              ],
            }),
          ],
        }),

        new Paragraph({
          text: '',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Assumptions: Teams grow 100% YoY; plateau at 50% Year 3. Individuals grow 300% YoY. Churn: 20% annual.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: '5.2 Path to Profitability',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),

        new Paragraph({
          text: 'Breakeven Analysis: ~$300K ARR required. Achievable by Q4 Year 2 (750+ teams). Profitability inflection Year 3. Cumulative cash flow positive by Month 24–28.',
          spacing: { after: 200 },
        }),

        new PageBreak(),

        // Risk & Mitigation
        new Paragraph({
          text: '6. Risks & Mitigation',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          text: 'Risk 1: Market Adoption Slower Than Projected',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          text: 'Mitigation: Offer aggressive early discounts, run free pilots with league operators, focus on word-of-mouth.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Risk 2: Competitive Entry',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          text: 'Mitigation: Build moat via data network effect, community, wearable partnerships. Acquire 500+ teams before Year 2.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Risk 3: Regulatory / Liability',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          text: 'Mitigation: Label as "decision support tool" not medical advice. E&O insurance. Legal counsel on liability.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Risk 4: Seasonal Revenue',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 100, after: 50 },
        }),
        new Paragraph({
          text: 'Mitigation: Upsell year-round services (training camps, spring leagues, off-season modules). Shift to monthly subscriptions Year 2.',
          spacing: { after: 200 },
        }),

        new PageBreak(),

        // Recommendations
        new Paragraph({
          text: '7. Strategic Recommendations',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          text: 'Phase 1: Validation (Months 1–3)',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Build MVP. Direct outreach to 50 coaches. Target: 20–30 paying teams. Success: NPS >50, <10% churn.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Phase 2: Scale (Months 4–12)',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Wearable integrations. League benchmarking. Hire SDR. Target: 100–150 teams by Year 1 end. Success: $60K+ ARR, <20% churn.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Phase 3: Expansion (Year 2+)',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: 'Adjacent sports. AI coaching. Enterprise play (high schools, colleges). Exit: Acquisition or IPO.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Funding: Seed $300K–500K (Months 1–3). Series A $1.5M–2M (Month 9–12).',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 },
        }),

        new PageBreak(),

        // Conclusion
        new Paragraph({
          text: 'Conclusion',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 200 },
        }),

        new Paragraph({
          text: 'Flag football is at an inflection point: 14% YoY youth growth, 60% high school expansion, $32M NFL investment. Coaches lack data-driven tools. FlagFit Pro fills a clear gap between expensive enterprise ($50K+) and generic consumer apps.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Recommended pricing ($199–599/team/season) captures willingness-to-pay, delivers strong unit economics (75–80% gross margin), and reaches profitability by Year 3. Direct acquisition, freemium funnel, and wearable partnerships will accelerate adoption.',
          spacing: { after: 200 },
        }),

        new Paragraph({
          text: 'Success depends on rapid MVP launch, early market validation, and defensible positioning through data + community. The market is ready. The time to move is now.',
          spacing: { after: 400 },
        }),

      ],
    },
  ],
});

const outputPath = process.env.OUTPUT_PATH || '/Users/aljosaursakous/Desktop/Flag football HTML - APP/FlagFit-Pro-Business-Development-Plan.docx';

Packer.toBuffer(doc).then(buffer => {
  writeFileSync(outputPath, buffer);
  console.log('Document created successfully!');
}).catch(error => {
  console.error('Failed to generate document:', error);
  process.exit(1);
});
