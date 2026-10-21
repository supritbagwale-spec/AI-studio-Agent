import React from 'react';
import { BarChart3, TrendingUp, PieChart as PieIcon } from 'lucide-react';

interface DataVisualizerProps {
  columns: string[];
  rows: Record<string, any>[];
}

export const DataVisualizer: React.FC<DataVisualizerProps> = ({ columns, rows }) => {
  if (!rows || rows.length === 0 || columns.length < 2) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        Not enough multi-dimensional data to render graphical visualization.
      </div>
    );
  }

  // Find categorical label column (string) and metric column (numeric)
  const labelCol = columns.find((c) => typeof rows[0][c] === 'string') || columns[0];
  const metricCol =
    columns.find(
      (c) =>
        typeof rows[0][c] === 'number' &&
        (c.toLowerCase().includes('revenue') ||
          c.toLowerCase().includes('rate') ||
          c.toLowerCase().includes('order') ||
          c.toLowerCase().includes('unit'))
    ) || columns.find((c) => typeof rows[0][c] === 'number');

  if (!metricCol) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        No numeric metrics available to graph for this query.
      </div>
    );
  }

  // Take top 8 items for clean visualization
  const chartData = rows.slice(0, 8).map((r) => ({
    label: String(r[labelCol] || 'Unknown'),
    value: Number(r[metricCol] || 0),
  }));

  const maxValue = Math.max(...chartData.map((d) => d.value), 0.0001);
  const isCurrency = metricCol.toLowerCase().includes('revenue') || metricCol.toLowerCase().includes('price') || metricCol.toLowerCase().includes('value');
  const isPercentage = metricCol.toLowerCase().includes('pct') || metricCol.toLowerCase().includes('rate');

  const formatVal = (v: number) => {
    if (isCurrency) return `$${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (isPercentage) return `${v}%`;
    return v.toLocaleString();
  };

  return (
    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-200">
            {metricCol.replace(/_/g, ' ').toUpperCase()} by {labelCol.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Top {chartData.length} records
        </span>
      </div>

      <div className="space-y-3">
        {chartData.map((item, idx) => {
          const pct = Math.max(4, Math.round((item.value / maxValue) * 100));
          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium truncate max-w-[200px] sm:max-w-[300px]">
                  {item.label}
                </span>
                <span className="font-mono text-amber-300 font-semibold text-xs ml-2">
                  {formatVal(item.value)}
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
