// Local-only API service backed by browser storage and demo data.

// ==========================================
// MOCK DATA STORE (For seamless testing & demo)
// ==========================================
const MOCK_STORAGE_KEY = 'mechora_mock_store_v1'
const LOCAL_DEMO_ACCOUNTS = {
  Student: ['alex.student', 'alex.student@evalai.edu'],
  Teacher: ['marcus.vance', 'marcus.vance@evalai.edu'],
  Admin: ['admin.arthur', 'admin@evalai.io'],
}

const initialMockData = {
  currentUser: {
    id: 1,
    username: 'alex.student',
    full_name: 'Alex Turner',
    email: 'alex.turner@industrial.edu',
    role: 'Student',
    department: 'Mechatronics & Robotics Engineering',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    joined_date: '2025-09-01',
    student_id: 'STU-2025-8842',
    progress: 78,
  },
  machines: [
    {
      machine_id: 'M-HP200',
      model: 'HP-200',
      machine_name: 'Hydraulic Forming Press 200T',
      description: 'Heavy-duty 200-ton hydraulic press for sheet metal deep drawing and high-pressure compression stamping with closed-loop pressure feedback.',
      category: 'Forming & Stamping',
      manual_count: 2,
      status: 'operational',
      power_rating: '45 kW',
      max_pressure: '250 Bar',
      last_serviced: '2026-10-14',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    },
    {
      machine_id: 'M-AC90',
      model: 'AC-90',
      machine_name: 'Rotary Screw Air Compressor',
      description: 'Industrial 90kW variable speed rotary screw compressor with integrated refrigerated air dryer and multi-stage oil separator.',
      category: 'Pneumatics & Power',
      manual_count: 1,
      status: 'operational',
      power_rating: '90 kW',
      max_pressure: '12.5 Bar',
      last_serviced: '2026-10-29',
      image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    },
    {
      machine_id: 'M-CNC500',
      model: 'CNC-500X',
      machine_name: '5-Axis Precision CNC Machining Center',
      description: 'Ultra-precision high-speed CNC machining center featuring 24,000 RPM direct-drive spindle and 60-tool automatic changer.',
      category: 'Machining & Tooling',
      manual_count: 3,
      status: 'maintenance',
      power_rating: '32 kW',
      max_pressure: '70 Bar Coolant',
      last_serviced: '2026-11-01',
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
    },
    {
      machine_id: 'M-ROB12',
      model: 'KUKA-KR12',
      machine_name: '6-Axis Articulated Industrial Robot',
      description: 'Payload capacity 12kg with 1610mm reach for automated precision welding, pick-and-place, and optical quality inspection.',
      category: 'Robotics & Automation',
      manual_count: 2,
      status: 'operational',
      power_rating: '8.5 kW',
      max_pressure: 'N/A',
      last_serviced: '2026-09-18',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    },
  ],
  manuals: [
    {
      id: 1,
      document_id: 'HP-OPS-01',
      machine_id: 'M-HP200',
      document_name: 'HP-200 Operations and Safety Guidelines',
      revision: '1.2',
      file_size: '4.8 MB',
      pdf_filename: 'HP200_Operations_Rev1_2.pdf',
      ingestion_status: 'completed',
      uploaded_by: 'Prof. Marcus Vance',
      uploaded_at: '2026-10-10T14:20:00Z',
      total_chunks: 148,
    },
    {
      id: 2,
      document_id: 'HP-MAINT-02',
      machine_id: 'M-HP200',
      document_name: 'HP-200 Preventive Maintenance & Hydraulic Circuit Schematic',
      revision: '2.0',
      file_size: '7.2 MB',
      pdf_filename: 'HP200_Maintenance_Rev2_0.pdf',
      ingestion_status: 'completed',
      uploaded_by: 'Prof. Marcus Vance',
      uploaded_at: '2026-10-12T09:15:00Z',
      total_chunks: 215,
    },
    {
      id: 3,
      document_id: 'AC-OM-01',
      machine_id: 'M-AC90',
      document_name: 'AC-90 Rotary Compressor Operations & Fault Diagnostics',
      revision: '1.0',
      file_size: '3.9 MB',
      pdf_filename: 'AC90_Operations_Maintenance_Rev1_0.pdf',
      ingestion_status: 'completed',
      uploaded_by: 'Admin Office',
      uploaded_at: '2026-09-28T11:45:00Z',
      total_chunks: 92,
    },
    {
      id: 4,
      document_id: 'CNC-CAL-03',
      machine_id: 'M-CNC500',
      document_name: 'CNC-500X Spindle Calibration & G-Code Programming Guide',
      revision: '3.1',
      file_size: '12.4 MB',
      pdf_filename: 'CNC500X_Calibration_Manual_Rev3.pdf',
      ingestion_status: 'completed',
      uploaded_by: 'Prof. Elena Rostova',
      uploaded_at: '2026-10-04T16:30:00Z',
      total_chunks: 340,
    },
  ],
  questions: [
    {
      id: 101,
      user_id: 1,
      student_name: 'Alex Turner',
      student_email: 'alex.turner@industrial.edu',
      machine_id: 'M-HP200',
      machine_name: 'Hydraulic Forming Press 200T',
      question_text: 'What is the procedure for resetting emergency hydraulic valve alarm E-301?',
      title: 'Reset Procedure for Hydraulic Alarm E-301',
      answer_text: `### Reset Procedure for Hydraulic Alarm E-301 (Proportional Relief Valve Overpressure)

To safely clear error code **E-301** on the HP-200 Hydraulic Forming Press:

1. **Verify Isolation**: Ensure the main ram is in its mechanical top-dead-center park position and engage the mechanical safety catch bar.
2. **Depressurize Accumulator**: Open bleed valve **BV-04** clockwise by 1.5 turns to release residual accumulator pressure into the reservoir. Check gauge **PG-02** reads below 5 Bar.
3. **Inspect Proportional Pilot Valve**: Examine valve block **VB-2** for particle contamination or electrical solenoid connector disconnect.
4. **HMI Fault Reset**:
   - Access the Main Operator Console.
   - Enter Maintenance Level 2 PIN (\`4421\`).
   - Navigate to **Diagnostics > Hydraulic Safety Loop > Fault Clear**.
   - Hold the blue **Fault Acknowledge** button for 3 seconds until the indicator flashes amber then solid green.
5. **Re-pressurization Sequence**: Close bleed valve **BV-04** and initiate slow hydraulic pre-charge cycle at 50 Bar before resuming 200T operations.

> **Safety Warning**: Never attempt to override alarm E-301 while the main pump motor is actively energized.`,
      status: 'ANSWERED',
      teacher_note: 'Alex: verified this answer against the OEM schematics. Ensure you check the O-ring seals on VB-2 before re-pressurizing.',
      is_reviewed: true,
      is_pinned: true,
      citations: [
        {
          source_id: 'S1',
          document_id: 'HP-OPS-01',
          document_name: 'HP-200 Operations and Safety Guidelines',
          revision: '1.2',
          page_number: 44,
          section_title: 'Section 4.3: Hydraulic Safety Interlocks & Error Codes',
          excerpt: 'Fault code E-301 indicates proportional pressure relief threshold violation exceeding 260 Bar for >350ms. Bleed valve BV-04 must be verified before diagnostic override.',
          score: 0.96,
        },
        {
          source_id: 'S2',
          document_id: 'HP-MAINT-02',
          document_name: 'HP-200 Preventive Maintenance & Hydraulic Circuit Schematic',
          revision: '2.0',
          page_number: 88,
          section_title: 'Section 8.1: Valve Block VB-2 Pilot Manifold Service',
          excerpt: 'When clearing hydraulic lockouts, verify pressure gauge PG-02 indicates <5 Bar before touching pilot solenoids or adjusting proportional valve null voltage.',
          score: 0.92,
        },
      ],
      created_at: '2026-11-04T16:30:00Z',
    },
    {
      id: 102,
      user_id: 1,
      student_name: 'Alex Turner',
      student_email: 'alex.turner@industrial.edu',
      machine_id: 'M-AC90',
      machine_name: 'Rotary Screw Air Compressor',
      question_text: 'What are the recommended oil change intervals and oil viscosity specifications?',
      title: 'Oil Change Intervals & Viscosity for AC-90',
      answer_text: `### Oil Maintenance Specifications for AC-90 Rotary Screw Compressor

- **Initial Break-in Service**: Perform first oil and filter replacement after the first **500 operating hours**.
- **Standard Operating Interval**: Every **4,000 running hours** or **12 months**, whichever occurs first.
- **Extreme Duty / High Ambient (>40°C)**: Reduce change interval to **2,000 hours**.
- **Approved Lubricant**: Synthetic polyalphaolefin (PAO) ISO VG 46 compressor fluid (specification **ISO 6743-3A-DAH**).
- **Reservoir Capacity**: 32 Liters.`,
      status: 'ANSWERED',
      teacher_note: '',
      is_reviewed: false,
      is_pinned: false,
      citations: [
        {
          source_id: 'S1',
          document_id: 'AC-OM-01',
          document_name: 'AC-90 Rotary Compressor Operations & Fault Diagnostics',
          revision: '1.0',
          page_number: 28,
          section_title: 'Section 3.4: Lubrication Schedule & Oil Specifications',
          excerpt: 'Use only synthetic ISO VG 46 compressor oil. Mineral oil will cause varnish build-up on rotary screw elements and void thermal warranty.',
          score: 0.94,
        },
      ],
      created_at: '2026-11-03T11:20:00Z',
    },
    {
      id: 103,
      user_id: 2,
      student_name: 'Sarah Chen',
      student_email: 'sarah.chen@industrial.edu',
      machine_id: 'M-CNC500',
      machine_name: '5-Axis Precision CNC Machining Center',
      question_text: 'How to calculate spindle thermal compensation on Axis C during continuous 4-hour roughing?',
      title: 'Spindle Thermal Compensation on Axis C',
      answer_text: `### Spindle Thermal Drift Compensation (CNC-500X)

For continuous multi-hour roughing operations on Axis C:
1. **Dynamic Thermal Model**: The CNC-500X controller incorporates real-time RTD sensors on bearing mounts T1 through T4.
2. Enable parameter \`#5201 = 1\` (Active RTD Matrix Thermal Drift Correction).
3. Ensure coolant chiller is set to match machine bed temperature within **±0.5°C**.
4. Run G-code calibration macro \`G65 P9022\` between roughing and finishing passes to perform automatic laser tool probing compensation.`,
      status: 'ANSWERED',
      teacher_note: 'Excellent question. Remind students to also check thermal expansion on titanium alloy fixtures.',
      is_reviewed: true,
      is_pinned: false,
      citations: [
        {
          source_id: 'S1',
          document_id: 'CNC-CAL-03',
          document_name: 'CNC-500X Spindle Calibration & G-Code Programming Guide',
          revision: '3.1',
          page_number: 112,
          section_title: 'Section 9.2: Spindle Thermal Expansion & Kinematic Offsets',
          excerpt: 'Extended milling cycles generate axial expansion up to 18 microns. Macro G65 P9022 adjusts Axis C kinematic center point.',
          score: 0.98,
        },
      ],
      created_at: '2026-11-04T18:45:00Z',
    },
    {
      id: 104,
      user_id: 3,
      student_name: 'David Patel',
      student_email: 'david.patel@industrial.edu',
      machine_id: 'M-HP200',
      machine_name: 'Hydraulic Forming Press 200T',
      question_text: 'What are the maximum allowable deflection limits for the upper bolster plate under 180T load?',
      title: 'Upper Bolster Plate Deflection Limits',
      answer_text: `According to Section 2.8 of the HP-200 Technical Manual, the maximum permissible elastic deflection of the upper bolster plate is **0.08 mm per meter of bed length** at nominal 180-ton distributed load. Exceeding this indicates uneven die clamping or worn tie-rod preload bushings.`,
      status: 'ANSWERED',
      teacher_note: '',
      is_reviewed: false,
      is_pinned: false,
      citations: [
        {
          source_id: 'S1',
          document_id: 'HP-OPS-01',
          document_name: 'HP-200 Operations and Safety Guidelines',
          revision: '1.2',
          page_number: 19,
          section_title: 'Section 2.8: Mechanical Tolerances and Structural Limits',
          excerpt: 'Deflection of bolster plates must not exceed 0.08mm/m. Regularly inspect tie-rod strain sensors for load balance.',
          score: 0.95,
        },
      ],
      created_at: '2026-11-05T09:10:00Z',
    },
    {
      id: 105,
      user_id: 4,
      student_name: 'Liam O’Connor',
      student_email: 'liam.oc@industrial.edu',
      machine_id: 'M-ROB12',
      machine_name: '6-Axis Articulated Industrial Robot',
      question_text: 'Can we use rapid jog mode while safe zone perimeter laser curtain is triggered?',
      title: 'Safe Zone Perimeter & Rapid Jog Rules',
      answer_text: `**NO**. When the safety perimeter optical curtain is interrupted, the robot controller engages **Category 4 / PL e Stop Category 1**. Rapid jog is electronically inhibited. Only **Manual Reduced Speed T1 (max 250 mm/s)** with 3-position deadman switch engagement is permitted inside the guarded cell.`,
      status: 'ANSWERED',
      teacher_note: '',
      is_reviewed: false,
      is_pinned: false,
      citations: [
        {
          source_id: 'S1',
          document_id: 'HP-OPS-01',
          document_name: 'Safety Standards Manual',
          revision: '2.1',
          page_number: 14,
          section_title: 'Section 1.2: ISO 10218-1 Industrial Robot Safety Standards',
          excerpt: 'Speed monitoring must ensure TCP speed does not exceed 250 mm/s when safety fences are unlocked or light curtains bypassed.',
          score: 0.97,
        },
      ],
      created_at: '2026-11-05T12:05:00Z',
    },
  ],
  users: [
    {
      id: 1,
      username: 'alex.student',
      full_name: 'Alex Turner',
      email: 'alex.turner@industrial.edu',
      role: 'Student',
      department: 'Mechatronics & Robotics Engineering',
      status: 'active',
      questions_count: 24,
      last_active: 'Just now',
    },
    {
      id: 2,
      username: 'sarah.chen',
      full_name: 'Sarah Chen',
      email: 'sarah.chen@industrial.edu',
      role: 'Student',
      department: 'Mechanical Systems',
      status: 'active',
      questions_count: 19,
      last_active: '2 hours ago',
    },
    {
      id: 3,
      username: 'david.patel',
      full_name: 'David Patel',
      email: 'david.patel@industrial.edu',
      role: 'Student',
      department: 'Industrial Automation',
      status: 'active',
      questions_count: 31,
      last_active: '4 hours ago',
    },
    {
      id: 4,
      username: 'liam.oc',
      full_name: 'Liam O’Connor',
      email: 'liam.oc@industrial.edu',
      role: 'Student',
      department: 'Robotics & Control',
      status: 'active',
      questions_count: 12,
      last_active: 'Yesterday',
    },
    {
      id: 10,
      username: 'marcus.vance',
      full_name: 'Prof. Marcus Vance',
      email: 'marcus.vance@industrial.edu',
      role: 'Teacher',
      department: 'Department of Mechanical Engineering',
      status: 'active',
      questions_count: 0,
      last_active: '30 mins ago',
    },
    {
      id: 11,
      username: 'elena.rostova',
      full_name: 'Prof. Elena Rostova',
      email: 'elena.rostova@industrial.edu',
      role: 'Teacher',
      department: 'Department of Precision Tooling & RAG',
      status: 'active',
      questions_count: 0,
      last_active: '3 hours ago',
    },
    {
      id: 20,
      username: 'admin',
      full_name: 'Dr. Arthur Pendelton',
      email: 'admin@mechora.ai',
      role: 'Admin',
      department: 'Systems & Industrial AI Center',
      status: 'active',
      questions_count: 0,
      last_active: 'Active now',
    },
  ],
  systemStats: {
    totalStudents: 142,
    totalTeachers: 12,
    totalUsers: 154,
    totalQuestions: 1289,
    answeredQuestions: 1245,
    pendingReviewQuestions: 18,
    totalDocuments: 28,
    activeMachines: 14,
    avgResponseTime: '0.84s',
    ragAccuracy: '98.4%',
  },
}

