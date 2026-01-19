"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "@/app/lib/axios";
import toast from "react-hot-toast";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiCamera,
  FiArrowLeft,
} from "react-icons/fi";
import AuthGuard from "@/app/lib/authGuard";
import Layout from "@/app/components/common/layout";

const UpdateProfile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phone: "",
    username: "",
    email: "",
    profileImage: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const id = localStorage.getItem("id");
        const res = await axios.get(`/user/${id}`);
        // Handle response structure: { success: true, data: {...} }
        const userData = res.data?.data || res.data;
        setUser(userData);
        setForm({
          firstName: userData.firstName || userData.first_name || "",
          lastName: userData.lastName || userData.last_name || "",
          dateOfBirth: userData.dateOfBirth || userData.date_of_birth
            ? new Date(userData.dateOfBirth || userData.date_of_birth)
                .toISOString()
                .split("T")[0]
            : "",
          phone: userData.phone || "",
          username: userData.username || "",
          email: userData.email || "",
          profileImage: userData.profileImage || null,
        });
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setForm({ ...form, profileImageFile: file });

      // Store in localStorage uploads
      if (typeof window !== "undefined") {
        const reader = new FileReader();
        reader.onloadend = () => {
          const uploads = JSON.parse(
            localStorage.getItem("uploads") || "{}"
          );
          const imageKey = `profile_${Date.now()}`;
          uploads[imageKey] = reader.result;
          localStorage.setItem("uploads", JSON.stringify(uploads));
          setForm((prev) => ({ ...prev, profileImageKey: imageKey }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const getImageUrl = () => {
    // Check for newly selected file
    if (form.profileImageFile) {
      return URL.createObjectURL(form.profileImageFile);
    }

    // Check localStorage for uploaded images
    if (typeof window !== "undefined" && form.profileImage) {
      const uploads = localStorage.getItem("uploads");
      if (uploads) {
        try {
          const uploadsData = JSON.parse(uploads);
          // Check if current profileImage exists in localStorage
          if (uploadsData[form.profileImage]) {
            return uploadsData[form.profileImage];
          }
          // Also check all keys to find matching image
          const keys = Object.keys(uploadsData);
          for (const key of keys) {
            if (key.includes(form.profileImage) || form.profileImage.includes(key)) {
              return uploadsData[key];
            }
          }
        } catch (e) {
          console.error("Error parsing localStorage uploads:", e);
        }
      }
    }

    // Fallback to server path
    if (form.profileImage?.startsWith("/uploads")) {
      return `${process.env.NEXT_PUBLIC_BASE_URL}${form.profileImage}`;
    }
    return form.profileImage || "/default-avatar.png";
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();

      // Only append fields that are allowed to be updated
      if (form.firstName) {
        formData.append("firstName", form.firstName);
      }
      if (form.lastName) {
        formData.append("lastName", form.lastName);
      }
      if (form.dateOfBirth) {
        formData.append("dateOfBirth", form.dateOfBirth);
      }
      if (form.phone) {
        formData.append("phone", form.phone);
      }
      if (form.username) {
        formData.append("username", form.username);
      }
      if (form.email) {
        formData.append("email", form.email);
      }

      // Append profile image if a new file is selected
      if (form.profileImageFile) {
        formData.append("profileImage", form.profileImageFile);
      }

      // Use the update-profile endpoint
      const res = await axios.put("/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Handle response structure: { success: true, message: "...", user: {...} }
      const updatedUser = res.data?.user || res.data;

      // Update localStorage if image was uploaded
      if (form.profileImageKey && typeof window !== "undefined") {
        const uploads = JSON.parse(localStorage.getItem("uploads") || "{}");
        // Store the server response path with the localStorage key
        if (updatedUser.profileImage) {
          uploads[updatedUser.profileImage] = uploads[form.profileImageKey];
          localStorage.setItem("uploads", JSON.stringify(uploads));
        }
      }

      setUser(updatedUser);
      toast.success("Profile updated successfully!");
      router.push("/dashboard/settings");
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-400">Loading profile...</p>;

  return (
    <AuthGuard>
      <Layout>
        <div className="w-full bg-gray-900 text-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg border border-gray-800">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <button
              onClick={() => router.push("/dashboard/settings")}
              className="text-cyan-400 hover:text-cyan-300 transition flex-shrink-0"
            >
              <FiArrowLeft className="text-xl sm:text-2xl" />
            </button>
            <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400">
              Update Profile
            </h2>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img
                  src={getImageUrl()}
                  alt="Profile"
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-cyan-500 shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-cyan-500 p-2 sm:p-3 rounded-full hover:bg-cyan-600 transition shadow-lg"
                  title="Change photo"
                >
                  <FiCamera className="text-white text-base sm:text-lg" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FiUser className="inline mr-2 text-cyan-400" />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white text-sm sm:text-base"
                  placeholder="Enter first name"
                  maxLength={100}
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FiUser className="inline mr-2 text-cyan-400" />
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white text-sm sm:text-base"
                  placeholder="Enter last name"
                  maxLength={100}
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FiCalendar className="inline mr-2 text-cyan-400" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white text-sm sm:text-base"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FiPhone className="inline mr-2 text-cyan-400" />
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white text-sm sm:text-base"
                  placeholder="Enter phone number"
                  maxLength={50}
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FiUser className="inline mr-2 text-cyan-400" />
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white text-sm sm:text-base"
                  placeholder="Enter username"
                  required
                  maxLength={100}
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FiMail className="inline mr-2 text-cyan-400" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white text-sm sm:text-base"
                  placeholder="Enter email"
                  required
                  maxLength={255}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard/settings")}
                className="w-full sm:flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default UpdateProfile;
