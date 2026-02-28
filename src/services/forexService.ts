// Live forex rates from Frankfurter API (free, no key needed)

export interface ForexRate {
  symbol: string;
  value: string;
  change: string;
  up: boolean;
}

let cachedRates: ForexRate[] | null = null;
let lastFetch = 0;
const CACHE_MS = 60_000; // 1 min cache

export const fetchForexRates = async (): Promise<ForexRate[]> => {
  if (cachedRates && Date.now() - lastFetch < CACHE_MS) return cachedRates;
  
  try {
    // Get latest rates against USD
    const [latestRes, yesterdayRes] = await Promise.all([
      fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,CHF,CAD,AUD,CNY,INR,KRW,BRL,MXN,RUB,TRY,ZAR,SGD'),
      fetch(`https://api.frankfurter.app/${getYesterday()}?from=USD&to=EUR,GBP,JPY,CHF,CAD,AUD,CNY,INR,KRW,BRL,MXN,RUB,TRY,ZAR,SGD`),
    ]);
    
    if (!latestRes.ok || !yesterdayRes.ok) throw new Error('Frankfurter API error');
    
    const latest = await latestRes.json();
    const yesterday = await yesterdayRes.json();
    
    const pairs: { symbol: string; invert?: boolean }[] = [
      { symbol: 'EUR' },
      { symbol: 'GBP' },
      { symbol: 'JPY' },
      { symbol: 'CHF' },
      { symbol: 'CAD' },
      { symbol: 'AUD' },
      { symbol: 'CNY' },
      { symbol: 'INR' },
      { symbol: 'KRW' },
      { symbol: 'BRL' },
      { symbol: 'MXN' },
      { symbol: 'TRY' },
      { symbol: 'ZAR' },
      { symbol: 'SGD' },
    ];
    
    const rates: ForexRate[] = pairs
      .filter(p => latest.rates[p.symbol] && yesterday.rates[p.symbol])
      .map(p => {
        const curr = latest.rates[p.symbol];
        const prev = yesterday.rates[p.symbol];
        const changePct = ((curr - prev) / prev) * 100;
        // For forex display: USD/XXX rate inverted to show how much 1 USD buys
        const displayRate = curr;
        return {
          symbol: `USD/${p.symbol}`,
          value: displayRate < 10 ? displayRate.toFixed(4) : displayRate < 1000 ? displayRate.toFixed(2) : Math.round(displayRate).toLocaleString(),
          change: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`,
          up: changePct >= 0,
        };
      });
    
    cachedRates = rates;
    lastFetch = Date.now();
    return rates;
  } catch (e) {
    console.warn('Failed to fetch forex rates:', e);
    return cachedRates || [];
  }
};

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  // Skip weekends
  if (d.getDay() === 0) d.setDate(d.getDate() - 2);
  if (d.getDay() === 6) d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
