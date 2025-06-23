
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAmount(amount: number): string {
  return Math.round(amount).toLocaleString('en-PK');
}

export function formatCurrency(amount: number, currencySymbol: string = 'Rs.'): string {
  return `${currencySymbol} ${formatAmount(amount)}`;
}

// Enhanced function to format currency with system settings
export function formatCurrencyWithSettings(amount: number, settings?: { currencySymbol: string; currencyCode: string }): string {
  const symbol = settings?.currencySymbol || 'Rs.';
  return formatCurrency(amount, symbol);
}

// New helper to get currency symbol from system settings
export function getCurrencyDisplay(settings?: { currencySymbol: string; currencyCode: string }): string {
  return settings?.currencySymbol || 'Rs.';
}
