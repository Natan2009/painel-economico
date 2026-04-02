// ========================
// TEMA (Dark / Light)
// ========================
function alternarTema() {
    const html = document.documentElement;
    const atual = html.getAttribute('data-theme');
    const novo = atual === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', novo);
    document.getElementById('icone-tema').textContent = novo === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('tema', novo);
    atualizarCoresGraficos();
}

function carregarTema() {
    const salvo = localStorage.getItem('tema') || 'light';
    document.documentElement.setAttribute('data-theme', salvo);
    document.getElementById('icone-tema').textContent = salvo === 'dark' ? '☀️' : '🌙';
}

function getCorGrafico() {
    return document.documentElement.getAttribute('data-theme') === 'dark'
        ? { grid: '#2d3143', tick: '#64748b' }
        : { grid: '#f0f2f5', tick: '#9ca3af' };
}

// ========================
// ATUALIZAÇÃO
// ========================
function marcarAtualizacao() {
    const agora = new Date();
    const hora = agora.toLocaleTimeString('pt-br', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('ultima-atualizacao').textContent = `Atualizado às ${hora}`;
}

function animarRefresh(ativo) {
    const btn = document.querySelector('.btn-atualizar');
    if (ativo) btn.classList.add('girando');
    else btn.classList.remove('girando');
}

// ========================
// HELPERS
// ========================
function setBadgeVariacao(id, variacao) {
    const badge = document.getElementById(`badge-${id}`);
    if (!badge) return;
    const v = parseFloat(variacao);
    const sinal = v >= 0 ? '+' : '';
    badge.textContent = `${sinal}${v.toFixed(2)}%`;
    badge.className = 'badge ' + (v >= 0 ? 'badge-alta' : 'badge-baixa');
}

function setValor(id, texto) {
    const el = document.getElementById(id);
    if (el) {
        el.innerHTML = texto;
    }
}

// ========================
// SELIC
// ========================
async function buscarSelic() {
    try {
        const res = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json');
        const dados = await res.json();
        setValor('selic', `${parseFloat(dados[0].valor).toFixed(2)}%`);
    } catch {
        setValor('selic', 'Erro');
    }
}

// ========================
// CDI
// ========================
async function buscarCDI() {
    try {
        const res = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json');
        const dados = await res.json();
        setValor('cdi', `${parseFloat(dados[0].valor).toFixed(2)}%`);
    } catch {
        setValor('cdi', 'Erro');
    }
}

// ========================
// MOEDAS (Dólar, Euro, Bitcoin)
// ========================
async function buscarMoedas() {
    try {
        const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL');
        const dados = await res.json();

        // Dólar
        const dolar = parseFloat(dados.USDBRL.bid);
        const dolarVenda = parseFloat(dados.USDBRL.ask);
        const dolarVar = parseFloat(dados.USDBRL.pctChange);
        setValor('dolar', `R$ ${dolar.toFixed(2)}`);
        setBadgeVariacao('dolar', dolarVar);
        document.getElementById('label-dolar').textContent =
            `Venda: R$ ${dolarVenda.toFixed(2)} · BRL`;

        // Euro
        const euro = parseFloat(dados.EURBRL.bid);
        const euroVenda = parseFloat(dados.EURBRL.ask);
        const euroVar = parseFloat(dados.EURBRL.pctChange);
        setValor('euro', `R$ ${euro.toFixed(2)}`);
        setBadgeVariacao('euro', euroVar);
        document.getElementById('label-euro').textContent =
            `Venda: R$ ${euroVenda.toFixed(2)} · BRL`;

        // Bitcoin
        const btc = parseFloat(dados.BTCBRL.bid);
        const btcVar = parseFloat(dados.BTCBRL.pctChange);
        setValor('bitcoin', `R$ ${btc.toLocaleString('pt-br', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);
        setBadgeVariacao('bitcoin', btcVar);

        // Tabela
        preencherTabela([
            { nome: '🇺🇸 Dólar', compra: dolar, venda: dolarVenda, variacao: dolarVar },
            { nome: '🇪🇺 Euro', compra: euro, venda: euroVenda, variacao: euroVar },
            { nome: '₿ Bitcoin', compra: btc, venda: parseFloat(dados.BTCBRL.ask), variacao: btcVar },
        ]);

    } catch {
        ['dolar', 'euro', 'bitcoin'].forEach(id => setValor(id, 'Erro'));
    }
}

// ========================
// IPCA
// ========================
async function buscarIPCA() {
    try {
        const res = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json');
        const dados = await res.json();
        setValor('ipca', `${parseFloat(dados[0].valor).toFixed(2)}%`);
    } catch {
        setValor('ipca', 'Erro');
    }
}

// ========================
// TABELA DE MOEDAS
// ========================
function preencherTabela(moedas) {
    const tbody = document.getElementById('tabela-moedas');
    tbody.innerHTML = moedas.map(m => {
        const v = parseFloat(m.variacao);
        const sinal = v >= 0 ? '+' : '';
        const cls = v >= 0 ? 'variacao-alta' : 'variacao-baixa';
        const statusCls = v > 0 ? 'status-alta' : v < 0 ? 'status-baixa' : 'status-neutro';
        const statusTxt = v > 0 ? '▲ Alta' : v < 0 ? '▼ Baixa' : '● Estável';
        const isBtc = m.nome.includes('Bitcoin');
        const fmt = (val) => isBtc
            ? `R$ ${val.toLocaleString('pt-br', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            : `R$ ${val.toFixed(2)}`;
        return `
            <tr>
                <td><strong>${m.nome}</strong></td>
                <td>${fmt(m.compra)}</td>
                <td>${fmt(m.venda)}</td>
                <td class="${cls}">${sinal}${v.toFixed(2)}%</td>
                <td><span class="status-pill ${statusCls}">${statusTxt}</span></td>
            </tr>
        `;
    }).join('');
}

// ========================
// GRÁFICOS
// ========================
let chartDolar = null;
let chartEuro = null;
let chartIPCA = null;

function opcoesGrafico(cor, tipo = 'line') {
    const cores = getCorGrafico();
    return {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1a1d27' : '#fff',
                titleColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#f1f5f9' : '#1a1a2e',
                bodyColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#6b7280',
                borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#2d3143' : '#e5e7eb',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: cores.tick, font: { size: 11 }, maxRotation: 0 }
            },
            y: {
                grid: { color: cores.grid, drawBorder: false },
                ticks: { color: cores.tick, font: { size: 11 } }
            }
        }
    };
}

async function graficoDolar() {
    try {
        const res = await fetch('https://economia.awesomeapi.com.br/json/daily/USD-BRL/30');
        const dados = await res.json();
        const reversed = [...dados].reverse();

        const labels = reversed.map(d => {
            const dt = new Date(d.timestamp * 1000);
            return dt.toLocaleDateString('pt-br', { day: '2-digit', month: '2-digit' });
        });
        const valores = reversed.map(d => parseFloat(d.bid).toFixed(2));

        const min = Math.min(...valores);
        const max = Math.max(...valores);
        document.getElementById('info-dolar').textContent =
            `Mín: R$ ${parseFloat(min).toFixed(2)} · Máx: R$ ${parseFloat(max).toFixed(2)}`;

        if (chartDolar) chartDolar.destroy();
        chartDolar = new Chart(document.getElementById('graficoDolar'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Dólar (R$)',
                    data: valores,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37,99,235,0.07)',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: opcoesGrafico('#2563eb')
        });
    } catch {
        console.warn('Erro gráfico dólar');
    }
}

