// ===================================================
// CONFIGURAÇÃO DO CATÁLOGO LOCAL E ESTADO CENTRAL (ETAPA 1)
// ===================================================
const CATALOGO_URL = "./data/figurinhas.json";
const STATUS_VALIDOS = ["deck", "album"];
const STORAGE_KEY = "ascensaoLendariosCollection";

// Map em memória para armazenamento central (ID -> Objeto Figurinha)
const estadoFigurinhas = new Map();

/**
 * Salva o estado atual das figurinhas (id + status) no localStorage (ETAPA 8)
 */
function salvarEstadoStorage() {
    try {
        const colecao = [];
        estadoFigurinhas.forEach((fig, id) => {
            colecao.push({ id: fig.id, status: fig.status });
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(colecao));
    } catch (erro) {
        console.warn("⚠️ Erro ao salvar estado no localStorage:", erro);
    }
}

/**
 * Restaura o status das figurinhas a partir do localStorage de forma segura (ETAPA 8)
 */
function carregarEstadoStorage() {
    try {
        const dadosSalvos = localStorage.getItem(STORAGE_KEY);
        if (!dadosSalvos) return;

        const colecao = JSON.parse(dadosSalvos);
        if (!Array.isArray(colecao)) return;

        colecao.forEach(item => {
            if (item && typeof item.id === "number" && STATUS_VALIDOS.includes(item.status)) {
                if (estadoFigurinhas.has(item.id)) {
                    const figurinha = estadoFigurinhas.get(item.id);
                    figurinha.status = item.status;
                }
            }
        });
        console.log("💾 Estado da coleção restaurado com sucesso do localStorage!");
    } catch (erro) {
        console.warn("⚠️ Estado salvo no localStorage é inválido ou corrompido. Usando padrão:", erro);
    }
}

/**
 * Inicializa o estado central a partir do catálogo local e restaura a coleção salva
 * @param {Array} catalogo
 */
function inicializarEstadoFigurinhas(catalogo) {
    estadoFigurinhas.clear();
    catalogo.forEach(item => {
        estadoFigurinhas.set(item.id, {
            id: item.id,
            nome: item.nome,
            categoria: item.categoria || "",
            imagem: item.imagem_url,
            status: "deck" // Inicialmente no deck para o usuário colar
        });
    });

    // ETAPA 8: Restaura o estado salvo no localStorage (se existir)
    carregarEstadoStorage();

    console.log(`📦 Estado central inicializado com ${estadoFigurinhas.size} figurinhas.`);
}

/**
 * Obtém figurinha pelo seu ID.
 * @param {number} id 
 * @returns {Object|null}
 */
function obterFigurinhaPorId(id) {
    const idNum = parseInt(id, 10);
    return estadoFigurinhas.get(idNum) || null;
}

/**
 * Altera o status de uma figurinha ("deck" ou "album") e persiste no localStorage.
 * @param {number} id 
 * @param {string} novoStatus 
 * @returns {boolean}
 */
function alterarStatusFigurinha(id, novoStatus) {
    if (!STATUS_VALIDOS.includes(novoStatus)) {
        console.error(`Status inválido: ${novoStatus}. Status permitidos: ${STATUS_VALIDOS.join(", ")}`);
        return false;
    }
    const figurinha = obterFigurinhaPorId(id);
    if (!figurinha) {
        console.error(`Figurinha com ID ${id} não encontrada no estado central.`);
        return false;
    }
    figurinha.status = novoStatus;

    // ETAPA 8: Persiste a alteração de status no localStorage
    salvarEstadoStorage();

    renderizarDeck();
    renderizarAlbum();
    return true;
}

/**
 * Consulta o status de uma figurinha por ID.
 * @param {number} id 
 * @returns {string|null}
 */
function consultarStatusFigurinha(id) {
    const figurinha = obterFigurinhaPorId(id);
    return figurinha ? figurinha.status : null;
}

/**
 * Obtém figurinhas filtradas por status ("deck", "album") ou todas se omitido.
 * @param {string} [status] 
 * @returns {Array}
 */
function obterFigurinhasDisponiveis(status) {
    const todas = Array.from(estadoFigurinhas.values());
    if (!status) return todas;
    if (!STATUS_VALIDOS.includes(status)) {
        console.warn(`Status de busca inválido: ${status}`);
        return [];
    }
    return todas.filter(f => f.status === status);
}

// Expõe no escopo global para facilitar chamadas e testes
window.EstadoFigurinhas = {
    obterPorId: obterFigurinhaPorId,
    alterarStatus: alterarStatusFigurinha,
    consultarStatus: consultarStatusFigurinha,
    obterDisponiveis: obterFigurinhasDisponiveis,
    obterTodas: () => Array.from(estadoFigurinhas.values()),
    salvarStorage: salvarEstadoStorage,
    carregarStorage: carregarEstadoStorage,
    limparStorage: () => {
        localStorage.removeItem(STORAGE_KEY);
        console.log("🧹 localStorage da coleção limpo.");
    }
};

// ===================================================
// DECK DE FIGURINHAS (ETAPA 2)
// ===================================================

/**
 * Renderiza as figurinhas do Estado Central que possuem status === "deck"
 */
function renderizarDeck() {
    const deckGrid = document.getElementById("deck-grid");
    const deckCountText = document.getElementById("deck-count-text");
    const deckBadgeCount = document.getElementById("deck-badge-count");
    if (!deckGrid) return;

    const figurinhasDeck = obterFigurinhasDisponiveis("deck");
    const qtd = figurinhasDeck.length;

    if (deckCountText) deckCountText.textContent = `${qtd} disponíveis`;
    if (deckBadgeCount) deckBadgeCount.textContent = qtd;

    deckGrid.innerHTML = "";

    if (qtd === 0) {
        deckGrid.innerHTML = `<div class="deck-empty-msg">Todas as figurinhas estão no álbum!</div>`;
        return;
    }

    figurinhasDeck.forEach(f => {
        const card = document.createElement("div");
        card.className = "deck-card";
        card.dataset.id = f.id;

        const numFormatted = `#${String(f.id).padStart(2, '0')}`;

        card.innerHTML = `
            <span class="deck-card-number">${numFormatted}</span>
            <img src="${f.imagem}" alt="${f.nome}" class="deck-card-img" draggable="false">
            <span class="deck-card-name">${f.nome}</span>
        `;

        deckGrid.appendChild(card);
    });
}

/**
 * Alterna a visibilidade do painel lateral do Deck (Abre/Fecha)
 */
function alternarDeck() {
    const deckPanel = document.getElementById("deck-panel");
    if (deckPanel) {
        deckPanel.classList.toggle("open");
    }
}

let isAnimatingReturn = false;
let isAnimatingPlacement = false;

/**
 * Inicializa os eventos e controles do Deck
 */
function inicializarDeck() {
    const toggleBtn = document.getElementById("deck-toggle");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", alternarDeck);
    }

    const btnReturn = document.getElementById("btn-return-all");
    if (btnReturn) {
        btnReturn.addEventListener("click", devolverTodasFigurinhas);
    }

    inicializarDragDeck();
    renderizarDeck();
}

