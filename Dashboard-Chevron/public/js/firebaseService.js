// Módulo de Serviço do Firebase
// Centraliza toda a comunicação com o Firebase.

const FirebaseService = (() => {
    // Inicializa o Firebase com as configurações do config.js
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // Escuta por mudanças nas Ordens de Serviço
    const listenToServiceOrders = (callback) => {
        db.ref('serviceOrders').on('value', snapshot => {
            const data = snapshot.val() || {};
            // Adiciona o ID a cada objeto OS para fácil referência
            Object.keys(data).forEach(id => data[id].id = id);
            callback(data);
        }, error => {
            console.error("Erro de conexão com o banco de dados:", error);
            UI.showNotification("Erro de conexão com o banco de dados.", 'error');
        });
    };

    // Atualiza o status de uma OS e adiciona um log no timeline
    const updateServiceOrderStatus = (osId, newStatus, user) => {
        const os = App.getServiceOrderById(osId);
        if (!os) return;

        const updates = { status: newStatus, lastUpdate: new Date().toISOString() };
        
        // Atribui responsabilidade baseada no novo status
        if (newStatus === 'Em-Analise') updates.responsibleForBudget = user.name;
        else if (newStatus === 'Em-Execucao') updates.responsibleForService = user.name;
        else if (newStatus === 'Entregue') updates.responsibleForDelivery = user.name;

        db.ref(`serviceOrders/${osId}`).update(updates);
        
        const logEntry = {
            type: 'status',
            description: `Status alterado para: ${UI.formatStatus(newStatus)}`,
            user: user.name,
            timestamp: new Date().toISOString()
        };
        addTimelineLog(osId, logEntry);
    };

    // Adiciona uma nova OS ou atualiza uma existente
    const saveOrUpdateOS = (osData, osId) => {
        if (osId) {
            // Atualiza OS existente
            return db.ref(`serviceOrders/${osId}`).update(osData);
        } else {
            // Cria nova OS
            osData.status = 'Aguardando-Mecanico';
            osData.entryDate = new Date().toISOString();
            const newOsRef = db.ref('serviceOrders').push(osData);
            const logEntry = { 
                type: 'status', 
                description: 'Ordem de Serviço criada.', 
                user: osData.responsible, // Usa o responsável inicial
                timestamp: new Date().toISOString() 
            };
            return newOsRef.child('timeline').push(logEntry);
        }
    };

    // Adiciona uma entrada de log no timeline de uma OS
    const addTimelineLog = (osId, logEntry) => {
        return db.ref(`serviceOrders/${osId}/timeline`).push(logEntry);
    };

    // Atualiza o KM de uma OS
    const updateKm = (osId, newKm, user) => {
        db.ref(`serviceOrders/${osId}/km`).set(parseInt(newKm));
        const logEntry = {
            type: 'log',
            description: `KM atualizado para ${new Intl.NumberFormat('pt-BR').format(newKm)} km`,
            user: user.name,
            timestamp: new Date().toISOString()
        };
        addTimelineLog(osId, logEntry);
    };

    // Deleta uma OS
    const deleteOS = (osId) => {
        return db.ref(`serviceOrders/${osId}`).remove();
    };

    // Busca uma OS específica uma vez (para re-renderizar modal, por exemplo)
    const fetchSingleOS = (osId, callback) => {
        db.ref(`serviceOrders/${osId}`).once('value', snapshot => {
            const os = snapshot.val();
            if (os) {
                os.id = osId;
                callback(os);
            }
        });
    };

    // Upload de arquivos de mídia para o ImgBB
    const uploadMedia = async (files, callback) => {
        if (imgbbApiKey === "SUA_API_KEY_DO_IMGBB" || !imgbbApiKey) {
            UI.showNotification("Configure sua chave de API do ImgBB no código.", 'error');
            throw new Error("Chave de API do ImgBB não configurada.");
        }

        const uploadPromises = Array.from(files).map(async (file, index) => {
            // callback(index + 1, files.length); // Callback para atualizar UI de progresso
            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
                method: "POST",
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                return { url: data.data.url, thumbnailUrl: data.data.thumb.url, deleteUrl: data.data.delete_url };
            } else {
                throw new Error(data.error.message);
            }
        });

        try {
            const uploadedMedia = await Promise.all(uploadPromises);
            const osId = document.getElementById("logOsId").value; // Assume que o ID da OS está no campo oculto
            const user = Auth.getCurrentUser();

            for (const mediaItem of uploadedMedia) {
                const logEntry = {
                    type: 'media',
                    description: `Mídia adicionada: ${mediaItem.url.split('/').pop()}`,
                    url: mediaItem.url,
                    thumbnailUrl: mediaItem.thumbnailUrl,
                    deleteUrl: mediaItem.deleteUrl,
                    user: user.name,
                    timestamp: new Date().toISOString()
                };
                await addTimelineLog(osId, logEntry);
            }
            return uploadedMedia;
        } catch (error) {
            console.error("Erro ao fazer upload de mídia:", error);
            throw error;
        }
    };

    return {
        listenToServiceOrders,
        updateServiceOrderStatus,
        saveOrUpdateOS,
        addTimelineLog,
        updateKm,
        deleteOS,
        fetchSingleOS,
        uploadMedia
    };
})();


