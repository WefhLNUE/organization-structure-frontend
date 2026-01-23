"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { checkAuth, hasRole, User } from "@/lib/auth";
import { Building2, Users, Briefcase, FileText, Plus, Eye, Edit, Trash2, Send, ChevronRight, GitBranch, Calendar } from "lucide-react";
import DepartmentsPanel from "./components/DepartmentsPanel";
import PositionsPanel from "./components/PositionsPanel";

export default function OrganizationPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'departments' | 'positions'>('departments');

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await checkAuth();
      setUser(userData);
      setLoading(false);
    };
    fetchUser();
  }, []);

  const isSystemAdmin = hasRole(user, 'System Admin');
  const isHR = hasRole(user, 'HR Manager') || hasRole(user, 'HR Admin') || hasRole(user, 'HR Employee');
  const isDeptHead = hasRole(user, 'Department Head');
  const isAnyManager = isSystemAdmin || isHR || isDeptHead;

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #ede9fe', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }} />
          <p style={{ color: '#64748b', fontWeight: 500 }}>{loading ? 'Loading...' : 'Verifying access...'}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif", zoom: 0.85 }}>
      <style>{`
        .glass-header { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10; }
        .hero-card { background: linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%); border-radius: 1.25rem; padding: 2.5rem; color: white; position: relative; overflow: hidden; }
        .hero-card::before { content: ''; position: absolute; top: -50%; right: -20%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); }
        .module-card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1.5rem; transition: all 0.3s ease; cursor: default; }
        .module-card:hover { border-color: #7c3aed; box-shadow: 0 10px 40px -10px rgba(124, 58, 237, 0.15); transform: translateY(-2px); }
        .action-link { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-radius: 0.5rem; background: #f8fafc; color: #475569; text-decoration: none; font-weight: 500; font-size: 0.875rem; transition: all 0.2s; border: 1px solid transparent; }
        .action-link:hover { background: #f5f3ff; color: #7c3aed; border-color: #ddd6fe; }
        .quick-action { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; border-radius: 0.75rem; background: white; border: 1px solid #e2e8f0; text-decoration: none; transition: all 0.2s; }
        .quick-action:hover { border-color: #7c3aed; background: #faf5ff; transform: translateY(-2px); }
        .icon-box { width: 40px; height: 40px; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
      `}</style>

      {/* Header */}
      <div className="glass-header">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.25rem' }}>
              Organization Structure
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Manage your organizational hierarchy, departments, and positions</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {isAnyManager && (
              <Link href="/organization-structure/requests/createRequest" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', color: 'white', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)' }}>
                <Plus size={18} /> New Request
              </Link>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Hero: View Hierarchy */}
        <div className="hero-card" style={{ marginBottom: '2rem' }}>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                  <GitBranch size={24} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Organization Hierarchy</h2>
              </div>
              <p style={{ opacity: 0.9, fontSize: '0.9375rem', maxWidth: '500px' }}>
                Explore and visualize your complete organizational structure, team relationships, and reporting lines.
              </p>
            </div>
            <Link href="/organization-structure/hierarchy" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'white', color: '#7c3aed', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.9375rem' }}>
              <Eye size={18} /> View Hierarchy <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Quick Actions for Managers */}
        {isAnyManager && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <Link href="/organization-structure/requests/createRequest" className="quick-action">
                <div className="icon-box" style={{ background: '#f5f3ff', color: '#7c3aed' }}><Plus size={20} /></div>
                <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8125rem' }}>New Request</span>
              </Link>
              {isSystemAdmin ? (
                <Link href="/organization-structure/reviewChange" className="quick-action">
                  <div className="icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}><FileText size={20} /></div>
                  <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8125rem' }}>View Requests</span>
                </Link>
              ) : (
                <Link href="/organization-structure/requests/myRequests" className="quick-action">
                  <div className="icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}><FileText size={20} /></div>
                  <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8125rem' }}>My Requests</span>
                </Link>
              )}
              {isSystemAdmin && (
                <>
                  <Link href="/organization-structure/requests/myRequests" className="quick-action">
                    <div className="icon-box" style={{ background: '#ecfdf5', color: '#059669' }}><Eye size={20} /></div>
                    <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8125rem' }}>My Requests</span>
                  </Link>
                  <Link href="/organization-structure/history" className="quick-action">
                    <div className="icon-box" style={{ background: '#f0f9ff', color: '#0ea5e9' }}><Calendar size={20} /></div>
                    <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8125rem' }}>History</span>
                  </Link>
                </>
              )}
              <Link href="/organization-structure/hierarchy" className="quick-action">
                <div className="icon-box" style={{ background: '#fef3c7', color: '#d97706' }}><Users size={20} /></div>
                <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8125rem' }}>Hierarchy</span>
              </Link>
            </div>
          </div>
        )}

        {/* Management Modules - System Admin Tabs */}
        {isSystemAdmin && (
          <div>
            <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
              <button
                onClick={() => setActiveTab('departments')}
                style={{
                  padding: '0.75rem 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'departments' ? '2px solid #7c3aed' : '2px solid transparent',
                  color: activeTab === 'departments' ? '#7c3aed' : '#64748b',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={18} />
                  Departments
                </div>
              </button>
              <button
                onClick={() => setActiveTab('positions')}
                style={{
                  padding: '0.75rem 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'positions' ? '2px solid #7c3aed' : '2px solid transparent',
                  color: activeTab === 'positions' ? '#7c3aed' : '#64748b',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase size={18} />
                  Positions
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {activeTab === 'departments' && <DepartmentsPanel />}
              {activeTab === 'positions' && <PositionsPanel />}
            </div>
          </div>
        )}

        {/* Non-Admin View */}
        {!isSystemAdmin && isAnyManager && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="module-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="icon-box" style={{ background: '#f5f3ff', color: '#7c3aed' }}><FileText size={20} /></div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Change Requests</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Submit and track requests</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link href="/organization-structure/requests/createRequest" className="action-link"><span><Plus size={14} style={{ marginRight: '0.5rem' }} />Create New Request</span><ChevronRight size={16} /></Link>
                <Link href="/organization-structure/requests/myRequests" className="action-link"><span><FileText size={14} style={{ marginRight: '0.5rem' }} />My Requests</span><ChevronRight size={16} /></Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
