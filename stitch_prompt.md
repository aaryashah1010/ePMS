# Google Stitch Prompt — ePMS Corporate HR Application UI Redesign

---

## 🎯 ROLE & OBJECTIVE

You are redesigning the **entire frontend UI** of an existing React application called **e-PMS (Electronic Performance Management System)**. This is a corporate HR tool for managing employee performance appraisals across multi-level officer hierarchies.

**Your job is ONLY to generate a new visual UI layer.** You are wrapping existing React logic — you must NOT invent new state variables, create new API endpoints, rename functions, or alter any business logic. Every `useState`, `useEffect`, API call, `onClick` handler, and prop name listed below is **sacred and must be used exactly as specified**.

---

## 🎨 DESIGN SYSTEM — Warm Corporate Aesthetic

### Color Palette (MANDATORY)
| Token | Hex | Usage |
|---|---|---|
| `--espresso` | `#3C2415` | Primary dark (navbar bg, headings) |
| `--mocha` | `#6F4E37` | Secondary dark (active states, borders) |
| `--coffee` | `#8B6914` | Accent warm (highlights, active nav) |
| `--caramel` | `#A0785A` | Tertiary (icons, secondary text) |
| `--sand` | `#C4A882` | Muted (dividers, subtle borders) |
| `--latte` | `#E8DCC8` | Light surface (card backgrounds) |
| `--cream` | `#F5F0E8` | Page background |
| `--ivory` | `#FAF8F4` | Input backgrounds, table rows |
| `--white` | `#FFFFFF` | Card surfaces, modal backgrounds |
| `--success` | `#4A7C59` | Forest green (approve, success) |
| `--danger` | `#8B3A3A` | Muted burgundy (reject, delete, errors) |
| `--warning` | `#B8860B` | Dark goldenrod (warnings, pending) |
| `--info` | `#5B7B9A` | Steel blue (info badges) |

### Typography
- **Font Family**: `'Inter', 'Segoe UI', system-ui, sans-serif` (import from Google Fonts)
- **Headings**: Weight 700–800, color `--espresso`, letter-spacing: -0.02em
- **Body**: Weight 400–500, color `#4A3728`, line-height 1.6
- **Labels**: Weight 600, font-size 13px, color `--mocha`
- **Small/Meta**: font-size 12px, color `--caramel`

### Elevation & Shadows
- **Cards**: `box-shadow: 0 1px 3px rgba(60, 36, 21, 0.06), 0 1px 2px rgba(60, 36, 21, 0.04)`
- **Cards hover**: `box-shadow: 0 4px 12px rgba(60, 36, 21, 0.1)`
- **Modals**: `box-shadow: 0 20px 40px rgba(60, 36, 21, 0.15)`
- **Navbar**: `box-shadow: 0 2px 8px rgba(60, 36, 21, 0.12)`

### Shape & Spacing
- Border radius: 10px cards, 8px inputs/buttons, 20px badges
- Input borders: `1.5px solid var(--sand)`; focus: `2px solid var(--mocha)`
- Consistent 24px section gaps, 16px card padding, 14px field spacing
- Subtle `transition: all 0.2s ease` on all interactive elements

### Hover & Interactive States
- Buttons: darken 8% on hover, `transform: translateY(-1px)`
- Cards with `cursor: pointer`: lift with shadow on hover
- Nav links: underline-slide animation on hover, `background: rgba(200,168,130,0.15)` when active
- Table rows: `background: var(--ivory)` on hover

---

## 📁 APPLICATION ARCHITECTURE

**Tech Stack**: React 18 + Vite + React Router DOM v6 + Axios
**API Base**: `import.meta.env.VITE_API_URL || '/api'`
**Auth**: JWT stored in `localStorage` as `epms_token` and `epms_user`

