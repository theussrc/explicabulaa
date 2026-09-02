// Estado global da aplicação
let appData = {
    categorias: [],
    sintomas: [],
    medicamentos: []
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initCurrentPage();
});

// Carrega os dados do JSON com suporte a fallback síncrono (window.DB_DATA) e múltiplos caminhos
async function loadData() {
    if (window.DB_DATA && window.DB_DATA.medicamentos && window.DB_DATA.medicamentos.length > 0) {
        appData = window.DB_DATA;
        return;
    }

    const paths = ['/db.json', 'db.json', '/data/db.json', 'data/db.json'];
    for (const path of paths) {
        try {
            const response = await fetch(path);
            if (response.ok) {
                appData = await response.json();
                if (appData.medicamentos && appData.medicamentos.length > 0) return;
            }
        } catch (e) {
            // Tenta o próximo caminho silenciosamente
        }
    }
    console.error('Não foi possível carregar o banco de dados.');
}

// Verifica qual página está aberta e roda o código específico
function initCurrentPage() {
    const path = window.location.pathname;
    
    if (path.includes('medicamentos')) {
        initMedicamentos();
    } else if (path.includes('sintomas')) {
        initSintomas();
    } else if (path.includes('bula')) {
        initBula();
    } else {
        initHome();
    }

    // Configura a busca global se o botão existir
    const btnSearch = document.getElementById('btnSearch');
    const searchInput = document.getElementById('searchInput');
    if (btnSearch && searchInput) {
        btnSearch.addEventListener('click', () => handleSearch(searchInput.value));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch(searchInput.value);
        });
    }
}

function handleSearch(query) {
    if(!query) return;
    // Simplificando a busca: redireciona para a página de medicamentos passando o termo na URL
    window.location.href = `medicamentos?q=${encodeURIComponent(query)}`;
}

// Inicializa a Home (index.html)
function initHome() {
    const medicinesContainer = document.getElementById('featuredMedicines');
    const symptomsContainer = document.getElementById('featuredSymptoms');
    const categoriesContainer = document.getElementById('featuredCategories');
    
    if (categoriesContainer && appData.categorias) {
        categoriesContainer.innerHTML = appData.categorias.map(cat => `
            <a href="medicamentos?q=${encodeURIComponent(cat.nome.split(' ')[0])}" class="category-card">
                <span>${cat.nome}</span>
                <span style="color: var(--primary);">&rarr;</span>
            </a>
        `).join('');
    }

    if (medicinesContainer && appData.medicamentos) {
        medicinesContainer.innerHTML = appData.medicamentos.slice(0, 6).map(med => createMedicineCard(med)).join('');
    }
    
    if (symptomsContainer && appData.sintomas) {
        symptomsContainer.innerHTML = appData.sintomas.slice(0, 8).map(sintoma => `
            <a href="sintomas?id=${sintoma.id}" style="background: white; padding: 10px 20px; border-radius: 30px; font-weight: 500; border: 1px solid var(--border); box-shadow: var(--shadow-sm); font-size: 14px;">${sintoma.nome}</a>
        `).join('');
    }
}

// Cria o HTML de um card de medicamento
function createMedicineCard(med) {
    const categoriaObj = appData.categorias.find(c => c.id === med.categoria);
    const categoria = categoriaObj ? categoriaObj.nome : 'Medicamento';
    return `
        <a href="bula?id=${med.id}" class="card">
            <span class="card-tag">${categoria.split(' ')[0]}</span>
            <h3>${med.nome}</h3>
            <p>${med.introducao.substring(0, 100)}...</p>
            <div class="card-btn">Ver bula simplificada &rarr;</div>
        </a>
    `;
}

// Lógica de medicamentos.html
function initMedicamentos() {
    const listContainer = document.getElementById('medicamentosList');
    const filterInput = document.getElementById('filterInput');
    
    // Recuperar termo de busca da URL se houver
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    
    if (searchQuery && filterInput) {
        filterInput.value = searchQuery;
    }
    
    function renderList(filterText = '') {
        if (!listContainer) return;
        if (!appData.medicamentos || appData.medicamentos.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Carregando medicamentos...</p>';
            return;
        }
        
        const text = filterText.toLowerCase();
        const filtered = appData.medicamentos.filter(med => {
            const cat = appData.categorias.find(c => c.id === med.categoria)?.nome || '';
            return med.nome.toLowerCase().includes(text) || cat.toLowerCase().includes(text) || med.introducao.toLowerCase().includes(text);
        });
        
        if (filtered.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Nenhum medicamento encontrado para essa busca.</p>';
            return;
        }
        
        listContainer.innerHTML = `
            <div class="grid-cards">
                ${filtered.map(med => createMedicineCard(med)).join('')}
            </div>
        `;
    }
    
    // Renderiza inicialmente
    renderList(searchQuery || '');
    
    // Adiciona evento ao input
    if (filterInput) {
        filterInput.addEventListener('input', (e) => renderList(e.target.value));
    }
}

