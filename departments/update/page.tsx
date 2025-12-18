"use client"; // if using Next.js 13+ app directory

import { useEffect, useState } from "react";

type Department = {
  _id: string;
  code: string;
  name: string;
  description?: string;
  headPositionId?: string;
  isActive: boolean;
};

type Position = {
  _id: string;
  title: string;
  code: string;
};

export default function UpdateDepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [formData, setFormData] = useState<Partial<Department>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch departments and positions from backend
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('accessToken');
        console.log("TOKEN FROM STORAGE:", token);

        if (!token) {
          setMessage({ type: "error", text: "Authentication required. Please log in." });
          return;
        }

        const [deptRes, posRes] = await Promise.all([
          fetch("http://localhost:3000/organization-structure/departments", {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:3000/organization-structure/positions", {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
        ]);

        console.log("Departments response status:", deptRes.status, deptRes.statusText);
        console.log("Positions response status:", posRes.status, posRes.statusText);

        if (deptRes.ok) {
          try {
            const deptData = await deptRes.json();
            console.log("Departments data received:", deptData);
            console.log("Number of departments:", Array.isArray(deptData) ? deptData.length : "Not an array");

            // Handle case where headPositionId might be populated as an object
            const normalizedDepartments = Array.isArray(deptData) ? deptData.map((dept: any) => ({
              ...dept,
              headPositionId: typeof dept.headPositionId === 'object' && dept.headPositionId?._id
                ? dept.headPositionId._id
                : dept.headPositionId,
            })) : [];

            setDepartments(normalizedDepartments);
            console.log("Departments set in state:", normalizedDepartments.length);
          } catch (parseError) {
            console.error("Error parsing departments JSON:", parseError);
            setMessage({ type: "error", text: "Failed to parse departments data" });
          }
        } else {
          try {
            const errorText = await deptRes.text();
            console.error("Error fetching departments:", deptRes.status, errorText);
            setMessage({ type: "error", text: `Failed to load departments (${deptRes.status}): ${errorText}` });
          } catch (error) {
            console.error("Error reading error response:", error);
            setMessage({ type: "error", text: `Failed to load departments (${deptRes.status})` });
          }
        }

        if (posRes.ok) {
          try {
            const posData = await posRes.json();
            console.log("Positions data received:", posData);
            console.log("Number of positions:", Array.isArray(posData) ? posData.length : "Not an array");
            setPositions(Array.isArray(posData) ? posData : []);
          } catch (parseError) {
            console.error("Error parsing positions JSON:", parseError);
            setMessage({ type: "error", text: "Failed to parse positions data" });
          }
        } else {
          try {
            const errorText = await posRes.text();
            console.error("Error fetching positions:", posRes.status, errorText);
            setMessage({ type: "error", text: `Failed to load positions (${posRes.status}): ${errorText}` });
          } catch (error) {
            console.error("Error reading error response:", error);
            setMessage({ type: "error", text: `Failed to load positions (${posRes.status})` });
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setMessage({ type: "error", text: "Failed to load departments and positions" });
      }
    }

    fetchData();
  }, []);

  // Handle dropdown change - load department details into form
  const handleSelectDepartment = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptId = e.target.value;
    setSelectedId(deptId);

    if (deptId) {
      const selected = departments.find((dept) => dept._id === deptId);
      if (selected) {
        setFormData({
          code: selected.code,
          name: selected.name,
          description: selected.description || "",
          headPositionId: selected.headPositionId || "",
          isActive: selected.isActive,
        });
        setMessage(null);
      }
    } else {
      setFormData({});
    }
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Handle save/update
  const handleSave = async () => {
    if (!selectedId || !formData.name || !formData.code) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    setLoading(true);
    try {
      const updatePayload = {
        code: formData.code,
        name: formData.name,
        description: formData.description || "",
        headPositionId: formData.headPositionId || undefined,
        isActive: formData.isActive ?? true,
      };

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setMessage({ type: "error", text: "Authentication required. Please log in." });
        setLoading(false);
        return;
      }

      const res = await fetch(`http://localhost:3000/organization-structure/departments/${selectedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Department updated successfully!" });
        // Update local state
        setDepartments((prev) =>
          prev.map((dept) => (dept._id === selectedId ? { ...dept, ...formData } : dept))
        );
      } else {
        const errorData = await res.json();
        setMessage({ type: "error", text: `Failed to update department: ${errorData.message}` });
      }
    } catch (err) {
      console.error("Error updating department:", err);
      setMessage({ type: "error", text: "Error updating department" });
    } finally {
      setLoading(false);
    }
  };

  const getPositionTitle = (posId: string | any) => {
    // Handle case where posId might be an object (populated)
    const id = typeof posId === 'object' && posId?._id ? posId._id : posId;
    return positions.find((p) => p._id === id)?.title || "Unknown";
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Update Department</h1>

      {/* Department Dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Department</label>
        <select
          value={selectedId}
          onChange={handleSelectDepartment}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select a Department --</option>
          {departments.length > 0 ? (
            departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name} ({dept.code})
              </option>
            ))
          ) : (
            <option value="" disabled>No departments available</option>
          )}
        </select>
      </div>

      {/* Form Fields */}
      {selectedId && (
        <div className="space-y-4 border border-gray-200 p-6 rounded-lg bg-gray-50">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium mb-1">Department Code *</label>
            <input
              type="text"
              name="code"
              value={formData.code || ""}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., DEPT001"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Department Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Human Resources"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleInputChange}
              rows={4}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Department description..."
            />
          </div>

          {/* Head Position */}
          <div>
            <label className="block text-sm font-medium mb-1">Head Position</label>
            <select
              name="headPositionId"
              value={formData.headPositionId || ""}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- None --</option>
              {positions.map((pos) => (
                <option key={pos._id} value={pos._id}>
                  {pos.title} ({pos.code})
                </option>
              ))}
            </select>
          </div>

          {/* Is Active */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={formData.isActive ?? true}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm font-medium">
              Active Department
            </label>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-3 rounded-lg ${
                message.type === "success"
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-red-100 text-red-700 border border-red-300"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}