### File Structure (DO NOT CHANGE)
```
src/
├── main.jsx                    — ReactDOM entry
├── App.jsx                     — Router + AuthProvider wrapper
├── context/AuthContext.jsx     — Auth state + login/logout
├── services/api.js             — Axios instance + all API modules
├── components/
│   ├── Layout.jsx              — Navbar + main content wrapper
│   ├── Navbar.jsx              — Navigation bar with role-based links
│   ├── ProtectedRoute.jsx      — Auth guard with role check
│   ├── Alert.jsx               — Notification banner (error/success/info/warning)
│   ├── Badge.jsx               — Status pill (DRAFT, SUBMITTED, etc.)
│   ├── Button.jsx              — Themed button with variants + loading spinner
│   ├── Card.jsx + StatCard     — Container card + metric card
│   ├── ConfirmModal.jsx        — Confirmation dialog
│   └── CycleSelector.jsx       — Dropdown to pick appraisal cycle
├── pages/
│   ├── Login.jsx
│   ├── Unauthorized.jsx
│   ├── employee/Dashboard.jsx, AppraisalSummary.jsx, GoalSetting.jsx, MidYearReview.jsx, SelfAppraisal.jsx
│   ├── officer/Dashboard.jsx, GoalApproval.jsx, OfficerMidYear.jsx, RatingPage.jsx
│   ├── hr/AdminDashboard.jsx, CycleManagement.jsx, CycleDetails.jsx, UserManagement.jsx, Reports.jsx, AttributeManagement.jsx
│   └── ceo/CEODashboard.jsx, CEOUserManagement.jsx
```

---

## 🔌 API SERVICE LAYER — `services/api.js`

Use these EXACT imports and function signatures. Do NOT rename or restructure.

```js
import api from '../services/api';  // default axios instance
import { authAPI } from '../services/api';       // .login(email, password), .me(), .changePassword(old, new)
import { userAPI } from '../services/api';        // .getAll(params), .getById(id), .create(data), .update(id, data), .getProfile(), .getReportees(), .getReviewees(), .getAppraisees()
import { cycleAPI } from '../services/api';       // .getAll(params), .getActive(), .getById(id), .create(data), .update(id, data), .delete(id), .advancePhase(id), .close(id), .getPendingWork(id)
import { kpaAPI } from '../services/api';         // .create(cycleId, data), .getMy(cycleId), .update(id, data), .delete(id), .submit(cycleId), .getTeam(cycleId), .getEmployee(cycleId, userId), .review(cycleId, userId, action, remarks)
import { midYearAPI } from '../services/api';     // .getMy(cycleId), .save(cycleId, data), .submit(cycleId), .getTeam(cycleId), .addRemarks(cycleId, userId, remarks, rating), .getEmployee(cycleId, userId)
import { appraisalAPI } from '../services/api';   // .getMy(cycleId), .updateSelf(cycleId, achievements), .submit(cycleId), .getEmployee(cycleId, userId), .saveKpaRatings(appraisalId, ratings), .saveAttributeRatings(appraisalId, ratings), .reportingDone(cycleId, userId, remarks), .reviewingDone(cycleId, userId, remarks), .acceptingDone(cycleId, userId, remarks), .getTeam(cycleId), .finalizeAll(cycleId)
import { reportAPI } from '../services/api';      // .individual(cycleId, userId), .department(cycleId, department), .distribution(cycleId), .progress(cycleId), .exportIndividual(cycleId, userId), .exportDepartment(cycleId, department)
import { attributeAPI } from '../services/api';   // .getAll(params), .create(data), .update(id, data), .delete(id)
import { auditAPI } from '../services/api';       // .getMy(), .getAll(params)
import { ceoAPI } from '../services/api';         // .getDashboard(cycleId)
```

---

## 🔐 AUTH CONTEXT — `context/AuthContext.jsx`

```
AuthProvider provides: { user, loading, login, logout }
- user: { id, name, email, role, department, employeeCode, isActive, reportingOfficerId, reviewingOfficerId, acceptingOfficerId }
- login(email, password) → stores token/user in localStorage → returns user
- logout() → clears localStorage → sets user to null
- useAuth() hook to consume context

Roles: 'EMPLOYEE' | 'REPORTING_OFFICER' | 'REVIEWING_OFFICER' | 'ACCEPTING_OFFICER' | 'HR' | 'MANAGING_DIRECTOR'
```

