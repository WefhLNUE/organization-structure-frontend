"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Filter, Building2, Briefcase, Search, Calendar, User, FileText } from 'lucide-react';
import { checkAuth, hasRole, User as AuthUser } from "@/lib/auth";

type DepartmentAssignment = {
    _id: string;
    departmentId: { _id: string; name: string; code: string };
    employeeProfileId: { firstName: string; lastName: string; employeeNumber: string };
    startDate: string;
    endDate?: string;
    reason?: string;
    createdAt: string;
};

type PositionAssignment = {
    _id: string;
    positionId: { _id: string; title: string; code: string };
    departmentId?: { _id: string; name: string; code: string };
    employeeProfileId: { firstName: string; lastName: string; employeeNumber: string };
    startDate: string;
    endDate?: string;
    reason?: string;
    createdAt: string;
};

export default function AssignmentHistoryPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Data States
    const [deptAssignments, setDeptAssignments] = useState<DepartmentAssignment[]>([]);
    const [posAssignments, setPosAssignments] = useState<PositionAssignment[]>([]);

    // UI States
    const [activeTab, setActiveTab] = useState<'positions' | 'departments'>('positions');
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchHistory = async () => {
        setRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch both (or optimize to fetch only active tab)
            const [deptRes, posRes] = await Promise.all([
                fetch('http://localhost:5000/organization-structure/assignments/departments', { headers }),
                fetch('http://localhost:5000/organization-structure/assignments/positions', { headers })
            ]);

            if (deptRes.ok) setDeptAssignments(await deptRes.json());
            if (posRes.ok) setPosAssignments(await posRes.json());

        } catch (error) {
            console.error("Failed to fetch assignment history", error);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const userData = await checkAuth();
            setUser(userData);
            if (hasRole(userData, 'System Admin')) {
                await fetchHistory();
            } else {
                setLoading(false);
            }
        };
        init();
    }, []);

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading history...</div>;
    }

    if (!hasRole(user, 'System Admin')) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>Access Denied</div>;
    }

    // Filtering Logic
    const filteredData = activeTab === 'departments'
        ? deptAssignments.filter(log =>
            log.employeeProfileId?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.employeeProfileId?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.departmentId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.reason?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : posAssignments.filter(log =>
            log.employeeProfileId?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.employeeProfileId?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.positionId?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.reason?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem', fontFamily: "'Inter', sans-serif" }}>

            {/* Header */}
            <div style={{ maxWidth: '1200px', margin: '0 auto 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/organization-structure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', textDecoration: 'none' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Assignment History</h1>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Track all employee movements and assignments</p>
                    </div>
                </div>
                <button
                    onClick={fetchHistory}
                    disabled={refreshing}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer', color: '#64748b' }}
                >
                    <RefreshCw size={16} className={refreshing ? 'spin' : ''} /> Refresh
                </button>
            </div>

            <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

            {/* Main Content Card */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

                {/* Tabs & Search */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem' }}>
                        <button
                            onClick={() => setActiveTab('positions')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                background: activeTab === 'positions' ? 'white' : 'transparent',
                                color: activeTab === 'positions' ? '#7c3aed' : '#64748b',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: activeTab === 'positions' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Briefcase size={16} /> Positions
                        </button>
                        <button
                            onClick={() => setActiveTab('departments')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                background: activeTab === 'departments' ? 'white' : 'transparent',
                                color: activeTab === 'departments' ? '#7c3aed' : '#64748b',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: activeTab === 'departments' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Building2 size={16} /> Departments
                        </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search history..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', outline: 'none', width: '300px' }}
                        />
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>Date</th>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>Employee</th>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>{activeTab === 'departments' ? 'Department' : 'Position'}</th>
                                {activeTab === 'positions' && <th style={{ padding: '1rem', fontWeight: 600 }}>Department</th>}
                                <th style={{ padding: '1rem', fontWeight: 600 }}>Active Period</th>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? (
                                filteredData.map((log) => (
                                    <tr key={log._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}>
                                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                                            <Calendar size={14} />
                                            {new Date(log.startDate).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    {log.employeeProfileId?.firstName?.[0]}
                                                </div>
                                                <span style={{ fontWeight: 500, color: '#334155' }}>
                                                    {log.employeeProfileId ? `${log.employeeProfileId.firstName} ${log.employeeProfileId.lastName}` : 'Unknown'}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '2rem' }}>{log.employeeProfileId?.employeeNumber}</span>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 500, color: '#0f172a' }}>
                                            {activeTab === 'departments'
                                                ? (log as DepartmentAssignment).departmentId?.name || 'Unknown'
                                                : (log as PositionAssignment).positionId?.title || 'Unknown'
                                            }
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                {activeTab === 'departments'
                                                    ? (log as DepartmentAssignment).departmentId?.code
                                                    : (log as PositionAssignment).positionId?.code
                                                }
                                            </div>
                                        </td>
                                        {activeTab === 'positions' && (
                                            <td style={{ padding: '1rem', color: '#64748b' }}>
                                                {(log as PositionAssignment).departmentId?.name || '-'}
                                            </td>
                                        )}
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: log.endDate ? '#f1f5f9' : '#dcfce7', color: log.endDate ? '#64748b' : '#16a34a', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500 }}>
                                                {log.endDate ? (
                                                    <>Archive ({new Date(log.endDate).toLocaleDateString()})</>
                                                ) : (
                                                    <>Active</>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#64748b', fontStyle: 'italic' }}>
                                            {log.reason || '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={activeTab === 'positions' ? 6 : 5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                        <div style={{ marginBottom: '1rem' }}><FileText size={32} opacity={0.5} /></div>
                                        No assignment history found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ padding: '1rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textAlign: 'right' }}>
                    Total Records: {filteredData.length}
                </div>
            </div>
        </div>
    );
}