/**
 * Anima e devolve todas as figurinhas coladas no álbum de volta para o Deck em cascata (ETAPA 6).
 */
async function devolverTodasFigurinhas() {
    if (isAnimatingReturn) return;

    const figurinhasColadas = obterFigurinhasDisponiveis("album");
    if (figurinhasColadas.length === 0) {
        console.log("ℹ️ Nenhuma figurinha colada no álbum para devolver.");
        return;
    }

    isAnimatingReturn = true;

    const btnReturn = document.getElementById("btn-return-all");
    if (btnReturn) btnReturn.disabled = true;

    // Se o Deck estiver fechado, abre automaticamente para exibir as figurinhas chegando
    const deckPanel = document.getElementById("deck-panel");
    const deckGrid = document.getElementById("deck-grid");
    const deckDestination = deckPanel && deckPanel.classList.contains("open") && deckGrid
        ? deckGrid
        : document.getElementById("deck-toggle");
    const rectDeck = deckDestination
        ? deckDestination.getBoundingClientRect()
        : { left: 0, top: 160, width: 60, height: 100 };
    const targetX = rectDeck.left + rectDeck.width / 2;
    const targetY = rectDeck.top + rectDeck.height / 2;

    // Execução em cascata com intervalo de ~45ms entre figurinhas
    const promises = figurinhasColadas.map((figurinha, index) => {
        return new Promise(resolve => {
            setTimeout(() => {
                const slots = document.querySelectorAll(".sticker-slot");
                let targetSlot = null;

                for (const slot of slots) {
                    const slotNumEl = slot.querySelector(".slot-number");
                    if (slotNumEl) {
                        const slotId = parseInt(slotNumEl.textContent.replace("#", ""), 10);
                        if (slotId === figurinha.id) {
                            targetSlot = slot;
                            break;
                        }
                    }
                }

                if (!targetSlot) {
                    // Se o slot não estiver visível na página atual, devolve diretamente no estado
                    alterarStatusFigurinha(figurinha.id, "deck");
                    resolve();
                    return;
                }

                const rectSlot = targetSlot.getBoundingClientRect();
                const startX = rectSlot.left + rectSlot.width / 2;
                const startY = rectSlot.top + rectSlot.height / 2;

                // Remove imagem do slot no álbum visualmente
                const imgInSlot = targetSlot.querySelector(".sticker-img");
                if (imgInSlot) imgInSlot.remove();
                targetSlot.classList.remove("slot-preenchido");

                // Cria o ghost de retorno que voará para o Deck
                const flyingGhost = document.createElement("div");
                flyingGhost.className = "returning-sticker-ghost";
                flyingGhost.style.width = `${rectSlot.width}px`;
                flyingGhost.style.height = `${rectSlot.height}px`;

                const numFormatted = `#${String(figurinha.id).padStart(2, '0')}`;
                flyingGhost.innerHTML = `
                    <span class="ghost-number">${numFormatted}</span>
                    <img src="${figurinha.imagem}" alt="${figurinha.nome}" draggable="false">
                `;

                document.body.appendChild(flyingGhost);

                // Sequência da animação:
                // 1. Levanta do slot + sombra
                // 2. Diminui levemente + voa em direção ao Deck
                // 3. Desaparece ao chegar no Deck
                const keyframes = [
                    {
                        transform: `translate3d(${startX}px, ${startY}px, 0) translate(-50%, -50%) scale(1.0) rotate(0deg)`,
                        boxShadow: `0 0 10px rgba(0,0,0,0.3)`,
                        opacity: 1
                    },
                    {
                        transform: `translate3d(${startX}px, ${startY - 15}px, 0) translate(-50%, -50%) scale(1.08) rotate(-2deg)`,
                        boxShadow: `0 15px 30px rgba(0,0,0,0.6), 0 0 15px rgba(231,185,91,0.5)`,
                        offset: 0.25
                    },
                    {
                        transform: `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%) scale(0.6) rotate(-5deg)`,
                        boxShadow: `0 5px 15px rgba(0,0,0,0.4)`,
                        opacity: 0.9,
                        offset: 0.85
                    },
                    {
                        transform: `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%) scale(0.3) rotate(-6deg)`,
                        opacity: 0
                    }
                ];

                const anim = flyingGhost.animate(keyframes, {
                    duration: 820,
                    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
                    fill: "forwards"
                });

                anim.onfinish = () => {
                    flyingGhost.remove();
                    alterarStatusFigurinha(figurinha.id, "deck");
                    resolve();
                };
            }, index * 90);
        });
    });

    await Promise.all(promises);

    isAnimatingReturn = false;
    if (btnReturn) btnReturn.disabled = false;
    console.log("✅ Todas as figurinhas coladas foram devolvidas ao Deck!");
}

// ===================================================
// SISTEMA DE DRAG E DROP DE FIGURINHAS (ETAPA 3 & 4)
// ===================================================
let isDraggingSticker = false;
let draggedStickerId = null;
let ghostElement = null;
let currentHoveredSlot = null;

/**
 * Retorna o elemento .sticker-slot sob as coordenadas (x, y) usando getBoundingClientRect()
 * @param {number} x 
 * @param {number} y 
 * @returns {HTMLElement|null}
 */
function obterSlotSobPonteiro(x, y) {
    const slots = document.querySelectorAll(".sticker-slot");
    for (const slot of slots) {
        // Verifica apenas slots pertencentes a páginas visíveis
        if (slot.offsetParent === null) continue;

        const rect = slot.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            return slot;
        }
    }
    return null;
}

/**
 * Remove classes de destaque visual de todos os slots
 */
function limparDestaquesSlots() {
    document.querySelectorAll(".sticker-slot.slot-target-valid, .sticker-slot.slot-target-invalid").forEach(s => {
        s.classList.remove("slot-target-valid", "slot-target-invalid");
    });
    currentHoveredSlot = null;
}

/**
 * Inicia o arraste de uma figurinha do Deck (Pointer Event)
 */
