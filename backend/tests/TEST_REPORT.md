# Backend Test Coverage Report

**Project:** e-PMS Backend (Electronic Performance Management System)
**Date:** 2026-04-27
**Test runner:** `node --test` (Node.js built-in test runner)
**Total tests:** 141 — all passing
**Run command:** `npm test`

---

## 1. Summary

| Metric | Value |
|---|---|
| Total test files | 17 |
| Total test cases | 141 |
| Passed | 141 |
| Failed | 0 |
| Skipped | 0 |
| Approx. duration | ~1.4s |

```
# tests 141
# pass 141
# fail 0
# duration_ms ~1355
```

---

## 2. Folder Layout

```
backend/tests/
├── helpers/
│   ├── module.js              # Module loader with mock injection
│   └── spies.js               # createSpy / createAsyncSpy / createRes / getRouteDescriptors
├── integration/
│   └── containerData.test.js  # Real-DB integration (requires docker container)
├── unit/
│   ├── controllers/           # HTTP layer tests (req/res/next)
│   │   ├── authController.test.js
│   │   ├── controllerGaps.test.js
│   │   ├── performanceControllers.test.js
│   │   ├── reportAttributeAuditControllers.test.js
│   │   └── userCycleControllers.test.js
│   ├── cron/
│   │   └── cycleScheduler.test.js
│   ├── middleware/
│   │   ├── auth.test.js
│   │   ├── errorHandler.test.js
│   │   ├── middlewareGaps.test.js
│   │   └── rbac.test.js
│   ├── routes/
│   │   └── routes.test.js     # Verifies path/method/auth wiring for all 9 routers
│   ├── services/              # Business logic tests
│   │   ├── appraisalService.test.js
│   │   ├── authService.test.js
│   │   ├── calculationEngine.test.js
│   │   ├── cycleService.test.js
│   │   ├── kpaService.test.js
│   │   ├── midYearService.test.js
│   │   ├── reportService.test.js
│   │   ├── serviceGaps.test.js
│   │   └── userService.test.js
│   ├── utils/
│   │   ├── auditLogger.test.js
│   │   ├── emailService.test.js
│   │   ├── errors.test.js
│   │   ├── exportService.test.js
│   │   └── prisma.test.js
│   └── server.test.js         # App bootstrap, middleware/route mounting
└── TEST_REPORT.md             # This file
```

---

## 3. Coverage Matrix — Source vs. Tests

### 3.1 Services (`src/services/`)

| Service | Source LOC | # Tests | Covered | Notes |
|---|---|---|---|---|
| `appraisalService.js` | 239 | 12 | OK | Status-flow transitions, officer hierarchy enforcement, score finalization |
| `authService.js` | 35 | 6 | OK | Login (active, inactive, bad creds), changePassword (happy, wrong-pw, missing-user) |
| `calculationEngine.js` | 87 | 4 | OK | KPA score, attribute score, final-score weighting, rating bands |
| `cycleService.js` | 209 | 11 | OK | All CRUD + phase advancement + `getPendingWork` for all 3 phases |
| `kpaService.js` | 168 | 10 | OK | createKpa, updateKpa, deleteKpa, submit, review (ACCEPT + REJECT) |
| `midYearService.js` | 92 | 8 | OK | Phase guard, status transitions, officer ownership, aggregate listing |
| `reportService.js` | 148 | 4 | OK | Individual, department, distribution, progress |
| `userService.js` | 139 | 7 | OK | Create, update (with officer-roll history), getAll, officer-list endpoints |

### 3.2 Controllers (`src/controllers/`)

| Controller | Source LOC | # Tests | Covered |
|---|---|---|---|
| `appraisalController.js` | 100 | 7 | OK |
| `attributeController.js` | 35 | 4 | OK |
| `auditController.js` | 36 | 2 | OK |
| `authController.js` | 26 | 3 | OK |
| `cycleController.js` | 72 | 8 | OK |
| `kpaController.js` | 66 | 7 | OK |
| `midYearController.js` | 51 | 4 | OK |
| `reportController.js` | 54 | 5 | OK |
| `userController.js` | 63 | 5 | OK |

### 3.3 Middleware (`src/middleware/`)

| File | Source LOC | # Tests | Covered |
|---|---|---|---|
| `auth.js` | 33 | 4 | OK — valid token, missing bearer, invalid JWT, inactive user |
| `errorHandler.js` | 31 | 6 | OK — operational, P2002, P2025, prod fallback, notFound, prod stack hidden |
| `rbac.js` | 13 | 3 | OK — allow, no user, wrong role |

