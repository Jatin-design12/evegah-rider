import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { createAuthUser, deleteAuthUser, listAuthUsers, updateAuthUser } from "../../utils/adminUsers";
import { Edit, RefreshCw, Search, Trash2, UserPlus } from "lucide-react";

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border">
        <div className="flex items-center justify-between gap-4 border-b p-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className="text-gray-600 hover:text-gray-900" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "employee",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    email: "",
    displayName: "",
    role: "employee",
    disabled: false,
    password: "",
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await listAuthUsers();
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (e) {
      setError(String(e?.message || e || "Unable to load users"));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    load();
    const interval = setInterval(() => {
      if (!mounted) return;
      load();
    }, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filtered = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const email = String(u.email || "").toLowerCase();
      const name = String(u.displayName || "").toLowerCase();
      return email.includes(q) || name.includes(q) || String(u.uid || "").includes(q);
    });
  }, [users, search]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filtered.length / pageSize));
  }, [filtered.length]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError("");

    const email = String(createForm.email || "").trim();
    const password = String(createForm.password || "");
    const role = createForm.role || "employee";

    if (!email || !password) {
      setCreateError("Email and password are required.");
      return;
    }

    setCreating(true);
    try {
      await createAuthUser({
        email,
        password,
        displayName: String(createForm.displayName || "").trim() || null,
        role,
      });

      setCreateForm({ email: "", password: "", displayName: "", role: "employee" });
      await load();
    } catch (e2) {
      setCreateError(String(e2?.message || e2 || "Unable to create user"));
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({
      email: u.email || "",
      displayName: u.displayName || "",
      role: u.role || "employee",
      disabled: Boolean(u.disabled),
      password: "",
    });
    setEditError("");
    setEditOpen(true);
  };

  const openDelete = (u) => {
    setDeleteUserTarget(u);
    setDeleteError("");
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteUserTarget?.uid) return;
    setDeleteError("");
    setDeleting(true);
    try {
      await deleteAuthUser(deleteUserTarget.uid);
      setDeleteOpen(false);
      setDeleteUserTarget(null);
      await load();
    } catch (e) {
      setDeleteError(String(e?.message || e || "Unable to delete user"));
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editUser?.uid) return;
    setEditError("");

    setEditSaving(true);
    try {
      await updateAuthUser(editUser.uid, {
        email: String(editForm.email || "").trim() || undefined,
        displayName: String(editForm.displayName || "").trim() || undefined,
        role: editForm.role || undefined,
        disabled: Boolean(editForm.disabled),
        password: editForm.password ? String(editForm.password) : undefined,
      });
      setEditOpen(false);
      setEditUser(null);
      await load();
    } catch (e) {
      setEditError(String(e?.message || e || "Unable to update user"));
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-white relative overflow-hidden">
      <div className="flex relative z-10 w-full">
        <AdminSidebar />
        <main className="flex-1 w-full min-w-0 p-8 pb-0 overflow-x-hidden overflow-y-auto sm:ml-[var(--admin-sidebar-width,16rem)] space-y-6">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Employee</h1>
              <p className="text-slate-600 mt-2 text-base font-normal">Create and manage admin/employee accounts</p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-evegah-primary to-brand-medium text-white text-sm font-semibold shadow-lg hover:opacity-95 disabled:opacity-60"
              onClick={load}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw size={16} />
              <span className="hidden sm:inline">{loading ? "Refreshing…" : "Refresh"}</span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          ) : null}

          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900">Create User</h2>
              <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-600">
                <UserPlus size={16} />
                New account
              </div>
            </div>

            <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Email *</label>
                <input
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white/80 focus:outline-none focus:ring-2 focus:ring-evegah-primary/20"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Password *</label>
                <input
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white/80 focus:outline-none focus:ring-2 focus:ring-evegah-primary/20"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Display Name</label>
                <input
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white/80 focus:outline-none focus:ring-2 focus:ring-evegah-primary/20"
                  value={createForm.displayName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, displayName: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white/80 focus:outline-none focus:ring-2 focus:ring-evegah-primary/20"
                  value={createForm.role}
                  onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="md:col-span-4 flex items-center justify-end gap-3">
                {createError ? <p className="text-sm text-red-600">{createError}</p> : null}
                <button
                  type="submit"
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg hover:opacity-95 disabled:opacity-60"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-xl border border-evegah-border rounded-2xl shadow-card p-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 w-full md:w-96 focus-within:ring-2 focus-within:ring-evegah-primary/20">
                <Search size={18} className="text-slate-600" />
                <input
                  className="bg-transparent outline-none ml-3 w-full text-base font-normal placeholder-slate-400"
                  placeholder="Search email, name, uid…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="ml-auto text-sm font-semibold text-slate-600">
                {filtered.length} users
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 overflow-hidden relative z-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-medium">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-slate-500">
                          Loading users…
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-slate-500">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      pageRows.map((u) => (
                        <tr key={u.uid} className="border-t hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-slate-800">{u.email || "-"}</td>
                          <td className="p-4 text-slate-700">{u.displayName || "-"}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${String(u.role || "employee").toLowerCase() === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-sky-100 text-sky-700"}`}>
                              {u.role || "employee"}
                            </span>
                          </td>
                          <td className="p-4">
                            {u.disabled ? (
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-rose-100 text-rose-700">Disabled</span>
                            ) : (
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">Active</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-sm hover:opacity-95"
                                onClick={() => openEdit(u)}
                                title="Edit"
                              >
                                <Edit size={16} />
                                Edit
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold shadow-sm hover:opacity-95"
                                onClick={() => openDelete(u)}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600 font-medium">Page {page} / {totalPages}</div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  title="Previous"
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  title="Next"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <Modal
            open={editOpen}
            title={editUser ? `Edit User: ${editUser.email || editUser.uid}` : "Edit User"}
            onClose={() => setEditOpen(false)}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-evegah-primary/20"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Display Name</label>
                <input
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-evegah-primary/20"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm((p) => ({ ...p, displayName: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-evegah-primary/20"
                  value={editForm.role}
                  onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.disabled)}
                    onChange={(e) => setEditForm((p) => ({ ...p, disabled: e.target.checked }))}
                  />
                  <span className="text-sm text-gray-700">Disable user</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Set New Password (optional)</label>
                <input
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-evegah-primary/20"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                />
                <p className="mt-1 text-xs text-gray-500">Leave blank to keep unchanged.</p>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3">
                {editError ? <p className="text-sm text-red-600 mr-auto">{editError}</p> : null}
                <button type="button" className="px-4 py-2 rounded-xl border" onClick={() => setEditOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg hover:opacity-95 disabled:opacity-60"
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                >
                  {editSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </Modal>

          <Modal
            open={deleteOpen}
            title={deleteUserTarget ? `Delete User: ${deleteUserTarget.email || deleteUserTarget.uid}` : "Delete User"}
            onClose={() => {
              if (deleting) return;
              setDeleteOpen(false);
            }}
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                This will permanently delete the user from Firebase Authentication.
              </p>

              {deleteError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {deleteError}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border"
                  onClick={() => setDeleteOpen(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold shadow-lg hover:opacity-95 disabled:opacity-60"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  );
}
