import Chart from 'chart.js/auto';
import './style.css';

const tableBody = document.getElementById('crypto-table');
const tableStatus = document.getElementById('tableStatus');
const chartStatus = document.getElementById('chartStatus');
const sortAscBtn = document.getElementById('sortAsc');
const sortDescBtn = document.getElementById('sortDesc');
const plnInput = document.getElementById('plnInput');
const calcBtn = document.getElementById('calcBtn');
const calcResult = document.getElementById('calcResult');

const apiBase = 'https://api.coingecko.com/api/v3';
let cryptos = [];
let chart;
let chartRequest = 0;

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 8,
});

function renderTable(data) {
  tableBody.replaceChildren();

  for (const coin of data) {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const priceCell = document.createElement('td');
    const changeCell = document.createElement('td');

    nameCell.textContent = coin.name;
    priceCell.textContent = Number.isFinite(coin.current_price)
      ? priceFormatter.format(coin.current_price)
      : '—';
    changeCell.textContent = Number.isFinite(coin.price_change_percentage_24h)
      ? `${coin.price_change_percentage_24h.toFixed(2)}%`
      : '—';

    row.append(nameCell, priceCell, changeCell);
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.setAttribute('aria-label', `Zobacz wykres dla ${coin.name}`);
    row.addEventListener('click', () => loadChart(coin.id, coin.name));
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        loadChart(coin.id, coin.name);
      }
    });
    tableBody.appendChild(row);
  }
}

async function fetchCryptos() {
  tableStatus.textContent = 'Ładowanie danych...';
  try {
    const data = await getJson(`${apiBase}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1`);
    if (!Array.isArray(data)) {
      throw new Error('Invalid API response');
    }
    cryptos = data;
    renderTable(cryptos);
    tableStatus.textContent = cryptos.length
      ? 'Kliknij wiersz, aby zobaczyć wykres ceny.'
      : 'Brak dostępnych danych.';
  } catch (error) {
    tableStatus.textContent = 'Nie udało się pobrać danych. Spróbuj odświeżyć stronę później.';
    console.error(error);
  }
}

sortAscBtn.addEventListener('click', () => {
  renderTable([...cryptos].sort((a, b) => a.current_price - b.current_price));
});

sortDescBtn.addEventListener('click', () => {
  renderTable([...cryptos].sort((a, b) => b.current_price - a.current_price));
});

calcBtn.addEventListener('click', async () => {
  const pln = Number(plnInput.value);
  if (!plnInput.value.trim() || !Number.isFinite(pln) || pln <= 0) {
    calcResult.textContent = 'Wpisz kwotę większą od zera.';
    return;
  }

  calcBtn.disabled = true;
  calcResult.textContent = 'Pobieranie aktualnego kursu BTC/PLN...';
  try {
    const data = await getJson(`${apiBase}/simple/price?ids=bitcoin&vs_currencies=pln`);
    const btcPln = data?.bitcoin?.pln;
    if (!Number.isFinite(btcPln) || btcPln <= 0) {
      throw new Error('BTC/PLN rate unavailable');
    }
    const btcAmount = pln / btcPln;
    calcResult.textContent = `${pln.toLocaleString('pl-PL')} PLN ≈ ${btcAmount.toFixed(8)} BTC`;
  } catch (error) {
    calcResult.textContent = 'Nie udało się pobrać kursu BTC/PLN. Spróbuj ponownie później.';
    console.error(error);
  } finally {
    calcBtn.disabled = false;
  }
});

async function loadChart(id, name) {
  const requestId = ++chartRequest;
  chartStatus.textContent = `Ładowanie wykresu: ${name}...`;
  try {
    const data = await getJson(`${apiBase}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=7`);
    if (!Array.isArray(data.prices) || !data.prices.length) {
      throw new Error('No price history');
    }
    if (requestId !== chartRequest) return;

    const labels = data.prices.map(([time]) =>
      new Date(time).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    );
    const prices = data.prices.map(([, price]) => price);
    chart?.destroy();
    chart = new Chart(document.getElementById('chart'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `${name} (USD)`,
          data: prices,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          pointRadius: 0,
          tension: 0.15,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: { x: { ticks: { maxTicksLimit: 8 } } },
      },
    });
    chartStatus.textContent = `Zmiana ceny w ostatnich 7 dniach: ${name}.`;
  } catch (error) {
    if (requestId !== chartRequest) return;
    chartStatus.textContent = 'Nie udało się pobrać wykresu. API może mieć limit zapytań.';
    console.error(error);
  }
}

fetchCryptos();
