// Market data service — CoinGecko + Fear & Greed Index + Yahoo Finance proxied via public APIs

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface FearGreedData {
  value: number;
  classification: string;
  timestamp: number;
}

export interface MarketSnapshot {
  crypto: CryptoPrice[];
  fearGreed: FearGreedData | null;
  btcHashrate: number | null;
  globalMarketCap: number | null;
}

export const fetchCryptoPrices = async (): Promise<CryptoPrice[]> => {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,tether,ripple,dogecoin,cardano&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h'
    );
    if (!res.ok) throw new Error('CoinGecko API error');
    const data = await res.json();
    return data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h ?? 0,
      marketCap: coin.market_cap,
    }));
  } catch (e) {
    console.warn('Failed to fetch crypto prices:', e);
    return [];
  }
};

export const fetchFearGreedIndex = async (): Promise<FearGreedData | null> => {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=1');
    const data = await res.json();
    if (data.data?.[0]) {
      return {
        value: parseInt(data.data[0].value),
        classification: data.data[0].value_classification,
        timestamp: parseInt(data.data[0].timestamp) * 1000,
      };
    }
    return null;
  } catch (e) {
    console.warn('Failed to fetch Fear & Greed:', e);
    return null;
  }
};

export const fetchBTCHashrate = async (): Promise<number | null> => {
  try {
    const res = await fetch('https://mempool.space/api/v1/mining/hashrate/3d');
    const data = await res.json();
    if (data.currentHashrate) {
      return data.currentHashrate / 1e18; // Convert to EH/s
    }
    return null;
  } catch (e) {
    console.warn('Failed to fetch BTC hashrate:', e);
    return null;
  }
};

export const fetchGlobalMarketCap = async (): Promise<number | null> => {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/global');
    const data = await res.json();
    return data.data?.total_market_cap?.usd ?? null;
  } catch (e) {
    console.warn('Failed to fetch global market cap:', e);
    return null;
  }
};

export const fetchMarketSnapshot = async (): Promise<MarketSnapshot> => {
  const [crypto, fearGreed, btcHashrate, globalMarketCap] = await Promise.all([
    fetchCryptoPrices(),
    fetchFearGreedIndex(),
    fetchBTCHashrate(),
    fetchGlobalMarketCap(),
  ]);
  return { crypto, fearGreed, btcHashrate, globalMarketCap };
};
