"use client";

import { useEffect, useState } from "react";
import API from "@/services/api";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Winnings() {
  const [winnings, setWinnings] = useState([]);

  const fetchWinnings = async () => {
    const { data } = await API.get("/winners");
    setWinnings(data);
  };

  useEffect(() => {
    fetchWinnings();
  }, []);

  return (
    <ProtectedRoute>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Your Winnings</h1>

        <div className="mt-4 grid gap-4">
          {winnings.map((w) => (
            <div key={w._id} className="border p-4">
              <p>Match: {w.matchCount}</p>
              <p>Amount: ${w.prizeAmount}</p>
              <p>Status: {w.status}</p>
              <p>Verified: {w.verified ? "Yes" : "No"}</p>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}

