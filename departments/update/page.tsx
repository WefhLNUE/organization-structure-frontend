"use client"; // if using Next.js 13+ app directory

import { useEffect, useState } from "react";
import Link from 'next/link';
import { ArrowLeft, Filter, Building2, X } from 'lucide-react';

type Department = {
  _id: string;
  code: string;
  name: string;
  description?: string;
  headPositionId?: string;
  isActive: boolean;
};

type Position = {
  _id: string;
  title: string;
  code: string;
};

import { checkAuth, hasRole, User } from '@/lib/auth';

export default function UpdateDepartmentPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await checkAuth();
      if (!userData || !hasRole(userData, 'System Admin')) {
        window.location.href = '/employee-profile';
        return;
      }
      setUser(userData);
      setAuthLoading(false);
    };
    fetchUser();
  }, []);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [formData, setFormData] = useState<Partial<Department>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Fetch departments and positions from backend
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('token');
        console.log("TOKEN FROM STORAGE:", token);

        if (!token) {
          setMessage({ type: "error", text: "Authentication required. Please log in." });
          return;
        }

        const [deptRes, posRes] = await Promise.all([
          fetch("http://localhost:5000/organization-structure/departments-all", {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:5000/organization-structure/positions", {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
        ]);

        if (deptRes.ok) {
          try {
            const deptData = await deptRes.json();
            const normalizedDepartments = Array.isArray(deptData) ? deptData.map((dept: any) => ({
              ...dept,
              headPositionId: typeof dept.headPositionId === 'object' && dept.headPositionId?._id
                ? dept.headPositionId._id
                : dept.headPositionId,
            })) : [];
            setDepartments(normalizedDepartments);
          } catch (parseError) {
            console.error("Error parsing departments JSON:", parseError);
            setMessage({ type: "error", text: "Failed to parse departments data" });
          }
        } else {
          try {
            const errorText = await deptRes.text();
            setMessage({ type: "error", text: `Failed to load departments (${deptRes.status}): ${errorText}` });
          } catch (error) {
            setMessage({ type: "error", text: `Failed to load departments (${deptRes.status})` });
          }
        }

        if (posRes.ok) {
          try {
            const posData = await posRes.json();
            setPositions(Array.isArray(posData) ? posData : []);
          } catch (parseError) {
            console.error("Error parsing positions JSON:", parseError);
            setMessage({ type: "error", text: "Failed to parse positions data" });
          }
        } else {
          try {
            const errorText = await posRes.text();
            setMessage({ type: "error", text: `Failed to load positions (${posRes.status}): ${errorText}` });
          } catch (error) {
            setMessage({ type: "error", text: `Failed to load positions (${posRes.status})` });
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setMessage({ type: "error", text: "Failed to load departments and positions" });
      }
    }

    fetchData();
  }, []);

  // Handle dropdown change - load department details into form
  const handleSelectDepartment = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptId = e.target.value;
    setSelectedId(deptId);

    if (deptId) {
      const selected = departments.find((dept) => dept._id === deptId);
      if (selected) {
        setFormData({
          code: selected.code,
          name: selected.name,
          description: selected.description || "",
          headPositionId: selected.headPositionId || "",
          isActive: selected.isActive,
        });
        setMessage(null);
      }
    } else {
      setFormData({});
    }
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Handle save/update
  const handleSave = async () => {
    if (!selectedId || !formData.name || !formData.code) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    setLoading(true);
    try {
      const updatePayload = {
        code: formData.code,
        name: formData.name,
        description: formData.description || "",
        headPositionId: formData.headPositionId || undefined,
        isActive: formData.isActive ?? true,
      };

      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: "error", text: "Authentication required. Please log in." });
        setLoading(false);
        return;
      }

      const res = await fetch(`http://localhost:5000/organization-structure/departments/${selectedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Department updated successfully!" });
        setDepartments((prev) =>
          prev.map((dept) => (dept._id === selectedId ? { ...dept, ...formData } : dept))
        );
      } else {
        const errorData = await res.json();
        setMessage({ type: "error", text: `Failed to update department: ${errorData.message}` });
      }
    } catch (err) {
      console.error("Error updating department:", err);
      setMessage({ type: "error", text: "Error updating department" });
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

  const focusStyle = {
    outline: 'none',
    borderColor: 'var(--border-focus)',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
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
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/organization-structure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Update Department</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Modify existing department information</p>
        </div>
      </div>

      {/* Selection Card */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <label style={{ fontWeight: 600, color: '#334155' }}>Select Department</label>
          {/* Filter Button */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {statusFilter !== 'all' && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setSelectedId('');
                  setFormData({});
                  setAuditLogs([]);
                }}
                title="Clear Filter (Show All)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: statusFilter !== 'active' ? '#6B46C1' : '#f1f5f9',
                color: statusFilter !== 'active' ? 'white' : '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              <Filter size={16} />
              {statusFilter === 'active' ? 'Active' : statusFilter === 'inactive' ? 'Inactive' : 'All'}
            </button>
            {showFilterMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.25rem',
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                zIndex: 100,
                minWidth: '160px',
              }}>
                {['active', 'inactive', 'all'].map((option) => (
                  <button
                    key={option}
                    onClick={() => { setStatusFilter(option as any); setShowFilterMenu(false); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.625rem 1rem',
                      textAlign: 'left',
                      border: 'none',
                      backgroundColor: statusFilter === option ? '#f8fafc' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#334155',
                    }}
                  >
                    {option === 'active' ? 'Active Only' : option === 'inactive' ? 'Delimited/Inactive' : 'All Departments'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <Building2 size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <select
            value={selectedId}
            onChange={handleSelectDepartment}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', background: 'white' }}
          >
            <option value="">-- Choose a Department --</option>
            {departments
              .filter(dept => {
                if (statusFilter === 'active') return dept.isActive;
                if (statusFilter === 'inactive') return !dept.isActive;
                return true;
              })
              .map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} ({dept.code}) {!dept.isActive ? '(Inactive)' : ''}
                </option>
              ))}
          </select>
        </div>
      </div>


      {/* Form Fields */}

      {selectedId && (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Department Details</h2>
            </div>
            {/* Code */}
            <div>
              <label style={{ display: 'block', color: '#334155', fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Department Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code || ""}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                placeholder="e.g., DEPT001"
              />
            </div>

            {/* Name */}
            <div>
              <label className="form-label" style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Department Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleInputChange}
                style={inputStyle}
                placeholder="e.g., Human Resources"
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-medium)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="form-label" style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                rows={4}
                style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
                placeholder="Department description..."
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-medium)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Head Position */}
            <div>
              <label className="form-label" style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Head Position
              </label>
              <select
                name="headPositionId"
                value={formData.headPositionId || ""}
                onChange={handleInputChange}
                style={inputStyle}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-medium)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">-- None --</option>
                {positions.map((pos) => (
                  <option key={pos._id} value={pos._id}>
                    {pos.title} ({pos.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Is Active */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive ?? true}
                onChange={handleInputChange}
                style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', cursor: 'pointer' }}
              />
              <label htmlFor="isActive" style={{ color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer' }}>
                Active Department
              </label>
            </div>

            {/* Message */}
            {message && (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: message.type === "success" ? 'var(--success-light)' : 'var(--error-light)',
                  color: message.type === "success" ? 'var(--success-dark)' : 'var(--error-dark)',
                  borderLeft: `4px solid ${message.type === "success" ? 'var(--success)' : 'var(--error)'}`,
                }}
              >
                {message.text}
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                width: '100%',
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
              {loading ? "Saving..." : "Save Changes"}
            </button>

          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {showAuditLogs && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', maxWidth: '800px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>Audit Logs for Department</h2>
            {auditLogsLoading ? (
              <p style={{ color: '#64748b' }}>Loading...</p>
            ) : auditLogs.length === 0 ? (
              <p style={{ color: '#64748b' }}>No historical assignments found for this department.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Employee</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Position</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Start Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>End Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', color: '#0f172a' }}>{log.employeeProfileId?.firstName} {log.employeeProfileId?.lastName}</td>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>{log.positionId?.title || 'N/A'}</td>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>{new Date(log.startDate).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>{log.endDate ? new Date(log.endDate).toLocaleDateString() : 'Active'}</td>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>{log.reason || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button onClick={() => setShowAuditLogs(false)} style={{ marginTop: '1.5rem', padding: '0.625rem 1.25rem', backgroundColor: '#6B46C1', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

