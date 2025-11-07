import React, { useEffect, useState } from 'react';

// Simple employee dashboard implementing part 3 required flows:
// - view pending payments, approve/deny (PUT)
// - view history of approved/denied payments
// - logout handled via AuthContext (uses token)

const EmployeeDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/employee/transactions?status=pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError('Unauthorized. Please login again.');
          setTransactions([]);
        } else {
          const errBody = await res.json().catch(() => ({}));
          setError(errBody.message || 'Failed to load transactions');
        }
        return;
      }
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/employee/transactions?status=all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError('Unauthorized. Please login again.');
          setTransactions([]);
        } else {
          const errBody = await res.json().catch(() => ({}));
          setError(errBody.message || 'Failed to load history');
        }
        return;
      }
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/employee/transactions/${id}/status`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setTransactions(t => t.map(tx => (tx._id === id ? { ...tx, status } : tx)));
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to update');
      }
    } catch (err) {
      setError('Failed to update status');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Employee Portal</h1>
        <div>
          <button onClick={() => fetchPending()} className="mr-2 px-3 py-1 border rounded">Pending</button>
          <button onClick={() => fetchHistory()} className="px-3 py-1 border rounded">History</button>
        </div>
      </header>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="bg-white rounded shadow overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-600">{error ? error : 'No transactions found.'}</div>
        ) : (
          <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left">Amount</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx._id} className="border-t">
                <td className="px-4 py-2">{tx._id}</td>
                <td className="px-4 py-2">{tx.userId?.name || tx.userId || 'N/A'}</td>
                <td className="px-4 py-2">${tx.amount} {tx.currency}</td>
                <td className="px-4 py-2">{tx.status}</td>
                <td className="px-4 py-2">
                  {tx.status === 'pending' ? (
                    <>
                      <button onClick={() => updateStatus(tx._id, 'completed')} className="mr-2 px-2 py-1 bg-green-500 text-white rounded">Approve</button>
                      <button onClick={() => updateStatus(tx._id, 'failed')} className="px-2 py-1 bg-red-500 text-white rounded">Deny</button>
                    </>
                  ) : (
                    <span className="text-sm text-gray-600">No actions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
