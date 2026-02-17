// K Spider AI Tool - Real-time Backend Server
// Node.js + Express + Google Sheets Integration

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { google } = require('googleapis');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== CONFIGURATION ====================

// Google Sheets Configuration
const GOOGLE_CREDENTIALS_PATH = './credentials.json';
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your actual Google Sheet ID

// Market Data API Configuration
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY || 'YOUR_API_KEY';
const TWELVE_DATA_KEY = process.env.TWELVE_DATA_KEY || 'YOUR_API_KEY';

// Indian Stock Symbols Mapping
const INDIAN_STOCKS = {
  'SENSEX': '^BSESN',
  'NIFTY': '^NSEI',
  'RELIANCE': 'RELIANCE.BSE',
  'TCS': 'TCS.BSE',
  'INFY': 'INFY.BSE',
  'HDFC': 'HDFCBANK.BSE',
  'ICICI': 'ICICIBANK.BSE'
};

// ==================== GOOGLE SHEETS SETUP ====================

let sheetsClient = null;

async function initGoogleSheets() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: GOOGLE_CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const authClient = await auth.getClient();
    sheetsClient = google.sheets({ version: 'v4', auth: authClient });
    console.log('✅ Google Sheets connected');
    return true;
  } catch (error) {
    console.error('❌ Google Sheets connection failed:', error.message);
    return false;
  }
}

// Write data to Google Sheets
async function writeToSheet(range, values) {
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  try {
    const response = await sheetsClient.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: 'RAW',
      resource: { values },
    });
    return response.data;
  } catch (error) {
    console.error('Error writing to sheet:', error);
    throw error;
  }
}

// Read data from Google Sheets
async function readFromSheet(range) {
  if (!sheetsClient) {
    throw new Error('Google Sheets not initialized');
  }
  
  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });
    return response.data.values || [];
  } catch (error) {
    console.error('Error reading from sheet:', error);
    throw error;
  }
}

// ==================== REAL-TIME MARKET DATA FETCHERS ====================

// Option 1: Alpha Vantage (Free tier: 5 calls/min)
async function fetchFromAlphaVantage(symbol) {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
    const response = await axios.get(url);
    const quote = response.data['Global Quote'];
    
    if (!quote || !quote['05. price']) {
      throw new Error('Invalid response from Alpha Vantage');
    }
    
    return {
      symbol: symbol,
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      lastUpdated: quote['07. latest trading day'],
      source: 'AlphaVantage'
    };
  } catch (error) {
    console.error(`Error fetching ${symbol} from Alpha Vantage:`, error.message);
    return null;
  }
}

// Option 2: Twelve Data (Better for Indian stocks)
async function fetchFromTwelveData(symbol) {
  try {
    const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${TWELVE_DATA_KEY}`;
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data || data.code === 400) {
      throw new Error('Invalid response from Twelve Data');
    }
    
    return {
      symbol: symbol,
      price: parseFloat(data.close),
      change: parseFloat(data.change),
      changePercent: parseFloat(data.percent_change),
      volume: parseInt(data.volume),
      high: parseFloat(data.high),
      low: parseFloat(data.low),
      lastUpdated: data.datetime,
      source: 'TwelveData'
    };
  } catch (error) {
    console.error(`Error fetching ${symbol} from Twelve Data:`, error.message);
    return null;
  }
}

// Option 3: Yahoo Finance (Free, no API key needed)
async function fetchFromYahooFinance(symbol) {
  try {
    // Yahoo Finance has unofficial APIs but can be rate-limited
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    const result = response.data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators.quote[0];
    
    return {
      symbol: symbol,
      price: meta.regularMarketPrice,
      change: meta.regularMarketPrice - meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose * 100),
      volume: meta.regularMarketVolume,
      high: meta.regularMarketDayHigh,
      low: meta.regularMarketDayLow,
      lastUpdated: new Date(meta.regularMarketTime * 1000).toISOString(),
      source: 'YahooFinance'
    };
  } catch (error) {
    console.error(`Error fetching ${symbol} from Yahoo Finance:`, error.message);
    return null;
  }
}

// Option 4: NSE India (Direct from NSE - free but needs proper headers)
async function fetchFromNSE(symbol) {
  try {
    const url = `https://www.nseindia.com/api/quote-equity?symbol=${symbol}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      timeout: 5000
    });
    
    const data = response.data.priceInfo;
    
    return {
      symbol: symbol,
      price: parseFloat(data.lastPrice),
      change: parseFloat(data.change),
      changePercent: parseFloat(data.pChange),
      volume: parseInt(data.totalTradedVolume),
      high: parseFloat(data.intraDayHighLow.max),
      low: parseFloat(data.intraDayHighLow.min),
      lastUpdated: new Date().toISOString(),
      source: 'NSE'
    };
  } catch (error) {
    console.error(`Error fetching ${symbol} from NSE:`, error.message);
    return null;
  }
}

