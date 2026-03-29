import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

const AdminUsers = () => {
  const { users = [], loadUsers, setUserBanned, statusMessage, loadingUsers } =
    useOutletContext();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [banned, setBanned] = useState("all");
  const [subscribed, setSubscribed] = useState("all");

  useEffect(() => {
    const params = {
      q: search || undefined,
      role: role === "all" ? undefined : role,
      banned: banned === "all" ? undefined : banned,
      subscribed: subscribed === "all" ? undefined : subscribed,
      limit: 100,
    };

    const id = setTimeout(() => loadUsers?.(params), 200);
    return () => clearTimeout(id);
  }, [search, role, banned, subscribed, loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="admin-page card glass-card">
      <div className="admin-page-head">
        <div className="title">
          <h3>Users</h3>
          <span className="badge">Manage</span>
        </div>

        <div className="admin-toolbar">
          <div className="admin-field">
            <label className="admin-label">Search</label>
            <input
              className="admin-input"
              type="search"
              placeholder="Name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="admin-field">
            <label className="admin-label">Role</label>
            <select
              className="admin-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="all">All</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          <div className="admin-field">
            <label className="admin-label">Banned</label>
            <select
              className="admin-select"
              value={banned}
              onChange={(e) => setBanned(e.target.value)}
            >
              <option value="all">All</option>
              <option value="false">Active</option>
              <option value="true">Banned</option>
            </select>
          </div>

          <div className="admin-field">
            <label className="admin-label">Subscription</label>
            <select
              className="admin-select"
              value={subscribed}
              onChange={(e) => setSubscribed(e.target.value)}
            >
              <option value="all">All</option>
              <option value="true">Subscribed</option>
              <option value="false">Free</option>
            </select>
          </div>
        </div>
      </div>

      <div className="admin-subline">
        <span className="label">
          Showing <span className="functional-number">{filteredUsers.length}</span>
          {loadingUsers ? " (loading)" : ""}
        </span>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty">
          {loadingUsers ? "Loading users..." : "No users found."}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Subscription</th>
                <th style={{ width: 220, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id}>
                  <td data-label="User">
                    <div className="admin-user">
                      <div className="admin-avatar">
                        {(u.name || "?").slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="admin-user-name">
                          {u.name || "Unknown"}
                        </div>
                        <div className="admin-user-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Role">
                    <span className="badge subtle">{u.role}</span>
                  </td>
                  <td data-label="Status">
                    <span
                      className={`badge ${u.banned ? "error-badge" : "badge-soft"}`}
                    >
                      {u.banned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td data-label="Subscription">
                    <span className="badge">{u.isSubscribed ? "Subscribed" : "Free"}</span>
                  </td>
                  <td data-label="Actions" className="admin-table-actions" style={{ textAlign: "right" }}>
                    <div className="admin-actions">
                      <button
                        className="btn secondary"
                        onClick={() => setUserBanned?.(u._id, !u.banned)}
                      >
                        {u.banned ? "Unban" : "Ban"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {statusMessage && (
        <div className="badge" style={{ marginTop: 10 }}>
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
