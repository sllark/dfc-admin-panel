"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/app/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import LoadingButton from "@/app/components/ui/LoadingButton";
import { ensureMinDuration } from "@/app/lib/loadingUtils";

const Topbar = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    const startedAt = Date.now();
    setLoading(true);
    try {
      // Call logout API endpoint
        await axios.get("/auth/logout");
    } catch (error) {
      // Even if API call fails, clear local storage
      console.error("Logout API error:", error);
    } finally {
      await ensureMinDuration(startedAt, 600);
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
    <header className="bg-gray-800 text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap gap-3 justify-between items-center sticky top-0 z-30 min-h-16">
      <h1 className="text-base sm:text-lg font-semibold min-w-0 truncate pr-2">
        Welcome{" "}
        <Link href="/dashboard/settings" className="text-cyan-400 hover:underline">
          {localStorage.getItem("username") || "User"}
        </Link>
      </h1>
      <LoadingButton
        onClick={handleLogout}
        loading={loading}
        className="shrink-0 bg-red-600 px-3 sm:px-4 py-2 text-sm sm:text-base rounded hover:bg-red-700 disabled:opacity-100 disabled:cursor-not-allowed"
        spinnerColor="#ef4444"
      >
        Logout
      </LoadingButton>
    </header>
  );
};

export default Topbar;
