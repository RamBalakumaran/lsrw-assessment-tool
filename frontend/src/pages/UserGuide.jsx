import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
    BookOpen,
    HelpCircle,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    Headphones,
    Mic,
    PenTool,
    Users,
    Award,
    FileText,
    Printer,
    Search,
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Laptop,
    BarChart3,
    Layers,
    Key,
    Shield,
    Check,
    Lightbulb,
    Share2,
    FileSpreadsheet,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UserGuide = ({ fixedRole }) => {
    const navigate = useNavigate();

    // Determine current logged-in user and role
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        setToken(storedToken);

        if (!storedToken) {
            navigate('/login', { replace: true });
            return;
        }

        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch (e) {
                setCurrentUser(null);
            }
        }
    }, [navigate]);

    // Strictly resolve the active role: fixedRole prop > stored user role
    const effectiveRole = useMemo(() => {
        if (fixedRole) {
            const normalized = fixedRole.toLowerCase();
            if (['student', 'teacher', 'admin'].includes(normalized)) return normalized;
        }
        try {
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            if (['ADMIN', 'SUPER_ADMIN', 'DEPT_ADMIN'].includes(stored.role)) return 'admin';
            if (stored.role === 'TEACHER') return 'teacher';
            if (stored.role === 'STUDENT') return 'student';
        } catch (_) {}
        return 'student';
    }, [fixedRole]);

    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSections, setExpandedSections] = useState({});
    const [copiedLink, setCopiedLink] = useState(false);

    const toggleSection = (id) => {
        setExpandedSections(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const expandAll = () => {
        const allOpen = {};
        filteredSections.forEach(sec => {
            allOpen[sec.id] = true;
        });
        setExpandedSections(allOpen);
    };

    const collapseAll = () => {
        setExpandedSections({});
    };

    const handlePrint = () => {
        expandAll();
        setTimeout(() => {
            window.print();
        }, 150);
    };

    const handleShare = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        }
    };

    // Role-Specific Manual Database
    const roleManuals = {
        student: {
            roleName: "Student",
            title: "Student Assessment & Operations Manual",
            badge: "Student User Guide",
            badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
            accentGradient: "from-sky-500 to-blue-600",
            summary: "Comprehensive step-by-step instructions for students taking Listening, Speaking, Reading, and Writing assessments on FluentPro, hardware setup, exam integrity rules, and interpreting AI analytics.",
            sections: [
                {
                    id: "student-login",
                    icon: <Key className="text-sky-500" size={24} />,
                    title: "1. Accessing the Portal & First-Time Login",
                    overview: "How to authenticate your student account, set your security password, and access your personal dashboard.",
                    steps: [
                        {
                            stepNumber: "Step 1",
                            title: "Access the Portal",
                            detail: "Open the FluentPro portal in Google Chrome or Microsoft Edge."
                        },
                        {
                            stepNumber: "Step 2",
                            title: "Enter Institutional Email",
                            detail: "Enter your assigned institutional email address (e.g. 2311005@nec.edu.in)."
                        },
                        {
                            stepNumber: "Step 3",
                            title: "Temporary Security PIN & Mandatory Password Reset",
                            detail: "Input the initial security PIN provided by your department faculty. On your first login, the system will prompt you to set a secure permanent password (minimum 8 characters, alphanumeric)."
                        },
                        {
                            stepNumber: "Step 4",
                            title: "Device Session Persistence",
                            detail: "Check 'Persist Session' only on personal laptops/devices. On public campus computer labs, leave this unchecked and always log out when done."
                        }
                    ],
                    tip: "If you ever lose access, click 'Reset Pass' on the login screen or request your faculty advisor to issue a temporary login token."
                },
                {
                    id: "student-hardware",
                    icon: <Laptop className="text-blue-500" size={24} />,
                    title: "2. System Readiness & Microphone Setup",
                    overview: "Mandatory hardware and browser permissions needed before starting any assessment.",
                    steps: [
                        {
                            stepNumber: "Requirement 1",
                            title: "Supported Browsers",
                            detail: "Google Chrome 110+, Microsoft Edge, or Mozilla Firefox. Ensure your browser is up to date for optimal WebRTC speech recording."
                        },
                        {
                            stepNumber: "Requirement 2",
                            title: "Microphone Access & Calibration",
                            detail: "When prompted by the browser, click 'Allow' for microphone permissions. Use a wired headset or reliable laptop microphone. Avoid high-latency Bluetooth earphones."
                        },
                        {
                            stepNumber: "Requirement 3",
                            title: "Headphone Sound Check",
                            detail: "Plug in headphones before launching Listening tests. Adjust volume to comfortable levels before beginning the audio track."
                        },
                        {
                            stepNumber: "Requirement 4",
                            title: "Quiet Test Environment",
                            detail: "Complete speaking assessments in a quiet room without background noise, music, or conversation to ensure accurate AI phoneme detection."
                        }
                    ],
                    alert: "Proctoring guard prohibits external secondary monitors. Disconnect any external displays before beginning a test."
                },
                {
                    id: "student-dashboard",
                    icon: <BarChart3 className="text-indigo-500" size={24} />,
                    title: "3. Navigating the Student Dashboard",
                    overview: "Understanding your learning center, competency radar graph, and active assignments.",
                    steps: [
                        {
                            stepNumber: "Feature A",
                            title: "CEFR Skill Radar Graph",
                            detail: "The radar chart displays your evaluated proficiency across Listening, Speaking, Reading, and Writing compared to target CEFR benchmarks (A1 through C2)."
                        },
                        {
                            stepNumber: "Feature B",
                            title: "Assigned Assessment Tasks",
                            detail: "Shows pending tasks assigned by your teachers with deadline countdowns, duration limits, and 'Start Assessment' buttons."
                        },
                        {
                            stepNumber: "Feature C",
                            title: "My Progress & Past Submissions",
                            detail: "Click 'My Progress' in the sidebar to review all past assessment attempts, scores, and downloadable performance reports."
                        },
                        {
                            stepNumber: "Feature D",
                            title: "Peer & Cohort Comparison",
                            detail: "Use the 'Compare' tab to view your performance benchmarks alongside your cohort and department averages."
                        }
                    ]
                },
                {
                    id: "student-lsrw-modules",
                    icon: <Layers className="text-cyan-500" size={24} />,
                    title: "4. Step-by-Step Guide to the 4 LSRW Modules",
                    overview: "Specific procedures for completing Listening, Speaking, Reading, and Writing tasks with optimal scores.",
                    modules: [
                        {
                            name: "🎧 Listening Module",
                            color: "border-blue-200 bg-blue-50/50",
                            icon: <Headphones className="text-blue-600" size={20} />,
                            points: [
                                "Audio Track Playback: Click Play to start listening. Tests may enforce a maximum of 1 or 2 plays.",
                                "Controls: Use the volume slider on the player. Do not refresh the page while audio is active.",
                                "Questions: Multiple Choice (MCQ), Fill-in-the-Blanks, and sentence completion.",
                                "Navigation: Navigate freely between questions using the bottom numbered stepper before submitting.",
                                "Auto-Buffering: Your answers are buffered automatically in real time."
                            ]
                        },
                        {
                            name: "🗣️ Speaking Module",
                            color: "border-rose-200 bg-rose-50/50",
                            icon: <Mic className="text-rose-600" size={20} />,
                            points: [
                                "Prompt Analysis: Read the topic card and question statement carefully.",
                                "Preparation Time: A 30–60 second countdown is provided to organize your thoughts before speaking.",
                                "Recording: When recording begins, speak at a natural pace (120–150 words per minute).",
                                "Soundwave Indicator: Ensure the visual soundwave bars fluctuate as you speak to confirm active audio input.",
                                "Submission: Click 'Stop & Submit' when finished or allow the timer to complete. AI models evaluate fluency, pronunciation, grammar, and vocabulary."
                            ]
                        },
                        {
                            name: "📖 Reading Module",
                            color: "border-amber-200 bg-amber-50/50",
                            icon: <BookOpen className="text-amber-600" size={20} />,
                            points: [
                                "Split-Screen Layout: The reading passage stays pinned on the left panel while comprehension questions appear on the right.",
                                "Pacing: The system tracks your reading speed (Words Per Minute).",
                                "Question Types: Identifying main ideas, inference questions, and contextual vocabulary.",
                                "Review Palette: Review all questions and confirm selections before final submission."
                            ]
                        },
                        {
                            name: "✍️ Writing Module",
                            color: "border-emerald-200 bg-emerald-50/50",
                            icon: <PenTool className="text-emerald-600" size={20} />,
                            points: [
                                "Prompt & Word Count: Review the prompt constraints (e.g. 150–250 words).",
                                "Live Counter: The interactive word and character counter updates as you type.",
                                "Timer Warnings: Visible warnings appear at 5 minutes and 1 minute remaining.",
                                "Scoring Rubric: Graded on Grammatical Accuracy, Lexical Diversity, Coherence, and Task Fulfillment."
                            ]
                        }
                    ]
                },
                {
                    id: "student-proctoring",
                    icon: <ShieldCheck className="text-emerald-500" size={24} />,
                    title: "5. Examination Integrity & Fullscreen Proctoring",
                    overview: "Rules regarding anti-cheating, fullscreen lockdown, and strike limits.",
                    steps: [
                        {
                            stepNumber: "Rule 1",
                            title: "Fullscreen Lockdown",
                            detail: "Official tests automatically lock your browser into fullscreen mode. You must remain in fullscreen mode until you submit."
                        },
                        {
                            stepNumber: "Rule 2",
                            title: "Tab Switching & Window Blur",
                            detail: "Navigating away from the test tab, switching applications, or clicking outside the window triggers an integrity strike warning."
                        },
                        {
                            stepNumber: "Rule 3",
                            title: "Three-Strike Penalty",
                            detail: "Students receive up to 3 warnings. On the 3rd infraction, the test is automatically submitted with an 'Integrity Violation' flag."
                        },
                        {
                            stepNumber: "Rule 4",
                            title: "Clipboard Restrictions",
                            detail: "Copy-paste actions are disabled in the writing area to ensure original student composition."
                        }
                    ],
                    alert: "Turn off OS notifications and close messaging applications before starting a test to prevent unintended window blur."
                },
                {
                    id: "student-scoring",
                    icon: <Award className="text-purple-500" size={24} />,
                    title: "6. Understanding Your AI Scores & Reports",
                    overview: "How AI scores are calculated, CEFR band levels, and teacher reviews.",
                    steps: [
                        {
                            stepNumber: "Level 1",
                            title: "CEFR Standards",
                            detail: "Results align with the CEFR framework: A1/A2 (Basic), B1/B2 (Independent/Workplace Fluency), C1/C2 (Proficient/Advanced)."
                        },
                        {
                            stepNumber: "Level 2",
                            title: "Speaking Acoustic Analysis",
                            detail: "Measures phoneme accuracy, speech rhythm, syllable fluency, and hesitation frequency."
                        },
                        {
                            stepNumber: "Level 3",
                            title: "Writing NLP Evaluation",
                            detail: "Measures grammar error density, sentence complexity, and vocabulary sophistication."
                        },
                        {
                            stepNumber: "Level 4",
                            title: "Teacher Feedback",
                            detail: "Your teacher reviews AI auto-scores, provides remarks, and can adjust marks where appropriate."
                        }
                    ]
                },
                {
                    id: "student-troubleshooting",
                    icon: <HelpCircle className="text-amber-500" size={24} />,
                    title: "7. Student Troubleshooting & FAQs",
                    overview: "Solutions for common issues faced during assessments.",
                    steps: [
                        {
                            stepNumber: "Issue 1",
                            title: "Microphone Blocked or Silent",
                            detail: "Click the lock icon next to the browser URL > set Microphone to 'Allow' > refresh page. Also check Windows Settings > Privacy > Microphone to ensure access is enabled."
                        },
                        {
                            stepNumber: "Issue 2",
                            title: "Test Locked by Proctor Guard",
                            detail: "If locked due to 3 strikes from accidental notifications, inform your teacher immediately to review proctor logs and unlock the session."
                        },
                        {
                            stepNumber: "Issue 3",
                            title: "Internet Disconnection",
                            detail: "Do not close your browser tab. Answers are buffered locally. Reconnect to Wi-Fi and submit your test."
                        },
                        {
                            stepNumber: "Issue 4",
                            title: "Forgot Password",
                            detail: "Click 'Reset Pass' on the login screen or ask your department faculty to issue a temporary PIN."
                        }
                    ]
                }
            ]
        },
        teacher: {
            roleName: "Staff / Faculty",
            title: "Faculty & Staff Operations Manual",
            badge: "Staff User Guide",
            badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
            accentGradient: "from-emerald-500 to-teal-600",
            summary: "Complete operational instructions for educators: managing cohorts and groups, creating and scheduling LSRW tasks with Question Builder, monitoring student submissions, reviewing AI auto-scoring, and exporting class reports.",
            sections: [
                {
                    id: "teacher-dashboard",
                    icon: <BarChart3 className="text-emerald-500" size={24} />,
                    title: "1. Educator Hub & Real-Time Analytics",
                    overview: "Central command center for monitoring assigned students, pending submissions, and class competency metrics.",
                    steps: [
                        {
                            stepNumber: "Metric 1",
                            title: "Student Enrollment Count",
                            detail: "Displays the total count of students under your instruction across your groups and sections."
                        },
                        {
                            stepNumber: "Metric 2",
                            title: "Assessment Completion Tracker",
                            detail: "Real-time tracker of tests completed, in-progress, and pending grading."
                        },
                        {
                            stepNumber: "Metric 3",
                            title: "Average LSRW Competency Radar",
                            detail: "Aggregated class performance radar showing class strengths and skill gaps."
                        },
                        {
                            stepNumber: "Metric 4",
                            title: "Download Master Report",
                            detail: "Click 'Download Report' in the header to export an executive summary of your students' performance."
                        }
                    ]
                },
                {
                    id: "teacher-groups",
                    icon: <Users className="text-teal-500" size={24} />,
                    title: "2. Student Cohort & Group Management (/teacher/groups)",
                    overview: "Organizing students into batches, classes, and targeted learning cohorts.",
                    steps: [
                        {
                            stepNumber: "Step 1",
                            title: "Creating a New Group",
                            detail: "Click 'Create Group' and specify the Group Name (e.g. 'ECE-3A 2026', 'CSE Communication Lab B'), Department, Year, and Section."
                        },
                        {
                            stepNumber: "Step 2",
                            title: "Enrolling Students",
                            detail: "Use the student search selector to look up students by name or registration number. Select one or multiple students to enroll them instantly."
                        },
                        {
                            stepNumber: "Step 3",
                            title: "Roster Management",
                            detail: "Inspect group rosters, review student emails, and transfer or remove students as needed."
                        },
                        {
                            stepNumber: "Step 4",
                            title: "Cohort-Level Analytics",
                            detail: "Click any group to review group averages, submission completion rates, and identify low/high performing students."
                        }
                    ],
                    tip: "Create dedicated remedial cohorts for students requiring targeted practice in speaking fluency or writing grammar."
                },
                {
                    id: "teacher-tasks",
                    icon: <FileText className="text-emerald-500" size={24} />,
                    title: "3. Creating & Scheduling LSRW Tasks (/teacher/tasks)",
                    overview: "Step-by-step instructions for authoring customized assessments with the visual Question Builder.",
                    steps: [
                        {
                            stepNumber: "Step 1",
                            title: "Task Information",
                            detail: "Specify Task Title, select the LSRW component (Listening, Speaking, Reading, or Writing), and provide clear instructions."
                        },
                        {
                            stepNumber: "Step 2",
                            title: "Time Limit & Scheduling",
                            detail: "Set Duration in minutes (or practice mode). Set Start Date/Time and strict Submission Deadline."
                        },
                        {
                            stepNumber: "Step 3",
                            title: "Target Group Assignment",
                            detail: "Assign the task to specific student groups or make it accessible to your entire enrolled roster."
                        },
                        {
                            stepNumber: "Step 4",
                            title: "Question Builder Authoring",
                            detail: "Listening: Upload audio or provide audio URLs and author MCQs. Speaking: Define topic prompt, prep time, and recording limits. Reading: Paste passage text and comprehension questions. Writing: Set topic prompt, word limits, and scoring rubrics."
                        },
                        {
                            stepNumber: "Step 5",
                            title: "Publish vs Draft",
                            detail: "Save as Draft to edit later, or click 'Publish' to immediately distribute to assigned students' dashboards."
                        }
                    ]
                },
                {
                    id: "teacher-evaluation",
                    icon: <Award className="text-cyan-500" size={24} />,
                    title: "4. Grading, AI Score Review & Feedback (/teacher/performance)",
                    overview: "Reviewing student submissions, listening to audio recordings, and providing faculty remarks.",
                    steps: [
                        {
                            stepNumber: "Step 1",
                            title: "Open Performance Modal",
                            detail: "Navigate to '/teacher/performance' and click 'View Detailed Report' on any submission."
                        },
                        {
                            stepNumber: "Step 2",
                            title: "Review Audio & Transcripts",
                            detail: "For speaking tests, play the recorded audio alongside the AI transcription, phoneme score, and fluency metrics."
                        },
                        {
                            stepNumber: "Step 3",
                            title: "Review Written Essays",
                            detail: "Review essays with automated grammar error highlights and vocabulary richness metrics."
                        },
                        {
                            stepNumber: "Step 4",
                            title: "Teacher Marks & Remarks",
                            detail: "Adjust numerical scores if appropriate and provide qualitative feedback visible on student report cards."
                        },
                        {
                            stepNumber: "Step 5",
                            title: "Export Gradebook",
                            detail: "Export filtered class grades to Excel/CSV for academic records."
                        }
                    ]
                },
                {
                    id: "teacher-troubleshooting",
                    icon: <HelpCircle className="text-amber-500" size={24} />,
                    title: "5. Faculty FAQs & Operational Guidelines",
                    overview: "Solutions for common educator workflows and edge cases.",
                    steps: [
                        {
                            stepNumber: "FAQ 1",
                            title: "Re-opening Expired Assessments",
                            detail: "To grant an extension for an excused student, edit the task deadline or reassign the task to a designated makeup cohort."
                        },
                        {
                            stepNumber: "FAQ 2",
                            title: "Reviewing Proctoring Strikes",
                            detail: "Submissions with proctoring violations display an integrity badge in the evaluation modal detailing the timestamp of fullscreen escapes."
                        },
                        {
                            stepNumber: "FAQ 3",
                            title: "Supported Audio Formats for Listening Tasks",
                            detail: "MP3, WAV, and AAC formats under 25MB are recommended for optimal cross-browser playback."
                        }
                    ]
                }
            ]
        },
        admin: {
            roleName: "Institutional Administrator",
            title: "Institutional Administrator Governance Manual",
            badge: "Admin User Guide",
            badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
            accentGradient: "from-purple-500 to-indigo-600",
            summary: "Comprehensive operational manual for institutional administrators: user roster provisioning, bulk CSV data import, role assignments, system-wide benchmark tasks, and multi-department performance comparisons.",
            sections: [
                {
                    id: "admin-dashboard",
                    icon: <Shield className="text-purple-500" size={24} />,
                    title: "1. Institutional Overview & Platform Control",
                    overview: "Governance and tracking of institution-wide language assessment programs.",
                    steps: [
                        {
                            stepNumber: "KPI 1",
                            title: "Campus-Wide Enrollment",
                            detail: "Monitor total registered students, active faculty accounts, and completed assessments across the institution."
                        },
                        {
                            stepNumber: "KPI 2",
                            title: "Departmental Performance Breakdown",
                            detail: "Compare average CEFR bands across engineering, sciences, arts, and management departments."
                        },
                        {
                            stepNumber: "KPI 3",
                            title: "System Performance Monitoring",
                            detail: "Verify database synchronization, AI speech processing latency, and overall API responsiveness."
                        }
                    ]
                },
                {
                    id: "admin-users",
                    icon: <Users className="text-indigo-500" size={24} />,
                    title: "2. User Management & Role Hierarchy (/admin/users)",
                    overview: "Provisioning student and faculty accounts, managing security policies, and credential administration.",
                    steps: [
                        {
                            stepNumber: "Tier",
                            title: "Role Hierarchy",
                            detail: "SUPER_ADMIN / ADMIN: Complete institution control. DEPT_ADMIN: Department-level management. TEACHER: Group creation, task authoring, and evaluation. STUDENT: Assessment participant."
                        },
                        {
                            stepNumber: "Action 1",
                            title: "Individual Account Creation",
                            detail: "Add individual accounts specifying First Name, Last Name, Email, Role, Department, Year of Study, and Registration Number."
                        },
                        {
                            stepNumber: "Action 2",
                            title: "Password Resets & Account Security",
                            detail: "Trigger password reset links or enable 'forcePasswordReset' to compel users to set a new password on their next login."
                        },
                        {
                            stepNumber: "Action 3",
                            title: "Account Status Lifecycle",
                            detail: "Toggle user status between ACTIVE and INACTIVE for graduated batches without deleting their historical assessment records."
                        }
                    ]
                },
                {
                    id: "admin-bulk-import",
                    icon: <FileSpreadsheet className="text-purple-500" size={24} />,
                    title: "3. Bulk Student & Faculty Import Engine",
                    overview: "Onboarding entire college departments in seconds using Excel or CSV.",
                    steps: [
                        {
                            stepNumber: "Step 1",
                            title: "Download Import Template",
                            detail: "Open User Management > click 'Bulk Import' > download the standard Excel (.xlsx) or CSV template."
                        },
                        {
                            stepNumber: "Step 2",
                            title: "Populate Data Columns",
                            detail: "Include required headers: firstName, lastName, email, role (STUDENT or TEACHER), department, yearOfStudy, and registrationNumber."
                        },
                        {
                            stepNumber: "Step 3",
                            title: "Drag-and-Drop Ingestion",
                            detail: "Drop the prepared spreadsheet into the upload zone for instant parsing."
                        },
                        {
                            stepNumber: "Step 4",
                            title: "Pre-Import Validation",
                            detail: "The engine scans for duplicate emails or invalid roles, highlighting issues before database entry."
                        },
                        {
                            stepNumber: "Step 5",
                            title: "Execute Batch Creation",
                            detail: "Click 'Import Users'. Accounts are created with auto-generated secure PINs and password reset enforced."
                        }
                    ],
                    tip: "Ensure all emails match your institutional domain (e.g. @nec.edu.in) for unified single-sign-on alignment."
                },
                {
                    id: "admin-global-tasks",
                    icon: <FileText className="text-indigo-500" size={24} />,
                    title: "4. Global Institutional Tasks & Benchmarking (/admin/tasks)",
                    overview: "Creating standardized baseline assessments across multiple departments simultaneously.",
                    steps: [
                        {
                            stepNumber: "Step 1",
                            title: "Create Global Tasks",
                            detail: "Ideal for institutional entrance diagnostics, semester midterms, or accreditation language benchmarks."
                        },
                        {
                            stepNumber: "Step 2",
                            title: "Unified Scheduling",
                            detail: "Schedule synchronized testing windows across multiple departments under uniform proctoring rules."
                        },
                        {
                            stepNumber: "Step 3",
                            title: "Accreditation Reports (/comparison)",
                            detail: "Generate longitudinal reports comparing year-over-year language gains suitable for NAAC, NBA, and ABET accreditation compliance."
                        }
                    ]
                },
                {
                    id: "admin-troubleshooting",
                    icon: <HelpCircle className="text-amber-500" size={24} />,
                    title: "5. Administrator FAQs & Maintenance",
                    overview: "Resolving common administrative questions and system maintenance procedures.",
                    steps: [
                        {
                            stepNumber: "FAQ 1",
                            title: "Resolving Bulk Import Duplicate Errors",
                            detail: "If an email already exists in the database, the validator rejects that row to prevent accidental overwrites. Remove or update duplicate rows and re-upload."
                        },
                        {
                            stepNumber: "FAQ 2",
                            title: "Handling Student Credential Lockouts",
                            detail: "Admins can search for any student in User Management, click 'Reset Password', and generate a fresh temporary PIN."
                        },
                        {
                            stepNumber: "FAQ 3",
                            title: "Database Backup & Retention",
                            detail: "All audio files and AI acoustic transcriptions are archived with timestamps for multi-year accreditation auditing."
                        }
                    ]
                }
            ]
        }
    };

    const currentManual = roleManuals[effectiveRole] || roleManuals.student;

    // Filter sections based on search query
    const filteredSections = useMemo(() => {
        if (!searchQuery.trim()) return currentManual.sections;
        const query = searchQuery.toLowerCase();
        return currentManual.sections.filter(sec => {
            const inTitle = sec.title.toLowerCase().includes(query);
            const inOverview = sec.overview.toLowerCase().includes(query);
            const inSteps = sec.steps?.some(s => s.title.toLowerCase().includes(query) || s.detail.toLowerCase().includes(query));
            const inModules = sec.modules?.some(m => m.name.toLowerCase().includes(query) || m.points.some(p => p.toLowerCase().includes(query)));
            return inTitle || inOverview || inSteps || inModules;
        });
    }, [currentManual, searchQuery]);

    const userRole = currentUser?.role || (effectiveRole === 'admin' ? 'ADMIN' : effectiveRole === 'teacher' ? 'TEACHER' : 'STUDENT');

    const dashboardLink = ['ADMIN', 'SUPER_ADMIN', 'DEPT_ADMIN'].includes(userRole)
        ? '/admin/dashboard'
        : userRole === 'TEACHER'
            ? '/teacher/dashboard'
            : '/student/dashboard';

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            {/* Native Sidebar for the authenticated role */}
            <Sidebar role={userRole} />

            <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto min-w-0 max-w-7xl mx-auto w-full">
                {/* Print Style Injections */}
                <style>{`
                    @media print {
                        body { background: white !important; font-size: 12pt; color: black !important; }
                        aside, nav, button, input, .no-print { display: none !important; }
                        main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
                        .shadow-sm, .shadow-md, .shadow-xl { box-shadow: none !important; }
                        .border { border: 1px solid #ddd !important; }
                        .print-break { page-break-before: always; }
                    }
                `}</style>

                {/* Internal User Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 no-print">
                    <div className="flex items-center space-x-3">
                        <Link
                            to={dashboardLink}
                            className="p-2.5 rounded-xl sm:rounded-2xl bg-white border border-gray-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition shadow-sm shrink-0"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 flex items-center gap-1.5">
                                <Sparkles size={12} />
                                Official Operations Guide • {currentManual.roleName}
                            </span>
                            <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">
                                {currentManual.title}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <button
                            onClick={handlePrint}
                            className="flex items-center space-x-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-200 rounded-xl sm:rounded-2xl text-gray-700 font-bold text-xs hover:bg-gray-50 transition shadow-sm"
                        >
                            <Printer size={15} />
                            <span>Print / PDF</span>
                        </button>
                        <button
                            onClick={handleShare}
                            className="p-2 sm:p-2.5 bg-white border border-gray-200 rounded-xl sm:rounded-2xl text-gray-700 font-bold text-xs hover:bg-gray-50 transition shadow-sm"
                            title="Copy manual link"
                        >
                            {copiedLink ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
                        </button>
                    </div>
                </div>

                {/* Hero Banner with Search */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white p-5 sm:p-8 md:p-12 rounded-2xl sm:rounded-[2.5rem] shadow-xl mb-6 sm:mb-10 border border-slate-700/50">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] sm:text-xs font-bold text-sky-300 uppercase tracking-widest mb-3 sm:mb-4">
                            <BookOpen size={14} />
                            {currentManual.badge}
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2 sm:mb-4 leading-tight">
                            {currentManual.title}
                        </h2>
                        <p className="text-gray-300 text-sm sm:text-base font-medium leading-relaxed mb-6 sm:mb-8">
                            {currentManual.summary}
                        </p>

                        {/* Search Input for this role's manual */}
                        <div className="relative no-print">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder={`Search ${currentManual.roleName} manual (e.g. ${effectiveRole === 'student' ? 'microphone, proctoring, speaking, writing' : effectiveRole === 'teacher' ? 'group creation, task authoring, grading' : 'bulk import, user management, global tasks'})...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-12 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-gray-400 font-medium focus:outline-none focus:ring-4 focus:ring-sky-500/30 focus:bg-white/15 transition shadow-inner"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold bg-white/10 px-2 py-1 rounded-lg"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section Controls Bar */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-3">
                        <span className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${currentManual.badgeColor}`}>
                            {currentManual.badge}
                        </span>
                        <span className="text-xs font-bold text-gray-500">
                            {filteredSections.length} Operational Chapters
                        </span>
                    </div>

                    <div className="flex items-center space-x-3 no-print">
                        <button
                            onClick={expandAll}
                            className="text-xs font-bold text-gray-600 hover:text-gray-900 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 transition"
                        >
                            Expand All
                        </button>
                        <button
                            onClick={collapseAll}
                            className="text-xs font-bold text-gray-600 hover:text-gray-900 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 transition"
                        >
                            Collapse All
                        </button>
                    </div>
                </div>

                {/* Search Feedback */}
                {searchQuery && (
                    <div className="mb-6 p-4 rounded-2xl bg-sky-50 border border-sky-100 text-sky-800 text-sm font-bold flex items-center justify-between">
                        <span>Showing {filteredSections.length} topics matching "{searchQuery}"</span>
                        <button onClick={() => setSearchQuery('')} className="text-xs font-black uppercase hover:underline">
                            Reset Search
                        </button>
                    </div>
                )}

                {/* Main Content Accordions */}
                <div className="space-y-6">
                    {filteredSections.map((section) => {
                        const isExpanded = expandedSections[section.id] ?? true;

                        return (
                            <motion.div
                                key={section.id}
                                layout
                                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div
                                    onClick={() => toggleSection(section.id)}
                                    className="p-6 sm:p-8 cursor-pointer select-none flex items-start justify-between gap-4 bg-white hover:bg-gray-50/50 transition-colors"
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex-shrink-0">
                                            {section.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-1">
                                                {section.title}
                                            </h3>
                                            <p className="text-gray-500 font-medium text-sm leading-relaxed">
                                                {section.overview}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-2 text-gray-400 hover:text-gray-600 transition no-print">
                                        {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                                    </div>
                                </div>

                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="px-6 pb-8 sm:px-8 border-t border-gray-50 pt-6"
                                        >
                                            {/* Sub-steps */}
                                            {section.steps && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                    {section.steps.map((st, sIdx) => (
                                                        <div
                                                            key={sIdx}
                                                            className="p-5 rounded-2xl bg-gray-50/80 border border-gray-100 hover:bg-white hover:border-gray-200 transition"
                                                        >
                                                            <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-primary-600 mb-2">
                                                                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-black text-xs">
                                                                    {sIdx + 1}
                                                                </span>
                                                                <span>{st.stepNumber}</span>
                                                            </div>
                                                            <h4 className="text-base font-bold text-gray-900 mb-2">
                                                                {st.title}
                                                            </h4>
                                                            <p className="text-sm font-medium text-gray-600 leading-relaxed">
                                                                {st.detail}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* LSRW Module Cards */}
                                            {section.modules && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                    {section.modules.map((mod, mIdx) => (
                                                        <div
                                                            key={mIdx}
                                                            className={`p-6 rounded-2xl border ${mod.color} transition-all`}
                                                        >
                                                            <div className="flex items-center space-x-3 mb-4">
                                                                <div className="p-2.5 rounded-xl bg-white shadow-sm">
                                                                    {mod.icon}
                                                                </div>
                                                                <h4 className="text-lg font-black text-gray-900">
                                                                    {mod.name}
                                                                </h4>
                                                            </div>
                                                            <ul className="space-y-2.5">
                                                                {mod.points.map((pt, pIdx) => (
                                                                    <li key={pIdx} className="flex items-start space-x-2.5 text-sm font-medium text-gray-700">
                                                                        <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                                                        <span>{pt}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Tip Box */}
                                            {section.tip && (
                                                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-start space-x-3 text-indigo-900 text-sm font-medium mt-4">
                                                    <Lightbulb size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <span className="font-black text-indigo-700 uppercase tracking-widest text-xs mr-2">Pro Tip:</span>
                                                        <span>{section.tip}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Alert Box */}
                                            {section.alert && (
                                                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-100 flex items-start space-x-3 text-rose-900 text-sm font-medium mt-4">
                                                    <AlertTriangle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <span className="font-black text-rose-700 uppercase tracking-widest text-xs mr-2">Integrity Requirement:</span>
                                                        <span>{section.alert}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer Quick Return */}
                <div className="mt-12 p-8 rounded-3xl bg-white border border-gray-100 shadow-sm text-center flex flex-col items-center max-w-2xl mx-auto no-print">
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
                        <HelpCircle size={24} />
                    </div>
                    <h4 className="text-xl font-black text-gray-900 mb-2">Need Additional Support?</h4>
                    <p className="text-gray-500 font-medium text-sm mb-6 leading-relaxed">
                        If you encounter technical issues or have inquiries regarding your {currentManual.roleName.toLowerCase()} portal privileges, please contact your department administrator or IT helpdesk.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link
                            to={dashboardLink}
                            className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-black text-sm hover:bg-black transition shadow-md shadow-gray-900/10"
                        >
                            Return to Dashboard
                        </Link>
                        <button
                            onClick={handlePrint}
                            className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-700 font-black text-sm hover:bg-gray-200 transition"
                        >
                            Save {currentManual.roleName} PDF Manual
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserGuide;
