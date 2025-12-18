"use client";

import React, { useState } from "react";

export default function CreateDepartmentChangeRequestPage() {
  const [newDepartmentId, setNewDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [details, setDetails] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("No authentication token found. Please log in again.");
        return;
      }

      const response = await fetch(
        "http://localhost:3000/organization-structure/change-request/department",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            employeeId,
            newDept: newDepartmentId,
            details,
            reason,
          }),
        }
      );

      if (response.ok) {
        setMessage("Department change request submitted successfully.");
        setNewDepartmentId("");
        setEmployeeId("");
        setDetails("");
        setReason("");
      } else {
        const errorText = await response.text();
        setMessage(`Error: ${errorText}`);
      }
    } catch (error) {
      setMessage("Network error while submitting request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">
        Create Department Change Request
      </h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 items-center gap-4">
          <label className="font-medium text-gray-700">New Department ID</label>
          <input
            type="text"
            value={newDepartmentId}
            onChange={(e) => setNewDepartmentId(e.target.value)}
            className="col-span-2 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <label className="font-medium text-gray-700">Employee ID</label>
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="col-span-2 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-3 items-start gap-4">
          <label className="font-medium text-gray-700 mt-2">Details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="col-span-2 border rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-3 items-start gap-4">
          <label className="font-medium text-gray-700 mt-2">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="col-span-2 border rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-4 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-sm text-gray-700">
          {message}
        </p>
      )}
    </div>
  );
}
