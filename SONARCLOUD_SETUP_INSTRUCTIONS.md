# SonarCloud Manual Project Setup Instructions

## Problem
The GitHub Actions workflow failed because the SonarCloud projects don't exist yet. We need to create them manually first.

## Solution Steps

### Step 1: Access SonarCloud
1. Go to https://sonarcloud.io
2. Sign in with your GitHub account
3. You should see your organization: `namgyelhuk708`

### Step 2: Create Backend Project
1. Click the "+" button in the top-right corner
2. Select "Analyze new project"
3. **Select your repository**: `NamgyelHuk708/SWE302_Assignment`
4. Click "Set Up"
5. When asked "Choose how you want to create your project":
   - Select "Manually"
6. **Project Configuration**:
   - **Project key**: `NamgyelHuk708_SWE302_Assignment_backend`
   - **Display name**: `SWE302 Assignment - Backend (Go)`
   - Click "Set Up Project"
7. **Choose Analysis Method**:
   - Select "GitHub Actions"
   - You'll see a SONAR_TOKEN - **you already have this configured**
   - Click "Continue"
8. **What option best describes your build?**:
   - Select "Other (for JS, TS, Go, Python, PHP, ...)"
9. You'll see configuration instructions - **ignore them** (we already have the workflow configured)
10. Click "Finish this tutorial" or just close the wizard

### Step 3: Create Frontend Project
1. Again, click the "+" button in the top-right
2. Select "Analyze new project"
3. **Select your repository**: `NamgyelHuk708/SWE302_Assignment`
4. Click "Set Up"
5. When asked "Choose how you want to create your project":
   - Select "Manually"
6. **Project Configuration**:
   - **Project key**: `NamgyelHuk708_SWE302_Assignment_frontend`
   - **Display name**: `SWE302 Assignment - Frontend (React)`
   - Click "Set Up Project"
7. **Choose Analysis Method**:
   - Select "GitHub Actions"
   - Click "Continue"
8. **What option best describes your build?**:
   - Select "Other (for JS, TS, Go, Python, PHP, ...)"
9. Click "Finish this tutorial"

### Step 4: Verify Projects Created
1. Go to https://sonarcloud.io/projects
2. You should see two new projects:
   - `SWE302 Assignment - Backend (Go)`
   - `SWE302 Assignment - Frontend (React)`
3. They will show "No analysis yet" - **this is normal**

### Step 5: Trigger GitHub Actions Workflow
The workflow was automatically triggered when we pushed the fix. Check:
1. Go to https://github.com/NamgyelHuk708/SWE302_Assignment/actions
2. You should see a new workflow run starting
3. Wait for it to complete (approximately 3-5 minutes)

### Step 6: View Results
Once the workflow completes successfully:
1. Go back to https://sonarcloud.io/projects
2. Click on each project to see the analysis results
3. Take screenshots of:
   - Overall dashboard (Quality Gate, Coverage, Issues)
   - Issues tab (Bugs, Vulnerabilities, Code Smells)
   - Security Hotspots tab
   - Code tab (to see the code with issues highlighted)

---

## Alternative: Quick Import
If the manual setup doesn't work, try this:

1. Go to https://sonarcloud.io/projects/create
2. Select "Import from GitHub"
3. Find `NamgyelHuk708/SWE302_Assignment`
4. **IMPORTANT**: Instead of default setup, choose "Set up manually"
5. Then follow steps 6-9 from above for each project

---

## Expected Result
After completing these steps:
- ✅ Two projects created in SonarCloud
- ✅ GitHub Actions workflow running successfully
- ✅ Analysis results visible in SonarCloud dashboard
- ✅ Ready to document findings for Assignment 2

---

## Troubleshooting

**Problem**: Can't find the repository to import
- **Solution**: Make sure the SonarCloud app is installed on your GitHub repository
- Go to https://github.com/apps/sonarcloud and grant access to the repository

**Problem**: Project key already exists
- **Solution**: If you accidentally created projects with different names, you can either:
  - Delete them (Project Settings → Administration → Delete)
  - Or use the existing projects and update the workflow YAML with the correct project keys

**Problem**: Workflow still fails after creating projects
- **Solution**: Wait a few minutes for SonarCloud to fully initialize the projects, then rerun the workflow
