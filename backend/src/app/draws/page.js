"use client";

import { useEffect, useState } from "react";
import API from "@/services/api";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Draws() {
  const [draws, setDraws] = useState([]);

  useEffect(() => {
    API.get("/draws").then((res) => setDraws(res.data));
  }, []);

  return (
    <ProtectedRoute>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Draw Results</h1>

        <div className="mt-4 grid gap-4">
          {draws.map((d) => (
            <div key={d._id} className="border p-4">
              <h2 className="font-bold">
                {d.month}/{d.year}
              </h2>
              <p>Numbers: {d.drawNumbers.join(", ")}</p>
              <p>Type: {d.type}</p>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}