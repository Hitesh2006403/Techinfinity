import { useState, useEffect } from "react";
import { evaluationService } from "../../services/evaluationService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import {
  Award,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  BookOpen
} from "lucide-react";

export function ClassAnalytics() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await evaluationService.getClassAnalytics();
      setAnalytics(data);
    }
    load();
  }, []);

  if (!analytics) return null;

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-outline-variant/60 pb-4">
        <h1 className="font-headline text-2xl sm:text-3xl font-medium text-primary dark:text-inverse-primary tracking-tight">
          Class Performance & Evaluation Analytics
        </h1>
        <p className="text-xs text-outline mt-1">
          Detailed grade spread, criteria competency trends, and curriculum alignment metrics for BEE-104.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-5 shadow-folio">
          <div className="text-[10px] font-mono uppercase tracking-wider text-outline mb-1">
            Class Mean Score
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-primary dark:text-inverse-primary">
              {analytics.classAverage}
            </span>
            <span className="text-xs text-outline font-mono">/ 10.0</span>
          </div>
          <span className="inline-block mt-2 text-xs font-semibold text-academic-green">
            +0.4 over previous midterm
          </span>
        </div>

        <div className="bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-5 shadow-folio">
          <div className="text-[10px] font-mono uppercase tracking-wider text-outline mb-1">
            Graded Papers
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-primary dark:text-inverse-primary">
              {analytics.gradedCount}
            </span>
            <span className="text-xs text-outline font-mono">/ {analytics.totalEnrolled}</span>
          </div>
          <span className="inline-block mt-2 text-xs text-outline font-mono">
            94% evaluation progress
          </span>
        </div>

        <div className="bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-5 shadow-folio">
          <div className="text-[10px] font-mono uppercase tracking-wider text-outline mb-1">
            Proficient (≥ 7.0)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-academic-green">
              70%
            </span>
            <span className="text-xs text-outline font-mono">of cohort</span>
          </div>
          <span className="inline-block mt-2 text-xs text-academic-green">
            Department target achieved
          </span>
        </div>

        <div className="bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-5 shadow-folio">
          <div className="text-[10px] font-mono uppercase tracking-wider text-outline mb-1">
            Common Inaccuracy
          </div>
          <div className="text-sm font-semibold text-error truncate">
            Turns Ratio Inversion
          </div>
          <span className="inline-block mt-2 text-xs text-outline">
            Observed in 28% of papers
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Band Distribution */}
        <div className="lg:col-span-7 bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-6 shadow-folio">
          <div className="flex items-center justify-between pb-4 border-b border-outline-variant/60 mb-4">
            <div>
              <h3 className="font-headline text-lg font-medium text-primary dark:text-inverse-primary">
                Overall Mark Distribution
              </h3>
              <p className="text-xs text-outline">Cohort breakdown across mark intervals</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#f2d45c] text-[#1e2433] font-mono text-xs font-bold">
              Target Mean: 7.2
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="band" tick={{ fontSize: 11, fill: "#76777e" }} />
                <YAxis tick={{ fontSize: 11, fill: "#76777e" }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="p-2.5 bg-white dark:bg-primary border border-outline-variant rounded-xl text-xs shadow-md">
                          <p className="font-semibold text-primary dark:text-inverse-primary">{d.band}</p>
                          <p className="text-outline">{d.label}: {d.count} candidates ({d.percentage}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {analytics.distribution.map((entry, idx) => (
                    <Cell key={`c-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Criteria Competency Breakdown */}
        <div className="lg:col-span-5 bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl p-6 shadow-folio flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-outline-variant/60 mb-4">
              <h3 className="font-headline text-lg font-medium text-primary dark:text-inverse-primary">
                Competency by Rubric Criterion
              </h3>
              <p className="text-xs text-outline">Mean marks scored per evaluated topic</p>
            </div>

            <div className="space-y-4">
              {analytics.criteriaAverages.map((c, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-semibold text-on-surface dark:text-inverse-primary">
                      {c.criterion}
                    </span>
                    <span className="font-mono text-outline">
                      {c.avgScore} / {c.max} marks
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        c.avgScore / c.max >= 0.8
                          ? "bg-academic-green"
                          : c.avgScore / c.max >= 0.6
                          ? "bg-academic-amber"
                          : "bg-academic-red"
                      }`}
                      style={{ width: `${(c.avgScore / c.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-3.5 bg-surface-container-low dark:bg-primary rounded-xl border border-outline-variant text-xs text-outline space-y-1">
            <div className="flex items-center gap-1.5 text-primary dark:text-inverse-primary font-semibold">
              <BookOpen className="w-4 h-4 text-secondary-fixed" />
              <span>Instructional Takeaway:</span>
            </div>
            <p>
              Mathematical derivations for secondary coils show highest error rates. Recommend scheduling a 20-minute recap lecture prior to the final exam.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
