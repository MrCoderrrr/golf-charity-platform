"use client";

import { useEffect, useState } from "react";
import API from "@/services/api";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    API.get("/user/me").then((res) => setUser(res.data));
  }, []);

  return (
    <ProtectedRoute>
      {!user ? (
        <div className="p-6">Loading...</div>
      ) : (
        <div className="p-6">
          <h1 className="text-3xl font-bold">
            Welcome, {user.name}
          </h1>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="border p-4 rounded">
              <p className="text-gray-500">Email</p>
              <p>{user.email}</p>
            </div>

            <div className="border p-4 rounded">
              <p className="text-gray-500">Subscription</p>
              <p>{user.isSubscribed ? "Active" : "Inactive"}</p>
            </div>

            <div className="border p-4 rounded">
              <p className="text-gray-500">Charity</p>
              <p>
                {user.selectedCharity?.name || "Not Selected"}
              </p>
            </div>

            <div className="border p-4 rounded">
              <p className="text-gray-500">Contribution</p>
              <p>{user.charityPercentage}%</p>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}