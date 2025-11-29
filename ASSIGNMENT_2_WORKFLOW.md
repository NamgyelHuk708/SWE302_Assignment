# Assignment 2 - Execution Workflow

## Quick Reference Guide

This is your step-by-step workflow once environment is set up.

---

## Phase 1: SAST with Snyk (2-3 hours)

### Backend Scan
```bash
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment/golang-gin-realworld-example-app

# Run basic test
snyk test

# Generate JSON report for backend dependencies
snyk test --json > snyk-backend-report.json

# View results in terminal
snyk test --severity-threshold=high

# Monitor (uploads to dashboard)
snyk monitor
```

**Create:** `snyk-backend-analysis.md`
- Count vulnerabilities by severity
- Document each critical/high issue with CVE, description, fix
- Screenshot of Snyk dashboard

### Frontend Scan
```bash
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment/react-redux-realworld-example-app

# Test dependencies
snyk test --json > snyk-frontend-report.json

# Test source code (IMPORTANT!)
snyk code test --json > snyk-code-report.json

# Monitor
snyk monitor
```

**Create:** `snyk-frontend-analysis.md`
- Dependency vulnerabilities
- Code vulnerabilities (XSS, hardcoded secrets, etc.)
- React-specific issues

### Remediation
**Create:** `snyk-remediation-plan.md`
- Prioritize by severity
- List upgrade paths
- Identify breaking changes

### Fix Vulnerabilities
```bash
# Example: Update vulnerable package
cd react-redux-realworld-example-app
npm update <package-name>

# Or for specific version
npm install <package-name>@<version>

# Test after update
npm test
npm start

# Verify fix
snyk test
```

**Create:** `snyk-fixes-applied.md`
- Document 3+ critical/high fixes
- Before/after screenshots
- Code changes made

---

## Phase 2: SAST with SonarQube (2-3 hours)

### Option A: GitHub Actions (Recommended)

1. **Push code to GitHub:**
```bash
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment
git add .
git commit -m "Initial commit for security testing"
git push origin main
```

2. **Create GitHub Actions Workflow:**

Create: `.github/workflows/sonarqube-backend.yml`
```yaml
name: SonarQube Backend Analysis
on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  sonarqube:
    name: SonarQube Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: SonarQube Scan
        uses: SonarSource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: https://sonarcloud.io
        with:
          projectBaseDir: golang-gin-realworld-example-app
          args: >
            -Dsonar.organization=your-org
            -Dsonar.projectKey=your-project-key
```

3. **View results on SonarCloud:**
- Go to https://sonarcloud.io
- Select your project
- Take screenshots

### Option B: Local Analysis

```bash
# Create sonar-project.properties in backend root
cd golang-gin-realworld-example-app
cat > sonar-project.properties << EOF
sonar.projectKey=realworld-backend
sonar.organization=your-org
sonar.sources=.
sonar.host.url=https://sonarcloud.io
sonar.login=YOUR_SONAR_TOKEN
EOF

# Run analysis
sonar-scanner
```

### Document Findings

**Create:** `sonarqube-backend-analysis.md`
- Quality Gate status (Pass/Fail)
- Bugs count and details
- Vulnerabilities with OWASP/CWE mapping
- Code Smells count
- Security Hotspots
- Screenshots of dashboard, issues, security page

**Create:** `sonarqube-frontend-analysis.md`
- Same structure as backend
- Focus on React/JS specific issues
- XSS vulnerabilities
- Console statements, unused code

**Create:** `security-hotspots-review.md`
- Review each hotspot
- Assess if it's a real vulnerability
- Document exploit scenario
- Risk level assessment

---

## Phase 3: DAST with OWASP ZAP (4-5 hours)

### Step 1: Start Applications
```bash
# Terminal 1: Backend
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment/golang-gin-realworld-example-app
go run hello.go
# Wait for: "Listening and serving HTTP on :8080"

# Terminal 2: Frontend
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment/react-redux-realworld-example-app
npm start
# Wait for: "Compiled successfully!"
# Browser opens to http://localhost:4100
```

### Step 2: Passive Scan (15 minutes)

1. **Launch ZAP**
```bash
zaproxy  # or ./ZAP_2.14.0/zap.sh
```

2. **Configure Automated Scan:**
   - Click "Automated Scan"
   - URL: `http://localhost:4100`
   - Check "Use traditional spider"
   - Click "Attack"

3. **Wait for scan to complete** (~10-15 minutes)

4. **Export Report:**
   - Report → Generate HTML Report
   - Save as: `zap-passive-report.html`

