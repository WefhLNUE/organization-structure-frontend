"use client";

import React, { useEffect, useState } from "react";

interface ChangeRequest {
  _id: string;
  requestNumber: string;
  requestedByEmployeeId: string;
  requestType: string;
  targetDepartmentId?: string;
  targetPositionId?: string;
  details: string;
  reason: string;
  status: string;
  submittedByEmployeeId: string;
  submittedAt: string;
}

const STATUS_OPTIONS: string[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CANCELED",
  "IMPLEMENTED",
];

export default function ReviewChangeRequestPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [statusSelection, setStatusSelection] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("No authentication token found. Please log in again.");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/organization-structure/change-request",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data: ChangeRequest[] = await response.json();
        setRequests(data);
        const initialStatus: Record<string, string> = {};
        data.forEach((req) => {
          initialStatus[req._id] = req.status;
        });
        setStatusSelection(initialStatus);
      } else {
        const error = await response.text();
        setMessage(`Error loading requests: ${error}`);
      }
    } catch (error) {
      setMessage("Network error while loading requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleStatusChange = (id: string, status: string) => {
    setStatusSelection((prev) => ({ ...prev, [id]: status }));
  };

  const handleReview = async (id: string) => {
    const selectedStatus = statusSelection[id];
    if (!selectedStatus) {
      setMessage("Please select a status before submitting.");
      return;
    }

    setSavingId(id);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("No authentication token found. Please log in again.");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/organization-structure/change-request/${id}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: selectedStatus }),
        }
      );

      if (response.ok) {
        setMessage(`Request ${id} updated to ${selectedStatus}.`);
        // Update local list
        setRequests((prev) =>
          prev.map((req) =>
            req._id === id ? { ...req, status: selectedStatus } : req
          )
        );
      } else {
        const error = await response.text();
        setMessage(`Error updating request: ${error}`);
      }
    } catch (error) {
      setMessage("Network error while submitting review.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-semibold mb-6">Review Change Requests</h1>

      {message && <p className="mb-4 text-red-600">{message}</p>}

      {loading ? (
        <p>Loading requests...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2">Req #</th>
                <th className="border border-gray-300 px-3 py-2">Type</th>
                <th className="border border-gray-300 px-3 py-2">Requested By</th>
                <th className="border border-gray-300 px-3 py-2">Details</th>
                <th className="border border-gray-300 px-3 py-2">Reason</th>
                <th className="border border-gray-300 px-3 py-2">Status</th>
                <th className="border border-gray-300 px-3 py-2">
                  New Status
                </th>
                <th className="border border-gray-300 px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id}>
                  <td className="border border-gray-300 px-3 py-2">
                    {req.requestNumber}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {req.requestType}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {req.requestedByEmployeeId}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 max-w-xs truncate">
                    {req.details}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 max-w-xs truncate">
                    {req.reason}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {req.status}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <select
                      className="border rounded px-2 py-1"
                      value={statusSelection[req._id] || req.status}
                      onChange={(e) =>
                        handleStatusChange(req._id, e.target.value)
                      }
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <button
                      onClick={() => handleReview(req._id)}
                      disabled={savingId === req._id}
                      className="btn-primary disabled:opacity-50"
                    >
                      {savingId === req._id ? "Saving..." : "Save"}
                    </button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td
                    className="border border-gray-300 px-3 py-4 text-center"
                    colSpan={8}
                  >
                    No change requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
