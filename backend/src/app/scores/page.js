"use client";

import { useEffect, useState } from "react";
import API from "@/services/api";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Scores() {
  const [scores, setScores] = useState([]);
  const [form, setForm] = useState({ score: "", date: "" });

  const fetchScores = async () => {
    const { data } = await API.get("/scores");
    setScores(data);
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await API.post("/scores", form);
    setForm({ score: "", date: "" });
    fetchScores();
  };

  return (
    <ProtectedRoute>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Your Scores</h1>

        <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
          <input
            type="number"
            placeholder="Score"
            value={form.score}
            onChange={(e) =>
              setForm({ ...form, score: e.target.value })
            }
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) =>
              setForm({ ...form, date: e.target.value })
            }
          />
          <button className="bg-black text-white px-4">Add</button>
        </form>

        <div className="mt-6">
          {scores.map((s) => (
            <div key={s._id} className="border p-2 mt-2">
              Score: {s.score} | Date: {new Date(s.date).toDateString()}
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}