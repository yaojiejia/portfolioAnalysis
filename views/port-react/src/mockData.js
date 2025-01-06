// src/mockData.js
export const mockStockPrices = {
  AAPL: {
    price: 175.50,
    history: [150, 160, 165, 170, 175, 180, 178]
  },
  GOOGL: {
    price: 2750,
    history: [2500, 2600, 2650, 2720, 2750, 2780, 2800]
  },
  AMZN: {
    price: 3450,
    history: [3300, 3325, 3400, 3420, 3450, 3500, 3475]
  },
  MSFT: {
    price: 295,
    history: [280, 285, 290, 300, 310, 305, 295]
  },
  TSLA: {
    price: 900,
    history: [800, 850, 820, 880, 900, 950, 920]
  }
};

export const mockStockSectors = {
  AAPL: 'Technology',
  GOOGL: 'Technology',
  MSFT: 'Technology',
  AMZN: 'Consumer Cyclical',
  TSLA: 'Automotive',
  JPM: 'Financial Services',
  WMT: 'Consumer Defensive',
  JNJ: 'Healthcare',
  PG: 'Consumer Defensive',
  V: 'Financial Services'
};