'use strict';

const STORAGE_KEY = 'controleFinanceiroMovimentacoes';
const CHART_COLORS = ['#5b8cff', '#39cb91', '#a58af7', '#f0a35e', '#e879a9', '#42bdc8', '#e4ca62', '#8ca0b8'];
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

const elements = {
  balance: document.querySelector('#balance-value'),
  income: document.querySelector('#income-value'),
  expense: document.querySelector('#expense-value'),
  count: document.querySelector('#count-value'),
  monthFilter: document.querySelector('#month-filter'),
  typeFilter: document.querySelector('#type-filter'),
  searchFilter: document.querySelector('#search-filter'),
  transactionList: document.querySelector('#transaction-list'),
  recordCount: document.querySelector('#record-count'),
  emptyState: document.querySelector('#empty-state'),
  emptyTitle: document.querySelector('#empty-title'),
  emptyMessage: document.querySelector('#empty-message'),
  dialog: document.querySelector('#transaction-dialog'),
  form: document.querySelector('#transaction-form'),
  formError: document.querySelector('#form-error'),
  description: document.querySelector('#description'),
  amount: document.querySelector('#amount'),
  category: document.querySelector('#category'),
  type: document.querySelector('#transaction-type'),
  date: document.querySelector('#transaction-date'),
  today: document.querySelector('#today-label'),
  monthlyCanvas: document.querySelector('#monthly-chart'),
  categoryCanvas: document.querySelector('#category-chart'),
  categoryLegend: document.querySelector('#category-legend'),
  toastRegion: document.querySelector('#toast-region')
};

let transactions = loadTransactions();

function isValidTransaction(item) {
  return item && typeof item.id === 'string'
    && typeof item.description === 'string' && item.description.trim() !== ''
    && typeof item.category === 'string' && item.category.trim() !== ''
    && (item.type === 'income' || item.type === 'expense')
    && Number.isSafeInteger(getAmountCents(item)) && getAmountCents(item) > 0
    && isValidDateString(item.date);
}

function getAmountCents(item) {
  if (Number.isSafeInteger(item.amountCents)) return item.amountCents;
  if (Number.isFinite(item.amount) && item.amount > 0) {
    const cents = Math.round(item.amount * 100);
    return Number.isSafeInteger(cents) ? cents : NaN;
  }
  return NaN;
}

function normalizeTransaction(item) {
  return {
    id: item.id,
    description: item.description.trim(),
    category: item.category.trim(),
    amountCents: getAmountCents(item),
    date: item.date,
    type: item.type
  };
}

function isValidDateString(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

function loadTransactions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error('O conteúdo salvo não tem o formato esperado.');
    const valid = parsed.filter(isValidTransaction).map(normalizeTransaction);
    const invalidCount = parsed.length - valid.length;
    if (invalidCount > 0) {
      showToast(`${invalidCount} registro(s) inválido(s) foram ignorados. As movimentações válidas foram preservadas.`, 'error');
    }
    return valid;
  } catch (error) {
    console.error('Não foi possível carregar as movimentações salvas:', error);
    showToast('Não foi possível ler os dados salvos. Os registros existentes não foram alterados.', 'error');
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch (error) {
    console.error('Não foi possível salvar as movimentações:', error);
    const message = error && error.name === 'QuotaExceededError'
      ? 'Não foi possível salvar: o armazenamento do navegador está cheio.'
      : 'Não foi possível salvar: o navegador bloqueou o armazenamento local.';
    showToast(message, 'error');
    return false;
  }
}

function formatCurrencyFromCents(amountCents) {
  const cents = typeof amountCents === 'bigint' ? amountCents : BigInt(amountCents);
  const negative = cents < 0n;
  const absoluteCents = negative ? -cents : cents;
  const parts = currencyFormatter.formatToParts(absoluteCents / 100n);
  const decimalSeparator = parts.find(part => part.type === 'decimal').value;
  const wholeAmount = parts
    .filter(part => part.type !== 'decimal' && part.type !== 'fraction')
    .map(part => part.value)
    .join('');
  const fraction = String(absoluteCents % 100n).padStart(2, '0');
  return `${negative ? '-' : ''}${wholeAmount}${decimalSeparator}${fraction}`;
}

function sumCents(items, type) {
  return items.reduce((sum, item) => {
    return sum + (item.type === type ? BigInt(item.amountCents) : 0n);
  }, 0n);
}

