"use client";
import React, { useEffect, useRef, useState } from "react";
import Layout from "@/app/components/common/layout";
import AuthGuard from "@/app/lib/authGuard";
import axios from "@/app/lib/axios";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaPhoneAlt,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import toast from "react-hot-toast";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const fileInputRef = useRef(null);
  const [search, setSearch] = useState({
    email: "",
    phone: "",
    role: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const params = {
        page,
        pageSize,
        email: search.email || undefined,
        phone: search.phone || undefined,
        role: search.role || undefined,
      };

      const res = await axios.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      // Ensure users is always an array
      const usersData = Array.isArray(res.data) 
        ? res.data 
        : Array.isArray(res.data?.users) 
        ? res.data.users 
        : Array.isArray(res.data?.data) 
        ? res.data.data 
        : [];

      setUsers(usersData);
      setTotalPages(res.data?.totalPages || res.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]); // Ensure users is always an array even on error
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const getImageUrl = (path) =>
    path?.startsWith("/uploads") ? `${process.env.NEXT_PUBLIC_BASE_URL}${path}` : path;

  const viewUser = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSelectedUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setSelectedUser(null); // close view modal if open
  };

  const handleInputChange = (e) => {
    setEditingUser({
      ...editingUser,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEditingUser({
        ...editingUser,
        profileImageFile: e.target.files[0],
      });
    }
  };

  const handleUpdateUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("username", editingUser.username);
      formData.append("phone", editingUser.phone || "");
      if (editingUser.password)
        formData.append("password", editingUser.password);
      if (editingUser.profileImageFile)
        formData.append("profileImage", editingUser.profileImageFile);

      const res = await axios.put(`/user/${editingUser.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Update users table
      setUsers(users.map((u) => (u.id === res.data.id ? res.data : u)));
      setEditingUser(null);
      toast.success("User updated successfully!");
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  return (
    <AuthGuard>
      <Layout>
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-cyan-400">User Management</h1>
          <p className="mt-2 text-gray-400 text-lg">
            Manage your users, roles, and permissions efficiently.
          </p>
        </section>
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <input
            type="text"
            placeholder="Search by email"
            className="p-2 rounded border border-gray-700 bg-gray-900 text-white flex-1"
            value={search.email}
            onChange={(e) => setSearch({ ...search, email: e.target.value })}
          />
          <input
            type="text"
            placeholder="Search by phone"
            className="p-2 rounded border border-gray-700 bg-gray-900 text-white flex-1"
            value={search.phone}
            onChange={(e) => setSearch({ ...search, phone: e.target.value })}
          />
          <select
            className="p-2 rounded border border-gray-700 bg-gray-900 text-white flex-1"
            value={search.role}
            onChange={(e) => setSearch({ ...search, role: e.target.value })}
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
            <option value="MODERATOR">MODERATOR</option>
          </select>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading users...</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow border border-gray-800">
            <table className="min-w-full text-sm text-left text-white">
              <thead className="bg-gray-800 text-cyan-300">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Login</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 bg-gray-900">
                {Array.isArray(users) && users.length > 0 ? (
                  users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800 transition">
                    <td className="px-4 py-3 flex items-center gap-3">
                      <img
                        src={getImageUrl(user.profileImage)}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="font-medium">{user.username}</span>
                    </td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${user.phone}`}
                        className="text-cyan-400 flex items-center gap-1"
                      >
                        <FaPhoneAlt /> {user.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === "ADMIN"
                            ? "bg-purple-600"
                            : "bg-gray-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.isActive ? (
                        <FaCheckCircle className="text-green-500" />
                      ) : (
                        <FaTimesCircle className="text-red-500" />
                      )}
                    </td>
                    <td className="px-4 py-3">{formatDate(user.lastLogin)}</td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        onClick={() => viewUser(user.id)}
                        className="text-cyan-400 hover:text-cyan-300"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleEditClick(user)}
                        className="text-yellow-400 hover:text-yellow-300"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-400"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex justify-center items-center gap-2 my-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span>
                Page {page} of {totalPages || 1}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modal for user details */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 text-white p-6 rounded-xl w-full max-w-md border border-gray-700 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={
                    getImageUrl(selectedUser.profileImage) ||
                    "/default-avatar.png"
                  }
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold text-cyan-300">
                    {selectedUser.username}
                  </h2>
                  <p className="text-sm text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Phone:</strong> {selectedUser.phone}
                </p>
                <p>
                  <strong>Role:</strong> {selectedUser.role}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {selectedUser.isActive ? "Active" : "Inactive"}
                </p>
                <p>
                  <strong>Last Login:</strong>{" "}
                  {formatDate(selectedUser.lastLogin)}
                </p>
                <p>
                  <strong>Joined:</strong> {formatDate(selectedUser.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="mt-6 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded w-full"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 text-white p-6 rounded-xl w-full max-w-md border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-cyan-300 mb-4">
                Edit User
              </h2>

              <input
                type="text"
                name="username"
                value={editingUser.username}
                onChange={handleInputChange}
                placeholder="Username"
                className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
              />

              <input
                type="text"
                name="phone"
                value={editingUser.phone || ""}
                onChange={handleInputChange}
                placeholder="Phone"
                className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
              />

              <input
                type="password"
                name="password"
                value={editingUser.password || ""}
                onChange={handleInputChange}
                placeholder="New Password (leave blank to keep)"
                className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
              />

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="w-full mb-3 p-2 rounded bg-gray-800 text-white"
              />

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleUpdateUser}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 py-2 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </AuthGuard>
  );
};

export default Users;
