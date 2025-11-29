# Assignment 2 - Quick Command Reference

## Snyk Commands

```bash
# Navigate to backend
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment/golang-gin-realworld-example-app

# Basic vulnerability test
snyk test

# Test with JSON output
snyk test --json > snyk-backend-report.json

# Test only high severity
snyk test --severity-threshold=high

# Monitor (upload to dashboard)
snyk monitor

# Navigate to frontend
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment/react-redux-realworld-example-app

# Test dependencies
snyk test --json > snyk-frontend-report.json

# Test source code
snyk code test

# Test code with JSON output
snyk code test --json > snyk-code-report.json

# Fix vulnerabilities automatically (with prompts)
snyk wizard

# View detailed help
snyk test --help
```

---

## Application Commands

```bash
# Start Backend (Terminal 1)
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment/golang-gin-realworld-example-app
go run hello.go
# Should see: "Listening and serving HTTP on :8080"

# Start Frontend (Terminal 2)
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment/react-redux-realworld-example-app
npm start
# Should open browser at http://localhost:4100

# Check if backend is running
curl http://localhost:8080/api/tags

# Check if frontend is running
curl http://localhost:4100
```

---

## OWASP ZAP Commands

```bash
# Start ZAP GUI
zaproxy

# Or if installed manually
cd ~/ZAP_2.14.0
./zap.sh

# Docker - Baseline scan
docker run -t zaproxy/zap-stable zap-baseline.py -t http://localhost:4100 -r report.html

# Docker - Full scan
docker run -t zaproxy/zap-stable zap-full-scan.py -t http://localhost:4100 -r report.html

# Docker - API scan
docker run -t zaproxy/zap-stable zap-api-scan.py -t http://localhost:8080/api -f openapi -r report.html
```

---

## API Testing Commands (curl)

### Authentication
```bash
# Register new user
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "username": "testuser",
      "email": "test@example.com",
      "password": "SecurePass123!"
    }
  }'

# Login
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "security-test@example.com",
      "password": "SecurePass123!"
    }
  }' | jq

# Get current user (requires token)
curl -X GET http://localhost:8080/api/user \
  -H "Authorization: Token YOUR_JWT_TOKEN_HERE"
```

### Articles
```bash
# Get all articles
curl http://localhost:8080/api/articles | jq

# Get single article
curl http://localhost:8080/api/articles/article-slug-here | jq

# Create article (requires auth)
curl -X POST http://localhost:8080/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "article": {
      "title": "Test Article",
      "description": "Test description",
      "body": "Test body content",
      "tagList": ["test", "security"]
    }
  }' | jq

# Update article (requires auth)
curl -X PUT http://localhost:8080/api/articles/test-article \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "article": {
      "title": "Updated Title"
    }
  }' | jq

# Delete article (requires auth)
curl -X DELETE http://localhost:8080/api/articles/test-article \
  -H "Authorization: Token YOUR_TOKEN"

# Favorite article
curl -X POST http://localhost:8080/api/articles/test-article/favorite \
  -H "Authorization: Token YOUR_TOKEN" | jq

# Unfavorite article
curl -X DELETE http://localhost:8080/api/articles/test-article/favorite \
  -H "Authorization: Token YOUR_TOKEN" | jq
```

### Comments
```bash
# Get comments for article
curl http://localhost:8080/api/articles/test-article/comments | jq

# Add comment (requires auth)
curl -X POST http://localhost:8080/api/articles/test-article/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "comment": {
      "body": "This is a test comment"
    }
  }' | jq

# Delete comment (requires auth)
curl -X DELETE http://localhost:8080/api/articles/test-article/comments/1 \
  -H "Authorization: Token YOUR_TOKEN"
```

### Security Testing Payloads
```bash
# SQL Injection test
curl "http://localhost:8080/api/articles?tag=' OR '1'='1"

# XSS test in article title
curl -X POST http://localhost:8080/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "article": {
      "title": "<script>alert(\"XSS\")</script>",
      "description": "XSS test",
      "body": "Testing for XSS vulnerability",
      "tagList": []
    }
  }'

# XSS test in comment
curl -X POST http://localhost:8080/api/articles/test-article/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "comment": {
      "body": "<img src=x onerror=alert(\"XSS\")>"
    }
  }'

# Test without authentication (should fail)
curl -X POST http://localhost:8080/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "article": {
      "title": "Unauthorized",
      "description": "Test",
      "body": "Test"
    }
  }'

# Test with invalid token
curl -X GET http://localhost:8080/api/user \
  -H "Authorization: Token invalid-token-12345"
```

---

## Git Commands (for SonarQube)

```bash
# Navigate to project root
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment

# Check status
git status

# Add all files
git add .

# Commit
git commit -m "Add security testing setup"

# Push to trigger SonarQube analysis
git push origin main

# View remote
git remote -v
```

---

## SonarQube Commands (if using local scanner)