// Lógica de sintomas.html
function initSintomas() {
    const listContainer = document.getElementById('sintomasList');
    const resultContainer = document.getElementById('sintomaResult');
    
    // Recuperar sintoma selecionado da URL
    const urlParams = new URLSearchParams(window.location.search);
    let idSintoma = urlParams.get('id');
    
    if (!listContainer || !appData.sintomas || appData.sintomas.length === 0) return;

    // Se nenhum sintoma foi selecionado via URL, seleciona automaticamente o PRIMEIRO sintoma para a página NUNCA ficar vazia!
    if (!idSintoma && appData.sintomas.length > 0) {
        idSintoma = appData.sintomas[0].id;
    }
    
    function renderSintomasList() {
        listContainer.innerHTML = appData.sintomas.map(sintoma => `
            <li>
                <a href="sintomas?id=${sintoma.id}" onclick="selectSintoma('${sintoma.id}', event)" 
                   style="display: block; padding: 12px 16px; border-radius: 8px; background: ${sintoma.id === idSintoma ? 'var(--primary)' : 'white'}; color: ${sintoma.id === idSintoma ? 'white' : 'var(--text-main)'}; box-shadow: var(--shadow-sm); border: 1px solid var(--border); font-weight: ${sintoma.id === idSintoma ? '600' : 'normal'};">
                   ${sintoma.nome}
                </a>
            </li>
        `).join('');
    }
    
    // Tornar função global para o onclick
    window.selectSintoma = (id, event) => {
        if(event) event.preventDefault();
        
        idSintoma = id;
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('id', id);
        window.history.pushState({}, '', newUrl);
        
        renderSintomasList();
        showMedicamentosDoSintoma(id);
    };
    
    function showMedicamentosDoSintoma(id) {
        const sintoma = appData.sintomas.find(s => s.id === id);
        if(!sintoma || !resultContainer) return;
        
        const meds = appData.medicamentos.filter(m => sintoma.medicamentos.includes(m.id));
        
        resultContainer.innerHTML = `
            <h2 style="margin-bottom: 8px;">Medicamentos indicados para: <span style="color: var(--primary);">${sintoma.nome}</span></h2>
            <p style="color: var(--text-muted); margin-bottom: 24px;">Confira as bulas simplificadas para tratar os sintomas de ${sintoma.nome.toLowerCase()}:</p>
            <div class="grid-cards">
                ${meds.length > 0 ? meds.map(med => createMedicineCard(med)).join('') : '<p>Nenhum medicamento cadastrado para este sintoma no momento.</p>'}
            </div>
        `;
    }
    
    renderSintomasList();
    if(idSintoma) {
        showMedicamentosDoSintoma(idSintoma);
    }
}

