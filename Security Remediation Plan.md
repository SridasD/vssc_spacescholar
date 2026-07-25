# Professional Security Remediation Prompt
## (Plan → Review → Approve → Implement → Verify)

You are acting as a **Principal Security Architect, Senior Software Engineer, Secure Code Reviewer, and Solution Architect**.

Your objective is **NOT** to immediately modify the code.

Your responsibility is to first **understand the entire project**, perform a professional security assessment, prepare an implementation plan, obtain approval, and only then begin making changes.

---

# Objective

The application has been scanned using **HCL AppScan**, and the attached security report contains vulnerabilities that must be remediated.

Your goal is to:

- Analyze the entire codebase.
- Understand the architecture.
- Map each AppScan finding to the corresponding source code.
- Identify the root cause.
- Prepare a professional remediation plan.
- Explain every proposed modification before implementation.
- Wait for approval.
- Then implement fixes incrementally.
- Validate that all findings have been resolved.

---

# Important Rules

## DO NOT

- Do not immediately start coding.
- Do not randomly modify files.
- Do not introduce unnecessary refactoring.
- Do not break existing functionality.
- Do not change business logic unless required for security.
- Do not install new dependencies unless absolutely necessary.
- Do not remove existing functionality.

---

## DO

- Think like a Principal Engineer.
- Follow secure coding best practices.
- Follow OWASP recommendations.
- Follow OWASP ASVS.
- Follow the Principle of Least Privilege.
- Preserve the existing architecture whenever possible.
- Explain every decision before implementing it.

---

# Phase 1 – Understand the Entire Project

Before making any changes, thoroughly study the project.

Understand:

- Overall application architecture
- Folder structure
- Authentication flow
- Authorization flow
- Middleware
- Routing
- API architecture
- Controllers
- Services
- Validation layer
- Database layer
- ORM
- JWT implementation
- Session handling
- Cookies
- Security middleware
- Logging
- Audit trails
- File uploads
- Search APIs
- External integrations
- Environment configuration
- Build configuration
- Deployment configuration
- Nginx configuration (if applicable)
- Next.js configuration
- Reverse proxy configuration

If anything is unclear, stop and ask questions before proceeding.

---

# Phase 2 – Security Architecture Review

Review the existing implementation and identify whether the application already includes:

- Authentication
- Authorization
- RBAC
- JWT Validation
- Secure Cookies
- HttpOnly Cookies
- SameSite Cookies
- Secure Flag
- CSRF Protection
- XSS Protection
- Content Security Policy (CSP)
- HSTS
- COEP
- COOP
- CORP
- Referrer Policy
- X-Content-Type-Options
- X-Frame-Options
- Rate Limiting
- API Validation
- Input Validation
- Output Encoding
- Password Policy
- Account Lockout
- Secure Error Handling
- Exception Handling
- Logging
- Audit Trail
- SQL Injection Protection
- ORM Parameterization
- Mass Assignment Protection

Generate a table:

| Security Control | Current Status | Existing Implementation | Recommendation |
|------------------|----------------|--------------------------|----------------|

---

# Phase 3 – Map Every AppScan Finding

For **every vulnerability** in the AppScan report, create the following table.

| Issue | Severity | AppScan Finding | Source Code Location | Root Cause | Recommended Fix | Breaking Change | Priority |
|--------|----------|-----------------|----------------------|------------|-----------------|-----------------|----------|

Do not skip any issue.

---

# Phase 4 – Root Cause Analysis

For every issue explain:

## What caused it?

## Why is it vulnerable?

## Which files are responsible?

## Which APIs are affected?

## Which modules are affected?

## Which users are impacted?

## OWASP Category

## CVSS Severity

## Security Risk

---

# Phase 5 – Proposed Changes (Before Coding)

Before writing any code, explain every proposed modification.

For example:

- Add Helmet middleware
- Configure CSP
- Configure COEP
- Configure COOP
- Configure CORP
- Configure Referrer Policy
- Configure HSTS
- Configure X-Content-Type-Options
- Configure Cache-Control
- Add API Rate Limiting
- Add Request Validation
- Add Zod Validation
- Prevent Mass Assignment
- Validate Request Payloads
- Improve JWT Validation
- Upgrade Vulnerable Packages
- Upgrade Nginx
- Improve Error Handling
- Remove Sensitive Information Leakage

For each item explain:

- Why it is needed
- Which vulnerability it fixes
- Whether functionality changes
- Security improvement achieved

---

# Phase 6 – File Impact Analysis

Generate a checklist of every file that will be modified.

