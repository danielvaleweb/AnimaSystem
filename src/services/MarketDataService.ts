export interface QuoteResult {
  ticker: string;
  price: number;
  currency: string;
  name?: string;
  logo?: string;
  updatedAt: string;
}

export interface AssetSearchResult {
  stock: string;
  name: string;
  logo: string;
  sector?: string;
}

export class MarketDataService {
  /**
   * Fetch quote for a list of tickers from backend proxy
   */
  static async getQuotes(tickers: string[]): Promise<Record<string, QuoteResult>> {
    if (!tickers || tickers.length === 0) return {};
    
    try {
      const tickerString = tickers.join(',');
      const response = await fetch(`/api/investments/quote?tickers=${encodeURIComponent(tickerString)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quotes: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const results: Record<string, QuoteResult> = {};
      
      if (data && data.results) {
        data.results.forEach((item: any) => {
          results[item.symbol] = {
            ticker: item.symbol,
            price: item.regularMarketPrice || 0,
            currency: item.currency || 'BRL',
            name: item.longName || item.shortName,
            logo: item.logourl,
            updatedAt: item.regularMarketTime || new Date().toISOString()
          };
        });
      }
      
      return results;
    } catch (error) {
      console.error("MarketDataService.getQuotes Error:", error);
      return {};
    }
  }

  /**
   * Search available assets
   */
  static async searchAssets(query: string): Promise<AssetSearchResult[]> {
    if (!query || query.length < 2) return [];
    
    try {
      const response = await fetch(`/api/investments/search?search=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to search assets: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data.stocks) {
        return data.stocks;
      }
      return [];
    } catch (error) {
      console.error("MarketDataService.searchAssets Error:", error);
      return [];
    }
  }
}