**Create:** `zap-passive-scan-analysis.md`
- Total alerts by risk level
- High priority findings (missing headers, cookie issues, CORS)
- Evidence and screenshots

### Step 3: Configure Authentication (30 minutes)

This is crucial for active scan!

1. **Get JWT Token manually:**
```bash
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "security-test@example.com",
      "password": "SecurePass123!"
    }
  }'

# Copy the token from response
```

2. **In ZAP GUI:**
   - Click "Sites" tab → Right-click `http://localhost:4100` → Include in Context → New Context
   - Name: "Conduit Authenticated"
   
3. **Configure Authentication:**
   - Top menu: Analyse → Include in Context → Conduit Authenticated
   - Right-click context → Context properties
   - Authentication tab:
     - Method: "JSON-based Authentication"
     - Login URL: `http://localhost:8080/api/users/login`
     - Login request POST data:
       ```json
       {"user":{"email":"security-test@example.com","password":"SecurePass123!"}}
       ```
     - Username parameter: `user.email`
     - Password parameter: `user.password`
     - Logged in regex: `.*token.*`
     - Logged out regex: `.*errors.*`

4. **Configure Session Management:**
   - Session Management tab
   - Method: "HTTP Authentication"
   - Add to header: `Authorization: Token {%json:user.token%}`

5. **Add User:**
   - Users tab → Add
   - Username: security-test@example.com
   - Password: SecurePass123!
   - Enable user

### Step 4: Active Scan (60+ minutes)

1. **Spider with Authentication:**
   - Tools → Spider
   - Context: Conduit Authenticated
   - User: security-test@example.com
   - Start Scan
   - Wait for completion (~10 minutes)

2. **Active Scan:**
   - Right-click `http://localhost:4100` → Attack → Active Scan
   - Context: Conduit Authenticated
   - User: security-test@example.com
   - Policy: "OWASP Top 10"
   - Click "Start Scan"
   - **This will take 30-60+ minutes!** Get coffee ☕

3. **Export Reports:**
   - Report → Generate HTML Report → `zap-active-report.html`
   - Report → Export report → XML → `zap-active-report.xml`
   - Report → Export report → JSON → `zap-active-report.json`

**Create:** `zap-active-scan-analysis.md`
- Vulnerability summary with OWASP Top 10 mapping
- Each critical/high vulnerability in detail:
  - Name, Risk, URLs affected
  - CWE and OWASP category
  - Description and attack details
  - Evidence (request/response)
  - Impact and remediation
- Expected: SQL Injection, XSS, Auth issues, CSRF, etc.

### Step 5: API Security Testing (60 minutes)

Test each API endpoint manually in ZAP:

**Authentication Tests:**
```bash
# Test 1: Access protected endpoint without token
GET http://localhost:8080/api/user
# Should return 401

# Test 2: Use invalid token
GET http://localhost:8080/api/user
Authorization: Token invalid-token-here
# Should return 401

# Test 3: Use expired token
# (Create token, wait, use it)
```

**Authorization Tests:**
```bash
# Test 1: Try to delete another user's article
# Login as user1, get article slug from user2
DELETE http://localhost:8080/api/articles/{user2-slug}
Authorization: Token {user1-token}
# Should return 403 or 401

# Test 2: Update another user's profile
PUT http://localhost:8080/api/user
Authorization: Token {user1-token}
# Try to change user2's data
```

**Input Validation Tests:**
```bash
# Test SQL Injection
GET http://localhost:8080/api/articles?tag=' OR '1'='1

# Test XSS in article title
POST http://localhost:8080/api/articles
{
  "article": {
    "title": "<script>alert('XSS')</script>",
    "description": "Test",
    "body": "Test",
    "tagList": []
  }
}

# Test XSS in comments
POST http://localhost:8080/api/articles/test-slug/comments
{
  "comment": {
    "body": "<img src=x onerror=alert('XSS')>"
  }
}
```

**Create:** `zap-api-security-analysis.md`
- Document each API vulnerability
- Include proof-of-concept requests/responses
- Risk assessment per endpoint

### Step 6: Implement Security Fixes (2-3 hours)

**Add Security Headers:**

Edit: `golang-gin-realworld-example-app/hello.go`
```go
// Add after router initialization
router.Use(func(c *gin.Context) {
    c.Header("X-Frame-Options", "DENY")
    c.Header("X-Content-Type-Options", "nosniff")
    c.Header("X-XSS-Protection", "1; mode=block")
    c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    c.Header("Content-Security-Policy", "default-src 'self'")
    c.Next()
})
```