function initBula() {
    const content = document.getElementById('bulaContent');
    const sidebar = document.getElementById('sintomasRelacionados');
    
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if(!id || !appData.medicamentos || !content) {
        if(content) content.innerHTML = '<p>Medicamento não encontrado.</p>';
        return;
    }
    
    const med = appData.medicamentos.find(m => m.id === id);
    if(!med) {
        content.innerHTML = '<p>Medicamento não encontrado.</p>';
        return;
    }
    
    document.title = `${med.nome} - Explica a Bula`;
    
    // Dicionário para tooltips
    const dicionarioTermos = {
        'Hepatotóxico': 'Que pode causar danos ao fígado.',
        'Analgésico': 'Que alivia ou reduz a dor.',
        'Antitérmico': 'Que ajuda a baixar a febre.',
        'Agranulocitose': 'Queda perigosa das células de defesa do sangue.',
        'Hipersensibilidade': 'Alergia grave.',
        'Anti-inflamatório': 'Que combate inflamações no corpo.',
        'Antiespasmódico': 'Que alivia cólicas e espasmos.',
        'Gastroesofágico': 'Relativo ao estômago e esôfago.'
    };

    function renderTooltips(text) {
        if (!text) return text;
        let result = text;
        Object.keys(dicionarioTermos).forEach(termo => {
            const regex = new RegExp(`\\b(${termo})\\b`, 'gi');
            result = result.replace(regex, `<span class="tooltip-term" data-tooltip="${dicionarioTermos[termo]}">$1</span>`);
        });
        return result;
    }

    function renderCalcGotas(med) {
        const textToCheck = med.como_tomar.toLowerCase() + JSON.stringify(med.tabela_dosagem).toLowerCase();
        if(textToCheck.includes('gota')) {
            return `
                <div class="calc-container">
                    <h4><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path></svg> Calculadora Pediátrica Estimada</h4>
                    <p style="font-size: 14px; margin-bottom: 12px; color: #166534;">Insira o peso da criança para estimar a dosagem (Regra geral de 1 gota por kg para analgésicos comuns). <strong>Sempre confirme com a bula original ou o pediatra.</strong></p>
                    <div class="calc-form">
                        <input type="number" id="calcPeso" placeholder="Peso (kg)" min="1" max="50">
                        <button onclick="calcularGotas()">Calcular</button>
                    </div>
                    <div class="calc-result" id="calcResult"></div>
                </div>
            `;
        }
        return '';
    }

    // Tornar calcularGotas global
    window.calcularGotas = function() {
        const peso = document.getElementById('calcPeso').value;
        const result = document.getElementById('calcResult');
        if(peso && peso > 0) {
            result.innerText = `Dose estimada: ${Math.round(peso)} gota(s) por dose.`;
        } else {
            result.innerText = 'Por favor, insira um peso válido.';
        }
    };

    // Renderiza a Bula
    content.innerHTML = `
        <h1>${med.nome}: para que serve, como tomar e efeitos colaterais</h1>
        
        <p class="intro">${renderTooltips(med.introducao)}</p>
        
        <div class="adsense-inline adsense-block">
            <!-- Bloco AdSense: Meio do Texto 1 -->
        </div>
        
        <h2>Para que serve o ${med.nome.split(' ')[0]}?</h2>
        <ul>
            ${med.indicacoes.map(ind => `<li>${renderTooltips(ind)}</li>`).join('')}
        </ul>
        
        <h2>Como tomar e Dosagem</h2>
        <p>${renderTooltips(med.como_tomar)}</p>
        
        ${renderCalcGotas(med)}
        
        <table>
            <thead>
                <tr>
                    <th>Faixa Etária</th>
                    <th>Dosagem Média</th>
                </tr>
            </thead>
            <tbody>
                ${med.tabela_dosagem.map(linha => `
                    <tr>
                        <td><strong>${linha.faixa}</strong></td>
                        <td>${linha.dosagem}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="alert">
            <h3>Importante</h3>
            <p>Siga sempre a recomendação do seu médico ou as instruções da bula original. Não ultrapasse a dose máxima diária.</p>
        </div>
        
        <div class="adsense-inline adsense-block">
            <!-- Bloco AdSense: Meio do Texto 2 -->
        </div>
        
        <h2>Principais efeitos colaterais</h2>
        <p><strong>Efeitos comuns:</strong></p>
        <ul>
            ${med.efeitos_comuns.map(ef => `<li>${renderTooltips(ef)}</li>`).join('')}
        </ul>
        
        <p style="margin-top: 16px;"><strong style="color: var(--danger);">Efeitos graves/raros (Pare de tomar e busque um médico imediatamente):</strong></p>
        <ul>
            ${med.efeitos_graves.map(ef => `<li>${renderTooltips(ef)}</li>`).join('')}
        </ul>
        
        <h2>Quem não deve tomar? (Contraindicações)</h2>
        <ul>
            ${med.contraindicacoes.map(ct => `<li>${renderTooltips(ct)}</li>`).join('')}
        </ul>
        
        ${med.interacoes ? `<p style="margin-top: 16px;"><strong>Atenção com interações:</strong> ${renderTooltips(med.interacoes)}</p>` : ''}
        
        <h2>Perguntas Frequentes</h2>
        <div class="faq-list">
            ${med.faq.map(f => `
                <div class="faq-item">
                    <h4>${f.pergunta}</h4>
                    <p>${renderTooltips(f.resposta)}</p>
                </div>
            `).join('')}
        </div>
    `;
    
    // Renderiza Sintomas Relacionados na Sidebar
    if(sidebar) {
        const sintomasDesseMed = appData.sintomas.filter(s => s.medicamentos.includes(med.id));
        
        if(sintomasDesseMed.length > 0) {
            sidebar.innerHTML = sintomasDesseMed.map(s => `
                <li>
                    <a href="sintomas?id=${s.id}" style="background: #f1f5f9; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                        ${s.nome}
                    </a>
                </li>
            `).join('');
        } else {
            sidebar.innerHTML = '<li>Nenhum sintoma cadastrado</li>';
        }
    }

    // Inicializa Retenção: Table of Contents
    const tocList = document.getElementById('tocList');
    const tocContainer = document.getElementById('tableOfContents');
    const headers = content.querySelectorAll('h2');
    if(headers.length > 0 && tocList && tocContainer) {
        let tocHTML = '';
        headers.forEach((header, index) => {
            const id = 'section-' + index;
            header.id = id;
            tocHTML += `<li><a href="#${id}">${header.innerText}</a></li>`;
        });
        tocList.innerHTML = tocHTML;
        tocContainer.style.display = 'block';
    }

    // Inicializa Retenção: WhatsApp Share
    const btnWhatsApp = document.getElementById('whatsappShareBtn');
    if(btnWhatsApp) {
        const url = encodeURIComponent(window.location.href);
        const textToShare = encodeURIComponent(`Veja essa bula simplificada e fácil de entender do ${med.nome}: `);
        btnWhatsApp.href = `https://wa.me/?text=${textToShare}${url}`;
    }

    // Inicializa Retenção: Veja Também (Relacionados)
    const relatedContainer = document.getElementById('relatedMedicinesContainer');
    const relatedGrid = document.getElementById('relatedMedicinesGrid');
    if(relatedContainer && relatedGrid) {
        const related = appData.medicamentos.filter(m => m.categoria === med.categoria && m.id !== med.id).slice(0, 3);
        if(related.length > 0) {
            relatedGrid.innerHTML = related.map(m => createMedicineCard(m)).join('');
            relatedContainer.style.display = 'block';
        }
    }
}
