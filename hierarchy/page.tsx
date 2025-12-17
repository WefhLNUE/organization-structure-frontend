"use client";

import React, { useState } from 'react';

interface EmployeeHierarchy {
  id: string;
  name: string;
  department: string | null;
  position: string | null;
  manager: { id: string; name: string; position: string | null } | null;
  managerManager: { id: string; name: string; position: string | null } | null;
}

interface TeamMember {
  id: string;
  name: string;
  position: string | null;
  department: string | null;
}

interface HierarchyData {
  employeeHierarchy: EmployeeHierarchy;
  teamStructure: TeamMember[];
}

export default function ViewHierarchyPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [hierarchy, setHierarchy] = useState<HierarchyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setMessage('Please enter employee ID');
      return;
    }

    setLoading(true);
    setMessage('');
    setHierarchy(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/organization-structure/hierarchy/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHierarchy(data);
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
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">View Hierarchy</h1>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Enter Employee ID"
            className="flex-1 border rounded px-3 py-2"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'View Hierarchy'}
          </button>
        </div>
      </form>

      {message && <p className="mb-4 text-red-600">{message}</p>}

      {hierarchy && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Employee Hierarchy</h2>
          <table className="w-full border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Name</th>
                <th className="border border-gray-300 px-4 py-2">Position</th>
                <th className="border border-gray-300 px-4 py-2">Department</th>
                <th className="border border-gray-300 px-4 py-2">Manager</th>
                <th className="border border-gray-300 px-4 py-2">Manager's Manager</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">{hierarchy.employeeHierarchy.name}</td>
                <td className="border border-gray-300 px-4 py-2">{hierarchy.employeeHierarchy.position || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-2">{hierarchy.employeeHierarchy.department || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-2">{hierarchy.employeeHierarchy.manager?.name || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-2">{hierarchy.employeeHierarchy.managerManager?.name || 'N/A'}</td>
              </tr>
            </tbody>
          </table>

          {hierarchy.teamStructure.length > 0 && (
            <>
              <h2 className="text-xl font-semibold mb-4">Team Structure</h2>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2">Name</th>
                    <th className="border border-gray-300 px-4 py-2">Position</th>
                    <th className="border border-gray-300 px-4 py-2">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {hierarchy.teamStructure.map(member => (
                    <tr key={member.id}>
                      <td className="border border-gray-300 px-4 py-2">{member.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{member.position || 'N/A'}</td>
                      <td className="border border-gray-300 px-4 py-2">{member.department || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
