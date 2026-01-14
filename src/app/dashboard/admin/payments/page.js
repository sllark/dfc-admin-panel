'use client'

import React, { useEffect, useState } from 'react';
import Layout from '@/app/components/common/layout';
import AuthGuard from '@/app/lib/authGuard';
import axios from '@/app/lib/axios';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/payments');
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await axios.put(`/payments/${id}/status`, { status });
      if (res.data.success) {
        toast.success('Payment status updated');
        fetchPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <AuthGuard>
      <Layout>
        <div className="p-6 bg-gray-900 min-h-screen text-gray-100">
          <h1 className="text-2xl font-bold mb-6">Admin Payments</h1>

          {loading ? (
            <p>Loading payments...</p>
          ) : payments.length === 0 ? (
            <p>No payments found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-700">
                <thead className="bg-gray-800 text-gray-300">
                  <tr>
                    <th className="p-2 text-left">ID</th>
                    <th className="p-2 text-left">User ID</th>
                    <th className="p-2 text-left">Donor ID</th>
                    <th className="p-2 text-left">Amount</th>
                    <th className="p-2 text-left">Currency</th>
                    <th className="p-2 text-left">Method</th>
                    <th className="p-2 text-left">Transaction</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-800">
                      <td className="p-2">{p.id}</td>
                      <td className="p-2">{p.userId}</td>
                      <td className="p-2">{p.donorRegistrationId}</td>
                      <td className="p-2">{p.amount}</td>
                      <td className="p-2">{p.currency}</td>
                      <td className="p-2">{p.paymentMethod}</td>
                      <td className="p-2">{p.transactionId}</td>
                      <td className={`p-2 font-semibold ${p.status === 'COMPLETED' ? 'text-green-400' : p.status === 'FAILED' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {p.status}
                      </td>
                      <td className="p-2 flex gap-2">
                        {p.status === 'PENDING' && (
                          <>
                            <button
                              className="text-green-400 hover:text-green-600"
                              onClick={() => updateStatus(p.id, 'COMPLETED')}
                              title="Mark Completed"
                            >
                              <FiCheckCircle size={20} />
                            </button>
                            <button
                              className="text-red-400 hover:text-red-600"
                              onClick={() => updateStatus(p.id, 'FAILED')}
                              title="Mark Failed"
                            >
                              <FiXCircle size={20} />
                            </button>
                          </>
                        )}
                        <button
                          className="text-blue-400 hover:text-blue-600"
                          onClick={fetchPayments}
                          title="Refresh"
                        >
                          <FiRefreshCw size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  );
};

export default AdminPayments;