```bash
# Install SonarScanner (Linux)
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
unzip sonar-scanner-cli-5.0.1.3006-linux.zip
export PATH=$PATH:$(pwd)/sonar-scanner-5.0.1.3006-linux/bin

# Run analysis on backend
cd golang-gin-realworld-example-app
sonar-scanner \
  -Dsonar.projectKey=realworld-backend \
  -Dsonar.organization=your-org \
  -Dsonar.sources=. \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.login=YOUR_SONAR_TOKEN

# Run analysis on frontend
cd react-redux-realworld-example-app
sonar-scanner \
  -Dsonar.projectKey=realworld-frontend \
  -Dsonar.organization=your-org \
  -Dsonar.sources=src \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.login=YOUR_SONAR_TOKEN
```

---

## Useful Utility Commands

```bash
# Check if port is in use
sudo lsof -i :8080
sudo lsof -i :4100

# Kill process on port
sudo kill -9 $(sudo lsof -t -i:8080)

# Check running processes
ps aux | grep go
ps aux | grep node

# Save command output to file
snyk test | tee snyk-output.txt

# Pretty print JSON
curl http://localhost:8080/api/tags | jq '.'

# Count vulnerabilities in Snyk JSON
cat snyk-backend-report.json | jq '.vulnerabilities | length'

# Extract only critical vulnerabilities
cat snyk-backend-report.json | jq '.vulnerabilities[] | select(.severity=="critical")'

# Create directory for reports
mkdir -p security-reports screenshots

# Zip all reports for submission
zip -r assignment2-submission.zip \
  ASSIGNMENT_2_REPORT.md \
  snyk-*.md snyk-*.json \
  sonarqube-*.md \
  zap-*.md zap-*.html zap-*.xml zap-*.json \
  security-headers-analysis.md \
  final-security-assessment.md \
  screenshots/
```

---

## Verification Commands

```bash
# Verify Snyk installation
snyk --version
snyk auth

# Verify Node/npm
node --version
npm --version

# Verify Go
go version

# Verify Java (for ZAP)
java -version

# Verify curl
curl --version

# Verify jq (JSON processor)
jq --version

# Install jq if missing
sudo apt install jq

# Check internet connectivity
ping -c 3 google.com

# Test backend API
curl -I http://localhost:8080/api/tags

# Test frontend
curl -I http://localhost:4100
```

---

## Screenshot Commands (Linux)

```bash
# Full screen screenshot
gnome-screenshot

# Window screenshot (click window after command)
gnome-screenshot -w

# Area screenshot (select area after command)
gnome-screenshot -a

# Delayed screenshot (5 seconds)
gnome-screenshot -d 5

# Screenshot with custom name
gnome-screenshot -f ~/Desktop/SEM5/SWE302/Assignment/screenshots/snyk-dashboard.png

# Using scrot (alternative)
sudo apt install scrot
scrot ~/Desktop/screenshot.png
scrot -s ~/Desktop/area-screenshot.png  # Select area
```

---

## Emergency Commands

```bash
# If Go server won't stop
pkill -f "go run hello.go"

# If npm server won't stop
pkill -f "node.*react-scripts"

# If database is locked
cd golang-gin-realworld-example-app
rm gorm.db
# Will be recreated on next run

# Clear npm cache if install fails
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Clear Go module cache
go clean -modcache
go mod download

# Reset Git if needed
git reset --hard HEAD
git clean -fd
```

---

## Copy-Paste Ready Commands

### Quick Start (3 terminals needed)

**Terminal 1 - Backend:**
```bash
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment/golang-gin-realworld-example-app && go run hello.go
```

**Terminal 2 - Frontend:**
```bash
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment/react-redux-realworld-example-app && npm start
```

**Terminal 3 - Testing:**
```bash
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment
```

### Quick Snyk Scan (from Terminal 3)
```bash
cd golang-gin-realworld-example-app && snyk test --json > ../snyk-backend-report.json && cd ../react-redux-realworld-example-app && snyk test --json > ../snyk-frontend-report.json && snyk code test --json > ../snyk-code-report.json && cd ..
```

### Get JWT Token
```bash
curl -X POST http://localhost:8080/api/users/login -H "Content-Type: application/json" -d '{"user":{"email":"security-test@example.com","password":"SecurePass123!"}}' | jq -r '.user.token'
```

---

## File Paths Reference

```
Project Root: /home/namgyel/Desktop/SEM5/SWE302/Assignment

Backend: /home/namgyel/Desktop/SEM5/SWE302/Assignment/golang-gin-realworld-example-app
Frontend: /home/namgyel/Desktop/SEM5/SWE302/Assignment/react-redux-realworld-example-app
Assignments: /home/namgyel/Desktop/SEM5/SWE302/Assignment/swe302_assignments-master

Reports Directory: /home/namgyel/Desktop/SEM5/SWE302/Assignment/
Screenshots: /home/namgyel/Desktop/SEM5/SWE302/Assignment/screenshots/
```

---

## Pro Tips

1. **Use `| jq` to format JSON output** - Makes API responses readable
2. **Use `tee` to save and view output** - `command | tee output.txt`
3. **Keep tokens in environment variable** - `export TOKEN="your-jwt-token"`
4. **Use `watch` for monitoring** - `watch -n 2 curl http://localhost:8080/api/tags`
5. **Save all commands to history** - They're in your bash history!

---

Save this file and keep it open in another terminal window for quick reference! 📋
