"use client"; // if using Next.js 13+ app directory

import { useEffect, useState } from "react";

type Position = {
  _id: string;
  code: string;
  title: string;
  description?: string;
  departmentId: string;
  reportsToPositionId?: string;
  isActive: boolean;
};

type Department = {
  _id: string;
  name: string;
};

export default function UpdatePositionPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [formData, setFormData] = useState<Partial<Position>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch positions and departments from backend
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('accessToken');
        console.log("TOKEN FROM STORAGE:", token);

        if (!token) {
          setMessage({ type: "error", text: "Authentication required. Please log in." });
          return;
        }

        const [posRes, deptRes] = await Promise.all([
          fetch("http://localhost:3000/organization-structure/positions", {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:3000/organization-structure/departments", {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }),
        ]);

        console.log("Positions response status:", posRes.status, posRes.statusText);
        console.log("Departments response status:", deptRes.status, deptRes.statusText);

        if (posRes.ok) {
          try {
            const posData = await posRes.json();
            console.log("Positions data received:", posData);
            console.log("Number of positions:", Array.isArray(posData) ? posData.length : "Not an array");
            
            // Handle case where departmentId might be populated as an object
            const normalizedPositions = Array.isArray(posData) ? posData.map((pos: any) => ({
              ...pos,
              departmentId: typeof pos.departmentId === 'object' && pos.departmentId?._id 
                ? pos.departmentId._id 
                : pos.departmentId,
            })) : [];
            
            setPositions(normalizedPositions);
            console.log("Positions set in state:", normalizedPositions.length);
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

        if (deptRes.ok) {
          try {
            const deptData = await deptRes.json();
            console.log("Departments data received:", deptData);
            console.log("Number of departments:", Array.isArray(deptData) ? deptData.length : "Not an array");
            setDepartments(Array.isArray(deptData) ? deptData : []);
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
      } catch (err) {
        console.error("Error fetching data:", err);
        setMessage({ type: "error", text: "Failed to load positions and departments" });
      }
    }

    fetchData();
  }, []);

  // Handle dropdown change - load position details into form
  const handleSelectPosition = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const posId = e.target.value;
    setSelectedId(posId);

    if (posId) {
      const selected = positions.find((pos) => pos._id === posId);
      if (selected) {
        setFormData({
          code: selected.code,
          title: selected.title,
          description: selected.description || "",
          departmentId: selected.departmentId,
          reportsToPositionId: selected.reportsToPositionId || "",
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
    if (!selectedId || !formData.title || !formData.code || !formData.departmentId) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    setLoading(true);
    try {
      const updatePayload = {
        code: formData.code,
        title: formData.title,
        description: formData.description || "",
        departmentId: formData.departmentId,
        reportsToPositionId: formData.reportsToPositionId || undefined,
        isActive: formData.isActive ?? true,
      };

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setMessage({ type: "error", text: "Authentication required. Please log in." });
        setLoading(false);
        return;
      }

      const res = await fetch(`http://localhost:3000/organization-structure/positions/${selectedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Position updated successfully!" });
        // Update local state
        setPositions((prev) =>
          prev.map((pos) => (pos._id === selectedId ? { ...pos, ...formData } : pos))
        );
      } else {
        const errorData = await res.json();
        setMessage({ type: "error", text: `Failed to update position: ${errorData.message}` });
      }
    } catch (err) {
      console.error("Error updating position:", err);
      setMessage({ type: "error", text: "Error updating position" });
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentName = (deptId: string | any) => {
    // Handle case where deptId might be an object (populated)
    const id = typeof deptId === 'object' && deptId?._id ? deptId._id : deptId;
    return departments.find((d) => d._id === id)?.name || "Unknown";
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Update Position</h1>

      {/* Position Dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Position</label>
        <select
          value={selectedId}
          onChange={handleSelectPosition}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select a Position --</option>
          {positions.length > 0 ? (
            positions.map((pos) => (
              <option key={pos._id} value={pos._id}>
                {pos.title} ({pos.code}) - {getDepartmentName(pos.departmentId)}
              </option>
            ))
          ) : (
            <option value="" disabled>No positions available</option>
          )}
        </select>
      </div>

      {/* Form Fields */}
      {selectedId && (
        <div className="space-y-4 border border-gray-200 p-6 rounded-lg bg-gray-50">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium mb-1">Position Code *</label>
            <input
              type="text"
              name="code"
              value={formData.code || ""}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., POS001"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Position Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title || ""}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Senior Developer"
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
              placeholder="Position description..."
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium mb-1">Department *</label>
            <select
              name="departmentId"
              value={formData.departmentId || ""}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Department --</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reports To Position */}
          <div>
            <label className="block text-sm font-medium mb-1">Reports To Position</label>
            <select
              name="reportsToPositionId"
              value={formData.reportsToPositionId || ""}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- None --</option>
              {positions
                .filter((pos) => pos._id !== selectedId) // Exclude current position
                .map((pos) => (
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
              Active Position
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