function iniciarDragFigurinha(e) {
    if (isAnimatingReturn || isAnimatingPlacement) return;
    const card = e.target.closest(".deck-card");
    if (!card) return;

    if (e.button !== undefined && e.button !== 0) return;

    const id = parseInt(card.dataset.id, 10);
    const figurinha = obterFigurinhaPorId(id);
    if (!figurinha) return;

    e.preventDefault();
    e.stopPropagation();

    isDraggingSticker = true;
    draggedStickerId = id;

    card.classList.add("dragging-source");

    ghostElement = document.createElement("div");
    ghostElement.className = "dragging-sticker-ghost";

    const numFormatted = `#${String(id).padStart(2, '0')}`;
    ghostElement.innerHTML = `
        <span class="ghost-number">${numFormatted}</span>
        <img src="${figurinha.imagem}" alt="${figurinha.nome}" draggable="false">
    `;

    ghostElement.style.left = `${e.clientX}px`;
    ghostElement.style.top = `${e.clientY}px`;

    document.body.appendChild(ghostElement);

    const deckPanel = document.getElementById("deck-panel");
    if (deckPanel) deckPanel.classList.remove("open");

    window.addEventListener("pointermove", moverDragFigurinha);
    window.addEventListener("pointerup", finalizarDragFigurinha);
    window.addEventListener("pointercancel", finalizarDragFigurinha);
}

/**
 * Move a representação visual temporária e detecta slot sob o cursor com destaque visual
 */
function moverDragFigurinha(e) {
    if (!isDraggingSticker || !ghostElement) return;

    ghostElement.style.left = `${e.clientX}px`;
    ghostElement.style.top = `${e.clientY}px`;

    // ETAPA 4: Detecta slot sob o ponteiro em tempo real usando getBoundingClientRect()
    const slotSobPonteiro = obterSlotSobPonteiro(e.clientX, e.clientY);

    if (slotSobPonteiro !== currentHoveredSlot) {
        limparDestaquesSlots();

        if (slotSobPonteiro) {
            currentHoveredSlot = slotSobPonteiro;

            const slotNumEl = slotSobPonteiro.querySelector(".slot-number");
            if (slotNumEl) {
                const slotId = parseInt(slotNumEl.textContent.replace("#", ""), 10);
                const isOccupied = slotSobPonteiro.classList.contains("slot-preenchido") || slotSobPonteiro.querySelector(".sticker-img") !== null;

                // Slot correto + não ocupado = VÁLIDO (dourado + glow + pulso)
                if (slotId === draggedStickerId && !isOccupied) {
                    slotSobPonteiro.classList.add("slot-target-valid");
                } else {
                    // Slot errado ou ocupado = INVÁLIDO (borda vermelha discreta)
                    slotSobPonteiro.classList.add("slot-target-invalid");
                }
            }
        }
    }
}

/**
 * Efeito visual de partículas/faíscas ao colar figurinha (ETAPA 5)
 * @param {HTMLElement} slotElement 
 */
function criarEfeitoColagemParticulas(slotElement) {
    const rect = slotElement.getBoundingClientRect();
    const count = 12;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement("div");
        particle.className = "sticker-drop-particle";

        const startX = rect.left + rect.width * (0.2 + Math.random() * 0.6);
        const startY = rect.top + rect.height * (0.2 + Math.random() * 0.6);

        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;

        const size = Math.random() * 4 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        document.body.appendChild(particle);

        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 40 + 20;
        const destX = startX + Math.cos(angle) * distance;
        const destY = startY + Math.sin(angle) * distance - 15;

        const pAnim = particle.animate([
            { transform: "translate(0, 0) scale(1)", opacity: 1 },
            { transform: `translate(${destX - startX}px, ${destY - startY}px) scale(0)`, opacity: 0 }
        ], {
            duration: 700 + Math.random() * 250,
            easing: "cubic-bezier(0.1, 0.8, 0.3, 1)",
            fill: "forwards"
        });

        pAnim.onfinish = () => particle.remove();
    }
}

/**
 * Finaliza o arraste e processa a Animação FLIP de Colagem (ETAPA 5)
 */
function finalizarDragFigurinha(e) {
    if (!isDraggingSticker) return;

    const slotSobPonteiro = obterSlotSobPonteiro(e.clientX, e.clientY);
    let dropValido = false;
    let slotAlvo = null;
    const idFigurinha = draggedStickerId;

    if (slotSobPonteiro) {
        const slotNumEl = slotSobPonteiro.querySelector(".slot-number");
        if (slotNumEl) {
            const slotId = parseInt(slotNumEl.textContent.replace("#", ""), 10);
            const isOccupied = slotSobPonteiro.classList.contains("slot-preenchido") || slotSobPonteiro.querySelector(".sticker-img") !== null;

            if (slotId === idFigurinha && !isOccupied) {
                dropValido = true;
                slotAlvo = slotSobPonteiro;
            }
        }
    }

    limparDestaquesSlots();

    document.querySelectorAll(".deck-card.dragging-source").forEach(c => {
        c.classList.remove("dragging-source");
    });

    if (dropValido && slotAlvo && ghostElement) {
        isAnimatingPlacement = true;
        slotAlvo.classList.remove("stats-visible");
        slotAlvo.classList.add("slot-placement-animating");
        // TÉCNICA FLIP (First, Last, Invert, Play) - ETAPA 5
        const rectSlot = slotAlvo.getBoundingClientRect();
        const lastX = rectSlot.left + rectSlot.width / 2;
        const lastY = rectSlot.top + rectSlot.height / 2;

        const currentGhost = ghostElement;
        ghostElement = null; // desvincula a referência global

        currentGhost.style.left = "0px";
        currentGhost.style.top = "0px";

        const keyframes = [
            // FIRST: Posição solta (scale 1.05, rotate 3deg)
            {
                transform: `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%) scale(1.05) rotate(3deg)`,
                boxShadow: `0 15px 30px rgba(0,0,0,0.75), 0 0 20px rgba(231,185,91,0.5)`,
                opacity: 1
            },
            // CENTRALIZA & DESACELERA (scale 1.08) - 60%
            {
                transform: `translate3d(${lastX}px, ${lastY}px, 0) translate(-50%, -50%) scale(1.08) rotate(0deg)`,
                boxShadow: `0 0 35px rgba(231,185,91,0.9), 0 0 15px rgba(255,255,255,0.8)`,
                offset: 0.6
            },
            // scale 0.96 (Efeito toque suave) - 85%
            {
                transform: `translate3d(${lastX}px, ${lastY}px, 0) translate(-50%, -50%) scale(0.96) rotate(0deg)`,
                boxShadow: `0 0 20px rgba(231,185,91,0.6)`,
                offset: 0.85
            },
            // LAST: scale 1.0 e colada
            {
                transform: `translate3d(${lastX}px, ${lastY}px, 0) translate(-50%, -50%) scale(1.0) rotate(0deg)`,
                boxShadow: `0 0 10px rgba(231,185,91,0.3)`,
                opacity: 1
            }
        ];

        const anim = currentGhost.animate(keyframes, {
            duration: 820,
            easing: "cubic-bezier(0.2, 0.8, 0.25, 1)",
            fill: "forwards"
        });

        anim.onfinish = async () => {
            // 1. Atualiza o status central para "album" e atualiza o Deck/Álbum
            alterarStatusFigurinha(idFigurinha, "album");

            // 2. Partículas na colagem
            const imagemDefinitiva = slotAlvo.querySelector(".sticker-img");
            if (imagemDefinitiva && !imagemDefinitiva.complete) {
                await new Promise(resolve => {
                    imagemDefinitiva.addEventListener("load", resolve, { once: true });
                    imagemDefinitiva.addEventListener("error", resolve, { once: true });
                });
            }

            if (imagemDefinitiva) {
                imagemDefinitiva.style.animation = "none";
                imagemDefinitiva.style.opacity = "1";
            }

            currentGhost.remove();
            slotAlvo.classList.remove("slot-placement-animating");
            criarEfeitoColagemParticulas(slotAlvo);
            isAnimatingPlacement = false;
            console.log(`✨ Animação de colagem FLIP concluída para figurinha #${idFigurinha}!`);
        };
    } else {
        if (ghostElement) {
            ghostElement.remove();
            ghostElement = null;
        }
    }

    isDraggingSticker = false;
    draggedStickerId = null;

    window.removeEventListener("pointermove", moverDragFigurinha);
    window.removeEventListener("pointerup", finalizarDragFigurinha);
    window.removeEventListener("pointercancel", finalizarDragFigurinha);
}

