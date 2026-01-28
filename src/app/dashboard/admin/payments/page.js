'use client'

import React, { useEffect, useState } from 'react';
import Layout from '@/app/components/common/layout';
import AuthGuard from '@/app/lib/authGuard';
import axios from '@/app/lib/axios';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiRefreshCw, FiPlus, FiX } from 'react-icons/fi';
import Pagination from '@/app/components/ui/Pagination';
import StatusBadge from '@/app/components/ui/StatusBadge';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import SearchInput from '@/app/components/ui/SearchInput';
import FilterSelect from '@/app/components/ui/FilterSelect';
import DetailsModal from '@/app/components/ui/DetailsModal';
import { formatDate } from '@/app/utils/dateUtils';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    donorRegistrationId: '',
    amount: '',
    currency: 'USD',
    paymentMethod: 'CARD',
    transactionId: '',
  });
  const itemsPerPage = 10;

  const fetchPayments = async (page = 1, status = '') => {
    setLoading(true);
    try {
      const params = {
        page,
        perPage: itemsPerPage,
      };
      
      if (status) {
        params.status = status;
      }

      const res = await axios.get('/payments', { params });
      if (res.data.success) {
        const paymentsData = res.data.data || [];
        setPayments(paymentsData);
        
        // Update pagination meta from API response
        if (res.data.meta) {
          setTotalPages(res.data.meta.last_page || 1);
          setTotalItems(res.data.meta.total || 0);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch payments');
      setPayments([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(currentPage, statusFilter);
  }, [currentPage, statusFilter]);

  // Client-side search filtering (since API doesn't support search parameter)
  useEffect(() => {
    let filtered = payments;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = payments.filter(
        (p) =>
          String(p.id).toLowerCase().includes(searchLower) ||
          String(p.userId).toLowerCase().includes(searchLower) ||
          String(p.donorRegistrationId).toLowerCase().includes(searchLower) ||
          String(p.transactionId || '').toLowerCase().includes(searchLower) ||
          String(p.amount).toLowerCase().includes(searchLower)
      );
    }

    setFilteredPayments(filtered);
  }, [search, payments]);

  const updateStatus = async (id, status) => {
    try {
      const res = await axios.put(`/payments/${id}/status`, { status });
      if (res.data.success) {
        toast.success('Payment status updated');
        fetchPayments(currentPage, statusFilter);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Use filtered payments for display (after client-side search)
  const displayPayments = filteredPayments;

  const handleRowClick = (payment) => {
    setSelectedPayment(payment);
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/payments', {
        donorRegistrationId: parseInt(createFormData.donorRegistrationId),
        amount: parseFloat(createFormData.amount),
        currency: createFormData.currency,
        paymentMethod: createFormData.paymentMethod,
        transactionId: createFormData.transactionId,
      });
      if (res.data.success) {
        toast.success('Payment created successfully');
        setShowCreateModal(false);
        setCreateFormData({
          donorRegistrationId: '',
          amount: '',
          currency: 'USD',
          paymentMethod: 'CARD',
          transactionId: '',
        });
        fetchPayments(currentPage, statusFilter);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create payment');
    }
  };

  const paymentFields = selectedPayment ? [
    { key: 'id', label: 'Payment ID' },
    { key: 'userId', label: 'User ID' },
    { key: 'donorRegistrationId', label: 'Donor Registration ID' },
    { key: 'amount', label: 'Amount', format: (val) => `${val} ${selectedPayment.currency || ''}` },
    { key: 'currency', label: 'Currency' },
    { key: 'paymentMethod', label: 'Payment Method' },
    { key: 'transactionId', label: 'Transaction ID' },
    { key: 'status', label: 'Status', component: (val) => <StatusBadge status={val} /> },
    { key: 'createdAt', label: 'Created At', format: (val) => formatDate(val) },
    { key: 'updatedAt', label: 'Updated At', format: (val) => formatDate(val) },
  ] : [];

  return (
    <AuthGuard>
      <Layout>
        <div className="p-6 bg-gray-900 min-h-screen text-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Admin Payments</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
            >
              <FiPlus /> Create Payment
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
              onChange={handleStatusFilterChange}
              placeholder="Status"
              options={[
                { value: 'PENDING', label: 'Pending' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'FAILED', label: 'Failed' },
              ]}
              className="w-full md:w-64"
            />
          </div>

          {loading ? (
            <LoadingSpinner message="Loading payments..." />
          ) : (
            <>
              <div className="overflow-x-auto rounded shadow bg-gray-800">
                <table className="w-full border-collapse text-sm text-left text-gray-200 table-auto">
                  <thead className="bg-gray-700 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 border-b border-gray-600">ID</th>
                      <th className="px-4 py-3 border-b border-gray-600">User ID</th>
                      <th className="px-4 py-3 border-b border-gray-600">Donor ID</th>
                      <th className="px-4 py-3 border-b border-gray-600">Amount</th>
                      <th className="px-4 py-3 border-b border-gray-600">Currency</th>
                      <th className="px-4 py-3 border-b border-gray-600">Method</th>
                      <th className="px-4 py-3 border-b border-gray-600 min-w-[200px] max-w-[300px]">Transaction</th>
                      <th className="px-4 py-3 border-b border-gray-600">Status</th>
                      <th className="px-4 py-3 border-b border-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayPayments.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-6 text-gray-400">
                          No payments found
                        </td>
                      </tr>
                    ) : (
                      displayPayments.map((p) => (
                        <tr 
                          key={p.id} 
                          className="border-b border-gray-600 hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleRowClick(p)}
                        >
                          <td className="px-4 py-2">{p.id}</td>
                          <td className="px-4 py-2">{p.userId}</td>
                          <td className="px-4 py-2">{p.donorRegistrationId}</td>
                          <td className="px-4 py-2">{p.amount}</td>
                          <td className="px-4 py-2">{p.currency}</td>
                          <td className="px-4 py-2">{p.paymentMethod}</td>
                          <td className="px-4 py-2 break-words break-all max-w-[300px]">
                            <span className="whitespace-normal">{p.transactionId || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="px-4 py-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                            {p.status === 'PENDING' && (
                              <>
                                <button
                                  className="text-green-400 hover:text-green-600 transition"
                                  onClick={() => updateStatus(p.id, 'COMPLETED')}
                                  title="Mark Completed"
                                >
                                  <FiCheckCircle size={20} />
                                </button>
                                <button
                                  className="text-red-400 hover:text-red-600 transition"
                                  onClick={() => updateStatus(p.id, 'FAILED')}
                                  title="Mark Failed"
                                >
                                  <FiXCircle size={20} />
                                </button>
                              </>
                            )}
                            <button
                              className="text-blue-400 hover:text-blue-600 transition"
                              onClick={() => fetchPayments(currentPage, statusFilter)}
                              title="Refresh"
                            >
                              <FiRefreshCw size={20} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalItems > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  itemLabel="payments"
                />
              )}
            </>
          )}

          {/* Details Modal */}
          <DetailsModal
            isOpen={!!selectedPayment}
            onClose={() => setSelectedPayment(null)}
            title="Payment Details"
            data={selectedPayment}
            fields={paymentFields}
          />

          {/* Create Payment Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 text-white p-6 rounded-lg w-full max-w-md border border-gray-700 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Create Payment</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <FiX size={24} />
                  </button>
                </div>
                <form onSubmit={handleCreatePayment} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Donor Registration ID</label>
                    <input
                      type="number"
                      required
                      className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={createFormData.donorRegistrationId}
                      onChange={(e) => setCreateFormData({ ...createFormData, donorRegistrationId: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={createFormData.amount}
                      onChange={(e) => setCreateFormData({ ...createFormData, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Currency</label>
                    <select
                      required
                      className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={createFormData.currency}
                      onChange={(e) => setCreateFormData({ ...createFormData, currency: e.target.value })}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Payment Method</label>
                    <select
                      required
                      className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={createFormData.paymentMethod}
                      onChange={(e) => setCreateFormData({ ...createFormData, paymentMethod: e.target.value })}
                    >
                      <option value="CARD">CARD</option>
                      <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                      <option value="PAYPAL">PAYPAL</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Transaction ID</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-gray-800 border border-gray-600 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={createFormData.transactionId}
                      onChange={(e) => setCreateFormData({ ...createFormData, transactionId: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default AdminPayments;
