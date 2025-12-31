import Chart from 'chart.js/auto';
import "./style.css";

const tableBody = document.getElementById('crypto-table');
const sortAscBtn = document.getElementById('sortAsc');
const sortDescBtn = document.getElementById('sortDesc');
const plnInput = document.getElementById('plnInput');
const calcBtn = document.getElementById('calcBtn');
const calcResult = document.getElementById('calcResult');

let cryptos = [];
let chart;

const API =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1';

async function fetchCryptos() {
  const res = await fetch(API);
  cryptos = await res.json();
  renderTable(cryptos);
}

function renderTable(data) {
  tableBody.innerHTML = '';
  data.forEach((coin) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${coin.name}</td>
      <td>${coin.current_price}</td>
      <td>${coin.price_change_percentage_24h?.toFixed(2)}</td>
    `;
    row.addEventListener('click', () => loadChart(coin.id));
    tableBody.appendChild(row);
  });
}

sortAscBtn.onclick = () => {
  const sorted = [...cryptos].sort((a, b) => a.current_price - b.current_price);
  renderTable(sorted);
};

sortDescBtn.onclick = () => {
  const sorted = [...cryptos].sort((a, b) => b.current_price - a.current_price);
  renderTable(sorted);
};

calcBtn.onclick = () => {
  const btc = cryptos.find((c) => c.id === 'bitcoin');
  const pln = Number(plnInput.value);
  const btcAmount = pln / (btc.current_price * 4); // ~kurs USD→PLN
  calcResult.textContent = `To jest ${btcAmount.toFixed(4)} BTC`;
};

async function loadChart(id) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`
  );
  const data = await res.json();

  const prices = data.prices.map((p) => p[1]);
  const labels = data.prices.map((p) =>
    new Date(p[0]).toLocaleDateString()
  );

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById('chart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Cena (USD)',
          data: prices,
          borderColor: 'blue',
        },
      ],
    },
  });
}

fetchCryptos();
