// EduInfinity Realistic Academic Mock Data

export const INITIAL_USER = {
  id: "usr_prof_harrington",
  name: "Prof. J. Harrington",
  email: "j.harrington@oxford.ac.uk",
  role: "teacher", // "teacher" | "student" | "admin"
  department: "Dept. of Electrical Engineering",
  institution: "Oxford Institute of Technology",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
};

export const MOCK_STUDENT_USER = {
  id: "usr_aarav_sharma",
  name: "Aarav Sharma",
  rollNo: "EE-2024-042",
  email: "aarav.sharma@student.institution.edu",
  role: "student",
  department: "Electrical Engineering",
  semester: "4th Semester",
  institution: "Faculty of Engineering"
};

export const MOCK_ADMIN_USER = {
  id: "usr_dean_morrison",
  name: "Dean Arthur Morrison",
  email: "dean.academic@institution.edu",
  role: "admin",
  department: "Academic Affairs & Registrar",
  institution: "Central University Administration"
};

export const MOCK_SUBJECTS = [
  { id: "sub_bee", code: "BEE-104", name: "Basic Electrical Engineering", credits: 4, department: "Electrical Eng", studentsEnrolled: 68 },
  { id: "sub_dsa", code: "CS-201", name: "Data Structures & Algorithms", credits: 4, department: "Computer Science", studentsEnrolled: 118 },
  { id: "sub_em", code: "PHY-302", name: "Electromagnetism & Wave Theory", credits: 3, department: "Physics", studentsEnrolled: 42 },
  { id: "sub_dsp", code: "EE-305", name: "Digital Signal Processing", credits: 4, department: "Electrical Eng", studentsEnrolled: 54 }
];

export const MOCK_CLASSROOMS = [
  { id: "cls_ee_sec_b", name: "B.Tech EE — Section B (2024)", subject: "Basic Electrical Engineering", capacity: 72, activeExams: 1 },
  { id: "cls_cs_sec_a", name: "B.Tech CS — Section A (2024)", subject: "Data Structures & Algorithms", capacity: 60, activeExams: 1 },
  { id: "cls_phy_hon", name: "B.Sc Physics Honours — Year 2", subject: "Electromagnetism & Wave Theory", capacity: 45, activeExams: 0 }
];

export const MOCK_EXAMS = [
  {
    id: "exam_bee_midterm",
    title: "Basic Electrical Engineering — Mid-term 2024",
    courseCode: "BEE-104",
    status: "marking", // "draft" | "active" | "marking" | "published"
    totalMarks: 50,
    totalQuestions: 5,
    dueDate: "2026-11-05",
    timeLimitMinutes: 90,
    classroom: "B.Tech EE — Section B (2024)",
    submissionsCount: 68,
    totalEnrolled: 72,
    reviewedCount: 65,
    markingDeadlineDays: 4,
    questions: [
      {
        id: "q_bee_01",
        number: 1,
        title: "Magnetic Circuits & Reluctance",
        maxMarks: 10,
        type: "descriptive"
      },
      {
        id: "q_bee_02",
        number: 2,
        title: "Transformer Working Principle & EMF Equation",
        maxMarks: 10,
        type: "descriptive",
        prompt: "Explain the working principle of a single-phase transformer with core flux relationships and derive the standard EMF equation. Include step-by-step turns ratio logic.",
        referenceAnswer: "A transformer operates on Faraday's Law of Mutual Induction between stationary windings linked by a magnetic core. When AC voltage V1 is applied to primary turns N1, it sets up alternating flux Phi(t) = Phi_max * sin(omega * t). By Faraday's Law: e1 = -N1*(dPhi/dt) = -N1*omega*Phi_max*cos(omega*t). E_rms = (2*pi/sqrt(2))*f*N1*Phi_max = 4.44*f*N1*Phi_max. Similarly E2 = 4.44*f*N2*Phi_max. Hence transformation ratio E2/E1 = N2/N1 = K.",
        criteria: [
          {
            id: "crit_01",
            title: "Working Principle & Induction Law",
            specification: "Accurately articulates Faraday's law of electromagnetic induction and mutual induction phenomenon between stationary windings.",
            maxMarks: 4
          },
          {
            id: "crit_02",
            title: "Core Magnetic Flux Linkage",
            specification: "Explains sinusoidal flux variation Phi(t) = Phi_m * sin(omega*t), high core permeability, and low reluctance path.",
            maxMarks: 3
          },
          {
            id: "crit_03",
            title: "EMF Equation & Turns Ratio",
            specification: "Derives step-by-step E_rms = 4.44 * f * N * Phi_m and defines transformation ratio E2/E1 = N2/N1 = K.",
            maxMarks: 3
          }
        ]
      },
      {
        id: "q_bee_03",
        number: 3,
        title: "Equivalent Circuit Modeling",
        maxMarks: 10,
        type: "descriptive"
      },
      {
        id: "q_bee_04",
        number: 4,
        title: "Efficiency and Voltage Regulation",
        maxMarks: 10,
        type: "descriptive"
      },
      {
        id: "q_bee_05",
        number: 5,
        title: "Open Circuit and Short Circuit Tests",
        maxMarks: 10,
        type: "descriptive"
      }
    ]
  },
  {
    id: "exam_dsa_quiz3",
    title: "Quiz 3: Digital Signal Processing",
    courseCode: "EE-305",
    status: "active",
    totalMarks: 25,
    totalQuestions: 3,
    dueDate: "2026-11-14",
    timeLimitMinutes: 45,
    classroom: "B.Tech EE — Section B (2024)",
    submissionsCount: 48,
    totalEnrolled: 54,
    reviewedCount: 0,
    markingDeadlineDays: 9
  },
  {
    id: "exam_phy_final",
    title: "Final Examination: Circuit Analysis",
    courseCode: "BEE-201",
    status: "draft",
    totalMarks: 60,
    totalQuestions: 6,
    dueDate: "2026-11-28",
    timeLimitMinutes: 120,
    classroom: "B.Tech EE — Section B (2024)",
    submissionsCount: 0,
    totalEnrolled: 72,
    reviewedCount: 0,
    markingDeadlineDays: 23
  }
];

