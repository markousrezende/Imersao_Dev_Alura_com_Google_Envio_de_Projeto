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
        categoryDropdownBtn: document.getElementById('category-dropdown-btn'),
        categoryOptions: document.getElementById('category-options'),
        // NOVO: Seletor para o link da logo para corrigir o problema de clique
        logoLink: document.getElementById('logo-link'), 
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
        this.vincularEventos();
        this.carregarDados();
    },

    // 2. Boas Práticas: Centraliza todos os "escutadores de evento" em um único método.
    vincularEventos() {
        this.elements.botaoBusca.addEventListener('click', () => this.iniciarBusca());
        this.elements.botaoLimpar.addEventListener('click', () => this.limparBusca());
        // Adiciona evento para busca ao pressionar 'Enter'
        this.elements.campoBusca.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.iniciarBusca();
            }
        });
        
        // CORREÇÃO LOGO: Previne o comportamento padrão do link e reseta o catálogo
        this.elements.logoLink.addEventListener('click', (e) => {
            e.preventDefault(); // Impede o recarregamento da página
            this.resetarCatalogo();
        });

        // Eventos para o Dropdown de Ordenação
        this.elements.sortDropdownBtn.addEventListener('click', () => {
            this.elements.sortOptions.classList.toggle('hidden');
            this.elements.sortDropdownBtn.classList.toggle('open');
            // Esconde o dropdown de categoria
            this.elements.categoryOptions.classList.add('hidden');
            this.elements.categoryDropdownBtn.classList.remove('open');
        });
        
        this.elements.sortOptions.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                const tipoOrdenacao = e.target.dataset.sort;
                this.ordenarFilmes(tipoOrdenacao);
                
                // Atualiza o texto do botão
                this.ordenacaoAtual.tipo = tipoOrdenacao;
                this.ordenacaoAtual.texto = e.target.textContent;
                this.elements.sortDropdownBtn.querySelector('span').textContent = this.ordenacaoAtual.texto;

                this.elements.sortOptions.classList.add('hidden');
                this.elements.sortDropdownBtn.classList.remove('open');
            }
        });
        
        // Eventos para o Dropdown de Categoria
        this.elements.categoryDropdownBtn.addEventListener('click', () => {
            this.elements.categoryOptions.classList.toggle('hidden');
            this.elements.categoryDropdownBtn.classList.toggle('open');
            // Esconde o dropdown de ordenação
            this.elements.sortOptions.classList.add('hidden');
            this.elements.sortDropdownBtn.classList.remove('open');
        });
        
        this.elements.categoryOptions.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                const categoria = e.target.dataset.category;
                this.filtrarPorCategoria(categoria);
                
                // Atualiza o texto do botão
                this.elements.categoryDropdownBtn.querySelector('span').textContent = categoria;
                
                this.elements.categoryOptions.classList.add('hidden');
                this.elements.categoryDropdownBtn.classList.remove('open');
            }
        });

        // Esconder dropdowns ao clicar fora
        document.addEventListener('click', (e) => {
            if (!this.elements.sortDropdownBtn.contains(e.target) && !this.elements.sortOptions.contains(e.target)) {
                this.elements.sortOptions.classList.add('hidden');
                this.elements.sortDropdownBtn.classList.remove('open');
            }
            if (!this.elements.categoryDropdownBtn.contains(e.target) && !this.elements.categoryOptions.contains(e.target)) {
                this.elements.categoryOptions.classList.add('hidden');
                this.elements.categoryDropdownBtn.classList.remove('open');
            }
        });
    },

    // Funções de Gerenciamento de Dados
    async carregarDados() {
        this.elements.loader.classList.remove('hidden');
        try {
            // Buscando o arquivo data.json (assumindo que está no mesmo diretório)
            const response = await fetch('./data.json');
            if (!response.ok) {
                throw new Error('Erro ao carregar dados dos filmes.');
            }
            this.dados = await response.json();
            this.dadosAtuais = [...this.dados]; // Inicializa dadosAtuais com todos os filmes
            this.criarBotoesCategoria();
            this.atualizarVisualizacao();

        } catch (error) {
            console.error("Falha ao carregar dados:", error);
            this.elements.cardsContainer.innerHTML = '<p class="empty-message">Não foi possível carregar o catálogo de filmes. Tente novamente mais tarde.</p>';
        } finally {
            this.elements.loader.classList.add('hidden');
        }
    },
    
    // NOVO: Função para resetar toda a visualização ao clicar na logo
    resetarCatalogo() {
        this.dadosAtuais = [...this.dados];
        this.elements.campoBusca.value = '';
        this.elements.botaoLimpar.classList.add('hidden');

        // Resetar Filtro de Categoria
        this.resetarFiltroCategoria(); 
        
        // Resetar Ordenação (se desejar)
        this.ordenacaoAtual = { tipo: 'padrao', texto: 'Padrão' };
        this.elements.sortDropdownBtn.querySelector('span').textContent = 'Padrão';
        
        this.atualizarVisualizacao();
    },

    iniciarBusca() {
        const termo = this.elements.campoBusca.value.toLowerCase().trim();
        this.dadosAtuais = this.dados.filter(filme => 
            filme.titulo.toLowerCase().includes(termo) ||
            filme.descricao.toLowerCase().includes(termo)
        );
        
        // Após a busca, a ordenação e filtro de categoria devem ser aplicados
        this.ordenarFilmes(this.ordenacaoAtual.tipo); // Reaplica a ordenação
        this.resetarFiltroCategoria(); // Reseta a categoria para "Todos"
        
        // Mostra/Esconde o botão "Limpar Busca"
        if (termo.length > 0) {
            this.elements.botaoLimpar.classList.remove('hidden');
        } else {
            this.elements.botaoLimpar.classList.add('hidden');
        }
        
        this.atualizarVisualizacao();
    },

    limparBusca() {
        this.elements.campoBusca.value = '';
        this.elements.botaoLimpar.classList.add('hidden');
        this.dadosAtuais = [...this.dados]; // Volta a exibir todos os filmes
        this.resetarFiltroCategoria(); // Garante que o filtro de categoria volte para "Todos"
        this.ordenarFilmes(this.ordenacaoAtual.tipo); // Mantém a ordenação atual
        this.atualizarVisualizacao();
    },

    // Funções de Visualização
    atualizarVisualizacao() {
        this.elements.cardsContainer.innerHTML = ''; // Limpa o container
        
        if (this.dadosAtuais.length === 0) {
            this.elements.cardsContainer.innerHTML = '<p class="empty-message">Nenhum filme encontrado com os filtros ou termo de busca selecionados.</p>';
            return;
        }

        const cardsHtml = this.dadosAtuais.map(filme => this.criarCard(filme)).join('');
        this.elements.cardsContainer.innerHTML = cardsHtml;
    },

    criarCard(filme) {
        // Verifica se a URL do pôster é válida ou usa um placeholder
        const posterUrl = filme.poster && filme.poster.startsWith('http') ? filme.poster : null;
        const posterHtml = posterUrl 
            ? `<img src="${posterUrl}" alt="Pôster do filme ${filme.titulo}">`
            : `<div class="poster-placeholder"><span>${filme.titulo}</span><p>Pôster indisponível</p></div>`;

        // Gera as estrelas de avaliação
        const ratingStarsHtml = this.gerarEstrelas(filme.avaliacao);

        return `
            <a href="${filme.link}" target="_blank" class="card">
                ${posterHtml}
                <div class="card-content">
                    <h2>${filme.titulo} (${filme.ano})</h2>
                    <p>${filme.categoria}</p>
                    <div class="rating-stars">${ratingStarsHtml}</div>
                </div>
                <div class="card-overlay">
                    <div class="overlay-meta">
                        <h3>${filme.titulo} (${filme.ano})</h3>
                        <div class="rating-stars">${ratingStarsHtml}</div>
                        <p class="overlay-description">${filme.descricao}</p>
                        <p><strong>Diretor:</strong> ${filme.diretor}</p>
                        <p><strong>Categoria:</strong> ${filme.categoria}</p>
                    </div>
                    <span class="overlay-hint">Ver Detalhes (IMDb)</span>
                </div>
            </a>
        `;
    },

    // Funções de Ordenação e Filtro
    ordenarFilmes(tipo) {
        switch (tipo) {
            case 'avaliacao-desc':
                this.dadosAtuais.sort((a, b) => b.avaliacao - a.avaliacao);
                break;
            case 'avaliacao-asc':
                this.dadosAtuais.sort((a, b) => a.avaliacao - b.avaliacao);
                break;
            case 'ano-desc':
                this.dadosAtuais.sort((a, b) => b.ano - a.ano);
                break;
            case 'ano-asc':
                this.dadosAtuais.sort((a, b) => a.ano - b.ano);
                break;
            case 'alfa':
                this.dadosAtuais.sort((a, b) => a.titulo.localeCompare(b.titulo));
                break;
            case 'padrao':
            default:
                // Se for "padrão", usa a ordem original dos dados
                this.dadosAtuais = this.dadosAtuais.length === this.dados.length
                    ? [...this.dados] // Se não houver filtro, volta à ordem original
                    : this.dadosAtuais; // Se houver filtro/busca, mantém a ordem
                break;
        }
        // Se a ordenação for chamada diretamente, atualiza a view
        if (tipo !== 'padrao') {
             this.atualizarVisualizacao();
        }
    },

    gerarEstrelas(avaliacao) {
        const notaMaxima = 10;
        const numEstrelas = 5;
        const notaEm5 = (avaliacao / notaMaxima) * numEstrelas;
        let estrelasHtml = '';
        for (let i = 1; i <= numEstrelas; i++) {
            estrelasHtml += `<span class="star-icon">${i <= notaEm5 ? '★' : '☆'}</span>`;
        }
        estrelasHtml += `<span class="rating-number">(${avaliacao.toFixed(1)}/10)</span>`;
        return estrelasHtml;
    },

    criarBotoesCategoria() {
        this.elements.categoryOptions.innerHTML = ''; // Limpa opções existentes
        const categorias = ['Todos', ...new Set(this.dados.map(filme => filme.categoria).sort())];

        categorias.forEach(categoria => {
            const li = document.createElement('li');
            li.textContent = categoria;
            li.dataset.category = categoria;
            this.elements.categoryOptions.appendChild(li);
        });
    },

    filtrarPorCategoria(categoria) {
        this.elements.campoBusca.value = ''; // Limpa a busca ao trocar de categoria
        this.elements.botaoLimpar.classList.add('hidden');

        this.dadosAtuais = (categoria === 'Todos')
            ? this.dados
            : this.dados.filter(filme => filme.categoria === categoria);
        
        // Reaplica a ordenação atual após o filtro
        this.ordenarFilmes(this.ordenacaoAtual.tipo);

        this.atualizarVisualizacao();
    },

    resetarFiltroCategoria() {
        this.elements.categoryDropdownBtn.querySelector('span').textContent = 'Todos';
    }
};

// Inicia a aplicação assim que o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    catalogo.init();
});
