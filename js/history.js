// Módulo de historial
const History = {
    inventoryHistory: [],
    
    // Inicializar módulo
    init: function() {
        this.loadHistory();
        this.renderHistorySection();
    },
    
    // Cargar historial
    loadHistory: function() {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.INVENTORY_HISTORY);
        if (saved) {
            this.inventoryHistory = JSON.parse(saved);
        }
    },
    
    // Guardar historial
    saveHistory: function() {
        localStorage.setItem(
            CONFIG.STORAGE_KEYS.INVENTORY_HISTORY, 
            JSON.stringify(this.inventoryHistory)
        );
    },
    
    // Agregar inventario al historial
    addToHistory: function() {
        Inventory.updateInventoryInfo();
        
        if (!Inventory.currentInventory.store || !Inventory.currentInventory.responsible) {
            Utils.showNotification('Complete la tienda y responsable antes de guardar', 'warning');
            return false;
        }
        
        const discrepancyCount = Inventory.scannedItems.filter(
            item => item.physicalQty !== item.theoreticalQty
        ).length;
        
        const inventoryRecord = {
            id: Utils.generateId(),
            ...Inventory.currentInventory,
            scannedItems: [...Inventory.scannedItems],
            theoreticalCount: Inventory.theoreticalInventory.length,
            scannedCount: Inventory.scannedItems.length,
            discrepancies: discrepancyCount,
            timestamp: new Date().toISOString(),
            user: Inventory.currentUser.name
        };
        
        this.inventoryHistory.push(inventoryRecord);
        
        // Limitar historial
        if (this.inventoryHistory.length > CONFIG.LIMITS.MAX_HISTORY_ITEMS) {
            this.inventoryHistory = this.inventoryHistory.slice(-CONFIG.LIMITS.MAX_HISTORY_ITEMS);
        }
        
        this.saveHistory();
        this.updateRecentInventories();
        
        return true;
    },
    
    // Renderizar sección de historial
    renderHistorySection: function() {
        const historySection = document.getElementById('historySection');
        
        historySection.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span><i class="fas fa-history me-2"></i>Historial de Inventarios</span>
                    <button class="btn btn-sm btn-outline-danger" id="clearHistory">
                        <i class="fas fa-trash me-1"></i>Limpiar Historial
                    </button>
                </div>
                <div class="card-body">
                    <div id="historyList">
                        ${this.renderHistoryList()}
                    </div>
                </div>
            </div>
        `;
        
        this.setupHistoryEventListeners();
    },
    
    // Renderizar lista de historial
    renderHistoryList: function() {
        if (this.inventoryHistory.length === 0) {
            return '<p class="text-muted text-center">No hay historial de inventarios</p>';
        }
        
        return `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tienda</th>
                            <th>Responsable</th>
                            <th>Ítems</th>
                            <th>Discrepancias</th>
                            <th>Usuario</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.inventoryHistory.slice().reverse().map(inv => `
                            <tr>
                                <td>${Utils.formatDate(inv.date)}</td>
                                <td>${inv.store}</td>
                                <td>${inv.responsable}</td>
                                <td>
                                    <span class="badge bg-primary">${inv.scannedCount}</span>
                                </td>
                                <td>
                                    <span class="badge ${inv.discrepancies > 0 ? 'bg-warning' : 'bg-success'}">
                                        ${inv.discrepancies}
                                    </span>
                                </td>
                                <td>${inv.user}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary view-history" data-id="${inv.id}">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-info download-history" data-id="${inv.id}">
                                        <i class="fas fa-download"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger delete-history" data-id="${inv.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    // Configurar event listeners del historial
    setupHistoryEventListeners: function() {
        const clearHistory = document.getElementById('clearHistory');
        
        if (clearHistory) {
            clearHistory.addEventListener('click', () => this.handleClearHistory());
        }
        
        // Event listeners para botones de acciones
        document.querySelectorAll('.view-history').forEach(button => {
            button.addEventListener('click', (e) => this.handleViewHistory(e));
        });
        
        document.querySelectorAll('.download-history').forEach(button => {
            button.addEventListener('click', (e) => this.handleDownloadHistory(e));
        });
        
        document.querySelectorAll('.delete-history').forEach(button => {
            button.addEventListener('click', (e) => this.handleDeleteHistory(e));
        });
    },
    
    // Manejar ver historial
    handleViewHistory: function(e) {
        const inventoryId = e.target.closest('button').dataset.id;
        const inventory = this.inventoryHistory.find(inv => inv.id === inventoryId);
        
        if (inventory) {
            this.showHistoryModal(inventory);
        }
    },
    
    // Manejar descargar historial
    handleDownloadHistory: function(e) {
        const inventoryId = e.target.closest('button').dataset.id;
        const inventory = this.inventoryHistory.find(inv => inv.id === inventoryId);
        
        if (inventory) {
            this.exportHistoryToCSV(inventory);
        }
    },
    
    // Manejar eliminar historial
    handleDeleteHistory: function(e) {
        const inventoryId = e.target.closest('button').dataset.id;
        
        if (confirm('¿Está seguro de que desea eliminar este inventario del historial?')) {
            this.inventoryHistory = this.inventoryHistory.filter(inv => inv.id !== inventoryId);
            this.saveHistory();
            this.renderHistorySection();
            this.updateRecentInventories();
            Utils.showNotification('Inventario eliminado del historial', 'success');
        }
    },
    
    // Manejar limpiar historial
    handleClearHistory: function() {
        if (confirm('¿Está seguro de que desea limpiar todo el historial?')) {
            this.inventoryHistory = [];
            this.saveHistory();
            this.renderHistorySection();
            this.updateRecentInventories();
            Utils.showNotification('Historial limpiado correctamente', 'success');
        }
    },
    
    // Mostrar modal de historial
    showHistoryModal: function(inventory) {
        const modalHTML = `
            <div class="modal fade" id="historyModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Inventario: ${inventory.store} - ${inventory.date}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <strong>Responsable:</strong> ${inventory.responsable}
                                </div>
                                <div class="col-md-4">
                                    <strong>Ítems escaneados:</strong> ${inventory.scannedCount}
                                </div>
                                <div class="col-md-4">
                                    <strong>Discrepancias:</strong> ${inventory.discrepancies}
                                </div>
                            </div>
                            
                            ${inventory.observations ? `
                                <div class="mb-3">
                                    <strong>Observaciones:</strong> ${inventory.observations}
                                </div>
                            ` : ''}
                            
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Código</th>
                                            <th>Descripción</th>
                                            <th>Teórico</th>
                                            <th>Físico</th>
                                            <th>Diferencia</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${inventory.scannedItems.map(item => {
                                            const discrepancy = item.physicalQty - item.theoreticalQty;
                                            const rowClass = discrepancy < 0 ? 'table-danger' : 
                                                            discrepancy > 0 ? 'table-warning' : '';
                                            
                                            return `
                                                <tr class="${rowClass}">
                                                    <td>${item.barcode}</td>
                                                    <td>${item.description}</td>
                                                    <td>${item.theoreticalQty}</td>
                                                    <td>${item.physicalQty}</td>
                                                    <td>${discrepancy}</td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalsContainer').innerHTML = modalHTML;
        const modal = new bootstrap.Modal(document.getElementById('historyModal'));
        modal.show();
    },
    
    // Exportar historial a CSV
    exportHistoryToCSV: function(inventory) {
        const csvData = inventory.scannedItems.map(item => ({
            Código: item.barcode,
            Descripción: item.description,
            'Cantidad Teórica': item.theoreticalQty,
            'Cantidad Física': item.physicalQty,
            Diferencia: item.physicalQty - item.theoreticalQty
        }));
        
        const fileName = `Inventario_${inventory.store}_${inventory.date}.csv`;
        Utils.exportToCSV(csvData, fileName);
        Utils.showNotification('Historial exportado a CSV', 'success');
    },
    
    // Actualizar inventarios recientes
    updateRecentInventories: function() {
        const recentInventories = document.getElementById('recentInventories');
        if (!recentInventories) return;
        
        const recent = this.inventoryHistory.slice(-5).reverse();
        
        if (recent.length === 0) {
            recentInventories.innerHTML = '<p class="text-muted">No hay inventarios recientes</p>';
            return;
        }
        
        recentInventories.innerHTML = recent.map(inv => `
            <div class="history-item">
                <h6>${inv.store} - ${Utils.formatDate(inv.date)}</h6>
                <p class="mb-1">Responsable: ${inv.responsable}</p>
                <p class="mb-1">
                    Ítems: ${inv.scannedCount} 
                    <span class="badge ${inv.discrepancies > 0 ? 'bg-warning' : 'bg-success'} ms-2">
                        ${inv.discrepancies} discrepancias
                    </span>
                </p>
                <small class="text-muted">Usuario: ${inv.user}</small>
            </div>
        `).join('');
    }
};