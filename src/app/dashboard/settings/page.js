"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "@/app/lib/axios";
import toast from "react-hot-toast";
import {
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaLock,
  FaCamera,
} from "react-icons/fa";
import AuthGuard from "@/app/lib/authGuard";
import Layout from "@/app/components/common/layout";

const Settings = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const id = localStorage.getItem("id");
        const res = await axios.get(`/user/${id}`);
        setUser(res.data);
        setForm({
          username: res.data.username,
          email: res.data.email,
          phone: res.data.phone || "",
          password: "",
          profileImage: res.data.profileImage,
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
    if (e.target.files[0]) {
      setForm({ ...form, profileImageFile: e.target.files[0] });
    }
  };

  const handleUpdate = async () => {
    try {
      const id = localStorage.getItem("id");
      const formData = new FormData();
      formData.append("username", form.username);
      formData.append("phone", form.phone);
      if (form.password) formData.append("password", form.password);
      if (form.profileImageFile)
        formData.append("profileImage", form.profileImageFile);

      const res = await axios.put(`/user/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser(res.data);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const getImageUrl = (path) =>
    path?.startsWith("/uploads") ? `${process.env.NEXT_PUBLIC_BASE_URL}${path}` : path;

  if (loading) return <p className="text-gray-400">Loading profile...</p>;

  return (
    <>
      <AuthGuard>
        <Layout>
          <div className="max-w-2xl mx-auto bg-gray-900 text-white p-6 rounded-xl shadow border border-gray-800">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">
              My Profile
            </h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <img
                  src={
                    form.profileImageFile
                      ? URL.createObjectURL(form.profileImageFile)
                      : getImageUrl(form.profileImage)
                  }
                  alt="avatar"
                  className="w-20 h-20 rounded-full object-cover border border-gray-700"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-0 right-0 bg-cyan-500 p-2 rounded-full hover:bg-cyan-600"
                  title="Change photo"
                >
                  <FaCamera />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{form.username}</h3>
                <p className="text-sm text-gray-400">{form.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className="w-full bg-gray-800 rounded px-4 py-3 pl-10 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Phone"
                  className="w-full bg-gray-800 rounded px-4 py-3 pl-10 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <FaPhoneAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              </div>

              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="New Password"
                  className="w-full bg-gray-800 rounded px-4 py-3 pl-10 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              </div>

              <button
                onClick={handleUpdate}
                className="w-full py-3 mt-4 rounded bg-gradient-to-r from-cyan-400 to-blue-500 text-gray-900 font-bold hover:scale-[1.02] transition"
              >
                Update Profile
              </button>
            </div>
          </div>
        </Layout>
      </AuthGuard>
    </>
  );
};

export default Settings;
