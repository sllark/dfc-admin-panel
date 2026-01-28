"use client";

import React, { useState, useEffect } from "react";
import AuthGuard from "@/app/lib/authGuard";
import axios from "@/app/lib/axios";
import toast from "react-hot-toast";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import Layout from "@/app/components/common/layout";
import Pagination from "@/app/components/ui/Pagination";
import SearchInput from "@/app/components/ui/SearchInput";
import FilterSelect from "@/app/components/ui/FilterSelect";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import DetailsModal from "@/app/components/ui/DetailsModal";
import StatusBadge from "@/app/components/ui/StatusBadge";
import { getImageUrl } from "@/app/utils/imageUtils";
import { formatDate } from "@/app/utils/dateUtils";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    serviceFee: "",
    panelID: "",
    accountNo: "",
    bannerImage: null,
    status: true,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" = all, "true" = active, "false" = inactive
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedService, setSelectedService] = useState(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;


  const fetchServices = async (
    pageNumber = 1,
    searchTerm = "",
    status = ""
  ) => {
    try {
      setLoading(true);
      const res = await axios.get("/services", {
        params: { page: pageNumber, search: searchTerm, status },
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(res.data.data);
      setTotalPages(res.data.meta?.last_page || 1);
      setTotalItems(res.data.meta?.total || res.data.data?.length || 0);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices(page, search, statusFilter);
  }, [page, search, statusFilter]);

  const handleDelete = async (id) => {
    const updatedBy = localStorage.getItem("id");
    if (!token) return toast.error("Unauthorized");
    if (!updatedBy) return toast.error("User ID missing");

    try {
      await axios.delete(`/services/${id}`, {
        headers: { Authorization: token },
        data: { updatedBy },
      });
      toast.success("Service deleted");
      fetchServices(page, search, statusFilter);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete");
    }
  };

  const confirmDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      handleDelete(id);
    }
  };

  const openModal = (service = null) => {
    setEditingService(service);
    setFormData({
      name: service?.name || "",
      slug: service?.slug || "",
      serviceFee: service?.serviceFee || "",
      accountNo: service?.accountNo || "",
      panelID: service?.panelID || "",
      bannerImage: null,
      status: service?.status ?? true,
    });
    setShowModal(true);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    setFormData({ ...formData, name, slug });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("Unauthorized");

    const form = new FormData();
    const userId = localStorage.getItem("id");

    // Only append fields that changed
    if (!editingService || formData.name !== editingService.name) {
      form.append("name", formData.name);
    }

    if (!editingService || formData.slug !== editingService.slug) {
      form.append("slug", formData.slug);
    }
    
    if (!editingService || formData.serviceFee !== editingService.serviceFee) {
      form.append("serviceFee", formData.serviceFee);
    }

    if (!editingService || formData.accountNo !== editingService.accountNo) {
      form.append("accountNo", formData.accountNo);
    }

    if (!editingService || formData.panelID !== editingService.panelID) {
      form.append("panelID", formData.panelID);
    }

    if (!editingService || formData.status !== editingService.status) {
      form.append("status", String(formData.status));
    }

    // Append banner image only if a new file is selected
    if (formData.bannerImage instanceof File) {
      form.append("bannerImage", formData.bannerImage);
    }

    // Append createdBy or updatedBy
    if (editingService) {
      form.append("updatedBy", userId);
    } else {
      form.append("createdBy", userId);
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      if (editingService) {
        await axios.put(`/services/${editingService.id}`, form, config);
        toast.success("Service updated");
      } else {
        await axios.post("/services", form, config);
        toast.success("Service created");
      }

      setShowModal(false);
      fetchServices(page, search, statusFilter);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save");
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-semibold text-white">Services</h1>
          <div className="flex gap-4 flex-wrap">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              className="flex-1 min-w-[200px]"
            />
            <FilterSelect
              value={statusFilter}
              onChange={handleStatusFilterChange}
              placeholder="Status"
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
            />
            <button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
              onClick={() => openModal()}
            >
              <FiPlus /> Add Service
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading services..." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="min-w-full text-sm text-left text-white">
              <thead className="bg-gray-800 text-cyan-300">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Service Fee</th>
                  <th className="py-3 px-4">Account No</th>
                  <th className="py-3 px-4">Panel ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Banner</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-700">
                {services.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-gray-500">
                      No services found
                    </td>
                  </tr>
                ) : (
                  services.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-800 transition cursor-pointer" onClick={() => setSelectedService(s)}>
                      <td className="py-3 px-4">{s.id}</td>
                      <td className="py-3 px-4">{s.name}</td>
                      <td className="py-3 px-4">{s.slug}</td>
                      <td className="py-3 px-4">${s.serviceFee}</td>
                      <td className="py-3 px-4" title={s.accountNo || ''}>
                        {s.accountNo && s.accountNo.length > 8
                          ? `${s.accountNo.slice(0, 8)}...`
                          : s.accountNo || '-'}
                      </td>
                      <td className="py-3 px-4" title={s.panelID || ''}>
                        {s.panelID && s.panelID.length > 8
                          ? `${s.panelID.slice(0, 8)}...`
                          : s.panelID || '-'}
                      </td>

                      <td className="py-3 px-4">
                        {s.status ? "Active" : "Inactive"}
                      </td>
                      <td className="py-3 px-4">
                        {s.bannerImage ? (
                          <img
                            src={getImageUrl(s.bannerImage)}
                            alt="Banner"
                            className="h-10 w-16 object-cover rounded"
                          />
                        ) : (
                          <span className="text-gray-500 italic">No image</span>
                        )}
                      </td>
                      <td className="py-3 px-4 flex gap-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="text-blue-400 hover:text-blue-600"
                          onClick={() => openModal(s)}
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="text-red-400 hover:text-red-600"
                          onClick={() => confirmDelete(s.id)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              itemsPerPage={10}
              itemLabel="services"
            />
          </div>
        )}

        {/* Details Modal */}
        <DetailsModal
          isOpen={!!selectedService}
          onClose={() => setSelectedService(null)}
          title="Service Details"
          data={selectedService}
          fields={selectedService ? [
            { key: 'id', label: 'Service ID' },
            { key: 'name', label: 'Service Name' },
            { key: 'slug', label: 'Slug' },
            { key: 'serviceFee', label: 'Service Fee', format: (val) => `$${val}` },
            { key: 'accountNo', label: 'Account Number' },
            { key: 'panelID', label: 'Panel ID' },
            { 
              key: 'status', 
              label: 'Status', 
              component: (val) => val ? <StatusBadge status="ACTIVE" /> : <StatusBadge status="INACTIVE" />
            },
            { 
              key: 'bannerImage', 
              label: 'Banner Image', 
              component: (val) => val ? (
                <img
                  src={getImageUrl(val)}
                  alt="Banner"
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : <span className="text-gray-500 italic">No image</span>
            },
            { key: 'createdAt', label: 'Created At', format: (val) => formatDate(val) },
            { key: 'updatedAt', label: 'Updated At', format: (val) => formatDate(val) },
          ] : []}
        />

        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-900 text-white p-6 rounded-lg w-full max-w-md border border-gray-700 shadow-xl">
              <h2 className="text-xl font-semibold mb-4">
                {editingService ? "Edit Service" : "Add Service"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Service Name"
                  className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                />
                <input
                  type="text"
                  placeholder="Slug"
                  className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Account No"
                  className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.accountNo}
                  onChange={(e) =>
                    setFormData({ ...formData, accountNo: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Panel ID"
                  className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.panelID}
                  onChange={(e) =>
                    setFormData({ ...formData, panelID: e.target.value })
                  }
                  required
                />
                <input
                  type="number"
                  placeholder="Service Fee"
                  className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.serviceFee}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceFee: e.target.value })
                  }
                  required
                />
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value === "true",
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-gray-300"
                  onChange={(e) =>
                    setFormData({ ...formData, bannerImage: e.target.files[0] })
                  }
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Layout>
    </AuthGuard>
  );
};

export default Services;
