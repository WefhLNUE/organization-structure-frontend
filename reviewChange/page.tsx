"use client";

import React, { useEffect, useState } from "react";
import { API_URL } from '@/lib/config';
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle, ChevronLeft, FileText, Filter, XCircle, Clock, Play, Briefcase } from "lucide-react";

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
  initiatorName?: string;
  initiatorPosition?: string;
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
        `${API_URL}/organization-structure/change-request`,
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

  const handleReview = async (reqNumber: string, action: 'APPROVE' | 'REJECT' | 'UNDER_REVIEW' | 'IMPLEMENT') => {
    setSavingId(reqNumber);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("No authentication token found. Please log in again.");
        return;
      }

      const response = await fetch(
        `${API_URL}/organization-structure/change-request/${id}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        }
      );

      if (response.ok) {
        const newStatus = action === 'REJECT' ? 'REJECTED' : action === 'UNDER_REVIEW' ? 'UNDER_REVIEW' : action === 'IMPLEMENT' ? 'IMPLEMENTED' : 'APPROVED';
        setMessage(`Request ${action.toLowerCase().replace('_', ' ')} successfully!`);
        setRequests((prev) =>
          prev.map((req) =>
            req.requestNumber === reqNumber ? { ...req, status: newStatus } : req
          )
        );
      } else {
        const error = await response.text();
        setMessage(`Error: ${error}`);
      }
    } catch (error) {
      setMessage("Network error while submitting review.");
    } finally {
      setSavingId(null);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const styles: Record<string, { bg: string, color: string, icon: any }> = {
      APPROVED: { bg: '#ecfdf5', color: '#047857', icon: CheckCircle },
      REJECTED: { bg: '#fef2f2', color: '#b91c1c', icon: AlertCircle },
      UNDER_REVIEW: { bg: '#fffbeb', color: '#b45309', icon: Filter },
      SUBMITTED: { bg: '#eff6ff', color: '#1d4ed8', icon: FileText },
      DRAFT: { bg: '#f9fafb', color: '#374151', icon: FileText },
      CANCELED: { bg: '#f3f4f6', color: '#4b5563', icon: AlertCircle },
      IMPLEMENTED: { bg: '#f5f3ff', color: '#6d28d9', icon: CheckCircle },
    };
    return styles[status] || { bg: '#f9fafb', color: '#374151', icon: FileText };
  };

  const router = useRouter();

  // Stats calculation
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length,
    processed: requests.filter(r => ['APPROVED', 'REJECTED', 'IMPLEMENTED', 'CANCELED'].includes(r.status)).length,
    notFinalized: requests.filter(r => !['REJECTED', 'IMPLEMENTED', 'CANCELED'].includes(r.status)).length
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', zoom: 0.85, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        :root {
          --primary-50: #f5f3ff;
          --primary-100: #ede9fe;
          --primary-600: #7c3aed;
          --primary-700: #6d28d9;
          --slate-50: #f8fafc;
          --slate-100: #f1f5f9;
          --slate-200: #e2e8f0;
          --slate-300: #cbd5e1;
          --slate-400: #94a3b8;
          --slate-500: #64748b;
          --slate-600: #475569;
          --slate-700: #334155;
          --slate-800: #1e293b;
          --slate-900: #0f172a;
          --radius-md: 0.75rem;
          --radius-lg: 1.25rem;
          --shadow-premium: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
        }
        
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }

        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fadeIn 0.4s ease forwards; }

        .glass-panel { 
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.4);
        }

        .btn-primary { 
          background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%);
          color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; 
          font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; align-items: center; gap: 0.625rem;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(124, 58, 237, 0.35); filter: brightness(1.05); }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-secondary { 
          background: white; color: var(--slate-700); border: 1px solid var(--slate-200); 
          padding: 0.625rem 1.25rem; border-radius: 0.75rem; 
          font-weight: 600; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .btn-secondary:hover { background: var(--slate-50); border-color: var(--slate-300); transform: translateX(-4px); }

        .premium-card { 
          background: white; border: 1px solid var(--slate-200); border-radius: var(--radius-lg); 
          box-shadow: var(--shadow-premium); transition: all 0.3s ease;
        }
        .premium-card:hover { border-color: var(--primary-200); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }

        .stats-card {
          flex: 1; padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--slate-100);
          background: white; display: flex; flex-direction: column; gap: 0.5rem;
          transition: transform 0.3s ease; cursor: default;
        }
        .stats-card:hover { transform: translateY(-4px); border-color: var(--primary-100); }

        .badge { display: inline-flex; align-items: center; padding: 0.375rem 0.875rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; gap: 0.45rem; letter-spacing: 0.025em; }
        
        table { width: 100%; border-collapse: separate; border-spacing: 0; }
        th { 
          padding: 1.25rem 1.5rem; text-align: left; font-size: 0.75rem; 
          text-transform: uppercase; letter-spacing: 0.1em; color: var(--slate-500); 
          font-weight: 800; border-bottom: 1px solid var(--slate-200); 
          background: var(--slate-50);
        }
        td { padding: 1.5rem; font-size: 0.9375rem; color: var(--slate-700); border-bottom: 1px solid var(--slate-50); vertical-align: middle; }
        tr:hover td { background-color: rgba(124, 58, 237, 0.015); }
        tr:last-child td { border-bottom: none; }
      `}</style>

      {/* Hero Header */}
      <div className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--slate-200)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <button onClick={() => router.push('/organization-structure')} className="btn-secondary">
                <ChevronLeft size={20} /> Dashboard
              </button>
              <div style={{ height: '32px', width: '1px', backgroundColor: 'var(--slate-200)' }} />
              <div>
                <h1 style={{
                  fontSize: '1.875rem', fontWeight: 800,
                  background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>Review Requests</h1>
                <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', fontWeight: 500 }}>Structural Modification Command Center</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className="badge animate-fade-in" style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', padding: '0.625rem 1.25rem' }}>
                <FileText size={18} /> {stats.total} Requests
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2.5rem 2rem 5rem' }}>

        {/* Stats Ribbon */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem' }} className="animate-slide-up">
          <div className="stats-card premium-card">
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 700, textTransform: 'uppercase' }}>Total Requests</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--slate-900)' }}>{stats.total}</span>
              <div style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                <FileText size={20} />
              </div>
            </div>
          </div>
          <div className="stats-card premium-card">
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 700, textTransform: 'uppercase' }}>Attention Required</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#b45309' }}>{stats.pending}</span>
              <div style={{ backgroundColor: '#fffbeb', color: '#d97706', padding: '0.5rem', borderRadius: '0.5rem' }}>
                <AlertCircle size={20} />
              </div>
            </div>
          </div>
          <div className="stats-card premium-card">
            <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 700, textTransform: 'uppercase' }}>Processed</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#047857' }}>{stats.processed}</span>
              <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '0.5rem', borderRadius: '0.5rem' }}>
                <CheckCircle size={20} />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.25rem' }}>
              {stats.notFinalized} Not Finalized
            </div>
          </div>
        </div>

        {message && (
          <div style={{
            padding: '1.25rem 1.5rem', marginBottom: '2.5rem', borderRadius: '1rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
            backgroundColor: message.includes('Error') ? '#fef2f2' : '#ecfdf5',
            color: message.includes('Error') ? '#b91c1c' : '#047857',
            border: `1px solid ${message.includes('Error') ? '#fecaca' : '#a7f3d0'}`,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            animation: 'fadeIn 0.3s ease'
          }}>
            {message.includes('Error') ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>{message}</span>
            <button onClick={() => setMessage("")} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
          </div>
        )}

        <div className="premium-card animate-slide-up" style={{ overflow: 'hidden', padding: 0 }}>
          {loading ? (
            <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', border: '5px solid #ede9fe', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 2rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>Syncing with Database</h3>
              <p style={{ color: 'var(--slate-500)', fontWeight: 500 }}>Preparing high-fidelity organizational data...</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: '1100px' }}>
                <thead>
                  <tr>
                    <th>Identifier</th>
                    <th>Request Type</th>
                    <th>Initiator</th>
                    <th>Details</th>
                    <th>Strategic Reason</th>
                    <th>Current Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const badge = getStatusBadgeStyle(req.status);
                    const Icon = badge.icon;
                    return (
                      <tr key={req._id}>
                        <td style={{ fontWeight: 800, color: 'var(--slate-900)' }}>
                          <span style={{ color: 'var(--slate-300)', fontSize: '0.8rem', fontWeight: 400 }}>REQ-</span>
                          {req.requestNumber}
                        </td>
                        <td>
                          <div className="badge" style={{ backgroundColor: 'var(--slate-100)', color: 'var(--slate-700)', border: '1px solid var(--slate-200)', fontSize: '0.7rem' }}>
                            <Briefcase size={12} />
                            {req.requestType.replace(/_/g, ' ')}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-100)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                              {(req.initiatorName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{req.initiatorName || 'Unknown'}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{req.initiatorPosition || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ maxWidth: '280px', lineHeight: '1.6', fontSize: '0.875rem' }}>{req.details}</div>
                        </td>
                        <td>
                          <div style={{ maxWidth: '280px', lineHeight: '1.6', color: 'var(--slate-500)', fontStyle: 'italic', fontSize: '0.875rem' }}>
                            "{req.reason}"
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{ backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.color}20` }}>
                            <Icon size={14} />
                            {req.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {/* SUBMITTED: Approve, Reject, Under Review */}
                            {req.status === 'SUBMITTED' && (
                              <>
                                <button onClick={() => handleReview(req.requestNumber, 'APPROVE')} disabled={savingId === req.requestNumber} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                                  <CheckCircle size={14} /> Approve
                                </button>
                                <button onClick={() => handleReview(req.requestNumber, 'REJECT')} disabled={savingId === req.requestNumber} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <XCircle size={14} /> Reject
                                </button>
                                <button onClick={() => handleReview(req.requestNumber, 'UNDER_REVIEW')} disabled={savingId === req.requestNumber} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Clock size={14} /> Review
                                </button>
                              </>
                            )}
                            {/* UNDER_REVIEW: Approve, Reject */}
                            {req.status === 'UNDER_REVIEW' && (
                              <>
                                <button onClick={() => handleReview(req.requestNumber, 'APPROVE')} disabled={savingId === req.requestNumber} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                                  <CheckCircle size={14} /> Approve
                                </button>
                                <button onClick={() => handleReview(req.requestNumber, 'REJECT')} disabled={savingId === req.requestNumber} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <XCircle size={14} /> Reject
                                </button>
                              </>
                            )}
                            {/* APPROVED: Implement */}
                            {req.status === 'APPROVED' && (
                              <button onClick={() => handleReview(req.requestNumber, 'IMPLEMENT')} disabled={savingId === req.requestNumber} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Play size={14} /> Implement
                              </button>
                            )}
                            {/* REJECTED / IMPLEMENTED / CANCELED: No actions */}
                            {['REJECTED', 'IMPLEMENTED', 'CANCELED'].includes(req.status) && (
                              <div style={{ color: 'var(--slate-400)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle size={14} /> Finalized
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '8rem 2rem', textAlign: 'center' }}>
                        <div style={{ backgroundColor: 'var(--slate-50)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--slate-300)' }}>
                          <FileText size={32} />
                        </div>
                        <h4 style={{ color: 'var(--slate-900)', fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Clear Horizon</h4>
                        <p style={{ color: 'var(--slate-500)', fontWeight: 500 }}>No organizational change requests currently await your attention.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
