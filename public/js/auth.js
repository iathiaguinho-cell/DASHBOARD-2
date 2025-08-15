// auth.js
// Gerencia a autenticação de usuários e perfis.

const Auth = (() => {
    const USERS = [
        { name: 'Augusto', role: 'Gestor' },
        { name: 'William Barbosa', role: 'Atendente' },
        { name: 'Thiago Ventura Valencio', role: 'Atendente' },
        { name: 'Fernando', role: 'Mecânico' },
        { name: 'Gustavo', role: 'Mecânico' },
        { name: 'Marcelo', role: 'Mecânico' }
    ];

    let currentUser = null;

    const init = () => {
        renderUserList();
        // Tenta carregar o usuário da sessão anterior
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            showApp();
        }
    };

    const renderUserList = () => {
        const userListDiv = document.getElementById('userList');
        userListDiv.innerHTML = '';
        USERS.forEach(user => {
            const button = document.createElement('button');
            button.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105';
            button.textContent = user.name;
            button.onclick = () => login(user);
            userListDiv.appendChild(button);
        });
    };

    const login = (user) => {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showApp();
        UI.showNotification(`Bem-vindo, ${currentUser.name}!`);
    };

    const logout = () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('app').classList.add('hidden');
        document.getElementById('userScreen').classList.remove('hidden');
        UI.showNotification('Você foi desconectado.');
    };

    const showApp = () => {
        document.getElementById('userScreen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('currentUserName').textContent = currentUser.name;
        UI.populateResponsibleSelect(USERS);
    };

    const getCurrentUser = () => currentUser;
    const getUsers = () => USERS;

    return {
        init,
        login,
        logout,
        getCurrentUser,
        getUsers
    };
})();


