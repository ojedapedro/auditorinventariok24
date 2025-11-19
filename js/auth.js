// Módulo de autenticación
const Auth = {
    currentUser: null,
    
    // Inicializar módulo
    init: function() {
        this.loadUserSession();
        this.setupEventListeners();
    },
    
    // Cargar sesión de usuario
    loadUserSession: function() {
        const sessionData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_SESSION);
        if (sessionData) {
            this.currentUser = JSON.parse(sessionData);
        }
    },
    
    // Configurar event listeners
    setupEventListeners: function() {
        const loginForm = document.getElementById('loginForm');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }
    },
    
    // Manejar login
    handleLogin: function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginError = document.getElementById('loginError');
        
        if (this.authenticate(email, password)) {
            this.loginPage.classList.add('d-none');
            this.mainPage.classList.remove('d-none');
            loginError.classList.add('d-none');
            
            // Actualizar nombre de usuario en la interfaz
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = this.currentUser.name;
            }
            
            Utils.showNotification(`Bienvenido, ${this.currentUser.name}`, 'success');
        } else {
            loginError.classList.remove('d-none');
            Utils.showNotification('Credenciales incorrectas', 'error');
        }
    },
    
    // Autenticar usuario
    authenticate: function(email, password) {
        const user = CONFIG.USERS.find(u => u.email === email && u.password === password);
        if (user) {
            this.currentUser = { ...user };
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_SESSION, JSON.stringify(this.currentUser));
            return true;
        }
        return false;
    },
    
    // Manejar logout
    handleLogout: function(e) {
        e.preventDefault();
        
        this.currentUser = null;
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_SESSION);
        
        this.mainPage.classList.add('d-none');
        this.loginPage.classList.remove('d-none');
        
        // Limpiar formulario de login
        document.getElementById('loginForm').reset();
        
        Utils.showNotification('Sesión cerrada correctamente', 'info');
    },
    
    // Verificar si el usuario está autenticado
    isAuthenticated: function() {
        return this.currentUser !== null;
    },
    
    // Verificar permisos
    hasPermission: function(requiredRole) {
        if (!this.currentUser) return false;
        return this.currentUser.role === requiredRole || this.currentUser.role === 'admin';
    },
    
    // Elementos DOM
    get loginPage() { return document.getElementById('loginPage'); },
    get mainPage() { return document.getElementById('mainPage'); }
};