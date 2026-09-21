import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, budgetAPI } from '../services/api';
import { formatINR, formatPercent, formatDate, getMonthName } from '../utils/formatters';
import StatCard from '../components/StatCard';
import HealthScoreBadge from '../components/HealthScoreBadge';
import AlertBanner from '../components/AlertBanner';
import { 
  Wallet, 
  Receipt, 
  PiggyBank, 
  Percent, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  CartesianGrid, 
  Legend 
} from 'recharts';

const CATEGORY_COLORS = [
  '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#6366F1', '#14B8A6'
];

const DashboardPage = () => {
  const { selectedMonth, selectedYear, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, categoryRes, trendRes, budgetRes, recentRes] = await Promise.all([
        dashboardAPI.getSummary({ month: selectedMonth, year: selectedYear }),
        dashboardAPI.getCategoryBreakdown({ month: selectedMonth, year: selectedYear }),
        dashboardAPI.getMonthlyTrend({ months: 6 }),
        budgetAPI.getAll({ month: selectedMonth, year: selectedYear }),
        dashboardAPI.getRecent({ limit: 6 })
      ]);

      setSummaryData(summaryRes.data);
      setCategoryData(categoryRes.data.breakdown || []);
      setTrendData(trendRes.data.trend || []);
      setBudgetStatus(budgetRes.data);
      setRecentTransactions(recentRes.data.transactions || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    const handleUpdate = () => fetchDashboardData();
    window.addEventListener('finance_data_updated', handleUpdate);
    return () => window.removeEventListener('finance_data_updated', handleUpdate);
  }, [selectedMonth, selectedYear]);

  const totals = summaryData?.totals || { total_income: 0, total_expenses: 0, total_savings: 0, savings_rate: 0 };
  const comparison = summaryData?.comparison;

  // Format Income vs Expense bar data for current month
  const incomeVsExpenseData = [
    { name: 'Income', amount: totals.total_income, fill: '#16A34A' },
    { name: 'Expenses', amount: totals.total_expenses, fill: '#DC2626' },
    { name: 'Savings', amount: Math.max(0, totals.total_savings), fill: '#2563EB' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Overview for <span className="font-semibold text-slate-800">{getMonthName(selectedMonth)} {selectedYear}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/ai-advisor"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            <span>AI Advisor Insights</span>
          </Link>
        </div>
      </div>

      {/* Dynamic Alerts */}
      <AlertBanner alerts={summaryData?.alerts} />

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={formatINR(totals.total_income)}
          icon={Wallet}
          color="emerald"
          trend={comparison?.income_change > 0 ? "up" : comparison?.income_change < 0 ? "down" : "neutral"}
          trendValue={comparison?.income_pct_change ? `${comparison.income_pct_change > 0 ? '+' : ''}${comparison.income_pct_change}%` : undefined}
          subtitle="vs last month"
        />

        <StatCard
          title="Total Expenses"
          value={formatINR(totals.total_expenses)}
          icon={Receipt}
          color="rose"
          trend={comparison?.expense_change > 0 ? "down" : comparison?.expense_change < 0 ? "up" : "neutral"}
          trendValue={comparison?.expense_pct_change ? `${comparison.expense_pct_change > 0 ? '+' : ''}${comparison.expense_pct_change}%` : undefined}
          subtitle="vs last month"
        />

        <StatCard
          title="Total Savings"
          value={formatINR(totals.total_savings)}
          icon={PiggyBank}
          color="blue"
          trend={totals.total_savings >= 0 ? "up" : "down"}
          subtitle={totals.total_savings >= 0 ? "Positive surplus" : "Deficit / Overspent"}
        />

        <StatCard
          title="Savings Rate"
          value={formatPercent(totals.savings_rate)}
          icon={Percent}
          color={totals.savings_rate >= 20 ? "emerald" : totals.savings_rate >= 10 ? "amber" : "rose"}
          subtitle={totals.savings_rate >= 20 ? "Exceeds 20% target" : "Target: 20%+"}
        />
      </div>

      {/* Financial Health Score Banner */}
      <HealthScoreBadge health={summaryData?.health} />

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Income vs Expense Comparison */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cash Flow Balance</h3>
              <p className="text-xs text-slate-500">Income vs Expenses vs Net Savings</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {getMonthName(selectedMonth)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpenseData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tickFormatter={(val) => `₹${val / 1000}k`} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip 
                  formatter={(val) => [formatINR(val), 'Amount']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown Donut */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Spending by Category</h3>
              <p className="text-xs text-slate-500">Categorized expenses distribution</p>
            </div>
            <Link to="/expenses" className="text-xs font-semibold text-blue-600 hover:underline flex items-center">
              View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {categoryData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Receipt className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No expenses recorded for this month.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Use the "+ Add Entry" button to log expenses.</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 h-64">
              <div className="w-full sm:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [formatINR(val), 'Spent']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="w-full sm:w-1/2 max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {categoryData.slice(0, 5).map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                      <span className="font-medium text-slate-700 truncate">{cat.category}</span>
                    </div>
                    <div className="text-right flex-shrink-0 font-semibold text-slate-900">
                      {formatINR(cat.amount)} <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart 3: 6-Month Monthly Savings & Cash Trend */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">6-Month Financial Trend</h3>
              <p className="text-xs text-slate-500">Historical Income, Expenses & Net Savings trajectory</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Historical Track
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month_name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tickFormatter={(val) => `₹${val / 1000}k`} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip formatter={(val) => [formatINR(val), '']} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#16A34A" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#DC2626" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                <Area type="monotone" dataKey="savings" name="Savings" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSavings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Category Budgets Utilization & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Utilization Progress Bars */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Budget Adherence</h3>
              <p className="text-xs text-slate-500">Monthly limits vs actual spending</p>
            </div>
            <Link to="/budgets" className="text-xs font-semibold text-blue-600 hover:underline flex items-center">
              Manage Budgets <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {budgetStatus?.budgets?.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <PieChart className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No category budgets set for this month.</p>
              <Link to="/budgets" className="mt-2 inline-block text-xs font-bold text-blue-600 hover:underline">
                Generate Smart Budgets with AI →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {budgetStatus?.budgets?.slice(0, 5).map((b) => {
                const isOver = b.is_exceeded;
                const isNear = b.percentage_used >= 80 && !isOver;

                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{b.category}</span>
                        {isOver && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                            Exceeded by {formatINR(b.exceeded_by)}
                          </span>
                        )}
                        {isNear && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-700">
                            {b.percentage_used}% used
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 font-medium">
                        <span className="font-bold text-slate-900">{formatINR(b.spent)}</span> / {formatINR(b.monthly_limit)}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, b.percentage_used)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-500">Latest recorded transactions</p>
            </div>
            <Link to="/expenses" className="text-xs font-semibold text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No recent transactions.</p>
            ) : (
              recentTransactions.map((tx, idx) => {
                const isIncome = tx.type === 'income';
                return (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isIncome ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {isIncome ? '↓' : '↑'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-slate-900 truncate">{tx.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{formatDate(tx.date)}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {isIncome ? '+' : '-'}{formatINR(tx.amount)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