function parseAmountToCents(value) {
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(value);
  if (!match) return NaN;
  const wholePart = Number(match[1]);
  const fractionPart = Number((match[2] || '').padEnd(2, '0'));
  const cents = wholePart * 100 + fractionPart;
  return Number.isSafeInteger(cents) ? cents : NaN;
}

function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createLocalDate(year, month, day) {
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month - 1, day);
  return date;
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return dateFormatter.format(createLocalDate(year, month, day));
}

function showToast(message, type) {
  const toast = document.createElement('div');
  toast.className = `toast${type === 'error' ? ' error' : ''}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.textContent = message;
  elements.toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 3500);
}

function renderSummary() {
  const income = sumCents(transactions, 'income');
  const expense = sumCents(transactions, 'expense');
  elements.balance.textContent = formatCurrencyFromCents(income - expense);
  elements.income.textContent = formatCurrencyFromCents(income);
  elements.expense.textContent = formatCurrencyFromCents(expense);
  elements.count.textContent = String(transactions.length);
}

function getSelectedMonth() {
  return elements.monthFilter.value;
}

function getMonthKey(dateString) {
  return dateString.slice(0, 7);
}

function updateMonthOptions() {
  const selected = getSelectedMonth();
  const months = [...new Set(transactions.map(item => getMonthKey(item.date)))].sort().reverse();
  elements.monthFilter.replaceChildren(new Option('Todos os meses', 'all'));
  months.forEach(month => {
    const [year, monthNumber] = month.split('-').map(Number);
    const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
      .format(createLocalDate(year, monthNumber, 1));
    elements.monthFilter.add(new Option(label.charAt(0).toUpperCase() + label.slice(1), month));
  });
  elements.monthFilter.value = months.includes(selected) ? selected : 'all';
}

function getFilteredTransactions() {
  const month = getSelectedMonth();
  const type = elements.typeFilter.value;
  const query = elements.searchFilter.value.trim().toLocaleLowerCase('pt-BR');
  return transactions
    .filter(item => month === 'all' || getMonthKey(item.date) === month)
    .filter(item => type === 'all' || item.type === type)
    .filter(item => !query || item.description.toLocaleLowerCase('pt-BR').includes(query))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

function createTransactionRow(item) {
  const row = document.createElement('tr');
  const descriptionCell = document.createElement('td');
  const description = document.createElement('span');
  const mark = document.createElement('span');
  description.className = 'transaction-description';
  mark.className = `transaction-mark ${item.type}`;
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = item.type === 'income' ? '↗' : '↘';
  const label = document.createElement('span');
  label.textContent = item.description;
  description.append(mark, label);
  descriptionCell.append(description);

  const categoryCell = document.createElement('td');
  categoryCell.textContent = item.category;
  const dateCell = document.createElement('td');
  dateCell.textContent = formatDate(item.date);
  const typeCell = document.createElement('td');
  const typePill = document.createElement('span');
  typePill.className = `type-pill ${item.type}`;
  typePill.textContent = item.type === 'income' ? '● Receita' : '● Despesa';
  typeCell.append(typePill);
  const amountCell = document.createElement('td');
  amountCell.className = `amount-cell ${item.type}`;
  amountCell.textContent = `${item.type === 'income' ? '+' : '−'} ${formatCurrencyFromCents(item.amountCents)}`;
  const actionCell = document.createElement('td');
  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'delete-button';
  deleteButton.setAttribute('aria-label', `Excluir movimentação: ${item.description}`);
  deleteButton.title = 'Excluir movimentação';
  deleteButton.textContent = '×';
  deleteButton.addEventListener('click', () => deleteTransaction(item.id));
  actionCell.append(deleteButton);
  row.append(descriptionCell, categoryCell, dateCell, typeCell, amountCell, actionCell);
  return row;
}

function renderHistory() {
  const filtered = getFilteredTransactions();
  elements.transactionList.replaceChildren(...filtered.map(createTransactionRow));
  elements.recordCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'registro' : 'registros'}`;
  const noTransactions = transactions.length === 0;
  elements.emptyState.classList.toggle('visible', filtered.length === 0);
  if (filtered.length === 0) {
    elements.emptyTitle.textContent = noTransactions ? 'Nenhuma movimentação por aqui' : 'Nenhum resultado encontrado';
    elements.emptyMessage.textContent = noTransactions
      ? 'Adicione sua primeira receita ou despesa para começar.'
      : 'Tente ajustar os filtros ou a descrição pesquisada.';
    document.querySelector('#empty-add').hidden = !noTransactions;
  }
}

