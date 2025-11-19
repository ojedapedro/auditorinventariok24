// Utilidades generales de la aplicación
const Utils = {
    // Formatear fecha
    formatDate: (dateString) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    },
    
    // Generar ID único
    generateId: () => {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    },
    
    // Validar email
    isValidEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Mostrar notificación
    showNotification: (message, type = 'info', duration = 3000) => {
        // Eliminar notificación anterior si existe
        const existingAlert = document.querySelector('.alert-notification');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const alertClass = type === 'error' ? 'alert-danger' : 
                          type === 'success' ? 'alert-success' : 
                          type === 'warning' ? 'alert-warning' : 'alert-info';
        
        const alertHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show alert-notification" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', alertHTML);
        
        if (duration > 0) {
            setTimeout(() => {
                const alert = document.querySelector('.alert-notification');
                if (alert) {
                    alert.remove();
                }
            }, duration);
        }
    },
    
    // Mostrar loading
    showLoading: (element, text = 'Cargando...') => {
        const loadingHTML = `
            <div class="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">${text}</p>
            </div>
        `;
        element.innerHTML = loadingHTML;
        element.querySelector('.loading-spinner').style.display = 'block';
    },
    
    // Ocultar loading
    hideLoading: (element, content = '') => {
        const loadingSpinner = element.querySelector('.loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
        if (content) {
            element.innerHTML = content;
        }
    },
    
    // Descargar archivo
    downloadFile: (content, fileName, contentType) => {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    // Exportar a CSV
    exportToCSV: (data, filename) => {
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');
        
        this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    }
};