import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const TotalPerformanceCard: React.FC = () => {
  const { summary, usdToThb } = usePortfolio();
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const thbValue = summary.totalValue * usdToThb;
  
  const formattedDate = currentTime.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const isDailyPositive = summary.dailyChangePercentage >= 0;
  const isTotalPositive = summary.totalReturn >= 0;

  return (
    <div className="bg-[#121212] border border-border/50 rounded-[32px] p-8 shadow-2xl overflow-hidden relative group">
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10 space-y-8">
        <div>
          <h2 className="text-gray-400 font-medium text-lg flex items-center gap-2">
            {t('summary.total_performance')} 
            <span className="text-gray-600 font-normal italic">
              ({formattedDate} - {formattedTime})
            </span>
          </h2>
          
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-baseline gap-3">
              <span className="text-6xl font-black tracking-tight text-white">
                {summary.totalValue.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
              <span className="text-3xl font-bold text-white/80">USD</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-gray-400 text-2xl font-medium">
                ≈ {thbValue.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })} THB
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 rounded-full border border-black overflow-hidden shrink-0">
                    <img src="https://flagcdn.com/us.svg" className="w-full h-full object-cover" alt="USD" />
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-400">1 USD = {usdToThb.toFixed(2)} THB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-white/5">
          <div className="flex justify-between items-center group/item p-4 rounded-2xl hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-lg font-medium">1-Day Change</span>
              <Info className="w-4 h-4 text-gray-600" />
            </div>
            <div className={`flex items-center gap-1.5 font-bold text-2xl ${isDailyPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isDailyPositive ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
              {Math.abs(summary.dailyChangePercentage).toFixed(2)}%
            </div>
          </div>

          <div className="flex justify-between items-center group/item p-4 rounded-2xl hover:bg-white/5 transition-colors">
            <span className="text-gray-400 text-lg font-medium">Unrealized P/L</span>
            <div className={`flex items-center gap-1.5 font-bold text-2xl ${isTotalPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isTotalPositive ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
              {Math.abs(summary.totalReturnPercentage).toFixed(2)}%
              <span className="text-lg opacity-80 ml-1">
                ({isTotalPositive ? '+' : '-'}{Math.abs(summary.totalReturn).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} USD)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