**Fix Input Validation Issues:**
- Sanitize user inputs
- Add validation in validators.go
- Escape HTML in responses

**Fix Authentication Issues:**
- Add rate limiting
- Improve token validation
- Fix authorization checks

**Create:** `zap-fixes-applied.md`
- List each fix
- Code changes
- Before/after comparison

**Create:** `security-headers-analysis.md`
- Explain each header
- Why it's important
- Screenshot showing headers in ZAP

### Step 7: Final Verification (30 minutes)

```bash
# Restart applications with fixes
# Run full ZAP scan again
# Compare results
```

**Create:** `final-security-assessment.md`
- Before/after vulnerability counts
- Risk score improvement
- Remaining issues with mitigation plan
- Overall security posture

---

## Phase 4: Documentation & Submission (2 hours)

### Create Final Report

**Create:** `ASSIGNMENT_2_REPORT.md`

Structure:
```markdown
# Assignment 2 - Security Testing Report

## Executive Summary
- Brief overview
- Key findings summary
- Overall security posture

## SAST Findings

### Snyk Analysis
- Backend vulnerabilities: X critical, Y high
- Frontend vulnerabilities: X critical, Y high
- Key issues and fixes

### SonarQube Analysis
- Backend: Quality gate status, key issues
- Frontend: Quality metrics, security issues

## DAST Findings

### OWASP ZAP Analysis
- Passive scan: X alerts
- Active scan: Y vulnerabilities
- API security issues

## Remediation Summary
- Total vulnerabilities fixed: X
- Critical issues remaining: Y
- Mitigation strategies

## Conclusions
- Lessons learned
- Recommendations
- Future improvements
```

### Organize Files

```
Assignment/
├── ASSIGNMENT_2_REPORT.md          # Main report
├── snyk-backend-analysis.md
├── snyk-frontend-analysis.md
├── snyk-remediation-plan.md
├── snyk-fixes-applied.md
├── snyk-backend-report.json
├── snyk-frontend-report.json
├── snyk-code-report.json
├── sonarqube-backend-analysis.md
├── sonarqube-frontend-analysis.md
├── security-hotspots-review.md
├── zap-passive-scan-analysis.md
├── zap-active-scan-analysis.md
├── zap-api-security-analysis.md
├── zap-fixes-applied.md
├── security-headers-analysis.md
├── final-security-assessment.md
├── zap-passive-report.html
├── zap-active-report.html
├── zap-active-report.xml
├── zap-active-report.json
└── screenshots/
    ├── snyk-dashboard.png
    ├── sonarqube-backend.png
    ├── sonarqube-frontend.png
    ├── zap-passive-alerts.png
    ├── zap-active-vulnerabilities.png
    └── security-headers.png
```

---

## Time Management (for tomorrow!)

| Time | Task |
|------|------|
| 8:00-9:00 AM | Setup all tools |
| 9:00-10:30 AM | Snyk scans & analysis |
| 10:30-12:00 PM | SonarQube setup & analysis |
| 12:00-1:00 PM | Lunch break |
| 1:00-2:00 PM | ZAP passive scan & analysis |
| 2:00-3:00 PM | Configure ZAP authentication |
| 3:00-5:00 PM | ZAP active scan (let it run) |
| 5:00-6:00 PM | API security testing |
| 6:00-8:00 PM | Fix critical vulnerabilities |
| 8:00-9:00 PM | Final scans |
| 9:00-11:00 PM | Documentation & report |
| 11:30 PM | Submit! |

---

## Pro Tips

1. **Start ZAP active scan early** - it takes longest
2. **Document as you go** - don't leave documentation for the end
3. **Take screenshots immediately** - you'll forget later
4. **Save all command outputs** - use `tee` to save to files
5. **Test fixes incrementally** - don't fix everything at once
6. **Keep applications running** - avoid restarting unless necessary
7. **Use multiple terminals** - backend, frontend, testing commands

---

## Emergency Shortcuts (if running out of time)

**Priority 1 (Must Have):**
- ✅ Snyk backend & frontend scans with analysis
- ✅ ZAP passive scan analysis
- ✅ At least 3 vulnerability fixes documented

**Priority 2 (Should Have):**
- ✅ SonarQube analysis with screenshots
- ✅ ZAP active scan (even if not complete)
- ✅ Security headers implementation

**Priority 3 (Nice to Have):**
- API security testing details
- Complete remediation of all issues
- Perfect documentation

---

Good luck! You've got this! 🚀
