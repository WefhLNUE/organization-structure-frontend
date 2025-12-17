"use client";

import { useRouter } from "next/navigation";

export default function OrganizationPage() {
  const router = useRouter();

  const actions = [
    { label: "View Hierarchy", path: "/organization-structure/hierarchy" },

    { label: "Create Department", path: "/organization-structure/departments/create" },
    { label: "Update Department", path: "/organization-structure/departments/update" },
    { label: "Delete Department", path: "/organization-structure/departments/delete" },

    { label: "Create Position", path: "/organization-structure/positions/create" },
    { label: "Update Position", path: "/organization-structure/positions/update" },
    { label: "Delete Position", path: "/organization-structure/positions/delete" },

    {
      label: "Create Department Change Request",
      path: "/organization-structure/requests/departmentChange",
    },
    {
      label: "Create Position Change Request",
      path: "/organization-structure/requests/PositionChange",
    },
    {
      label: "Review Change Requests",
      path: "/organization-structure/reviewChange",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">
        Organization Structure Management
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => router.push(action.path)}
            className="px-4 py-3 border rounded-lg text-left hover:bg-gray-100 transition"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
