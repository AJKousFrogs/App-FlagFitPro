# FlagFit Pro — GDPR Compliance & Data Processing Agreement (DPA)

**Effective Date:** July 22, 2026  
**Jurisdiction:** EU, UK, EEA (GDPR-regulated)  
**Applicability:** All users in EU, UK, EEA; any non-EU resident with GDPR protections

---

## 1. GDPR COMPLIANCE FRAMEWORK

### 1.1 Our Role(s) Under GDPR
- **Data Controller** (primary): When you sign up for FlagFit Pro and manage your own data
- **Data Processor** (acting for coaches/team managers): When storing injury data coaches submit on your behalf
- **Joint Controller** (with your team/club): When processing team-wide analytics

**What this means:**
- As controller: We decide what data to collect, retention periods, your rights
- As processor: We follow instructions from your coach/team manager (respecting your consent)

### 1.2 Your Rights Under GDPR (Detailed)

#### Right of Access (Article 15)
**What:** Receive a copy of all personal data we hold about you  
**How to exercise:**
- Email: privacy@flagfitpro.com
- Include: Full name, email, date of birth
- We provide: Downloadable CSV/PDF within 30 days

**Technical details:**
- Machine-readable format (CSV, JSON, XML available)
- All linked data (training logs, injuries, assessments)
- Third-party sources (wearable data you authorized)
- Our internal processing notes (lawful basis, retention period, etc.)

#### Right of Rectification (Article 16)
**What:** Correct inaccurate personal data  
**How to exercise:**
- Settings > Profile > Edit (for self-service corrections)
- Or email privacy@flagfitpro.com with changes
- We correct within 10 business days

**Examples:**
- Wrong date of birth → You correct in Settings
- Physio recorded wrong injury location → Request we correct
- Duplicate account → We merge or delete

#### Right to Erasure ("Right to be Forgotten") (Article 17)
**What:** Delete your account & all associated data  
**How to exercise:**
- Settings > Privacy > Delete Account (immediate)
- Or email: privacy@flagfitpro.com with "I request full deletion"
- We delete within 30 days

**What gets deleted:**
- ✅ Profile (name, email, password)
- ✅ Training history
- ✅ Injury records
- ✅ Assessments & test results
- ✅ Biometric data (from wearables)
- ✅ Communication history
- ✅ Payment records (after tax retention period)

