import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  PieChart, 
  Target, 
  ShieldCheck, 
  CheckCircle2, 
  DollarSign, 
  Users, 
  Zap, 
  FileText,
  Lock
} from 'lucide-react';

const LandingPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemoLogin = async () => {
    try {
      await login('demo@financebot.com', 'Demo@123');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">FinanceBot</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleQuickDemoLogin}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              Try Live Demo
            </button>
            <Link
              to="/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI-Driven Financial Intelligence for India</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Take Control of Your Money with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI Clarity</span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Track your income, understand your spending, build smarter category budgets, and achieve your financial goals with an interactive advisor that knows your real numbers.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all group"
            >
              <span>Start Free Budgeting</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={handleQuickDemoLogin}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Explore Demo Account (₹)</span>
            </button>
          </div>

          {/* Quick Metrics highlight */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-slate-200/60 text-left">
            <div className="p-4 rounded-xl bg-white border border-slate-200/70 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold uppercase">Currency</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">₹ Indian Rupee</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200/70 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold uppercase">Framework</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">50 / 30 / 20 Rule</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200/70 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold uppercase">AI Engine</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">Hybrid + Fallback</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200/70 shadow-sm">
              <span className="text-xs text-slate-400 font-semibold uppercase">Security</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">JWT & Salted Hashes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Powerful Features</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Everything you need to master your personal wealth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-cardHover transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Income vs Expense Tracking</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Log earnings across multiple streams (salary, freelance, dividends) and categorize daily expenses with automatic Indian numbering.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-cardHover transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Dynamic Budget Limits</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Set monthly category budgets. Get immediate visual warnings and overspending indicators before budgets are exceeded.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-cardHover transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Financial Advisor & Chat</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Chat with an AI that references your actual database records. Detect spikes, analyze high spending, and get personalized 50/30/20 budgets.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-cardHover transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Savings Goals & Emergency Fund</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track goals like Emergency Fund, Laptop, or Vacation with visual progress bars and quick fund allocation tools.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-cardHover transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Monthly Reports & Comparisons</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Review complete month-over-month performance, category deltas, and export printer-friendly PDF financial summaries.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-cardHover transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Financial Health Score (0–100)</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Transparent rating based on savings rate, budget discipline, emergency fund buffer, and month-over-month expense control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported User Personas */}
      <section className="py-20 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">Designed For Everyone</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Tailored workflows for 4 realistic life scenarios
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-4">
                💼
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">Salaried Professionals</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Automate fixed obligations (Rent, EMIs, Utilities) and preserve 20%+ savings from steady monthly compensation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-4">
                🎓
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">College Students</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Manage monthly pocket allowance (₹8,000–₹15,000), rein in food deliveries, and start early savings habits.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm mb-4">
                💻
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">Freelancers</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Smooth out fluctuating monthly cash flows with multi-source tracking and build an essential 6-month safety buffer.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm mb-4">
                🏡
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">Household Managers</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Consolidate family groceries, children's education, utilities, healthcare, and manage seasonal festival budgets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg">Personal Finance Advisor Bot</span>
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Educational personal finance planning platform with intelligent rule engines and AI analysis.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="hover:text-white transition-colors">Create Account</Link>
            <button onClick={handleQuickDemoLogin} className="hover:text-white transition-colors">Demo Credentials</button>
          </div>
          <p className="text-[11px] text-slate-500 mt-8">
            © {new Date().getFullYear()} Personal Finance Advisor Bot. Built with React, Tailwind CSS, Flask & SQLite.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