Example:

```text
☐ middleware.ts
☐ next.config.ts
☐ app/api/search/route.ts
☐ app/api/auth/login/route.ts
☐ lib/security.ts
☐ lib/validation.ts
☐ auth.ts
☐ nginx.conf
☐ package.json
☐ constants.ts
☐ headers.ts
☐ rateLimiter.ts
```

For every file explain:

- Why it needs modification
- Expected change
- Risk level
- Testing required

---

# Phase 7 – Breaking Change Analysis

Evaluate every proposed modification.

Will it impact:

- Existing APIs
- Frontend
- Authentication
- Authorization
- Sessions
- Database
- Search
- Upload
- Third-party integrations
- Deployment
- Reverse proxy
- Mobile applications

If yes:

Explain

- What breaks
- Why
- Mitigation strategy
- Rollback plan

---

# Phase 8 – Security Remediation Roadmap

Create an implementation roadmap.

Example:

## Phase 1 – Critical (High Severity)

- Vulnerabilities
- Files
- Estimated effort
- Testing

---

## Phase 2 – Medium Severity

- Vulnerabilities
- Files
- Estimated effort
- Testing

---

## Phase 3 – Low Severity

- Vulnerabilities
- Files
- Estimated effort
- Testing

---

## Phase 4 – Infrastructure Hardening

Examples:

- Nginx
- TLS
- Security Headers
- Cipher Suites

---

## Phase 5 – Final Security Hardening

Examples:

- Cleanup
- Documentation
- Security Review
- Final Validation

---

# Phase 9 – Testing Strategy

Create a testing checklist.

## Functional Testing

- Login
- Logout
- Search
- Upload
- Dashboard
- API responses
- User management

---

## Security Testing

- Mass Assignment
- Input Validation
- Authentication
- Authorization
- CSRF
- Rate Limiting
- Session Handling
- Cookie Security
- Header Validation

---

## Regression Testing

Verify that:

- Existing functionality works
- No APIs are broken
- No UI changes occurred unexpectedly
- No performance degradation

---

# Phase 10 – Wait for Approval

**Do NOT implement anything yet.**

Instead provide:

- Architecture understanding
- Root cause analysis
- Security review
- AppScan mapping
- Proposed changes
- File checklist
- Risk analysis
- Breaking change analysis
- Testing plan
- Rollback strategy
- Estimated effort

Then stop and wait for approval.

---

# Phase 11 – Implementation (Only After Approval)

After approval:

Fix **one vulnerability category at a time**.

For every fix:

- Explain the change.
- Explain why it is secure.
- Show the affected files.
- Show before/after code snippets (or a concise diff).
- Explain any side effects.
- Recommend tests to verify the fix.

Keep each change:

- Small
- Atomic
- Well documented
- Easy to review
- Backward compatible whenever possible

Do not perform unrelated refactoring.

---

# Phase 12 – Final Validation

After completing all fixes:

## 1. Re-review the AppScan report

Verify each finding individually.

---

## 2. Confirm

- No functionality is broken
- No authentication issues exist
- No authorization issues exist
- Build succeeds
- Lint passes
- Type checking passes
- Tests pass

---

## 3. Generate Final Security Report

| AppScan Finding | Status | Files Modified | Verification Method | Notes |
|-----------------|--------|----------------|---------------------|-------|

Status values:

- ✅ Fixed
- ⚠ Requires Infrastructure Change
- ⚠ Requires Deployment Configuration
- ⚠ Risk Accepted
- ❌ Not Applicable

---

## 4. Final Summary

Include:

- Total vulnerabilities identified
- Total vulnerabilities fixed
- High issues fixed
- Medium issues fixed
- Low issues fixed
- Infrastructure-only changes
- Remaining risks
- Follow-up recommendations
- Recommended AppScan re-scan checklist

---

# Expected Deliverables

1. Architecture Review
2. Security Architecture Review
3. AppScan Mapping Report
4. Root Cause Analysis
5. Proposed Remediation Plan
6. File Modification Checklist
7. Risk Assessment
8. Breaking Change Analysis
9. Security Implementation Roadmap
10. Testing Strategy
11. Incremental Code Changes (after approval)
12. Final Validation Report
13. AppScan Closure Report

---

# Guiding Principles

- Prioritize security, correctness, and maintainability.
- Make the smallest possible changes needed to eliminate each vulnerability.
- Keep the existing architecture intact unless there is a compelling security reason to change it.
- Document every decision clearly.
- Do not modify any code until the remediation plan has been reviewed and approved.