**Role route groups** (defined in App.jsx):
```js
const EMP = ['EMPLOYEE', 'REPORTING_OFFICER', 'REVIEWING_OFFICER', 'ACCEPTING_OFFICER'];
const HR = ['HR'];
const MD = ['MANAGING_DIRECTOR'];
```

---

## 📄 PAGE-BY-PAGE LOGIC SPECIFICATION

### 1. Login.jsx
**State**: `form { email, password }`, `error (string)`, `loading (bool)`
**Handlers**: `handleSubmit(e)` → calls `login(form.email, form.password)` → navigates via `ROLE_REDIRECTS[user.role]`
**ROLE_REDIRECTS**: `{ EMPLOYEE: '/employee/dashboard', REPORTING_OFFICER: '/employee/dashboard', REVIEWING_OFFICER: '/employee/dashboard', ACCEPTING_OFFICER: '/employee/dashboard', HR: '/hr/dashboard', MANAGING_DIRECTOR: '/ceo/dashboard' }`
**Demo accounts array**: `[['CEO (MD)', 'ceo@epms.com', 'ceo@123'], ['HR Admin', 'hr@epms.com', 'hr@123'], ['Alice (Employee)', 'alice@epms.com', 'alice@123'], ['Bob (Reporting Officer)', 'bob@epms.com', 'bob@123'], ['Carol (Reviewing Officer)', 'carol@epms.com', 'carol@123'], ['Dave (Accepting Officer)', 'dave@epms.com', 'dave@123']]`
**Quick-fill onClick**: `setForm({ email, password: pass })`

### 2. Employee Dashboard (`pages/employee/Dashboard.jsx`)
**Component**: `LandingDashboard`
**State**: `errorMsg (string)`
**Handler**: `handleOfficerNavigation(roleType)` → calls `userAPI.getReportees/getReviewees/getAppraisees` → checks if employees array > 0 → navigates to `/officer/${roleType}/dashboard` or sets errorMsg
**Layout**: 4 gradient cards (Employee Space, Reporting, Reviewing, Accepting) with onClick navigations

### 3. AppraisalSummary.jsx
**State**: `activeCycles []`, `cycleIndex (int)`, `cycleDataMap {}`, `loading (bool)`
**useEffect**: `cycleAPI.getActive()` → for each cycle, `Promise.allSettled([kpaAPI.getMy, midYearAPI.getMy, appraisalAPI.getMy])`
**Derived**: `cycle = activeCycles[cycleIndex]`, `kpas`, `midYear`, `appraisal` from cycleDataMap
**Handlers**: `handlePrev/handleNext` → cycle through cycleIndex
**Computed**: `totalWeight = kpas.reduce(weightage)`, `submittedKpas = kpas.filter(SUBMITTED).length`
**Helper**: `getStatusLabel(status)` → maps SUBMITTED/REPORTING_DONE/etc to human labels

### 4. GoalSetting.jsx
**State**: `cycleId`, `selectedCycle`, `kpas []`, `form { title, description, weightage }`, `editId`, `msg { type, text }`, `loading`, `submitting`, `modalConfig { isOpen, title, message, onConfirm, confirmText, variant }`
**Constants**: `EMPTY_FORM = { title: '', description: '', weightage: '' }`
**Computed**: `isPhaseLocked = selectedCycle && selectedCycle.phase !== 'GOAL_SETTING'`, `totalWeight = kpas.reduce(weightage)`, `isSubmitted = kpas.every(status === 'SUBMITTED')`, `rejectionRemarks = kpas.find(DRAFT + reportingRemarks)`
**Handlers**: `loadKpas(cid)` → `kpaAPI.getMy(cid)`, `handleSubmitForm(e)` → `kpaAPI.update/create`, `handleDelete(id)` → modal → `kpaAPI.delete(id)`, `handleEdit(kpa)`, `handleSubmitAll()` → modal → `kpaAPI.submit(cycleId)`
**Auto-save**: 30s interval useEffect calling kpaAPI.update/create

