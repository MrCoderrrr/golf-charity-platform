import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../api/client";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState("12m");

  const load = useCallback(async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/analytics/overview", { params });
      setOverview(data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load analytics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!overview?.range?.from || !overview?.range?.to) return;
    const f = new Date(overview.range.from);
    const t = new Date(overview.range.to);
    if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime())) return;
    const yyyyMmDd = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setFrom(yyyyMmDd(f));
    setTo(yyyyMmDd(t));
  }, [overview?.range?.from, overview?.range?.to]);

  const money = useMemo(() => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });
    } catch {
      return { format: (n) => `$${n}` };
    }
  }, []);

  const kpis = overview?.kpis?.range || {
    income: 0,
    donated: 0,
    won: 0,
    paidOut: 0,
  };

  const net = (Number(kpis.income) || 0) - (Number(kpis.donated) || 0);

  const ops = overview?.ops || {
    activeSubscriptions: 0,
    totalUsers: 0,
    subscribedUsers: 0,
    pendingWinnerVerifications: 0,
  };

  const trend = Array.isArray(overview?.trendMonthly)
    ? overview.trendMonthly
    : [];

  const planType = overview?.breakdowns?.planType || { monthly: 0, yearly: 0 };
  const planTypeData = [
    { name: "Monthly", value: Number(planType.monthly) || 0 },
    { name: "Yearly", value: Number(planType.yearly) || 0 },
  ];

  const winnersByMatch = overview?.breakdowns?.winnersByMatchCount || {
    3: 0,
    4: 0,
    5: 0,
  };
  const winnersByMatchData = [
    { name: "3 matches", winners: Number(winnersByMatch["3"] || winnersByMatch[3] || 0) },
    { name: "4 matches", winners: Number(winnersByMatch["4"] || winnersByMatch[4] || 0) },
    { name: "5 matches", winners: Number(winnersByMatch["5"] || winnersByMatch[5] || 0) },
  ];

  const rangeLabel = useMemo(() => {
    const from = overview?.range?.from ? new Date(overview.range.from) : null;
    const to = overview?.range?.to ? new Date(overview.range.to) : null;
    if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return "Last 12 months";
    }
    return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
  }, [overview?.range?.from, overview?.range?.to]);

  const colors = {
    gold: "#d4af37",
    teal: "#14b8a6",
    ink: "rgba(255,255,255,0.8)",
    grid: "rgba(255,255,255,0.08)",
  };

  return (
    <div className="admin-page card glass-card">
      <div className="admin-page-head">
        <div className="title">
        <h3>Admin analytics</h3>
        <div style={{ marginTop: 6, color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
          {rangeLabel}
        </div>
        </div>

        <div className="admin-toolbar admin-toolbar--tight">
          <div className="admin-field">
            <label className="admin-label">Range</label>
            <div className="admin-pill-row">
              <button
                type="button"
                className={`filter-pill ${mode === "12m" ? "active" : ""}`}
                onClick={() => {
                  setMode("12m");
                  load({});
                }}
              >
                12 months
              </button>
              <button
                type="button"
                className={`filter-pill ${mode === "90d" ? "active" : ""}`}
                onClick={() => {
                  setMode("90d");
                  const now = new Date();
                  const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                  load({ from: start.toISOString(), to: now.toISOString() });
                }}
              >
                90 days
              </button>
              <button
                type="button"
                className={`filter-pill ${mode === "30d" ? "active" : ""}`}
                onClick={() => {
                  setMode("30d");
                  const now = new Date();
                  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                  load({ from: start.toISOString(), to: now.toISOString() });
                }}
              >
                30 days
              </button>
            </div>
          </div>

          <div className="admin-field">
            <label className="admin-label">From</label>
            <input
              className="admin-input"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="admin-field">
            <label className="admin-label">To</label>
            <input
              className="admin-input"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="admin-field">
            <label className="admin-label">&nbsp;</label>
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setMode("custom");
                if (!from || !to) return;
                load({ from: new Date(from).toISOString(), to: new Date(to).toISOString() });
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-mini-cards" style={{ marginTop: 12 }}>
        <div className="mini-card">
          <span className="label">Income</span>
          <span className="functional-number">
            {loading ? "—" : money.format(kpis.income || 0)}
          </span>
        </div>
        <div className="mini-card">
          <span className="label">Donated</span>
          <span className="functional-number">
            {loading ? "—" : money.format(kpis.donated || 0)}
          </span>
        </div>
        <div className="mini-card">
          <span className="label">Players won</span>
          <span className="functional-number">
            {loading ? "—" : money.format(kpis.won || 0)}
          </span>
        </div>
        <div className="mini-card">
          <span className="label">Paid out</span>
          <span className="functional-number">
            {loading ? "—" : money.format(kpis.paidOut || 0)}
          </span>
        </div>
        <div className="mini-card">
          <span className="label">Net (income - donated)</span>
          <span className="functional-number">
            {loading ? "—" : money.format(net || 0)}
          </span>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginTop: 12, padding: 14 }}>
          <div style={{ color: "rgba(255,255,255,0.8)" }}>
            {error}
          </div>
          <div style={{ marginTop: 10 }}>
            <button className="btn" onClick={load}>
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="admin-analytics-grid" style={{ marginTop: 12 }}>
        <div className="admin-analytics-panel">
          <div className="label" style={{ marginBottom: 10 }}>
            Monthly trend
          </div>
          <div className="admin-chart-wrap">
            {loading ? (
              <div style={{ color: "rgba(255,255,255,0.65)" }}>Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 12, bottom: 0, left: 6 }}>
                  <CartesianGrid stroke={colors.grid} strokeDasharray="3 6" />
                  <XAxis dataKey="month" stroke={colors.ink} tick={{ fontSize: 12 }} />
                  <YAxis stroke={colors.ink} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "subscriptions" || name === "winners"
                        ? value
                        : money.format(value || 0),
                      name,
                    ]}
                    contentStyle={{
                      background: "rgba(10,12,18,0.92)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 12,
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke={colors.gold}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="donated"
                    name="Donated"
                    stroke={colors.teal}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="won"
                    name="Won"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="paidOut"
                    name="Paid out"
                    stroke="rgba(212,175,55,0.55)"
                    strokeDasharray="6 6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="admin-analytics-panel">
          <div className="label" style={{ marginBottom: 10 }}>
            Plan type (income)
          </div>
          <div className="admin-chart-wrap admin-chart-wrap--short">
            {loading ? (
              <div style={{ color: "rgba(255,255,255,0.65)" }}>Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(value) => money.format(value || 0)}
                    contentStyle={{
                      background: "rgba(10,12,18,0.92)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 12,
                    }}
                  />
                  <Pie
                    data={planTypeData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={4}
                  >
                    <Cell fill={colors.gold} />
                    <Cell fill={colors.teal} />
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="admin-analytics-panel">
          <div className="label" style={{ marginBottom: 10 }}>
            Winners by match count
          </div>
          <div className="admin-chart-wrap admin-chart-wrap--short">
            {loading ? (
              <div style={{ color: "rgba(255,255,255,0.65)" }}>Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={winnersByMatchData} margin={{ top: 8, right: 12, left: 6, bottom: 0 }}>
                  <CartesianGrid stroke={colors.grid} strokeDasharray="3 6" />
                  <XAxis dataKey="name" stroke={colors.ink} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} stroke={colors.ink} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => value}
                    contentStyle={{
                      background: "rgba(10,12,18,0.92)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="winners" fill={colors.gold} radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="admin-analytics-panel">
          <div className="label" style={{ marginBottom: 10 }}>
            Operations
          </div>
          {loading ? (
            <div style={{ color: "rgba(255,255,255,0.65)" }}>Loading…</div>
          ) : (
            <div className="admin-ops-grid">
              <div className="mini-card">
                <span className="label">Active subs</span>
                <span className="functional-number">{ops.activeSubscriptions || 0}</span>
              </div>
              <div className="mini-card">
                <span className="label">Total users</span>
                <span className="functional-number">{ops.totalUsers || 0}</span>
              </div>
              <div className="mini-card">
                <span className="label">Subscribed users</span>
                <span className="functional-number">{ops.subscribedUsers || 0}</span>
              </div>
              <div className="mini-card">
                <span className="label">Pending verifications</span>
                <span className="functional-number">{ops.pendingWinnerVerifications || 0}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
