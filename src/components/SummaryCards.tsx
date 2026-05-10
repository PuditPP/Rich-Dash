import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCurrency, formatPercentage } from '../utils/calculations';
import { Sparkline } from './Sparkline';
import { useTranslation } from 'react-i18next';

export const SummaryCards: React.FC = () => {
  const { summary } = usePortfolio();
  const { t } = useTranslation();

  const mockHistory = [100, 102, 101, 105, 103, 108, 110];

  const cards = [
    {
      label: t('summary.total_value'),
      value: formatCurrency(summary.totalValue),
      subValue: t('summary.all_assets'),
      icon: DollarSign,
      color: 'text-amber-500',
      sparkColor: '#f59e0b',
    },
    {
      label: t('summary.daily_change'),
      value: formatCurrency(Math.abs(summary.dailyChange)),
      subValue: formatPercentage(summary.dailyChangePercentage),
      icon: summary.dailyChange >= 0 ? TrendingUp : TrendingDown,
      color: summary.dailyChange >= 0 ? 'text-success' : 'text-danger',
      isNegative: summary.dailyChange < 0,
      sparkColor: summary.dailyChange >= 0 ? '#10b981' : '#ef4444',
      benchmark: summary.benchmarkReturn !== undefined ? {
        label: 'S&P 500',
        value: formatPercentage(summary.benchmarkReturn),
        color: summary.benchmarkReturn >= 0 ? 'text-success' : 'text-danger'
      } : undefined
    },
    {
      label: t('summary.overall_roi'),
      value: formatCurrency(Math.abs(summary.totalReturn)),
      subValue: formatPercentage(summary.totalReturnPercentage),
      icon: Percent,
      color: summary.totalReturn >= 0 ? 'text-success' : 'text-danger',
      isNegative: summary.totalReturn < 0,
      sparkColor: summary.totalReturn >= 0 ? '#10b981' : '#ef4444',
    },
    ];


    return (
    <div className="grid grid-cols-3 gap-2 md:gap-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-card border border-border p-2 sm:p-3 md:p-6 rounded-lg md:rounded-xl hover:bg-card-hover transition-all group overflow-hidden relative">
          <div className="flex items-center justify-between mb-1 sm:mb-2 md:mb-4 relative z-10">
            <span className="text-[8px] sm:text-xs md:text-sm font-bold md:font-medium text-gray-500 md:text-gray-400 uppercase tracking-tighter md:normal-case md:tracking-normal truncate">
              {card.label.split(' ').pop()}
            </span>
            <div className={`hidden md:block p-2 rounded-lg bg-sidebar border border-border ${card.color}`}>
              <card.icon className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0 md:space-y-1 relative z-10 min-w-0">
            <h3 className="text-[10px] sm:text-base md:text-2xl font-black md:font-bold tracking-tighter md:tracking-tight truncate" title={card.value}>
              {card.isNegative && '-'} {card.value.replace('$', '')}
            </h3>
            <div className="flex items-center justify-between">
              <p className={`text-[9px] sm:text-sm font-bold md:font-medium ${card.color} truncate`}>
                {card.subValue}
              </p>
              {card.label === t('summary.daily_change') && (
                <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold bg-sidebar px-2 py-0.5 rounded border border-border">
                  <span className="text-gray-500">S&P 500:</span>
                  {(card as any).benchmark ? (
                    <span className={(card as any).benchmark.color}>{(card as any).benchmark.value}</span>
                  ) : (
                    <span className="text-gray-600 animate-pulse">Loading...</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-8 md:h-12 opacity-10 md:opacity-20 pointer-events-none">
            <Sparkline data={mockHistory} color={card.sparkColor} width="100%" height="100%" />
          </div>
        </div>
      ))}
    </div>
  );
};
