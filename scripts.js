const CONFIG_PAIS = { code: "PAIS2026" };

const BANCO_CONVITES = {
    "123": { destaque: "Valéria", membros: ["Valéria", "Caio", "Fernanda"] },
    "456": { destaque: "Ricardo", membros: ["Ricardo", "Beatriz", "Léo"] },
    "789": { destaque: "Ana", membros: ["Vovó Ana"] }
};

let state = {
    userLogado: null,
    isAdmin: false,
    votos: { Theo: 25, Aurora: 30 },
    logsAcesso: {}, 
    confirmacoes: {},
    presentes: [
        { id: 1, nome: "Kit de Fraldas RN", categoria: "Higiene" },
        { id: 2, nome: "Banheira Ergonômica", categoria: "Banho" },
        { id: 3, nome: "Manta de Algodão", categoria: "Quarto" },
        { id: 4, nome: "Termômetro Digital", categoria: "Saúde" }
    ]
};

function handleLogin() {
    const code = document.getElementById('inviteCodeInput').value.trim().toUpperCase();
    if (code === CONFIG_PAIS.code) {
        state.isAdmin = true;
        state.userLogado = { destaque: "Pais", codigo: code };
        localStorage.setItem('chaRole', 'admin');
        liberarSite();
    } else if (BANCO_CONVITES[code]) {
        state.userLogado = { ...BANCO_CONVITES[code], codigo: code };
        localStorage.setItem('chaCode', code);
        localStorage.setItem('chaRole', 'guest');
        if (!state.logsAcesso[code]) state.logsAcesso[code] = new Date().toLocaleString();
        liberarSite();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

function liberarSite() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    
    const welcome = document.getElementById('welcomeText');
    if (state.isAdmin) {
        document.getElementById('nav-admin').style.display = 'block';
        welcome.innerText = "Bem-vindos, Papais!";
        refreshAdminData();
    } else {
        // Saudação personalizada conforme solicitado
        welcome.innerText = `Olá, ${state.userLogado.destaque} e Família!`;
        renderFamilyList();
    }
    renderGifts();
}

function showTab(tabId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        if(link.getAttribute('onclick')?.includes(tabId)) link.classList.add('active');
    });

    if(tabId === 'votacao') setTimeout(initChart, 100);
    if(tabId === 'admin') refreshAdminData();
}

let chartInstance = null;
function initChart() {
    const ctx = document.getElementById('voteChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Theo', 'Aurora'],
            datasets: [{ data: [state.votos.Theo, state.votos.Aurora], backgroundColor: ['#A2D2DF', '#B19CD9'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } }, cutout: '70%' }
    });
}

function renderFamilyList() {
    const container = document.getElementById('familyListContainer');
    if(!container) return;
    container.innerHTML = state.userLogado.membros.map(nome => `
        <label class="member-item"><span>${nome}</span><input type="checkbox" name="membroFamilia" value="${nome}"></label>
    `).join('');
}

function handleRSVP(event) {
    event.preventDefault();
    const selecionados = Array.from(document.querySelectorAll('input[name="membroFamilia"]:checked')).map(cb => cb.value);
    if (selecionados.length === 0) return alert("Selecione alguém.");
    state.confirmacoes[state.userLogado.codigo] = {
        quemVem: selecionados.join(", "),
        obs: document.getElementById('guestRestriction').value,
        data: new Date().toLocaleString()
    };
    alert("Presença confirmada!");
    showTab('inicio');
}

function renderGifts() {
    const container = document.getElementById('giftListContainer');
    if(!container) return;
    container.innerHTML = state.presentes.map(i => `
        <div class="gift-item"><h3>${i.nome}</h3><p>${i.categoria}</p></div>
    `).join('');
}

function refreshAdminData() {
    const tbody = document.getElementById('adminTableBody');
    if(!tbody) return;
    tbody.innerHTML = "";
    document.getElementById('statTheo').innerText = state.votos.Theo;
    document.getElementById('statAurora').innerText = state.votos.Aurora;
    Object.keys(BANCO_CONVITES).forEach(code => {
        const convidado = BANCO_CONVITES[code];
        const log = state.logsAcesso[code] || "Nunca acessou";
        const conf = state.confirmacoes[code];
        tbody.innerHTML += `<tr><td><strong>${convidado.destaque}</strong><br><small>${code}</small></td><td>${log}</td><td>${conf ? 'Confirmado' : 'Pendente'}</td><td>${conf ? conf.quemVem : '-'}</td><td>${conf ? conf.obs : '-'}</td></tr>`;
    });
}

function exportToCSV() {
    let csv = "\uFEFFFamilia;Acesso;Status;QuemVem;Obs\n";
    Object.keys(BANCO_CONVITES).forEach(code => {
        const c = BANCO_CONVITES[code];
        const log = state.logsAcesso[code] || "N/A";
        const conf = state.confirmacoes[code] || { quemVem: "N/A", obs: "N/A" };
        csv += `${c.destaque};${log};${state.confirmacoes[code] ? 'Confirmado' : 'Pendente'};${conf.quemVem};${conf.obs}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "relatorio_pais.csv");
    link.click();
}

function registerVote(name) {
    state.votos[name]++;
    initChart();
    alert("Palpite registrado!");
}

function logout() { localStorage.clear(); window.location.reload(); }

window.onload = () => {
    const role = localStorage.getItem('chaRole');
    if (role === 'admin') { state.isAdmin = true; liberarSite(); }
    else {
        const code = localStorage.getItem('chaCode');
        if (code && BANCO_CONVITES[code]) {
            state.userLogado = { ...BANCO_CONVITES[code], codigo: code };
            liberarSite();
        }
    }
};