/**
 * Inicializa os listeners do drag no grid do Deck
 */
function inicializarDragDeck() {
    const deckGrid = document.getElementById("deck-grid");
    if (deckGrid && !deckGrid.dataset.dragInitialized) {
        deckGrid.addEventListener("pointerdown", iniciarDragFigurinha);
        deckGrid.dataset.dragInitialized = "true";
    }
}

// ===================================================
// RENDERIZAÇÃO DOS SLOTS DO ÁLBUM
// ===================================================
function renderizarAlbum() {
    const slots = document.querySelectorAll(".sticker-slot");

    for (const slot of slots) {
        const slotNumeroEl = slot.querySelector(".slot-number");
        if (!slotNumeroEl) continue;

        const id = parseInt(slotNumeroEl.textContent.replace("#", ""), 10);
        const figurinha = obterFigurinhaPorId(id);
        const imgExistente = slot.querySelector(".sticker-img");

        if (figurinha && figurinha.status === "album") {
            if (!imgExistente) {
                const img = document.createElement("img");
                img.src = figurinha.imagem;
                img.alt = figurinha.nome;
                img.className = "sticker-img";
                img.onload = () => slot.classList.add("slot-preenchido");
                img.onerror = () => console.warn(`Imagem não encontrada: ${figurinha.nome}`);
                slot.insertBefore(img, slot.firstChild);
            }
        } else {
            if (imgExistente) {
                imgExistente.remove();
                slot.classList.remove("slot-preenchido");
            }
        }
    }
}

// ===================================================
// CARREGAMENTO INICIAL DO CATÁLOGO LOCAL
// ===================================================
async function preencherFigurinhas() {
    try {
        const response = await fetch(CATALOGO_URL);

        if (!response.ok) {
            throw new Error(`Erro ao carregar catálogo: ${response.status} ${response.statusText}`);
        }

        const figurinhas = await response.json();

        // 1. Inicializa o Estado Central
        inicializarEstadoFigurinhas(figurinhas);

        // 2. Renderiza o Deck, o Álbum e inicializa o Visualizador (Viewer)
        inicializarDeck();
        inicializarStickerViewer();
        renderizarAlbum();

        console.log(`✅ ${estadoFigurinhas.size} figurinhas registradas no estado central e prontas no Deck!`);

    } catch (erro) {
        console.warn("⚠️ Não foi possível carregar o catálogo local:", erro.message);
    }
}

// ===================================================
// SISTEMA DE VISUALIZAÇÃO AMPLIADA (VIEWER ETAPA 7)
// ===================================================
let isViewerOpen = false;
let viewerActiveSlot = null;

/**
 * Inicializa os controles do modal visualizador (Viewer)
 */
function inicializarStickerViewer() {
    const overlay = document.getElementById("sticker-viewer-overlay");
    const closeBtn = document.getElementById("sticker-viewer-close");
    const viewerCard = document.getElementById("sticker-viewer-card");

    if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            fecharStickerViewer();
        });
    }

    if (overlay) {
        overlay.addEventListener("click", (e) => {
            // Clique FORA da figurinha (no fundo preto translúcido) fecha o modal
            if (e.target === overlay || e.target.id === "sticker-viewer-container") {
                fecharStickerViewer();
            }
        });
    }

    if (viewerCard) {
        // Clique NA figurinha/card NÃO fecha o modal
        viewerCard.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }

    inicializarViewerSlotEvents();
}

/**
 * Gerencia a diferenciação estrita entre CLICK e DRAG em slots colados do álbum
 */
function inicializarViewerSlotEvents() {
    let pointerStartX = 0;
    let pointerStartY = 0;
    let targetSlot = null;
    let clickTimer = null;
    let lastClickSlot = null;
    let lastClickTime = 0;
    let activeStatusSlot = null;
    let statusCloseTimer = null;
    let isPointerDownOnSlot = false;

    const fecharStatus = () => {
        clearTimeout(statusCloseTimer);
        statusCloseTimer = null;
        document.querySelectorAll(".sticker-slot.stats-visible").forEach(slot => {
            slot.classList.remove("stats-visible");
        });
        activeStatusSlot = null;
    };

    const agendarFechamentoStatus = (slot) => {
        clearTimeout(statusCloseTimer);
        statusCloseTimer = setTimeout(() => {
            if (!isPointerDownOnSlot && activeStatusSlot === slot) {
                fecharStatus();
            }
        }, 180);
    };

    document.querySelectorAll(".sticker-slot").forEach(slot => {
        slot.addEventListener("pointerleave", () => {
            if (activeStatusSlot === slot && !isPointerDownOnSlot) {
                agendarFechamentoStatus(slot);
            }
        });

        slot.addEventListener("pointerenter", () => {
            if (activeStatusSlot === slot) {
                clearTimeout(statusCloseTimer);
                statusCloseTimer = null;
            }
        });
    });

    document.body.addEventListener("pointerdown", (e) => {
        if (isViewerOpen || isAnimatingReturn || isAnimatingPlacement || isDraggingSticker) return;

        const slot = e.target.closest(".sticker-slot.slot-preenchido");
        if (slot) {
            pointerStartX = e.clientX;
            pointerStartY = e.clientY;
            targetSlot = slot;
            isPointerDownOnSlot = true;
            clearTimeout(statusCloseTimer);
            statusCloseTimer = null;
        } else {
            targetSlot = null;
            isPointerDownOnSlot = false;
        }
    });

    document.body.addEventListener("pointerup", (e) => {
        isPointerDownOnSlot = false;
        if (isViewerOpen || isAnimatingReturn || isAnimatingPlacement || isDraggingSticker || !targetSlot) {
            targetSlot = null;
            return;
        }

        const slot = e.target.closest(".sticker-slot.slot-preenchido");
        if (slot === targetSlot) {
            const deltaX = Math.abs(e.clientX - pointerStartX);
            const deltaY = Math.abs(e.clientY - pointerStartY);
            const distance = Math.hypot(deltaX, deltaY);

            // Regra da ETAPA 7: Movimento < 6px é CLICK (abre viewer). Movimento >= 6px é DRAG (nunca abre viewer).
            if (distance < 6) {
                const slotNumEl = slot.querySelector(".slot-number");
                if (slotNumEl) {
                    const slotId = parseInt(slotNumEl.textContent.replace("#", ""), 10);
                    const agora = performance.now();
                    const isDoubleClick = lastClickSlot === slot && agora - lastClickTime < 300;

                    if (isDoubleClick) {
                        clearTimeout(clickTimer);
                        clickTimer = null;
                        lastClickSlot = null;
                        lastClickTime = 0;
                        fecharStatus();
                        abrirStickerViewer(slotId, slot);
                    } else {
                        lastClickSlot = slot;
                        lastClickTime = agora;
                        clearTimeout(clickTimer);
                        clickTimer = setTimeout(() => {
                            if (activeStatusSlot === slot) {
                                fecharStatus();
                            } else {
                                fecharStatus();
                                slot.classList.add("stats-visible");
                                activeStatusSlot = slot;
                            }
                            clickTimer = null;
                            lastClickSlot = null;
                            lastClickTime = 0;
                        }, 300);
                    }
                }
            }
        }
        targetSlot = null;
    });

    // Tecla ESC fecha o modal
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isViewerOpen) {
            fecharStickerViewer();
        }
    });
}

