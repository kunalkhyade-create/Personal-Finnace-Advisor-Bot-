import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiAPI } from '../services/api';
import { formatINR, formatPercent, getMonthName } from '../utils/formatters';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Lightbulb, 
  ArrowRight, 
  Zap, 
  Briefcase, 
  GraduationCap, 
  Laptop, 
  Home,
  Info 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AIAdvisorPage = () => {
  const { selectedMonth, selectedYear, user } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState(user?.persona || 'Salaried');

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.analyze({
        month: selectedMonth,
        year: selectedYear
      });
      setAnalysis(res.data);
    } catch (err) {
      console.error("Failed to run AI analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [selectedMonth, selectedYear]);

  const totals = analysis?.totals || {};
  const health = analysis?.health || {};
  const alerts = analysis?.alerts || [];
  const overspending = analysis?.overspending_alerts || [];
  const observations = analysis?.observations || [];
  const recommendations = analysis?.recommendations || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-blue-600" />
            AI Financial Advisor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Automated spending audit & data-driven savings recommendations for <span className="font-semibold text-slate-800">{getMonthName(selectedMonth)} {selectedYear}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/ai-chat"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <span>Ask Chatbot a Question</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Hero Assessment Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-300 text-xs font-semibold mb-3 backdrop-blur-sm border border-white/10">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-Time Financial Snapshot</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {health.summary || "Your monthly financial audit is ready."}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Based on your recorded income of {formatINR(totals.total_income)} and expenses of {formatINR(totals.total_expenses)}, your current savings rate stands at {formatPercent(totals.savings_rate)}.
            </p>
          </div>

          <div className="flex-shrink-0 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-center min-w-[140px]">
            <span className="text-[11px] uppercase font-bold text-slate-300">Health Index</span>
            <div className="text-4xl font-black text-white mt-1">{health.score || 0}<span className="text-lg text-slate-400 font-normal">/100</span></div>
            <span className="mt-1 inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
              {health.rating || "Good"}
            </span>
          </div>
        </div>
      </div>

      {/* Scenario Guidance Tabs */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Life Scenario Advisory</h3>
            <p className="text-xs text-slate-500">Switch persona to see custom financial strategies</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setActiveScenario('Salaried')}
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all text-left ${
              activeScenario === 'Salaried'
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Salaried Pro</span>
          </button>

          <button
            onClick={() => setActiveScenario('College Student')}
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all text-left ${
              activeScenario === 'College Student'
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>College Student</span>
          </button>

          <button
            onClick={() => setActiveScenario('Freelancer')}
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all text-left ${
              activeScenario === 'Freelancer'
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Laptop className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Freelancer</span>
          </button>

          <button
            onClick={() => setActiveScenario('Household Manager')}
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all text-left ${
              activeScenario === 'Household Manager'
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span>Household</span>
          </button>
        </div>

        {/* Dynamic Scenario Insight */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
          {activeScenario === 'Salaried' && (
            <p>
              <strong>Salaried Strategy:</strong> Automate monthly transfers into savings & investments on day 1 of receiving your paycheck. Keep fixed obligations (Rent, EMIs, Bills) capped under 50% of your net income so you retain agility.
            </p>
          )}
          {activeScenario === 'College Student' && (
            <p>
              <strong>Student Strategy:</strong> With a fixed allowance, track micro-transactions like café visits and food deliveries. Target saving even ₹500–₹1,000 every month into an Emergency buffer to avoid short-term borrowing.
            </p>
          )}
          {activeScenario === 'Freelancer' && (
            <p>
              <strong>Freelancer Strategy:</strong> Because earnings fluctuate from month to month, live off your lowest baseline month. During high-income months, deposit surplus directly into a 6-month buffer and pre-pay taxes.
            </p>
          )}
          {activeScenario === 'Household Manager' && (
            <p>
              <strong>Household Strategy:</strong> Consolidate family grocery and utility bills. Use bulk purchasing for non-perishable pantry items and conduct semi-annual reviews of internet, insurance, and medical policies.
            </p>
          )}
        </div>
      </div>

      {/* Overspending & High Spending Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overspending Alerts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Overspending Warnings</h3>
              <p className="text-xs text-slate-500">Categories exceeding monthly allocations</p>
            </div>
          </div>

          {overspending.length === 0 ? (
            <div className="p-6 text-center bg-emerald-50/50 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-emerald-800">No category budget overruns!</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">All expenses are operating strictly within their allocated limits.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overspending.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 text-xs">
                  <div className="flex items-center justify-between font-bold text-rose-900 mb-1">
                    <span>{item.category}</span>
                    <span>Exceeded by {formatINR(item.exceeded_by)}</span>
                  </div>
                  <p className="text-rose-700">{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actionable Recommendations */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Savings Recommendations</h3>
              <p className="text-xs text-slate-500">Targeted adjustments to maximize wealth</p>
            </div>
          </div>

          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No current recommendations.</p>
            ) : (
              recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{rec}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Observations */}
      {observations.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Key Financial Observations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {observations.map((obs, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">{obs}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Educational Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Important Note:</strong> {analysis?.disclaimer || "AI-generated suggestions are for educational and planning purposes only and should not be considered professional financial advice."}
        </p>
      </div>
    </div>
  );
};

export default AIAdvisorPage;