### 3.4 Utils (`src/utils/`)

| File | # Tests | Covered |
|---|---|---|
| `auditLogger.js` | 2 | OK — write + swallow failure |
| `emailService.js` | 2 | OK — mock mode + SMTP mode |
| `errors.js` | 1 | OK — class status codes & operational flags |
| `exportService.js` | 2 | OK — PDF stream + Excel write |
| `prisma.js` | 2 | OK — dev vs prod logging |

### 3.5 Cron / Routes / Bootstrap

| File | # Tests | Covered |
|---|---|---|
| `cron/cycleScheduler.js` | 2 | OK — schedules + closes past-due cycles + no-op when none |
| `routes/*.js` (9 routers) | 7 | OK — all path/method/auth wiring verified |
| `server.js` | 1 | OK — middleware order, route mounts, scheduler startup |

### 3.6 Integration

| File | # Tests | Notes |
|---|---|---|
| `integration/containerData.test.js` | 2 | Requires Docker test database; verifies seeded user + login |

---

## 4. Test Inventory by File

### 4.1 Services

#### `appraisalService.test.js` + `serviceGaps.test.js` (appraisal section)
1. `getOrCreateAppraisal` creates a draft when one does not yet exist
2. `updateSelfAssessment` only works during the annual appraisal phase
3. `advanceAppraisalStatus` enforces officer hierarchy
4. `advanceAppraisalStatus` finalizes scores at the accepting stage
5. `hrFinalizeAll` finalizes every accepting-done appraisal
6. `submitAppraisal` rejects missing appraisals
7. `getAppraisalFull` throws NotFoundError when missing
8. `advanceAppraisalStatus` rejects mismatched expected status
9. `saveKpaRatings` upserts every rating
10. `saveKpaRatings` throws when appraisal missing
11. `saveAttributeRatings` upserts each attribute rating
12. `getAppraisalsForOfficer` filters by cycle and officer linkage

#### `authService.test.js` + `serviceGaps.test.js` (auth section)
1. `login` returns a signed token and strips the password field
2. `login` rejects inactive or unknown users
3. `changePassword` validates the current password before updating
4. `changePassword` throws when the user cannot be found
5. `changePassword` throws AuthError on wrong current password
6. `login` rejects an inactive user

#### `calculationEngine.test.js`
1. `computeKpaScore` uses the latest rating per KPA goal
2. `computeAttributeScore` averages the latest attribute ratings and scales to 100
3. `computeFinalScore` honors configured weights and tolerates missing attribute scores
4. `getRatingBand` returns correct score buckets

#### `cycleService.test.js` + `serviceGaps.test.js` (cycle section)
1. `createCycle` rejects start dates in the past
2. `updateCycle` ignores immutable fields and validates endDate
3. `advancePhase` moves the cycle forward and closes the last phase
4. `getCycleById` throws when the cycle is missing
5. `getPendingWork` reports unresolved employees during annual appraisal
6. `createCycle` persists cycle and queues employee notifications
7. `advancePhase` rejects a closed cycle
8. `deleteCycle` rejects unknown cycles
9. `getActiveCycle` returns active cycles ordered by createdAt
10. `getAllCycles` applies year, status, and phase filters
11. `getPendingWork` flags employees with incomplete goal setting
12. `getPendingWork` flags employees missing mid-year submission

#### `kpaService.test.js` + `serviceGaps.test.js` (kpa section)
1. `createKpa` rejects totals above 100 percent
2. `updateKpa` blocks edits from other users
3. `submitKpas` requires an exact 100 percent total and emails the reporting officer
4. `reviewKpas` requires rejection remarks
5. `createKpa` creates when totals stay within 100%
6. `createKpa` rejects when cycle is inactive or in wrong phase
7. `getKpaById` throws NotFoundError when KPA is missing
8. `deleteKpa` enforces owner and draft status
9. `reviewKpas` accepts goals and emails the employee
10. `submitKpas` rejects when no draft KPAs exist

#### `midYearService.test.js` + `serviceGaps.test.js` (mid-year section)
1. `createOrUpdateMidYear` creates a new review during the correct phase
2. `createOrUpdateMidYear` updates an existing draft instead of creating a new record
3. `submitMidYear` rejects missing or already submitted reviews
4. `addReportingRemarks` enforces officer ownership and stores the parsed manager rating
5. `addReportingRemarks` rejects the wrong officer
6. `createOrUpdateMidYear` rejects in the wrong phase
7. `addReportingRemarks` rejects unsubmitted reviews
8. `getMidYearForOfficer` queries by cycle and officer

