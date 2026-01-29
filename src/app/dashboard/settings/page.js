"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/app/lib/axios";
import toast from "react-hot-toast";
import { FiEdit, FiUser, FiMail, FiPhone, FiCalendar } from "react-icons/fi";
import AuthGuard from "@/app/lib/authGuard";
import Layout from "@/app/components/common/layout";

const Settings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const id = localStorage.getItem("id");
        const res = await axios.get(`/user/${id}`);
        // Handle response structure: { success: true, data: {...} }
        setUser(res.data?.data || res.data);
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const getImageUrl = (path) => {
    // Check localStorage for uploaded images first
    if (typeof window !== "undefined" && path) {
      const uploads = localStorage.getItem("uploads");
      if (uploads) {
        try {
          const uploadsData = JSON.parse(uploads);
          // Check if path exists as a key in localStorage
          if (uploadsData[path]) {
            return uploadsData[path];
          }
          // Also check all keys to find matching image
          const keys = Object.keys(uploadsData);
          for (const key of keys) {
            if (key.includes(path) || path.includes(key)) {
              return uploadsData[key];
            }
          }
        } catch (e) {
          console.error("Error parsing localStorage uploads:", e);
        }
      }
    }
    // Fallback to server path
    if (path?.startsWith("/uploads")) {
      return `${process.env.NEXT_PUBLIC_BASE_URL}${path}`;
    }
    return path || "/default-avatar.png";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) return <p className="text-gray-400">Loading profile...</p>;

  return (
    <AuthGuard>
      <Layout>
        <div className="w-full bg-gray-900 text-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg border border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400">My Profile</h2>
            <button
              onClick={() => router.push("/dashboard/settings/update")}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 sm:px-6 py-2 rounded-lg transition text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <FiEdit /> Update Profile
            </button>
          </div>

          {user && (
            <div className="space-y-6">
              {/* Profile Image */}
              <div className="flex justify-start mb-6 sm:mb-8">
                <div className="relative">
                  <img
                    src={getImageUrl(user.profileImage)}
                    alt="Profile"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-cyan-500 shadow-lg"
                  />
                </div>
              </div>

              {/* Profile Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* First Name */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <FiUser className="text-cyan-400 flex-shrink-0" />
                    <label className="text-sm text-gray-400">Full Name</label>
                  </div>
                  <p className="text-base sm:text-lg font-semibold break-words min-w-0">
                    {user.firstName+ ` ${user.lastName}` || user.first_name+ ` ${user.last_name}` || "—"}
                  </p>
                </div>

                  {/* Username */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-3 mb-2">
                          <FiUser className="text-cyan-400 flex-shrink-0" />
                          <label className="text-sm text-gray-400">Username</label>
                      </div>
                      <p className="text-base sm:text-lg font-semibold break-words min-w-0">
                          {user.username || "—"}
                      </p>
                  </div>

                {/* Date of Birth */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <FiCalendar className="text-cyan-400 flex-shrink-0" />
                    <label className="text-sm text-gray-400">Date of Birth</label>
                  </div>
                  <p className="text-base sm:text-lg font-semibold break-words min-w-0">
                    {formatDate(user.dateOfBirth || user.date_of_birth)}
                  </p>
                </div>

                {/* Phone */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <FiPhone className="text-cyan-400 flex-shrink-0" />
                    <label className="text-sm text-gray-400">Phone</label>
                  </div>
                  <p className="text-base sm:text-lg font-semibold break-words min-w-0">
                    {user.phone || "—"}
                  </p>
                </div>

                {/* Email */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 md:col-span-2">
                  <div className="flex items-center gap-3 mb-2">
                    <FiMail className="text-cyan-400 flex-shrink-0" />
                    <label className="text-sm text-gray-400">Email</label>
                  </div>
                  <p className="text-base sm:text-lg font-semibold break-all min-w-0">
                    {user.email || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default Settings;
