import { useState } from "react";
import { MOCK_SYSTEM_USERS } from "../../utils/mockData";
import { useToast } from "../../context/ToastContext";
import {
  Users,
  Search,
  Filter,
  UserPlus,
  MoreVertical,
  CheckCircle2,
  Shield,
  GraduationCap,
  Briefcase
} from "lucide-react";

export function UserManagement() {
  const [users, setUsers] = useState(MOCK_SYSTEM_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { showToast } = useToast();

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleToggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" } : u
      )
    );
    showToast("User account status updated.", "info");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/60">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-medium text-primary dark:text-inverse-primary tracking-tight">
            User Directory & Access Control
          </h1>
          <p className="text-xs text-outline mt-1">
            Manage academic credentials, student permissions, and administrative privileges.
          </p>
        </div>
        <button
          onClick={() => showToast("User invitation wizard opened.", "info")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary dark:bg-primary-fixed text-white dark:text-primary rounded-xl text-xs font-semibold shadow-xs hover:bg-primary-hover transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite New User</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-xl text-xs text-on-surface dark:text-inverse-primary focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-surface-container-low dark:bg-primary-container rounded-xl border border-outline-variant text-xs">
          {["all", "teacher", "student", "admin"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-lg capitalize font-semibold transition-all ${
                roleFilter === r
                  ? "bg-primary text-white shadow-xs"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-2xl overflow-hidden shadow-folio">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container dark:bg-primary border-b border-outline-variant uppercase font-mono tracking-wider text-outline text-[11px]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-surface-container-low/50 dark:hover:bg-primary/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high dark:bg-primary flex items-center justify-center font-bold text-xs text-primary dark:text-inverse-primary border border-outline-variant/60">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-primary dark:text-inverse-primary">
                          {u.name}
                        </div>
                        <div className="text-outline text-[11px]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${
                        u.role === "admin"
                          ? "bg-primary text-white"
                          : u.role === "teacher"
                          ? "bg-secondary-fixed text-tertiary"
                          : "bg-surface-container text-outline"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-on-surface dark:text-inverse-primary font-medium">
                    {u.department}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(u.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase transition-colors ${
                        u.status === "Active"
                          ? "bg-academic-green/10 text-academic-green border border-academic-green/30"
                          : "bg-error/10 text-error border border-error/30"
                      }`}
                    >
                      {u.status}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-outline font-mono">{u.lastLogin}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => showToast(`Editing permissions for ${u.name}...`, "info")}
                      className="px-2.5 py-1 border border-outline-variant rounded-lg text-xs font-semibold text-primary dark:text-inverse-primary hover:bg-surface-container transition-colors shadow-xs"
                    >
                      Configure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
