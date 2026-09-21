import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { incomeAPI, expenseAPI } from '../services/api';

const DashboardLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [entryType, setEntryType] = useState('expense'); // 'income' or 'expense'

  // Quick form state
  const [amount, setAmount] = useState('');
  const [categoryOrSource, setCategoryOrSource] = useState('Food');
  const [description, setDescription] = useState('');
  const [dateVal, setDateVal] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-finance-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading Personal Finance Advisor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (entryType === 'income') {
        await incomeAPI.create({
          amount: parseFloat(amount),
          source: categoryOrSource,
          date: dateVal,
          description: description
        });
      } else {
        await expenseAPI.create({
          amount: parseFloat(amount),
          category: categoryOrSource,
          date: dateVal,
          description: description
        });
      }
      setAddModalOpen(false);
      setAmount('');
      setDescription('');
      // Reload current route data by reloading or dispatching event
      window.dispatchEvent(new Event('finance_data_updated'));
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save entry. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-finance-bg">
      <Navbar 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        onOpenAddModal={() => setAddModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Quick Add Modal */}
      <Modal 
        isOpen={addModalOpen} 
        onClose={() => setAddModalOpen(false)} 
        title={entryType === 'income' ? 'Record New Income' : 'Record New Expense'}
      >
        <form onSubmit={handleQuickAdd} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs font-semibold rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Toggle Type */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => { setEntryType('expense'); setCategoryOrSource('Food'); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                entryType === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              💸 Expense
            </button>
            <button
              type="button"
              onClick={() => { setEntryType('income'); setCategoryOrSource('Salary'); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                entryType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              💰 Income
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 2500"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {entryType === 'income' ? 'Income Source' : 'Expense Category'}
            </label>
            <select
              value={categoryOrSource}
              onChange={(e) => setCategoryOrSource(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 cursor-pointer"
            >
              {entryType === 'income' ? (
                <>
                  <option value="Salary">Salary</option>
                  <option value="Freelancing">Freelancing</option>
                  <option value="Part-time job">Part-time job</option>
                  <option value="Business">Business</option>
                  <option value="Scholarship">Scholarship</option>
                  <option value="Allowance">Allowance</option>
                  <option value="Other">Other</option>
                </>
              ) : (
                <>
                  <option value="Food">Food & Dining</option>
                  <option value="Rent">Rent & Housing</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Transport">Transport & Fuel</option>
                  <option value="Utilities">Utilities & WiFi</option>
                  <option value="Education">Education</option>
                  <option value="Healthcare">Healthcare & Meds</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Bills">Bills & Recharges</option>
                  <option value="EMI/Loans">EMI / Loans</option>
                  <option value="Travel">Travel</option>
                  <option value="Personal">Personal Care</option>
                  <option value="Other">Other</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={dateVal}
              onChange={(e) => setDateVal(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Swiggy order or Client invoice"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DashboardLayout;