/**
 * Abre o modal visualizador com animação FLIP a partir da posição REAL do slot
 * @param {number} id 
 * @param {HTMLElement} slotElement 
 */
function abrirStickerViewer(id, slotElement) {
    if (isViewerOpen || isAnimatingPlacement || isAnimatingReturn || !slotElement) return;

    document.querySelectorAll(".sticker-slot.stats-visible").forEach(slot => {
        slot.classList.remove("stats-visible");
    });

    const figurinha = obterFigurinhaPorId(id);
    if (!figurinha) return;

    isViewerOpen = true;
    viewerActiveSlot = slotElement;

    const overlay = document.getElementById("sticker-viewer-overlay");
    const viewerCard = document.getElementById("sticker-viewer-card");
    const viewerImg = document.getElementById("sticker-viewer-img");
    const viewerNum = document.getElementById("sticker-viewer-number");
    const viewerTitle = document.getElementById("sticker-viewer-title");

    if (!overlay || !viewerCard || !viewerImg) return;

    viewerImg.src = figurinha.imagem;
    viewerImg.alt = figurinha.nome;
    viewerNum.textContent = `#${String(id).padStart(2, '0')}`;
    viewerTitle.textContent = figurinha.nome;

    const rectSlot = slotElement.getBoundingClientRect();

    overlay.classList.add("active");

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const targetCenterX = viewportWidth / 2;
    const targetCenterY = viewportHeight / 2;

    const slotCenterX = rectSlot.left + rectSlot.width / 2;
    const slotCenterY = rectSlot.top + rectSlot.height / 2;

    const initialTranslateX = slotCenterX - targetCenterX;
    const initialTranslateY = slotCenterY - targetCenterY;

    const initialScaleX = rectSlot.width / (viewportWidth * 0.5);
    const initialScaleY = rectSlot.height / (viewportHeight * 0.6);
    const initialScale = Math.min(initialScaleX, initialScaleY, 0.4);

    viewerCard.animate([
        {
            transform: `translate3d(${initialTranslateX}px, ${initialTranslateY}px, 0) scale(${initialScale})`,
            opacity: 0.2
        },
        {
            transform: `translate3d(0, 0, 0) scale(1)`,
            opacity: 1
        }
    ], {
        duration: 600,
        easing: "cubic-bezier(0.2, 0.8, 0.25, 1)",
        fill: "forwards"
    });
}

/**
 * Fecha o visualizador com animação FLIP inversa retornando exatamente ao slot original
 */
