import React, { createContext, useContext, useState, useEffect } from 'react';
import { CurrencyCode } from '../types';

export interface CurrencyDetails {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  rateToFCFA: number; // 1 unit of foreign currency = X FCFA
  example: string;
}

export const CURRENCY_RATES: Record<CurrencyCode, CurrencyDetails> = {
  FCFA: {
    code: 'FCFA',
    symbol: 'FCFA',
    name: 'Franc CFA (XOF)',
    flag: '🇧🇯',
    rateToFCFA: 1,
    example: '65 000 FCFA',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro (€)',
    flag: '🇪🇺',
    rateToFCFA: 655.957, // Parité fixe officielle 1 EUR = 655,957 FCFA
    example: '99,09 €',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dollar Américain ($)',
    flag: '🇺🇸',
    rateToFCFA: 610, // Taux de référence standard 1 USD = 610 FCFA
    example: '$106.56',
  },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (amountInFCFA: number, targetCurrency?: CurrencyCode) => string;
  convertPrice: (amountInFCFA: number, targetCurrency?: CurrencyCode) => number;
  currentCurrencyDetails: CurrencyDetails;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{
  initialCurrency?: CurrencyCode;
  onCurrencyChange?: (c: CurrencyCode) => void;
  children: React.ReactNode;
}> = ({ initialCurrency = 'FCFA', onCurrencyChange, children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(initialCurrency);

  // Sync if prop changes
  useEffect(() => {
    if (initialCurrency && initialCurrency !== currency) {
      setCurrencyState(initialCurrency);
    }
  }, [initialCurrency]);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    if (onCurrencyChange) {
      onCurrencyChange(code);
    }
  };

  const convertPrice = (amountInFCFA: number, targetCurrency?: CurrencyCode): number => {
    const cur = targetCurrency || currency;
    const rate = CURRENCY_RATES[cur].rateToFCFA;
    if (cur === 'FCFA') return amountInFCFA;
    return amountInFCFA / rate;
  };

  const formatPrice = (amountInFCFA: number, targetCurrency?: CurrencyCode): string => {
    const cur = targetCurrency || currency;
    const converted = convertPrice(amountInFCFA, cur);

    if (cur === 'FCFA') {
      return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(converted)) + ' FCFA';
    }

    if (cur === 'EUR') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(converted);
    }

    if (cur === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(converted);
    }

    return `${converted} ${cur}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice,
        convertPrice,
        currentCurrencyDetails: CURRENCY_RATES[currency],
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
