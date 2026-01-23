"use client";

import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import EmployeeCard from "./EmployeeCard";

interface EmployeeHierarchy {
  id: string;
  name: string;
  department: string | null;
  position: string | null;
  ancestors?: { id: string; name: string; position: string | null; department: string | null }[];
}

interface TeamMember {
  id: string;
  name: string;
  position: string | null;
  department: string | null;
  children?: TeamMember[];
}

interface HierarchyData {
  employeeHierarchy: EmployeeHierarchy;
  teamStructure: TeamMember[];
}

interface FullTreeData {
  tree: TeamMember[];
  totalEmployees: number;
}

interface DecodedToken {
  id: string | null;
  roles?: string[];
}

export default function ViewHierarchyPage() {
  const [hierarchy, setHierarchy] = useState<HierarchyData | null>(null);
  const [fullTree, setFullTree] = useState<FullTreeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [canSeeFullTree, setCanSeeFullTree] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState<string>("");
  const searchParams = useSearchParams();
  const targetId = searchParams.get("id");
  const [departments, setDepartments] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setMessage("");
    setHierarchy(null);
    setFullTree(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("No authentication token found. Please log in again.");
        return;
      }

      const decoded = jwtDecode(token) as DecodedToken;

      if (!decoded.id) {
        setMessage("User ID not found in token.");
        return;
      }

      const isSysAdmin = decoded.roles?.includes("System Admin") ?? false;
      const isHR = decoded.roles?.some(r => ["HR Manager", "HR Admin", "HR Employee"].includes(r)) ?? false;
      setIsSystemAdmin(isSysAdmin);

      const shouldSeeFullTree = isSysAdmin;
      setCanSeeFullTree(shouldSeeFullTree);

      const requestedId = targetId || decoded.id;

      if (shouldSeeFullTree && !targetId) {
        const response = await fetch(
          `http://localhost:5000/organization-structure/full-tree`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setFullTree(data);
        } else {
          const error = await response.text();
          setMessage(`Error: ${error}`);
        }
      } else {
        const response = await fetch(
          `http://localhost:5000/organization-structure/hierarchy/${requestedId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setHierarchy(data);
        } else {
          const error = await response.text();
          setMessage(`Error: ${error}`);
        }
      }
    } catch (error) {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [targetId]);

  useEffect(() => {
    if (fullTree) {
      const deps = new Set<string>();
      const traverse = (nodes: TeamMember[]) => {
        nodes.forEach(n => {
          if (n.department) deps.add(n.department);
          if (n.children) traverse(n.children);
        });
      };
      traverse(fullTree.tree);
      setDepartments(Array.from(deps).sort());
    }
  }, [fullTree]);

  // Helper function to sort employees by position so same roles are grouped together
  const sortByPosition = (nodes: TeamMember[]): TeamMember[] => {
    return [...nodes].sort((a, b) => {
      const posA = a.position || '';
      const posB = b.position || '';
      return posA.localeCompare(posB);
    });
  };

  // Recursively apply sorting to children as well
  const sortTreeByPosition = (nodes: TeamMember[]): TeamMember[] => {
    return sortByPosition(nodes).map(node => ({
      ...node,
      children: node.children ? sortTreeByPosition(node.children) : undefined
    }));
  };

  const getFilteredTree = () => {
    let result: TeamMember[];

    if (!filterDepartment || !fullTree) {
      result = fullTree?.tree || [];
    } else {
      const matches: TeamMember[] = [];
      const traverse = (nodes: TeamMember[]) => {
        nodes.forEach(n => {
          if (n.department === filterDepartment) {
            matches.push(n);
          } else {
            if (n.children) traverse(n.children);
          }
        });
      };
      traverse(fullTree.tree);
      result = matches;
    }

    // Sort so employees with the same position are grouped together
    return sortTreeByPosition(result);
  };

  const handleAssignSupervisor = async (employeeId: string, newSupervisorId: string | null) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `http://localhost:5000/organization-structure/hierarchy/assign-supervisor`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ employeeId, newSupervisorId }),
        }
      );

      if (response.ok) {
        fetchData();
      } else {
        const error = await response.text();
        alert(`Failed to assign supervisor: ${error}`);
      }
    } catch (error) {
      alert("Network error while assigning supervisor");
    }
  };

  const TreeNode = ({ employee, isLast = false }: { employee: TeamMember; isLast?: boolean }) => {
    const hasChildren = employee.children && employee.children.length > 0;
    const lineColor = '#CBD5E0';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <EmployeeCard
          id={employee.id}
          name={employee.name}
          position={employee.position}
          department={employee.department}
          onDrop={isSystemAdmin ? handleAssignSupervisor : undefined}
        />

        {hasChildren && (
          <div style={{
            width: '2px',
            height: '40px',
            backgroundColor: lineColor,
          }} />
        )}

        {hasChildren && (
          <div style={{ display: 'flex', gap: '3rem', position: 'relative' }}>
            {/* Horizontal Connector Line */}
            {employee.children!.length > 1 && (
              <div style={{
                position: 'absolute',
                top: '0',
                left: '50%',
                transform: 'translateX(-50%)',
                width: `calc(100% - 3rem)`, // Matches gap
                height: '2px',
                backgroundColor: lineColor,
              }} />
            )}

            {employee.children!.map((child, index) => (
              <div key={child.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Vertical Connector to Child */}
                {employee.children!.length > 1 && (
                  <div style={{
                    width: '2px',
                    height: '40px',
                    backgroundColor: lineColor,
                  }} />
                )}
                {/* Adjust margin if single child to keep spacing consistent */}
                <div style={{ marginTop: employee.children!.length > 1 ? '0' : '0' }}>
                  <TreeNode employee={child} isLast={index === employee.children!.length - 1} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPersonalHierarchy = () => {
    if (!hierarchy) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>

        {/* Ancestors Chain */}
        {hierarchy.employeeHierarchy.ancestors && hierarchy.employeeHierarchy.ancestors.map((ancestor) => (
          <React.Fragment key={ancestor.id}>
            <EmployeeCard
              id={ancestor.id}
              name={ancestor.name}
              position={ancestor.position}
              department={ancestor.department}
              onDrop={isSystemAdmin ? handleAssignSupervisor : undefined}
            />
            <div style={{ width: '2px', height: '40px', backgroundColor: '#CBD5E0' }} />
          </React.Fragment>
        ))}

        {/* Self */}
        <EmployeeCard
          id={hierarchy.employeeHierarchy.id}
          name={hierarchy.employeeHierarchy.name}
          position={hierarchy.employeeHierarchy.position}
          department={hierarchy.employeeHierarchy.department}
          onDrop={isSystemAdmin ? handleAssignSupervisor : undefined}
        />

        {/* Descendants (Team Structure) */}
        {hierarchy.teamStructure.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', position: 'relative' }}>
            <div style={{ width: '2px', height: '40px', backgroundColor: '#CBD5E0' }} />

            <div style={{ display: 'flex', gap: '3rem', position: 'relative' }}>
              {/* Horizontal Connector Line for direct reports */}
              {hierarchy.teamStructure.length > 1 && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: `calc(100% - 3rem)`,
                  height: '2px',
                  backgroundColor: '#CBD5E0',
                }} />
              )}

              {hierarchy.teamStructure.map((member) => (
                <div key={member.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* Vertical Connector to Child */}
                  {hierarchy.teamStructure.length > 1 && (
                    <div style={{
                      width: '2px',
                      height: '40px',
                      backgroundColor: '#CBD5E0',
                    }} />
                  )}
                  <TreeNode employee={member} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const scrollInterval = useRef<any>(null);

  const stopAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    const threshold = 150;
    const speed = 20;
    const { clientY } = e;
    const viewportHeight = window.innerHeight;

    if (clientY < threshold) {
      if (!scrollInterval.current) {
        scrollInterval.current = setInterval(() => {
          window.scrollBy(0, -speed);
        }, 16);
      }
    } else if (viewportHeight - clientY < threshold) {
      if (!scrollInterval.current) {
        scrollInterval.current = setInterval(() => {
          window.scrollBy(0, speed);
        }, 16);
      }
    } else {
      stopAutoScroll();
    }
  };

  return (
    <div
      style={{
        padding: '3rem',
        maxWidth: '100%',
        margin: '0 auto',
        overflowX: 'auto',
        minHeight: '100vh',
        backgroundColor: '#F7FAFC', // Slate 50
        fontFamily: "'Inter', sans-serif",
        zoom: 0.8
      } as any}
      onDragOver={handleGlobalDragOver}
      onDrop={stopAutoScroll}
      onDragEnd={stopAutoScroll}
      onDragLeave={stopAutoScroll}
    >
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '600',
          background: 'linear-gradient(135deg, #6B46C1 0%, #805AD5 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.75rem',
          letterSpacing: '-0.025em'
        }}>
          Organization Hierarchy
        </h1>
        <p style={{ color: '#718096', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
          {isSystemAdmin ? 'Manage the complete organizational structure by dragging and dropping employees.' : 'Explore your organizational hierarchy and team structure.'}
        </p>

        {targetId && canSeeFullTree && (
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('id');
                window.location.href = url.pathname;
              }}
              style={{
                padding: '0.6rem 1.25rem',
                backgroundColor: 'white',
                color: '#6B46C1',
                border: '1px solid #E9D8FD',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F9F5FF';
                e.currentTarget.style.borderColor = '#D6BCFA';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#E9D8FD';
              }}
            >
              ← Back to Full Organization Tree
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#A0AEC0', fontSize: '1.25rem' }}>
          Loading structure...
        </div>
      )}

      {message && (
        <div style={{
          padding: '1rem',
          marginBottom: '2rem',
          borderRadius: '0.5rem',
          backgroundColor: '#FED7D7',
          color: '#C53030',
          borderLeft: '4px solid #C53030',
          maxWidth: '800px',
          margin: '0 auto 2rem auto'
        }}>
          {message}
        </div>
      )}

      {/* Show full tree for authorized roles */}
      {canSeeFullTree && fullTree && !hierarchy && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem' }}>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <div style={{ position: 'relative' }}>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                style={{
                  appearance: 'none',
                  padding: '0.75rem 2.5rem 0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #E2E8F0',
                  backgroundColor: 'white',
                  color: '#4A5568',
                  minWidth: '240px',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#A0AEC0' }}>
                ▼
              </div>
            </div>
          </div>

          {isSystemAdmin && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.style.backgroundColor = '#FAF5FF'; // Purple 50
                e.currentTarget.style.borderColor = '#9F7AEA'; // Purple 400
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#CBD5E0';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#CBD5E0';
                const id = e.dataTransfer.getData("text/plain");
                if (id) handleAssignSupervisor(id, null);
                stopAutoScroll();
              }}
              style={{
                border: '2px dashed #CBD5E0',
                padding: '2rem',
                width: '100%',
                maxWidth: '800px',
                textAlign: 'center',
                borderRadius: '1rem',
                color: '#718096',
                backgroundColor: 'white',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#553C9A' }}>Drag here to make Top Level</span>
              <span style={{ fontSize: '0.875rem' }}>(Remove Supervisor Assignment)</span>
            </div>
          )}

          <div style={{ fontSize: '0.875rem', color: '#A0AEC0', marginBottom: '-1rem' }}>
            Total Employees: {fullTree.totalEmployees}
          </div>

          <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap', justifyContent: 'center', paddingTop: '1rem' }}>
            {getFilteredTree().map((rootEmployee) => (
              <TreeNode key={rootEmployee.id} employee={rootEmployee} />
            ))}
          </div>
        </div>
      )}

      {hierarchy && renderPersonalHierarchy()}
    </div>
  );
}
