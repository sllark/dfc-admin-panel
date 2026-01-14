"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/app/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

const Topbar = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Call logout API endpoint
        await axios.get("/auth/logout");
    } catch (error) {
      // Even if API call fails, clear local storage
      console.error("Logout API error:", error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem("token");
      localStorage.removeItem("id");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      toast.success("Logout successful!");
      router.push("/");
      setLoading(false);
    }
  };

  return (
    <header className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center">
      <h1 className="text-lg font-semibold">
        Welcome <Link href="/dashboard/settings" className="text-cyan-400 hover:underline">{localStorage.getItem("username") || "User"}</Link>
      </h1>
      <button
        onClick={handleLogout}
        disabled={loading}
        className="bg-cyan-500 px-4 py-2 rounded hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Logging out..." : "Logout"}
      </button>
    </header>
  );
};

export default Topbar;