function getLocalData() {
  const stored = localStorage.getItem(MOCK_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // fallback
    }
  }
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initialMockData))
  return initialMockData
}

function saveLocalData(data) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data))
}

// ==========================================
// API EXPORTS
// ==========================================

export const authAPI = {
  login: async (username, password, selectedRole) => {
    const normalizedUsername = username.trim().toLowerCase()
    const account = Object.entries(LOCAL_DEMO_ACCOUNTS).find(([, aliases]) =>
      aliases.includes(normalizedUsername)
    )

    if (!account || password !== 'industrial2026') {
      throw new Error('Invalid demo credentials. Use a listed demo account or choose a Demo Sandbox role below.')
    }

    const [accountRole] = account
    if (accountRole !== selectedRole) {
      throw new Error(`This demo account belongs to the ${accountRole} workspace. Select that role and try again.`)
    }

    return authAPI.demoLogin(accountRole)
  },

  demoLogin: async (roleName = 'Student') => {
    // Artificial slight delay for realistic Apple UI feel
    await new Promise((resolve) => setTimeout(resolve, 600))

    const demoAccounts = {
      Student: {
        id: 1,
        username: 'alex.student',
        full_name: 'Alex Turner',
        email: 'alex.student@evalai.edu',
        role: 'Student',
        department: 'Mechatronics & AI Engineering',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        student_id: 'EVAL-2026-8842',
        progress: 84,
      },
      Teacher: {
        id: 10,
        username: 'marcus.vance',
        full_name: 'Prof. Marcus Vance',
        email: 'marcus.vance@evalai.edu',
        role: 'Teacher',
        department: 'Department of Computer Science & AI',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
        faculty_id: 'FAC-EVAL-402',
        courses_count: 4,
      },
      Admin: {
        id: 20,
        username: 'admin.arthur',
        full_name: 'Dr. Arthur Pendelton',
        email: 'admin@evalai.io',
        role: 'Admin',
        department: 'Systems & Academic Administration',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
        admin_level: 'Super Admin',
      },
    }

    const selectedUser = demoAccounts[roleName] || demoAccounts.Student

    return {
      status: 'demo_authenticated',
      role: selectedUser.role,
      user: selectedUser,
    }
  },

  logout: async () => {
    return { status: 'logged_out' }
  },
}