async function graficoEuro() {
    try {
        const res = await fetch('https://economia.awesomeapi.com.br/json/daily/EUR-BRL/30');
        const dados = await res.json();
        const reversed = [...dados].reverse();

        const labels = reversed.map(d => {
            const dt = new Date(d.timestamp * 1000);
            return dt.toLocaleDateString('pt-br', { day: '2-digit', month: '2-digit' });
        });
        const valores = reversed.map(d => parseFloat(d.bid).toFixed(2));

        const min = Math.min(...valores);
        const max = Math.max(...valores);
        document.getElementById('info-euro').textContent =
            `Mín: R$ ${parseFloat(min).toFixed(2)} · Máx: R$ ${parseFloat(max).toFixed(2)}`;

        if (chartEuro) chartEuro.destroy();
        chartEuro = new Chart(document.getElementById('graficoEuro'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Euro (R$)',
                    data: valores,
                    borderColor: '#4a90d9',
                    backgroundColor: 'rgba(74,144,217,0.07)',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: opcoesGrafico('#4a90d9')
        });
    } catch {
        console.warn('Erro gráfico euro');
    }
}

async function graficoIPCA() {
    try {
        const res = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/12?formato=json');
        const dados = await res.json();

        const labels = dados.map(d => d.data.substring(3)); // MM/AAAA
        const valores = dados.map(d => parseFloat(d.valor));

        const cores = valores.map(v => v >= 0 ? 'rgba(37,99,235,0.75)' : 'rgba(239,68,68,0.75)');
        const coresBorda = valores.map(v => v >= 0 ? '#2563eb' : '#ef4444');

        if (chartIPCA) chartIPCA.destroy();
        chartIPCA = new Chart(document.getElementById('graficoIPCA'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'IPCA (%)',
                    data: valores,
                    backgroundColor: cores,
                    borderColor: coresBorda,
                    borderWidth: 1.5,
                    borderRadius: 6,
                }]
            },
            options: opcoesGrafico('#2563eb', 'bar')
        });
    } catch {
        console.warn('Erro gráfico IPCA');
    }
}

function atualizarCoresGraficos() {
    // Re-renderiza os gráficos para aplicar as cores corretas do tema
    graficoDolar();
    graficoEuro();
    graficoIPCA();
}

// ========================
// ATUALIZAR TUDO
// ========================
async function atualizarTudo() {
    animarRefresh(true);

    // Skeleton nos valores
    ['selic', 'cdi', 'dolar', 'euro', 'ipca', 'bitcoin'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<span class="skeleton"></span>';
    });

    await Promise.all([
        buscarSelic(),
        buscarCDI(),
        buscarMoedas(),
        buscarIPCA(),
        graficoDolar(),
        graficoEuro(),
        graficoIPCA(),
    ]);

    animarRefresh(false);
    marcarAtualizacao();
}

// ========================
// INIT
// ========================
carregarTema();
atualizarTudo();

// Auto-atualiza a cada 5 minutos
setInterval(atualizarTudo, 5 * 60 * 1000);
