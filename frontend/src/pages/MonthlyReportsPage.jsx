import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportAPI } from '../services/api';
import { formatINR, formatPercent, formatDate, getMonthName } from '../utils/formatters';
import { 
  FileText, 
  Printer, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle, 
  Target, 
  Bot, 
  Calendar 
} from 'lucide-react';

const MonthlyReportsPage = () => {
  const { selectedMonth, selectedYear, user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportAPI.getMonthly({ month: selectedMonth, year: selectedYear });
      setReport(res.data);
    } catch (err) {
      console.error("Failed to load monthly report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear]);

  const handlePrint = () => {
    window.print();
  };

  const summary = report?.summary || {};
  const comparison = report?.comparison || {};
  const categories = report?.categories || [];
  const budgets = report?.budgets || [];
  const goals = report?.goals || [];
  const insights = report?.ai_insights || {};

  return (
    <div className="space-y-6 pb-12 print:space-y-4 print:pb-0">
      {/* Page Header (Hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-blue-600" />
            Monthly Financial Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Consolidated statement & performance review for <span className="font-semibold text-slate-800">{getMonthName(selectedMonth)} {selectedYear}</span>
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Generating financial report snapshot...</p>
        </div>
      ) : (
        <div className="print-container bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-card space-y-8">
          {/* Formal Report Header */}
          <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  ₹
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Personal Finance Advisor Bot</h2>
              </div>
              <p className="text-xs text-slate-500">Monthly Statement of Income, Expenses, and Wealth Growth</p>
            </div>

            <div className="sm:text-right text-xs text-slate-600 space-y-0.5">
              <p><strong className="text-slate-900">User:</strong> {user?.name} ({user?.persona})</p>
              <p><strong className="text-slate-900">Period:</strong> {getMonthName(selectedMonth)} {selectedYear}</p>
              <p><strong className="text-slate-900">Generated:</strong> {formatDate(new Date().toISOString().split('T')[0])}</p>
            </div>
          </div>

          {/* Section 1: Executive Summary Cards */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">1. Executive Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Gross Inflows</span>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">{formatINR(summary.total_income)}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Total Outflows</span>
                <p className="text-xl font-extrabold text-rose-600 mt-1">{formatINR(summary.total_expenses)}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Net Monthly Savings</span>
                <p className="text-xl font-extrabold text-blue-600 mt-1">{formatINR(summary.total_savings)}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Savings Ratio</span>
                <p className="text-xl font-extrabold text-slate-900 mt-1">{formatPercent(summary.savings_rate)}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Month-over-Month Comparison */}
          {comparison?.previous && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">2. Month-over-Month Variance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[11px] font-bold text-slate-500">Income Variance</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-base font-bold ${comparison.income_change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {comparison.income_change >= 0 ? '+' : ''}{formatINR(comparison.income_change)}
                    </span>
                    <span className="text-xs text-slate-400">({comparison.income_pct_change}%)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[11px] font-bold text-slate-500">Expense Variance</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-base font-bold ${comparison.expense_change <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {comparison.expense_change >= 0 ? '+' : ''}{formatINR(comparison.expense_change)}
                    </span>
                    <span className="text-xs text-slate-400">({comparison.expense_pct_change}%)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[11px] font-bold text-slate-500">Savings Variance</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-base font-bold ${comparison.savings_change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {comparison.savings_change >= 0 ? '+' : ''}{formatINR(comparison.savings_change)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Category Spending Breakdown Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">3. Category Spending Breakdown</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5 text-center">Transactions</th>
                    <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                    <th className="px-4 py-2.5 text-right">% of Total Spending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400">No expenses logged.</td>
                    </tr>
                  ) : (
                    categories.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-bold text-slate-800">{cat.category}</td>
                        <td className="px-4 py-2.5 text-center text-slate-500">{cat.count}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatINR(cat.amount)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-600">{cat.percentage}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Budget Performance Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">4. Budget Adherence Performance</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5 text-right">Budget Limit</th>
                    <th className="px-4 py-2.5 text-right">Actual Spent</th>
                    <th className="px-4 py-2.5 text-right">Remaining / (Over)</th>
                    <th className="px-4 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {budgets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400">No budgets set.</td>
                    </tr>
                  ) : (
                    budgets.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-bold text-slate-800">{b.category}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-600">{formatINR(b.monthly_limit)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatINR(b.spent)}</td>
                        <td className={`px-4 py-2.5 text-right font-bold ${b.is_exceeded ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {b.is_exceeded ? `-${formatINR(b.exceeded_by)}` : formatINR(b.remaining)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.is_exceeded ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {b.is_exceeded ? 'Over Budget' : 'On Track'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: AI Insights & Observations */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">5. AI Intelligence Observations</h3>
            <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-2 text-xs text-slate-700">
              {insights.alerts?.map((a, idx) => (
                <div key={`alert-${idx}`} className="flex items-start gap-2 text-amber-900 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{a.message}</span>
                </div>
              ))}
              {insights.observations?.map((o, idx) => (
                <div key={`obs-${idx}`} className="flex items-start gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>{o}</span>
                </div>
              ))}
              {insights.recommendations?.map((r, idx) => (
                <div key={`rec-${idx}`} className="flex items-start gap-2 text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Financial Goals */}
          {goals.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">6. Financial Goals Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {goals.map((g) => (
                  <div key={g.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <p className="text-xs font-bold text-slate-900">{g.goal_name}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{formatINR(g.current_amount)} of {formatINR(g.target_amount)} ({g.progress_percentage}%)</p>
                    <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${g.progress_percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer Footer */}
          <div className="border-t border-slate-200 pt-4 text-center text-[11px] text-slate-400 italic">
            {insights.disclaimer || "AI-generated suggestions are for educational and planning purposes only and should not be considered professional financial advice."}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyReportsPage;