export const machinesAPI = {
  getMachines: async () => {
    const data = getLocalData()
    return data.machines
  },

  createMachine: async (machineData) => {
    const data = getLocalData()
    const newMachine = {
      machine_id: machineData.machine_id,
      model: machineData.model || machineData.machine_id,
      machine_name: machineData.machine_name || machineData.model,
      description: machineData.description || '',
      category: machineData.category || 'General Equipment',
      manual_count: 0,
      status: 'operational',
      power_rating: machineData.power_rating || '30 kW',
      max_pressure: machineData.max_pressure || '100 Bar',
      last_serviced: new Date().toISOString().split('T')[0],
      image: machineData.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    }
    data.machines.unshift(newMachine)
    saveLocalData(data)
    return newMachine
  },

  updateMachine: async (machineId, updatedFields) => {
    const data = getLocalData()
    const index = data.machines.findIndex((m) => m.machine_id === machineId)
    if (index !== -1) {
      data.machines[index] = { ...data.machines[index], ...updatedFields }
      saveLocalData(data)
      return data.machines[index]
    }
    throw new Error('Machine not found')
  },

  deleteMachine: async (machineId) => {
    const data = getLocalData()
    data.machines = data.machines.filter((m) => m.machine_id !== machineId)
    saveLocalData(data)
    return { success: true }
  },
}

