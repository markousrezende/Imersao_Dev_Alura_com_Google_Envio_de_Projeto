const catalogo = {
    // 1. Otimização: Armazena todos os seletores de elementos em um único objeto.
    elements: {
        cardsContainer: document.getElementById("filmes-container"),
        campoBusca: document.getElementById("campo-busca"),
        botaoBusca: document.getElementById("botao-busca"),
        botaoLimpar: document.getElementById("botao-limpar"),
        loader: document.querySelector(".loader"),
        sortDropdownBtn: document.getElementById('sort-dropdown-btn'),
        sortOptions: document.getElementById('sort-options'),
        categoryDropdownBtn: document.getElementById('category-dropdown-btn'), // O seletor do pai estava causando o erro
        categoryOptions: document.getElementById('category-options'),
    },
    // Armazena os dados dos filmes
    dados: [],
    dadosAtuais: [],
    // 3. Melhoria: Armazena o estado atual da ordenação para reaplicá-lo.
    ordenacaoAtual: {
        tipo: 'padrao', // 'padrao', 'avaliacao-desc', etc.
        texto: 'Padrão'
    },

    // Função principal que inicializa o catálogo
    init() {
        // Valida elementos essenciais
        const { cardsContainer, campoBusca, botaoBusca, botaoLimpar } = this.elements;
        if (!cardsContainer || !campoBusca || !botaoBusca || !botaoLimpar) {
            console.error('Elementos essenciais não encontrados no DOM. Verifique o HTML.');
            return;
        }

        this.vincularEventos();
        this.carregarDados();
    },

    // 2. Boas Práticas: Centraliza todos os "escutadores de evento" em um único método.
    vincularEventos() {
        this.elements.botaoBusca.addEventListener('click', () => this.iniciarBusca());
        this.elements.botaoLimpar.addEventListener('click', () => this.limparBusca());
        this.elements.campoBusca.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                this.iniciarBusca();
            }
        });

        this.elements.sortDropdownBtn.addEventListener('click', () => {
            // A classe 'hidden' não é mais usada para controlar a visibilidade do dropdown animado
            this.elements.sortDropdownBtn.classList.toggle('open');
            this.elements.sortDropdownBtn.setAttribute('aria-expanded', this.elements.sortDropdownBtn.classList.contains('open'));
        });

        this.elements.sortOptions.addEventListener('click', (event) => {
            const target = event.target;
            if (target.tagName === 'LI') {
                // Lógica para marcar item ativo
                this.elements.sortOptions.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                target.classList.add('active');

                this.definirOrdenacao(target.dataset.sort, target.textContent);
            }
        });

        this.elements.categoryDropdownBtn.addEventListener('click', () => {
            this.elements.categoryDropdownBtn.classList.toggle('open');
            this.elements.categoryDropdownBtn.setAttribute('aria-expanded', this.elements.categoryDropdownBtn.classList.contains('open'));
        });

        this.elements.categoryOptions.addEventListener('click', (event) => {
            const target = event.target;
            if (target.tagName === 'LI') {
                // Lógica para marcar item ativo
                this.elements.categoryOptions.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                target.classList.add('active');

                this.filtrarPorCategoria(target.dataset.category || target.textContent);
                const span = this.elements.categoryDropdownBtn.querySelector('span');
                if (span) span.textContent = target.textContent;
                
                this.elements.categoryDropdownBtn.classList.remove('open');
                this.elements.categoryDropdownBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Fecha o dropdown se clicar fora dele
        window.addEventListener('click', (event) => {
            const sortEl = document.querySelector('.sort-dropdown');
            const catEl = document.querySelector('.category-dropdown');
            const isClickInsideSort = sortEl ? sortEl.contains(event.target) : false;
            const isClickInsideCategory = catEl ? catEl.contains(event.target) : false;

            if (!isClickInsideSort) {
                if (this.elements.sortDropdownBtn) this.elements.sortDropdownBtn.classList.remove('open');
                if (this.elements.sortDropdownBtn) this.elements.sortDropdownBtn.setAttribute('aria-expanded', 'false');
            }
            if (!isClickInsideCategory) {
                if (this.elements.categoryDropdownBtn) this.elements.categoryDropdownBtn.classList.remove('open');
                if (this.elements.categoryDropdownBtn) this.elements.categoryDropdownBtn.setAttribute('aria-expanded', 'false');
            }
        });
    },

    iniciarBusca() {
        // Verificação de segurança para garantir que os elementos do filtro existem
        if (!this.elements.categoryDropdownBtn) {
            console.warn("O botão de categoria ainda não foi inicializado.");
            return;
        }

        this.elements.loader.classList.remove('hidden');
        const termoBusca = (this.elements.campoBusca.value || '').toLowerCase();
        // Determina categoria atual (com fallback para 'Todos')
        let categoriaAtual = 'Todos';
        const catSpan = this.elements.categoryDropdownBtn && this.elements.categoryDropdownBtn.querySelector('span');
        if (catSpan && catSpan.textContent) categoriaAtual = catSpan.textContent.trim();

        // A busca é feita sobre o conjunto completo de dados, aplicando filtro de categoria e termo
        this.dadosAtuais = this.dados.filter(filme => {
            const correspondeCategoria = (categoriaAtual === 'Todos' || !categoriaAtual || (filme.categoria && filme.categoria.trim() === categoriaAtual));
            const correspondeBusca = !termoBusca || (filme.titulo && filme.titulo.toLowerCase().includes(termoBusca));
            return correspondeCategoria && correspondeBusca;
        });

        this.elements.botaoLimpar.classList.remove('hidden'); // Mostra o botão de limpar
        this.atualizarVisualizacao();
    },

    limparBusca() {
        this.elements.campoBusca.value = '';
        this.dadosAtuais = this.dados;
        this.elements.botaoLimpar.classList.add('hidden'); // Esconde o botão de limpar
        this.ordenacaoAtual = { tipo: 'padrao', texto: 'Padrão' }; // Reseta a ordenação
        this.elements.sortDropdownBtn.querySelector('span').textContent = this.ordenacaoAtual.texto;
        // Marca a opção 'Padrão' como ativa
        this.elements.sortOptions.querySelectorAll('li').forEach(li => li.classList.remove('active'));
        this.elements.sortOptions.querySelector('li[data-sort="padrao"]').classList.add('active');
        this.resetarFiltroCategoria();
        this.atualizarVisualizacao();
    },

    definirOrdenacao(tipo, texto) {
        this.ordenacaoAtual = { tipo, texto };
        this.elements.sortDropdownBtn.querySelector('span').textContent = texto;
        this.elements.sortDropdownBtn.classList.remove('open');
        this.atualizarVisualizacao();
    },

    // 4. Refatoração: Centraliza a lógica de ordenação e renderização.
    atualizarVisualizacao() {
        let dadosParaRenderizar = [...this.dadosAtuais];

        switch (this.ordenacaoAtual.tipo) {
            case 'avaliacao-desc':
                dadosParaRenderizar.sort((a, b) => b.avaliacao - a.avaliacao);
                break;
            case 'avaliacao-asc':
                dadosParaRenderizar.sort((a, b) => a.avaliacao - b.avaliacao);
                break;
            case 'ano-desc':
                dadosParaRenderizar.sort((a, b) => b.ano - a.ano);
                break;
            case 'ano-asc':
                dadosParaRenderizar.sort((a, b) => a.ano - b.ano);
                break;
            case 'alfa':
                dadosParaRenderizar.sort((a, b) => a.titulo.localeCompare(b.titulo));
                break;
        }
        this.renderizarCards(dadosParaRenderizar);
    },

    // Funções auxiliares para o loader
    mostrarLoader() {
        this.elements.loader.classList.remove('hidden');
    },

    esconderLoader() {
        this.elements.loader.classList.add('hidden');
    },

    async carregarDados() {
        this.mostrarLoader();
        try {
            const response = await fetch('data.json'); 
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const dados = await response.json();
            this.dados = dados;
            this.dadosAtuais = dados;
            this.criarBotoesCategoria();
            this.atualizarVisualizacao();
        } catch (error) {
            console.error("Erro ao carregar os dados do JSON:", error);
            // Fallback: tenta usar o JSON embutido em `index.html` (útil quando aberto via file:// sem servidor)
            const inline = document.getElementById('data-json');
            if (inline) {
                try {
                    const fallbackDados = JSON.parse(inline.textContent);
                    this.dados = fallbackDados;
                    this.dadosAtuais = fallbackDados;
                    this.criarBotoesCategoria();
                    this.atualizarVisualizacao();
                } catch (e) {
                    console.error('Fallback JSON inválido:', e);
                    this.elements.cardsContainer.innerHTML = '<p class="empty-message">Não foi possível carregar os filmes. Tente novamente mais tarde.</p>';
                }
            } else {
                this.elements.cardsContainer.innerHTML = '<p class="empty-message">Não foi possível carregar os filmes. Tente novamente mais tarde.</p>';
            }
        } finally {
            this.esconderLoader();
        }
    },

    renderizarCards(cards) {
        this.elements.cardsContainer.innerHTML = "";
        if (cards.length === 0) {
            this.elements.cardsContainer.innerHTML = `<p class="empty-message">Nenhum filme encontrado.</p>`;
            return;
        }
        for (let card of cards) {
            // Segurança: normaliza campos
            card = Object.assign({ titulo: '', ano: 0, diretor: '', descricao: '', avaliacao: 0, poster: '', link: '#' }, card || {});
            const cardElement = document.createElement("a"); // Corrigido de 'div' para 'a'
            cardElement.href = card.link;
            cardElement.target = "_blank";
            cardElement.classList.add("card");

            const cardImage = document.createElement("img");
            cardImage.src = card.poster;
            cardImage.alt = `Pôster do filme ${card.titulo}`;
            cardImage.loading = 'lazy'; // Adiciona o carregamento preguiçoso

            // Condicional para o caso de o pôster não ser encontrado (fallback)
            cardImage.onerror = function() {
                const placeholder = document.createElement('div');
                placeholder.className = 'poster-placeholder';
                const phTitle = document.createElement('span');
                phTitle.textContent = card.titulo || 'Sem título';
                const phSmall = document.createElement('small');
                phSmall.textContent = 'Pôster indisponível';
                placeholder.appendChild(phTitle);
                placeholder.appendChild(phSmall);
                if (this.parentNode) {
                    this.parentNode.replaceChild(placeholder, this);
                }
            };

            const cardContent = document.createElement("div");
            cardContent.classList.add("card-content");

            const cardTitle = document.createElement("h2");
            cardTitle.textContent = card.titulo;

            const cardInfo = document.createElement("p");
            cardInfo.textContent = `${card.ano} • ${card.diretor}`;

            const ratingContainer = document.createElement("div");
            ratingContainer.classList.add("rating-stars");
            ratingContainer.innerHTML = this.gerarEstrelas(Number(card.avaliacao) || 0);

            const cardOverlay = document.createElement('div');
            cardOverlay.classList.add('card-overlay');

            const overlayTitle = document.createElement('h3');
            overlayTitle.textContent = card.titulo || '';

            const overlayDesc = document.createElement('p');
            overlayDesc.className = 'overlay-description';
            overlayDesc.textContent = card.descricao || '';

            const overlayRating = document.createElement('div');
            overlayRating.className = 'rating-stars';
            overlayRating.innerHTML = this.gerarEstrelas(card.avaliacao);

            const overlayMeta = document.createElement('div');
            overlayMeta.className = 'overlay-meta';

            const metaAno = document.createElement('p');
            const strongAno = document.createElement('strong');
            strongAno.textContent = 'Ano:';
            metaAno.appendChild(strongAno);
            metaAno.appendChild(document.createTextNode(' ' + (card.ano || '')));

            const metaDir = document.createElement('p');
            const strongDir = document.createElement('strong');
            strongDir.textContent = 'Diretor:';
            metaDir.appendChild(strongDir);
            metaDir.appendChild(document.createTextNode(' ' + (card.diretor || '')));

            overlayMeta.appendChild(metaAno);
            overlayMeta.appendChild(metaDir);

            const overlayHint = document.createElement('span');
            overlayHint.className = 'overlay-hint';
            overlayHint.textContent = '+ Clique para saber mais';

            cardOverlay.appendChild(overlayTitle);
            cardOverlay.appendChild(overlayDesc);
            cardOverlay.appendChild(overlayRating);
            cardOverlay.appendChild(overlayMeta);
            cardOverlay.appendChild(overlayHint);

            cardContent.appendChild(cardTitle);
            cardContent.appendChild(cardInfo);
            cardContent.appendChild(ratingContainer);
            cardElement.appendChild(cardImage);
            cardElement.appendChild(cardContent);
            cardElement.appendChild(cardOverlay);
            this.elements.cardsContainer.appendChild(cardElement);
        }
    },

    gerarEstrelas(avaliacao) {
        const notaMaxima = 10;
        const numEstrelas = 5;
        const notaNum = Number(avaliacao) || 0;
        const notaEm5 = (notaNum / notaMaxima) * numEstrelas;
        let estrelasHtml = '';
        for (let i = 1; i <= numEstrelas; i++) {
            estrelasHtml += `<span class="star-icon">${i <= notaEm5 ? '★' : '☆'}</span>`;
        }
        estrelasHtml += `<span class="rating-number">(${notaNum.toFixed(1)}/10)</span>`;
        return estrelasHtml;
    },

    criarBotoesCategoria() {
        this.elements.categoryOptions.innerHTML = ''; // Limpa opções existentes
        const rawCats = (this.dados || []).map(f => (f.categoria || '').toString().trim()).filter(Boolean);
        const unique = Array.from(new Set(rawCats)).sort((a, b) => a.localeCompare(b));
        const categorias = ['Todos', ...unique];

        categorias.forEach(categoria => {
            const li = document.createElement('li');
            li.textContent = categoria;
            li.dataset.category = categoria;
            if (categoria === 'Todos') li.classList.add('active'); // Marca 'Todos' como ativo por padrão
            this.elements.categoryOptions.appendChild(li);
        });
        // garante que o botão mostra 'Todos' por padrão
        const span = this.elements.categoryDropdownBtn && this.elements.categoryDropdownBtn.querySelector('span');
        if (span && !span.textContent.trim()) span.textContent = 'Todos';
    },

    filtrarPorCategoria(categoria) {
        this.elements.campoBusca.value = ''; // Limpa a busca ao trocar de categoria
        this.elements.botaoLimpar.classList.add('hidden');

        const cat = (categoria || 'Todos').toString().trim();
        this.dadosAtuais = (cat === 'Todos') ? this.dados : this.dados.filter(filme => (filme.categoria || '').toString().trim() === cat);
        // Atualiza label do botão
        const span = this.elements.categoryDropdownBtn && this.elements.categoryDropdownBtn.querySelector('span');
        if (span) span.textContent = cat;

        this.atualizarVisualizacao();
    },

    resetarFiltroCategoria() {
        this.elements.categoryDropdownBtn.querySelector('span').textContent = 'Todos';
        // Marca a opção 'Todos' como ativa
        this.elements.categoryOptions.querySelectorAll('li').forEach(li => li.classList.remove('active'));
        const todosLi = this.elements.categoryOptions.querySelector('li[data-category="Todos"]');
        if (todosLi) todosLi.classList.add('active');
    }
};

// Inicia a aplicação assim que o DOM estiver pronto.
document.addEventListener('DOMContentLoaded', () => catalogo.init());