### 5. MidYearReview.jsx
**State**: `cycleId`, `selectedCycle`, `review`, `progress (string)`, `selfRating (string)`, `msg`, `saving`, `submitting`, `modalConfig`
**Computed**: `isPhaseLocked`, `isLocked = isPhaseLocked || review?.status === 'SUBMITTED' || 'REPORTING_DONE'`
**Handlers**: `load(cid)` → `midYearAPI.getMy(cid)`, `handleSave()` → `midYearAPI.save(cycleId, { progress, selfRating })`, `handleSubmit()` → modal → `midYearAPI.save + midYearAPI.submit`

### 6. SelfAppraisal.jsx
**State**: `cycleId`, `appraisal`, `kpas []`, `attributes []`, `kpaRatings {}` (map: kpaGoalId → {rating, remarks}), `attrRatings {}` (map: attributeId → {rating, remarks}), `achievements (string)`, `msg`, `saving`, `submitting`, `modalConfig`
**Computed**: `isDraft = !appraisal || appraisal.status === 'DRAFT'`, `isFinalized`, `valuesAttrs = attributes.filter(VALUES)`, `competencyAttrs = attributes.filter(COMPETENCIES)`, `acceptingOfficerId`
**Helpers**: `getAcceptingKpaRatings()`, `getAcceptingAttrRatings()`, `computeKpaTotal()`, `computeAttrAvg(type)`, `kpaTo5(kpaScore)` → kpaScore/20, `getRatingLabel(score)` → Outstanding/Good/Average/Below Average/Poor
**Constants**: `RATING_BAND_COLOR = { Poor: '#dc2626', 'Below Average': '#d97706', Average: '#0369a1', Good: '#16a34a', Outstanding: '#7c3aed' }` — remap these to warm palette equivalents
**Handlers**: `load(cid)` → `appraisalAPI.getMy + kpaAPI.getMy + attributeAPI.getAll({ isActive: 'true' })`, `handleSave()` → `appraisalAPI.updateSelf + saveKpaRatings + saveAttributeRatings`, `handleSubmit()` → modal → same + `appraisalAPI.submit`

### 7. Officer Dashboard (`pages/officer/Dashboard.jsx`)
**Component**: `OfficerDashboard`
**State**: `activeCycles []`, `cycleIndex`, `appraisalsMap {}`, `employees []`
**Params**: `const { roleType } = useParams()` — 'reporting' | 'reviewing' | 'accepting'
**useEffect**: `cycleAPI.getActive()` → `userAPI.getReportees/getReviewees/getAppraisees` → `appraisalAPI.getTeam(cycleId)` filtered by roleType matching user.id
**Computed**: `contextualTarget` ('Reportees'/'Reviewees'/'Appraisees'), `title`, `pendingAction` count

### 8. GoalApproval.jsx
**State**: `cycleId`, `selectedCycle`, `kpas []`, `msg`, `remarkMap {}`, `submitting (string)`
**Params**: `roleType` from useParams
**Computed**: `isPhaseLocked`, `byEmployee {}` (grouped KPAs by employee)
**Handlers**: `load(cid)` → `kpaAPI.getTeam(cid)` filtered by roleType, `handleReview(userId, action)` → `kpaAPI.review(cycleId, userId, action, remarks)`

### 9. OfficerMidYear.jsx
**State**: `cycleId`, `selectedCycle`, `midReviews []`, `msg`, `remarkMap {}`, `ratingMap {}`, `submitting (string)`
**Handlers**: `load(cid)` → `midYearAPI.getTeam(cid)` filtered by roleType, `handleAddRemark(userId)` → `midYearAPI.addRemarks(cycleId, userId, remarks, parseFloat(rating))`

