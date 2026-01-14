"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/app/lib/axios";
import { FaUser, FaLock, FaEnvelope, FaPhone } from "react-icons/fa";
import toast from "react-hot-toast";

const LoginRegister = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        phone: "",
    });
    const router = useRouter();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            if (isRegister) {
                // Registration flow
                const res = await axios.post("/auth/register", {
                    username: form.username,
                    email: form.email,
                    password: form.password,
                    phone: form.phone,
                });
                setIsRegister(false);
                toast.success("Registration successful! Please login.");
            } else {
                // Login flow
                const res = await axios.post("/auth/login", {
                    email: form.email,
                    password: form.password,
                });

                const { id, token, role, username } = res.data;

                if (role !== "ADMIN") {
                    toast.error("Access denied. Only ADMIN users can log in.");
                    return;
                }

                localStorage.setItem("id", id);
                localStorage.setItem("token", token);
                localStorage.setItem("role", role);
                localStorage.setItem("username", username);

                toast.success("Login successful!");
                router.push("/dashboard");
            }
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                "Authentication failed. Please try again.";
            toast.error(message);
            console.error("Auth error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url(/bglg.jpg)] bg-cover relative overflow-hidden px-4">
            {/* Background beams */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-1 h-full bg-cyan-400/10 animate-pulse" />
                <div className="absolute top-0 left-1/2 w-1 h-full bg-cyan-400/10 animate-pulse delay-200" />
                <div className="absolute top-0 right-1/4 w-1 h-full bg-cyan-400/10 animate-pulse delay-400" />
            </div>

            {/* Card */}
            <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_0_60px_rgba(0,255,255,0.2)] text-white">
                <h1 className="text-3xl font-bold text-center mb-6">
                    {isRegister ? "Create Account" : "Welcome Back"}
                </h1>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {isRegister && (
                        <>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Username"
                                    value={form.username}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-full bg-white/10 px-5 py-3 pl-12 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                />
                                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                            </div>
                            <div className="relative">
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Phone Number"
                                    value={form.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-full bg-white/10 px-5 py-3 pl-12 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                />
                                <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                            </div>
                        </>
                    )}

                    <div className="relative">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="w-full rounded-full bg-white/10 px-5 py-3 pl-12 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                        <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                    </div>

                    <div className="relative">
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="w-full rounded-full bg-white/10 px-5 py-3 pl-12 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                        <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                    </div>

                    {!isRegister && (
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" className="accent-cyan-400" />
                                Remember me
                            </label>
                            <a href="/forgetpass" className="hover:underline text-white/70">
                                Forgot password?
                            </a>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-gray-900 font-bold hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Processing..." : isRegister ? "Register" : "Login"}
                    </button>

                    <p className="text-center text-sm text-white/80">
                        {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
                        <button
                            type="button"
                            onClick={() => setIsRegister(!isRegister)}
                            className="font-semibold text-cyan-300 hover:underline"
                        >
                            {isRegister ? "Login" : "Register"}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginRegister;









// "use client";
// import React, { useState } from "react";
// import { useRouter } from "next/navigation";
// import axios from "@/app/lib/axios";
// import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
// import toast from "react-hot-toast";
//
// const LoginRegister = () => {
//   const [isRegister, setIsRegister] = useState(false);
//   const [form, setForm] = useState({ username: "", email: "", password: "" });
//   const router = useRouter();
//
//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };
//
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       if (isRegister) {
//         // Registration flow
//         const res = await axios.post("/auth/register", {
//           username: form.username,
//           email: form.email,
//           password: form.password,
//         });
//         setIsRegister(false);
//         toast.success(
//           "Registration successful! Please contact admin for access."
//         );
//         return;
//       }
//
//       // Login flow
//       const res = await axios.post("/auth/login", {
//         email: form.email,
//         password: form.password,
//       });
//
//       const { id, token, role, username } = res.data;
//
//       if (role !== "ADMIN") {
//         toast.error("Access denied. Only ADMIN users can log in.");
//         return;
//       }
//
//       localStorage.setItem("id", id);
//       localStorage.setItem("token", token);
//       localStorage.setItem("role", role);
//       localStorage.setItem("username", username);
//
//       toast.success("Login successful!");
//       router.push("/dashboard");
//     } catch (err) {
//       const message =
//         err?.response?.data?.message ||
//         "Authentication failed. Please try again.";
//       toast.error(message);
//       console.error("Auth error:", err);
//     }
//   };
//
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[url(/bglg.jpg)] bg-cover relative overflow-hidden px-4">
//       {/* Glowing vertical beams */}
//       <div className="absolute inset-0 z-0 pointer-events-none">
//         <div className="absolute top-0 left-1/4 w-1 h-full bg-cyan-400/10 animate-pulse" />
//         <div className="absolute top-0 left-1/2 w-1 h-full bg-cyan-400/10 animate-pulse delay-200" />
//         <div className="absolute top-0 right-1/4 w-1 h-full bg-cyan-400/10 animate-pulse delay-400" />
//       </div>
//
//       {/* Auth Card */}
//       <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-[0_0_60px_rgba(0,255,255,0.2)] text-white">
//         <h1 className="text-3xl font-bold text-center mb-6 tracking-wide">
//           {isRegister ? "Create Account" : "Welcome Back"}
//         </h1>
//
//         <form className="space-y-6" onSubmit={handleSubmit}>
//           {isRegister && (
//             <div className="relative">
//               <input
//                 type="text"
//                 name="username"
//                 placeholder="Username"
//                 value={form.username}
//                 onChange={handleChange}
//                 required
//                 className="w-full rounded-full bg-white/10 px-5 py-3 pl-12 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
//               />
//               <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
//             </div>
//           )}
//
//           <div className="relative">
//             <input
//               type="email"
//               name="email"
//               placeholder="Email Address"
//               value={form.email}
//               onChange={handleChange}
//               required
//               className="w-full rounded-full bg-white/10 px-5 py-3 pl-12 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
//             />
//             <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
//           </div>
//
//           <div className="relative">
//             <input
//               type="password"
//               name="password"
//               placeholder="Password"
//               value={form.password}
//               onChange={handleChange}
//               required
//               className="w-full rounded-full bg-white/10 px-5 py-3 pl-12 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
//             />
//             <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
//           </div>
//
//           {isRegister ? (
//             <label className="flex items-center gap-2 text-sm">
//               <input type="checkbox" className="accent-cyan-400" required />I
//               agree to the terms & conditions
//             </label>
//           ) : (
//             <div className="flex items-center justify-between text-sm">
//               <label className="flex items-center gap-2">
//                 <input type="checkbox" className="accent-cyan-400" />
//                 Remember me
//               </label>
//               <a href="/forgetpass" className="hover:underline text-white/70">
//                 Forgot password?
//               </a>
//             </div>
//           )}
//
//           <button
//             type="submit"
//             className="w-full py-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-gray-900 font-bold shadow-md hover:scale-[1.02] transition"
//           >
//             {isRegister ? "Register" : "Login"}
//           </button>
//
//           <p className="text-center text-sm mt-4 text-white/80">
//             {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
//             <button
//               type="button"
//               onClick={() => setIsRegister(!isRegister)}
//               className="font-semibold text-cyan-300 hover:underline"
//             >
//               {isRegister ? "Login" : "Register"}
//             </button>
//           </p>
//         </form>
//       </div>
//     </div>
//   );
// };
//
// export default LoginRegister;