function getChartTransactions() {
  const month = getSelectedMonth();
  return transactions.filter(item => month === 'all' || getMonthKey(item.date) === month);
}

function setCanvasSize(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const context = canvas.getContext('2d');
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { context, width: rect.width, height: rect.height };
}

function drawMonthlyChart() {
  const { context: ctx, width, height } = setCanvasSize(elements.monthlyCanvas);
  ctx.clearRect(0, 0, width, height);
  const selectedMonth = getSelectedMonth();
  let months;
  if (selectedMonth === 'all') {
    const now = new Date();
    months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
  } else {
    const [year, month] = selectedMonth.split('-').map(Number);
    months = [`${year}-${String(month).padStart(2, '0')}`];
  }

  const data = months.map(key => {
    const matching = transactions.filter(item => getMonthKey(item.date) === key);
    return {
      key,
      income: Number(sumCents(matching, 'income')) / 100,
      expense: Number(sumCents(matching, 'expense')) / 100
    };
  });
  if (!data.some(item => item.income > 0 || item.expense > 0)) {
    ctx.fillStyle = '#748093';
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(transactions.length === 0 ? 'Adicione movimentações para visualizar o gráfico' : 'Sem movimentações nos últimos seis meses', width / 2, height / 2);
    return;
  }

  const left = 40;
  const right = 8;
  const top = 14;
  const bottom = 25;
  const plotHeight = height - top - bottom;
  const plotWidth = width - left - right;
  const maxValue = Math.max(1, ...data.flatMap(item => [item.income, item.expense]));
  const step = Math.pow(10, Math.floor(Math.log10(maxValue)));
  const roundedMax = Math.ceil(maxValue / step) * step;
  const tickCount = 3;
  ctx.font = '9px "DM Sans", sans-serif';
  ctx.textAlign = 'right';
  for (let index = 0; index <= tickCount; index += 1) {
    const y = top + plotHeight - (plotHeight * index / tickCount);
    ctx.strokeStyle = '#2c3440';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(width - right, y);
    ctx.stroke();
    ctx.fillStyle = '#788394';
    const value = roundedMax * index / tickCount;
    ctx.fillText(value >= 1000 ? `${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k` : Math.round(value).toString(), left - 7, y + 3);
  }
  const groupWidth = plotWidth / data.length;
  const barWidth = Math.min(20, groupWidth * .25);
  data.forEach((item, index) => {
    const center = left + groupWidth * (index + .5);
    const incomeHeight = item.income / roundedMax * plotHeight;
    const expenseHeight = item.expense / roundedMax * plotHeight;
    if (item.income > 0) {
      ctx.fillStyle = '#5b8cff';
      ctx.beginPath();
      ctx.roundRect(center - barWidth - 2, top + plotHeight - incomeHeight, barWidth, Math.max(incomeHeight, 2), [3, 3, 0, 0]);
      ctx.fill();
    }
    if (item.expense > 0) {
      ctx.fillStyle = '#39cb91';
      ctx.beginPath();
      ctx.roundRect(center + 2, top + plotHeight - expenseHeight, barWidth, Math.max(expenseHeight, 2), [3, 3, 0, 0]);
      ctx.fill();
    }
    const [year, month] = item.key.split('-').map(Number);
    const date = createLocalDate(year, month, 1);
    const label = selectedMonth === 'all' ? monthFormatter.format(date).replace('.', '') : String(year);
    ctx.fillStyle = '#8792a2';
    ctx.font = '9px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, center, height - 7);
  });
}

