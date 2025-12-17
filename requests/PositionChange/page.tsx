"use client";

import React from 'react';

export default function MakeChangeRequestPage() {
  const fields = [
    { label: "Old Position", name: "oldPosition" },
    { label: "New Position", name: "newPosition" },
    { label: "Req Num", name: "reqNum" },
    { label: "By Employee", name: "byEmployee" },
    { label: "Target Position", name: "targetPosition" },
    { label: "Details", name: "details" },
    { label: "Reason", name: "reason" },
    { label: "Submitted By", name: "submittedBy" },
    { label: "Submitted At", name: "submittedAt" },
  ];

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">
        Position Change Request
      </h1>

      <form className="space-y-4">
        {fields.map((field) => (
          <div
            key={field.name}
            className="grid grid-cols-3 items-center gap-4"
          >
            <label className="font-medium text-gray-700">
              {field.label}
            </label>

            <input
              type="text"
              name={field.name}
              className="col-span-2 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </form>
    </div>
  );
}
