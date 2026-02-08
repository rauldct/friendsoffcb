"use client";

import { useState, useEffect, FormEvent } from "react";

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
              <th className="px-4 py-3 font-medium text-gray-500">Username</th>
              <th className="px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 font-medium text-gray-500">Created</th>
              <th className="px-4 py-3 font-medium text-gray-500 w-20">Action</th>
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
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#1A1A2E]">{u.username}</td>
                  <td className="px-4 py-3 text-gray-600">{u.name || "-"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(u.id, u.username)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
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
