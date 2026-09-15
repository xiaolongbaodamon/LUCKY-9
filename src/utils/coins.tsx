import React from 'react';
import { Coins } from 'lucide-react';

/**
 * Formats a coin number compactly.
 * Specifically:
 * - 1,100,000 -> "1.1M"
 * - 1,000,000 -> "1M"
 * - 2,500,000 -> "2.5M"
 * - 50,000 -> "50K"
 * - 1,500 -> "1.5K"
 * - 850 -> "850"
 */
export function formatCoinsCompact(amount: number | null | undefined): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const b = abs / 1_000_000_000;
    const formatted = b % 1 === 0 ? b.toFixed(0) : b.toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted}B`;
  }

  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    // Exactly matches user specification: 1100000 -> 1.1M
    const formatted = m % 1 === 0 ? m.toFixed(0) : (m % 0.1 < 0.001 ? m.toFixed(1) : m.toFixed(2).replace(/0$/, ''));
    return `${sign}${formatted}M`;
  }

  if (abs >= 1_000) {
    const k = abs / 1_000;
    const formatted = k % 1 === 0 ? k.toFixed(0) : (k >= 10 ? k.toFixed(0) : k.toFixed(1).replace(/\.0$/, ''));
    return `${sign}${formatted}K`;
  }

  return `${sign}${abs.toLocaleString()}`;
}

export function formatCoinsFull(amount: number | null | undefined): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  return Math.round(amount).toLocaleString();
}

interface CoinLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

/**
 * High-fidelity 3D-styled Casino Coin Emblem
 */
export const CoinLogo: React.FC<CoinLogoProps> = ({ size = 'sm', className = '', glow = false }) => {
  const sizeMap = {
    xs: 'w-3.5 h-3.5 text-[8px]',
    sm: 'w-4 h-4 text-[9px]',
    md: 'w-5 h-5 text-[11px]',
    lg: 'w-6 h-6 text-xs',
    xl: 'w-8 h-8 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 text-slate-950 font-black shadow-sm ring-1 ring-amber-300/80 select-none flex-shrink-0 relative overflow-hidden ${
        sizeMap[size]
      } ${glow ? 'shadow-amber-400/50 shadow-md ring-amber-200' : ''} ${className}`}
      title="Coins"
    >
      <span className="absolute inset-0 rounded-full border border-yellow-200/50 pointer-events-none" />
      <span className="font-cinzel font-black leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
        9
      </span>
    </span>
  );
};

interface CoinAmountProps {
  amount: number | null | undefined;
  compact?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSign?: boolean;
  className?: string;
  textClassName?: string;
  showTooltip?: boolean;
}

/**
 * Complete Coin Amount display: e.g. "1.1M (coin logo)"
 */
export const CoinAmount: React.FC<CoinAmountProps> = ({
  amount = 0,
  compact = true,
  size = 'sm',
  showSign = false,
  className = '',
  textClassName = '',
  showTooltip = true,
}) => {
  const safeAmount = amount ?? 0;
  const displayText = compact ? formatCoinsCompact(safeAmount) : formatCoinsFull(safeAmount);
  const signPrefix = showSign && safeAmount > 0 ? '+' : '';
  const fullText = formatCoinsFull(safeAmount);

  const textSize = {
    xs: 'text-[11px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-extrabold',
    xl: 'text-xl font-black',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono-code font-bold ${textSize} ${className}`}
      title={showTooltip ? `${fullText} Coins` : undefined}
    >
      <span className={`text-amber-300 ${textClassName}`}>
        {signPrefix}
        {displayText}
      </span>
      <CoinLogo size={size} glow={compact && safeAmount >= 1_000_000} />
    </span>
  );
};
