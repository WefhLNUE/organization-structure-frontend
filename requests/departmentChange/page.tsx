"use client";

import React, { useEffect, useState } from "react";
import { checkAuth, hasRole, User } from '@/lib/auth';
import { CheckCircle, AlertCircle } from "lucide-react";

type Employee = {
  _id: string;
  firstName: string;
  lastName: string;
  primaryPositionId?: {
    _id: string;
    code: string;
    title: string;
  }
};

type Department = {
  _id: string;
  code: string;
  name: string;
  description?: string;
  headPositionId?: string;
  isActive: boolean;
};

export default function CreateDepartmentChangeRequestPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [newDepartmentId, setNewDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [details, setDetails] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const userData = await checkAuth();
        if (!userData) {
          window.location.href = '/login';
          return;
        }
        setUser(userData);
        setAuthLoading(false);

        const token = localStorage.getItem("token");
        const isAdminOrHR = hasRole(userData, 'System Admin') || hasRole(userData, 'HR Manager') || hasRole(userData, 'HR Admin');
        const isDeptHead = hasRole(userData, 'Department Head');

        // Fetch Employees
        let empUrl = "http://localhost:5000/employee-profile/my-employees";
        if (isAdminOrHR) {
          empUrl = "http://localhost:5000/employee-profile/all-for-selection";
        }

        const empRes = await fetch(empUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let emps: any[] = [];
        if (empRes.ok) {
          let data = await empRes.json();
          console.log("DEBUG: Employees raw data", data);
          emps = Array.isArray(data) ? data : (data.data || data.employees || []);

          if (!isAdminOrHR && !isDeptHead) {
            // Regular employee: only self
            emps = emps.filter((e: any) => (e._id || e.id) === userData.id);
          }
          setEmployees(emps);
        }

        // Fetch Departments
        const deptRes = await fetch("http://localhost:5000/organization-structure/departments", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (deptRes.ok) {
          const deptData = await deptRes.json();
          const normalizedDepartments = Array.isArray(deptData) ? deptData.map((dept: any) => ({
            ...dept,
            headPositionId: typeof dept.headPositionId === 'object' && dept.headPositionId?._id
              ? dept.headPositionId._id
              : dept.headPositionId,
          })) : [];
          setDepartments(normalizedDepartments);
        }

      } catch (err) {
        console.error("Error in fetchUserAndData:", err);
        setMessage("Error loading data");
      }
    };

    fetchUserAndData();
  }, []);


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
        "http://localhost:5000/organization-structure/change-request/department",
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
        setMessage("Department change request submitted successfully");
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

  const inputStyle = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1px solid var(--border-medium)',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-primary)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#F7FAFC',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #E2E8F0',
            borderTop: '4px solid #6B46C1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }} />
          <p style={{ color: '#718096', fontWeight: '500' }}>Verifying access...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--org-structure)', marginBottom: '0.5rem' }}>
          Create Department Change Request
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          Request a change to an employee's department
        </p>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-light)',
        borderRadius: '0.75rem',
        padding: '2rem',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="form-label" style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Select Department*
            </label>
            <select
              value={newDepartmentId}
              onChange={(e) => setNewDepartmentId(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.borderColor = 'var(--border-focus)';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-medium)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">-- Select a Department --</option>
              {departments.length > 0 ? (
                departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  {message && (message.includes('Error') || message.includes('Failed')) ? "Error loading positions - see message below" : "No positions available"}
                </option>
              )}
            </select>
            {departments.length > 0 && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {departments.length} department{departments.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          <div>
            <label className="form-label" style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Select Employee *
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.borderColor = 'var(--border-focus)';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-medium)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">-- Select an Employee --</option>
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} - {emp.primaryPositionId ? `${emp.primaryPositionId.title} (${emp.primaryPositionId.code})` : 'No Position'}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  {message && (message.includes('Error') || message.includes('Failed')) ? "Error loading employees - see message below" : "No employees available"}
                </option>
              )}
            </select>
            {employees.length > 0 && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {employees.length} position{employees.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          <div>
            <label className="form-label" style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Details *
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
              rows={4}
              style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.borderColor = 'var(--border-focus)';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-medium)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label className="form-label" style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
              style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.borderColor = 'var(--border-focus)';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-medium)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: 'var(--org-structure)',
              color: 'var(--text-inverse)',
              border: 'none',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>

        {message && (
          <div className={`alert alert-${message.includes('Error') || message.includes('Failed') ? 'error' : 'success'}`} style={{ marginTop: '1.5rem' }}>
            {message.includes('Error') || message.includes('Failed') ? (
              <AlertCircle size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            ) : (
              <CheckCircle size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            )}
            {message}
            <button onClick={() => setMessage(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
          </div>
        )}
      </div>
    </div>
  );
}
