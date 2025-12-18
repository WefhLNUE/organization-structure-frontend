"use client";

import React, { useEffect, useState } from "react";

type Position = {
  _id: string;
  code: string;
  title: string;
};

export default function DeletePositionPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch positions on mount
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMessage("Authentication required. Please log in.");
          return;
        }

        const res = await fetch("http://localhost:3000/organization-structure/positions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setPositions(data);
        } else {
          const errorText = await res.text();
          setMessage(`Failed to fetch positions: ${errorText}`);
        }
      } catch (err) {
        console.error(err);
        setMessage("Network error while fetching positions.");
      }
    };

    fetchPositions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedId) {
      setMessage("Please select a position");
      return;
    }

    if (!confirm("Are you sure you want to delete this position?")) return;

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/organization-structure/positions/${selectedId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage("Position deleted successfully!");
        setSelectedId("");
        // remove deleted position from dropdown
        setPositions((prev) => prev.filter((p) => p._id !== selectedId));
      } else {
        const error = await response.text();
        setMessage(`Error: ${error}`);
      }
    } catch (error) {
      console.error(error);
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Delete Position</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Select Position *</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Select a Position --</option>
            {positions.map((pos) => (
              <option key={pos._id} value={pos._id}>
                {pos.title} ({pos.code})
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? "Deleting..." : "Delete Position"}
        </button>
      </form>

      {message && <p className="mt-4 text-red-600">{message}</p>}
    </div>
  );
}
