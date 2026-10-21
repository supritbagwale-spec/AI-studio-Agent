import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';

interface DataTableProps {
  columns: string[];
  rows: Record<string, any>[];
  executionTimeMs?: number;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  executionTimeMs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(q)
        )
      );
    }

    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === 'asc'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
    }

    return result;
  }, [rows, searchTerm, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRows.slice(start, start + pageSize);
  }, [filteredAndSortedRows, currentPage, pageSize]);

  const exportToCsv = () => {
    if (!rows.length || !columns.length) return;
    const header = columns.join(',');
    const csvRows = rows.map((r) =>
      columns.map((col) => {
        const val = r[col];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    const blob = new Blob([[header, ...csvRows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retail_query_result_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCellValue = (val: any, column: string) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-600 italic">null</span>;
    }
    const lowerCol = column.toLowerCase();

    if (typeof val === 'number') {
      if (lowerCol.includes('revenue') || lowerCol.includes('price') || lowerCol.includes('aov') || lowerCol.includes('value')) {
        return <span className="font-mono text-emerald-400">${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
      }
      if (lowerCol.includes('pct') || lowerCol.includes('rate') || lowerCol.includes('percent')) {
        return <span className="font-mono text-cyan-400">{val}%</span>;
      }
      return <span className="font-mono text-slate-200">{val.toLocaleString()}</span>;
    }

    return String(val);
  };

  if (!columns.length) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        No tabular data returned for this query.
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Table controls */}
      <div className="p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/50">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search in results..."
              className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 w-44 sm:w-56"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredAndSortedRows.length} {filteredAndSortedRows.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {executionTimeMs !== undefined && (
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              Execution: {executionTimeMs}ms
            </span>
          )}
          <button
            onClick={exportToCsv}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
          >
            <Download className="w-3 h-3 text-amber-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="px-3.5 py-2.5 w-12 text-center text-slate-600 font-mono">#</th>
              {columns.map((col) => {
                const isSorted = sortColumn === col;
                return (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="px-3.5 py-2.5 font-semibold cursor-pointer hover:text-slate-200 select-none transition-colors"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>{col}</span>
                      {isSorted ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-amber-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-amber-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600 hover:text-slate-400" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-8 text-center text-slate-500 italic"
                >
                  No matching records found
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-slate-900/50 transition-colors"
                >
                  <td className="px-3.5 py-2 text-center text-[10px] text-slate-600 font-mono">
                    {(currentPage - 1) * pageSize + rIdx + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={col} className="px-3.5 py-2 whitespace-nowrap">
                      {formatCellValue(row[col], col)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination bar */}
      {totalPages > 1 && (
        <div className="px-3.5 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, filteredAndSortedRows.length)} of{' '}
            {filteredAndSortedRows.length}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-200">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
