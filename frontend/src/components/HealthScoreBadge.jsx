import React, { useState } from 'react';
import { ShieldCheck, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import Modal from './Modal';

const HealthScoreBadge = ({ health }) => {
  const [showModal, setShowModal] = useState(false);

  if (!health) return null;

  const { score, rating, status_color, summary, breakdown } = health;

  const colorStyles = {
    emerald: {
      bg: "bg-emerald-500",
      text: "text-emerald-700",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      ring: "ring-emerald-500/20"
    },
    blue: {
      bg: "bg-blue-500",
      text: "text-blue-700",
      badge: "bg-blue-50 text-blue-700 border-blue-200",
      ring: "ring-blue-500/20"
    },
    amber: {
      bg: "bg-amber-500",
      text: "text-amber-700",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      ring: "ring-amber-500/20"
    },
    rose: {
      bg: "bg-rose-500",
      text: "text-rose-700",
      badge: "bg-rose-50 text-rose-700 border-rose-200",
      ring: "ring-rose-500/20"
    }
  };

  const style = colorStyles[status_color] || colorStyles.blue;

  return (
    <>
      <div 
        onClick={() => setShowModal(true)}
        className="cursor-pointer bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:shadow-cardHover transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            {/* Circular Progress Ring */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${style.bg} ring-4 ${style.ring}`}>
              {score}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Financial Health</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
                {rating}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 line-clamp-1 max-w-[280px] sm:max-w-md">
              {summary}
            </p>
          </div>
        </div>

        <button 
          type="button"
          className="text-slate-400 group-hover:text-blue-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
          title="View score breakdown"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Breakdown Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Financial Health Score Breakdown">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-slate-500">Overall Rating</span>
              <h4 className="text-xl font-bold text-slate-900 mt-0.5">{rating} ({score}/100)</h4>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${style.badge}`}>
              {rating}
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            {summary}
          </p>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Scoring Factors</h5>
            
            {breakdown && Object.entries(breakdown).map(([key, item]) => (
              <div key={key} className="p-3 rounded-lg border border-slate-100 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold capitalize text-slate-800">
                    {key.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-blue-600">
                    {item.score} / {item.max} pts
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(item.score / item.max) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-700 leading-relaxed">
            <strong>Disclaimer:</strong> This score is calculated via automated budgeting rules and transparent financial ratios for planning purposes. It does not constitute certified financial or investment advice.
          </div>
        </div>
      </Modal>
    </>
  );
};

export default HealthScoreBadge;
