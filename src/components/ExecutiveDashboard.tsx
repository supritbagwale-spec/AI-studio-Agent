import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  RotateCcw, 
  ShoppingBag, 
  DollarSign, 
  Percent, 
  ArrowUpRight, 
  Sparkles, 
  Layers, 
  MapPin, 
  Users,
  Compass
} from 'lucide-react';
import { STORES_DATA, PRODUCTS_DATA, CUSTOMERS_DATA, generateRetailDatabase } from '../data/retailDatabase.ts';

interface ExecutiveDashboardProps {
  onAskAgent: (query: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ onAskAgent }) => {
  const [metrics, setMetrics] = useState<{
    netRevenue: number;
    totalOrders: number;
    totalUnits: number;
    returnRate: number;
    returnedOrdersCount: number;
    avgDiscount: number;
    channelRevenue: { channel: string; revenue: number; orderCount: number; returnRate: number }[];
    categoryRevenue: { category: string; revenue: number; units: number }[];
    regionRevenue: { region: string; revenue: number; storeCount: number }[];
  } | null>(null);

  useEffect(() => {
    // Run live analytics over dataset
    const db = generateRetailDatabase();
    const orders = db.sales_transactions;
    const returns = db.returns;

    const returnedOrderIds = new Set(returns.map((r) => r.order_id));
    const allOrderIds = new Set(orders.map((o) => o.order_id));

    let totalRev = 0;
    let totalUnits = 0;
    let totalDiscountSum = 0;

    const channelMap: Record<string, { revenue: number; orderIds: Set<string>; returnedOrderIds: Set<string> }> = {};
    const categoryMap: Record<string, { revenue: number; units: number }> = {};
    const productCategoryLookup: Record<string, string> = {};
    PRODUCTS_DATA.forEach((p) => {
      productCategoryLookup[p.product_id] = p.category;
    });

    const storeRegionLookup: Record<string, string> = {};
    STORES_DATA.forEach((s) => {
      storeRegionLookup[s.store_id] = s.region;
    });

    const regionMap: Record<string, { revenue: number; stores: Set<string> }> = {};

    orders.forEach((tx) => {
      const netRev = tx.units_sold * tx.unit_price * (1.0 - tx.discount_pct / 100.0);
      totalRev += netRev;
      totalUnits += tx.units_sold;
      totalDiscountSum += tx.discount_pct;

      // Channel breakdown
      if (!channelMap[tx.sales_channel]) {
        channelMap[tx.sales_channel] = { revenue: 0, orderIds: new Set(), returnedOrderIds: new Set() };
      }
      channelMap[tx.sales_channel].revenue += netRev;
      channelMap[tx.sales_channel].orderIds.add(tx.order_id);
      if (returnedOrderIds.has(tx.order_id)) {
        channelMap[tx.sales_channel].returnedOrderIds.add(tx.order_id);
      }

      // Category breakdown
      const cat = productCategoryLookup[tx.product_id] || 'Other';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { revenue: 0, units: 0 };
      }
      categoryMap[cat].revenue += netRev;
      categoryMap[cat].units += tx.units_sold;

      // Region breakdown
      const reg = storeRegionLookup[tx.store_id] || 'Other';
      if (!regionMap[reg]) {
        regionMap[reg] = { revenue: 0, stores: new Set() };
      }
      regionMap[reg].revenue += netRev;
      regionMap[reg].stores.add(tx.store_id);
    });

    const returnRate = (returnedOrderIds.size / Math.max(1, allOrderIds.size)) * 100.0;
    const avgDiscount = totalDiscountSum / Math.max(1, orders.length);

    const channelRevenue = Object.entries(channelMap).map(([channel, data]) => ({
      channel,
      revenue: Math.round(data.revenue),
      orderCount: data.orderIds.size,
      returnRate: Number(((data.returnedOrderIds.size / Math.max(1, data.orderIds.size)) * 100).toFixed(1)),
    })).sort((a, b) => b.revenue - a.revenue);

    const categoryRevenue = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      revenue: Math.round(data.revenue),
      units: data.units,
    })).sort((a, b) => b.revenue - a.revenue);

    const regionRevenue = Object.entries(regionMap).map(([region, data]) => ({
      region,
      revenue: Math.round(data.revenue),
      storeCount: data.stores.size,
    })).sort((a, b) => b.revenue - a.revenue);

    setMetrics({
      netRevenue: Math.round(totalRev),
      totalOrders: allOrderIds.size,
      totalUnits,
      returnRate: Number(returnRate.toFixed(2)),
      returnedOrdersCount: returnedOrderIds.size,
      avgDiscount: Number(avgDiscount.toFixed(1)),
      channelRevenue,
      categoryRevenue,
      regionRevenue,
    });
  }, []);

  if (!metrics) {
    return <div className="p-8 text-center text-slate-500">Calculating retail metrics...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <span>Retail Executive BI Overview</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Realized top-line net revenue, return rates, and omnichannel performance metrics.
          </p>
        </div>

        <button
          onClick={() => onAskAgent('Provide an executive summary of current retail performance across revenue and return rate')}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Ask Agent for Comprehensive Audit</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Revenue */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Net Realized Revenue</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            ${metrics.netRevenue.toLocaleString('en-US')}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Formula: SUM(units * price * (1-disc))</span>
            <button
              onClick={() => onAskAgent('What is the Net Revenue breakdown by month?')}
              className="text-amber-400 hover:underline flex items-center gap-0.5"
            >
              Drill-down <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Omnichannel Return Rate */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Omnichannel Return Rate</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {metrics.returnRate}%
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>{metrics.returnedOrdersCount} of {metrics.totalOrders} orders returned</span>
            <button
              onClick={() => onAskAgent('What are the top return reasons and return rate by channel?')}
              className="text-amber-400 hover:underline flex items-center gap-0.5"
            >
              Analyze <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Total Orders & Volume */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Order Volume</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {metrics.totalOrders.toLocaleString()} <span className="text-sm font-sans font-normal text-slate-400">orders</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>{metrics.totalUnits.toLocaleString()} units sold</span>
            <span className="text-slate-400">Avg ~2.1 units/ord</span>
          </div>
        </div>

        {/* Average Discount % */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Average Markdown / Discount</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {metrics.avgDiscount}%
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Range: 0% to 25% promo</span>
            <button
              onClick={() => onAskAgent('Which categories received the highest discounts and did it increase volume?')}
              className="text-amber-400 hover:underline flex items-center gap-0.5"
            >
              Audit <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Channels Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Omnichannel Performance</span>
            </h3>
            <span className="text-[10px] uppercase font-mono text-slate-500">Return Rate</span>
          </div>

          <div className="space-y-3">
            {metrics.channelRevenue.map((ch) => (
              <div key={ch.channel} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium">{ch.channel}</span>
                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="text-amber-300 font-semibold">${ch.revenue.toLocaleString()}</span>
                    <span className="text-rose-400 text-[11px]">({ch.returnRate}% ret)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{ width: `${Math.round((ch.revenue / metrics.netRevenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Categories Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Category Net Revenue</span>
            </h3>
            <span className="text-[10px] uppercase font-mono text-slate-500">Volume</span>
          </div>

          <div className="space-y-3">
            {metrics.categoryRevenue.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium">{cat.category}</span>
                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="text-emerald-400 font-semibold">${cat.revenue.toLocaleString()}</span>
                    <span className="text-slate-400 text-[11px]">({cat.units} units)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${Math.round((cat.revenue / metrics.netRevenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regions Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>Regional Revenue Contribution</span>
            </h3>
            <span className="text-[10px] uppercase font-mono text-slate-500">Locations</span>
          </div>

          <div className="space-y-3">
            {metrics.regionRevenue.map((reg) => (
              <div key={reg.region} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium">{reg.region} Region</span>
                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="text-purple-300 font-semibold">${reg.revenue.toLocaleString()}</span>
                    <span className="text-slate-400 text-[11px]">({reg.storeCount} stores)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="h-full rounded-full bg-purple-500"
                    style={{ width: `${Math.round((reg.revenue / metrics.netRevenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
