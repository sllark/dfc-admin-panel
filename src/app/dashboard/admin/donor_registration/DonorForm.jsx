// app/(your-path)/DonorForm.jsx
"use client";

import { useState, useEffect } from "react";
import axios from "@/app/lib/axios";
import toast from "react-hot-toast";

export default function DonorForm({ initialData = null, onSuccess }) {
  const [formData, setFormData] = useState({
    donorNameFirst: "",
    donorNameLast: "",
    donorEmail: "",
    donorStateOfResidence: "",
    donorSSN: "",
    donorDateOfBirth: "",
    panelId: "",
    reasonForTest: "",
    registrationExpirationDate: "",
    labcorpRegistrationNumber: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        donorNameFirst: initialData.donorNameFirst || "",
        donorNameLast: initialData.donorNameLast || "",
        donorEmail: initialData.donorEmail || "",
        donorStateOfResidence: initialData.donorStateOfResidence || "",
        donorSSN: initialData.donorSSN || "",
        donorDateOfBirth: initialData.donorDateOfBirth
          ? new Date(initialData.donorDateOfBirth).toISOString().slice(0, 10)
          : "",
        panelId: initialData.panelId || "",
        reasonForTest: initialData.reasonForTest || "",
        registrationExpirationDate: initialData.registrationExpirationDate
          ? new Date(initialData.registrationExpirationDate).toISOString().slice(0, 10)
          : "",
        labcorpRegistrationNumber: initialData.labcorpRegistrationNumber || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required field
    if (!formData.donorDateOfBirth) {
      toast.error("Date of Birth is required");
      return;
    }

    const payload = {
      ...formData,
      donorDateOfBirth: new Date(formData.donorDateOfBirth).toISOString(),
      registrationExpirationDate: formData.registrationExpirationDate
        ? new Date(formData.registrationExpirationDate).toISOString()
        : null, // <-- Prisma will accept null if field is optional
    };

    try {
      if (initialData) {
        await axios.put(`/donors/donor-registration/${initialData.id}`, payload);
        toast.success("Donor updated successfully!");
      } else {
        await axios.post("/donors/donor-registration", payload);
        toast.success("Donor created successfully!");
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save donor");
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "First Name", name: "donorNameFirst" },
          { label: "Last Name", name: "donorNameLast" },
          { label: "Email", name: "donorEmail", type: "email" },
          { label: "State", name: "donorStateOfResidence" },
          { label: "SSN", name: "donorSSN" },
          { label: "Date of Birth", name: "donorDateOfBirth", type: "date" },
          { label: "Panel ID", name: "panelId" },
          { label: "Reason", name: "reasonForTest" },
          { label: "Labcorp #", name: "labcorpRegistrationNumber" },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium mb-1">{field.label}</label>
            <input
              type={field.type || "text"}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required={
                field.name === "donorDateOfBirth" 
                  ? true 
                  : !["donorSSN", "reasonForTest", "labcorpRegistrationNumber"].includes(field.name)
              }
            />
          </div>
        ))}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Expiration Date</label>
          <input
            type="date"
            name="registrationExpirationDate"
            value={formData.registrationExpirationDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded shadow"
        >
          {initialData ? "Update Donor" : "Add Donor"}
        </button>
      </div>
    </form>
  );
}
