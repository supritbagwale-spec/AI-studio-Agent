import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Key, 
  Hash, 
  Columns, 
  ExternalLink, 
  CheckCircle2, 
  Calculator, 
  Table as TableIcon,
  Search,
  Sparkles
} from 'lucide-react';

interface SchemaTable {
  tableName: string;
  description: string;
  rowCount: number;
  columns: {
    name: string;
    type: string;
    key: string;
    desc: string;
  }[];
  sample: Record<string, any>[];
}

interface SchemaInspectorProps {
  onAskAboutTable?: (tableName: string) => void;
}

export const SchemaInspector: React.FC<SchemaInspectorProps> = ({ onAskAboutTable }) => {
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('sales_transactions');
  const [loading, setLoading] = useState(true);
  const [searchCol, setSearchCol] = useState('');

  useEffect(() => {
    fetch('/api/db/schema')
      .then((res) => res.json())
      .then((data) => {
        if (data.tables) {
          setTables(data.tables);
        }
      })
      .catch((err) => console.error('Failed to load schema:', err))
      .finally(() => setLoading(false));
  }, []);

  const activeTableData = tables.find((t) => t.tableName === selectedTable) || tables[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Formula Cards */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-amber-400" />
            <span>Retail Relational Schema &amp; Analytical Formulas</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Exact in-memory relational schema across 5 normalized retail entities and standard business formulas.
          </p>
        </div>

        {/* Governing Formulas Cheat Sheet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20">
            <div className="flex items-center space-x-2 mb-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
                Core Revenue Formula
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-amber-200 border border-slate-800 mb-2">
              Net Revenue = SUM(units_sold * unit_price * (1.0 - discount_pct / 100.0))
            </div>
            <p className="text-[11px] text-slate-400">
              Accounts for variable item discounts applied at checkout to determine true realized top-line sales.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-900 border border-cyan-500/20">
            <div className="flex items-center space-x-2 mb-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wide">
                Core Return Rate Formula
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-cyan-200 border border-slate-800 mb-2">
              Return Rate (%) = (COUNT(distinct returned_orders) / COUNT(distinct total_orders)) * 100.0
            </div>
            <p className="text-[11px] text-slate-400">
              Evaluates order return propensity across omnichannel touchpoints and merchandise categories.
            </p>
          </div>
        </div>
      </div>

      {/* Main Schema Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table Selector (Left 4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Database Entities ({tables.length})
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading tables...</div>
          ) : (
            <div className="space-y-2">
              {tables.map((table) => {
                const isSelected = table.tableName === selectedTable;
                return (
                  <div
                    key={table.tableName}
                    onClick={() => setSelectedTable(table.tableName)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-mono text-sm font-bold ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                        {table.tableName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {table.rowCount} rows
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 mb-2">
                      {table.description}
                    </p>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-mono">
                      <span>{table.columns.length} columns</span>
                      {table.columns.some((c) => c.key.includes('PRIMARY')) && (
                        <span className="flex items-center gap-1 text-amber-400/80">
                          <Key className="w-2.5 h-2.5" /> PK
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Table Details & Columns Inspector (Right 8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeTableData && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <TableIcon className="w-5 h-5 text-amber-400" />
                    <h3 className="font-mono text-lg font-bold text-white">
                      {activeTableData.tableName}
                    </h3>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      {activeTableData.rowCount} Records Loaded
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeTableData.description}
                  </p>
                </div>

                {onAskAboutTable && (
                  <button
                    onClick={() => onAskAboutTable(`Analyze trends in ${activeTableData.tableName}`)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask Agent about this table</span>
                  </button>
                )}
              </div>

              {/* Columns Table */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Column Definitions</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {activeTableData.columns.length} attributes
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-3.5 py-2">Column</th>
                        <th className="px-3.5 py-2">Type</th>
                        <th className="px-3.5 py-2">Constraint</th>
                        <th className="px-3.5 py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {activeTableData.columns.map((col) => (
                        <tr key={col.name} className="hover:bg-slate-900/40">
                          <td className="px-3.5 py-2.5 font-mono text-amber-300 font-semibold whitespace-nowrap">
                            {col.name}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-cyan-400 text-[11px] whitespace-nowrap">
                            {col.type}
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            {col.key ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                                <Key className="w-2.5 h-2.5" />
                                {col.key}
                              </span>
                            ) : (
                              <span className="text-slate-600 font-mono text-[11px]">-</span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-400 text-xs">
                            {col.desc}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sample Data Preview */}
              {activeTableData.sample && activeTableData.sample.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Sample Records (Top 3 rows)
                  </span>
                  <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/80 p-1">
                    <table className="w-full text-left text-[11px]">
                      <thead className="text-[10px] uppercase font-mono text-slate-500 border-b border-slate-800 bg-slate-900/50">
                        <tr>
                          {Object.keys(activeTableData.sample[0]).map((key) => (
                            <th key={key} className="px-3 py-1.5 whitespace-nowrap">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 font-mono text-slate-300">
                        {activeTableData.sample.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/30">
                            {Object.values(row).map((val: any, vIdx) => (
                              <td key={vIdx} className="px-3 py-1.5 whitespace-nowrap">
                                {typeof val === 'number' ? val.toLocaleString() : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
