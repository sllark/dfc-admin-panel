"use client";

import { useState, useEffect } from "react";
import axios from "@/app/lib/axios";
import toast from "react-hot-toast";
import AuthGuard from "@/app/lib/authGuard";
import Layout from "@/app/components/common/layout";
import DonorModal from "./DonorModal";
import { FiEdit, FiTrash2, FiCheck, FiX } from "react-icons/fi";
import Pagination from "@/app/components/ui/Pagination";
import StatusBadge from "@/app/components/ui/StatusBadge";
import SearchInput from "@/app/components/ui/SearchInput";
import FilterSelect from "@/app/components/ui/FilterSelect";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import DetailsModal from "@/app/components/ui/DetailsModal";
import { formatSimpleDate, formatDate } from "@/app/utils/dateUtils";

export default function DonorRegistrations() {
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const itemsPerPage = 10;

  const fetchDonors = async () => {
    try {
      let allDonors = [];
      let currentPage = 1;
      let lastPage = 1;
      let hasMorePages = true;

      // Fetch all pages to get all donors
      while (hasMorePages) {
        const res = await axios.get("/donors/donor-registrations", {
          params: { page: currentPage }
        });

        // Handle response structure
        const responseData = res.data?.data || res.data || [];
        const meta = res.data?.meta || {};

        // Extract donors from current page
        let pageDonors = [];
        if (Array.isArray(responseData)) {
          pageDonors = responseData;
        } else if (typeof responseData === 'object') {
          pageDonors = responseData.donors || responseData.registrations || responseData.items || [];
        }

        // Add to all donors array
        allDonors = [...allDonors, ...pageDonors];

        // Check if there are more pages
        lastPage = meta.last_page || meta.totalPages || 1;
        hasMorePages = currentPage < lastPage;
        currentPage++;
      }

      console.log(`Fetched ${allDonors.length} total donors from ${lastPage} page(s)`); // Debug log

      setDonors(allDonors);
      setFilteredDonors(allDonors);
    } catch (err) {
      console.error("Fetch donors error:", err);
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

  // Calculate pagination
  const totalDonors = filteredDonors.length;
  const totalPages = Math.max(1, Math.ceil(totalDonors / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDonors = filteredDonors.slice(startIndex, endIndex);

  // Reset to page 1 if current page is beyond total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

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
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <FilterSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Status"
              options={[
                { value: 'PENDING', label: 'Pending' },
                { value: 'CONFIRMED', label: 'Confirmed' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'RESUBMITTED', label: 'Resubmitted' },
              ]}
              className="w-full md:w-64"
            />
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
                    className="hover:bg-gray-700 border-b border-gray-600 cursor-pointer"
                    onClick={() => setSelectedDonor(d)}
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
                      <StatusBadge status={d.paymentStatus} />
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-2">
                      {formatSimpleDate(d.registrationExpirationDate)}
                    </td>
                    <td className="px-4 py-2 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
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
          {totalDonors > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalDonors}
              itemsPerPage={itemsPerPage}
              itemLabel="donors"
            />
          )}

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

          {/* Details Modal */}
          <DetailsModal
            isOpen={!!selectedDonor}
            onClose={() => setSelectedDonor(null)}
            title="Donor Registration Details"
            data={selectedDonor}
            fields={selectedDonor ? [
              { key: 'id', label: 'ID' },
              { key: 'donorNameFirst', label: 'First Name' },
              { key: 'donorNameLast', label: 'Last Name' },
              { key: 'donorEmail', label: 'Email' },
              { key: 'donorStateOfResidence', label: 'State of Residence' },
              { key: 'donorSSN', label: 'SSN' },
              { key: 'donorDateOfBirth', label: 'Date of Birth', format: (val) => formatSimpleDate(val) },
              { key: 'panelId', label: 'Panel ID' },
              { key: 'reasonForTest', label: 'Reason for Test' },
              { key: 'registrationExpirationDate', label: 'Registration Expiration Date', format: (val) => formatSimpleDate(val) },
              { key: 'labcorpRegistrationNumber', label: 'LabCorp Registration Number' },
              { key: 'paymentStatus', label: 'Payment Status', component: (val) => <StatusBadge status={val} /> },
              { key: 'status', label: 'Status', component: (val) => <StatusBadge status={val} /> },
              { key: 'createdAt', label: 'Created At', format: (val) => formatDate(val) },
              { key: 'updatedAt', label: 'Updated At', format: (val) => formatDate(val) },
            ] : []}
          />
        </div>
      </Layout>
    </AuthGuard>
  );
}
