# CoreDesk — Living Threat Model

- **Repository:** [oss-slu/core_desk](https://github.com/oss-slu/core_desk)
- **License:** MIT License
- **Target Organization:** SLU Center for Additive Manufacturing
- **Architecture:** React SPA (`app/`), Node/Prisma API (`api/`), PostgreSQL, S3-Compatible Storage, Cloudflare STL Renderer Worker (`microservices/stl-renderer`)
- **Methodology:** Trust-Boundary Data Flow Analysis + STRIDE + OSS Supply Chain Assessment
- **Status:** Active / Living Document (Update whenever PRs modify authentication, file storage, API authorization, or external worker integrations)

---

## 1. Executive Summary

CoreDesk is an open-source project management and job-intake platform engineered for distributed manufacturing, processing, and toolshops, supporting the Saint Louis University (SLU) Center for Additive Manufacturing. Because CoreDesk bridges university single sign-on (Okta), relational job databases (PostgreSQL via Prisma), cloud object storage (DigitalOcean Spaces / S3-compatible buckets), and an external 3D geometry rendering worker (`microservices/stl-renderer`), its attack surface spans both web application vulnerabilities and physical-digital manufacturing hazards.

Our STRIDE and trust-boundary analysis identifies three primary high-priority risk areas:
1. **Authentication & Token Bypass:** Stemming from local development Okta bypass utilities (`yarn okta`) and bearer JWT handling.
2. **Malicious 3D File & Object Storage Abuse:** Involving untrusted STL/CAD file uploads processed by the STL rendering microservice and stored in S3 buckets.
3. **Open-Source Supply Chain & Secret Exposure:** Across a multi-workspace JavaScript repository with external Cloudflare worker tokens and Sentry credentials.

---

## 2. Product Context & Assets to Protect

CoreDesk digitizes and tracks fabrication requests—such as 3D printing, CNC machining, and toolshop processing—from initial user submission through staff review, quoting/costing, machine queuing, and pickup. While built for SLU, the codebase is generalized for adoption by external makerspaces and university labs.

### Critical Assets
- **University & User Identity Data:** SLU Okta SSO user profiles, institutional email addresses, role assignments (requester, technician/operator, lab administrator), and session JWTs signed with `JWT_SECRET`.
- **Proprietary & Research Design Files:** Uploaded CAD/STL geometries and manufacturing specifications stored in S3-compatible object storage (`AWS_BUCKET` on DigitalOcean Spaces or MinIO in E2E). These files may contain unpatented engineering designs or research intellectual property.
- **Job State, Billing & Equipment Queues:** PostgreSQL records managed via Prisma ORM tracking job approval states, material allocations, machine assignments, and operational logs.
- **External Service Credentials & Workers:** Cloud storage keys (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`), telemetry tokens (`SENTRY_AUTH_TOKEN`), and the Cloudflare STL renderer endpoint and bearer token (`CLOUDFLARE_RENDER_WORKER_TOKEN`).

---

## 3. Attack Surface Analysis

CoreDesk consists of four distinct runtime components separated by explicit trust boundaries: a React client (`app/`), a Node.js REST API (`api/`), a PostgreSQL database with S3 object storage, and an isolated STL rendering microservice (`microservices/stl-renderer`).

| Entry Point / Interface | Trust Boundary Crossed | Data Transmitted | Primary Threat Exposure |
| :--- | :--- | :--- | :--- |
| **React Web UI** (`app/` on port 5173/3030) | External Browser → Frontend Application | Job forms, part metadata, rendered STL previews, session tokens | Cross-Site Scripting (XSS) via job notes, CSRF, token theft from browser storage |
| **Okta SSO & Dev Helper** (`api/` auth routes & `yarn okta`) | Identity Provider / CLI → Backend API | OIDC assertions, local dev JWT injection snippets, user role claims | Account spoofing if dev bypass logic leaks to production; weak `JWT_SECRET` |
| **Backend REST API** (`api/` + Prisma ORM) | Untrusted Client → Privileged Server & DB | JSON payloads, job status transitions, user queries, presigned URLs | Broken Object Level Authorization (IDOR) across jobs/files; privilege escalation |
| **Object Storage (S3)** (DigitalOcean Spaces / MinIO) | API / Browser → Cloud Storage Bucket | Binary STL files, project attachments, preview thumbnails | Unrestricted file upload, bucket misconfiguration (public read), storage exhaustion |
| **STL Renderer Worker** (`microservices/stl-renderer`) | Core API → External Cloudflare Worker | Raw STL mesh files, static bearer token (`CLOUDFLARE_RENDER_WORKER_TOKEN`) | Malformed mesh Denial of Service (CPU/memory exhaustion), SSRF, static token leak |
| **GitHub OSS Repository** (PRs, Workflows, Dependencies) | External Contributors → Main Branch & CI | Source code, `package.json` / `yarn.lock`, Dockerfiles, E2E configs | Malicious PRs, compromised npm/yarn packages, accidental secret commits |

### Actors & Privilege Levels
- **Unauthenticated Visitor:** Can reach public landing endpoints and initiate Okta login; must have zero access to job records or uploaded STL files.
- **Standard Requester (Student / Researcher):** Authenticated via SLU Okta; permitted to submit manufacturing jobs, upload STL models, and view/edit only their own submissions.
- **Shop Technician / Student Staff:** Elevated privileges to inspect queued STL files, update fabrication statuses, assign printers/tools, and communicate with requesters.
- **Lab Administrator:** Full administrative control over shop configurations, user role promotions, billing/material rates, and system settings.
- **External OSS Contributor:** Public GitHub user submitting issues or pull requests; untrusted until reviewed and validated by CI pipelines.

---

## 4. Threat Catalog (STRIDE & Open-Source Analysis)

| ID | Category | Threat Description | Potential Impact | Likelihood / Impact | Affected Components & Actors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **T-01** | Spoofing | **Dev Auth Bypass Exposure:** The `yarn okta` local login utility generates browser console scripts to inject tokens without Okta. If enabled or reachable in staging/production, attackers can forge arbitrary identities. | Complete authentication bypass; attacker impersonates lab admins or faculty researchers. | **Likelihood:** Low<br>**Impact:** Critical | `api/` auth scripts, production deployment environment; all users. |
| **T-02** | Elevation of Privilege | **IDOR on Job & STL Endpoints:** API routes fetching job details or generating S3 download links verify authentication but fail to verify ownership or technician role before returning records. | Unauthorized access to proprietary CAD/STL files and private project notes belonging to other SLU researchers. | **Likelihood:** Medium<br>**Impact:** High | `api/` job & file controllers, Prisma queries; Requesters. |
| **T-03** | Denial of Service | **STL Mesh Bomb / Parser Exhaustion:** A malicious user uploads a hyper-dense or malformed binary STL file (millions of degenerate triangles) that crashes or stalls the STL renderer worker. | Rendering microservice becomes unresponsive, blocking thumbnail generation and 3D previews for all active shop users. | **Likelihood:** Medium<br>**Impact:** Medium | `microservices/stl-renderer`, S3 upload pipeline; Technicians & Requesters. |
| **T-04** | Information Disclosure | **Hardcoded / Committed Tokens:** Contributors copy E2E or development values (such as `CLOUDFLARE_RENDER_WORKER_TOKEN` or DigitalOcean Spaces keys) into tracked files or PRs. | Unauthorized consumption of Cloudflare worker compute, S3 bucket data exfiltration, or Sentry quota abuse. | **Likelihood:** Medium<br>**Impact:** High | Git repository history, `e2e/docker/.env.e2e`, CI logs; Maintainers. |
| **T-05** | Tampering | **Malicious Job Parameter Manipulation:** Requesters intercept API requests to alter pricing calculations, material multipliers, or approval status flags directly in JSON payloads. | Financial loss of lab materials, unapproved fabrication runs, and corrupted audit trails. | **Likelihood:** Medium<br>**Impact:** Medium | `api/` job creation/update routes, PostgreSQL DB; Lab Admins. |
| **T-06** | Tampering (OSS) | **Compromised Upstream Dependencies:** CoreDesk relies on dual package managers (`yarn.lock` and `package-lock.json`) across `app/`, `api/`, and `e2e/`. Unaudited updates introduce malicious postinstall scripts. | Secret harvesting during CI builds or injection of backdoors into production Docker images (`Dockerfile`). | **Likelihood:** Medium<br>**Impact:** High | Root, `app/`, and `api/` dependency trees, GitHub Actions CI. |
| **T-07** | Repudiation | **Unlogged Administrative Overrides:** Lab staff or admins modify job statuses, delete uploaded files, or override print queues without immutable actor-timestamp audit records. | Inability to investigate lost parts, disputed material charges, or accidental data deletion. | **Likelihood:** High<br>**Impact:** Low | `api/` admin & technician workflows, Prisma schema; Lab Staff. |
| **T-08** | Information Disclosure | **Public S3 Bucket / Predictable Keys:** DigitalOcean Spaces object ACLs allow public read access or use sequential file keys rather than short-lived presigned URLs. | External enumeration and download of confidential university or commercial partner STL prototypes. | **Likelihood:** Low<br>**Impact:** High | S3/Spaces bucket configuration, `api/` file upload helper; All Requesters. |

---

## 5. Risk Prioritization Matrix

| Priority Tier | Threat IDs | Rationale | Target Timeline |
| :--- | :--- | :--- | :--- |
| **P1 — Immediate** | T-01, T-02, T-04 | Directly protects authentication integrity, institutional secrets, and cross-user IP confidentiality with low engineering overhead. | Current Sprint (Immediate patch & repository audit before next release) |
| **P2 — Near-Term** | T-03, T-05, T-08 | Prevents service disruption in the STL rendering pipeline, enforces server-side business rules, and locks down cloud storage ACLs. | Next 1–2 Sprints (Milestone hardening & E2E security test additions) |
| **P3 — Long-Term** | T-06, T-07 | Establishes sustainable OSS governance, dependency hygiene, and audit logging for future capstone cohorts. | Ongoing / End-of-Semester Handoff |

---

## 6. Mitigation Strategy & Engineering Trade-offs

| Threat | Planned & Recommended Security Controls | Engineering & Usability Trade-offs | Status |
| :--- | :--- | :--- | :--- |
| **T-01** (Dev Auth Bypass) | Gate the `yarn okta` utility strictly behind `NODE_ENV === 'development'` and strip dev-login routes during production Docker builds. Enforce strong random `JWT_SECRET` entropy checks at API startup. | Slightly reduces convenience when debugging staging environments, requiring developers to use dedicated Okta sandbox accounts instead of CLI token injection. | Planned |
| **T-02 & T-05** (IDOR & Tampering) | Implement centralized RBAC middleware in `api/` verifying `job.ownerId === req.user.id` or `req.user.role in ['TECH', 'ADMIN']` on every read/write route. Recompute all pricing and status transitions exclusively on the server using Zod validation schemas. | Adds minor boilerplate to API route handlers and requires updating E2E Cypress fixtures to authenticate as distinct roles when testing cross-user flows. | Planned |
| **T-03 & T-08** (STL & S3 Security) | Enforce strict file size caps (e.g., 50 MB), magic-byte validation for ASCII/binary STL headers, and worker execution timeouts in `microservices/stl-renderer`. Configure S3 buckets as private-only and serve models via 15-minute presigned URLs. | Very large legitimate assemblies may require compression or splitting by researchers; presigned URLs require frontend refresh logic if a tab remains open for hours. | Planned |
| **T-04 & T-06** (OSS Supply Chain) | Consolidate lockfiles (standardize on either Yarn or npm), enable GitHub Dependabot alerts and Secret Scanning push protection, rotate any exposed E2E worker tokens, and require 1 maintainer review plus passing Cypress CI before merging PRs. | External contributors face slightly slower PR merge cycles and must configure local `.env` files from `.env.example` templates rather than using shared defaults. | Planned |
| **T-07** (Audit Logging) | Add an append-only `AuditLog` Prisma model recording actor ID, action type, target job ID, previous/new status, and timestamp for all technician and admin mutations. | Increases PostgreSQL storage footprint marginally and requires database migration coordination across active developer branches. | Backlog |

---

## 7. Open Questions for Future Cohorts & OSS-Cybersecurity

1. **Multi-Tenant Isolation for External Adopters:** CoreDesk notes that other organizations can adapt the platform. Should future schemas introduce an explicit `Organization` tenant boundary so a single deployment can safely host multiple independent makerspaces?
2. **Cloudflare Worker Authentication Rotation:** Currently, `CLOUDFLARE_RENDER_WORKER_TOKEN` uses a static shared secret. Should the API sign short-lived HMAC request signatures per STL render job instead of transmitting a static bearer token?
3. **Physical Safety & Hazardous Geometry Screening:** Beyond software security, does the SLU Center for Additive Manufacturing require automated screening or explicit attestation workflows to prevent unauthorized fabrication of prohibited items?
4. **Retention Policy for Uploaded CAD Files:** How long should proprietary STL models remain in DigitalOcean Spaces after a print job is completed before automated lifecycle deletion occurs?

---

## Changelog
- **Initial Assessment:** Created comprehensive STRIDE & OSS threat model covering `app/`, `api/`, S3 storage, and `microservices/stl-renderer`.