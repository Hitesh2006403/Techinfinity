# EduInfinity — Explainable Automated Descriptive Answer Evaluation Frontend

EduInfinity is an Explainable Automated Descriptive Answer Evaluation System designed with an academic folio aesthetic that balances AI-assisted evaluation with teacher governance.

---

## 🎨 UI/UX Design System

- **Visual Inspiration:** Scholarly, high-trust academic notebook folio with ledger paper rulings, high-contrast rubric badges, and editorial serif typography.
- **Color Tokens:**
  - **Primary:** Navy / Slate `#09152e` & `#1f2a44`
  - **Success / Validated:** Academic Green `#2e7d4f` / `#22c55e`
  - **Warning / Review:** Academic Amber `#b7791f` / `#f59e0b`
  - **Danger / Incorrect:** Academic Red `#b3372f` / `#ef4444`
  - **Score Highlight:** `#f2d45c`
  - **Surface:** Archival Parchment `#fbf9f5` / White with full Dark Mode support
- **Typography:** Newsreader (Academic Serif) + Inter & DM Sans (UI Sans) + JetBrains Mono (Scores & Math)
- **Responsive:** Mobile drawer navigation + desktop left persistent sidebar.

---

## 🚀 Key Implemented Features

### 1. Authentication (`/login`)
- Segmented role selector: **Teacher**, **Student**, **Administrator**.
- Password visibility toggle & academic credential validation.
- Right-side archival notebook showcase with handwritten excerpt simulation.

### 2. Teacher Experience
- **Dashboard (`/teacher/dashboard`):**
  - Priority evaluation queue with AI provisional score chips.
  - Active and upcoming exams schedule.
  - Class grade distribution bell curve (Recharts).
  - One-click empty state simulation toggle.
- **Review Workbench (`/teacher/review` or `/teacher/review/:id`):**
  - **Left Panel (5 cols):** Student OCR verified transcript with colored conceptual markers (green: correct, amber: incomplete, red: calculation error) and view switcher (Transcribed vs Original Scan Sheet).
  - **Right Panel (7 cols):** AI provisional scoring rationale, concept detection breakdown, editable teacher mark inputs (preserving read-only AI baseline), teacher note fields, commentary box with quick prompts, and sticky score bar with live variance calculation.
  - **Publish action:** Celebratory confetti and student ledger dispatch.
- **Create Examination & Rubric Wizard (`/teacher/create-exam`):**
  - 4-step workflow stepper.
  - Dynamic criteria table with inline editing and point allocation.
  - Live rubric balance allocation meter with amber unallocated warnings and green balance checkmark.
- **Exams Management (`/teacher/exams`):** Search, status filters, and blueprint configuration.
- **Submissions Ledger (`/teacher/submissions`):** Full roster of student submissions with OCR confidence badges.
- **Class Analytics (`/teacher/analytics`):** Score band charts, criteria competency bars, and instructional takeaways.
- **Curriculum & Classrooms (`/teacher/manage`):** Course codes, cohorts, and student capacity rosters.

### 3. Student Experience
- **Dashboard (`/student/dashboard`):** Active examination reminders, 5-phase submission pipeline tracker, and certified folios.
- **Answer Workspace (`/student/exam/:id`):**
  - Mode toggle: Typed Answer vs Upload Handwritten Answer.
  - Drag-and-drop zone with progress simulation.
  - Optical OCR extraction layer with editable review textarea.
  - Final submission confirmation modal dialog.
- **Submission Status (`/student/status`):**
  - 5-phase continuous timeline tracker (Submitted → OCR → AI Evaluation → Teacher Review → Result Published).
- **Official Result Folio (`/student/results`):**
  - Certified grade stamp (e.g. 8.0 / 10 marks - 80% weighted score).
  - Marks by criterion progress bars.
  - Diagnostic review notes: *What you got right*, *What was missing*, *What was incorrect*.
  - Teacher commentary and PDF download action.

### 4. Administrator Experience
- **Admin Dashboard (`/admin/dashboard`):** Active faculty, enrolled students, audit log stream, and compliance status.
- **User Management (`/admin/users`):** Account roster, role filters, status toggles (Active / Suspended), and permission configuration.

### 5. Academic Learning Assistant (`/assistant`)
- Context-aware chatbot with quick prompt chips for course concepts (e.g., Faraday's Law, Transformer Turns Ratio, Core Reluctance).

---

## 🛠️ Tech Stack

- **React 19**
- **Vite 8**
- **Tailwind CSS 3**
- **React Router DOM 7**
- **Recharts**
- **Lucide React**
- **Axios** (Central API Service layer using `VITE_API_BASE_URL`)

---

## 💻 Running the App

### Start Development Server:
```bash
cd frontend
npm install
npm run dev
```

Visit: **http://localhost:5173/**
