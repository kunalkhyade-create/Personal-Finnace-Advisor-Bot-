import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = "blue", className = "" }) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100"
  };

  const badgeColor = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card hover:shadow-cardHover transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${badgeColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">{value}</h3>
      </div>

      {(subtitle || trendValue !== undefined) && (
        <div className="mt-2 flex items-center text-xs text-slate-500 font-medium">
          {trend === "up" && (
            <span className="flex items-center text-emerald-600 font-semibold mr-1.5">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              {trendValue}
            </span>
          )}
          {trend === "down" && (
            <span className="flex items-center text-rose-600 font-semibold mr-1.5">
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              {trendValue}
            </span>
          )}
          {trend === "neutral" && (
            <span className="flex items-center text-slate-500 font-semibold mr-1.5">
              <Minus className="w-3.5 h-3.5 mr-0.5" />
              {trendValue}
            </span>
          )}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
