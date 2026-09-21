import React from 'react';
import { AlertTriangle, AlertCircle, TrendingUp, TrendingDown, Target, Info } from 'lucide-react';

const AlertBanner = ({ alerts = [] }) => {
  if (!alerts || alerts.length === 0) return null;

  const getIcon = (type, iconName) => {
    if (iconName === 'alert-triangle' || type === 'danger') return <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />;
    if (iconName === 'trending-up' || type === 'success') return <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
    if (iconName === 'trending-down') return <TrendingDown className="w-4 h-4 text-amber-600 flex-shrink-0" />;
    if (iconName === 'target') return <Target className="w-4 h-4 text-blue-600 flex-shrink-0" />;
    return <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
  };

  const getStyle = (type) => {
    switch (type) {
      case 'danger':
        return 'bg-rose-50/80 border-rose-200 text-rose-800';
      case 'warning':
        return 'bg-amber-50/80 border-amber-200 text-amber-800';
      case 'success':
        return 'bg-emerald-50/80 border-emerald-200 text-emerald-800';
      case 'info':
      default:
        return 'bg-blue-50/80 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="space-y-2 mb-6">
      {alerts.slice(0, 3).map((alert, index) => (
        <div 
          key={index} 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${getStyle(alert.type)}`}
        >
          {getIcon(alert.type, alert.icon)}
          <span className="flex-1">{alert.message}</span>
        </div>
      ))}
    </div>
  );
};

export default AlertBanner;
