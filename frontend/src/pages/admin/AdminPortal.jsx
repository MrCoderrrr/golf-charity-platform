import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const AdminPortal = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [charity, setCharity] = useState({ name: "", description: "", image: "", icon: "*", goalAmount: 0 });
  const [draw, setDraw] = useState({ month: "", year: "", type: "random" });
  const [winners, setWinners] = useState([]);
  const [users, setUsers] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingWinners, setLoadingWinners] = useState(false);

  // gate
  if (!user || user.role !== "admin") {
    return <Navigate to="/admin-login" replace />;
  }

  const loadWinners = useCallback(async () => {
    setLoadingWinners(true);
    try {
      const { data } = await api.get("/winners");
      setWinners(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatusMessage(err?.response?.data?.message || "Failed to load winners");
      setWinners([]);
    } finally {
      setLoadingWinners(false);
    }
  }, []);

  const loadUsers = useCallback(async (params = {}) => {
    setLoadingUsers(true);
    try {
      const { data } = await api.get("/admin/users", { params });
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatusMessage(err?.response?.data?.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadWinners();
    loadUsers();
  }, [loadWinners, loadUsers]);

  useEffect(() => {
    const docs = (winners || []).map((w) => ({
      _id: w._id,
      userId: w.userId?._id || w.userId,
      userName: w.userId?.name || "Unknown",
      userEmail: w.userId?.email || "",
      draw: `${w.drawId?.month}/${w.drawId?.year}`,
      tier: w.matchCount >= 5 ? "Jackpot" : w.matchCount === 4 ? "4-pass" : "3-pass",
      status: String(w.reviewStatus || "pending").toLowerCase(),
      proof: w.proofUrl || w.proofImage || "",
      uploadedAt: w.proofUploadedAt || w.createdAt || new Date().toISOString(),
      provisionalPrizeAmount: Number(w.provisionalPrizeAmount || 0),
      finalPrizeAmount: Number(w.finalPrizeAmount || w.prizeAmount || 0),
    }));
    setDocuments(docs);
  }, [winners]);

  const createCharity = async (e) => {
    e?.preventDefault();
    setStatusMessage("");
    try {
      await api.post("/charities", charity);
      setStatusMessage("Charity created");
    } catch {
      setStatusMessage("Failed to create charity");
    }
    setCharity({ name: "", description: "", image: "", icon: "*", goalAmount: 0 });
  };

  const createDraw = async (e) => {
    e?.preventDefault();
    setStatusMessage("");
    try {
      await api.post("/draws", { ...draw, month: Number(draw.month), year: Number(draw.year) });
      setStatusMessage("Draw created");
    } catch {
      setStatusMessage("Failed to create draw");
    }
    setDraw({ month: "", year: "", type: "random" });
  };

  const verifyWinner = async (winnerId, newStatus = "paid") => {
    try {
      await api.post("/winners/verify", { winnerId, status: newStatus });
      setStatusMessage("Winner updated");
      await loadWinners();
    } catch (err) {
      setStatusMessage(err?.response?.data?.message || "Failed to update winner");
    }
  };

  const rejectWinner = async (winnerId) => {
    try {
      await api.post("/winners/reject", { winnerId });
      setStatusMessage("Proof rejected");
      await loadWinners();
    } catch (err) {
      setStatusMessage(err?.response?.data?.message || "Failed to reject proof");
    }
  };

  const setUserBanned = async (userId, banned) => {
    setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, banned: Boolean(banned) } : u)));
    try {
      await api.patch(`/admin/users/${userId}/ban`, { banned: Boolean(banned) });
      setStatusMessage(banned ? "User banned" : "User unbanned");
      await loadUsers();
    } catch (err) {
      setStatusMessage(err?.response?.data?.message || (banned ? "Ban failed" : "Unban failed"));
    }
  };

  const updateDocStatus = (docId, status) => {
    setDocuments((prev) => prev.map((d) => (d._id === docId ? { ...d, status } : d)));
  };

  const stats = useMemo(
    () => ({
      activeUsers: users.length,
      pendingDocs: documents.filter((d) => d.status === "pending").length,
      winners: winners.length,
    }),
    [users, documents, winners]
  );

  const outletContext = {
    charity,
    setCharity,
    createCharity,
    draw,
    setDraw,
    createDraw,
    winners,
    verifyWinner,
    rejectWinner,
    users,
    loadUsers,
    setUserBanned,
    documents,
    updateDocStatus,
    statusMessage,
    stats,
    location,
    loadingUsers,
    loadingWinners,
  };

  return <Outlet context={outletContext} />;
};

export default AdminPortal;
