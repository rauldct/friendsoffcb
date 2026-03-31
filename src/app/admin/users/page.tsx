"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";

interface AdminUser {
  id: string;
  username: string;
  name: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [changingPwFor, setChangingPwFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCreating(true);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, name }),
    });

    const data = await res.json();

    if (res.ok) {
      setSuccess(`User '${data.user.username}' created`);
      setUsername("");
      setPassword("");
      setName("");
      fetchUsers();
    } else {
      setError(data.error);
    }

    setCreating(false);
  };

  const handleChangePassword = async (id: string, uname: string) => {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password: newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess(`Password changed for '${uname}'`);
      setChangingPwFor(null);
      setNewPassword("");
    } else {
      setError(data.error);
    }
  };

  const handleDelete = async (id: string, uname: string) => {
    if (!confirm(`Delete user '${uname}'?`)) return;

    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();

    if (res.ok) {
      setSuccess(`User '${uname}' deleted`);
      setError("");
      fetchUsers();
    } else {
      setError(data.error);
      setSuccess("");
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "username") return a.username.localeCompare(b.username) * dir;
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "") * dir;
      if (sortBy === "createdAt") return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      return 0;
    });
  }, [users, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">
        Admin Users
      </h1>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg">
          {success}
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("username")}>
                <div className="flex items-center gap-1">
                  Username
                  {sortBy === "username" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                </div>
              </th>
              <th className="px-4 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("name")}>
                <div className="flex items-center gap-1">
                  Name
                  {sortBy === "name" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                </div>
              </th>
              <th className="px-4 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("createdAt")}>
                <div className="flex items-center gap-1">
                  Created
                  {sortBy === "createdAt" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                </div>
              </th>
              <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No users</td>
              </tr>
            ) : (
              sortedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#1A1A2E]">{u.username}</td>
                  <td className="px-4 py-3 text-gray-600">{u.name || "-"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {changingPwFor === u.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            minLength={6}
                            className="px-2 py-1 border border-gray-200 rounded text-xs w-32"
                            autoFocus
                          />
                          <button
                            onClick={() => handleChangePassword(u.id, u.username)}
                            className="text-xs text-white bg-[#004D98] px-2 py-1 rounded hover:bg-[#003d7a]"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setChangingPwFor(null); setNewPassword(""); }}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setChangingPwFor(u.id); setNewPassword(""); setError(""); setSuccess(""); }}
                          className="text-xs text-[#004D98] hover:text-[#003d7a]"
                        >
                          Change Password
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(u.id, u.username)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
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

      {/* Add user form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-heading font-bold text-[#1A1A2E] mb-4">Add User</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-40"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-40"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-40"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-[#004D98] text-white rounded-lg text-sm font-medium hover:bg-[#003d7a] disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating..." : "Add User"}
          </button>
        </form>
      </div>
    </div>
  );
}
