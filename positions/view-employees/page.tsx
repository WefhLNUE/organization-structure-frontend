"use client";

import { useEffect, useState } from "react";
import { checkAuth, hasRole, User } from '@/lib/auth';
import { API_URL } from '@/lib/config';
import { Users, Briefcase, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Position = {
    _id: string;
    title: string;
    code: string;
};

type Employee = {
    _id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    position?: string;
    primaryPositionId?: string | { _id: string, title: string };
    positionId?: string | { _id: string, title: string };
};

export default function ViewPositionEmployeesPage() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [positions, setPositions] = useState<Position[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedPosId, setSelectedPosId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            const userData = await checkAuth();
            if (!userData || !hasRole(userData, 'System Admin')) {
                router.push('/employee-profile');
                return;
            }
            setUser(userData);
            setAuthLoading(false);
        };
        fetchUser();
    }, [router]);

    useEffect(() => {
        const fetchPositions = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await fetch(`${API_URL}/organization-structure/positions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    // Handle different response formats
                    let positionsArray: any[] = [];
                    if (Array.isArray(data)) {
                        positionsArray = data;
                    } else if (data && Array.isArray(data.data)) {
                        positionsArray = data.data;
                    } else if (data && Array.isArray(data.positions)) {
                        positionsArray = data.positions;
                    }
                    setPositions(positionsArray);
                }
            } catch (err) {
                console.error("Failed to fetch positions", err);
            }
        };
        fetchPositions();
    }, []);

    const handleSelectPosition = async (posId: string) => {
        setSelectedPosId(posId);
        if (!posId) {
            setEmployees([]);
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/employee-profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data: Employee[] = await res.json();
                // Filter client-side
                const filtered = data.filter(emp => {
                    const empPosId = typeof emp.positionId === 'object' ? emp.positionId?._id : emp.positionId;
                    const empPrimaryPosId = typeof emp.primaryPositionId === 'object' ? emp.primaryPositionId?._id : emp.primaryPositionId;

                    return empPosId === posId || empPrimaryPosId === posId;
                });
                setEmployees(filtered);
            }
        } catch (err) {
            console.error("Failed to fetch employees", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/organization-structure" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', color: '#64748b' }}>
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>View Position Holders</h1>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Select a position to view employees</p>
                </div>
            </div>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>Select Position</label>
                <div style={{ position: 'relative' }}>
                    <Briefcase size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#db2777' }} />
                    <select
                        value={selectedPosId}
                        onChange={(e) => handleSelectPosition(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                    >
                        <option value="">-- Choose a Position --</option>
                        {positions.map(pos => (
                            <option key={pos._id} value={pos._id}>{pos.title} ({pos.code})</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedPosId && (
                <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                    <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                            Employees ({filteredEmployees.length})
                        </h2>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading employees...</div>
                    ) : filteredEmployees.length > 0 ? (
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.75rem', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Employee</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Email</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map(emp => (
                                        <tr key={emp._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fce7f3', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.875rem' }}>
                                                        {emp.firstName[0]}{emp.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 500, color: '#0f172a' }}>{emp.firstName} {emp.lastName}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>#{emp.employeeNumber}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                                                {emp.workEmail || <span style={{ color: '#ef4444' }}>N/A</span>}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <Link href={`/employee-profile/${emp._id}`} style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none' }}>
                                                    View Profile
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ padding: '3rem', textAlign: 'center', background: 'white', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>
                            <Users size={40} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                            <p style={{ color: '#64748b', fontWeight: 500 }}>No employees found in this position.</p>
                        </div>
                    )}

                </div>
            )}

        </div>
    );
}