export const assistantAPI = {
  askQuestion: async ({ machine_id, question }) => {
    const data = getLocalData()
    const machine = data.machines.find((m) => m.machine_id === machine_id) || data.machines[0]

    // Formulate a structured high-level engineering RAG answer
    const qLower = question.toLowerCase()
    let answerText = ''
    let citations = []

    if (qLower.includes('calibrat') || qLower.includes('axis') || qLower.includes('spindle')) {
      answerText = `### Spindle & Axis Calibration Protocol for ${machine.machine_name} (${machine.model})

Based on retrieved technical documentation (Section 4.1):

1. **Pre-requisite Thermal Stabilization**:
   - Power on the spindle chiller system and run warmup cycle \`M03 S3000\` for 15 minutes to reach equilibrium (operating temperature 38°C ± 1.5°C).
2. **Dial Indicator Alignment**:
   - Mount a high-precision digital indicator (0.001 mm resolution) to the magnetic base on the ground bedway.
   - Sweep the inside taper of the spindle. Total radial runout must not exceed **0.003 mm**.
3. **Electronic Axis Compensation**:
   - Access **Service Diagnostics > Backlash & Pitch Error Matrix**.
   - Input measured lead screw pitch deviations at 50 mm intervals.
   - Verify closed-loop linear encoder sync pulses on the optical scale.

> **Verification**: Run standard Renishaw QC20-W ballbar circularity test at feed rate 1500 mm/min. Permissible roundness error is <0.005 mm.`

      citations = [
        {
          source_id: 'S1',
          document_id: `${machine.machine_id}-MAN-01`,
          document_name: `${machine.model} Precision Calibration and Axis Geometry Guide`,
          revision: '2.1',
          page_number: 52,
          section_title: 'Section 4.1: Spindle Runout & Dynamic Thermal Drift',
          excerpt: 'Permissible radial runout is 0.003 mm at the spindle nose. Warmup cycle M03 S3000 is required before zeroing encoders.',
          score: 0.97,
        },
      ]
    } else if (qLower.includes('pressure') || qLower.includes('hydraulic') || qLower.includes('leak') || qLower.includes('valve')) {
      answerText = `### Hydraulic Subsystem Inspection & Pressure Relief Procedure (${machine.model})

According to Official Factory Service Manual:

1. **System Pressure Check**:
   - Verify primary pump gauge **PG-01** indicates normal standby pressure of **180 - 210 Bar**.
   - If line pressure exceeds **230 Bar**, the main proportional pilot valve will trigger safety interlock **E-301**.
2. **Checking for Internal Leakage**:
   - Inspect the main return line bypass. A temperature differential greater than 15°C across valve block **VB-2** indicates high internal fluid slip.
3. **Safety Isolation Steps**:
   - Lock out electric pump supply switch **Q1**.
   - Open manual pressure bleed screw **V-04** until gauge drops to 0.0 Bar before disconnecting any high-pressure flex hoses.`

      citations = [
        {
          source_id: 'S1',
          document_id: `${machine.machine_id}-HYD-01`,
          document_name: `${machine.model} Hydraulic Circuit Manual & Diagnostic Schematics`,
          revision: '1.4',
          page_number: 34,
          section_title: 'Section 3.2: Pressure Regulation and Return Manifold',
          excerpt: 'Nominal operational envelope is 180 to 210 Bar. Always release valve V-04 before disassembling proportional cartridges.',
          score: 0.95,
        },
      ]
    } else {
      answerText = `### Technical Guidance: ${question}

**Equipment**: ${machine.machine_name} (ID: ${machine.machine_id})

1. **Standard Operating Protocol**:
   - Refer to Section 2 of the operational standard: ensure equipment is calibrated to factory tolerances prior to production runs.
   - Current machine rating: **${machine.power_rating}**, maximum operational parameter: **${machine.max_pressure}**.
2. **Preventive Checks**:
   - Inspect fluid levels, electrical wiring harnesses, and emergency stop interlocks on the front and rear panels.
   - Clean linear guides and wipe debris using clean lint-free cloths and designated solvent.
3. **Safety Reminders**:
   - All operators must wear PPE (safety glasses, steel-toed boots, cut-resistant gloves).
   - Ensure the protective interlock enclosure is closed and verified green before cycling the start button.`

      citations = [
        {
          source_id: 'S1',
          document_id: `${machine.machine_id}-STD-01`,
          document_name: `${machine.model} Operator Manual & Safety Architecture`,
          revision: '1.0',
          page_number: 16,
          section_title: 'Section 2.1: General Operation & Safety Interlocks',
          excerpt: 'All operators must follow lockout-tagout (LOTO) protocols and inspect safety curtains prior to beginning high-speed cycles.',
          score: 0.92,
        },
      ]
    }

    // Save into questions history
    const newQuestion = {
      id: Date.now(),
      user_id: data.currentUser.id,
      student_name: data.currentUser.full_name,
      student_email: data.currentUser.email,
      machine_id: machine.machine_id,
      machine_name: machine.machine_name,
      question_text: question,
      title: question.length > 50 ? question.slice(0, 50) + '...' : question,
      answer_text: answerText,
      status: 'ANSWERED',
      teacher_note: '',
      is_reviewed: false,
      is_pinned: false,
      citations,
      created_at: new Date().toISOString(),
    }

    data.questions.unshift(newQuestion)
    saveLocalData(data)

    return {
      status: 'ANSWERED',
      answer: answerText,
      sources: citations,
      question_id: newQuestion.id,
    }
  },

  getHistory: async (query = '') => {
    const data = getLocalData()
    let questions = data.questions
    if (query) {
      const q = query.toLowerCase()
      questions = questions.filter(
        (item) => item.question_text.toLowerCase().includes(q) || item.title.toLowerCase().includes(q)
      )
    }
    return questions
  },

  getAllQuestionsForTeacher: async (statusFilter = 'ALL') => {
    const data = getLocalData()
    if (statusFilter === 'REVIEWED') {
      return data.questions.filter((q) => q.is_reviewed)
    }
    if (statusFilter === 'PENDING') {
      return data.questions.filter((q) => !q.is_reviewed)
    }
    return data.questions
  },

  addTeacherReview: async (questionId, teacherNote, markReviewed = true) => {
    const data = getLocalData()
    const item = data.questions.find((q) => q.id === questionId)
    if (item) {
      item.teacher_note = teacherNote
      item.is_reviewed = markReviewed
      saveLocalData(data)
      return item
    }
    throw new Error('Question not found')
  },

  togglePin: async (questionId) => {
    const data = getLocalData()
    const item = data.questions.find((q) => q.id === questionId)
    if (item) {
      item.is_pinned = !item.is_pinned
      saveLocalData(data)
      return item
    }
    throw new Error('Question not found')
  },

  deleteQuestion: async (questionId) => {
    const data = getLocalData()
    data.questions = data.questions.filter((q) => q.id !== questionId)
    saveLocalData(data)
    return { success: true }
  },
}

