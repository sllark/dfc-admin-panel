"use client";

import { useState, useEffect } from "react";
import axios from "@/app/lib/axios";
import toast from "react-hot-toast";
import AuthGuard from "@/app/lib/authGuard";
import Layout from "@/app/components/common/layout";
import DonorModal from "./DonorModal";
import { FiEdit, FiTrash2, FiCheck, FiX } from "react-icons/fi";

export default function DonorRegistrations() {
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);
  const itemsPerPage = 10;

  const fetchDonors = async () => {
    try {
      const res = await axios.get("/donors/donor-registrations");
      // Handle different response structures
      const donorsData = res.data?.data || res.data || [];
      setDonors(Array.isArray(donorsData) ? donorsData : []);
      setFilteredDonors(Array.isArray(donorsData) ? donorsData : []);
    } catch (err) {
      toast.error("Failed to fetch donors");
      setDonors([]);
      setFilteredDonors([]);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  useEffect(() => {
    let filtered = donors;

    if (search) {
      filtered = filtered.filter(
        (d) =>
          d.donorNameFirst.toLowerCase().includes(search.toLowerCase()) ||
          d.donorNameLast.toLowerCase().includes(search.toLowerCase()) ||
          d.panelId.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    setFilteredDonors(filtered);
    setCurrentPage(1);
  }, [search, statusFilter, donors]);

  const totalPages = Math.ceil(filteredDonors.length / itemsPerPage);
  const paginatedDonors = filteredDonors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (donor) => {
    setEditingDonor(donor);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this donor?")) return;
    try {
      await axios.delete(`/api/donors/donor-registration/${id}`);
      toast.success("Donor deleted successfully");
      fetchDonors();
    } catch (err) {
      toast.error("Failed to delete donor");
    }
  };

  const handleConfirm = async (id) => {
    const labcorpNumber = prompt("Enter LabCorp Registration Number:");
    if (!labcorpNumber) return;
    try {
      await axios.post(`/api/donors/donor-registration/${id}/confirm`, {
        labcorpRegistrationNumber: labcorpNumber,
      });
      toast.success("Donor confirmed successfully");
      fetchDonors();
    } catch (err) {
      toast.error("Failed to confirm donor");
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;
    try {
      await axios.post(`/api/donors/donor-registration/${id}/reject`, {
        rejectReason: reason,
      });
      toast.success("Donor rejected successfully");
      fetchDonors();
    } catch (err) {
      toast.error("Failed to reject donor");
    }
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="p-6 max-w-7xl mx-auto bg-gray-900 min-h-screen text-gray-200 rounded-lg">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl font-semibold">Donor Registrations</h1>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded shadow transition"
            >
              + Add Donor
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="Search by name or panel ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border border-gray-700 rounded px-4 py-2 bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-64 border border-gray-700 rounded px-4 py-2 bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="REJECTED">Rejected</option>
              <option value="RESUBMITTED">Resubmitted</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded shadow bg-gray-800">
            <table className="min-w-full text-sm text-left text-gray-200">
              <thead className="bg-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 border-b border-gray-600">ID</th>
                  <th className="px-4 py-3 border-b border-gray-600">Name</th>
                  <th className="px-4 py-3 border-b border-gray-600">Email</th>
                  <th className="px-4 py-3 border-b border-gray-600">
                    Panel ID
                  </th>
                  <th className="px-4 py-3 border-b border-gray-600">
                    Payment Status
                  </th>
                  <th className="px-4 py-3 border-b border-gray-600">Status</th>
                  <th className="px-4 py-3 border-b border-gray-600">
                    Expiration
                  </th>
                  <th className="px-4 py-3 border-b border-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedDonors.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-6 text-gray-400">
                      No donors found.
                    </td>
                  </tr>
                )}
                {paginatedDonors.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-gray-700 border-b border-gray-600"
                  >
                    <td className="px-4 py-2">{d.id}</td>
                    <td className="px-4 py-2">
                      {d.donorNameFirst} {d.donorNameLast}
                    </td>
                    <td className="px-4 py-2">{d.donorEmail}</td>
                    <td className="px-4 py-2">
                      {d.panelId.length > 15
                        ? d.panelId.slice(0, 15) + "..."
                        : d.panelId}
                    </td>

                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          d.paymentStatus === "Paid"
                            ? "bg-green-600 text-green-100"
                            : "bg-gray-600 text-gray-200"
                        }`}
                      >
                        {d.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          d.status === "CONFIRMED"
                            ? "bg-green-600 text-green-100"
                            : d.status === "REJECTED"
                            ? "bg-red-600 text-red-100"
                            : d.status === "RESUBMITTED"
                            ? "bg-yellow-600 text-yellow-100"
                            : "bg-gray-600 text-gray-200"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(
                        d.registrationExpirationDate
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEdit(d)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded flex items-center gap-1"
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                      <button
                        onClick={() => handleConfirm(d.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1"
                        title="Confirm"
                      >
                        <FiCheck />
                      </button>
                      <button
                        onClick={() => handleReject(d.id)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded flex items-center gap-1"
                        title="Reject"
                      >
                        <FiX />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded border ${
                  currentPage === 1
                    ? "text-gray-400 cursor-not-allowed border-gray-600"
                    : "hover:bg-gray-700 border-gray-600"
                }`}
              >
                Prev
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className={`px-4 py-2 ml-2 rounded border ${
                  currentPage === totalPages
                    ? "text-gray-400 cursor-not-allowed border-gray-600"
                    : "hover:bg-gray-700 border-gray-600"
                }`}
              >
                Next
              </button>
            </div>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {/* Add/Edit Modal */}
          <DonorModal
            isOpen={isAddModalOpen}
            onClose={() => {
              setIsAddModalOpen(false);
              setEditingDonor(null);
            }}
            donor={editingDonor}
            onSaved={fetchDonors}
          />
        </div>
      </Layout>
    </AuthGuard>
  );
}