### 10. RatingPage.jsx
**State**: `cycleId`, `appraisals []`, `selected (appraisal obj)`, `kpas []`, `attributes []`, `kpaRatings {}`, `attrRatings {}`, `kpaHierarchy {}`, `attrHierarchy {}`, `remarks (string)`, `msg`, `saving`, `acting`
**Constants**: `ACTION_MAP = { reporting: { requiredStatus: 'SUBMITTED', actionLabel: 'Mark Reporting Done', handler: 'reportingDone' }, reviewing: { requiredStatus: 'REPORTING_DONE', ... 'reviewingDone' }, accepting: { requiredStatus: 'REVIEWING_DONE', ... 'acceptingDone' } }`
**Computed**: `isEditable = action && selected?.status === action.requiredStatus`, `valuesAttrs`, `competencyAttrs`
**Handlers**: `loadAppraisals(cid)`, `selectAppraisal(appraisal)` (builds hierarchy maps, pre-fills ratings with fallback order), `loadFull(ap)` → `appraisalAPI.getEmployee`, `handleSaveRatings()`, `handleActionClick()` → auto-save ratings then call `appraisalAPI[action.handler]`
**Helper**: `getLowerRaters()` returns ordered array of `{ id, label, bg, border }` for previous raters

### 11. AdminDashboard.jsx (HR)
**State**: `cycles []`, `users []`, `activeCycles []`
**useEffect**: `Promise.allSettled([cycleAPI.getAll(), userAPI.getAll(), cycleAPI.getActive()])`
**Computed**: `roleCount {}` — counts users per role

### 12. CycleManagement.jsx
**State**: `cycles []`, `form` (EMPTY_FORM with name, year, phase, status, startDate, endDate, description, kpaWeight, valuesWeight, competenciesWeight), `showForm`, `msg`, `loading`
**Constants**: `EMPTY_FORM`, `PHASES = ['GOAL_SETTING', 'MID_YEAR_REVIEW', 'ANNUAL_APPRAISAL']`
**Handlers**: `load()` → `cycleAPI.getAll()`, `handleSubmit(e)` → validates weights total 100 + startDate not past → `cycleAPI.create(data)`
**Navigate**: clicking cycle card → `navigate('/hr/cycles/${c.id}')`

### 13. CycleDetails.jsx
**State**: `cycle`, `stats`, `msg`, `loading`, `showEdit`, `form`, `updating`, `modalConfig`
**Params**: `const { id } = useParams()`
**Handlers**: `load()` → `cycleAPI.getById + reportAPI.progress + reportAPI.distribution`, `handleUpdate(e)`, `handleAdvance()` → `cycleAPI.getPendingWork` → modal → `cycleAPI.advancePhase`, `handleFinalizeAll()` → modal → `appraisalAPI.finalizeAll`, `handleClose()` → modal → `cycleAPI.close`, `handleDelete()` → modal → `cycleAPI.delete` → navigate

### 14. UserManagement.jsx
**State**: `users []`, `form` (EMPTY_FORM with name, email, password, role, department, employeeCode, reportingOfficerId, reviewingOfficerId, acceptingOfficerId), `showForm`, `editId`, `msg`, `loading`, `search (string)`
**Constants**: `ROLES = ['EMPLOYEE']`
**Computed**: `filtered` (search by name/email), `officers = users.filter(role !== 'HR')`
**Handlers**: `handleSubmit(e)` → `userAPI.create/update`, `handleEdit(u)`, `handleToggle(u)` → `userAPI.update(u.id, { isActive: !u.isActive })`

### 15. Reports.jsx
**State**: `cycleId`, `activeTab ('department'|'distribution'|'progress'|'individual')`, `deptSummary []`, `distribution`, `progress`, `users []`, `selectedUserId`, `individualReport`, `msg`, `loading`
**Handlers**: `fetchIndividual()` → `reportAPI.individual(cycleId, selectedUserId)`, `handleExportDepartment()` → blob download, `handleExportIndividual()` → blob download
**Constants**: `BAND_COLORS = { Poor, 'Below Average', Average, Good, Outstanding }`

### 16. AttributeManagement.jsx
**State**: `attributes []`, `form { name, type, description }`, `editId`, `showForm`, `msg`, `loading`, `modalConfig`
**Constants**: `EMPTY_FORM = { name: '', type: 'VALUES', description: '' }`
**Computed**: `values = attributes.filter(VALUES)`, `competencies = attributes.filter(COMPETENCIES)`
**Handlers**: `handleSubmit(e)` → `attributeAPI.create/update`, `handleDeactivate(id)` → modal → `attributeAPI.delete(id)`

