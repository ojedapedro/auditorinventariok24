// Configuración global de la aplicación
const CONFIG = {
    APP_NAME: 'Sistema de Auditoría de Inventario',
    VERSION: '1.0.0',
    
    // Configuración de almacenamiento
    STORAGE_KEYS: {
        USER_SESSION: 'inventory_user_session',
        INVENTORY_HISTORY: 'inventory_history',
        CURRENT_INVENTORY: 'current_inventory'
    },
    
    // Límites de la aplicación
    LIMITS: {
        MAX_SCANNED_ITEMS: 1000,
        MAX_HISTORY_ITEMS: 50,
        MAX_OBSERVATIONS_LENGTH: 1000
    },
    
    // Colores para el reporte PDF
    REPORT_COLORS: {
        PRIMARY: [44, 62, 80],
        SUCCESS: [46, 204, 113],
        WARNING: [243, 156, 18],
        DANGER: [231, 76, 60],
        DISCREPANCY_HIGH: [231, 76, 60, 0.3],
        DISCREPANCY_MEDIUM: [243, 156, 18, 0.3]
    },
    
    // Configuración de usuarios (en producción esto vendría de un backend)
    USERS: [
        {
            email: 'auditor@empresa.com',
            password: 'inventario2023',
            name: 'Auditor Principal',
            role: 'admin'
        },
        {
            email: 'asistente@empresa.com',
            password: 'asistente123',
            name: 'Asistente de Auditoría',
            role: 'user'
        }
    ]
};