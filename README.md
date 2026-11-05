# Mechora AI — Industrial Learning & Intelligence Platform

> **Apple-Inspired Dark Glassmorphism Role-Based SaaS Interface**
> Designed exclusively for three roles: **Student**, **Teacher**, and **Admin**.
> Frontend-only demo powered by browser storage and seeded sample data.

---

## 💎 Design & Philosophy

- **Apple-Inspired Glassmorphism**: Frosted glass cards (`backdrop-blur-xl`), transparent panels, subtle radial mesh gradients (`#07090e`, deep charcoal, dark navy), soft glowing borders, and smooth shadows.
- **Fluid Motion Design**: Lightweight Framer Motion entrance transitions, staggered cards, smooth tab switches, modal animations, and tactile micro-interactions.
- **Strict Role-Based Routing (RBAC)**:
  - `Student` ➔ `/student`
  - `Teacher` ➔ `/teacher`
  - `Admin` ➔ `/admin`
  - Protected routes block cross-role dashboard access and redirect unauthorized attempts with warning feedback.
  - Quick role switcher in the navigation bar enables fast grading and evaluation across roles.

---

## 🚀 The Three Dashboards

### 1. 🎓 Student Dashboard (`/student`)
- **Overview**: Personalized student welcome, syllabus mastery progress indicator (78%), quick action triggers, stats grid, and recent machine inquiries.
- **AI Learning Assistant (RAG)**: Target equipment selector (`M-HP200`, `M-AC90`, `M-CNC500`, etc.), natural language engineering query box, quick prompt suggestions, structured answer synthesis with safety alerts, copy-to-clipboard, text-to-speech audio readout for industrial environments, and verified source citations.
- **Machine Resources**: Interactive equipment catalog with technical specifications, operating limits, pressure/power ratings, service history, and linked manual counts.
- **Student History**: Full search & filter archive of previous questions, faculty annotations, and bookmarked procedures.
- **Profile**: Student credentials, institutional ID (`STU-2025-8842`), course enrollment, and password settings.

### 2. 👨‍🏫 Teacher Dashboard (`/teacher`)
- **Overview**: Faculty welcome banner, high-level metrics (142 students, 18 pending reviews), grounding accuracy gauge (98.4%), and real-time student activity feed.
- **Student Question Management**: Filter inquiries by status (`Pending`, `Reviewed`, `All`), inspect AI RAG responses, verify cited manual sections, attach official faculty notes and endorsements, and mark inquiries as reviewed.
- **Knowledge & Manuals**: Ingest OEM machine manuals (`.pdf`, `.docx`), view vector chunking status, and assign documents to machines.
- **Class Analytics**: Recharts area & bar charts tracking daily question traffic, machine inquiry distribution, and common diagnostic trends (e.g. error code E-301).
- **Profile**: Academic appointment details, laboratory credentials, and department settings.

### 3. 🛡️ Admin Dashboard (`/admin`)
- **System Overview**: Simulated local demo telemetry, platform-wide KPIs, and 24-hour activity curves.
- **User Management**: Provision new students and teachers, edit profile records, assign RBAC roles, search/filter users, and activate/deactivate accounts.
- **Machine Fleet Registry**: Register new machinery into the laboratory, update power/pressure specifications, configure models, and manage machine imagery.
- **Document Ingestion**: Full document library oversight, manual deletion, and vector chunk status monitoring.
- **Platform Analytics**: Query throughput by laboratory section, RAG confidence matrix, and token utilization.
- **System Configuration**: RAG hyper-parameters (vector chunk size, model temperature), OpenRouter/OpenAI API key configuration, and real-time system audit logs.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React.js 19 + Vite 8 |
| **Styling & Theme** | Tailwind CSS v4 + Apple Glassmorphism Utilities |
| **Animation Engine** | Framer Motion + GSAP |
| **Data Visualization** | Recharts (Area, Bar, Pie charts) |
| **Iconography** | Lucide React |
| **Routing** | React Router Dom v7 with Protected Route guards |
| **Data** | Browser local storage with seeded demo data; no backend required |

---

## Local Demo Mode

The app is frontend-only. Login, demo question answering, machine and user management, and document records use seeded data saved in browser local storage. No server API, backend process, or external credentials are required. Use the Demo Sandbox buttons on the login screen for one-click access.

---

## 💻 Running the Application

1. **Install Dependencies** (already installed in workspace):
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Production Build**:
   ```bash
   npm run build
   ```

---

## 🔑 Local Demo Accounts

| Role | Username | Password | Direct URL |
|---|---|---|---|
| **Student** | `alex.student` | `industrial2026` | `/student` |
| **Teacher** | `marcus.vance` | `industrial2026` | `/teacher` |
| **Admin** | `admin.arthur` | `industrial2026` | `/admin` |

The login accepts these local demo accounts only. The Demo Sandbox buttons also provide one-click access without entering credentials.