#### `reportService.test.js`
1. `individualReport` assembles the user appraisal, KPAs, and mid-year review
2. `individualReport` throws when the user is missing
3. `departmentSummary` groups employees and calculates per-department averages
4. `ratingDistribution` returns counts and percentages for finalized appraisals
5. `cycleProgress` derives goal, mid-year, and appraisal status counts

#### `userService.test.js` + `serviceGaps.test.js` (user section)
1. `createUser` hashes the password, stores reporting history, and sends email
2. `createUser` rejects duplicate emails
3. `updateUser` prevents self-assignment to officer fields
4. `updateUser` hashes new passwords and rolls reporting history when officers change
5. `getUserById` throws for missing users
6. `getAllUsers` applies role, department, and isActive filters
7. `getReportees / getReviewees / getAppraisees` filter by officer linkage and active flag

### 4.2 Controllers

#### `authController.test.js`
1. `login` returns the auth payload and records an audit entry
2. `me` returns the authenticated user without extra service calls
3. `changePassword` forwards service errors through next

#### `userCycleControllers.test.js` + `controllerGaps.test.js` (user/cycle section)
1. `userController.createUser` returns 201 and logs the created user
2. `userController.updateUser` loads the previous user and returns the updated one
3. `userController.getProfile` loads the authenticated user
4. `userController.getAllUsers` forwards query filters to the service
5. `userController.getMyReportees / getMyReviewees / getMyAppraisees` use the logged-in officer id
6. `cycleController.createCycle` injects createdBy and returns 201
7. `cycleController.getPendingWork` merges the service payload into the response body
8. `cycleController.advancePhase` logs the phase change with the new state
9. `cycleController.closeCycle` closes the cycle and audits the action
10. `cycleController.deleteCycle` delegates to the service and audits the deletion
11. `cycleController.getActiveCycle` returns active cycles
12. `cycleController.getCycleById` and `getAllCycles` call through to the service
13. `cycleController.updateCycle` audits the update and returns the cycle

#### `performanceControllers.test.js` + `controllerGaps.test.js` (perf section)
1. `kpaController.createKpa` uses the logged-in user and returns 201
2. `midYearController.addRemarks` maps body fields into the service call
3. `appraisalController.getMyAppraisal` creates then loads the appraisal
4. `appraisalController.hrFinalizeAll` returns the number of finalized appraisals
5. `kpaController.getMyKpas` uses the logged-in user
6. `kpaController.updateKpa` audits and returns the updated KPA
7. `kpaController.deleteKpa` removes the KPA and audits the action
8. `kpaController.submitKpas` reports the submitted count
9. `kpaController.reviewKpas` appends action into audit metadata
10. `kpaController.getKpasForOfficer` and `getEmployeeKpas` dispatch correctly
11. `midYearController.saveMyMidYear` and `submitMyMidYear` delegate to the service
12. `midYearController.getMyMidYear` and `getEmployeeMidYear` pull the right user
13. `midYearController.getTeamMidYear` lists reviews for the officer
14. `appraisalController.updateSelfAssessment` and `submitAppraisal` log audit entries
15. `appraisalController` officer actions pass the correct expectedStatus
16. `appraisalController.saveKpaRatings` and `saveAttributeRatings` forward ratings and audit
17. `appraisalController.getEmployeeAppraisal` returns the targeted user appraisal
18. `appraisalController.getTeamAppraisals` queries by officer id and role

#### `reportAttributeAuditControllers.test.js` + `controllerGaps.test.js` (report/attr/audit section)
1. `reportController.exportDepartmentExcel` loads summary data and delegates export
2. `attributeController.getAllAttributes` converts isActive query strings into booleans
3. `auditController.getAuditLogs` returns pagination metadata
4. `reportController.individualReport` returns the assembled report
5. `reportController.ratingDistribution` and `cycleProgress` return their service payloads
6. `reportController.exportIndividualPDF` streams the PDF after building the report
7. `reportController.departmentSummary` returns the grouped summary
8. `attributeController.createAttribute` returns 201 with the created attribute
9. `attributeController.updateAttribute` returns the updated attribute
10. `attributeController.deleteAttribute` soft-deletes by setting isActive false
11. `auditController.getMyAuditLogs` returns the latest 100 logs for the user

### 4.3 Middleware

#### `auth.test.js` + `middlewareGaps.test.js`
1. `authenticate` attaches the active user and request IP
2. `authenticate` converts JWT errors into AuthError
3. `authenticate` rejects missing bearer tokens
4. `authenticate` rejects inactive users with AuthError