export const manualsAPI = {
  getManuals: async () => {
    const data = getLocalData()
    return data.manuals
  },

  uploadManual: async (formData) => {
    const data = getLocalData()
    const newManual = {
      id: Date.now(),
      document_id: formData.get ? formData.get('document_id') || `DOC-${Date.now().toString().slice(-4)}` : 'DOC-01',
      machine_id: formData.get ? formData.get('machine_id') || 'M-HP200' : 'M-HP200',
      document_name: formData.get ? formData.get('document_name') || 'Industrial Manual' : 'Industrial Manual',
      revision: formData.get ? formData.get('revision') || '1.0' : '1.0',
      file_size: '5.2 MB',
      pdf_filename: 'uploaded_document.pdf',
      ingestion_status: 'completed',
      uploaded_by: 'Authorized Faculty',
      uploaded_at: new Date().toISOString(),
      total_chunks: Math.floor(Math.random() * 200) + 50,
    }
    data.manuals.unshift(newManual)
    saveLocalData(data)
    return newManual
  },

  deleteManual: async (manualId) => {
    const data = getLocalData()
    data.manuals = data.manuals.filter((m) => m.id !== manualId)
    saveLocalData(data)
    return { success: true }
  },
}

export const adminAPI = {
  getSystemOverview: async () => {
    const data = getLocalData()
    return {
      stats: {
        totalStudents: data.users.filter((u) => u.role === 'Student').length + 138,
        totalTeachers: data.users.filter((u) => u.role === 'Teacher').length + 10,
        totalUsers: data.users.length + 148,
        totalQuestions: data.questions.length + 1284,
        totalDocuments: data.manuals.length + 24,
        totalMachines: data.machines.length,
        systemHealth: '99.9%',
        ragIndexStatus: 'Synced & Optimized',
      },
    }
  },

  getUsers: async () => {
    const data = getLocalData()
    return data.users
  },

  createUser: async (userData) => {
    const data = getLocalData()
    const newUser = {
      id: Date.now(),
      username: userData.username,
      full_name: userData.full_name,
      email: userData.email,
      role: userData.role || 'Student',
      department: userData.department || 'Mechanical Engineering',
      status: 'active',
      questions_count: 0,
      last_active: 'Just now',
    }
    data.users.push(newUser)
    saveLocalData(data)
    return newUser
  },

  toggleUserStatus: async (userId) => {
    const data = getLocalData()
    const user = data.users.find((u) => u.id === userId)
    if (user) {
      user.status = user.status === 'active' ? 'inactive' : 'active'
      saveLocalData(data)
      return user
    }
    throw new Error('User not found')
  },

  updateUser: async (userId, updatedFields) => {
    const data = getLocalData()
    const index = data.users.findIndex((u) => u.id === userId)
    if (index !== -1) {
      data.users[index] = { ...data.users[index], ...updatedFields }
      saveLocalData(data)
      return data.users[index]
    }
    throw new Error('User not found')
  },
}
