'use client';

import Link from 'next/link';
import { Building2, Plus, Edit, Trash2, ArrowRight, Users } from 'lucide-react';

export default function DepartmentsPanel() {
    return (
        <div style={{ width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .dept-action-card {
                    display: flex;
                    flex-direction: column;
                    padding: 1.5rem;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 1rem;
                    text-decoration: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }
                .dept-action-card:hover {
                    border-color: #3b82f6;
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px -8px rgba(59, 130, 246, 0.15);
                }
                .dept-action-card:hover .arrow-icon {
                    opacity: 1;
                    transform: translateX(0);
                }
                .dept-icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1rem;
                    transition: transform 0.3s ease;
                }
                .dept-action-card:hover .dept-icon-wrapper {
                    transform: scale(1.1);
                }
                .arrow-icon {
                    position: absolute;
                    top: 1.5rem;
                    right: 1.5rem;
                    color: #94a3b8;
                    opacity: 0;
                    transform: translateX(-10px);
                    transition: all 0.3s ease;
                }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '0.75rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '12px', color: '#2563eb', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1)' }}>
                    <Building2 size={28} />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Departments</h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>Manage organizational units and structures</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                {/* Create */}
                <Link href="/organization-structure/departments/create" className="dept-action-card">
                    <ArrowRight className="arrow-icon" size={20} />
                    <div className="dept-icon-wrapper" style={{ background: '#eff6ff', color: '#2563eb' }}>
                        <Plus size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>Create Department</h3>
                        <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>Add a new department to the organization structure.</p>
                    </div>
                </Link>

                {/* Update */}
                <Link href="/organization-structure/departments/update" className="dept-action-card">
                    <ArrowRight className="arrow-icon" size={20} />
                    <div className="dept-icon-wrapper" style={{ background: '#f0f9ff', color: '#0284c7' }}>
                        <Edit size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>Update Department</h3>
                        <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>Modify details of an existing department.</p>
                    </div>
                </Link>

                {/* Delete */}
                <Link href="/organization-structure/departments/delete" className="dept-action-card">
                    <ArrowRight className="arrow-icon" size={20} />
                    <div className="dept-icon-wrapper" style={{ background: '#fef2f2', color: '#ef4444' }}>
                        <Trash2 size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>Delete Department</h3>
                        <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>Remove a department from the system.</p>
                    </div>
                </Link>

                {/* View Employees */}
                <Link href="/organization-structure/departments/view-employees" className="dept-action-card">
                    <ArrowRight className="arrow-icon" size={20} />
                    <div className="dept-icon-wrapper" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                        <Users size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>View Employees</h3>
                        <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.5 }}>See all employees in a department.</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
