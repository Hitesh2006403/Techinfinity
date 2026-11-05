import { Link } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import {
  Users,
  BookOpen,
  FileCheck2,
  Server,
  UserPlus,
  ShieldAlert,
  ArrowRight
} from "lucide-react";

export function AdminDashboard() {
  const { showToast } = useToast();

  const metrics = [
    { label: "Active Faculty", value: "14", sub: "3 departments", icon: Users },
    { label: "Enrolled Students", value: "340", sub: "Across 4 cohorts", icon: BookOpen },
    { label: "Archived Folios", value: "1,280", sub: "Cryptographically verified", icon: FileCheck2 },
    { label: "System Health", value: "99.98%", sub: "Zero API latency spikes", icon: Server },
  ];

  const recentLogs = [
    { event: "Grade certification published for BEE-104 (Aarav Sharma)", time: "10 mins ago", type: "success" },
    { event: "OCR optical engine batch transcribed 68 scripts", time: "1 hour ago", type: "info" },
    { event: "New course syllabus registered: PHY-302 Electromagnetism", time: "3 hours ago", type: "info" },
    { event: "Faculty profile created for Prof. J. Harrington", time: "Yesterday", type: "neutral" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/60">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-medium text-primary dark:text-inverse-primary tracking-tight">
            Institutional Administration
          </h1>
          <p className="text-xs text-outline mt-1">
            Global institution overview, governance compliance, and identity roster management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/users"
            className="px-4 py-2 bg-primary dark:bg-primary-fixed text-white dark:text-primary rounded-xl text-xs font-semibold hover:bg-primary-hover transition-colors shadow-xs flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div
              key={i}
              className="bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-5 shadow-folio space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-outline font-semibold">
                  {m.label}
                </span>
                <Icon className="w-4 h-4 text-outline" />
              </div>
              <div className="font-mono text-3xl font-bold text-primary dark:text-inverse-primary">
                {m.value}
              </div>
              <p className="text-xs text-outline">{m.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Activity & Compliance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Audit Logs */}
        <div className="lg:col-span-8 bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-6 shadow-folio">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60 mb-4">
            <h3 className="font-headline text-lg font-medium text-primary dark:text-inverse-primary">
              Audit & Governance Trail
            </h3>
            <span className="text-xs font-mono text-outline">FERPA & Oxford Standards Active</span>
          </div>

          <div className="divide-y divide-outline-variant/60">
            {recentLogs.map((log, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-academic-green" />
                  <span className="text-on-surface dark:text-inverse-primary font-medium">
                    {log.event}
                  </span>
                </div>
                <span className="font-mono text-outline text-[11px] shrink-0 ml-4">
                  {log.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Cryptographic Certification */}
        <div className="lg:col-span-4 bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-6 shadow-folio space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/60">
            <ShieldAlert className="w-4 h-4 text-secondary dark:text-secondary-fixed" />
            <h3 className="font-headline text-lg font-medium text-primary dark:text-inverse-primary">
              Compliance Status
            </h3>
          </div>

          <div className="p-3 bg-surface-container-low dark:bg-primary rounded-xl border border-outline-variant text-xs space-y-2">
            <div className="font-semibold text-primary dark:text-inverse-primary">
              Cryptographic Ledger Integrity
            </div>
            <p className="text-outline leading-relaxed">
              All instructor score overrides preserve original AI suggestions with immutable SHA-256 digital stamps.
            </p>
          </div>

          <button
            onClick={() => showToast("Exporting compliance inspection bundle...", "success")}
            className="w-full py-2 border border-outline-variant rounded-xl text-xs font-semibold text-primary dark:text-inverse-primary hover:bg-surface-container transition-colors"
          >
            Export Full Audit Log (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}
