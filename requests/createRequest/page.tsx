"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Send, Save, Building2, Briefcase, UserPlus, Edit, X, CheckCircle, AlertCircle } from "lucide-react";

const REQUEST_TYPES = [
    { value: 'NEW_DEPARTMENT', label: 'New Department', icon: Building2, description: 'Request to create a new department' },
    { value: 'UPDATE_DEPARTMENT', label: 'Update Department', icon: Edit, description: 'Request to modify an existing department' },
    { value: 'NEW_POSITION', label: 'New Position', icon: UserPlus, description: 'Request to create a new position' },
    { value: 'UPDATE_POSITION', label: 'Update Position', icon: Briefcase, description: 'Request to modify an existing position' },
    { value: 'CLOSE_POSITION', label: 'Close Position', icon: X, description: 'Request to deactivate a position' },
];

interface Department { _id: string; name: string; code: string; }
interface Position { _id: string; title: string; code: string; }
interface Employee { _id: string; firstName: string; lastName: string; }

export default function CreateRequestPage() {
    const router = useRouter();
    const [requestType, setRequestType] = useState('');
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form fields
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedPosition, setSelectedPosition] = useState('');
    const [newDepartmentName, setNewDepartmentName] = useState('');
    const [newPositionTitle, setNewPositionTitle] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const [deptRes, posRes, empRes] = await Promise.all([
                fetch('http://localhost:5000/organization-structure/departments', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('http://localhost:5000/organization-structure/positions', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('http://localhost:5000/employee-profile', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (deptRes.ok) setDepartments(await deptRes.json());
            if (posRes.ok) setPositions(await posRes.json());
            if (empRes.ok) setEmployees(await empRes.json());
        } catch (err) {
            console.error('Failed to load data', err);
        }
    };

    const handleSubmit = async (asDraft: boolean) => {
        if (!requestType) {
            setMessage({ type: 'error', text: 'Please select a request type' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage({ type: 'error', text: 'Not authenticated' });
                return;
            }

            let endpoint = '';
            let body: any = { asDraft, reason };

            if (requestType === 'UPDATE_DEPARTMENT') {
                endpoint = '/organization-structure/change-request/department';
                body = { ...body, employeeId: selectedEmployee, oldDept: '', newDept: selectedDepartment };
            } else if (requestType === 'UPDATE_POSITION') {
                endpoint = '/organization-structure/change-request/position';
                body = { ...body, employeeId: selectedEmployee, oldPos: '', newPos: selectedPosition, customPositionTitle: newPositionTitle || undefined };
            } else {
                // For NEW_DEPARTMENT, NEW_POSITION, CLOSE_POSITION - use generic endpoint
                endpoint = '/organization-structure/change-request/generic';
                body = {
                    asDraft,
                    requestType,
                    details: requestType === 'NEW_DEPARTMENT' ? `Create new department: ${newDepartmentName}` :
                        requestType === 'NEW_POSITION' ? `Create new position: ${newPositionTitle}` :
                            `Close position: ${positions.find(p => p._id === selectedPosition)?.title}`,
                    reason,
                    targetDepartmentId: selectedDepartment || undefined,
                    targetPositionId: selectedPosition || undefined,
                };
            }

            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: asDraft ? 'Request saved as draft!' : 'Request submitted successfully!' });
                setTimeout(() => router.push('/organization-structure/requests/myRequests'), 1500);
            } else {
                const error = await response.text();
                setMessage({ type: 'error', text: `Error: ${error}` });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Network error' });
        } finally {
            setLoading(false);
        }
    };

    const renderFields = () => {
        switch (requestType) {
            case 'NEW_DEPARTMENT':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ fontWeight: 600, color: '#334155' }}>New Department Name</label>
                        <input
                            type="text"
                            value={newDepartmentName}
                            onChange={(e) => setNewDepartmentName(e.target.value)}
                            placeholder="e.g., Customer Success"
                            style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                        />
                    </div>
                );
            case 'UPDATE_DEPARTMENT':
                return (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, color: '#334155' }}>Employee</label>
                            <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                <option value="">Select Employee</option>
                                {employees.map(e => <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, color: '#334155' }}>New Department</label>
                            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                <option value="">Select Department</option>
                                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                            </select>
                        </div>
                    </>
                );
            case 'NEW_POSITION':
                return (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, color: '#334155' }}>New Position Title</label>
                            <input
                                type="text"
                                value={newPositionTitle}
                                onChange={(e) => setNewPositionTitle(e.target.value)}
                                placeholder="e.g., Senior Developer"
                                style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, color: '#334155' }}>Department (Optional)</label>
                            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                <option value="">Select Department</option>
                                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                            </select>
                        </div>
                    </>
                );
            case 'UPDATE_POSITION':
                return (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, color: '#334155' }}>Employee</label>
                            <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                <option value="">Select Employee</option>
                                {employees.map(e => <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, color: '#334155' }}>New Position</label>
                            <select value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                <option value="">Select Position</option>
                                {positions.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, color: '#334155' }}>Or Enter Custom Title</label>
                            <input
                                type="text"
                                value={newPositionTitle}
                                onChange={(e) => setNewPositionTitle(e.target.value)}
                                placeholder="Custom position title (optional)"
                                style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                            />
                        </div>
                    </>
                );
            case 'CLOSE_POSITION':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 600, color: '#334155' }}>Position to Close</label>
                        <select value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                            <option value="">Select Position</option>
                            {positions.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                        </select>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif", zoom: 0.85 }}>
            <style>{`
        .btn-primary { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25); transition: all 0.2s; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(124, 58, 237, 0.35); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary { background: white; color: #334155; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
        .btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }
        .type-card { padding: 1rem; border-radius: 0.75rem; border: 2px solid #e2e8f0; cursor: pointer; transition: all 0.2s; background: white; }
        .type-card:hover { border-color: #7c3aed; background: #faf5ff; }
        .type-card.selected { border-color: #7c3aed; background: #f5f3ff; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1); }
      `}</style>

            {/* Header */}
            <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '1.5rem 2rem', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button onClick={() => router.push('/organization-structure')} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                        <ChevronLeft size={20} /> Back
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Create Change Request
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Submit a structural modification request</p>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
                {message && (
                    <div style={{
                        padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.75rem',
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        backgroundColor: message.type === 'error' ? '#fef2f2' : '#ecfdf5',
                        color: message.type === 'error' ? '#b91c1c' : '#047857',
                        border: `1px solid ${message.type === 'error' ? '#fecaca' : '#a7f3d0'}`
                    }}>
                        {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                        {message.text}
                    </div>
                )}

                {/* Step 1: Select Request Type */}
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>1. Select Request Type</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {REQUEST_TYPES.map((type) => {
                            const Icon = type.icon;
                            return (
                                <div
                                    key={type.value}
                                    className={`type-card ${requestType === type.value ? 'selected' : ''}`}
                                    onClick={() => setRequestType(type.value)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <div style={{ backgroundColor: requestType === type.value ? '#7c3aed' : '#f1f5f9', color: requestType === type.value ? 'white' : '#64748b', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                            <Icon size={18} />
                                        </div>
                                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{type.label}</span>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{type.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step 2: Request Details */}
                {requestType && (
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: '#1e293b' }}>2. Request Details</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {renderFields()}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 600, color: '#334155' }}>Reason / Justification</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Provide a reason for this request..."
                                    rows={3}
                                    style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '1rem', resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {requestType && (
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleSubmit(true)} disabled={loading} className="btn-secondary">
                            <Save size={18} /> Save as Draft
                        </button>
                        <button onClick={() => handleSubmit(false)} disabled={loading} className="btn-primary">
                            <Send size={18} /> {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
