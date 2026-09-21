import React, { useState, useEffect } from 'react';
import { goalAPI } from '../services/api';
import { formatINR, formatPercent, formatDate } from '../utils/formatters';
import Modal from '../components/Modal';
import { 
  Target, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Trash2, 
  PiggyBank, 
  ShieldCheck, 
  Sparkles,
  AlertCircle 
} from 'lucide-react';

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [totalTarget, setTotalTarget] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal states for Create/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    goal_name: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    description: ''
  });

  // Modal state for Add Funds
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [selectedGoalForFunds, setSelectedGoalForFunds] = useState(null);
  const [fundsToAdd, setFundsToAdd] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await goalAPI.getAll();
      setGoals(res.data.goals || []);
      setTotalTarget(res.data.total_target || 0);
      setTotalSaved(res.data.total_saved || 0);
      setOverallProgress(res.data.overall_progress || 0);
    } catch (err) {
      console.error("Failed to load goals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openAddModal = () => {
    setEditingGoal(null);
    setFormData({
      goal_name: '',
      target_amount: '',
      current_amount: '',
      target_date: '',
      description: ''
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (g) => {
    setEditingGoal(g);
    setFormData({
      goal_name: g.goal_name,
      target_amount: g.target_amount,
      current_amount: g.current_amount,
      target_date: g.target_date || '',
      description: g.description || ''
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openAddFundsModal = (g) => {
    setSelectedGoalForFunds(g);
    setFundsToAdd('');
    setErrorMsg('');
    setFundModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (editingGoal) {
        await goalAPI.update(editingGoal.id, {
          ...formData,
          target_amount: parseFloat(formData.target_amount),
          current_amount: parseFloat(formData.current_amount || 0)
        });
      } else {
        await goalAPI.create({
          ...formData,
          target_amount: parseFloat(formData.target_amount),
          current_amount: parseFloat(formData.current_amount || 0)
        });
      }
      setModalOpen(false);
      fetchGoals();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save goal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    if (!selectedGoalForFunds) return;
    setErrorMsg('');
    setSubmitting(true);

    try {
      await goalAPI.updateProgress(selectedGoalForFunds.id, {
        add_amount: parseFloat(fundsToAdd)
      });
      setFundModalOpen(false);
      fetchGoals();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add funds.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this financial goal?")) return;
    try {
      await goalAPI.delete(id);
      fetchGoals();
    } catch (err) {
      alert("Failed to delete financial goal.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Target className="w-7 h-7 text-indigo-600" />
            Financial Goals & Savings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Build emergency funds and track targeted milestones
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>New Financial Goal</span>
        </button>
      </div>

      {/* Progress Milestone Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-100">
              Total Accumulated Across Goals
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {formatINR(totalSaved)}
              </h2>
              <span className="text-sm font-semibold text-indigo-200">
                of {formatINR(totalTarget)} target
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/20 text-center sm:text-right">
            <span className="text-xs text-indigo-100 font-medium">Overall Progress</span>
            <p className="text-2xl font-black text-white">{formatPercent(overallProgress)}</p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 w-full bg-black/20 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-700"
            style={{ width: `${Math.min(100, overallProgress)}%` }}
          />
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Loading financial goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-card max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <PiggyBank className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No active savings goals</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Creating targeted goals (like an Emergency Fund or Laptop) gives your monthly savings a clear mission.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => {
            const isCompleted = g.is_completed;
            return (
              <div
                key={g.id}
                className={`bg-white rounded-2xl p-5 border shadow-card flex flex-col justify-between transition-all ${
                  isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">{g.goal_name}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(g)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {g.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{g.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{formatINR(g.current_amount)}</span>
                      <span className="text-slate-500 font-medium">{formatINR(g.target_amount)}</span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${g.progress_percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-indigo-600">{g.progress_percentage}% funded</span>
                      <span>{formatINR(g.remaining_amount)} remaining</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {g.target_date ? (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Target: {formatDate(g.target_date)}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">No deadline</span>
                  )}

                  <button
                    onClick={() => openAddFundsModal(g)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Funds</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGoal ? "Edit Financial Goal" : "Create New Financial Goal"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs font-semibold rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Goal Name *
            </label>
            <input
              type="text"
              required
              value={formData.goal_name}
              onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
              placeholder="e.g. Emergency Fund (6 Months) or New Laptop"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="100"
                  min="500"
                  required
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  placeholder="e.g. 150000"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Currently Saved (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                  placeholder="e.g. 25000"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target Date (Optional)
            </label>
            <input
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Why is this goal important? (e.g. 3-6 months essential expenses buffer)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingGoal ? 'Update Goal' : 'Save Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Add Funds Modal */}
      <Modal
        isOpen={fundModalOpen}
        onClose={() => setFundModalOpen(false)}
        title={`Add Savings to "${selectedGoalForFunds?.goal_name}"`}
      >
        <form onSubmit={handleAddFunds} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs font-semibold rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Current Progress:</span>
              <span className="font-bold text-slate-900">{formatINR(selectedGoalForFunds?.current_amount)} / {formatINR(selectedGoalForFunds?.target_amount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Amount to Deposit (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="100"
                min="50"
                required
                value={fundsToAdd}
                onChange={(e) => setFundsToAdd(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setFundModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Depositing...' : 'Confirm Deposit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GoalsPage;