function fecharStickerViewer() {
    if (!isViewerOpen) return;

    const overlay = document.getElementById("sticker-viewer-overlay");
    const viewerCard = document.getElementById("sticker-viewer-card");

    if (!overlay || !viewerCard) {
        isViewerOpen = false;
        return;
    }

    if (viewerActiveSlot && viewerActiveSlot.offsetParent !== null) {
        const rectSlot = viewerActiveSlot.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const targetCenterX = viewportWidth / 2;
        const targetCenterY = viewportHeight / 2;

        const slotCenterX = rectSlot.left + rectSlot.width / 2;
        const slotCenterY = rectSlot.top + rectSlot.height / 2;

        const finalTranslateX = slotCenterX - targetCenterX;
        const finalTranslateY = slotCenterY - targetCenterY;

        const finalScaleX = rectSlot.width / (viewportWidth * 0.5);
        const finalScaleY = rectSlot.height / (viewportHeight * 0.6);
        const finalScale = Math.min(finalScaleX, finalScaleY, 0.4);

        const anim = viewerCard.animate([
            {
                transform: `translate3d(0, 0, 0) scale(1)`,
                opacity: 1
            },
            {
                transform: `translate3d(${finalTranslateX}px, ${finalTranslateY}px, 0) scale(${finalScale})`,
                opacity: 0
            }
        ], {
            duration: 550,
            easing: "cubic-bezier(0.25, 1, 0.5, 1)",
            fill: "forwards"
        });

        overlay.classList.remove("active");

        anim.onfinish = () => {
            isViewerOpen = false;
            viewerActiveSlot = null;
        };
    } else {
        overlay.classList.remove("active");
        isViewerOpen = false;
        viewerActiveSlot = null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const bookElement = document.getElementById("book");
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");
    const soundToggle = document.getElementById("sound-toggle");
    const iconOn = soundToggle.querySelector(".sound-icon-on");
    const iconOff = soundToggle.querySelector(".sound-icon-off");

    let isMuted = false;
    let pageFlip = null;

    // 1. Initialize St.PageFlip
    try {
        pageFlip = new St.PageFlip(bookElement, {
            width: 550, // Base page width
            height: 800, // Base page height
            size: "stretch",
            minWidth: 315,
            maxWidth: 1000,
            minHeight: 420,
            maxHeight: 1350,
            drawShadow: true,
            maxShadowOpacity: 0.4, // Aumenta levemente contraste da sombra
            showCover: true,
            mobileScrollSupport: true,
            useMouseEvents: false, // Desativa gestos padrão do StPageFlip para evitar cliques indesejados nas bordas/páginas
            showPageCorners: false, // Remove dobras dos cantos no hover
            disableFlipByClick: true, // Garante que a virada por cliques simples esteja desativada
            flippingTime: 800 // Transição mais ágil e snappier (800ms em vez de 1000ms)
        });

        // Load pages from HTML
        pageFlip.loadFromHTML(document.querySelectorAll(".page"));

        // Estado de arraste personalizado
        let activeDragPage = null;
        let isClicking = false;
        let startX = 0;
        let startY = 0;
        let dragStarted = false;

        // Monitora o mousedown/touchstart em cada página para iniciar a intenção de arraste
        document.querySelectorAll(".page").forEach((page, index) => {
            page.addEventListener("mousedown", (e) => {
                if (isViewerOpen || isAnimatingReturn || isAnimatingPlacement || isDraggingSticker || e.target.closest("button") || e.target.closest("a") || e.target.closest("#deck-panel") || e.target.closest(".deck-card, .deck-sticker, .sticker-img") || e.target.closest("#sticker-viewer-overlay")) return;
                isClicking = true;
                startX = e.clientX;
                startY = e.clientY;
                dragStarted = false;
                activeDragPage = { page, index };
            });

            page.addEventListener("touchstart", (e) => {
                if (isViewerOpen || isAnimatingReturn || isAnimatingPlacement || isDraggingSticker || e.target.closest("button") || e.target.closest("a") || e.target.closest("#deck-panel") || e.target.closest(".deck-card, .deck-sticker, .sticker-img") || e.target.closest("#sticker-viewer-overlay")) return;
                const touch = e.touches[0];
                isClicking = true;
                startX = touch.clientX;
                startY = touch.clientY;
                dragStarted = false;
                activeDragPage = { page, index };
            });
        });

        // Executa o movimento de dobra apenas se o mouse/dedo se mover além de um limiar (threshold)
        const handleMove = (clientX, clientY, isTouch = false) => {
            if (isViewerOpen || isAnimatingReturn || isAnimatingPlacement || isDraggingSticker || !isClicking || !activeDragPage) return;

            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            const bookRect = bookElement.getBoundingClientRect();

            // Só ativa o flip se mover mais de 10px (evita disparar ao clicar e soltar estático)
            if (distance > 10 && !dragStarted) {
                dragStarted = true;
                let cornerX, cornerY;

                // Determina canto vertical (topo vs base) em coordenadas relativas ao livro
                const centerY = bookRect.top + bookRect.height / 2;
                if (startY < centerY) {
                    cornerY = 0; // Canto superior
                } else {
                    cornerY = bookRect.height; // Canto inferior
                }

                // Determina canto horizontal (direita vs esquerda) em coordenadas relativas ao livro
                if (activeDragPage.index % 2 === 0) {
                    cornerX = bookRect.width; // Canto direito
                } else {
                    cornerX = 0; // Canto esquerdo
                }

                document.body.classList.add("dragging");
                pageFlip.startUserTouch({ x: cornerX, y: cornerY });
            }

            if (dragStarted) {
                const relX = clientX - bookRect.left;
                const relY = clientY - bookRect.top;
                pageFlip.userMove({ x: relX, y: relY }, isTouch);
            }
        };

        const handleRelease = (clientX, clientY, isTouch = false) => {
            if (dragStarted) {
                const bookRect = bookElement.getBoundingClientRect();
                const relX = clientX - bookRect.left;
                const relY = clientY - bookRect.top;
                pageFlip.userStop({ x: relX, y: relY }, isTouch);
            }
            isClicking = false;
            dragStarted = false;
            activeDragPage = null;
            document.body.classList.remove("dragging");
        };

        // Encerra com segurança uma dobra interrompida (cancelamento do SO,
        // troca de orientação, perda de foco ou mudança de aba).
        const cancelPageDrag = () => {
            if (!isClicking && !dragStarted) return;
            const bookRect = bookElement.getBoundingClientRect();
            const safeX = Math.max(0, Math.min(startX - bookRect.left, bookRect.width));
            const safeY = Math.max(0, Math.min(startY - bookRect.top, bookRect.height));

            if (dragStarted) {
                try {
                    pageFlip.userStop({ x: safeX, y: safeY }, true);
                } catch (error) {
                    console.warn("Não foi possível encerrar o gesto do PageFlip:", error);
                }
            }

            isClicking = false;
            dragStarted = false;
            activeDragPage = null;
            document.body.classList.remove("dragging");
        };

        window.addEventListener("mousemove", (e) => {
            handleMove(e.clientX, e.clientY, false);
        });

        window.addEventListener("touchmove", (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY, true);
            }
        });

        window.addEventListener("mouseup", (e) => {
            handleRelease(e.clientX, e.clientY, false);
        });

        window.addEventListener("touchend", (e) => {
            const touch = e.changedTouches[0] || e.touches[0];
            if (touch) {
                handleRelease(touch.clientX, touch.clientY, true);
            } else {
                handleRelease(startX, startY, true);
            }
        });

        window.addEventListener("touchcancel", cancelPageDrag, { passive: true });
        window.addEventListener("pointercancel", cancelPageDrag, { passive: true });
        window.addEventListener("blur", cancelPageDrag);
        window.addEventListener("resize", cancelPageDrag, { passive: true });
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) cancelPageDrag();
        });

        let mobileResizeTimer = null;
        const refreshMobileLayout = () => {
            cancelPageDrag();
            window.clearTimeout(mobileResizeTimer);
            mobileResizeTimer = window.setTimeout(() => {
                // Força nova medição do container pelo modo stretch sem
                // recriar o PageFlip nem alterar as dimensões-base das páginas.
                window.dispatchEvent(new Event("resize"));
            }, 120);
        };

        window.addEventListener("orientationchange", refreshMobileLayout);

        // Show book after successful initialization
        bookElement.style.display = "block";

        // Dia 3: Busca as figurinhas da API e preenche o álbum
        // A função é async, chamamos sem await para não bloquear a inicialização do álbum
        preencherFigurinhas();

    } catch (error) {
        console.error("Erro ao inicializar a biblioteca PageFlip:", error);
    }

    // 2. Sound Effect Generator (Web Audio API)
    function playPaperTurnSound() {
        if (isMuted) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const audioCtx = new AudioContext();
            const duration = 0.45; // seconds
            const sampleRate = audioCtx.sampleRate;
            const bufferSize = sampleRate * duration;
            const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
            const data = buffer.getChannelData(0);

            // Synthesize white noise with a custom page-flip volume envelope
            for (let i = 0; i < bufferSize; i++) {
                const progress = i / bufferSize;
                // Noise value between -1 and 1
                const noise = Math.random() * 2 - 1;

                // Volume envelope: smooth curve that peaks around 30% of the duration
                let envelope = 0;
                if (progress < 0.3) {
                    envelope = progress / 0.3; // Rapid ramp up
                } else {
                    envelope = (1 - progress) / 0.7; // Smooth decay
                }

                // Add minor irregular spikes to simulate paper friction/crackle
                const paperCrackle = Math.random() > 0.985 ? (Math.random() * 2 - 1) * 0.35 : 0;

                data[i] = (noise * 0.65 + paperCrackle) * envelope * 0.12;
            }

            // Create nodes
            const noiseNode = audioCtx.createBufferSource();
            noiseNode.buffer = buffer;

            // Bandpass filter to extract the "whoosh" sound of paper shuffling
            const bandpassFilter = audioCtx.createBiquadFilter();
            bandpassFilter.type = "bandpass";
            bandpassFilter.Q.value = 2.0;

            // Dynamic frequency sweep: starts at 1500Hz, sweeps down to 350Hz (sound of page moving away)
            bandpassFilter.frequency.setValueAtTime(1500, audioCtx.currentTime);
            bandpassFilter.frequency.exponentialRampToValueAtTime(350, audioCtx.currentTime + duration);

            // Lowpass filter to remove harsh high-frequency digital artifacts
            const lowpassFilter = audioCtx.createBiquadFilter();
            lowpassFilter.type = "lowpass";
            lowpassFilter.frequency.setValueAtTime(3800, audioCtx.currentTime);

            // Connect graph: Source -> Bandpass -> Lowpass -> Destination
            noiseNode.connect(bandpassFilter);
            bandpassFilter.connect(lowpassFilter);
            lowpassFilter.connect(audioCtx.destination);

            noiseNode.start();
        } catch (e) {
            console.warn("Falha ao tocar som de virada de página:", e);
        }
    }

    // 3. Audio State Controls
    soundToggle.addEventListener("click", () => {
        isMuted = !isMuted;
        if (isMuted) {
            iconOn.classList.add("hidden");
            iconOff.classList.remove("hidden");
        } else {
            iconOn.classList.remove("hidden");
            iconOff.classList.add("hidden");
        }
    });

    // 4. Navigation controls and events
    if (pageFlip) {
        // Play turn sound when page starts flipping
        pageFlip.on("changeState", (e) => {
            if (e.data === "flipping") {
                playPaperTurnSound();
            }
        });

        // Discrete arrow toggle depending on current page
        // 5. Partículas Dinâmicas por Categoria
        function updatePageParticles(currentPage) {
            // Remove containers antigos de efeitos
            document.querySelectorAll(".page-effects-container").forEach(el => el.remove());

            const totalPages = pageFlip.getPageCount();
            const pages = document.querySelectorAll(".page");

            const addParticles = (pageIdx) => {
                if (pageIdx < 0 || pageIdx >= totalPages) return;
                const pageEl = pages[pageIdx];
                if (!pageEl) return;

                const contentEl = pageEl.querySelector(".page-content");
                if (!contentEl) return;

                // Determina o tipo de partícula baseado na classe de tema da página
                let theme = "";
                if (pageEl.classList.contains("theme-lendas")) theme = "lendas";
                else if (pageEl.classList.contains("theme-guerreiros")) theme = "guerreiros";
                else if (pageEl.classList.contains("theme-sistema")) theme = "sistema";
                else if (pageEl.classList.contains("theme-mentes-aventura")) theme = "mentes-aventura";
                else if (pageEl.classList.contains("theme-nova-sombrio-lenda")) theme = "nova-sombrio-lenda";
                else if (pageEl.classList.contains("theme-filmes")) theme = "filmes";
                else return;

                const container = document.createElement("div");
                container.className = "page-effects-container";
                contentEl.appendChild(container);

                // Cria as partículas específicas do tema
                let particleCount = 15;
                if (theme === "filmes") particleCount = 20;

                for (let i = 0; i < particleCount; i++) {
                    const particle = document.createElement("div");
                    particle.style.position = "absolute";
                    particle.style.borderRadius = "50%";
                    particle.style.pointerEvents = "none";

                    // Configuração padrão
                    let delay = Math.random() * 5;
                    let duration = 3 + Math.random() * 4;
                    let size = 2 + Math.random() * 4;
                    let left = Math.random() * 100;

                    particle.style.width = `${size}px`;
                    particle.style.height = `${size}px`;
                    particle.style.left = `${left}%`;
                    particle.style.bottom = `-${size}px`;
                    particle.style.opacity = Math.random() * 0.7 + 0.1;

                    // Configurações temáticas
                    if (theme === "lendas") {
                        // Partículas douradas flutuando para cima
                        particle.style.background = "radial-gradient(circle, #ffe699 0%, #e5c158 100%)";
                        particle.style.boxShadow = "0 0 8px #e5c158";
                        particle.animate([
                            { transform: "translateY(0) scale(1)", opacity: 0.8 },
                            { transform: `translate(${Math.random() * 60 - 30}px, -700px) scale(0.2)`, opacity: 0 }
                        ], {
                            duration: duration * 1000,
                            delay: delay * 1000,
                            iterations: Infinity,
                            easing: "ease-out"
                        });
                    }
                    else if (theme === "guerreiros") {
                        // Faíscas de fogo vermelhas/laranja (sobe rápido)
                        particle.style.background = "radial-gradient(circle, #ffaa00 0%, #ff3300 100%)";
                        particle.style.boxShadow = "0 0 10px #ff5500";
                        particle.animate([
                            { transform: "translateY(0) scale(1.2) rotate(0deg)", opacity: 0.9 },
                            { transform: `translate(${Math.random() * 100 - 50}px, -700px) scale(0.1) rotate(${Math.random() * 360}deg)`, opacity: 0 }
                        ], {
                            duration: (duration * 0.6) * 1000,
                            delay: delay * 1000,
                            iterations: Infinity,
                            easing: "ease-in-out"
                        });
                    }
                    else if (theme === "sistema") {
                        // Quadrados roxos/azuis simulando dados digitais
                        particle.style.borderRadius = "2px";
                        particle.style.background = Math.random() > 0.5 ? "#a04ef6" : "#1f53e5";
                        particle.style.boxShadow = "0 0 6px rgba(160, 78, 246, 0.5)";
                        particle.animate([
                            { transform: "translateY(0) scale(1) rotate(0deg)", opacity: 0.6 },
                            { transform: `translate(${Math.random() * 40 - 20}px, -700px) scale(0.5) rotate(180deg)`, opacity: 0 }
                        ], {
                            duration: duration * 1000,
                            delay: delay * 1000,
                            iterations: Infinity,
                            easing: "linear"
                        });
                    }
                    else if (theme === "mentes-aventura") {
                        // Mistura de folhas verdes suaves e estrelas de aventura
                        if (Math.random() > 0.5) {
                            // Estrela de aventura vermelha
                            particle.style.background = "#e74c3c";
                            particle.style.clipPath = "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
                            particle.style.boxShadow = "0 0 6px #e74c3c";
                        } else {
                            // Folhas verdes
                            particle.style.borderRadius = "80% 0 80% 0";
                            particle.style.background = "#2ecc71";
                            particle.style.boxShadow = "0 0 4px #2ecc71";
                        }
                        particle.animate([
                            { transform: `translateY(0) scale(1) rotate(${Math.random() * 45}deg)`, opacity: 0.7 },
                            { transform: `translate(${Math.random() * 80 - 40}px, -700px) scale(0.3) rotate(${360 + Math.random() * 360}deg)`, opacity: 0 }
                        ], {
                            duration: duration * 1000,
                            delay: delay * 1000,
                            iterations: Infinity,
                            easing: "ease-out"
                        });
                    }
                    else if (theme === "nova-sombrio-lenda") {
                        // Mashup de efeitos (neon, mist e bolhas)
                        const rand = Math.random();
                        if (rand < 0.33) {
                            // Neon Glitch (ciano)
                            particle.style.background = "#00ffff";
                            particle.style.boxShadow = "0 0 8px #00ffff";
                            particle.style.borderRadius = "0";
                            particle.animate([
                                { transform: "translateY(0) skewX(0deg)", opacity: 0.7 },
                                { transform: `translate(${Math.random() * 100 - 50}px, -700px) skewX(20deg)`, opacity: 0 }
                            ], {
                                duration: duration * 0.8 * 1000,
                                delay: delay * 1000,
                                iterations: Infinity
                            });
                        } else if (rand < 0.66) {
                            // Sombrio (névoa vermelha escura)
                            particle.style.background = "#ff0055";
                            particle.style.boxShadow = "0 0 15px #ff0055";
                            particle.style.width = `${size * 2 + 5}px`;
                            particle.style.height = `${size * 2 + 5}px`;
                            particle.animate([
                                { transform: "translateY(0) scale(0.8)", opacity: 0.4 },
                                { transform: `translate(${Math.random() * 120 - 60}px, -700px) scale(2)`, opacity: 0 }
                            ], {
                                duration: duration * 1.2 * 1000,
                                delay: delay * 1000,
                                iterations: Infinity,
                                easing: "ease-in"
                            });
                        } else {
                            // Ocean/One Piece (bolhas suaves de água)
                            particle.style.background = "transparent";
                            particle.style.border = "1.5px solid rgba(0, 136, 255, 0.6)";
                            particle.style.boxShadow = "inset 0 0 4px rgba(0, 136, 255, 0.4)";
                            particle.style.width = `${size + 4}px`;
                            particle.style.height = `${size + 4}px`;
                            particle.animate([
                                { transform: "translateY(0) translateX(0)", opacity: 0.6 },
                                { transform: `translate(${Math.sin(i) * 30}px, -700px)`, opacity: 0 }
                            ], {
                                duration: duration * 1.1 * 1000,
                                delay: delay * 1000,
                                iterations: Infinity,
                                easing: "ease-out"
                            });
                        }
                    }
                    else if (theme === "filmes") {
                        // Brilho estelar suave ou poeira flutuante
                        particle.style.background = "radial-gradient(circle, #ffffff 0%, rgba(255,255,255,0) 100%)";
                        particle.style.boxShadow = "0 0 10px rgba(255,255,255,0.8)";
                        particle.style.width = `${size + 2}px`;
                        particle.style.height = `${size + 2}px`;

                        const dirY = Math.random() > 0.5 ? -1 : 1;
                        particle.style.bottom = "";
                        particle.style.top = dirY === 1 ? `-${size + 5}px` : "";
                        particle.style.bottom = dirY === -1 ? `-${size + 5}px` : "";

                        particle.animate([
                            { transform: `translate(0, 0) scale(1)`, opacity: 0.1 },
                            { transform: `translate(${Math.random() * 120 - 60}px, ${dirY * 750}px) scale(0.3)`, opacity: 0.8 },
                            { transform: `translate(${Math.random() * 200 - 100}px, ${dirY * 820}px) scale(0.1)`, opacity: 0 }
                        ], {
                            duration: (duration + 4) * 1000,
                            delay: delay * 1000,
                            iterations: Infinity,
                            easing: "ease-in-out"
                        });
                    }
                }
            };

            if (currentPage === 0) {
                addParticles(0);
            } else if (currentPage === totalPages - 1) {
                addParticles(totalPages - 1);
            } else {
                addParticles(currentPage);
                addParticles(currentPage + 1);
            }
        }

        pageFlip.on("flip", (e) => {
            const currentPage = e.data;
            const totalPages = pageFlip.getPageCount();

            // Hide left button on cover page
            if (currentPage === 0) {
                btnPrev.classList.add("hidden");
            } else {
                btnPrev.classList.remove("hidden");
            }

            // Hide right button on back cover
            if (currentPage === totalPages - 1) {
                btnNext.classList.add("hidden");
            } else {
                btnNext.classList.remove("hidden");
            }

            // Atualiza as partículas dinâmicas no flip
            updatePageParticles(currentPage);
        });

        // Click events for navigational arrows
        btnPrev.addEventListener("click", () => {
            pageFlip.flipPrev();
        });

        btnNext.addEventListener("click", () => {
            pageFlip.flipNext();
        });

        // Keyboard events for navigational arrows
        document.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") {
                pageFlip.flipPrev();
            } else if (e.key === "ArrowRight") {
                pageFlip.flipNext();
            }
        });

        // Hide left button initially since start page is 0
        btnPrev.classList.add("hidden");

        // Inicializa as partículas na capa
        updatePageParticles(0);
    }
});


// ===================================================
// INTERAÇÃO DA CAPA: brilho, inclinação e retorno vertical
// ===================================================
function inicializarCapaAnime() {
    const cover = document.querySelector('.anime-cover');
    if (!cover) return;

    const cards = [...cover.querySelectorAll('.cover-card')];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    cards.forEach((card) => {
        card.addEventListener('pointerenter', () => {
            cards.forEach((other) => other.classList.toggle('is-dimmed', other !== card));
        });
        card.addEventListener('pointerleave', () => {
            cards.forEach((other) => other.classList.remove('is-dimmed'));
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
        });

        if (!reducedMotion && finePointer) {
            card.addEventListener('pointermove', (event) => {
                const rect = card.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width - 0.5;
                const y = (event.clientY - rect.top) / rect.height - 0.5;
                card.style.setProperty('--ry', `${x * 12}deg`);
                card.style.setProperty('--rx', `${-y * 10}deg`);
            });
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarCapaAnime, { once: true });
} else {
    inicializarCapaAnime();
}
