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

const DEFAULT_ACCOUNT_NUMBER = "09456155";

export default function DonorRegistrations() {
  const [donors, setDonors] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDonors, setTotalDonors] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const itemsPerPage = 10;

  const fetchDonors = async (page = 1, overrides = {}) => {
    try {
      const effectiveSearch = overrides.search ?? search;
      const effectiveStatus = overrides.status ?? statusFilter;

      const res = await axios.get("/donors/donor-registrations", {
        params: {
          page,
          perPage: itemsPerPage,
          search: effectiveSearch || undefined,
          status: effectiveStatus || undefined,
        },
      });

      const responseData = res.data?.data || [];
      const meta = res.data?.meta || {};

      setDonors(responseData);
      setFilteredDonors(responseData);
      setTotalDonors(meta.total || responseData.length || 0);
      setTotalPages(meta.last_page || meta.totalPages || 1);
      setCurrentPage(meta.current_page || page || 1);
    } catch (err) {
      console.error("Fetch donors error:", err);
      toast.error("Failed to fetch donors");
      setDonors([]);
      setFilteredDonors([]);
    }
  };

  useEffect(() => {
    fetchDonors(1);
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
  const effectiveTotalPages = Math.max(1, totalPages || 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDonors = filteredDonors.slice(startIndex, endIndex);

  // Reset to page 1 if current page is beyond total pages
  useEffect(() => {
    if (currentPage > effectiveTotalPages && effectiveTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [effectiveTotalPages, currentPage]);

  const handleEdit = (donor) => {
    setEditingDonor(donor);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this donor?")) return;
    try {
      await axios.delete(`/donors/donor-registration/${id}`);
      toast.success("Donor deleted successfully");
      fetchDonors(currentPage);
    } catch (err) {
      toast.error("Failed to delete donor");
    }
  };

  const handleConfirm = async (donor) => {
    try {
      const payload = {
        donorNameFirst: donor.donorNameFirst,
        donorNameLast: donor.donorNameLast,
        donorSex: donor.donorSex,
        donorDateOfBirth: donor.donorDateOfBirth,
        donorSSN: donor.donorSSN,
        donorStateOfResidence: donor.donorStateOfResidence,
        panelId: donor.panelId,
        accountNumber: donor.accountNumber || DEFAULT_ACCOUNT_NUMBER,
        testingAuthority: donor.testingAuthority,
        registrationExpirationDate: donor.registrationExpirationDate,
        donorReasonForTest: donor.donorReasonForTest || donor.reasonForTest,
        splitSpecimenRequested: true,
      };

      const res = await axios.post(
        "/donors/donor-registration/confirm-direct",
        payload
      );

      const data = res.data || {};

      if (!data.success) {
        throw new Error(data.message || "Failed to confirm donor registration");
      }

      toast.success(
        data.labcorpRegistrationNumber
          ? `Donor confirmed. LabCorp Reg#: ${data.labcorpRegistrationNumber}`
          : "Donor confirmed successfully"
      );
      fetchDonors();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to confirm donor";
      toast.error(message);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;
    try {
      await axios.post(`/donors/donor-registration/${id}/reject`, {
        rejectReason: reason,
      });
      toast.success("Donor rejected successfully");
      fetchDonors(currentPage);
    } catch (err) {
      toast.error("Failed to reject donor");
    }
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-semibold text-white">Donor Registrations</h1>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded shadow transition"
            >
              + Add Donor
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
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
                        onClick={() => handleConfirm(d)}
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