function drawCategoryChart() {
  const { context: ctx, width, height } = setCanvasSize(elements.categoryCanvas);
  ctx.clearRect(0, 0, width, height);
  const expenses = getChartTransactions().filter(item => item.type === 'expense');
  const totals = new Map();
  expenses.forEach(item => totals.set(item.category, (totals.get(item.category) || 0n) + BigInt(item.amountCents)));
  const categories = [...totals.entries()].sort((a, b) => a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0);
  elements.categoryLegend.replaceChildren();
  if (!categories.length) {
    ctx.fillStyle = '#748093';
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sem despesas neste período', width / 2, height / 2);
    return;
  }

  const total = categories.reduce((sum, [, amount]) => sum + amount, 0n);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * .43;
  let startAngle = -Math.PI / 2;
  categories.forEach(([category, amount], index) => {
    const angle = Number(amount) / Number(total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
    ctx.strokeStyle = CHART_COLORS[index % CHART_COLORS.length];
    ctx.lineWidth = 17;
    ctx.stroke();
    startAngle += angle;

    const item = document.createElement('div');
    item.className = 'category-item';
    const name = document.createElement('span');
    name.className = 'category-name';
    const swatch = document.createElement('span');
    swatch.className = 'category-swatch';
    swatch.style.backgroundColor = CHART_COLORS[index % CHART_COLORS.length];
    swatch.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = category;
    name.append(swatch, label);
    const value = document.createElement('span');
    value.className = 'category-amount';
    value.textContent = formatCurrencyFromCents(amount);
    item.append(name, value);
    elements.categoryLegend.append(item);
  });
  ctx.fillStyle = '#e5eaf1';
  ctx.font = '700 12px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatCurrencyFromCents(total), centerX, centerY);
}

function renderCharts() {
  drawMonthlyChart();
  drawCategoryChart();
}

function render() {
  updateMonthOptions();
  renderSummary();
  renderHistory();
  renderCharts();
}

function openDialog() {
  elements.form.reset();
  elements.date.value = getLocalDateString(new Date());
  elements.formError.textContent = '';
  elements.formError.classList.remove('visible');
  elements.dialog.showModal();
  elements.description.focus();
}

function closeDialog() {
  elements.dialog.close();
}

function deleteTransaction(id) {
  const index = transactions.findIndex(item => item.id === id);
  if (index < 0) return;
  const transaction = transactions[index];
  if (!window.confirm(`Deseja excluir a movimentação "${transaction.description}"?`)) return;
  const [removed] = transactions.splice(index, 1);
  if (!saveTransactions()) {
    transactions.splice(index, 0, removed);
    return;
  }
  render();
  showToast('Movimentação excluída com sucesso.');
}

function handleSubmit(event) {
  event.preventDefault();
  const description = elements.description.value.trim();
  const category = elements.category.value.trim();
  const amountCents = parseAmountToCents(elements.amount.value);
  const date = elements.date.value;
  const type = elements.type.value;

  if (!description || !category || !date || !elements.amount.value) {
    elements.formError.textContent = 'Preencha todos os campos obrigatórios.';
    elements.formError.classList.add('visible');
    return;
  }
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    elements.formError.textContent = 'Informe um valor maior que zero, com no máximo duas casas decimais.';
    elements.formError.classList.add('visible');
    elements.amount.focus();
    return;
  }
  if (!isValidDateString(date)) {
    elements.formError.textContent = 'Informe uma data válida no formato AAAA-MM-DD.';
    elements.formError.classList.add('visible');
    elements.date.focus();
    return;
  }
  if (!elements.form.reportValidity()) {
    elements.formError.textContent = 'Revise os campos destacados antes de salvar.';
    elements.formError.classList.add('visible');
    return;
  }

  const transaction = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    description,
    category,
    amountCents,
    date,
    type
  };
  transactions.push(transaction);
  if (!saveTransactions()) {
    transactions.pop();
    return;
  }
  closeDialog();
  render();
  showToast(`${type === 'income' ? 'Receita' : 'Despesa'} adicionada com sucesso.`);
}

function init() {
  elements.today.textContent = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).format(new Date());

  document.querySelector('#open-form').addEventListener('click', openDialog);
  document.querySelector('#empty-add').addEventListener('click', openDialog);
  document.querySelector('#close-form').addEventListener('click', closeDialog);
  document.querySelector('#cancel-form').addEventListener('click', closeDialog);
  elements.form.addEventListener('submit', handleSubmit);
  elements.monthFilter.addEventListener('change', render);
  elements.typeFilter.addEventListener('change', renderHistory);
  elements.searchFilter.addEventListener('input', renderHistory);
  document.querySelector('#clear-filters').addEventListener('click', () => {
    elements.monthFilter.value = 'all';
    elements.typeFilter.value = 'all';
    elements.searchFilter.value = '';
    render();
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.nav-link').forEach(item => item.classList.remove('active'));
      link.classList.add('active');
    });
  });
  elements.dialog.addEventListener('click', event => {
    if (event.target === elements.dialog) closeDialog();
  });
  elements.dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
    }
  });
  window.addEventListener('resize', renderCharts);
  render();
}

init();
