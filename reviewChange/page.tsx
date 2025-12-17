"use client";

import React, { useState } from 'react';

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

export default function ReviewChangeRequestPage() {
  const [requestId, setRequestId] = useState('');
  const [request, setRequest] = useState<ChangeRequest | null>(null);
  const [approve, setApprove] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFind = async () => {
    if (!requestId) {
      setMessage('Please enter request ID');
      return;
    }

    setLoading(true);
    setMessage('');
    setRequest(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/organization-structure/change-request/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequest(data);
      } else {
        const error = await response.text();
        setMessage(`Error: ${error}`);
      }
    } catch (error) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!request) return;

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/organization-structure/change-request/${requestId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ approve }),
      });

      if (response.ok) {
        setMessage(`Request ${approve ? 'approved' : 'rejected'} successfully!`);
        setRequest(null);
        setRequestId('');
      } else {
        const error = await response.text();
        setMessage(`Error: ${error}`);
      }
    } catch (error) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Review Change Request</h1>

      <div className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder="Enter Request ID"
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={handleFind}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Find Request
          </button>
        </div>
      </div>

      {message && <p className="mb-4 text-red-600">{message}</p>}

      {request && (
        <div className="border rounded p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Request Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Request Number:</strong> {request.requestNumber}
            </div>
            <div>
              <strong>Requested By:</strong> {request.requestedByEmployeeId}
            </div>
            <div>
              <strong>Type:</strong> {request.requestType}
            </div>
            <div>
              <strong>Status:</strong> {request.status}
            </div>
            <div>
              <strong>Submitted By:</strong> {request.submittedByEmployeeId}
            </div>
            <div>
              <strong>Submitted At:</strong> {new Date(request.submittedAt).toLocaleString()}
            </div>
            <div className="col-span-2">
              <strong>Details:</strong> {request.details}
            </div>
            <div className="col-span-2">
              <strong>Reason:</strong> {request.reason}
            </div>
          </div>

          <div className="mt-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={approve}
                onChange={(e) => setApprove(e.target.checked)}
                className="mr-2"
              />
              Approve Request
            </label>
          </div>

          <button
            onClick={handleReview}
            disabled={loading}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}
    </div>
  );
}
