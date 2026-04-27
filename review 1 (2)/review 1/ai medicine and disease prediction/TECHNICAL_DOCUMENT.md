# HealthAssist Clinic — AI Medicine & Disease Prediction Platform
## Comprehensive Technical Document

**Version:** 4.0  
**Date:** April 2026  
**Architecture:** Microservices (React + Node.js Express + Flask ML)  
**Deployment:** Vercel (frontend) + Render (Node + Flask) + LowDB / JSON flat-files

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Directory Structure](#4-directory-structure)
5. [Frontend (React + Vite)](#5-frontend-react--vite)
6. [Backend Node (Express)](#6-backend-node-express)
7. [ML Service (Flask)](#7-ml-service-flask)
8. [Database & Data Layer](#8-database--data-layer)
9. [ML Models & Dataset](#9-ml-models--dataset)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [API Reference](#11-api-reference)
12. [Data Flow Diagrams](#12-data-flow-diagrams)
13. [User Roles & Permissions](#13-user-roles--permissions)
14. [Environment Configuration](#14-environment-configuration)
15. [Service Startup Guide](#15-service-startup-guide)
16. [Feature Modules](#16-feature-modules)
17. [Cross-Service Integration](#17-cross-service-integration)
18. [Summary Statistics](#18-summary-statistics)
19. [Production Deployment](#19-production-deployment)

---

## 1. Project Overview

HealthAssist Clinic is a production-grade healthcare SaaS platform that integrates AI-driven disease prediction, multilingual chatbot support, prescription OCR, doctor booking, medicine delivery, and comprehensive health analytics into a single unified system.

### Core Value Proposition
- **AI Disease Prediction** — 41 diseases detected from 132 symptoms using ML ensemble (Random Forest + XGBoost + Logistic Regression)
- **Multilingual Chatbot** — Health assistant supporting 10 Indian languages via Google Gemini
- **Prescription OCR** — Extract medication data from photos using Gemini Vision
- **Doctor Booking** — Real-time appointment slots, booking, and management
- **Medicine Delivery** — Order prescribed medicines with tracking
- **Health Timeline** — Longitudinal health record across all interactions
- **Admin Control** — Full platform oversight, doctor verification, revenue analytics

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND  (React 18 + Vite)                          │
│                          Port 5173                                        │
│  ┌─────────────┬──────────────┬─────────────┬──────────────────────┐    │
│  │   Patient   │    Doctor    │    Admin    │    Shared UI         │    │
│  │  Dashboard  │   Dashboard  │  Dashboard  │  Components/Hooks    │    │
│  └─────────────┴──────────────┴─────────────┴──────────────────────┘    │
│                                │  JWT Bearer Token                        │
└────────────────────────────────┼─────────────────────────────────────────┘
                                 │
              ┌──────────────────┼─────────────────────┐
              │                  │                      │
              ▼                  ▼                      ▼
┌─────────────────────┐  ┌───────────────────────────────────────────────┐
│  Backend-Node       │  │              ML Service (Flask)                │
│  (Express + LowDB)  │  │                  Port 5001                     │
│  Port 5000          │  │                                               │
│                     │  │  Services:                                    │
│  Routes:            │  │  ┌──────────────────────────────────────────┐ │
│  /api/auth          │  │  │ prediction_service  → ML ensemble         │ │
│  /api/ai       ─────┼──┼─▶│ chatbot_service     → Gemini NLP         │ │
│  /api/doctors  ─────┼──┼─▶│ ocr_service         → Gemini Vision      │ │
│  /api/doctor        │  │  │ doctor_service      → Appointment mgmt    │ │
│  /api/orders        │  │  │ health_service      → BMI/scoring         │ │
│  /api/admin         │  │  │ report_service      → PDF reports         │ │
│                     │  │  │ mental_service      → Mood tracking       │ │
│  LowDB Storage:     │  │  │ timeline_service    → Health events       │ │
│  users.json         │  │  │ family_service      → Family profiles     │ │
│  doctor_profiles    │  │  │ reminder_service    → Smart reminders     │ │
│  orders.json        │  │  │ interaction_service → Drug interactions   │ │
│  appointments.json  │  │  │ emergency_service   → SOS helplines       │ │
└─────────────────────┘  │  │ lifestyle_service   → AI coaching         │ │
                         │  │ report_analyzer     → Lab analysis        │ │
                         │  └──────────────────────────────────────────┘ │
                         │                                               │
                         │  Data Files:                                  │
                         │  ├── doctors.json  (23+ doctors)             │
                         │  ├── bookings.json (appointments)            │
                         │  ├── timeline.json (health events)           │
                         │  ├── mental_checkins.json                    │
                         │  └── *.csv  (symptoms, diseases, meds)       │
                         │                                               │
                         │  ML Models:                                   │
                         │  ├── random_forest.pkl     (10.4 MB, 97.1%) │
                         │  ├── xgboost.pkl           (6.6 MB,  93.6%) │
                         │  ├── logistic_regression.pkl (44 KB,  97.1%) │
                         │  └── label_encoder.pkl     (6.5 KB)          │
                         └───────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.2.0 | UI framework |
| Vite | 5.0.10 | Build tool / dev server (esbuild minifier, vendor chunk splitting) |
| React Router DOM | 6.22.0 | Client-side routing (SPA, 28+ lazy-loaded routes) |
| Axios | 1.6.0 | HTTP client |
| Recharts | 2.12.0 | Charts & analytics graphs |
| Framer Motion | 11.0.0 | Animations & transitions |
| TailwindCSS | 3.4.18 | Utility-first CSS framework |
| Headless UI | 1.7.17 | Accessible UI primitives |
| Heroicons | 2.1.3 | SVG icon library |
| Tesseract.js | 7.0.0 | Client-side OCR fallback |
| @google/generative-ai | 0.24.1 | Gemini SDK |
| i18next | 26.x | Internationalisation framework |
| react-i18next | 17.x | React bindings for i18next |
| HealthPredict Design System | custom | `.hp-*` CSS class library — extracted from design kit |

### Backend Node
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 24.x | Runtime |
| Express | 4.18.2 | Web framework |
| CORS | 2.8.5 | Cross-origin resource sharing |
| jsonwebtoken | 9.0.0 | JWT generation & verification |
| bcryptjs | 2.4.3 | Password hashing |
| lowdb | 1.0.0 | JSON flat-file database |
| multer | 1.4.5-lts.1 | Multipart file uploads |
| axios | 1.6.0 | HTTP proxy to ML service |
| form-data | 4.0.0 | Multipart form construction |
| uuid | 9.0.0 | Unique ID generation |
| dotenv | 16.3.1 | Environment variables |

### ML Service
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.13.x | Runtime |
| Flask | 2.3.3 (installed: 3.1.3) | Web framework |
| flask-cors | 4.0.0 | Cross-origin support |
| scikit-learn | 1.3.0 | Random Forest, Logistic Regression |
| XGBoost | >=1.7.0 | Gradient boosting classifier |
| NumPy | 1.25.2 | Numerical operations |
| Pandas | 2.1.0 | CSV data processing |
| joblib | >=1.3.0 | Model serialization |
| google-generativeai | >=0.3.1 | Gemini AI (OCR + chatbot) |
| Pillow | >=10.0.0 | Image processing |
| pytesseract | >=0.3.10 | Tesseract OCR engine |
| opencv-python-headless | >=4.8.0 | Computer vision |
| fpdf2 | >=2.7.6 | PDF report generation |
| langdetect | >=1.0.9 | Language detection |
| gTTS | >=2.4.0 | Text-to-speech |
| SpeechRecognition | >=3.10.0 | Voice input |
| aiohttp | >=3.9.0 | Async HTTP |
| python-dotenv | >=1.0.0 | Environment variables |

---

## 4. Directory Structure

```
ai medicine and disease prediction/
├── TECHNICAL_DOCUMENT.md           ← This file
├── DEPLOY.md                       ← Full production deployment guide
├── LEGAL_DISCLAIMER.md             ← Legal notices
├── RUN.md                          ← Quick start instructions
├── render.yaml                     ← Render Blueprint (one-click deploy both backends)
├── .gitignore                      ← Excludes venv/, node_modules/, .env, dist/
├── package.json                    ← Root npm (metadata only)
├── package-lock.json
├── run.bat                         ← Windows batch: start all services
├── run-frontend.bat
├── run-backend.bat
├── start.ps1                       ← PowerShell startup script
├── start_dev.ps1
│
├── backend-node/                   ← Node.js Express API (Port 5000)
│   ├── server.js                   ← Express app entry point
│   ├── db.js                       ← LowDB adapter
│   ├── Procfile                    ← Render start command: web: node server.js
│   ├── .env.example                ← Template for required env vars
│   ├── package.json
│   ├── config/
│   │   └── constants.js            ← ROLES, JWT_SECRET, VERIFICATION_STATUS
│   ├── middleware/
│   │   └── auth.js                 ← authenticate(), authorize() middleware
│   ├── controllers/
│   │   ├── authController.js       ← register, login, logout, getMe, updateProfile
│   │   ├── doctorController.js     ← Doctor panel: profile, availability, appointments
│   │   └── adminController.js      ← Admin: stats, doctors, users, appointments
│   ├── routes/
│   │   ├── auth.js                 ← /api/auth/*
│   │   ├── ai.js                   ← /api/ai/* (proxy to ml_service)
│   │   ├── doctors.js              ← /api/doctors/* (patient-facing)
│   │   ├── doctor.js               ← /api/doctor/* (doctor panel)
│   │   ├── orders.js               ← /api/orders/*
│   │   └── admin.js                ← /api/admin/*
│   └── data/                       ← LowDB JSON databases
│       ├── users.json
│       ├── doctor_profiles.json
│       ├── orders.json
│       └── appointments.json
│
├── ml_service/                     ← Flask ML microservice (Port 5001)
│   ├── app.py                      ← Main Flask app (60+ endpoints, binds 0.0.0.0, PORT from env)
│   ├── auth_server.py              ← Alternative auth endpoint
│   ├── train_model.py              ← Model training script
│   ├── requirements.txt
│   ├── Procfile                    ← Render start command: web: python app.py
│   ├── .env.example                ← Template for required env vars
│   ├── .env                        ← OPENAI_API_KEY, JWT_SECRET (gitignored)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── prediction_service.py   ← ML ensemble prediction
│   │   ├── chatbot_service.py      ← Multilingual Gemini chatbot
│   │   ├── ocr_service.py          ← Prescription OCR (Gemini Vision)
│   │   ├── doctor_service.py       ← Doctor discovery & booking
│   │   ├── health_service.py       ← BMI, health score, diet/fitness
│   │   ├── report_service.py       ← AI health report (PDF)
│   │   ├── report_analyzer_service.py ← Lab report analysis
│   │   ├── interaction_service.py  ← Drug interaction checker
│   │   ├── mental_service.py       ← Mood tracking
│   │   ├── emergency_service.py    ← Emergency helplines
│   │   ├── family_service.py       ← Family health profiles
│   │   ├── reminder_service.py     ← Smart reminders
│   │   ├── lifestyle_service.py    ← AI lifestyle coaching
│   │   └── timeline_service.py     ← Health timeline events
│   ├── models/                     ← Trained ML model files
│   │   ├── random_forest.pkl       (10.4 MB)
│   │   ├── xgboost.pkl             (6.6 MB)
│   │   ├── logistic_regression.pkl (44 KB)
│   │   ├── label_encoder.pkl       (6.5 KB)
│   │   └── metadata.json           ← Model config: 132 symptoms, 41 diseases
│   └── data/                       ← Training & lookup data
│       ├── symptom_disease.csv     ← 41 diseases × 132 symptoms binary matrix
│       ├── symptom_severity.csv    ← Symptom severity levels
│       ├── disease_description.csv ← Disease explanations
│       ├── disease_precaution.csv  ← Prevention measures
│       ├── medicine_dataset.csv    ← Disease → medicine mappings
│       ├── doctors.json            ← 23+ doctors directory
│       ├── bookings.json           ← Appointment records
│       ├── timeline.json           ← User health timelines
│       └── mental_checkins.json    ← Mood/mental health logs
│
├── frontend/                       ← React + Vite SPA (Port 5173)
│   ├── package.json
│   ├── vite.config.js              ← esbuild minifier, vendor chunks, dev proxy
│   ├── vercel.json                 ← SPA rewrites + security headers + asset caching
│   ├── .env.example                ← Template for VITE_* env vars
│   ├── .env.local                  ← Local dev values (gitignored)
│   ├── index.html
│   ├── public/
│   │   └── brand/                  ← Logo SVGs (healthpredict-logo.svg, etc.)
│   ├── dist/                       ← Production build output (28 lazy chunks)
│   └── src/
│       ├── main.jsx                ← React entry point (imports i18n + design tokens)
│       ├── App.jsx                 ← Root router — all pages lazy-loaded via React.lazy
│       ├── index.css               ← Tailwind + global styles
│       ├── styles/
│       │   ├── design-tokens.css   ← CSS custom properties (--primary-600, gradients, etc.)
│       │   └── healthpredict.css   ← .hp-* class library (header, card, btn, chip, field)
│       ├── locales/                ← 11 language JSON files (en, hi, ta, te, kn, ml, mr, bn, es, fr, ar)
│       ├── context/
│       │   ├── AuthContext.jsx     ← Auth state (login/logout/register)
│       │   └── ThemeContext.jsx    ← Dark/light theme
│       ├── hooks/
│       │   └── useIsDark.js        ← Dark mode detection hook
│       ├── layouts/
│       │   └── DashboardLayout.jsx ← Shared dashboard wrapper
│       ├── components/             ← 17+ reusable components
│       ├── pages/                  ← 30 page components
│       └── modules/
│           ├── doctor/             ← Doctor dashboard (9 sub-components)
│           └── admin/              ← Admin dashboard
│
├── backend/                        ← Legacy Python backend (not actively used)
├── docs/                           ← Documentation
└── infra/                          ← Infrastructure/deployment configs
```

---

## 5. Frontend (React + Vite)

### 5.1 Entry Point & Routing — `src/App.jsx`

The root router defines 60+ client-side routes using React Router v6.

```
PUBLIC ROUTES:
  /                     → RoleSelector
  /select-role          → RoleSelector
  /login/patient        → PatientLogin
  /signup/patient       → PatientSignup
  /login/doctor         → DoctorLogin
  /signup/doctor        → DoctorSignup
  /login/admin          → AdminLogin

PATIENT ROUTES (protected, role=patient):
  /dashboard            → Dashboard
  /predict              → Predict (symptom → disease)
  /chat                 → Chat (multilingual chatbot)
  /ocr                  → OCR (prescription upload)
  /health-score         → HealthScore
  /orders               → Orders (medicine delivery)
  /profile              → Profile
  /womens-health        → WomensHealthDashboard
  /mental-wellness      → MentalWellness
  /medicine-interactions → MedicineInteractions
  /health-timeline      → HealthTimeline
  /emergency            → Emergency
  /family-health        → FamilyHealth
  /report-analyzer      → ReportAnalyzer
  /lifestyle-coach      → LifestyleCoach
  /book-doctor          → BookDoctor
  /appointments         → AppointmentHistory
  /doctors              → DoctorList
  /prescriptions        → PrescriptionPage

DOCTOR ROUTES (protected, role=doctor):
  /doctor/dashboard     → DoctorDashboard
  /doctor/onboard       → DoctorOnboard

ADMIN ROUTES (protected, role=admin):
  /admin/dashboard      → AdminDashboard
```

### 5.2 Auth Context — `src/context/AuthContext.jsx`

**API Base:** `import.meta.env.VITE_API_BASE` (falls back to `http://localhost:5000` in dev)

**Provided State:**
| Key | Type | Description |
|---|---|---|
| `user` | Object\|null | `{id, name, email, role, createdAt, profile, ...}` |
| `token` | String\|null | JWT Bearer token |
| `loading` | Boolean | Auth initialization flag |
| `isAuthenticated` | Boolean | Derived: token + user exist |
| `isPatient` | Boolean | Derived: role === 'patient' |
| `isDoctor` | Boolean | Derived: role === 'doctor' |
| `isAdmin` | Boolean | Derived: role === 'admin' |
| `homePath` | String | Role-based default route |

**Provided Functions:**
| Function | Signature | Description |
|---|---|---|
| `login` | `(email, password, expectedRole)` | POST /api/auth/login, set localStorage |
| `register` | `(data)` | POST /api/auth/register |
| `logout` | `()` | Clear token + user from state and localStorage |
| `updateProfile` | `(profileData)` | PUT /api/auth/profile |
| `setSession` | `(token, user)` | Hydrate session externally |

**localStorage Keys:**
- `auth_token` — JWT string
- `auth_role` — User role string
- `auth_user` — JSON-stringified user object

### 5.3 Pages — `src/pages/`

| Page | File Size | Purpose |
|---|---|---|
| Dashboard.jsx | 34 KB | Patient main hub with shortcuts to all features |
| Predict.jsx | 44 KB | Symptom selector → ML disease prediction |
| PatientSignup.jsx | 38 KB | Full registration with health profile |
| OCR.jsx | 20 KB | Prescription photo upload + text extraction |
| Profile.jsx | 22 KB | View/edit user profile |
| WomensHealthDashboard.jsx | 29 KB | Cycle tracking, prenatal, menopause tools |
| Chat.jsx | — | Multilingual AI chatbot interface |
| BookDoctor.jsx | — | Doctor search + slot-based booking |
| AppointmentHistory.jsx | — | Past/upcoming appointments with cancel |
| HealthTimeline.jsx | — | Chronological health event log |
| MentalWellness.jsx | — | Mood check-in, history, trends |
| MedicineInteractions.jsx | — | Drug interaction checker |
| Orders.jsx | — | Medicine order history + delivery tracking |
| FamilyHealth.jsx | — | Manage family member profiles + records |
| ReportAnalyzer.jsx | — | Upload lab/imaging reports for AI analysis |
| LifestyleCoach.jsx | — | Personalized AI lifestyle plan |
| Emergency.jsx | — | Emergency contact numbers (108, 112, 104) |
| HealthScore.jsx | — | Calculated health score + improvement tips |
| DoctorList.jsx | — | Browse all doctors with filters |
| PrescriptionPage.jsx | — | Prescription history + reorder flow |
| RoleSelector.jsx | 16 KB | Landing: choose patient / doctor / admin |
| DoctorLogin.jsx | — | Doctor-specific login |
| DoctorSignup.jsx | — | Doctor registration with specialization |
| AdminLogin.jsx | — | Admin login form |

### 5.4 Modules — `src/modules/`

#### Doctor Dashboard — `modules/doctor/`
| Component | Purpose |
|---|---|
| **DoctorDashboard.jsx** (112 KB) | Main panel: tabs for appointments, notes, analytics, earnings |
| **DoctorOnboard.jsx** | Verification flow: submit credentials, await admin approval |
| **PatientOverviewPanel.jsx** | Summary card for a selected patient |
| **PrescriptionBuilder.jsx** | Write/save digital prescriptions |
| **DoctorNotes.jsx** | Add clinical notes to patient records |
| **DoctorAnalytics.jsx** | Performance metrics (patients, revenue, completion rate) |
| **PatientChat.jsx** | Secure message thread with patients |
| **TestRecommender.jsx** | Suggest diagnostic tests |
| **FollowUpScheduler.jsx** | Schedule follow-up appointments |

#### Admin Dashboard — `modules/admin/`
| Component | Purpose |
|---|---|
| **AdminDashboard.jsx** (98 KB) | Tabs: overview stats, doctor verification, user management, appointments, revenue, AI analytics |

### 5.5 Components — `src/components/`

| Component | Size | Purpose |
|---|---|---|
| Header.jsx | 14 KB | Top navigation: logo, menu items, user avatar, dark mode toggle |
| Sidebar.jsx | — | Dashboard left sidebar with role-specific nav links |
| ProtectedRoute.jsx | — | HOC: redirects to login if role mismatch |
| AppointmentModal.jsx | 26 KB | Full booking flow: select date/time/reason, confirm |
| SymptomSelector.jsx | 11 KB | Searchable multi-select for 132 symptoms |
| PredictionCard.jsx | — | Displays disease, confidence %, medicines, precautions |
| DoctorCard.jsx | — | Doctor profile: name, specialty, rating, fees, book button |
| SettingsPanel.jsx | 25 KB | Health profile settings: BMI, habits, conditions |
| CustomerSupportWidget.jsx | 14 KB | Live chat support bubble |
| DiagnosisDoctorSuggestion.jsx | — | Post-prediction: suggests matching specialist |
| DoctorFinder.jsx | — | Search + filter doctors by specialty/location |
| HealthAssistant.jsx | — | Floating AI chat assistant |
| HistoryPanel.jsx | — | Recent health activity panel |
| LogoutButton.jsx | — | Sign-out with confirmation |
| MedCard.jsx | — | Medicine information card |
| MedicineDelivery.jsx | — | Order tracking widget |
| womens-health/ | — | Subfolder: cycle, prenatal, menopause components |

### 5.6 Theme System

- **ThemeContext.jsx** — Provides `isDark` boolean, `toggleTheme()` function
- **useIsDark.js** — Hook shortcut: `const isDark = useIsDark()`
- Applied via inline styles and conditional className throughout dashboards

---

## 6. Backend Node (Express)

### 6.1 Entry Point — `server.js`

```
Port:     process.env.PORT || 5000
Limit:    50MB JSON body (for base64 image payloads)
Logging:  Every request logs [timestamp] METHOD /path
CORS:     Driven by ALLOWED_ORIGINS env var (comma-separated list)
          Dev default: http://localhost:5173, http://localhost:3000
          Production:  set ALLOWED_ORIGINS=https://your-app.vercel.app
```

**Route Mounts:**
```
/api/auth     → routes/auth.js
/api/ai       → routes/ai.js
/api/orders   → routes/orders.js
/api/doctors  → routes/doctors.js   (patient-facing, proxies to ml_service)
/api/doctor   → routes/doctor.js    (doctor panel, requires DOCTOR role)
/api/admin    → routes/admin.js     (admin panel, requires ADMIN role)
/api/chat     → routes/ai.js        (alias for chatbot)
/health       → health check endpoint
```

### 6.2 Middleware — `middleware/auth.js`

**`authenticate(req, res, next)`**
- Reads `Authorization: Bearer <token>` header
- Verifies JWT with `JWT_SECRET`
- Attaches `req.user = { id, role }` to request

**`authorize(...roles)`**
- Checks `req.user.role` against allowed roles
- Returns 403 if role not permitted

### 6.3 Config — `config/constants.js`

```javascript
ROLES = { PATIENT: 'patient', DOCTOR: 'doctor', ADMIN: 'admin' }
JWT_SECRET = process.env.JWT_SECRET || 'healthassist-secret-key-2024'
JWT_EXPIRES_IN = '7d'
VERIFICATION_STATUS = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' }
```

### 6.4 Database Adapter — `db.js`

Uses **lowdb v1** with synchronous file I/O:
```javascript
const low  = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// Four separate JSON databases:
const usersDb    = low(new FileSync('data/users.json'));
const ordersDb   = low(new FileSync('data/orders.json'));
const doctorDb   = low(new FileSync('data/doctor_profiles.json'));
const apptDb     = low(new FileSync('data/appointments.json'));
```

### 6.5 Routes Detail

#### `routes/auth.js`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create patient or doctor account. Hashes password with bcrypt (rounds: 10). Returns JWT. |
| POST | `/api/auth/login` | None | Verify email/password. Returns JWT + user object. |
| GET | `/api/auth/me` | JWT | Return current user profile. |
| POST | `/api/auth/logout` | JWT | Client-side logout (token invalidation is client responsibility). |
| PUT | `/api/auth/profile` | JWT | Update name, age, gender, health metrics, location. |

#### `routes/ai.js` — ML Service Proxy

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/predict` | Forward `{symptoms, user_profile}` to `ml_service/predict` |
| POST | `/api/ai/chat` | Forward `{message, language, history}` to `ml_service/chat` |
| POST | `/api/ai/ocr` | Upload prescription file → proxy multipart to `ml_service/ocr` |
| POST | `/api/ai/prescription/extract` | Accept base64 image → convert to multipart → proxy to `ml_service/ocr` → return result + `prescription_id` |

#### `routes/doctors.js` — Patient-Facing

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/doctors` | Proxy to `ml_service/doctors` (supports `?location=`, `?specialization=`, `?name=` filters) |
| GET | `/api/doctors/:id` | Get single doctor details |
| GET | `/api/doctors/:id/slots` | Get available booking slots for date |
| POST | `/api/doctors/:id/book` | Book appointment slot |

#### `routes/doctor.js` — Doctor Panel

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/doctor/profile` | DOCTOR | Own profile + verification status |
| PUT | `/api/doctor/profile` | DOCTOR | Update specialization, fees, clinic, bio |
| PUT | `/api/doctor/availability` | DOCTOR | Set day-wise time slots |
| PUT | `/api/doctor/toggle-online` | DOCTOR | Toggle online/offline status |
| GET | `/api/doctor/appointments` | DOCTOR | All appointments where doctor matches |

#### `routes/orders.js`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/orders` | JWT | Create medicine order from prescription |
| GET | `/api/orders/user/:userId` | JWT | Get all orders for a user |
| GET | `/api/orders/:orderId` | JWT | Get single order with timeline |

#### `routes/admin.js`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | ADMIN | Platform-wide statistics |
| GET | `/api/admin/doctors` | ADMIN | All doctors with verification status |
| PUT | `/api/admin/doctors/:id/verify` | ADMIN | Approve doctor |
| PUT | `/api/admin/doctors/:id/reject` | ADMIN | Reject with reason |
| GET | `/api/admin/users` | ADMIN | All registered users |
| GET | `/api/admin/appointments` | ADMIN | All appointments |

---

## 7. ML Service (Flask)

### 7.1 App Configuration — `app.py`

```
Port:      int(os.environ.get("PORT", 5001))   ← reads PORT env var
Host:      0.0.0.0   ← binds all interfaces (required for Render/cloud)
Framework: Flask 2.3.3
CORS:      Enabled for all origins (flask-cors)
Debug:     False (production-safe)
Startup:   Loads all 3 ML models + CSVs on launch
```

On startup, app.py:
1. Loads `random_forest.pkl`, `xgboost.pkl`, `logistic_regression.pkl` via joblib
2. Reads `label_encoder.pkl`
3. Parses `metadata.json` for 132 symptom columns and 41 disease names
4. Loads all CSV data files into Pandas DataFrames
5. Initializes all service modules

### 7.2 Complete Endpoint Reference

#### Prediction
| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/predict` | `{symptoms: string[], user_profile?: {...}}` | `{disease, confidence, medicines, precautions, description, specialist, all_predictions}` |
| GET | `/symptoms` | — | `{symptoms: string[]}` (all 132 symptoms) |
| POST | `/retrain` | — | Triggers model retraining |

#### OCR & Prescriptions
| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/ocr` | `multipart/form-data file` | `{success, extracted: {medicines: [], instructions: [], doctor_name, date}}` |

#### Chatbot
| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/chat` | `{message, language?, history?: []}` | `{response, language, is_emergency}` |
| GET | `/languages` | — | `{languages: {en: "English", hi: "Hindi", ...}}` |

#### Doctors & Appointments
| Method | Endpoint | Body/Params | Response |
|---|---|---|---|
| GET | `/doctors` | `?location=&specialization=&name=` | `{doctors: [...]}` |
| GET | `/doctors/<id>` | — | `{doctor: {...}}` |
| GET | `/doctors/slots` | `?doctor_id=&date=` | `{slots: [...]}` |
| GET | `/doctors/<id>/future-slots` | — | `{slots: {date: [...], ...}}` |
| POST | `/book-appointment` | `{doctor_id, date, time, user_id, reason}` | `{success, booking_id, appointment}` |
| GET | `/appointments` | `?user_id=&doctor_id=&status=` | `{appointments: [...]}` |
| PUT | `/appointments/<id>/status` | `{status}` | `{success, appointment}` |
| GET | `/recommend-specialist` | `?disease=` | `{specialist, reason}` |

#### Admin Analytics
| Method | Endpoint | Response |
|---|---|---|
| GET | `/admin/appointments` | `{appointments, stats: {total, completed, cancelled, pending, today, totalRevenue, doctorEarnings}}` |
| GET | `/doctor-analytics` | `?doctor_name=` → `{total_patients, today_count, completed, cancelled, this_month, completion_rate, total_revenue, top_diseases}` |

#### Health Tools
| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/health-score` | `{age, bmi, is_smoker, is_alcohol, physical_activity, sleep_hours, existing_conditions}` | `{score, grade, recommendations}` |
| POST | `/bmi` | `{weight_kg, height_cm}` | `{bmi, category}` |
| POST | `/diet-plan` | `{health_score, conditions, preferences}` | `{plan: {day1..7: {breakfast, lunch, dinner, snacks}}}` |
| POST | `/fitness-plan` | `{age, fitness_level, conditions}` | `{plan: {exercises, duration, frequency}}` |
| GET | `/hospitals` | `?location=` | `{hospitals: [...]}` |
| GET | `/vaccination-schedule` | `?age=&gender=` | `{schedule: [...]}` |

#### Reports & Analysis
| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/generate-report` | `{user_id, prediction_data, health_score}` | PDF binary or `{report_url}` |
| POST | `/analyze-report` | `{report_image_base64, report_type}` | `{analysis, findings, recommendations}` |
| GET | `/reference-ranges` | `?test=` | `{ranges: {...}}` |

#### Medicine Interactions
| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/check-interactions` | `{medicines: string[]}` | `{interactions: [{drugs, severity, description}]}` |

#### Mental Health
| Method | Endpoint | Body/Params | Response |
|---|---|---|---|
| POST | `/mental/check-in` | `{user_id, mood, stress_level, notes}` | `{success, advice}` |
| GET | `/mental/history` | `?user_id=` | `{history: [...]}` |
| GET | `/mental/moods` | — | `{moods: [...]}` |

#### Health Timeline
| Method | Endpoint | Body/Params | Response |
|---|---|---|---|
| GET | `/timeline` | `?user_id=` | `{events: [...]}` |
| POST | `/timeline/add` | `{user_id, event_type, title, detail, meta?}` | `{success, event}` |

#### Emergency
| Method | Endpoint | Response |
|---|---|---|
| GET | `/emergency` | `{helplines: [{name, number, description}]}` (108, 112, 104, 1800-599-0019) |

#### Family Health
| Method | Endpoint | Body/Params | Response |
|---|---|---|---|
| GET | `/family` | `?user_id=` | `{members: [...]}` |
| POST | `/family/add` | `{user_id, name, relation, dob, gender, blood_group}` | `{success, member}` |
| PUT | `/family/update` | `{user_id, member_id, ...updates}` | `{success}` |
| DELETE | `/family/delete` | `{user_id, member_id}` | `{success}` |
| POST | `/family/record` | `{user_id, member_id, record_type, data}` | `{success}` |

#### Reminders
| Method | Endpoint | Body/Params | Response |
|---|---|---|---|
| GET | `/reminders` | `?user_id=` | `{reminders: [...]}` |
| GET | `/reminders/today` | `?user_id=` | `{reminders: [...]}` |
| POST | `/reminders/add` | `{user_id, type, title, time, days}` | `{success, reminder}` |
| DELETE | `/reminders/delete` | `{user_id, reminder_id}` | `{success}` |
| POST | `/reminders/toggle` | `{user_id, reminder_id}` | `{success, active}` |

#### Lifestyle
| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/lifestyle-plan` | `{age, weight, height, activity_level, goals, conditions}` | `{plan: {diet, exercise, sleep, stress_management}}` |

### 7.3 Service Modules — `ml_service/services/`

#### `prediction_service.py`
- Loads Random Forest, XGBoost, Logistic Regression models
- `predict_disease(symptoms, user_profile)`:
  1. Creates 132-column binary feature vector from symptom list
  2. Runs all 3 models in ensemble (majority vote with confidence weighting)
  3. Retrieves disease description, precautions, medicines from CSVs
  4. Returns top disease + confidence + metadata + specialist recommendation
- `parse_free_text_symptoms(text)` — Extract symptom mentions from natural language
- Ensemble accuracy: 94.8%

#### `chatbot_service.py`
- Powered by Google Gemini (`gemini-1.5-flash`)
- Supports 10 languages: English, Hindi, Tamil, Telugu, Malayalam, Kannada, Punjabi, Gujarati, Marathi, Bengali
- `detect_language(text)` — Auto-detect user language
- `detect_emergency(text)` — Flag SOS/critical messages
- `build_system_prompt(language)` — Language-specific medical chatbot persona
- `chat(message, language, history)` — Multi-turn conversation with context

#### `ocr_service.py`
- `extract_prescription(image_bytes)`:
  1. Try Google Gemini Vision with structured prompt
  2. Fallback to pytesseract + rule-based parsing
- Returns: `{medicines, dosages, instructions, doctor_name, date, patient_name}`

#### `doctor_service.py`
- Reads `data/doctors.json` (23+ doctors, day-wise availability)
- `get_slots(doctor_id, date)` — Computes available slots by day-of-week, removes booked slots
- `book_appointment(doctor_id, date, time, user_id, reason)` — Writes to `data/bookings.json`
- `get_future_slots(doctor_id)` — Next 7 days of availability

#### `health_service.py`
- `calculate_bmi(weight_kg, height_cm)` → BMI + WHO category
- `calculate_health_score(profile)` → 0–100 score with letter grade
  - Inputs: age, BMI, smoking, alcohol, activity, sleep, conditions
  - Weights: BMI 25%, activity 20%, sleep 15%, smoking 15%, alcohol 10%, conditions 15%
- `generate_diet_plan(health_score, conditions, preferences)` → 7-day meal plan via Gemini
- `generate_fitness_plan(age, fitness_level, conditions)` → Exercise routine via Gemini

#### `timeline_service.py`
- Stores events in `data/timeline.json` keyed by `user_id`
- `add_event(user_id, event_type, title, detail, meta=None)` — 5 positional args
- Event types: `prediction`, `appointment`, `prescription`, `checkin`, `order`, `report`, `reminder`

#### `mental_service.py`
- Stores check-ins in `data/mental_checkins.json`
- `mental_checkin(user_id, mood, stress_level, notes)` → advice from Gemini
- Available moods: Happy, Anxious, Sad, Stressed, Calm, Irritable, Overwhelmed, Content

---

## 8. Database & Data Layer

### 8.1 LowDB Schemas (backend-node)

#### `users.json`
```json
{
  "users": [
    {
      "id": "mluej0sxce3eoum096f",
      "name": "Patient Name",
      "email": "patient@example.com",
      "password": "$2a$10$...",
      "role": "patient",
      "createdAt": "2026-02-20T04:40:26.577Z",
      "profile": {},
      "age": 30,
      "gender": "M",
      "height": 175,
      "weight": 70,
      "blood_group": "O+",
      "is_smoker": false,
      "is_alcohol": false,
      "physical_activity": "moderate",
      "sleep_hours": 7,
      "existing_conditions": [],
      "country": "India",
      "state": "Karnataka",
      "city": "Bangalore",
      "pincode": "560001"
    }
  ]
}
```

#### `doctor_profiles.json`
```json
{
  "profiles": [
    {
      "userId": "mnlhekvg9ssj7ik0gt7",
      "specialization": "Cardiology",
      "experience_years": 12,
      "fees": 800,
      "clinic_name": "City Care Clinic",
      "clinic_address": "123 Medical Street",
      "city": "Chennai",
      "bio": "Experienced cardiologist...",
      "availability": {
        "Monday": ["09:00 AM", "10:00 AM", "11:00 AM"],
        "Tuesday": ["09:00 AM", "10:00 AM"],
        "Sunday": { "special_slots": ["10:00 AM"], "slot_type": "priority" }
      },
      "is_online": true,
      "is_verified": true,
      "verification_status": "approved",
      "rating": 4.8,
      "total_reviews": 42,
      "languages": ["English", "Hindi", "Tamil"],
      "consultation_types": ["in_person", "video"],
      "rejection_reason": ""
    }
  ]
}
```

#### `orders.json`
```json
{
  "orders": [
    {
      "id": "mlug2y6qoqf7xqhucce",
      "userId": "user_123",
      "prescriptionId": "rx_1234567890_abc123",
      "medicines": [
        {
          "name": "Paracetamol",
          "dosage": "500mg",
          "frequency": "TDS",
          "duration": "5 days",
          "instructions": "After meals"
        }
      ],
      "address": "123 Health St, Wellness City",
      "platform": "Pharmacy Partner",
      "status": "placed",
      "totalAmount": 119,
      "createdAt": "2026-02-20T05:23:55.922Z",
      "timeline": [
        { "status": "placed", "time": "...", "description": "Order placed" },
        { "status": "processing", "time": "...", "description": "Being packed" }
      ]
    }
  ]
}
```

#### `appointments.json`
```json
{
  "appointments": [
    {
      "id": "appt_12345",
      "doctor_id": 1,
      "doctor_name": "Dr. Ananya Verma",
      "specialization": "Internal Medicine",
      "consultation_fee": 800,
      "user_id": "patient_123",
      "user_email": "patient@example.com",
      "user_name": "Patient Name",
      "date": "2026-04-25",
      "time": "10:00 AM",
      "status": "confirmed",
      "notes": "Fever and cough for 3 days",
      "timestamp": "2026-04-19T10:00:00Z"
    }
  ]
}
```

### 8.2 ML Service JSON Files

#### `data/doctors.json`
```json
[
  {
    "id": 1,
    "name": "Dr. Ananya Verma",
    "specialization": "Internal Medicine",
    "clinic": "City Care Clinic",
    "address": "123 Medical Street, Chennai",
    "phone": "+91-9876543210",
    "email": "ananya.verma@clinic.com",
    "location": "Chennai",
    "distance_km": 1.2,
    "rating": 4.8,
    "experience_years": 12,
    "consultation_fee": 800,
    "languages": ["English", "Hindi", "Tamil"],
    "video_consultation": true,
    "verified": true,
    "profile_image": "https://ui-avatars.com/api/?name=Ananya+Verma",
    "about": "Board-certified internist with 12 years experience...",
    "education": "MBBS (AIIMS Delhi), MD Internal Medicine (CMC Vellore)",
    "availability": {
      "Monday": ["09:00 AM", "09:30 AM", "10:00 AM"],
      "Tuesday": ["09:00 AM", "10:00 AM"],
      "Sunday": { "special_slots": ["11:00 AM"], "slot_type": "priority" }
    }
  }
]
```

#### `data/timeline.json`
```json
{
  "patient_123": [
    {
      "event_type": "prediction",
      "title": "AI Diagnosis: Flu",
      "description": "Symptoms: fever, cough, fatigue",
      "data": { "disease": "Flu", "confidence": 0.91 },
      "timestamp": "2026-04-19T10:30:00Z"
    },
    {
      "event_type": "appointment",
      "title": "Appointment with Dr. Ananya Verma",
      "description": "2026-04-25 at 10:00 AM",
      "timestamp": "2026-04-19T11:00:00Z"
    }
  ]
}
```

---

## 9. ML Models & Dataset

### 9.1 Model Files

| Model | File | Size | Accuracy |
|---|---|---|---|
| Random Forest | `random_forest.pkl` | 10.4 MB | 97.11% |
| XGBoost | `xgboost.pkl` | 6.6 MB | 93.64% |
| Logistic Regression | `logistic_regression.pkl` | 44 KB | 97.11% |
| Label Encoder | `label_encoder.pkl` | 6.5 KB | — |
| **Ensemble** | — | — | **94.8%** |

### 9.2 Model Metadata — `metadata.json`

```json
{
  "symptom_columns": ["itching", "skin_rash", "nodal_skin_eruptions", ... ],
  "diseases": [
    "(vertigo) Paroxymal Positional Vertigo", "AIDS", "Acne",
    "Alcoholic hepatitis", "Allergy", "Arthritis", "Bronchial Asthma",
    "Cervical spondylosis", "Chicken pox", "Chronic cholestasis",
    "Common Cold", "Dengue", "Diabetes", "Dimorphic hemmorhoids(piles)",
    "Drug Reaction", "Fungal infection", "GERD", "Gastroenteritis",
    "Heart attack", "Hepatitis B", "Hepatitis C", "Hepatitis D",
    "Hepatitis E", "Hypertension", "Hyperthyroidism", "Hypoglycaemia",
    "Hypothyroidism", "Impetigo", "Jaundice", "Malaria", "Migraine",
    "Osteoarthritis", "Paralysis (brain hemorrhage)", "Peptic ulcer diseae",
    "Pneumonia", "Psoriasis", "Tuberculosis", "Typhoid",
    "Urinary tract infection", "Varicella", "hepatitis A"
  ],
  "accuracies": {
    "random_forest": 0.9711,
    "xgboost": 0.9364,
    "logistic_regression": 0.9711,
    "ensemble": 0.948
  },
  "models_available": ["random_forest", "xgboost", "logistic_regression"],
  "version": "2.0.0"
}
```

### 9.3 CSV Datasets

| File | Rows | Columns | Purpose |
|---|---|---|---|
| `symptom_disease.csv` | 42 | 134 (disease + 132 symptoms) | Binary matrix for training |
| `symptom_severity.csv` | 132 | 2 (symptom, severity) | Symptom weight scoring |
| `disease_description.csv` | 42 | 2 (disease, description) | Patient-facing disease info |
| `disease_precaution.csv` | 42 | 5 (disease + 4 precautions) | Prevention recommendations |
| `medicine_dataset.csv` | 42 | 5 (disease + 4 medicines) | First-line treatment suggestions |

### 9.4 Prediction Flow

```
User selects symptoms
       ↓
Binary vector: [0, 1, 0, 1, ...] (132 dims)
       ↓
  ┌──────────────────────────────────┐
  │  Random Forest  →  disease_A     │
  │  XGBoost        →  disease_A     │  Majority vote
  │  Logistic Reg   →  disease_B     │
  └──────────────────────────────────┘
       ↓
  Winner: disease_A (confidence: 91%)
       ↓
  Look up: description, precautions, medicines, specialist
       ↓
  Add to timeline: event_type="prediction"
       ↓
  Return to frontend → PredictionCard + DiagnosisDoctorSuggestion
```

---

## 10. Authentication & Authorization

### JWT Token Structure
```json
{
  "id": "user_uuid",
  "role": "patient",
  "iat": 1713500000,
  "exp": 1714104800
}
```
- Algorithm: HS256
- Expiry: 7 days
- Secret: `JWT_SECRET` env var (default: `healthassist-secret-key-2024`)

### Role-Based Access Control

| Role | Access |
|---|---|
| `patient` | Dashboard, predict, chat, OCR, health tools, book doctors, view own appointments/orders |
| `doctor` | Doctor dashboard, view/manage own appointments, write prescriptions, analytics |
| `admin` | Admin dashboard, verify doctors, view all users/appointments, revenue analytics |

### Protection Layers
1. **ProtectedRoute.jsx** (frontend) — Redirects unauthenticated users to login
2. **authenticate()** (backend middleware) — Validates JWT on every protected route
3. **authorize(...roles)** (backend middleware) — Checks role before controller runs

### Password Security
- bcrypt hashing: `bcrypt.hash(password, 10)` on register
- Verification: `bcrypt.compare(plain, hash)` on login
- Passwords never stored in plain text or returned in responses

---

## 11. API Reference

### Base URLs

**Local Development:**
| Service | Base URL |
|---|---|
| Backend Node | `http://localhost:5000` |
| ML Service | `http://localhost:5001` |
| Frontend | `http://localhost:5173` |

**Production (set via environment variables):**
| Variable | Purpose |
|---|---|
| `VITE_API_BASE` | Node.js backend URL (Vercel env) |
| `VITE_ML_URL` | Flask ML service URL (Vercel env) |
| `VITE_AUTH_URL` | Auth service URL (Vercel env) |
| `ML_SERVICE_URL` | Flask URL used by Node proxy (Render env) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (Render env) |

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

### Frontend API Constants
All 33 frontend files use env-driven constants:
- `import.meta.env.VITE_API_BASE || 'http://localhost:5000'` — Node backend
- `import.meta.env.VITE_ML_URL   || 'http://localhost:5001'` — ML service
- `import.meta.env.VITE_AUTH_URL || 'http://localhost:5002'` — Auth service

### Complete Endpoint Map

#### Auth Endpoints (`/api/auth/`)
```
POST   /api/auth/register        — Create account
POST   /api/auth/login           — Authenticate
GET    /api/auth/me              — Current user [JWT]
POST   /api/auth/logout          — Sign out [JWT]
PUT    /api/auth/profile         — Update profile [JWT]
```

#### AI/ML Endpoints (`/api/ai/`) — proxied via Node
```
POST   /api/ai/predict                   — Disease prediction
POST   /api/ai/chat                      — Chatbot
POST   /api/ai/ocr                       — Prescription OCR (file upload)
POST   /api/ai/prescription/extract      — Prescription OCR (base64)
```

#### Doctor Discovery (`/api/doctors/`)
```
GET    /api/doctors                      — List doctors
GET    /api/doctors/:id                  — Single doctor
GET    /api/doctors/:id/slots            — Available slots
POST   /api/doctors/:id/book            — Book appointment
```

#### Doctor Panel (`/api/doctor/`) [DOCTOR role]
```
GET    /api/doctor/profile               — Own profile
PUT    /api/doctor/profile               — Update profile
PUT    /api/doctor/availability          — Set slots
PUT    /api/doctor/toggle-online         — Online/offline
GET    /api/doctor/appointments          — Own appointments
```

#### Orders (`/api/orders/`)
```
POST   /api/orders                       — Create order
GET    /api/orders/user/:userId          — User orders
GET    /api/orders/:orderId              — Order details
```

#### Admin (`/api/admin/`) [ADMIN role]
```
GET    /api/admin/stats                  — Platform stats
GET    /api/admin/doctors                — All doctors
PUT    /api/admin/doctors/:id/verify     — Approve doctor
PUT    /api/admin/doctors/:id/reject     — Reject doctor
GET    /api/admin/users                  — All users
GET    /api/admin/appointments           — All appointments
```

#### ML Service Direct Endpoints (`:5001`)
```
POST   /predict                          — ML prediction
GET    /symptoms                         — All 132 symptoms
POST   /ocr                             — Prescription OCR
POST   /chat                            — Chatbot
GET    /doctors                         — Doctor search
POST   /book-appointment                — Book slot
GET    /appointments                    — Fetch appointments
PUT    /appointments/:id/status         — Update status
POST   /health-score                    — Health scoring
POST   /bmi                            — BMI calculation
POST   /diet-plan                       — Diet plan
POST   /fitness-plan                    — Fitness plan
POST   /generate-report                 — PDF report
POST   /analyze-report                  — Report analysis
POST   /check-interactions              — Drug interactions
POST   /mental/check-in                 — Mood log
GET    /mental/history                  — Mood history
GET    /timeline                        — Health timeline
POST   /timeline/add                    — Add event
GET    /emergency                       — Emergency numbers
GET    /family                          — Family members
POST   /family/add                      — Add member
PUT    /family/update                   — Update member
DELETE /family/delete                   — Remove member
GET    /reminders                       — All reminders
POST   /reminders/add                   — Create reminder
DELETE /reminders/delete                — Remove reminder
POST   /lifestyle-plan                  — Lifestyle plan
GET    /admin/appointments              — Admin analytics
GET    /doctor-analytics                — Doctor metrics
```

---

## 12. Data Flow Diagrams

### Patient Booking an Appointment

```
PatientLogin → BookDoctor page
    → GET /api/doctors (Node → ML /doctors)
    → Select doctor → AppointmentModal opens
    → GET /api/doctors/:id/slots (Node → ML /doctors/:id/slots)
    → Select date/time → POST /api/doctors/:id/book (Node → ML /book-appointment)
    → ML writes to data/bookings.json
    → Timeline event added: appointment
    → AppointmentHistory page shows new booking
    → DoctorDashboard polls appointments → sees new booking
```

### Disease Prediction Flow

```
Patient → Predict page
    → SymptomSelector (132 symptoms)
    → POST /api/ai/predict (Node → ML /predict)
    → ML ensemble: RF + XGB + LR → majority vote
    → Look up CSVs: description, precautions, medicines
    → PredictionCard renders result
    → DiagnosisDoctorSuggestion → specialist recommendation
    → Timeline event: prediction added
    → POST /api/ai/chat optionally → follow-up chatbot
```

### Prescription OCR Flow

```
Patient → OCR page or PrescriptionPage
    → Upload/camera image → base64 encode
    → POST /api/ai/prescription/extract
        → Node: base64 → Buffer → FormData
        → Proxy to ML /ocr
        → Gemini Vision: structured extraction
        → Return medicines, dosages, instructions
    → Patient reviews extracted data
    → POST /api/orders → create medicine order
    → Order tracked in orders.json
```

### Doctor Verification Flow

```
Doctor → DoctorSignup → POST /api/auth/register (role=doctor)
    → Doctor completes DoctorOnboard (specialization, fees, docs)
    → PUT /api/doctor/profile → status: "pending"
    → Admin sees in AdminDashboard → Doctors tab
    → PUT /api/admin/doctors/:id/verify → status: "approved"
    → Doctor can now accept appointments (is_verified: true)
```

### Admin Revenue Analytics Flow

```
AdminDashboard → Admin Analytics tab
    → GET http://ML_API/admin/appointments
    → ML service iterates all bookings
    → Computes: totalRevenue (sum of consultation_fee for completed)
    → Computes: doctorEarnings (dict keyed by doctor_name)
    → Returns: stats.totalRevenue + stats.doctorEarnings
    → AdminDashboard: Revenue StatCard + per-doctor breakdown grid
```

---

## 13. User Roles & Permissions

### Patient
- Register/login via `/login/patient`
- Full access to: Dashboard, Predict, Chat, OCR, Health Score, Book Doctor, Appointments, Orders, Profile, Women's Health, Mental Wellness, Medicine Interactions, Health Timeline, Emergency, Family Health, Report Analyzer, Lifestyle Coach
- Can view own appointments/orders only
- Cannot access Doctor or Admin dashboards

### Doctor
- Register via `/signup/doctor` (triggers verification workflow)
- Access: Doctor Dashboard (appointments, prescriptions, analytics, earnings, notes, patient chat)
- Cannot access Admin dashboard
- Appointments only shown where `doctor_name` matches profile
- Earnings derived from `consultation_fee` on completed appointments

### Admin
- Login via `/login/admin` (pre-configured credentials)
- Full access: Admin Dashboard with tabs:
  - **Overview** — Total users, doctors, appointments, revenue
  - **Doctor Management** — Verify/reject doctors, see all profiles
  - **User Management** — Browse all patient/doctor accounts
  - **Appointments** — All platform appointments
  - **Revenue** — Total revenue, per-doctor earnings breakdown
  - **AI Analytics** — ML model usage, prediction trends

---

## 14. Environment Configuration

### `ml_service/.env` (gitignored — never commit)
```env
OPENAI_API_KEY=sk-proj-...
JWT_SECRET=your-32-byte-hex-secret
PORT=5001
```

### `backend-node/.env` (gitignored — never commit)
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=your-32-byte-hex-secret
OPENAI_API_KEY=sk-proj-...
ML_SERVICE_URL=https://healthpredict-ml.onrender.com
ALLOWED_ORIGINS=https://your-app.vercel.app
```

### `frontend/.env.local` (gitignored — local dev)
```env
VITE_API_BASE=http://localhost:5000
VITE_ML_URL=http://localhost:5001
VITE_AUTH_URL=http://localhost:5002
```

### `frontend` — Vercel Environment Variables (production)
```
VITE_API_BASE  = https://healthpredict-backend.onrender.com
VITE_ML_URL    = https://healthpredict-ml.onrender.com
VITE_AUTH_URL  = https://healthpredict-ml.onrender.com
```

### `frontend/vite.config.js`
```javascript
// Vite dev server — proxy configured for /api → localhost:5000
// Build: esbuild minification, vendor chunk splitting:
//   vendor-react, vendor-i18n, vendor-charts, vendor-motion, vendor-axios
// console.log and debugger stripped from production build
```

---

## 15. Service Startup Guide

### Prerequisites
- Node.js 16+ (tested on v24.13.0)
- Python 3.8+ (tested on 3.13.13)
- pip packages from `ml_service/requirements.txt`

### Local Development

#### 1. ML Service (Flask — Port 5001)
```bash
cd ml_service
# Ensure ml_service/.env has OPENAI_API_KEY set
python app.py
```
Expected output:
```
[OK] Loaded model: random_forest
[OK] Loaded model: xgboost
[OK] Loaded model: logistic_regression
[+] HealthPredict AI Microservice v3.0
 * Running on http://0.0.0.0:5001
```

#### 2. Backend Node (Express — Port 5000)
```bash
cd backend-node
node server.js
```
Expected output:
```
🚀  HealthAssist API running on http://localhost:5000
    Roles: patient | doctor | admin
    Env:   development
```

#### 3. Frontend (Vite — Port 5173)
```bash
cd frontend
npm install   # first time only
npm run dev
```
Expected output:
```
VITE v5.4.21 ready in ~1800 ms
➜ Local: http://localhost:5173/
```

### Production Deployment
See `DEPLOY.md` for full step-by-step instructions:
- Frontend → Vercel (vercel.json handles SPA routing)
- Backend Node → Render (`backend-node/Procfile`: `web: node server.js`)
- Flask ML → Render (`ml_service/Procfile`: `web: python app.py`)
- One-click: use `render.yaml` Blueprint

### Health Checks
```bash
# Node backend
curl https://healthpredict-backend.onrender.com/health
# → {"status":"ok","timestamp":"..."}

# ML service
curl https://healthpredict-ml.onrender.com/symptoms
# → {"symptoms":[...]} (132 items)
```

### Windows Batch Shortcuts (local dev)
```
run.bat           — starts all 3 services
run-backend.bat   — starts Node backend only
run-frontend.bat  — starts Vite frontend only
start.ps1         — PowerShell: installs deps + starts all
```

---

## 16. Feature Modules

### 16.1 AI Disease Prediction
- 132 selectable symptoms via `SymptomSelector` component
- Ensemble of 3 ML models (Random Forest, XGBoost, Logistic Regression)
- Results: disease name, confidence %, description, 4 precautions, 4 medicines, specialist
- Automatically logs prediction to health timeline
- Suggests matching doctor specialist via `DiagnosisDoctorSuggestion`

### 16.2 Multilingual AI Chatbot
- Powered by Google Gemini 1.5 Flash
- Auto-detects language from input (langdetect library)
- Responds in same language as user input
- Supports 10 languages: English, Hindi, Tamil, Telugu, Malayalam, Kannada, Punjabi, Gujarati, Marathi, Bengali
- Emergency detection: flags urgent messages, shows helpline numbers
- Multi-turn conversation with history context
- Accessible from Chat page + HealthAssistant floating widget

### 16.3 Prescription OCR
- Upload image (JPEG/PNG) via camera or file picker
- Two extraction paths:
  1. Google Gemini Vision (primary) — structured JSON extraction
  2. pytesseract (fallback) — regex-based parsing
- Extracts: medicine names, dosages, frequency, duration, doctor name, date
- Extracted medicines can be directly ordered via pharmacy

### 16.4 Doctor Booking System
- 23+ doctors in database with specializations, fees, languages, locations
- Day-wise availability (Monday–Sunday), some with special priority slots
- Real-time slot availability (booked slots removed from available list)
- Booking creates record in both `ml_service/data/bookings.json` and adds timeline event
- Appointment status: `confirmed → completed | cancelled`
- Doctor views appointments in DoctorDashboard, can add notes/prescriptions

### 16.5 Medicine Delivery
- Patient orders from extracted prescription or manually
- Order stored in `backend-node/data/orders.json`
- Order statuses: placed → processing → shipped → delivered
- Delivery timeline tracked per order
- `prescription_id` links order to source prescription

### 16.6 Health Timeline
- Chronological log of all health events per user
- Stored in `ml_service/data/timeline.json` keyed by user_id
- Event types: prediction, appointment, prescription, checkin, order, report, reminder
- Frontend HealthTimeline page shows filterable event list
- Events auto-added on: prediction, appointment booking, prescription submission

### 16.7 Health Score
- Calculated score 0–100 based on user profile
- Weighted factors: BMI (25%), physical activity (20%), sleep (15%), smoking (15%), alcohol (10%), existing conditions (15%)
- Letter grade: A (90+), B (75+), C (60+), D (below 60)
- Personalized improvement recommendations

### 16.8 Women's Health
- Menstrual cycle tracking
- Prenatal health tools
- Menopause management
- PCOS/hormonal health monitoring
- Dedicated WomensHealthDashboard page with custom components

### 16.9 Mental Wellness
- Mood check-in: select mood + stress level (1–10) + optional notes
- Stores log in `mental_checkins.json`
- Gemini-powered personalized advice based on mood
- History view: mood trends over time

### 16.10 Drug Interaction Checker
- Input: list of medicine names
- Returns: known interactions with severity levels (mild, moderate, severe)
- Severity color coding in UI

### 16.11 Family Health
- Add family members: name, relation, DOB, gender, blood group
- Add health records per member
- View family health overview

### 16.12 Emergency
- Static emergency contacts: 108 (Ambulance), 112 (National Emergency), 104 (Health Helpline)
- NIMHANS mental health: 1800-599-0019
- One-tap call integration in UI

### 16.13 AI Report Analyzer
- Upload lab reports or medical imaging
- Gemini Vision analyzes and extracts findings
- Returns: abnormal values, normal ranges, clinical significance, recommendations

### 16.14 Lifestyle Coach
- Inputs: age, weight, height, activity level, health goals, conditions
- Gemini generates: personalized diet + exercise + sleep + stress management plan

### 16.15 Smart Reminders
- Create reminders: type (medication/appointment/exercise/water), title, time, days
- View today's reminders vs all reminders
- Toggle active/inactive, delete

### 16.16 Doctor Analytics
- Doctor-specific metrics via `GET /doctor-analytics?doctor_name=`
- Stats: total patients, today's appointments, completed count, completion rate, this-month count, total revenue, cancelled
- Top conditions treated (from appointment notes) with progress bars

### 16.17 Admin Dashboard
- Doctor verification queue: approve/reject with reason
- Platform-wide stats: users, doctors, appointments, revenue
- Revenue tab: total earnings + per-doctor breakdown
- User management: browse all accounts
- AI analytics: prediction model usage trends

---

## 17. Cross-Service Integration

### Data Sync Pattern

The platform uses a dual-storage approach:
- **ml_service** owns appointment/booking data (`bookings.json`)
- **backend-node** mirrors appointments in `appointments.json`
- Frontend reads from both; DoctorDashboard merges lists

### Appointment Data Flow
```
Patient books → Node /api/doctors/:id/book → ML /book-appointment
                                            → writes bookings.json
                                            → adds timeline event
Doctor dashboard → GET /api/doctor/appointments (Node DB)
                 + GET ML_API/appointments?doctor_name= (ML DB)
                 → merged, deduplicated by id
```

### Prescription → Order → Timeline
```
OCR extracts medicines
    → POST /api/ai/prescription/extract
    → Node: base64 → multipart → ML /ocr
    → Returns: extracted medicines + prescription_id
    → Patient confirms → POST /api/orders
    → Order created in Node orders.json
    → (Future) POST /timeline/add: event_type="order"
```

### Doctor → Admin Verification
```
Doctor registers → Node users.json (role=doctor, verified=false)
Doctor onboards → Node doctor_profiles.json (verification_status=pending)
Admin views → GET /api/admin/doctors → reads doctor_profiles.json
Admin verifies → PUT /api/admin/doctors/:id/verify
               → doctor_profiles.json: is_verified=true, verification_status=approved
Doctor's is_verified flag enables them to receive appointments
```

---

## 18. Summary Statistics

| Metric | Count |
|---|---|
| **Frontend Routes** | 28 (all lazy-loaded) |
| **Frontend Pages** | 30 |
| **Frontend Components** | 17+ |
| **i18n Languages** | 11 (en, hi, ta, te, kn, ml, mr, bn, es, fr, ar) |
| **Nav Tabs (patient)** | 11 |
| **Backend-Node Route Files** | 6 |
| **Backend-Node API Endpoints** | ~25 |
| **ML Service Endpoints** | 40+ |
| **ML Service Modules** | 14 |
| **Diseases Supported** | 41 |
| **Symptoms in Dataset** | 132 |
| **Doctors in Database** | 23+ |
| **User Roles** | 3 (patient, doctor, admin) |
| **ML Models** | 3 (RF, XGB, LR) + ensemble |
| **ML Ensemble Accuracy** | 94.8% |
| **Build Modules** | 178 |
| **Gzipped Main Bundle** | ~53 KB |
| **Data Files (JSON)** | 8 |
| **Training CSV Files** | 5 |
| **Total Services** | 3 (Frontend + Node + Flask) |
| **Files with env-based URLs** | 33 (zero hardcoded localhost) |

---

## 19. Production Deployment

### Architecture

```
Vercel (SPA)  ──VITE_API_BASE──►  Render: Node (healthpredict-backend)
              ──VITE_ML_URL───►  Render: Flask (healthpredict-ml)
                                      │
                               ML_SERVICE_URL
                                      │
                               Render: Node ──proxy──► Render: Flask
```

### Deployment Files

| File | Purpose |
|---|---|
| `frontend/vercel.json` | SPA routing rewrites, security headers, asset cache (1 year immutable) |
| `render.yaml` | Render Blueprint — deploys Node + Flask in one click |
| `backend-node/Procfile` | `web: node server.js` |
| `ml_service/Procfile` | `web: python app.py` |
| `frontend/.env.example` | Template: `VITE_API_BASE`, `VITE_ML_URL`, `VITE_AUTH_URL` |
| `backend-node/.env.example` | Template: `JWT_SECRET`, `OPENAI_API_KEY`, `ML_SERVICE_URL`, `ALLOWED_ORIGINS` |
| `ml_service/.env.example` | Template: `OPENAI_API_KEY`, `JWT_SECRET` |

### Required Environment Variables

**Vercel (Frontend):**
```
VITE_API_BASE  = https://healthpredict-backend.onrender.com
VITE_ML_URL    = https://healthpredict-ml.onrender.com
VITE_AUTH_URL  = https://healthpredict-ml.onrender.com
```

**Render — Node Backend:**
```
NODE_ENV        = production
JWT_SECRET      = <shared 32-byte secret>
OPENAI_API_KEY  = sk-proj-...
ML_SERVICE_URL  = https://healthpredict-ml.onrender.com
ALLOWED_ORIGINS = https://your-app.vercel.app
```

**Render — Flask ML:**
```
PORT            = 10000
OPENAI_API_KEY  = sk-proj-...
JWT_SECRET      = <same shared secret>
```

### Build Performance (production)

| Chunk | Size (gzip) | Loaded |
|---|---|---|
| vendor-react | 53 KB | Every page |
| vendor-i18n | 16 KB | App startup |
| vendor-axios | 15 KB | On first API call |
| index (app shell) | 53 KB | Every page |
| DoctorDashboard | 22 KB | Doctor role only |
| AdminDashboard | 14 KB | Admin role only |
| Individual pages | 2–10 KB each | On navigation |

### Redeployment

- **Frontend:** Push to `main` → Vercel auto-deploys
- **Backend:** Push to `main` → Render auto-deploys (or Manual Deploy in dashboard)
- **Env var changes:** Apply immediately; Render restarts the service automatically

### Important Notes

- LowDB writes to local filesystem — data persists within a Render instance session but resets on redeploy. Acceptable for demo/review. For persistent production data, migrate to MongoDB Atlas.
- ML model `.pkl` files (10–17 MB total) are included in the repo and loaded at startup. Render free tier has a ~512 MB memory limit; models fit within this.
- Render free services spin down after 15 minutes of inactivity. First request after sleep takes ~30 seconds to cold-start.

---

*Document version 4.0 — April 2026 | Platform: HealthPredict AI v4.0*
