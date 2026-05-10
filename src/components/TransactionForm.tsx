import React, { useState } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle, AlertCircle, Loader2 } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { formatCurrency } from '../utils/calculations';
import type { Holding } from '../types';

interface TransactionFormProps {
  holding: Holding;
  type: 'buy' | 'sell';
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ holding, type, onClose }) => {
  const { recordTransaction, isLoading } = usePortfolio();
  const [formData, setFormData] = useState({
    quantity: '',
    price: holding.currentPrice.toString(),
    totalAmount: '',
  });
  const [inputMode, setInputMode] = useState<'quantity' | 'total'>('quantity');
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    
    if (field === 'quantity' || field === 'price') {
      const q = parseFloat(field === 'quantity' ? value : formData.quantity);
      const p = parseFloat(field === 'price' ? value : formData.price);
      if (!isNaN(q) && !isNaN(p)) {
        newFormData.totalAmount = (q * p).toFixed(2);
      }
    } else if (field === 'totalAmount') {
      const t = parseFloat(value);
      const p = parseFloat(formData.price);
      if (!isNaN(t) && !isNaN(p) && p !== 0) {
        newFormData.quantity = (t / p).toFixed(6);
      }
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);

    const qty = parseFloat(formData.quantity);
    const price = parseFloat(formData.price);

    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive number.');
      return;
    }

    if (isNaN(price) || price <= 0) {
      setError('Price must be a positive number.');
      return;
    }

    if (type === 'sell' && qty > holding.quantity) {
      setError(`Cannot sell more than you own (${holding.quantity} shares).`);
      return;
    }

    try {
      await recordTransaction(holding.id, type, qty, price);
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while recording the transaction.';
      setError(errorMessage);
    }
  };

  const currentTotalCost = holding.quantity * holding.averageCost;
  const newQty = type === 'buy' ? holding.quantity + (parseFloat(formData.quantity) || 0) : holding.quantity - (parseFloat(formData.quantity) || 0);
  const newTotalCost = type === 'buy' ? currentTotalCost + ((parseFloat(formData.quantity) || 0) * (parseFloat(formData.price) || 0)) : currentTotalCost;
  const newAvgCost = newQty > 0 ? newTotalCost / newQty : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${type === 'buy' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              {type === 'buy' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {type === 'buy' ? 'Buy' : 'Sell'} {holding.symbol}
              </h2>
              <p className="text-xs text-gray-500">Update your position with a new transaction.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-sidebar rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-center gap-2 text-danger text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction Mode</label>
            <div className="flex bg-sidebar p-0.5 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setInputMode('quantity')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${inputMode === 'quantity' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                BY QUANTITY
              </button>
              <button
                type="button"
                onClick={() => setInputMode('total')}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${inputMode === 'total' ? 'bg-amber-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                BY TOTAL AMOUNT
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {inputMode === 'quantity' ? `Quantity to ${type === 'buy' ? 'Buy' : 'Sell'}` : 'Quantity (Auto)'}
              </label>
              <input 
                type="number" 
                step="any"
                placeholder="0.00" 
                className={`w-full bg-sidebar border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-amber-500 transition-colors ${inputMode === 'total' ? 'opacity-70 bg-sidebar/50' : ''}`}
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                required
                readOnly={inputMode === 'total'}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{type === 'buy' ? 'Buy' : 'Sell'} Price</label>
              <input 
                type="number" 
                step="any" 
                placeholder="0.00" 
                className="w-full bg-sidebar border border-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                required
              />
            </div>
          </div>

          {inputMode === 'total' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-200">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-amber-400">Total {type === 'buy' ? 'Investment' : 'Proceeds'} (USD) *</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="any" 
                  placeholder="0.00" 
                  className="w-full bg-sidebar border-amber-500/50 border rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-amber-500 transition-colors font-bold text-amber-400"
                  value={formData.totalAmount}
                  onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-500/50 uppercase">USD</div>
              </div>
            </div>
          )}

          {inputMode === 'quantity' && formData.quantity && formData.price && (
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg flex justify-between items-center animate-in fade-in duration-300">
              <span className="text-xs text-gray-500 font-medium">Estimated Total:</span>
              <span className="text-sm font-bold text-amber-400">
                ${(parseFloat(formData.quantity) * parseFloat(formData.price)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="bg-sidebar/50 rounded-xl p-4 border border-border space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Projection</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Current Qty</span>
                <span className="text-sm font-medium">{holding.quantity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">New Qty</span>
                <span className={`text-sm font-bold ${type === 'buy' ? 'text-success' : 'text-danger'}`}>
                  {newQty.toFixed(4)}
                </span>
              </div>
              {type === 'buy' && (
                <div className="flex justify-between items-center pt-2 border-t border-border/50">
                  <span className="text-sm text-gray-400">New Avg Cost</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-500">{formatCurrency(newAvgCost)}</span>
                    <p className="text-[10px] text-gray-500">Current: {formatCurrency(holding.averageCost)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-sidebar transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className={`flex-1 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${
                type === 'buy' ? 'bg-success hover:bg-success/90 shadow-lg shadow-success/10' : 'bg-danger hover:bg-danger/90 shadow-lg shadow-danger/10'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                type === 'buy' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Recording...' : `${type === 'buy' ? 'Confirm Buy' : 'Confirm Sell'}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

