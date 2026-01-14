"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/app/lib/axios";
import { FaEnvelope, FaLock } from "react-icons/fa";
import toast from "react-hot-toast";

const ForgetPass = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (step === 1) {
        await axios.post("/forgot-password", { email: form.email });
        toast.success("OTP sent to your email");
        setStep(2);
      } else if (step === 2) {
        await axios.post("/verify-otp", {
          email: form.email,
          otp: form.otp,
        });
        toast.success("OTP verified");
        setStep(3);
      } else if (step === 3) {
        await axios.post("/reset-password", {
          email: form.email,
          otp: form.otp,
          newPassword: form.newPassword,
        });
        toast.success("Password reset successful");
        router.push("/");
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url(/bglg.jpg)] bg-cover relative overflow-hidden px-4">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-1 h-full bg-cyan-400/10 animate-pulse" />
        <div className="absolute top-0 left-1/2 w-1 h-full bg-cyan-400/10 animate-pulse delay-200" />
        <div className="absolute top-0 right-1/4 w-1 h-full bg-cyan-400/10 animate-pulse delay-400" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_0_60px_rgba(0,255,255,0.2)] text-white">
        <h1 className="text-3xl font-bold text-center mb-6 tracking-wide">
          Forget Password
        </h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="flex items-center border-b border-white/30 py-2">
              <FaEnvelope className="mr-3 text-white/70" />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
                className="bg-transparent w-full outline-none text-white placeholder-white/50"
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex items-center border-b border-white/30 py-2">
              <FaLock className="mr-3 text-white/70" />
              <input
                type="text"
                name="otp"
                placeholder="Enter OTP"
                value={form.otp}
                onChange={handleChange}
                required
                className="bg-transparent w-full outline-none text-white placeholder-white/50"
              />
            </div>
          )}

          {step === 3 && (
            <div className="flex items-center border-b border-white/30 py-2">
              <FaLock className="mr-3 text-white/70" />
              <input
                type="password"
                name="newPassword"
                placeholder="New Password"
                value={form.newPassword}
                onChange={handleChange}
                required
                className="bg-transparent w-full outline-none text-white placeholder-white/50"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 rounded-xl transition"
          >
            {loading
              ? "Processing..."
              : step === 1
              ? "Send OTP"
              : step === 2
              ? "Verify OTP"
              : "Reset Password"}
          </button>

          <p className="text-center mt-4">
            <span
              onClick={() => router.push("/")}
              className="text-cyan-400 hover:text-cyan-300 cursor-pointer underline transition"
            >
              Go Back to Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgetPass;