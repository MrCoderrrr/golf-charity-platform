import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const sampleWinners = [
  { _id: "w1", drawId: { month: 3, year: 2026 }, prizeAmount: 500, status: "pending", verified: false, userId: "demo-user" },
];

const Admin = () => {
  const { user } = useAuth();
  const [charity, setCharity] = useState({ name: "", description: "", image: "" });
  const [draw, setDraw] = useState({ month: "", year: "", type: "random" });
  const [winners, setWinners] = useState(sampleWinners);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const loadWinners = async () => {
      try {
        const { data } = await api.get("/winners");
        setWinners(data);
      } catch {
        console.warn("Using sample winners (API unreachable)");
      }
    };
    loadWinners();
  }, []);

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const createCharity = async (e) => {
    e.preventDefault();
    setStatusMessage("");
    try {
      await api.post("/charities", charity);
      setStatusMessage("Charity created");
    } catch {
      setStatusMessage("Mock charity created (demo)");
    }
    setCharity({ name: "", description: "", image: "" });
  };

  const createDraw = async (e) => {
    e.preventDefault();
    setStatusMessage("");
    try {
      await api.post("/draws", {
        ...draw,
        month: Number(draw.month),
        year: Number(draw.year),
      });
      setStatusMessage("Draw created");
    } catch {
      setStatusMessage("Mock draw created (demo)");
    }
    setDraw({ month: "", year: "", type: "random" });
  };

  const verifyWinner = async (winnerId) => {
    try {
      await api.post("/winners/verify", { winnerId, status: "paid" });
      setStatusMessage("Winner verified");
    } catch {
      setWinners((prev) =>
        prev.map((w) =>
          w._id === winnerId ? { ...w, status: "paid", verified: true } : w
        )
      );
      setStatusMessage("Winner marked paid (demo)");
    }
  };

  return (
    <div className="grid two">
      <div className="card">
        <div className="title">
          <h3>Create charity</h3>
        </div>
        <form onSubmit={createCharity}>
          <div>
            <label>Name</label>
            <input
              value={charity.name}
              onChange={(e) => setCharity({ ...charity, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Description</label>
            <textarea
              value={charity.description}
              onChange={(e) =>
                setCharity({ ...charity, description: e.target.value })
              }
              rows={3}
            />
          </div>
          <div>
            <label>Image URL</label>
            <input
              value={charity.image}
              onChange={(e) => setCharity({ ...charity, image: e.target.value })}
            />
          </div>
          <button className="btn" type="submit">
            Save charity
          </button>
        </form>
      </div>
      <div className="card">
        <div className="title">
          <h3>Create draw</h3>
        </div>
        <form onSubmit={createDraw}>
          <div>
            <label>Month</label>
            <input
              type="number"
              value={draw.month}
              onChange={(e) => setDraw({ ...draw, month: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Year</label>
            <input
              type="number"
              value={draw.year}
              onChange={(e) => setDraw({ ...draw, year: e.target.value })}
              required
            />
          </div>
          <div>
            <label>Type</label>
            <select
              value={draw.type}
              onChange={(e) => setDraw({ ...draw, type: e.target.value })}
            >
              <option value="random">Random</option>
              <option value="algorithm">Algorithm</option>
            </select>
          </div>
          <button className="btn" type="submit">
            Save draw
          </button>
        </form>
      </div>
      <div className="card">
        <div className="title">
          <h3>Verify winners</h3>
        </div>
        {winners.length === 0 ? (
          <div className="empty">No winners yet.</div>
        ) : (
          <ul className="list">
            {winners.map((w) => (
              <li key={w._id} className="card" style={{ margin: 0 }}>
                <div className="title">
                <strong>
                  <span className="functional-number">
                    {`${w.drawId?.month}/${w.drawId?.year}`}
                  </span>
                </strong>
                <span className="badge">
                  <span className="functional-number">${w.prizeAmount}</span>
                </span>
                </div>
                <p>User: {w.userId}</p>
                <p>Status: {w.status}</p>
                <p>Verified: {w.verified ? "Yes" : "No"}</p>
                <button className="btn secondary" onClick={() => verifyWinner(w._id)}>
                  Mark paid
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {statusMessage && (
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="badge">{statusMessage}</div>
        </div>
      )}
    </div>
  );
};

export default Admin;