export const MOCK_SUBMISSIONS = [
  {
    id: "subm_aarav_042",
    examId: "exam_bee_midterm",
    questionId: "q_bee_02",
    studentId: "usr_aarav_sharma",
    studentName: "Aarav Sharma",
    studentRoll: "EE-2024-042",
    scriptId: "#SCR-88192",
    submittedAt: "Today at 10:14 AM",
    room: "Assessment Room B-12",
    status: "teacher_reviewed", // "submitted" | "ai_evaluating" | "provisional" | "teacher_reviewed" | "published"
    ocrVerified: true,
    ocrConfidence: "98.4%",
    totalMaxMarks: 10,
    aiScore: 7.5,
    teacherScore: 8.0,
    studentAnswerText: `1. OPERATING MECHANISM:
A transformer is a static machine used to transfer alternating electrical energy from one circuit to another at constant frequency. The fundamental operation relies upon Faraday's law of electromagnetic induction and mutual induction between two magnetically coupled stationary windings. When an alternating voltage V1 is supplied across the primary winding, it sets up an alternating magnetizing current I_mu.

2. CORE FLUX PHENOMENOLOGY:
This exciting current drives a continuous sinusoidal magnetic flux Phi(t) = Phi_m * sin(omega * t) through the laminated silicon steel core. This magnetic flux travels around the magnetic circuit linking completely with both the primary turns N1 and secondary turns N2. The core has high permeability mu_r and offers very low reluctance path to the mutual magnetic lines of force.

3. EMF DERIVATION & TURNS RATIO:
By rate of change of flux linkages, the instantaneous induced electromotive force in the primary is given by e1 = -N1 * (dPhi/dt) = -N1 * omega * Phi_m * cos(omega * t).
Its RMS value is:
E1 = 4.44 * f * N1 * Phi_m  and  E2 = 4.44 * f * N2 * Phi_m

Therefore taking the transformation voltage ratio:
Step 3: E2 / E1 = N1 / N2 = K  (Hence secondary voltage scales inversed to turns ratio)`,
    handwrittenScanUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    concepts: {
      correct: 4,
      needsClarification: 1,
      inaccurate: 1
    },
    criteriaEvaluations: [
      {
        criterionId: "crit_01",
        title: "Working Principle & Induction Law",
        maxMarks: 4,
        aiScore: 4.0,
        teacherScore: 4.0,
        aiRationale: "Accurately articulated Faraday's law and mutual induction phenomenon. Correct distinction between stationary windings and magnetic core flux linkage.",
        teacherNote: "",
        status: "correct"
      },
      {
        criterionId: "crit_02",
        title: "Core Magnetic Flux Linkage",
        maxMarks: 3,
        aiScore: 2.0,
        teacherScore: 2.5,
        aiRationale: "Mentioned mutual flux and reluctance but omitted discussion on core saturation and negligible leakage flux assumptions.",
        teacherNote: "+0.5 awarded as student noted sinusoidal waveform Phi(t) = Phi_m * sin(omega*t) explicitly.",
        status: "partial"
      },
      {
        criterionId: "crit_03",
        title: "EMF Equation & Turns Ratio",
        maxMarks: 3,
        aiScore: 1.5,
        teacherScore: 1.5,
        aiRationale: "Correct primary derivation (4.44 * f * N * Phi), but inverted secondary turns ratio in final concluding equation (E2/E1 != N1/N2). Deducted 1.5 marks.",
        teacherNote: "",
        status: "incorrect"
      }
    ],
    teacherFeedback: "Good intuitive grasp of induction principles and clean Faraday formulation. Take special care with ideal transformer voltage/turns ratio definitions before final examinations.",
    publishedAt: "2026-11-05T12:00:00Z"
  },
  {
    id: "subm_elena_118",
    examId: "exam_bee_midterm",
    questionId: "q_bee_02",
    studentId: "usr_elena_rostova",
    studentName: "Elena Rostova",
    studentRoll: "CS-2024-118",
    scriptId: "#SCR-88193",
    submittedAt: "Today at 09:30 AM",
    room: "Assessment Room B-12",
    status: "provisional",
    ocrVerified: true,
    ocrConfidence: "99.1%",
    totalMaxMarks: 10,
    aiScore: 9.5,
    teacherScore: 9.5,
    concepts: { correct: 5, needsClarification: 0, inaccurate: 0 },
    criteriaEvaluations: [
      { criterionId: "crit_01", title: "Working Principle & Induction Law", maxMarks: 4, aiScore: 4.0, teacherScore: 4.0, aiRationale: "Flawless formulation.", teacherNote: "", status: "correct" },
      { criterionId: "crit_02", title: "Core Magnetic Flux Linkage", maxMarks: 3, aiScore: 3.0, teacherScore: 3.0, aiRationale: "Complete sinusoidal and saturation analysis.", teacherNote: "", status: "correct" },
      { criterionId: "crit_03", title: "EMF Equation & Turns Ratio", maxMarks: 3, aiScore: 2.5, teacherScore: 2.5, aiRationale: "Minor rounding on 4.44 coefficient factor.", teacherNote: "", status: "correct" }
    ],
    teacherFeedback: "Exemplar response across all mathematical and physical derivation benchmarks."
  },
  {
    id: "subm_marcus_089",
    examId: "exam_bee_midterm",
    questionId: "q_bee_02",
    studentId: "usr_marcus_chen",
    studentName: "Marcus Chen",
    studentRoll: "EE-2024-089",
    scriptId: "#SCR-88194",
    submittedAt: "Today at 08:45 AM",
    room: "Assessment Room B-12",
    status: "provisional",
    ocrVerified: true,
    ocrConfidence: "96.2%",
    totalMaxMarks: 10,
    aiScore: 6.0,
    teacherScore: 6.0,
    concepts: { correct: 2, needsClarification: 2, inaccurate: 1 },
    criteriaEvaluations: [
      { criterionId: "crit_01", title: "Working Principle & Induction Law", maxMarks: 4, aiScore: 3.0, teacherScore: 3.0, aiRationale: "Partial induction law explanation.", teacherNote: "", status: "partial" },
      { criterionId: "crit_02", title: "Core Magnetic Flux Linkage", maxMarks: 3, aiScore: 2.0, teacherScore: 2.0, aiRationale: "Lacks core reluctance detail.", teacherNote: "", status: "partial" },
      { criterionId: "crit_03", title: "EMF Equation & Turns Ratio", maxMarks: 3, aiScore: 1.0, teacherScore: 1.0, aiRationale: "Omitted secondary turns ratio derivation.", teacherNote: "", status: "incorrect" }
    ],
    teacherFeedback: "Review mutual inductance fundamentals."
  }
];

