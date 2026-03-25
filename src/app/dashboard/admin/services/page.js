"use client";

import React, { useState, useEffect, useRef } from "react";
import AuthGuard from "@/app/lib/authGuard";
import axios from "@/app/lib/axios";
import toast from "react-hot-toast";
import { FiEdit, FiTrash2, FiPlus, FiX, FiImage } from "react-icons/fi";
import Layout from "@/app/components/common/layout";
import Pagination from "@/app/components/ui/Pagination";
import SearchInput from "@/app/components/ui/SearchInput";
import FilterSelect from "@/app/components/ui/FilterSelect";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import DetailsModal from "@/app/components/ui/DetailsModal";
import StatusBadge from "@/app/components/ui/StatusBadge";
import { getImageUrl } from "@/app/utils/imageUtils";
import { formatDate } from "@/app/utils/dateUtils";
import { ensureMinDuration } from "@/app/lib/loadingUtils";
import LoadingButton from "@/app/components/ui/LoadingButton";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    accountNo: "",
    panelID: "",
    status: false, // active/inactive (unchecked = inactive)
    isQuoteOnly: false, // contact organization vs fixed price
    serviceFee: "", // base/original price input
    hasDiscount: false, // enables discount amount input
    discountAmount: "", // discount amount (base - discount = price)
    bannerImage: null,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" = all, "true" = active, "false" = inactive
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState(null);
  const bannerFileInputRef = useRef(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;


  const fetchServices = async (
    pageNumber = 1,
    searchTerm = "",
    status = ""
  ) => {
    const startedAt = Date.now();
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
      await ensureMinDuration(startedAt, 600);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices(page, search, statusFilter);
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (formData.bannerImage instanceof File) {
      const url = URL.createObjectURL(formData.bannerImage);
      setBannerPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setBannerPreviewUrl(null);
  }, [formData.bannerImage]);

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

    // When adding a new service, default to fixed price (not quote-only).
    const quoteOnly = service
      ? service?.serviceFee == null || Number(service?.serviceFee) === 0
      : false;

    const originalBase = quoteOnly
      ? null
      : service?.originalServiceFee != null &&
          Number(service?.originalServiceFee) > 0
        ? Number(service?.originalServiceFee)
        : Number(service?.serviceFee);

    const updatedPrice = quoteOnly ? null : Number(service?.serviceFee);
    const discountAmount =
      !quoteOnly && originalBase != null && updatedPrice != null
        ? Math.max(0, originalBase - updatedPrice)
        : 0;

    setFormData({
      name: service?.name || "",
      slug: service?.slug || "",
      description: service?.description ?? "",
      accountNo: service?.accountNo ?? "",
      panelID: service?.panelID ?? "",
      status: service ? !!service.status : false,
      isQuoteOnly: !!quoteOnly,
      serviceFee: quoteOnly ? "" : String(originalBase ?? ""),
      hasDiscount: !quoteOnly && discountAmount > 0,
      discountAmount: !quoteOnly && discountAmount > 0 ? String(discountAmount) : "",
      bannerImage: null,
    });
    setShowModal(true);
  };

  const normalizeSlug = (value) =>
    (value ?? "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

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
    const userId = localStorage.getItem("id");
    if (!userId) return toast.error("User ID missing");

    const startedAt = Date.now();
    setSaving(true);

    const normalizedSlug = normalizeSlug(formData.slug);
    const isQuoteOnly = !!formData.isQuoteOnly;

    // Slug uniqueness validation (best-effort via current backend search)
    try {
      const isSlugChanged = !editingService || normalizedSlug !== editingService.slug;
      if (isSlugChanged) {
        const res = await axios.get("/services", {
          params: { page: 1, search: normalizedSlug, status: "" },
          headers: { Authorization: `Bearer ${token}` },
        });
        const conflict = res.data?.data?.some(
          (s) => s?.slug === normalizedSlug && s?.id !== editingService?.id
        );
        if (conflict) return toast.error("Slug already exists");
      }
    } catch (err) {
      // If this check fails (network/back-end), fall back to backend validation.
      console.warn("Slug uniqueness check failed", err);
    }

    if (!formData.name?.trim()) return toast.error("Service name is required");
    if (!normalizedSlug) return toast.error("Slug is required");
    if (!formData.accountNo?.trim()) return toast.error("Account No is required");
    if (!formData.panelID?.trim()) return toast.error("Panel ID is required");

    const descriptionValue = formData.description?.trim();
    const statusValue = !!formData.status;
    const bannerImageFile = formData.bannerImage instanceof File ? formData.bannerImage : null;

    try {
      // Always use multipart/form-data (banner image is optional).
      const form = new FormData();
      form.append("name", formData.name);
      form.append("slug", normalizedSlug);
      if (descriptionValue) form.append("description", descriptionValue);
      form.append("status", String(statusValue));
      form.append("accountNo", formData.accountNo);
      form.append("panelID", formData.panelID);

      if (isQuoteOnly) {
        form.append("serviceFee", "0");
        form.append("discountedServiceFee", "0");
        form.append("originalServiceFee", "0");
      } else {
        const baseServiceFee =
          formData.serviceFee === null || formData.serviceFee === ""
            ? NaN
            : Number(formData.serviceFee);
        if (!Number.isFinite(baseServiceFee) || baseServiceFee <= 0) {
          return toast.error("Service fee must be a positive number");
        }

        const discountOn =
          !!formData.hasDiscount &&
          formData.discountAmount != null &&
          String(formData.discountAmount).trim() !== "";

        const discountNumber = discountOn
          ? Number(formData.discountAmount)
          : 0;

        if (discountOn) {
          if (!Number.isFinite(discountNumber) || discountNumber <= 0) {
            return toast.error("Discount amount must be greater than 0");
          }
          if (discountNumber >= baseServiceFee) {
            return toast.error("Discount amount must be less than service fee");
          }
        }

        const updatedPrice = discountOn
          ? baseServiceFee - discountNumber
          : baseServiceFee;

        form.append("serviceFee", String(updatedPrice));
        if (discountOn) {
          form.append("discountedServiceFee", String(updatedPrice));
          form.append("originalServiceFee", String(baseServiceFee));
        } else {
          // Keep original price column null when no discount.
          form.append("discountedServiceFee", "0");
          form.append("originalServiceFee", "0");
        }
      }

      if (bannerImageFile) form.append("bannerImage", bannerImageFile);

      if (editingService) form.append("updatedBy", userId);
      else form.append("createdBy", userId);

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
    } finally {
      await ensureMinDuration(startedAt, 600);
      setSaving(false);
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

  const baseServiceFeeNumber = Number(formData.serviceFee);
  const canEnableDiscount =
    formData.isQuoteOnly === false &&
    Number.isFinite(baseServiceFeeNumber) &&
    baseServiceFeeNumber > 0;

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
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="min-w-full text-sm text-left text-white">
                <thead className="bg-gray-800 text-cyan-300">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Account No</th>
                    <th className="py-3 px-4">Panel ID</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Original</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Banner</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="py-6 text-center text-gray-500">
                        No services found
                      </td>
                    </tr>
                  ) : (
                    services.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-800 transition cursor-pointer" onClick={() => setSelectedService(s)}>
                        <td className="py-3 px-4">{s.id}</td>
                        <td className="py-3 px-4">{s.name}</td>
                        <td className="py-3 px-4">{s.slug}</td>
                        <td className="py-3 px-4">
                          {s.serviceDescription || s.slug}
                        </td>
                        <td className="py-3 px-4" title={s.accountNo || ""}>
                          {s.accountNo && s.accountNo.length > 8
                            ? `${s.accountNo.slice(0, 8)}...`
                            : s.accountNo || "-"}
                        </td>
                        <td className="py-3 px-4" title={s.panelID || ""}>
                          {s.panelID && s.panelID.length > 8
                            ? `${s.panelID.slice(0, 8)}...`
                            : s.panelID || "-"}
                        </td>
                        <td className="py-3 px-4">
                          {s.serviceFee == null || Number(s.serviceFee) === 0 ? (
                            <span className="text-blue-300 italic">Contact organization</span>
                          ) : (
                            `${
                              Number(s.discountedServiceFee) > 0
                                ? s.discountedServiceFee
                                : s.serviceFee
                            }`
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {s.serviceFee == null || Number(s.serviceFee) === 0 ? (
                            <span className="text-gray-500 italic">-</span>
                          ) : s.originalServiceFee &&
                            Number(s.originalServiceFee) > 0 &&
                            Number(s.originalServiceFee) !==
                              (Number(s.discountedServiceFee) > 0
                                ? Number(s.discountedServiceFee)
                                : Number(s.serviceFee)) ? (
                            <span className="line-through text-gray-400">
                              ${s.originalServiceFee}
                            </span>
                          ) : (
                            <span className="text-gray-500 italic">-</span>
                          )}
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
                            <div className="w-16 h-10 flex items-center justify-center text-gray-500">
                              <FiImage size={22} />
                            </div>
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
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              itemsPerPage={10}
              itemLabel="services"
            />
          </>
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
            { key: 'accountNo', label: 'Account Number' },
            { key: 'panelID', label: 'Panel ID' },
            {
              key: 'serviceDescription',
              label: 'Description',
              format: (val) => (val ? val : selectedService?.slug || "-"),
            },
            {
              key: 'serviceFee',
              label: 'Price',
              format: (val, data) => {
                const quoteOnly = val == null || Number(val) === 0;
                if (quoteOnly) return "Contact organization";
                const discounted = data?.discountedServiceFee;
                if (discounted != null && Number(discounted) > 0) {
                  return `$${discounted}`;
                }
                return `$${val}`;
              },
            },
            {
              key: 'discountedServiceFee',
              label: 'Discounted',
              format: (val) =>
                val == null || Number(val) === 0 ? "-" : `$${val}`,
            },
            {
              key: 'originalServiceFee',
              label: 'Original',
              format: (val) =>
                val == null || Number(val) === 0 ? "-" : `$${val}`,
            },
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
              ) : (
                <div className="w-32 h-32 flex items-center justify-center text-gray-500">
                  <FiImage size={34} />
                </div>
              )
            },
            { key: 'createdAt', label: 'Created At', format: (val) => formatDate(val) },
            { key: 'updatedAt', label: 'Updated At', format: (val) => formatDate(val) },
          ] : []}
        />

        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 text-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] border border-gray-700 shadow-xl flex flex-col">
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-2xl font-semibold text-cyan-300">
                  {editingService ? "Edit Service" : "Add Service"}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition p-1"
                  title="Close"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col flex-1 overflow-hidden"
              >
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto flex-1 pr-2 hide-scrollbar"
                  style={{
                    maxHeight: "calc(90vh - 180px)",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <div className="md:col-span-2 flex flex-col items-center mb-2">
                    <div className="text-sm text-gray-400 mb-2">Banner Image</div>
                    <button
                      type="button"
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="w-32 h-32 rounded-full border border-gray-700 flex items-center justify-center bg-gray-800 overflow-hidden hover:border-gray-500 transition"
                      title="Select banner image"
                    >
                      {bannerPreviewUrl || editingService?.bannerImage ? (
                        <img
                          src={
                            bannerPreviewUrl ||
                            getImageUrl(editingService?.bannerImage)
                          }
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-32 h-32 flex items-center justify-center text-gray-500">
                          <FiImage size={40} />
                        </div>
                      )}
                    </button>
                    <input
                      type="file"
                      ref={bannerFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          bannerImage: e.target.files[0],
                        }))
                      }
                    />
                  </div>

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
                    className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-1"
                    value={formData.accountNo}
                    onChange={(e) =>
                      setFormData({ ...formData, accountNo: e.target.value })
                    }
                    required
                  />

                  <input
                    type="text"
                    placeholder="Panel ID"
                    className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-1"
                    value={formData.panelID}
                    onChange={(e) =>
                      setFormData({ ...formData, panelID: e.target.value })
                    }
                    required
                  />

                  <textarea
                    placeholder="Description"
                    className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] md:col-span-2"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm text-white">
                      <input
                        type="checkbox"
                        checked={formData.status === true}
                        className="h-6 w-6"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.checked,
                          })
                        }
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white">
                      <input
                        type="checkbox"
                        checked={formData.isQuoteOnly}
                        className="h-6 w-6"
                        onChange={(e) => {
                          const next = e.target.checked;
                          setFormData({
                            ...formData,
                            isQuoteOnly: next,
                            hasDiscount: false,
                            discountAmount: "",
                            serviceFee: next ? "" : formData.serviceFee,
                          });
                        }}
                      />
                      Contact organization
                    </label>
                  </div>

                  {!formData.isQuoteOnly ? (
                    <>
                      {!formData.hasDiscount ? (
                        <input
                          type="number"
                          placeholder="Service fee"
                          className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                          value={formData.serviceFee ?? ""}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            const nextNum = Number(nextValue);
                            setFormData((prev) => {
                              const keepDiscount =
                                prev.hasDiscount &&
                              Number.isFinite(nextNum) &&
                              nextNum > 0;
                              return {
                                ...prev,
                                serviceFee: nextValue,
                                hasDiscount: keepDiscount,
                                discountAmount: keepDiscount
                                  ? prev.discountAmount
                                  : "",
                              };
                            });
                          }}
                          min="1"
                          step="1"
                          required
                        />
                      ) : (
                        <>
                          {(() => {
                            const base = Number(formData.serviceFee);
                            const discountNum = Number(formData.discountAmount);
                            const showDiscount =
                              Number.isFinite(base) &&
                              base > 0 &&
                              Number.isFinite(discountNum) &&
                              discountNum > 0;
                            const finalPrice = showDiscount
                              ? base - discountNum
                              : null;
                            const name = formData.name?.trim() || "Service";
                            return (
                              <div className="md:col-span-2 text-sm text-gray-400">
                                {showDiscount ? (
                                `${name} has a discount of $${discountNum}. Service fee will be calculated as $${finalPrice}.`
                                ) : (
                                  `Pricing`
                                )}
                              </div>
                            );
                          })()}
                          <input
                            type="number"
                            placeholder="Service fee"
                            className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.serviceFee ?? ""}
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              const nextNum = Number(nextValue);
                              setFormData((prev) => {
                                const keepDiscount =
                                  prev.hasDiscount &&
                                  Number.isFinite(nextNum) &&
                                  nextNum > 0;
                                return {
                                  ...prev,
                                  serviceFee: nextValue,
                                  hasDiscount: keepDiscount,
                                  discountAmount: keepDiscount
                                    ? prev.discountAmount
                                    : "",
                                };
                              });
                            }}
                            min="1"
                            step="1"
                            required
                          />
                          <input
                            type="number"
                            placeholder="Discount amount"
                            className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.discountAmount ?? ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                discountAmount: e.target.value,
                              })
                            }
                            min="1"
                            step="1"
                          />
                        </>
                      )}

                      <label className="md:col-span-2 flex items-center gap-2 text-sm text-white">
                        <input
                          type="checkbox"
                          checked={formData.hasDiscount}
                          disabled={!canEnableDiscount}
                          className="h-6 w-6"
                          onChange={(e) => {
                            const next = e.target.checked;
                            setFormData((prev) => ({
                              ...prev,
                              hasDiscount: next,
                              discountAmount: next ? prev.discountAmount : "",
                            }));
                          }}
                        />
                        Add discount
                      </label>
                    </>
                  ) : null}
                </div>

                <div className="mt-6 flex justify-end flex-shrink-0 gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <LoadingButton
                    type="submit"
                    loading={saving}
                    spinnerColor="#93c5fd"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white disabled:opacity-100 disabled:cursor-not-allowed"
                  >
                    Save
                  </LoadingButton>
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
