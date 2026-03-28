"use client";

import { useEffect, useState } from "react";
import API from "@/services/api";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Subscription() {
  const [sub, setSub] = useState(null);

  const fetchSub = async () => {
    const { data } = await API.get("/subscriptions");
    setSub(data);
  };

  useEffect(() => {
    fetchSub();
  }, []);

  const createSub = async (planType) => {
    const start = new Date();
    const end = new Date();

    if (planType === "monthly") {
      end.setMonth(end.getMonth() + 1);
    } else {
      end.setFullYear(end.getFullYear() + 1);
    }

    await API.post("/subscriptions", {
      planType,
      startDate: start,
      endDate: end,
    });

    fetchSub();
  };

  return (
    <ProtectedRoute>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Subscription</h1>

        {sub ? (
          <div className="mt-4">
            <p>Plan: {sub.planType}</p>
            <p>Status: {sub.status}</p>
            <p>Ends: {new Date(sub.endDate).toDateString()}</p>
          </div>
        ) : (
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => createSub("monthly")}
              className="bg-black text-white px-4 py-2"
            >
              Monthly
            </button>
            <button
              onClick={() => createSub("yearly")}
              className="bg-black text-white px-4 py-2"
            >
              Yearly
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}