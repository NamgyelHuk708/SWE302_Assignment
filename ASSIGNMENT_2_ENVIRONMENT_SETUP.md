# Assignment 2 - Environment Setup Guide

## Overview
This guide will walk you through setting up Snyk, SonarQube Cloud, and OWASP ZAP for security testing.

---

## 1. Snyk Setup (SAST Tool #1)

### Step 1.1: Install Snyk CLI

```bash
# Install Snyk globally using npm
npm install -g snyk

# Verify installation
snyk --version
```

### Step 1.2: Create Snyk Account

1. Visit: https://snyk.io/
2. Click "Sign Up" or "Get Started Free"
3. Sign up using:
   - GitHub account (recommended - easier integration), OR
   - Google account, OR
   - Email address
4. Complete email verification if required

### Step 1.3: Authenticate Snyk CLI

```bash
# This will open a browser for authentication
snyk auth

# You'll see a message like:
# "Your account has been authenticated. Snyk is now ready to be used."
```

### Step 1.4: Verify Setup

```bash
# Test authentication
snyk test --help

# Should show help information without errors
```

---

## 2. SonarQube Cloud Setup (SAST Tool #2)

### Step 2.1: Create SonarQube Cloud Account

1. Visit: https://sonarcloud.io/
2. Click "Log in" or "Start now"
3. Sign up/Login with **GitHub account** (highly recommended for easy integration)
4. Authorize SonarQube to access your GitHub repositories

### Step 2.2: Create Organization

1. After login, click "+ Analyze new project"
2. Click "Create new organization" if you don't have one
3. Choose your GitHub account/organization
4. Give it a name (e.g., "YourUsername-SWE302")
5. Choose "Free plan" (perfect for educational use)

### Step 2.3: Import GitHub Repository

1. Click "Analyze new project" or "+"
2. Select "GitHub" as the repository source
3. Find and select your repository: `NamgyelHuk708/SWE302_Assignment`
4. Click "Set up" for the repository

### Step 2.4: Configure Analysis Method

**For Backend (Go):**
1. Choose "With GitHub Actions" (recommended)
2. SonarQube will provide a workflow file
3. Copy the provided YAML configuration
4. You'll need a `SONAR_TOKEN` (will be auto-generated)

**For Frontend (JavaScript/React):**
1. Similar setup as backend
2. SonarQube will detect it's a JavaScript project
3. Follow the GitHub Actions setup

### Step 2.5: Add SonarQube Token to GitHub Secrets

1. Go to your GitHub repository: `https://github.com/NamgyelHuk708/SWE302_Assignment`
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Name: `SONAR_TOKEN`
5. Value: (Copy the token from SonarQube Cloud)
6. Click "Add secret"

### Step 2.6: Alternative - Local Analysis

If you prefer local analysis instead of GitHub Actions:

```bash
# Install SonarScanner
# For Linux:
wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
unzip sonar-scanner-cli-5.0.1.3006-linux.zip
export PATH=$PATH:$(pwd)/sonar-scanner-5.0.1.3006-linux/bin

# Create sonar-project.properties in project root
# (I'll help you with this later)
```

---

## 3. OWASP ZAP Setup (DAST Tool)

### Option A: Desktop Application (Recommended for Beginners)

#### Step 3.1: Download OWASP ZAP

1. Visit: https://www.zaproxy.org/download/
2. Download for Linux:
   - **ZAP 2.14.0 Linux Package** (latest stable version)
   - Or use the installer script

#### Step 3.2: Install ZAP

**Method 1 - Using Installer:**
```bash
cd ~/Downloads
chmod +x ZAP_2_14_0_unix.sh
./ZAP_2_14_0_unix.sh
```

**Method 2 - Using Package Manager:**
```bash
# For Ubuntu/Debian
sudo snap install zaproxy --classic

# Or download the .tar.gz and extract
wget https://github.com/zaproxy/zaproxy/releases/download/v2.14.0/ZAP_2.14.0_Linux.tar.gz
tar -xvf ZAP_2.14.0_Linux.tar.gz
cd ZAP_2.14.0
./zap.sh
```

#### Step 3.3: Launch ZAP

```bash
# If installed via snap
zaproxy

# Or if extracted manually
cd ZAP_2.14.0
./zap.sh
```

#### Step 3.4: Initial Setup

1. First launch will ask about persistence
2. Choose "Yes, I want to persist this session" (recommended)
3. Choose a session name: "RealWorld-Security-Test"

### Option B: Docker (Alternative)

```bash
# Pull ZAP Docker image
docker pull zaproxy/zap-stable

# Run ZAP in daemon mode (for automated scanning)
docker run -u zap -p 8090:8090 -i zaproxy/zap-stable zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.addrs.addr.name=.* -config api.addrs.addr.regex=true

# Or run baseline scan directly
docker run -t zaproxy/zap-stable zap-baseline.py -t http://localhost:4100
```

---

## 4. Prepare Applications for Testing

### Step 4.1: Start Backend Server

