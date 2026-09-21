import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { budgetAPI, aiAPI } from '../services/api';
import { formatINR, formatPercent, getMonthName } from '../utils/formatters';
import Modal from '../components/Modal';
import { 
  PieChart, 
  Plus, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  ArrowRight,
  TrendingDown,
  Info 
} from 'lucide-react';

const BudgetsPage = () => {
  const { selectedMonth, selectedYear } = useAuth();
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states for single budget
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [category, setCategory] = useState('Food');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // AI Generator modal states
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [customIncome, setCustomIncome] = useState('');

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await budgetAPI.getAll({ month: selectedMonth, year: selectedYear });
      setBudgetData(res.data);
    } catch (err) {
      console.error("Failed to load budgets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const openAddModal = () => {
    setEditingBudget(null);
    setCategory('Food');
    setMonthlyLimit('');
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (b) => {
    setEditingBudget(b);
    setCategory(b.category);
    setMonthlyLimit(b.monthly_limit);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (editingBudget) {
        await budgetAPI.update(editingBudget.id, {
          category,
          monthly_limit: parseFloat(monthlyLimit)
        });
      } else {
        await budgetAPI.save({
          category,
          monthly_limit: parseFloat(monthlyLimit),
          month: selectedMonth,
          year: selectedYear
        });
      }
      setModalOpen(false);
      fetchBudgets();
      window.dispatchEvent(new Event('finance_data_updated'));
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save budget limit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this category budget limit?")) return;
    try {
      await budgetAPI.delete(id);
      fetchBudgets();
      window.dispatchEvent(new Event('finance_data_updated'));
    } catch (err) {
      alert("Failed to delete budget limit.");
    }
  };

  // AI Budget Generator Handlers
  const handleOpenAiGenerator = async () => {
    setAiModalOpen(true);
    setAiLoading(true);
    try {
      const res = await aiAPI.generateBudget({
        monthly_income: customIncome ? parseFloat(customIncome) : undefined
      });
      setGeneratedPlan(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiBudgets = async () => {
    if (!generatedPlan?.budgets) return;
    setSubmitting(true);
    try {
      await budgetAPI.saveBatch({
        month: selectedMonth,
        year: selectedYear,
        budgets: generatedPlan.budgets
      });
      setAiModalOpen(false);
      fetchBudgets();
      window.dispatchEvent(new Event('finance_data_updated'));
    } catch (err) {
      alert("Failed to apply generated budgets.");
    } finally {
      setSubmitting(false);
    }
  };

  const budgets = budgetData?.budgets || [];
  const totalBudget = budgetData?.total_budget || 0;
  const totalSpent = budgetData?.total_spent_on_budgeted || 0;
  const exceededCount = budgetData?.exceeded_count || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <PieChart className="w-7 h-7 text-blue-600" />
            Budget Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Category spending limits & adherence for <span className="font-semibold text-slate-800">{getMonthName(selectedMonth)} {selectedYear}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAiGenerator}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            <span>AI Budget Generator</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Set Limit</span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Monthly Budget</span>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{formatINR(totalBudget)}</h3>
          <p className="text-xs text-slate-500 mt-1">{budgets.length} categories budgeted</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Spent on Budgets</span>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{formatINR(totalSpent)}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {totalBudget > 0 ? `${formatPercent((totalSpent / totalBudget) * 100)} utilized` : 'No limits defined'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overspending Status</span>
          <h3 className={`text-2xl font-extrabold mt-1 ${exceededCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {exceededCount > 0 ? `${exceededCount} Over Budget` : 'All Within Budget'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {exceededCount > 0 ? 'Immediate action advised' : 'Discipline maintained'}
          </p>
        </div>
      </div>

      {/* Budgets Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Calculating budget utilization...</p>
        </div>
      ) : budgets.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-card max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No category budgets established</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Setting monthly category limits prevents accidental overspending. Generate recommended budgets using your income and the 50/30/20 guideline!
          </p>
          <button
            onClick={handleOpenAiGenerator}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Smart Budget Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {budgets.map((b) => {
            const isOver = b.is_exceeded;
            const isNear = b.percentage_used >= 80 && !isOver;

            return (
              <div
                key={b.id}
                className={`bg-white rounded-2xl p-5 border shadow-card transition-all ${
                  isOver ? 'border-rose-300 bg-rose-50/20' : isNear ? 'border-amber-200' : 'border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{b.category}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Limit: <span className="font-semibold text-slate-800">{formatINR(b.monthly_limit)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit limit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Delete limit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-rose-600' : isNear ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, b.percentage_used)}%` }}
                  />
                </div>

                {/* Status Badges & Details */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400">Spent:</span>{' '}
                    <span className={`font-bold ${isOver ? 'text-rose-600' : 'text-slate-900'}`}>
                      {formatINR(b.spent)}
                    </span>
                    <span className="text-slate-400 ml-1">({b.percentage_used}%)</span>
                  </div>

                  <div>
                    {isOver ? (
                      <span className="font-bold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Budget exceeded by {formatINR(b.exceeded_by)}
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-600">
                        Remaining: <span className="text-emerald-600 font-bold">{formatINR(b.remaining)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set / Edit Budget Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBudget ? "Edit Category Budget" : "Set Monthly Category Budget"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs font-semibold rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer"
            >
              <option value="Food">Food & Dining</option>
              <option value="Rent">Rent & Housing</option>
              <option value="Groceries">Groceries</option>
              <option value="Transport">Transport & Fuel</option>
              <option value="Utilities">Utilities & WiFi</option>
              <option value="Education">Education</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Shopping">Shopping</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Bills">Bills & Recharges</option>
              <option value="EMI/Loans">EMI / Loans</option>
              <option value="Travel">Travel</option>
              <option value="Personal">Personal Care</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Monthly Limit (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="50"
                min="100"
                required
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              For {getMonthName(selectedMonth)} {selectedYear}. You will receive visual alerts when spending nears 80%.
            </p>
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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Set Budget'}
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Budget Generator Preview Modal */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="Personalized AI Budget Generator"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <p className="font-bold">50 / 30 / 20 Smart Allocation Engine</p>
              <p className="mt-0.5 text-blue-800/80">
                Calculated dynamically using your historical spending pattern and monthly income baseline.
              </p>
            </div>
          </div>

          {aiLoading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500 font-medium">Analyzing historical transactions...</p>
            </div>
          ) : generatedPlan ? (
            <>
              {/* Allocation Targets Summary */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Needs (50%)</span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{formatINR(generatedPlan.needs_target)}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Wants (30%)</span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{formatINR(generatedPlan.wants_target)}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Savings (20%)</span>
                  <p className="text-sm font-extrabold text-emerald-600 mt-0.5">{formatINR(generatedPlan.savings_target)}</p>
                </div>
              </div>

              {/* Recommended Table */}
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Current Avg</th>
                      <th className="px-3 py-2 text-right">Recommended Limit</th>
                      <th className="px-3 py-2">Guidance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {generatedPlan.budgets.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-bold text-slate-800">{b.category}</td>
                        <td className="px-3 py-2 text-slate-500">{formatINR(b.current_spending)}</td>
                        <td className="px-3 py-2 text-right font-bold text-blue-600">{formatINR(b.recommended_budget)}</td>
                        <td className="px-3 py-2 text-slate-400 text-[11px]">{b.suggestion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-slate-400 italic">
                * {generatedPlan.disclaimer}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyAiBudgets}
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
                >
                  {submitting ? 'Applying...' : `Apply These ${generatedPlan.budgets.length} Budgets for ${getMonthName(selectedMonth)}`}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};

export default BudgetsPage;
