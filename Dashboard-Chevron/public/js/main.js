// main.js
// Este é o arquivo principal que orquestra a aplicação.

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a autenticação e carrega os usuários
    Auth.init();

    // Event Listeners Globais
    document.getElementById('logoutButton').addEventListener('click', Auth.logout);
    document.getElementById('addOSBtn').addEventListener('click', UI.openOsModal);

    // Fechar modais ao clicar fora ou no botão de fechar
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                UI.closeModal(modal.id);
            }
        });
    });
    document.querySelectorAll('.btn-close-modal').forEach(button => {
        button.addEventListener('click', (event) => {
            const modalId = event.target.closest('.modal').id;
            UI.closeModal(modalId);
        });
    });

    // Submissão do formulário de nova/edição de OS
    document.getElementById('osForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const osId = document.getElementById('osId').value;
        const osData = {
            placa: document.getElementById('osPlaca').value.toUpperCase(),
            modelo: document.getElementById('osModelo').value,
            cliente: document.getElementById('osCliente').value,
            telefone: document.getElementById('osTelefone').value,
            km: parseInt(document.getElementById('osKm').value) || 0,
            responsible: document.getElementById('osResponsavel').value,
            observacoes: document.getElementById('osObservacoes').value,
            lastUpdate: new Date().toISOString()
        };

        try {
            await FirebaseService.saveOrUpdateOS(osData, osId);
            UI.showNotification(`O.S. ${osId ? 'atualizada' : 'criada'} com sucesso!`);
            UI.closeModal('osModal');
        } catch (error) {
            console.error("Erro ao salvar O.S.:", error);
            UI.showNotification("Erro ao salvar O.S.", 'error');
        }
    });

    // Submissão do formulário de log de timeline
    document.getElementById('logForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const osId = document.getElementById('logOsId').value;
        const description = document.getElementById('logDescricao').value;
        const pecas = document.getElementById('logPecas').value;
        const valor = parseFloat(document.getElementById('logValor').value) || 0;
        const user = Auth.getCurrentUser();

        if (!user) {
            UI.showNotification("Usuário não logado.", 'error');
            return;
        }

        const logEntry = {
            type: 'log',
            description: description,
            pecas: pecas,
            valor: valor,
            user: user.name,
            timestamp: new Date().toISOString()
        };

        try {
            await FirebaseService.addTimelineLog(osId, logEntry);
            UI.showNotification("Atualização adicionada ao histórico!");
            document.getElementById('logForm').reset();
            document.getElementById('fileName').textContent = '';
            UI.showPostLogActions();

            // Lidar com upload de mídia
            const mediaInput = document.getElementById('media-input');
            if (mediaInput.files.length > 0) {
                UI.showNotification(`Enviando ${mediaInput.files.length} arquivo(s)...`);
                await FirebaseService.uploadMedia(mediaInput.files, (uploaded, total) => {
                    UI.showNotification(`Enviando ${uploaded}/${total} arquivo(s)...`);
                });
                UI.showNotification("Mídia enviada com sucesso!");
                mediaInput.value = ''; // Limpa o input de arquivo
            }

            // Atualiza o modal de detalhes para refletir as mudanças
            FirebaseService.fetchSingleOS(osId, UI.populateDetailsModal);

        } catch (error) {
            console.error("Erro ao adicionar log ou enviar mídia:", error);
            UI.showNotification("Erro ao adicionar atualização ou enviar mídia.", 'error');
        }
    });

    // Submissão do formulário de atualização de KM
    document.getElementById('kmUpdateForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const osId = document.getElementById('logOsId').value; // Usa o ID da OS do logForm
        const newKm = document.getElementById('updateKmInput').value;
        const user = Auth.getCurrentUser();

        if (!user) {
            UI.showNotification("Usuário não logado.", 'error');
            return;
        }

        if (newKm) {
            try {
                await FirebaseService.updateKm(osId, newKm, user);
                UI.showNotification("KM atualizado com sucesso!");
                document.getElementById('updateKmInput').value = '';
                // Atualiza o modal de detalhes para refletir as mudanças
                FirebaseService.fetchSingleOS(osId, UI.populateDetailsModal);
            } catch (error) {
                console.error("Erro ao atualizar KM:", error);
                UI.showNotification("Erro ao atualizar KM.", 'error');
            }
        }
    });

    // Botões de ação pós-log
    document.getElementById('btn-move-next').addEventListener('click', () => {
        const osId = document.getElementById('logOsId').value;
        const currentOS = App.getServiceOrderById(osId);
        if (currentOS) {
            const currentIndex = App.STATUS_LIST.indexOf(currentOS.status);
            if (currentIndex < App.STATUS_LIST.length - 1) {
                const newStatus = App.STATUS_LIST[currentIndex + 1];
                FirebaseService.updateServiceOrderStatus(osId, newStatus, Auth.getCurrentUser());
                UI.showNotification(`O.S. ${currentOS.placa} movida para ${UI.formatStatus(newStatus)}`);
                UI.hidePostLogActions();
                UI.closeModal('detailsModal');
            }
        }
    });

    document.getElementById('btn-move-prev').addEventListener('click', () => {
        const osId = document.getElementById('logOsId').value;
        const currentOS = App.getServiceOrderById(osId);
        if (currentOS) {
            const currentIndex = App.STATUS_LIST.indexOf(currentOS.status);
            if (currentIndex > 0) {
                const newStatus = App.STATUS_LIST[currentIndex - 1];
                FirebaseService.updateServiceOrderStatus(osId, newStatus, Auth.getCurrentUser());
                UI.showNotification(`O.S. ${currentOS.placa} movida para ${UI.formatStatus(newStatus)}`);
                UI.hidePostLogActions();
                UI.closeModal('detailsModal');
            }
        }
    });

    document.getElementById('btn-stay').addEventListener('click', () => {
        UI.showNotification("O.S. atualizada sem mudança de status.");
        UI.hidePostLogActions();
        UI.closeModal('detailsModal');
    });

    // Botão de exclusão de OS
    document.getElementById('deleteOsBtn').addEventListener('click', async () => {
        const osId = document.getElementById('logOsId').value;
        if (confirm(`Tem certeza que deseja excluir a O.S. ${App.getServiceOrderById(osId).placa}? Esta ação é irreversível.`)) {
            try {
                await FirebaseService.deleteOS(osId);
                UI.showNotification("O.S. excluída com sucesso!");
                UI.closeModal('detailsModal');
            } catch (error) {
                console.error("Erro ao excluir O.S.:", error);
                UI.showNotification("Erro ao excluir O.S.", 'error');
            }
        }
    });

    // Toggle do painel de atenção
    document.getElementById('toggle-panel-btn').addEventListener('click', UI.toggleAttentionPanel);

    // Eventos para upload de mídia
    document.getElementById('openCameraBtn').addEventListener('click', () => {
        document.getElementById('media-input').setAttribute('capture', 'environment');
        document.getElementById('media-input').click();
    });

    document.getElementById('openGalleryBtn').addEventListener('click', () => {
        document.getElementById('media-input').removeAttribute('capture');
        document.getElementById('media-input').click();
    });

    document.getElementById('media-input').addEventListener('change', (event) => {
        filesToUpload = event.target.files;
        if (filesToUpload.length > 0) {
            document.getElementById('fileName').textContent = `${filesToUpload.length} arquivo(s) selecionado(s)`;
        } else {
            document.getElementById('fileName').textContent = '';
        }
    });

    // Lightbox controls
    document.getElementById('lightbox-close').addEventListener('click', UI.closeLightbox);
    document.getElementById('lightbox-close-bg').addEventListener('click', UI.closeLightbox);
    document.getElementById('lightbox-prev').addEventListener('click', UI.showPrevMedia);
    document.getElementById('lightbox-next').addEventListener('click', UI.showNextMedia);
    document.getElementById('lightbox-copy').addEventListener('click', UI.copyMediaLink);

    // Objeto global App para acesso a dados e funções comuns
    window.App = {
        allServiceOrders: {},
        STATUS_LIST: [
            'Aguardando-Mecanico', 'Em-Analise', 'Orcamento-Enviado', 'Aguardando-Aprovacao',
            'Servico-Autorizado', 'Em-Execucao', 'Finalizado-Aguardando-Retirada', 'Entregue'
        ],
        ATTENTION_STATUSES: {
            'Aguardando-Mecanico': { label: 'AGUARDANDO MECÂNICO', color: 'yellow' },
            'Servico-Autorizado': { label: 'SERVIÇO AUTORIZADO', color: 'green' },
            'Finalizado-Aguardando-Retirada': { label: 'FINALIZADO - AGUARDANDO RETIRADA', color: 'orange' }
        },
        getServiceOrderById: (id) => App.allServiceOrders[id],
        setServiceOrders: (orders) => { App.allServiceOrders = orders; UI.renderKanban(orders); UI.updateAttentionPanel(orders); }
    };

    // Inicia a escuta do Firebase
    FirebaseService.listenToServiceOrders(App.setServiceOrders);
});


