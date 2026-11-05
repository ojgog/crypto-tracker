# Crypto Tracker

A small web dashboard for exploring cryptocurrency prices.

## Features

- Table with market data for up to 50 cryptocurrencies
- Sorting by price
- Seven-day price chart for the selected cryptocurrency
- BTC calculator using a live PLN exchange rate

## Tech stack

JavaScript, Vite, Chart.js, CSS and the public CoinGecko API.

## Run locally

```bash
cd crypto
npm install
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173/`).

## Notes

The app needs an internet connection to load market data. The free CoinGecko API may limit requests, so prices or charts can occasionally be unavailable. This is an educational dashboard, not financial advice.
