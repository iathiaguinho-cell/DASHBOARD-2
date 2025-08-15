// ui.js
// Gerencia toda a interação com a interface do usuário (DOM).

const UI = (() => {
    const osModal = document.getElementById("osModal");
    const detailsModal = document.getElementById("detailsModal");
    const kanbanBoard = document.getElementById("kanbanBoard");
    const attentionPanelContainer = document.getElementById("attention-panel-container");
    const attentionPanel = document.getElementById("attention-panel");
    const alertLed = document.getElementById("alert-led");
    const lightbox = document.getElementById("lightbox");
    const lightboxContent = document.getElementById("lightbox-content");
    const lightboxDownload = document.getElementById("lightbox-download");
    const osResponsavelSelect = document.getElementById("osResponsavel");
    const postLogActions = document.getElementById("post-log-actions");

    let currentLightboxMedia = [];
    let currentLightboxIndex = 0;

    // Função para mostrar notificações temporárias
    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }, 4000);
    };

    // Abre um modal específico
    const openModal = (modalId) => {
        document.getElementById(modalId).classList.remove("hidden");
        document.getElementById(modalId).classList.add("flex");
    };

    // Fecha um modal específico
    const closeModal = (modalId) => {
        document.getElementById(modalId).classList.add("hidden");
        document.getElementById(modalId).classList.remove("flex");
        // Resetar formulários ao fechar
        if (modalId === 'osModal') {
            document.getElementById('osForm').reset();
            document.getElementById('osId').value = '';
            document.getElementById('osModalTitle').textContent = 'Nova Ordem de Serviço';
        } else if (modalId === 'detailsModal') {
            document.getElementById('logForm').reset();
            document.getElementById('kmUpdateForm').reset();
            document.getElementById('fileName').textContent = '';
            hidePostLogActions();
        }
    };

    // Abre o modal de nova/edição de OS
    const openOsModal = (os = null) => {
        if (os) {
            document.getElementById("osModalTitle").textContent = "Editar Ordem de Serviço";
            document.getElementById("osId").value = os.id;
            document.getElementById("osPlaca").value = os.placa;
            document.getElementById("osModelo").value = os.modelo;
            document.getElementById("osCliente").value = os.cliente;
            document.getElementById("osTelefone").value = os.telefone;
            document.getElementById("osKm").value = os.km;
            document.getElementById("osObservacoes").value = os.observacoes;
            document.getElementById("osResponsavel").value = os.responsible;
        } else {
            document.getElementById("osModalTitle").textContent = "Nova Ordem de Serviço";
            document.getElementById("osId").value = "";
            document.getElementById("osForm").reset();
        }
        openModal("osModal");
    };

    // Popula o select de responsáveis
    const populateResponsibleSelect = (users) => {
        osResponsavelSelect.innerHTML = 
            '<option value="" disabled selected>Selecione o Responsável</option>';
        users.forEach(user => {
            const option = document.createElement("option");
            option.value = user.name;
            option.textContent = user.name;
            osResponsavelSelect.appendChild(option);
        });
    };

    // Renderiza o Kanban Board
    const renderKanban = (serviceOrders) => {
        kanbanBoard.innerHTML = "";
        App.STATUS_LIST.forEach(status => {
            const column = document.createElement("div");
            column.className = "status-column p-4 shadow-md";
            column.innerHTML = `
                <h3 class="text-lg font-semibold text-gray-700 mb-4 flex items-center justify-between">
                    <span>${formatStatus(status)}</span>
                    <span class="text-sm font-normal text-gray-500">(${Object.values(serviceOrders).filter(os => os.status === status).length})</span>
                </h3>
                <div class="vehicle-list flex-grow mt-2 space-y-3" id="column-${status}"></div>
            `;
            kanbanBoard.appendChild(column);

            const vehicleList = column.querySelector(".vehicle-list");
            Object.values(serviceOrders)
                .filter(os => os.status === status)
                .sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate))
                .forEach(os => {
                    const card = document.createElement("div");
                    card.className = `vehicle-card status-${os.status} cursor-pointer`;
                    card.setAttribute("data-id", os.id);
                    card.innerHTML = `
                        <p class="text-sm text-gray-500">${formatDate(os.entryDate)}</p>
                        <h4 class="text-md font-bold text-gray-800">${os.placa} - ${os.modelo}</h4>
                        <p class="text-sm text-gray-600">${os.cliente}</p>
                        <p class="text-xs text-gray-500">Resp: ${os.responsible}</p>
                    `;
                    card.addEventListener("click", () => populateDetailsModal(os));
                    vehicleList.appendChild(card);
                });
        });
    };

    // Popula e abre o modal de detalhes da OS
    const populateDetailsModal = (os) => {
        document.getElementById("detailsPlacaModelo").textContent = `${os.placa} - ${os.modelo}`;
        document.getElementById("detailsCliente").textContent = os.cliente;
        document.getElementById("detailsKm").textContent = `KM: ${new Intl.NumberFormat('pt-BR').format(os.km || 0)}`;
        document.getElementById("logOsId").value = os.id;
        document.getElementById("updateKmInput").value = os.km || '';

        // Responsáveis
        const responsiblesContainer = document.getElementById("responsiblesContainer");
        responsiblesContainer.innerHTML = `
            <div><span class="font-semibold">Entrada:</span> ${os.responsible}</div>
            <div><span class="font-semibold">Orçamento:</span> ${os.responsibleForBudget || 'N/A'}</div>
            <div><span class="font-semibold">Serviço:</span> ${os.responsibleForService || 'N/A'}</div>
            <div><span class="font-semibold">Entrega:</span> ${os.responsibleForDelivery || 'N/A'}</div>
        `;

        // Galeria de Mídia
        const thumbnailGrid = document.getElementById("thumbnail-grid");
        thumbnailGrid.innerHTML = '';
        currentLightboxMedia = [];
        if (os.media && Object.keys(os.media).length > 0) {
            document.getElementById("media-gallery-container").classList.remove("hidden");
            Object.values(os.media).forEach((mediaItem, index) => {
                currentLightboxMedia.push(mediaItem);
                const thumb = document.createElement("img");
                thumb.src = mediaItem.thumbnailUrl || mediaItem.url; // Usa thumbnail se disponível
                thumb.alt = "Mídia da OS";
                thumb.className = "w-full h-20 object-cover rounded-md cursor-pointer";
                thumb.addEventListener("click", () => openLightbox(index));
                thumbnailGrid.appendChild(thumb);
            });
        } else {
            document.getElementById("media-gallery-container").classList.add("hidden");
        }

        // Timeline
        const timelineContainer = document.getElementById("timelineContainer");
        timelineContainer.innerHTML = "";
        if (os.timeline) {
            Object.values(os.timeline)
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                .forEach(log => {
                    const item = document.createElement("div");
                    item.className = `timeline-item timeline-item-${log.type}`;
                    let iconClass = '';
                    let descriptionHtml = log.description;

                    if (log.type === 'status') {
                        iconClass = 'bx bx-refresh';
                    } else if (log.type === 'log') {
                        iconClass = 'bx bx-notepad';
                        if (log.pecas) descriptionHtml += `<br>Peças: ${log.pecas}`;
                        if (log.valor) descriptionHtml += `<br>Valor: R$ ${log.valor.toFixed(2).replace('.', ',')}`;
                    } else if (log.type === 'media') {
                        iconClass = 'bx bx-image';
                        descriptionHtml += `<br><a href="${log.url}" target="_blank" class="text-blue-500 hover:underline">Ver Mídia</a>`;
                    }

                    item.innerHTML = `
                        <div class="timeline-icon"><i class=\'${iconClass}\'></i></div>
                        <p class="text-sm text-gray-500">${formatDateTime(log.timestamp)} por ${log.user}</p>
                        <p class="text-gray-800 font-medium">${descriptionHtml}</p>
                    `;
                    timelineContainer.appendChild(item);
                });
        }

        openModal("detailsModal");
    };

    // Abre o lightbox de mídia
    const openLightbox = (index) => {
        currentLightboxIndex = index;
        renderLightboxMedia();
        lightbox.classList.remove("hidden");
        lightbox.classList.add("flex");
    };

    // Renderiza a mídia no lightbox
    const renderLightboxMedia = () => {
        lightboxContent.innerHTML = '';
        const mediaItem = currentLightboxMedia[currentLightboxIndex];
        if (!mediaItem) return;

        let mediaElement;
        if (mediaItem.url.match(/\.(jpeg|jpg|gif|png)$/i)) {
            mediaElement = document.createElement("img");
            mediaElement.src = mediaItem.url;
            mediaElement.alt = "Mídia";
        } else if (mediaItem.url.match(/\.(mp4|webm|ogg)$/i)) {
            mediaElement = document.createElement("video");
            mediaElement.src = mediaItem.url;
            mediaElement.controls = true;
            mediaElement.autoplay = true;
            mediaElement.loop = true;
        } else {
            mediaElement = document.createElement("p");
            mediaElement.textContent = "Formato de mídia não suportado.";
        }
        mediaElement.className = "max-h-full max-w-full object-contain rounded-lg";
        lightboxContent.appendChild(mediaElement);
        lightboxDownload.href = mediaItem.url;
    };

    // Fecha o lightbox
    const closeLightbox = () => {
        lightbox.classList.add("hidden");
        lightbox.classList.remove("flex");
        lightboxContent.innerHTML = '';
    };

    // Mostra a mídia anterior no lightbox
    const showPrevMedia = () => {
        currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxMedia.length) % currentLightboxMedia.length;
        renderLightboxMedia();
    };

    // Mostra a próxima mídia no lightbox
    const showNextMedia = () => {
        currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxMedia.length;
        renderLightboxMedia();
    };

    // Copia o link da mídia para a área de transferência
    const copyMediaLink = () => {
        const mediaItem = currentLightboxMedia[currentLightboxIndex];
        if (mediaItem && mediaItem.url) {
            navigator.clipboard.writeText(mediaItem.url).then(() => {
                showNotification("Link da mídia copiado!");
            }).catch(err => {
                console.error("Erro ao copiar link: ", err);
                showNotification("Erro ao copiar link.", 'error');
            });
        }
    };

    // Atualiza o painel de atenção
    const updateAttentionPanel = (serviceOrders) => {
        attentionPanel.innerHTML = '';
        let hasAlert = false;
        const attentionCounts = {};

        // Inicializa contadores
        for (const statusKey in App.ATTENTION_STATUSES) {
            attentionCounts[statusKey] = 0;
        }

        // Conta as OS por status de atenção
        Object.values(serviceOrders).forEach(os => {
            if (App.ATTENTION_STATUSES[os.status]) {
                attentionCounts[os.status]++;
                hasAlert = true;
            }
        });

        // Renderiza os boxes de atenção
        for (const statusKey in App.ATTENTION_STATUSES) {
            const statusInfo = App.ATTENTION_STATUSES[statusKey];
            const count = attentionCounts[statusKey];
            const box = document.createElement("div");
            box.className = `attention-box flex flex-col items-center justify-center p-2 rounded-lg text-white text-center ${count > 0 ? `bg-${statusInfo.color}-700 blinking-${statusInfo.color}` : 'bg-gray-700'}`;
            box.innerHTML = `
                <span class="text-xs sm:text-sm font-bold">${statusInfo.label}</span>
                <span class="text-xl sm:text-2xl font-extrabold">${count}</span>
            `;
            attentionPanel.appendChild(box);
        }

        // Atualiza o LED de alerta
        if (hasAlert) {
            alertLed.classList.remove("hidden");
        } else {
            alertLed.classList.add("hidden");
        }
    };

    // Alterna a visibilidade do painel de atenção
    const toggleAttentionPanel = () => {
        attentionPanelContainer.classList.toggle("collapsed");
        const icon = document.querySelector("#toggle-panel-btn i");
        if (attentionPanelContainer.classList.contains("collapsed")) {
            icon.classList.replace("bxs-chevron-up", "bxs-chevron-down");
        } else {
            icon.classList.replace("bxs-chevron-down", "bxs-chevron-up");
        }
    };

    // Mostra as ações pós-log (mover OS)
    const showPostLogActions = () => {
        postLogActions.classList.remove("hidden");
    };

    // Esconde as ações pós-log
    const hidePostLogActions = () => {
        postLogActions.classList.add("hidden");
    };

    // Funções de formatação
    const formatStatus = (status) => {
        return status.replace(/-/g, ' ');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return {
        showNotification,
        openModal,
        closeModal,
        openOsModal,
        populateResponsibleSelect,
        renderKanban,
        populateDetailsModal,
        openLightbox,
        closeLightbox,
        showPrevMedia,
        showNextMedia,
        copyMediaLink,
        updateAttentionPanel,
        toggleAttentionPanel,
        showPostLogActions,
        hidePostLogActions,
        formatStatus
    };
})();