```bash
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment/golang-gin-realworld-example-app

# Make sure dependencies are installed
go mod download

# Run the server
go run hello.go

# Server should start on http://localhost:8080
# You should see: "Listening and serving HTTP on :8080"
```

### Step 4.2: Start Frontend Server

Open a **NEW terminal** (keep backend running):

```bash
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment/react-redux-realworld-example-app

# Install dependencies if not already done
npm install

# Start the frontend
npm start

# Frontend should start on http://localhost:4100
# Browser may open automatically
```

### Step 4.3: Create Test User

1. Open browser: http://localhost:4100
2. Click "Sign up"
3. Create test account:
   - **Username:** security-test
   - **Email:** security-test@example.com
   - **Password:** SecurePass123!
4. After registration, create 2-3 test articles
5. Add some comments
6. **Save these credentials** - you'll need them for ZAP authentication!

---

## 5. Verification Checklist

### ✅ Snyk Setup Complete
- [ ] Snyk CLI installed (`snyk --version` works)
- [ ] Snyk account created
- [ ] Authenticated successfully (`snyk auth` completed)
- [ ] Can run `snyk test` without authentication errors

### ✅ SonarQube Cloud Setup Complete
- [ ] SonarQube Cloud account created
- [ ] Organization created
- [ ] Repository imported from GitHub
- [ ] SONAR_TOKEN added to GitHub secrets (if using GitHub Actions)
- [ ] Can see project dashboard on SonarCloud.io

### ✅ OWASP ZAP Setup Complete
- [ ] ZAP installed and launches successfully
- [ ] Familiar with ZAP interface (Quick Start, Spider, Active Scan tabs)
- [ ] ZAP proxy is running

### ✅ Applications Ready
- [ ] Backend running on http://localhost:8080
- [ ] Frontend running on http://localhost:4100
- [ ] Test user created with credentials saved
- [ ] Sample content created (articles, comments)

---

## 6. Quick Test Commands

### Test Snyk
```bash
cd /home/namgyel/Desktop/SEM5/SWE302/Assignment/golang-gin-realworld-example-app
snyk test
```

### Test Backend Running
```bash
curl http://localhost:8080/api/tags
# Should return JSON with tags
```

### Test Frontend Running
```bash
curl http://localhost:4100
# Should return HTML content
```

---

## 7. Troubleshooting

### Snyk Issues

**Problem:** `snyk: command not found`
```bash
# Solution: Add npm global bin to PATH
export PATH=$PATH:$(npm config get prefix)/bin
echo 'export PATH=$PATH:$(npm config get prefix)/bin' >> ~/.bashrc
source ~/.bashrc
```

**Problem:** Authentication fails
```bash
# Solution: Re-authenticate
snyk auth
# Make sure to complete the browser authentication
```

### SonarQube Issues

**Problem:** Can't see project on SonarCloud
- Make sure you're logged into the correct organization
- Check if repository was properly imported
- Try refreshing the projects list

### ZAP Issues

**Problem:** ZAP won't start
```bash
# Make sure Java is installed
java -version

# If not installed:
sudo apt update
sudo apt install default-jdk
```

**Problem:** Can't connect to localhost:4100
- Make sure frontend is actually running
- Check if port 4100 is not blocked by firewall
- Try accessing http://localhost:4100 in browser first

### Application Issues

**Problem:** Backend won't start - database error
```bash
# Backend uses SQLite, check if database file is accessible
cd golang-gin-realworld-example-app
ls -la gorm.db

# If missing, it will be created on first run
```

**Problem:** Frontend won't start - port already in use
```bash
# Check what's using port 4100
sudo lsof -i :4100

# Kill the process or use different port
PORT=3000 npm start
```

---

## 8. Next Steps

Once all tools are set up, you can start with:

1. **Snyk Scans** (Quick - 5-10 minutes per project)
2. **SonarQube Analysis** (Automated via push, or manual local scan)
3. **ZAP Passive Scan** (Quick - 10-15 minutes)
4. **ZAP Active Scan** (Long - 30-60 minutes)

---

## 9. Useful Resources

- **Snyk Docs:** https://docs.snyk.io/
- **SonarQube Cloud Docs:** https://docs.sonarcloud.io/
- **OWASP ZAP Getting Started:** https://www.zaproxy.org/getting-started/
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/

---

## 10. Time Estimates

| Task | Estimated Time |
|------|---------------|
| Setup all tools | 30-45 minutes |
| Snyk scans (both) | 30 minutes |
| SonarQube setup & analysis | 45 minutes |
| ZAP passive scan | 15 minutes |
| ZAP active scan | 60 minutes |
| Analysis & documentation | 3-4 hours |
| Fixing vulnerabilities | 2-3 hours |
| Final scans & report | 2 hours |
| **TOTAL** | **10-12 hours** |

**Recommendation:** Start TODAY given the deadline is tomorrow!

---

## Ready to Start?

Once you've completed this setup, let me know and I'll guide you through:
1. Running the first Snyk scan
2. Analyzing the results
3. Creating the documentation

Good luck! 🚀
