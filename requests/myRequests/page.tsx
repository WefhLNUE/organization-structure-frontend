"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, FileText, Send, XCircle, CheckCircle, AlertCircle, Clock, Filter, Briefcase, Building2 } from "lucide-react";

interface ChangeRequest {
    _id: string;
    requestNumber: string;
    requestType: string;
    details: string;
    reason: string;
    status: string;
    submittedAt?: string;
    createdAt?: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; icon: any }> = {
    DRAFT: { bg: '#f9fafb', color: '#374151', icon: FileText },
    SUBMITTED: { bg: '#eff6ff', color: '#1d4ed8', icon: Send },
    UNDER_REVIEW: { bg: '#fffbeb', color: '#b45309', icon: Clock },
    APPROVED: { bg: '#ecfdf5', color: '#047857', icon: CheckCircle },
    REJECTED: { bg: '#fef2f2', color: '#b91c1c', icon: XCircle },
    CANCELED: { bg: '#f3f4f6', color: '#4b5563', icon: XCircle },
    IMPLEMENTED: { bg: '#f5f3ff', color: '#6d28d9', icon: CheckCircle },
};

export default function MyRequestsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<ChangeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState('ALL');

    useEffect(() => {
        loadMyRequests();
    }, []);

    const loadMyRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('http://localhost:5000/organization-structure/change-request/my', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setRequests(await res.json());
            }
        } catch (err) {
            console.error('Failed to load requests', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'submit' | 'cancel') => {
        setActionLoading(id);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const endpoint = action === 'submit' ? 'submit' : 'cancel';
            const res = await fetch(`http://localhost:5000/organization-structure/change-request/${id}/${endpoint}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setMessage({ type: 'success', text: `Request ${action === 'submit' ? 'submitted' : 'canceled'} successfully!` });
                loadMyRequests();
            } else {
                const error = await res.text();
                setMessage({ type: 'error', text: `Error: ${error}` });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error' });
        } finally {
            setActionLoading(null);
        }
    };

    const filteredRequests = filterStatus === 'ALL' ? requests : requests.filter(r => r.status === filterStatus);

    const stats = {
        total: requests.length,
        drafts: requests.filter(r => r.status === 'DRAFT').length,
        pending: requests.filter(r => ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)).length,
        completed: requests.filter(r => ['APPROVED', 'REJECTED', 'IMPLEMENTED', 'CANCELED'].includes(r.status)).length,
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif", zoom: 0.85 }}>
            <style>{`
        .btn-primary { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; transition: all 0.2s; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary { background: white; color: #334155; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; transition: all 0.2s; }
        .btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }
        .btn-danger { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; }
        .stats-card { flex: 1; padding: 1.25rem; background: white; border-radius: 0.75rem; border: 1px solid #e2e8f0; }
        .filter-btn { padding: 0.5rem 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-weight: 500; font-size: 0.8125rem; transition: all 0.2s; }
        .filter-btn.active { background: #7c3aed; color: white; border-color: #7c3aed; }
      `}</style>

            {/* Header */}
            <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '1.5rem 2rem', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button onClick={() => router.push('/organization-structure')} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                            <ChevronLeft size={18} /> Back
                        </button>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                My Requests
                            </h1>
                            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Track and manage your change requests</p>
                        </div>
                    </div>
                    <button onClick={() => router.push('/organization-structure/requests/createRequest')} className="btn-primary">
                        + New Request
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                {message && (
                    <div style={{
                        padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.75rem',
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        backgroundColor: message.type === 'error' ? '#fef2f2' : '#ecfdf5',
                        color: message.type === 'error' ? '#b91c1c' : '#047857',
                    }}>
                        {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                        {message.text}
                    </div>
                )}

                {/* Stats */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="stats-card">
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>{stats.total}</div>
                    </div>
                    <div className="stats-card">
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Drafts</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#374151' }}>{stats.drafts}</div>
                    </div>
                    <div className="stats-card">
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Pending</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309' }}>{stats.pending}</div>
                    </div>
                    <div className="stats-card">
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Completed</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857' }}>{stats.completed}</div>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {['ALL', 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTED', 'CANCELED'].map(status => (
                        <button
                            key={status}
                            className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                            onClick={() => setFilterStatus(status)}
                        >
                            {status === 'ALL' ? 'All' : status.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {/* Requests Table */}
                <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Loading your requests...</div>
                    ) : filteredRequests.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                            <FileText size={48} style={{ marginBottom: '1rem', color: '#cbd5e1' }} />
                            <p>No requests found</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Request #</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Details</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map(req => {
                                    const statusStyle = STATUS_COLORS[req.status] || STATUS_COLORS.DRAFT;
                                    const StatusIcon = statusStyle.icon;
                                    return (
                                        <tr key={req._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem', fontWeight: 700, color: '#1e293b' }}>{req.requestNumber}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', backgroundColor: '#f1f5f9', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                                                    {req.requestType.includes('DEPARTMENT') ? <Building2 size={12} /> : <Briefcase size={12} />}
                                                    {req.requestType.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', color: '#475569', fontSize: '0.875rem', maxWidth: '300px' }}>{req.details}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                                    padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                                                    backgroundColor: statusStyle.bg, color: statusStyle.color
                                                }}>
                                                    <StatusIcon size={12} /> {req.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {req.status === 'DRAFT' && (
                                                        <>
                                                            <button onClick={() => handleAction(req.requestNumber, 'submit')} disabled={actionLoading === req.requestNumber} className="btn-primary">
                                                                <Send size={14} /> Submit
                                                            </button>
                                                            <button onClick={() => handleAction(req.requestNumber, 'cancel')} disabled={actionLoading === req.requestNumber} className="btn-danger">
                                                                <XCircle size={14} /> Delete
                                                            </button>
                                                        </>
                                                    )}
                                                    {req.status === 'SUBMITTED' && (
                                                        <button onClick={() => handleAction(req.requestNumber, 'cancel')} disabled={actionLoading === req.requestNumber} className="btn-danger">
                                                            <XCircle size={14} /> Cancel
                                                        </button>
                                                    )}
                                                    {['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'IMPLEMENTED', 'CANCELED'].includes(req.status) && (
                                                        <span style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>—</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