export const MOCK_CLASS_PERFORMANCE = {
  classAverage: 7.4,
  maxMarks: 10,
  gradedCount: 68,
  totalEnrolled: 72,
  distribution: [
    { band: "0 – 4 marks", label: "Below expectation", count: 4, percentage: 6, fill: "#c6c6ce" },
    { band: "5 – 6 marks", label: "Satisfactory", count: 16, percentage: 24, fill: "#9ca3af" },
    { band: "7 – 8 marks", label: "Proficient", count: 32, percentage: 47, fill: "#09152e" },
    { band: "9 – 10 marks", label: "Exemplary", count: 16, percentage: 23, fill: "#f2d45c" }
  ],
  criteriaAverages: [
    { criterion: "Principle & Faraday", avgScore: 3.4, max: 4.0 },
    { criterion: "Core Flux Linkage", avgScore: 2.3, max: 3.0 },
    { criterion: "EMF Equation Derivation", avgScore: 1.7, max: 3.0 }
  ]
};

export const MOCK_STUDENT_RESULTS = [
  {
    examId: "exam_bee_midterm",
    examTitle: "Basic Electrical Engineering — Mid-Term 2024",
    courseCode: "BEE-104",
    questionNumber: 2,
    questionTitle: "Single-Phase Transformer Principle & EMF Derivation",
    evaluator: "Prof. J. Harrington",
    certifiedDate: "Oct 24, 2024",
    score: 8.0,
    maxScore: 10.0,
    percentage: 80,
    rubricRevision: "Rubric Rev. 4.2 • Core Theory & Mathematical Rigor",
    criteria: [
      {
        number: 1,
        title: "Working Principle & Induction Law",
        score: 4.0,
        maxScore: 4.0,
        comment: "Accurate derivation of Faraday's Law and mutual induction fundamentals.",
        color: "#2E7D4F"
      },
      {
        number: 2,
        title: "Core Magnetic Flux Linkage",
        score: 2.5,
        maxScore: 3.0,
        comment: "Identified core permeability; omitted minor sinusoidal waveform nuance.",
        color: "#B7791F"
      },
      {
        number: 3,
        title: "EMF Equation & Turns Ratio",
        score: 1.5,
        maxScore: 3.0,
        comment: "Correct initial derivation, inverted secondary turns ratio in final concluding step.",
        color: "#B3372F"
      }
    ],
    diagnostic: {
      right: "Clear articulation of electromagnetic induction, proper transformer core identification, clean instantaneous flux representation.",
      missing: "Assumption regarding zero leakage flux in ideal transformer model. Needs explicit statement in preamble.",
      incorrect: "Inverted secondary turns ratio in final concluding step (E2/E1 != N1/N2). Deducted 1.5 marks."
    },
    teacherCommentary: "Good intuitive grasp of induction principles and clean Faraday formulation. Take special care with ideal transformer voltage/turns ratio definitions before final examinations."
  }
];

export const MOCK_SYSTEM_USERS = [
  { id: "usr_1", name: "Prof. J. Harrington", email: "j.harrington@oxford.ac.uk", role: "teacher", department: "Electrical Eng", status: "Active", lastLogin: "10 mins ago" },
  { id: "usr_2", name: "Dr. Eleanor Vance", email: "e.vance@oxford.ac.uk", role: "teacher", department: "Computer Science", status: "Active", lastLogin: "1 hour ago" },
  { id: "usr_3", name: "Aarav Sharma", email: "aarav.sharma@student.institution.edu", role: "student", department: "Electrical Eng", status: "Active", lastLogin: "Just now" },
  { id: "usr_4", name: "Elena Rostova", email: "elena.rostova@student.institution.edu", role: "student", department: "Computer Science", status: "Active", lastLogin: "3 hours ago" },
  { id: "usr_5", name: "Marcus Chen", email: "marcus.chen@student.institution.edu", role: "student", department: "Electrical Eng", status: "Active", lastLogin: "Yesterday" },
  { id: "usr_6", name: "Dean Arthur Morrison", email: "dean.academic@institution.edu", role: "admin", department: "Administration", status: "Active", lastLogin: "30 mins ago" }
];
