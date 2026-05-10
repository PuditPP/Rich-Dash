import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MoreVertical, Edit2, Trash2, Download, ArrowUpCircle, ArrowDownCircle, PieChart } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCurrency, formatPercentage, calculateHoldingsMetrics } from '../utils/calculations';
import { Sparkline } from './Sparkline';
import { NewsSection } from './NewsSection';
import { TransactionForm } from './TransactionForm';
import type { Holding } from '../types';
import { useTranslation } from 'react-i18next';

interface HoldingsTableProps {
  onEdit: (holding: Holding) => void;
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({ onEdit }) => {
  const { holdings, removePosition, summary, usdToThb } = usePortfolio();
  const { t } = useTranslation();
  const [sortField, setSortField] = useState<string>('marketValue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedHoldingId, setSelectedHoldingId] = useState<string | null>(null);
  const [transactionMode, setTransactionMode] = useState<{ holding: Holding, type: 'buy' | 'sell' } | null>(null);

  const metrics = calculateHoldingsMetrics(holdings);

  // Use real historical data for sparklines if available, otherwise fallback to mock
  const getHistory = (h: Holding) => {
    if (h.history && h.history.length > 0) {
      return h.history;
    }
    
    // Fallback for immediate UI feedback if history hasn't loaded (30 days)
    const base = h.currentPrice;
    const history = [];
    for (let i = 0; i < 30; i++) {
      history.push(base * (1 + (Math.random() * 0.04 - 0.02)));
    }
    history.push(base);
    return history;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedHoldings = [...metrics].map(h => ({
    ...h,
    weight: (h.marketValue / summary.totalValue) * 100
  })).sort((a, b) => {
    const aValue = (a as any)[sortField];
    const bValue = (b as any)[sortField];
    return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
  });

  const exportToCSV = () => {
    const headers = [t('holdings.table.ticker'), 'Name', 'Asset Type', 'Sector', t('holdings.table.quantity'), t('holdings.table.avg_cost'), t('holdings.table.price'), t('holdings.table.market_value'), 'Total Gain', 'Total Gain %', 'Daily Change %', 'Weight %'];
    const rows = sortedHoldings.map(h => [
      h.symbol,
      h.name,
      h.assetType,
      h.sector,
      h.quantity,
      h.averageCost,
      h.currentPrice,
      h.marketValue,
      h.unrealizedGain,
      h.unrealizedGainPercentage,
      h.dailyChangePercentage,
      (h.marketValue / summary.totalValue * 100)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `portfolio_holdings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="bg-card border border-amber-500/10 rounded-2xl overflow-hidden shadow-xl shadow-amber-500/5 relative group">
      {/* Decorative gradient background like summary cards */}
      <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        <div className="p-6 border-b border-border flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-xl font-bold tracking-tight">{t('holdings.title')}</h2>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-card-hover hover:border-amber-500/30 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{t('holdings.export_csv')}</span>
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-sidebar/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('symbol')}>
                  <div className="flex items-center gap-2">{t('holdings.table.ticker')} <SortIcon field="symbol" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('quantity')}>
                  <div className="flex items-center gap-2">{t('holdings.table.quantity')} <SortIcon field="quantity" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('averageCost')}>
                  <div className="flex items-center gap-2">{t('holdings.table.avg_cost')} <SortIcon field="averageCost" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('currentPrice')}>
                  <div className="flex items-center gap-2">{t('holdings.table.price')} <SortIcon field="currentPrice" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('marketValue')}>
                  <div className="flex items-center gap-2">{t('holdings.table.market_value')} <SortIcon field="marketValue" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('unrealizedGain')}>
                  <div className="flex items-center gap-2">{t('holdings.table.gain_loss')} <SortIcon field="unrealizedGain" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('dailyChangePercentage')}>
                  <div className="flex items-center gap-2">{t('holdings.table.day_change')} <SortIcon field="dailyChangePercentage" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('weight')}>
                  <div className="flex items-center gap-2">{t('holdings.table.weight')} <SortIcon field="weight" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedHoldings.map((h) => (
                <React.Fragment key={h.id}>
                  <tr 
                    className={`group hover:bg-card-hover transition-colors cursor-pointer ${selectedHoldingId === h.id ? 'bg-card-hover' : ''}`}
                    onClick={() => setSelectedHoldingId(selectedHoldingId === h.id ? null : h.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-white group-hover:text-amber-400 transition-colors">{h.symbol}</span>
                          <span className="text-xs text-gray-500 truncate max-w-[100px]">{h.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{h.quantity.toFixed(2)}</td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex flex-col">
                        <span>{formatCurrency(h.averageCost)}</span>
                        <span className="text-[10px] text-gray-500 font-normal">≈ {(h.averageCost * usdToThb).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex flex-col">
                        <span>{formatCurrency(h.currentPrice)}</span>
                        <span className="text-[10px] text-gray-500 font-normal">≈ {(h.currentPrice * usdToThb).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold">
                      <div className="flex flex-col">
                        <span>{formatCurrency(h.marketValue)}</span>
                        <span className="text-[10px] text-gray-500 font-normal">≈ {(h.marketValue * usdToThb).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col whitespace-nowrap">
                        <span className={`font-bold ${h.unrealizedGain >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatCurrency(h.unrealizedGain)}
                        </span>
                        <span className={`text-xs ${h.unrealizedGain >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatPercentage(h.unrealizedGainPercentage)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${h.dailyChangePercentage >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {formatPercentage(h.dailyChangePercentage)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-sidebar rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className="h-full bg-amber-500" 
                            style={{ width: `${h.weight}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{h.weight.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                  {selectedHoldingId === h.id && (
                    <tr className="bg-sidebar/30 border-t-0">
                      <td colSpan={8} className="px-6 py-8 border-t-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-200">
                          {/* Left Column: Stats & Actions */}
                          <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{t('holdings.details.asset_details')}</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-400">{t('holdings.details.type')}</span>
                                    <span className="text-sm font-medium">{h.assetType}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-400">{t('holdings.details.sector')}</span>
                                    <span className="text-sm font-medium">{h.sector}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-400">{t('holdings.details.purchase_date')}</span>
                                    <span className="text-sm font-medium">{h.purchaseDate}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{t('holdings.details.performance')}</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-sm text-gray-400">{t('holdings.details.cost_basis')}</span>
                                    <div className="flex flex-col items-end">
                                      <span className="text-sm font-medium">{formatCurrency(h.averageCost * h.quantity)}</span>
                                      <span className="text-[10px] text-gray-500 font-normal">≈ {(h.averageCost * h.quantity * usdToThb).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB</span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-sm text-gray-400">{t('holdings.details.total_return')}</span>
                                    <div className="flex flex-col items-end">
                                      <span className={`text-sm font-medium ${h.unrealizedGain >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {formatCurrency(h.unrealizedGain)}
                                      </span>
                                      <span className={`text-[10px] font-normal ${h.unrealizedGain >= 0 ? 'text-success/70' : 'text-danger/70'}`}>
                                        ≈ {(h.unrealizedGain * usdToThb).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-3">
                              <div className="flex gap-3">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTransactionMode({ holding: h, type: 'buy' });
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 bg-success/10 border border-success/20 hover:bg-success/20 text-success px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                                >
                                  <ArrowUpCircle className="w-4 h-4" />
                                  <span>{t('holdings.actions.buy_more')}</span>
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTransactionMode({ holding: h, type: 'sell' });
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 bg-danger/10 border border-danger/20 hover:bg-danger/20 text-danger px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                                >
                                  <ArrowDownCircle className="w-4 h-4" />
                                  <span>{t('holdings.actions.sell_part')}</span>
                                </button>
                              </div>
                              <div className="flex gap-3">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(h);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 bg-sidebar border border-border hover:border-amber-500 hover:text-amber-500 px-4 py-2.5 rounded-xl text-sm transition-all"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  <span>{t('holdings.actions.edit_position')}</span>
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePosition(h.id);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 bg-sidebar border border-border hover:border-danger hover:text-danger px-4 py-2.5 rounded-xl text-sm transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>{t('holdings.actions.remove')}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: AI News */}
                          <div className="lg:border-l lg:border-border lg:pl-8">
                            <NewsSection symbol={h.symbol} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (Optimized for iPhone) */}
        <div className="md:hidden divide-y divide-border/50">
          {sortedHoldings.map((h) => {
            const isExpanded = selectedHoldingId === h.id;
            const isPositive = h.unrealizedGain >= 0;
            
            return (
              <div key={h.id} className="animate-in fade-in duration-500">
                <div 
                  className={`p-4 active:bg-sidebar/50 transition-colors cursor-pointer ${isExpanded ? 'bg-sidebar/30' : ''}`}
                  onClick={() => setSelectedHoldingId(isExpanded ? null : h.id)}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Ticker & Weight */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sidebar border border-border flex items-center justify-center font-bold text-amber-500 text-xs">
                        {h.symbol.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white leading-tight">{h.symbol}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <PieChart className="w-3 h-3 text-gray-500" />
                          <span className="text-[10px] text-gray-500 font-medium">{h.weight.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Market Value & THB */}
                    <div className="flex flex-col items-center">
                      <span className="text-base font-bold text-white tracking-tight">
                        {h.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        ≈ {(h.marketValue * usdToThb).toLocaleString(undefined, { maximumFractionDigits: 0 })} THB
                      </span>
                    </div>

                    {/* Right: Profit % & USD */}
                    <div className="flex flex-col items-end">
                      <div className={`flex items-center gap-0.5 font-bold text-sm ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {isPositive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {Math.abs(h.unrealizedGainPercentage).toFixed(2)}%
                      </div>
                      <span className={`text-[10px] font-bold ${isPositive ? 'text-success/70' : 'text-danger/70'}`}>
                        ({isPositive ? '+' : '-'}{Math.abs(h.unrealizedGain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Expanded View */}
                {isExpanded && (
                  <div className="px-4 pb-6 pt-2 bg-sidebar/20 animate-in slide-in-from-top-2 duration-300 space-y-6">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Outstanding Shares</span>
                        <span className="text-sm font-bold text-white">{h.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Price (USD)</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{h.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className={`text-[10px] font-bold ${h.dailyChangePercentage >= 0 ? 'text-success' : 'text-danger'}`}>
                            {h.dailyChangePercentage >= 0 ? '▲' : '▼'} {Math.abs(h.dailyChangePercentage).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Cost per Share</span>
                        <span className="text-sm font-bold text-white">{h.averageCost.toLocaleString(undefined, { minimumFractionDigits: 4 })}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Total Cost (USD)</span>
                        <span className="text-sm font-bold text-white">{(h.averageCost * h.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => setTransactionMode({ holding: h, type: 'buy' })}
                        className="flex-1 bg-success/10 border border-success/20 text-success py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                      >
                        Buy-Sell
                      </button>
                      <button 
                        onClick={() => onEdit(h)}
                        className="flex-1 bg-sidebar border border-border text-gray-400 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => removePosition(h.id)}
                        className="p-2.5 bg-danger/10 border border-danger/20 text-danger rounded-xl active:scale-95 transition-transform"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="pt-2 border-t border-border/50">
                      <NewsSection symbol={h.symbol} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      
      {transactionMode && (
        <TransactionForm 
          holding={transactionMode.holding}
          type={transactionMode.type}
          onClose={() => setTransactionMode(null)}
        />
      )}
      </div>
    </div>
  );
};