// Smart fetcher with fallback
async function fetchMarketData(symbol, provider = 'auto') {
  if (provider === 'nse' || provider === 'auto') {
    const nseData = await fetchFromNSE(symbol);
    if (nseData) return nseData;
  }
  
  if (provider === 'yahoo' || provider === 'auto') {
    const yahooData = await fetchFromYahooFinance(INDIAN_STOCKS[symbol] || symbol);
    if (yahooData) return yahooData;
  }
  
  if (provider === 'twelve' || provider === 'auto') {
    const twelveData = await fetchFromTwelveData(symbol);
    if (twelveData) return twelveData;
  }
  
  if (provider === 'alpha' || provider === 'auto') {
    const alphaData = await fetchFromAlphaVantage(symbol);
    if (alphaData) return alphaData;
  }
  
  // Return mock data as fallback
  return generateMockData(symbol);
}

// Generate mock data for testing
function generateMockData(symbol) {
  const basePrice = Math.random() * 5000 + 1000;
  const change = (Math.random() - 0.5) * 100;
  
  return {
    symbol: symbol,
    price: parseFloat(basePrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat((change / basePrice * 100).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000),
    high: parseFloat((basePrice * 1.05).toFixed(2)),
    low: parseFloat((basePrice * 0.95).toFixed(2)),
    lastUpdated: new Date().toISOString(),
    source: 'Mock'
  };
}

// ==================== API ENDPOINTS ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    sheetsConnected: sheetsClient !== null
  });
});

