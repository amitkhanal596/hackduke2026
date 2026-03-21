# Stock List for Autocomplete

## Usage

The `stockList.ts` file contains an array of stock symbols and company names used for the autocomplete feature in the AddStockForm component.

## How to Add More Stocks

Edit `frontend/lib/stockList.ts` and add entries in this format:

```typescript
{ symbol: "TICKER", name: "Company Full Name" },
```

### Example

```typescript
export const stockList: Stock[] = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  // Add your stocks here...
];
```

## Getting a Complete List

If you need a comprehensive list of stocks, you can:

1. **Use a CSV/JSON file**: Download a list from sources like:
   - NASDAQ: https://www.nasdaq.com/market-activity/stocks/screener
   - NYSE: https://www.nyse.com/listings_directory/stock

2. **Programmatically fetch**: Create a script to fetch from APIs like:
   - Alpha Vantage Listing Status: `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=YOUR_KEY`
   - IEX Cloud: `https://cloud.iexapis.com/stable/ref-data/symbols?token=YOUR_TOKEN`

3. **Example conversion script** (if you have a CSV):

```typescript
// convertStocks.ts
import fs from 'fs';
import csv from 'csv-parser';

const stocks: { symbol: string; name: string }[] = [];

fs.createReadStream('stocks.csv')
  .pipe(csv())
  .on('data', (row) => {
    stocks.push({
      symbol: row.symbol || row.Symbol,
      name: row.name || row.Name || row['Company Name']
    });
  })
  .on('end', () => {
    const output = `export interface Stock {
  symbol: string;
  name: string;
}

export const stockList: Stock[] = ${JSON.stringify(stocks, null, 2)};
`;
    fs.writeFileSync('stockList.ts', output);
    console.log('Stock list generated!');
  });
```

## Performance Notes

- The current implementation limits autocomplete results to 10 matches
- For lists with 1000+ stocks, consider adding debouncing to the search
- For 10,000+ stocks, consider using a trie or fuzzy search library like `fuse.js`

## Fuzzy Search (Optional Enhancement)

To add fuzzy search capabilities:

```bash
npm install fuse.js
```

Then update the filtering logic in `AddStockForm.tsx`:

```typescript
import Fuse from 'fuse.js';

const fuse = new Fuse(stockList, {
  keys: ['symbol', 'name'],
  threshold: 0.3,
});

// In useEffect:
const results = fuse.search(query);
const filtered = results.map(r => r.item).slice(0, 10);
```