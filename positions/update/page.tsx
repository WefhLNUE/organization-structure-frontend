"use client"; // if using Next.js 13+ app directory

import { useEffect, useState } from "react";
import { API_URL } from '@/lib/config';
import Link from 'next/link';
import { ArrowLeft, Filter, Briefcase, X } from 'lucide-react';

type Position = {
  _id: string;
  code: string;
  title: string;
  description?: string;
  departmentId: string;
  reportsToPositionId?: string;
  isActive: boolean;
};

type Department = {
  _id: string;
  name: string;
};

import { checkAuth, hasRole, User } from '@/lib/auth';

export default function UpdatePositionPage() {
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

  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [formData, setFormData] = useState<Partial<Position>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Fetch positions and departments from backend
  useEffect(() => {
    async function fetchData() {
      try {
        // Try both token keys
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        console.log("TOKEN FROM STORAGE:", token ? "Token found" : "No token");

        if (!token) {
          setMessage({ type: "error", text: "Authentication required. Please log in." });
          return;
        }

        const [posRes, deptRes] = await Promise.all([
          fetch(`${API_URL}/organization-structure/positions`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/organization-structure/departments`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
        ]);

        console.log("Positions response status:", posRes.status, posRes.statusText);
        console.log("Departments response status:", deptRes.status, deptRes.statusText);

        if (posRes.ok) {
          try {
            const posData = await posRes.json();
            console.log("Positions data received:", posData);

            // Handle different response formats
            let positionsArray: any[] = [];
            if (Array.isArray(posData)) {
              positionsArray = posData;
            } else if (posData && Array.isArray(posData.data)) {
              positionsArray = posData.data;
            } else if (posData && Array.isArray(posData.positions)) {
              positionsArray = posData.positions;
            }

            console.log("Positions array length:", positionsArray.length);

            // Handle case where departmentId might be populated as an object
            const normalizedPositions = positionsArray.map((pos: any) => ({
              _id: pos._id || pos.id,
              code: pos.code || '',
              title: pos.title || '',
              description: pos.description || '',
              departmentId: typeof pos.departmentId === 'object' && pos.departmentId?._id
                ? pos.departmentId._id
                : pos.departmentId || '',
              reportsToPositionId: typeof pos.reportsToPositionId === 'object' && pos.reportsToPositionId?._id
                ? pos.reportsToPositionId._id
                : pos.reportsToPositionId || '',
              isActive: pos.isActive !== undefined ? pos.isActive : true,
            }));

            setPositions(normalizedPositions);
            console.log("Normalized positions set:", normalizedPositions.length);
          } catch (parseError) {
            console.error("Error parsing positions JSON:", parseError);
            setMessage({ type: "error", text: "Failed to parse positions data" });
          }
        } else {
          try {
            const errorText = await posRes.text();
            console.error("Error fetching positions:", posRes.status, errorText);
            setMessage({ type: "error", text: `Failed to load positions (${posRes.status}): ${errorText}` });
          } catch (error) {
            console.error("Error reading error response:", error);
            setMessage({ type: "error", text: `Failed to load positions (${posRes.status})` });
          }
        }

        if (deptRes.ok) {
          try {
            const deptData = await deptRes.json();
            console.log("Departments data received:", deptData);

            // Handle different response formats
            let departmentsArray: any[] = [];
            if (Array.isArray(deptData)) {
              departmentsArray = deptData;
            } else if (deptData && Array.isArray(deptData.data)) {
              departmentsArray = deptData.data;
            } else if (deptData && Array.isArray(deptData.departments)) {
              departmentsArray = deptData.departments;
            }

            const normalizedDepartments = departmentsArray.map((dept: any) => ({
              _id: dept._id || dept.id,
              name: dept.name || '',
            }));

            setDepartments(normalizedDepartments);
            console.log("Departments set:", normalizedDepartments.length);
          } catch (parseError) {
            console.error("Error parsing departments JSON:", parseError);
            setMessage({ type: "error", text: "Failed to parse departments data" });
          }
        } else {
          try {
            const errorText = await deptRes.text();
            console.error("Error fetching departments:", deptRes.status, errorText);
            setMessage({ type: "error", text: `Failed to load departments (${deptRes.status}): ${errorText}` });
          } catch (error) {
            console.error("Error reading error response:", error);
            setMessage({ type: "error", text: `Failed to load departments (${deptRes.status})` });
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setMessage({ type: "error", text: "Failed to load positions and departments. Check console for details." });
      }
    }

    fetchData();
  }, []);

  // Handle dropdown change - load position details into form
  const handleSelectPosition = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const posId = e.target.value;
    setSelectedId(posId);

    if (posId) {
      const selected = positions.find((pos) => pos._id === posId);
      if (selected) {
        setFormData({
          code: selected.code,
          title: selected.title,
          description: selected.description || "",
          departmentId: selected.departmentId,
          reportsToPositionId: selected.reportsToPositionId || "",
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
    if (!selectedId || !formData.title || !formData.code || !formData.departmentId) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    setLoading(true);
    try {
      const updatePayload = {
        code: formData.code,
        title: formData.title,
        description: formData.description || "",
        departmentId: formData.departmentId,
        reportsToPositionId: formData.reportsToPositionId || undefined,
        isActive: formData.isActive ?? true,
      };

      // Try both token keys
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        setMessage({ type: "error", text: "Authentication required. Please log in." });
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/organization-structure/positions/${selectedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Position updated successfully!" });
        // Update local state
        setPositions((prev) =>
          prev.map((pos) => (pos._id === selectedId ? { ...pos, ...formData } : pos))
        );
      } else {
        const errorData = await res.json();
        setMessage({ type: "error", text: `Failed to update position: ${errorData.message}` });
      }
    } catch (err) {
      console.error("Error updating position:", err);
      setMessage({ type: "error", text: "Error updating position" });
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentName = (deptId: string | any) => {
    // Handle case where deptId might be an object (populated)
    const id = typeof deptId === 'object' && deptId?._id ? deptId._id : deptId;
    return departments.find((d) => d._id === id)?.name || "Unknown";
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Update Position</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Modify position details and requirements</p>
        </div>
      </div>

      {/* Selection Card */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <label style={{ fontWeight: 600, color: '#334155' }}>Select Position</label>
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
                    {option === 'active' ? 'Active Only' : option === 'inactive' ? 'Delimited/Inactive' : 'All Positions'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <Briefcase size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <select
            value={selectedId}
            onChange={handleSelectPosition}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', background: 'white' }}
          >
            <option value="">-- Choose a Position --</option>
            {positions
              .filter(pos => {
                if (statusFilter === 'active') return pos.isActive;
                if (statusFilter === 'inactive') return !pos.isActive;
                return true;
              })
              .map((pos) => (
                <option key={pos._id} value={pos._id}>
                  {pos.title} ({pos.code}) - {getDepartmentName(pos.departmentId)} {!pos.isActive ? '(Inactive)' : ''}
                </option>
              ))}
          </select>
          {selectedId && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
              Selected ID: {selectedId}
            </p>
          )}
        </div>
      </div>

      {/* Form Fields */}
      {selectedId && (
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
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Position Details</h2>
          </div>
          {/* Code */}
          <div>
            <label className="form-label" style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Position Code *
            </label>
            <input
              type="text"
              name="code"
              value={formData.code || ""}
              onChange={handleInputChange}
              style={inputStyle}
              placeholder="e.g., POS001"
              onFocus={(e) => Object.assign(e.target.style, focusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-medium)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Title */}
          <div>
            <label className="form-label" style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Position Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title || ""}
              onChange={handleInputChange}
              style={inputStyle}
              placeholder="e.g., Senior Developer"
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
              placeholder="Position description..."
              onFocus={(e) => Object.assign(e.target.style, focusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-medium)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Department */}
          <div>
            <label className="form-label" style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Department *
            </label>
            <select
              name="departmentId"
              value={formData.departmentId || ""}
              onChange={handleInputChange}
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, focusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-medium)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">-- Select Department --</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reports To Position */}
          <div>
            <label className="form-label" style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Reports To Position
            </label>
            <select
              name="reportsToPositionId"
              value={formData.reportsToPositionId || ""}
              onChange={handleInputChange}
              style={inputStyle}
              onFocus={(e) => Object.assign(e.target.style, focusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-medium)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">-- None --</option>
              {positions
                .filter((pos) => pos._id !== selectedId) // Exclude current position
                .map((pos) => (
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
              Active Position
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
      )}

      {/* Audit Logs Modal */}
      {showAuditLogs && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '0.75rem', padding: '2rem', maxWidth: '800px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Audit Logs for Position</h2>
            {auditLogsLoading ? (
              <p>Loading...</p>
            ) : auditLogs.length === 0 ? (
              <p>No historical assignments found for this position.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-medium)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Employee</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Department</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Start Date</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>End Date</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.5rem' }}>{log.employeeProfileId?.firstName} {log.employeeProfileId?.lastName}</td>
                      <td style={{ padding: '0.5rem' }}>{log.departmentId?.name || 'N/A'}</td>
                      <td style={{ padding: '0.5rem' }}>{new Date(log.startDate).toLocaleDateString()}</td>
                      <td style={{ padding: '0.5rem' }}>{log.endDate ? new Date(log.endDate).toLocaleDateString() : 'Active'}</td>
                      <td style={{ padding: '0.5rem' }}>{log.reason || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button onClick={() => setShowAuditLogs(false)} style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: 'var(--org-structure)', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