// Get live ticker data
app.get('/api/ticker', async (req, res) => {
  try {
    const symbols = ['SENSEX', 'NIFTY', 'RELIANCE', 'TCS', 'INFY'];
    const provider = req.query.provider || 'auto';
    
    const promises = symbols.map(symbol => fetchMarketData(symbol, provider));
    const results = await Promise.all(promises);
    
    const tickerData = {};
    results.forEach(data => {
      if (data) {
        tickerData[data.symbol] = {
          price: data.price,
          pct: data.changePercent,
          change: data.change,
          volume: data.volume,
          lastUpdated: data.lastUpdated,
          source: data.source
        };
      }
    });
    
    // Save to Google Sheets if connected
    if (sheetsClient) {
      const timestamp = new Date().toISOString();
      const row = [
        timestamp,
        tickerData.SENSEX?.price || '',
        tickerData.NIFTY?.price || '',
        tickerData.RELIANCE?.price || '',
        JSON.stringify(tickerData)
      ];
      
      await writeToSheet('TickerData!A:E', [row]).catch(err => 
        console.error('Failed to write to sheet:', err)
      );
    }
    
    res.json({
      success: true,
      data: tickerData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/ticker:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get specific stock data
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const provider = req.query.provider || 'auto';
    
    const data = await fetchMarketData(symbol, provider);
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        error: 'Stock data not found' 
      });
    }
    
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/stock:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get mutual fund buying/selling data
app.post('/api/analyze', async (req, res) => {
  try {
    const { mode, dateFrom, dateTo } = req.body;
    
    // In production, fetch actual MF data from sources like:
    // - SEBI MFSS data
    // - NSE/BSE bulk deals
    // - Institutional trading data
    
    const mockMFData = {
      buying: generateMockMFBuying(),
      selling: generateMockMFSelling()
    };
    
    // Save analysis to Google Sheets
    if (sheetsClient) {
      const timestamp = new Date().toISOString();
      const row = [
        timestamp,
        mode,
        dateFrom,
        dateTo,
        JSON.stringify(mockMFData)
      ];
      
      await writeToSheet('AnalysisData!A:E', [row]).catch(err => 
        console.error('Failed to write analysis:', err)
      );
    }
    
    res.json({
      success: true,
      data: mockMFData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get historical data from Google Sheets
app.get('/api/history', async (req, res) => {
  try {
    if (!sheetsClient) {
      return res.status(503).json({ 
        success: false, 
        error: 'Google Sheets not connected' 
      });
    }
    
    const { range, limit } = req.query;
    const sheetRange = range || 'TickerData!A:E';
    
    const data = await readFromSheet(sheetRange);
    const limitedData = limit ? data.slice(-parseInt(limit)) : data;
    
    res.json({
      success: true,
      data: limitedData,
      count: limitedData.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/history:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Save custom analysis to Google Sheets
app.post('/api/save-analysis', async (req, res) => {
  try {
    if (!sheetsClient) {
      return res.status(503).json({ 
        success: false, 
        error: 'Google Sheets not connected' 
      });
    }
    
    const { analysis, stocks, notes } = req.body;
    const timestamp = new Date().toISOString();
    
    const row = [
      timestamp,
      analysis.mode || '',
      JSON.stringify(stocks),
      notes || '',
      analysis.verdict || ''
    ];
    
    await writeToSheet('UserAnalysis!A:E', [row]);
    
    res.json({
      success: true,
      message: 'Analysis saved to Google Sheets',
      timestamp: timestamp
    });
  } catch (error) {
    console.error('Error in /api/save-analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== MOCK DATA GENERATORS ====================

function generateMockMFBuying() {
  const stocks = [
    { name: 'Reliance Industries', symbol: 'RELIANCE', sector: 'Energy', price: 2450 },
    { name: 'HDFC Bank', symbol: 'HDFCBANK', sector: 'Banking', price: 1620 },
    { name: 'Infosys', symbol: 'INFY', sector: 'IT', price: 1450 },
    { name: 'TCS', symbol: 'TCS', sector: 'IT', price: 3580 },
    { name: 'ICICI Bank', symbol: 'ICICIBANK', sector: 'Banking', price: 1050 }
  ];
  
  return stocks.map((stock, i) => ({
    name: stock.name,
    symbol: stock.symbol,
    sector: stock.sector,
    price: stock.price + Math.random() * 50 - 25,
    change: (Math.random() - 0.5) * 5,
    fundNames: `SBI MF, HDFC MF, ICICI Pru${i > 2 ? ', Axis MF' : ''}`,
    quantity: `${Math.floor(Math.random() * 50 + 10)}L shares`,
    transactionValue: `${Math.floor(Math.random() * 500 + 200)} Cr`,
    reason: 'Strong Q4 results, sector tailwinds, institutional confidence',
    verdict: 'STRONG BUY - CONSIDER SIP',
    longTermOutlook: 'Fundamentals solid. 15-20% growth expected.',
    shortTermNote: 'Some volatility expected. Use dips to accumulate.',
    indiaFactors: ['GDP growth 7%+', 'Strong corporate earnings', 'FII inflows'],
    globalFactors: ['Rate cut expectations', 'China recovery', 'Crude oil stable']
  }));
}

function generateMockMFSelling() {
  const stocks = [
    { name: 'Paytm', symbol: 'PAYTM', sector: 'FinTech', price: 450 },
    { name: 'Zomato', symbol: 'ZOMATO', sector: 'Consumer', price: 145 },
    { name: 'Vodafone Idea', symbol: 'IDEA', sector: 'Telecom', price: 12 }
  ];
  
  return stocks.map((stock, i) => ({
    name: stock.name,
    symbol: stock.symbol,
    sector: stock.sector,
    price: stock.price - Math.random() * 10,
    change: -(Math.random() * 5 + 1),
    fundNames: `Multiple funds exiting`,
    quantity: `${Math.floor(Math.random() * 30 + 5)}L shares`,
    holdingChange: `-${Math.floor(Math.random() * 3 + 1)}%`,
    reason: 'Weak fundamentals, regulatory concerns, margin pressure',
    verdict: 'AVOID / EXIT POSITIONS',
    warningNote: 'Smart money exiting. Not recommended for new investments.'
  }));
}

// ==================== SERVER START ====================

async function startServer() {
  // Initialize Google Sheets
  const sheetsInitialized = await initGoogleSheets();
  
  if (!sheetsInitialized) {
    console.warn('⚠️  Server starting without Google Sheets integration');
    console.warn('⚠️  Place credentials.json in the project root to enable Sheets');
  }
  
  app.listen(PORT, () => {
    console.log(`\n🚀 K Spider AI Backend Server Running`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🔄 Ticker: http://localhost:${PORT}/api/ticker`);
    console.log(`\n${sheetsInitialized ? '✅' : '❌'} Google Sheets: ${sheetsInitialized ? 'Connected' : 'Not Connected'}`);
    console.log(`\n📝 Available Endpoints:`);
    console.log(`   GET  /health - Server health check`);
    console.log(`   GET  /api/ticker - Live market ticker data`);
    console.log(`   GET  /api/stock/:symbol - Specific stock data`);
    console.log(`   POST /api/analyze - Generate MF analysis`);
    console.log(`   GET  /api/history - Get historical data from Sheets`);
    console.log(`   POST /api/save-analysis - Save analysis to Sheets`);
    console.log(`\n🔑 Remember to set your API keys in environment variables!`);
  });
}

startServer();
