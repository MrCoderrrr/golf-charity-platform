"use client";

import { useEffect, useState } from "react";
import API from "@/services/api";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Charities() {
  const [charities, setCharities] = useState([]);

  useEffect(() => {
    API.get("/charities").then((res) => setCharities(res.data));
  }, []);

  const selectCharity = async (id) => {
    await API.put("/user/select-charity", { charityId: id });
    alert("Charity selected");
  };

  return (
    <ProtectedRoute>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Select Charity</h1>

        <div className="mt-4 grid gap-4">
          {charities.map((c) => (
            <div key={c._id} className="border p-4">
              <h2 className="text-lg font-bold">{c.name}</h2>
              <p>{c.description}</p>
              <button
                onClick={() => selectCharity(c._id)}
                className="bg-black text-white px-4 mt-2"
              >
                Select
              </button>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}