### 17. CEODashboard.jsx
**State**: `data`, `loading`, `selectedCycle`
**Destructured from data**: `{ cycle, allCycles, totalEmployees, cycleStatus, performanceSummary, departmentPerformance, alerts, topPerformers, bottomPerformers, yearOnYear }`
**Handlers**: `loadDashboard(cycleId)` → `ceoAPI.getDashboard(cycleId)`, `handleCycleChange(e)`
**Helper**: `getTrend(values)` → compares last two values → returns ↑/↓/→ with color

### 18. CEOUserManagement.jsx
**State**: `users []`, `form` (EMPTY_FORM for HR role), `showForm`, `editId`, `msg`, `loading`
**Handlers**: `handleSubmit(e)` → forces `role: 'HR'` → `userAPI.create/update`, `handleEdit(u)`, `handleToggle(u)`

---

## 🧩 SHARED COMPONENTS — Prop Signatures (EXACT)

### `<Alert type={string} message={string} />`
Types: `'error' | 'success' | 'info' | 'warning'`. Returns null if no message. Restyle with warm palette.

### `<Badge label={string} />`
Status keys: `DRAFT, SUBMITTED, REPORTING_DONE, REVIEWING_DONE, ACCEPTING_DONE, FINALIZED, ACTIVE, CLOSED, Poor, Below Average, Average, Good, Outstanding`. Remap colors to warm palette.

### `<Button children variant={string} disabled loading onClick style type size />`
Variants: `'primary' | 'success' | 'danger' | 'warning' | 'secondary' | 'outline'`. Remap to warm palette. Sizes: `'sm' | 'md'`.

### `<Card title={string} children style actions />`
### `<StatCard label={string} value={any} color={string} icon />`
### `<ConfirmModal isOpen title message onConfirm onCancel confirmText cancelText variant loading />`
### `<CycleSelector value onChange onCycleChange style minPhase exactPhase />`
CycleSelector internally calls `cycleAPI.getAll()` and filters by `minPhase`/`exactPhase` using `PHASE_ORDER`.

### `<Layout children />` — wraps `<Navbar />` + `<main>`
### `<Navbar />` — uses `NAV_LINKS` object with HR, MANAGING_DIRECTOR, EMPLOYEE_SPACE, OFFICER_SPACE link arrays. Has `open` state for user dropdown. `handleLogout()` calls `logout()` then navigates.
### `<ProtectedRoute roles={[]} children />` — checks `user` and `roles.includes(user.role)`

---

## 🛑 CRITICAL CONSTRAINTS

1. **DO NOT** create new useState variables, new API functions, or new routes
2. **DO NOT** rename any function, variable, component, or prop
3. **DO NOT** change any API endpoint path or request/response structure
4. **DO NOT** alter the routing structure in App.jsx
5. **DO NOT** modify AuthContext logic or localStorage keys (`epms_token`, `epms_user`)
6. **DO NOT** change the role-based access control logic
7. **DO NOT** add any new npm dependencies beyond what exists (React, React Router, Axios)
8. **PRESERVE** all `useEffect` dependency arrays exactly as they are
9. **PRESERVE** all form validation logic (weight totals, date checks, required fields)
10. **PRESERVE** all modal confirmation flows with their exact `modalConfig` pattern
11. **PRESERVE** the auto-save interval in GoalSetting (30s)
12. **PRESERVE** the blob download logic in Reports for Excel/PDF exports
13. All inline styles should be converted to the warm brown/beige palette specified above
14. The app name displayed is **"e-PMS"** with subtitle **"Performance Management"**

---

## ✅ DELIVERABLE

Generate the complete React JSX for every file listed above with:
- The **exact same logic, state, effects, and handlers** as specified
- A completely new **warm brown/beige/espresso visual design** per the design system above
- Premium typography using Inter font family
- Soft drop shadows and subtle hover animations
- Clean, spacious layouts with generous whitespace
- All inline `style={{}}` objects updated to use the new color palette
- Consistent component styling across all 21 files