**What doesn't get deleted (legal requirement):**
- ❌ Anonymized/aggregated data (you can't be identified)
- ❌ Backup copies (deleted within 90 days per backup schedule)
- ❌ Tax records (7-year retention: legal obligation)
- ❌ Fraud investigation data (if applicable, held during investigation)

**Exceptions to deletion:**
- **Data subject requested it:** Only if no other legal basis applies
- **Legal obligation:** We're required to keep (tax, fraud, etc.)
- **Public interest:** Rare; publication already done
- **Your explicit consent:** For specific purposes (e.g., research)

#### Right to Restrict Processing (Article 18)
**What:** Pause processing while you dispute accuracy or lawfulness  
**How to exercise:**
- Email: privacy@flagfitpro.com with request & reason
- We mark your account "restricted" within 5 business days

**Effect of restriction:**
- We store data but don't use it (no analytics, no coaching dashboard updates)
- Exception: Processing needed for your safety (e.g., high injury risk alert)
- You can request lifting restrictions later

**Typical scenario:**
- You dispute injury date accuracy
- We restrict processing while investigating (you can verify)
- If accurate, restrictions lifted; if not, we correct

#### Right to Data Portability (Article 20)
**What:** Get your data in machine-readable format, transfer to another service  
**How to exercise:**
- Settings > Privacy > Export My Data
- Or email: privacy@flagfitpro.com with "I request data portability"
- We provide within 30 days

**What we provide:**
- All personal data in structured, commonly-used format (CSV, JSON)
- Organized by category (profile, training, injuries, assessments)
- Downloadable directly or emailed as archive

**Portability includes:**
- ✅ Your profile data
- ✅ Training history (all sessions, ACWR calculations)
- ✅ Injury records & assessments
- ✅ Wearable data you imported
- ✅ Communications (if applicable)
- ✅ Metadata (dates created, modified)

**Note:** Coaches' analysis/commentary is not portable (their intellectual effort).

#### Right to Object (Article 21)
**What:** Opt-out of processing based on "legitimate interest" or direct marketing  
**How to exercise:**
- Settings > Privacy > Opt-out of Processing
- Or email: privacy@flagfitpro.com with "I object to [type] processing"

**Processing you can object to:**
- ✅ Analytics/personalization ("I don't want recommendations")
- ✅ Marketing emails ("Stop sending me tips")
- ✅ Profiling ("Don't use my data to predict injury risk")
- ✅ Research ("Don't use my data for publications")

**Processing you cannot object to:**
- ❌ Service delivery (you need training tracking to use the app)
- ❌ Legal compliance (required tax records)
- ❌ Safety (injury risk alerts)

#### Right to Withdraw Consent (Implicit in Articles 7, 9)
**What:** If you consented to something, you can take it back  
**How to exercise:**
- Settings > Privacy > Consent > Toggle off any consent
- Or email: privacy@flagfitpro.com with "I withdraw consent for [type]"
- Effective immediately

**Examples of consent you can withdraw:**
- Wearable integration ("Stop syncing Apple Watch")
- Health data collection ("Don't store my medical history")
- Research data usage ("Don't use my data for studies")
- Marketing communications ("Stop emailing me")

**Important:** Withdrawal doesn't affect processing that already happened (legality is confirmed by past consent).

#### Right Not to Be Subject to Automated Decision-Making (Article 22)
**What:** Decisions fully made by algorithm (no human involved) can't significantly affect you  
**How this applies to FlagFit:**
- ✅ Automated alert: "ACWR over 1.5 — consider rest day" (human can override)
- ❌ Automated denial: "You're injured; you cannot play" (this requires human review by coach/physio)

**Your right:**
- Know when an automated decision affects you
- Request human review ("I want a coach to manually review my RTP phase")
- Object to fully automated decisions (we provide manual alternative)

**Opting out:**
- Email: privacy@flagfitpro.com with "I opt-out of automated [decision type]"
- We'll involve a staff member in future decisions affecting you

---

## 2. DATA PROCESSING AGREEMENT (BETWEEN YOU & US)

### 2.1 Processing Activities

**Activity 1: Account Management & Authentication**
- **What data:** Email, password hash, name, login history
- **Purpose:** Provide account access, prevent fraud
- **Lawful basis:** Contract (Article 6(1)(b))
- **Retention:** While account active; deleted on account deletion
- **Recipients:** AWS (hosting), Sentry (error monitoring)

**Activity 2: Training Load & ACWR Calculation**
- **What data:** Training sessions (exercise, duration, weight, reps, RPE)
- **Purpose:** Calculate acute:chronic workload ratio
- **Lawful basis:** Contract (Article 6(1)(b)) + Legitimate interest in athlete health (Article 6(1)(f))
- **Retention:** Active account + 7 years after deletion (aggregated only)
- **Recipients:** AWS, analytics tools, coaches (if team member)

**Activity 3: Health Data Processing (Injury, Assessment, Medical History)**
- **What data:** Injury date/type, medical history, functional tests, psychological assessments, medications, allergies
- **Purpose:** Athlete safety, RTP protocol assignment, coaching decisions
- **Lawful basis:** Explicit consent (Article 9(2)(a)) + Vital interests (Article 9(2)(c) — preventing serious harm)
- **Retention:** Active account + 10 years (medical record standard)
- **Recipients:** AWS, medical staff (physios, nutritionists, psychologists), coaches, legal holds (if injury litigation)
- **Special care:** Encrypted at rest (AES-256), access restricted to medical staff, audit logs

**Activity 4: Wearable Data Sync**
- **What data:** Heart rate, sleep, HRV, temperature, movement, menstrual cycle (if tracked)
- **Purpose:** Personalized recovery recommendations, correlation with training load
- **Lawful basis:** Consent (Article 6(1)(a)) — **you explicitly authorize Apple/Garmin sync**
- **Retention:** While sync active; deleted on account deletion or sync disable
- **Recipients:** AWS, analytics
- **Right to withdraw:** Disable sync anytime (Settings > Integrations)

**Activity 5: Usage Analytics & Improvement**
- **What data:** Pages visited, features used, time spent, device type, approximate location (from IP)
- **Purpose:** Understand how users interact, improve UX, identify bugs
- **Lawful basis:** Consent (Article 6(1)(a)) + Legitimate interest (Article 6(1)(f))
- **Retention:** 13 months (Google Analytics default)
- **Recipients:** Google Analytics 4 (anonymized, IP anonymization enabled)
- **Right to object:** Settings > Privacy > Disable Analytics (stored in local storage, we honor it)

**Activity 6: Payment Processing**
- **What data:** Name, email, payment method (card or bank), transaction amount/date, billing address
- **Purpose:** Process subscription payments, invoice generation, fraud prevention
- **Lawful basis:** Contract (Article 6(1)(b))
- **Retention:** 7 years (tax requirement) + 7 years post-deletion (audit trail)
- **Recipients:** Stripe (payment processor), tax software
- **Security:** Stripe handles PCI-DSS compliance; we never see full card numbers

**Activity 7: Communications & Support**
- **What data:** Email address, support tickets, chat messages, attachments
- **Purpose:** Respond to support requests, troubleshoot, improve support
- **Lawful basis:** Consent (Article 6(1)(a)) + Contract (Article 6(1)(b))
- **Retention:** 2 years post-resolution (reference); deleted on request
- **Recipients:** AWS (hosting), support staff

**Activity 8: Legal Compliance & Fraud Prevention**
- **What data:** Account activity, login history, payment history, IP addresses
- **Purpose:** Detect fraud, prevent abuse, comply with legal obligations
- **Lawful basis:** Legitimate interest (Article 6(1)(f)) + Legal obligation (Article 6(1)(c))
- **Retention:** 3 years (fraud investigation statute of limitations)
- **Recipients:** Internal (fraud team), legal counsel if needed

### 2.2 Sub-Processors (Data Processors Acting Under Our Direction)

We use the following processors. **You have a right to know and object.**

| Processor | Location | Data Access | Service | DPA |
|-----------|----------|-------------|---------|-----|
| Amazon Web Services (AWS) | EU (Frankfurt, Ireland) + US (Ohio) | All data | Hosting, compute, backup | ✅ Signed |
| Supabase (PostgreSQL) | AWS-backed, EU region | All data | Database | ✅ Signed |
| Stripe | USA | Payment data | Payment processing | ✅ Signed (via Stripe DPA) |
| Google Analytics 4 | USA (with anonymization) | Anonymized usage | Analytics | ✅ Signed (via Google DPA) |
| Sentry | USA | Error logs, stack traces | Error tracking | ✅ Signed |
| SendGrid | USA | Email addresses, message content | Transactional email | ✅ Signed |
| Mailgun | USA | Email addresses | Backup email | ✅ Signed |
| Intercom | USA | Support chat messages | Support tool | ✅ Signed (if enabled) |

**Right to object to sub-processors:**
- Email: privacy@flagfitpro.com with "I object to [processor]"
- We'll notify you of alternative or give you 30 days to delete account
- For essential processors (AWS, Stripe), we'll explain why change isn't feasible

### 2.3 Data Transfers Outside EU

**If applicable** (e.g., US resident accessing service or US sub-processor):
- **Legal mechanism:** Standard Contractual Clauses (SCCs) per GDPR Article 46(2)
- **Document:** Available on request from privacy@flagfitpro.com
- **Assurance:** Schrems II compliant (includes supplementary measures)
- **Your rights:** You can request details or object (see Article 21 objection process)

---

## 3. ORGANIZATIONAL & TECHNICAL SAFEGUARDS

### 3.1 Privacy by Design & Default
- **Encryption by default:** Health data encrypted at rest (AES-256)
- **Minimal data:** Collect only what's necessary for stated purpose
- **Access control:** Role-based (coaches see team data, not health staff data)
- **Data retention:** Automatic deletion per retention schedule

### 3.2 Personnel & Training
- **Data protection officer function:** Handled by Privacy Lead (Aljosa Kousalik)
- **Employee training:** Annual GDPR & data protection training
- **Background checks:** All staff with data access undergo screening
- **Confidentiality:** All staff sign confidentiality & DPA addendum

### 3.3 Security Measures
- **Infrastructure:**
  - TLS/SSL for all data in transit
  - VPC with firewall, WAF
  - DDoS protection (AWS Shield)
  - Daily automated backups
  
- **Application:**
  - Input validation (prevent injection attacks)
  - Output encoding (prevent XSS)
  - CSRF tokens on all forms
  - Rate limiting (prevent brute force)
  - Password hashing (bcrypt, not reversible)

- **Monitoring:**
  - Real-time intrusion detection
  - Quarterly penetration testing
  - Annual third-party security audit
  - Security incident response plan

### 3.4 Incident Response & Breach Notification

**In event of data breach:**

1. **Investigation (within 24 hours):**
   - Assess scope, cause, affected data types
   - Document evidence, notifications sent
   - Begin remediation

2. **Notification to Authorities (if required, within 72 hours):**
   - **GDPR:** If breach "likely to result in risk" (e.g., unencrypted health data exposed)
   - Contact your data protection authority
   - Provide: Description, likely consequences, safeguards taken

3. **Notification to You (within 72 hours):**
   - Email with subject: "Data Breach Notification"
   - Include: What happened, data affected, our response, recommended steps
   - Example: "Between 2026-07-22 to 2026-07-23, an attacker accessed [X] accounts. We encrypted the database and reset affected passwords. Change yours immediately."

4. **Documentation:**
   - Maintain breach register (30-year retention per GDPR recital 86)
   - Report to DPA if requested

---

## 4. CROSS-BORDER DATA FLOWS

### 4.1 EU ↔ USA Transfers

**Legal basis for transfers:**
- **Standard Contractual Clauses (SCCs):** GDPR Article 46(2), Commission Decision 2021/915
- **Supplementary measures** (Schrems II compliant):
  - Encryption of health data at rest (key held in EU)
  - Data residency options (you can choose EU-only hosting)
  - Legal structure: Data remains under EU control while in US systems

**Processors with US operations:**
- Stripe (payments): USA-based, uses SCCs + encryption
- Google Analytics: USA, anonymized + IP anonymization
- Sentry: USA, contains error logs (no health data)
- SendGrid: USA (backup email provider)

**Your rights:**
- Know which data goes to USA: All of the above, except encrypted health data stays EU
- Opt-out: Choose "EU Data Residency" option (limits US sub-processors)
- Complaint: If you believe transfer violates privacy, contact:
  - Your DPA (e.g., Slovenia: Informacijski komisar)
  - European Data Protection Board (EDPB)

### 4.2 UK Data Transfers
- **Legal basis:** UK GDPR Adequacy Decision (post-Brexit)
- **Same process:** SCCs + supplementary measures
- **Authority:** UK Information Commissioner's Office (ICO)

---

## 5. REPRESENTATIVES & CONTACT

### 5.1 Data Protection Lead / Privacy Contact
**Name:** Aljosa Kousalik  
**Email:** privacy@flagfitpro.com  
**Mail:** FlagFit Pro, Ljubljana, Slovenia  
**Role:** Handles all data subject requests, GDPR compliance, breach response

### 5.2 Data Protection Authority Contacts

**For your jurisdiction:**

| Country | Authority | Email | Website |
|---------|-----------|-------|---------|
| **Slovenia** | Informacijski komisar | info@ip-rs.si | https://www.ip-rs.si |
| **Germany** | BfDI (Bundesbeauftragte) | info@bfdi.bund.de | https://www.bfdi.bund.de |
| **France** | CNIL | cil@cnil.fr | https://www.cnil.fr |
| **Italy** | Garante per la Protezione dei Dati | info@garanteprivacy.it | https://www.garanteprivacy.it |
| **Spain** | AEPD | internacional@aepd.es | https://www.aepd.es |
| **Austria** | DSB | dsb@dsb.gv.at | https://www.dsb.gv.at |
| **Netherlands** | AP (Autoriteit Persoonsgegevens) | info@ap.nl | https://www.autoriteitpersoonsgegevens.nl |
| **UK** | ICO | international@ico.org.uk | https://www.ico.org.uk |

---

## 6. COMPLIANCE AUDITS & ACCOUNTABILITY

### 6.1 Annual Audit Schedule
- **Q1:** Data inventory audit (what data do we have, why, for how long?)
- **Q2:** Access control audit (who has access to what?)
- **Q3:** Security audit (third-party penetration test)
- **Q4:** Compliance review (GDPR, national laws, sub-processor updates)

### 6.2 Documentation
We maintain records of:
- **Processing Register:** All processing activities, lawful basis, retention periods
- **Impact Assessment (DPIA):** For high-risk activities (health data, automation)
- **Contracts:** DPAs with all sub-processors
- **Policies:** Privacy policy, data retention schedule, incident response plan
- **Training:** Employee GDPR training records
- **Breaches:** Register of any data security incidents

**You can request:**
- Copy of this documentation (email: privacy@flagfitpro.com)
- Evidence of our GDPR compliance

### 6.3 Third-Party Audits
- **SOC 2 Type II:** Annual audit by external firm (covers security, availability, confidentiality)
- **Penetration Testing:** Quarterly by external security firm
- **Reports:** Available for enterprise customers, summary for others

---

## 7. GDPR COMPLIANCE CHECKLIST

We confirm compliance with:
- ✅ **Article 5:** Lawful, fair, transparent, purpose-limited, data-minimized, accurate, secure, retention-limited
- ✅ **Article 6:** Lawful basis determined before processing (contract, consent, legitimate interest, legal obligation, vital interest, public task)
- ✅ **Article 9:** Special category data (health) processed only with consent or vital interest
- ✅ **Article 13 & 14:** Privacy notices provided at collection & before use
- ✅ **Article 15–22:** Data subject rights implemented & honored
- ✅ **Article 25:** Privacy by design, data minimization
- ✅ **Article 28:** Data Processing Agreements with sub-processors
- ✅ **Article 30:** Processing register maintained
- ✅ **Article 32:** Technical & organizational security measures
- ✅ **Article 33 & 34:** Breach notification to authority & individuals
- ✅ **Article 35 & 36:** DPIA for high-risk processing
- ✅ **Article 37:** Privacy lead designated (privacy@flagfitpro.com)
- ✅ **Article 46:** Standard Contractual Clauses for international transfers

---

## 8. UPDATES & CHANGES

**This DPA is effective July 22, 2026.**

Changes to:
- Lawful basis → 30-day notice
- Sub-processors → 30-day notice (can object)
- Retention periods → 30-day notice
- Technical measures → No notice required (improvements)

**Notice method:** Email to your account + banner on next login

---

## SUMMARY

**You are protected by:**
1. **GDPR (if EU/UK/EEA resident):** Full rights to access, delete, port, object
2. **This DPA:** Commitment to lawful processing, secure storage, sub-processor oversight
3. **Our controls:** Encryption, access control, annual audits, incident response plan
4. **Your rights:** Exercise at any time via privacy@flagfitpro.com

**Questions about your rights or our GDPR compliance?**  
Email: privacy@flagfitpro.com  
Response time: 10 business days
