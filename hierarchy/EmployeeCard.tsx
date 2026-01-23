"use client";

import React from 'react';

interface EmployeeCardProps {
    id?: string;
    name: string;
    position: string | null;
    department: string | null;
    onDrop?: (draggedId: string, targetId: string) => void;
}

export default function EmployeeCard({ id, name, position, department, onDrop }: EmployeeCardProps) {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        if (id) {
            e.dataTransfer.setData("text/plain", id);
            e.currentTarget.classList.add('dragging');
        }
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('dragging');
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessary to allow dropping
        e.currentTarget.style.borderColor = 'var(--org-structure)';
        e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.borderColor = 'var(--border-light)';
        e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.style.borderColor = 'var(--border-light)';
        e.currentTarget.style.backgroundColor = 'var(--bg-primary)';

        const draggedId = e.dataTransfer.getData("text/plain");
        if (draggedId && id && draggedId !== id && onDrop) {
            onDrop(draggedId, id);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div
            draggable={!!id}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                backgroundColor: 'white',
                borderLeft: '3px solid #6B46C1', // Thinner purple stripe
                borderRadius: '0.5rem', // Smaller corners
                padding: '0.75rem 1rem', // Reduced padding
                minWidth: '200px', // Reduced width
                maxWidth: '240px',
                boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: id ? 'grab' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                position: 'relative',
                overflow: 'hidden',
                fontSize: '0.875rem' // Base font size
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 10px -3px rgba(107, 70, 193, 0.15)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px -1px rgba(0, 0, 0, 0.1)';
            }}
        >
            {/* Avatar */}
            <div style={{
                width: '32px', // Smaller avatar
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#E9D8FD',
                color: '#553C9A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.75rem',
                flexShrink: 0,
            }}>
                {getInitials(name)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <div style={{
                    fontWeight: '700',
                    fontSize: '0.9rem', // Smaller name
                    color: '#2D3748',
                    marginBottom: '0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {name}
                </div>
                {position && (
                    <div style={{
                        fontSize: '0.75rem', // Smaller position
                        color: '#6B46C1',
                        fontWeight: '500',
                        marginBottom: '0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {position}
                    </div>
                )}
                {department && (
                    <div style={{
                        fontSize: '0.7rem',
                        color: '#718096',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        fontWeight: '600'
                    }}>
                        {department}
                    </div>
                )}
            </div>
        </div>
    );
}