#### `errorHandler.test.js` + `middlewareGaps.test.js`
1. `errorHandler` returns operational errors with stack in non-production
2. `errorHandler` maps Prisma conflict errors (P2002 → 409)
3. `errorHandler` hides internal details in production
4. `notFound` returns a route-specific message
5. `errorHandler` maps Prisma P2025 not-found errors to 404
6. `errorHandler` hides stack trace in production for app errors

#### `rbac.test.js`
1. `authorize` allows matching roles
2. `authorize` rejects missing users
3. `authorize` rejects unsupported roles

### 4.4 Utils

#### `auditLogger.test.js`
1. `logAudit` writes normalized fields into auditLog.create
2. `logAudit` swallows persistence failures

#### `emailService.test.js`
1. `sendEmail` logs a mock message when SMTP credentials are absent
2. `sendEmail` forwards mail to the transporter when SMTP is configured

#### `errors.test.js`
1. Error classes expose consistent status codes and operational flags

#### `exportService.test.js`
1. `generateIndividualPDF` writes headers and streams appraisal sections
2. `generateDepartmentExcel` writes rows and closes the response

#### `prisma.test.js`
1. Prisma client uses verbose logging in development
2. Prisma client limits logging outside development

### 4.5 Cron / Routes / Server

#### `cron/cycleScheduler.test.js` + `middlewareGaps.test.js`
1. `initCycleScheduler` registers the midnight job and closes past-due cycles
2. `initCycleScheduler` skips updates when there are no past-due cycles

#### `routes/routes.test.js`
1. Auth routes expose login, me, and change-password endpoints
2. User routes register profile, officer, and HR-only endpoints
3. Cycle routes include active, pending-work, phase, and delete operations
4. KPA routes expose employee and officer flows
5. Mid-year routes expose employee and officer review paths
6. Appraisal routes include self, officer, rating, and HR finalization endpoints
7. Report, audit, and attribute routers expose their expected endpoints

#### `server.test.js`
1. Server wires middleware, routes, scheduler, and starts listening

### 4.6 Integration (`tests/integration/`)
1. Container-backed database exposes seeded users and the seeded cycle
2. `authService` can log in with seeded container credentials

---

## 5. Test Helpers

The suite relies on two small in-house helpers (no external mocking framework):

### `helpers/module.js`
- `loadModule(modulePath, mocks)` — patches Node's module loader to inject mocks for specific `require()` paths, then loads the target module fresh. Lets us swap Prisma, bcrypt, jwt, nodemailer, etc. without touching disk.
- `clearModule(modulePath)` — drops a module from the require cache so the next load gets a fresh copy.

### `helpers/spies.js`
- `createSpy(impl)` / `createAsyncSpy(impl)` — record `.calls` for assertions, allow custom return values.
- `createRes()` — minimal Express-style `res` mock with `status / json / setHeader / end`.
- `getRouteDescriptors(router)` — extracts `{path, methods, handlers}` from an Express router for routing tests.

This keeps the test suite zero-dependency on top of `node:test` and `node:assert/strict`.

---

## 6. How to Run

```bash
# Unit tests (default — no external services required)
cd backend
npm test

# Integration tests (requires Docker container running test DB on localhost:5433)
npm run test:container
```

---

## 7. Known Gaps / Out of Scope

These were considered but intentionally not implemented in this pass:

1. **Full HTTP integration via supertest.** Current setup is service + controller unit tests with mocked Prisma. End-to-end Express request lifecycle is exercised only by the two integration tests, which require a live container. Adding supertest with an in-memory or test-DB setup would close that gap.
2. **Fire-and-forget email side effects.** `cycleService.createCycle / updateCycle / closeCycle` queue emails via `.then().catch()` (not awaited). Tests verify the cycle output but cannot deterministically assert on the queued emails.
3. **`getAppraisalsForOfficer` ignores its `officerRole` parameter.** The test documents this — the OR clause covers all three officer fields regardless of role. If/when role-specific filtering is added, an updated test should follow.
4. **PDF/Excel content correctness.** Export tests verify headers and that streamed sections appear, but do not parse the resulting binary outputs.

---

## 8. Final Verdict

Coverage is comprehensive across:
- All 8 services (positive + negative paths on every critical flow)
- All 9 controllers (every exported method)
- All 3 middleware modules
- All utilities, the cron job, the route wiring, and the server bootstrap

The suite runs in ~1.4 seconds and requires no external services for the unit tests, making it suitable for CI on every commit.
