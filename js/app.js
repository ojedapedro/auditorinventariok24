// Módulo principal de la aplicación
const App = {
    // Inicializar aplicación
    init: function() {
        Auth.init();
        Inventory.init();
        History.init();
        
        this.setupNavigation();
        this.checkAuthentication();
        
        // Cargar módulos específicos según la página
        if (Auth.isAuthenticated()) {
            Scanner.init();
            this.updateSummary();
            this.updateScannedTable();
        }
    },
    
    // Configurar navegación
    setupNavigation: function() {
        const navDashboard = document.getElementById('navDashboard');
        const navHistory = document.getElementById('navHistory');
        const dashboardSection = document.getElementById('dashboardSection');
        const historySection = document.getElementById('historySection');
        
        if (navDashboard && navHistory) {
            navDashboard.addEventListener('click', (e) => {
                e.preventDefault();
                this.showDashboard();
            });
            
            navHistory.addEventListener('click', (e) => {
                e.preventDefault();
                this.showHistory();
            });
        }
    },
    
    // Mostrar dashboard
    showDashboard: function() {
        document.getElementById('dashboardSection').classList.remove('d-none');
        document.getElementById('historySection').classList.add('d-none');
        
        document.getElementById('navDashboard').classList.add('active');
        document.getElementById('navHistory').classList.remove('active');
    },
    
    // Mostrar historial
    showHistory: function() {
        document.getElementById('dashboardSection').classList.add('d-none');
        document.getElementById('historySection').classList.remove('d-none');
        
        document.getElementById('navDashboard').classList.remove('active');
        document.getElementById('navHistory').classList.add('active');
    },
    
    // Verificar autenticación
    checkAuthentication: function() {
        if (Auth.isAuthenticated()) {
            Auth.loginPage.classList.add('d-none');
            Auth.mainPage.classList.remove('d-none');
            
            // Actualizar nombre de usuario
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = Auth.currentUser.name;
            }
        }
    },
    
    // Actualizar tabla de escaneos
    updateScannedTable: function() {
        const scannedTable = document.getElementById('scannedTable');
        if (!scannedTable) return;
        
        const tbody = scannedTable.getElementsByTagName('tbody')[0];
        tbody.innerHTML = '';
        
        Inventory.scannedItems.forEach(item => {
            const discrepancy = item.physicalQty - item.theoreticalQty;
            let discrepancyClass = '';
            
            if (discrepancy < 0) {
                discrepancyClass = 'discrepancy-high';
            } else if (discrepancy > 0) {
                discrepancyClass = 'discrepancy-medium';
            }
            
            const row = tbody.insertRow();
            row.className = discrepancyClass;
            
            row.innerHTML = `
                <td>${item.barcode}</td>
                <td>${item.description}</td>
                <td>${item.theoreticalQty}</td>
                <td>${item.physicalQty}</td>
                <td>${discrepancy}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-item" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-item" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        });
        
        // Agregar event listeners para editar y eliminar
        this.setupItemActionListeners();
    },
    
    // Configurar listeners de acciones de ítems
    setupItemActionListeners: function() {
        document.querySelectorAll('.edit-item').forEach(button => {
            button.addEventListener('click', (e) => this.handleEditItem(e));
        });
        
        document.querySelectorAll('.delete-item').forEach(button => {
            button.addEventListener('click', (e) => this.handleDeleteItem(e));
        });
    },
    
    // Manejar edición de ítem
    handleEditItem: function(e) {
        const itemId = e.target.closest('button').dataset.id;
        const item = Inventory.scannedItems.find(i => i.id === itemId);
        
        if (item) {
            this.showEditItemModal(item);
        }
    },
    
    // Manejar eliminación de ítem
    handleDeleteItem: function(e) {
        const itemId = e.target.closest('button').dataset.id;
        
        if (confirm('¿Está seguro de que desea eliminar este ítem?')) {
            Inventory.deleteItem(itemId);
            this.updateScannedTable();
            this.updateSummary();
            Utils.showNotification('Ítem eliminado correctamente', 'success');
        }
    },
    
    // Mostrar modal de edición de ítem
    showEditItemModal: function(item) {
        const modalHTML = `
            <div class="modal fade" id="editItemModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Editar Ítem Escaneado</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editItemForm">
                                <input type="hidden" id="editItemId" value="${item.id}">
                                <div class="mb-3">
                                    <label for="editBarcode" class="form-label">Código de Barras</label>
                                    <input type="text" class="form-control" id="editBarcode" 
                                           value="${item.barcode}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="editDescription" class="form-label">Descripción</label>
                                    <input type="text" class="form-control" id="editDescription" 
                                           value="${item.description}">
                                </div>
                                <div class="mb-3">
                                    <label for="editPhysicalQty" class="form-label">Cantidad Física</label>
                                    <input type="number" class="form-control" id="editPhysicalQty" 
                                           min="1" value="${item.physicalQty}" required>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="saveEditItem">Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalsContainer').innerHTML = modalHTML;
        const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
        
        // Configurar event listener para guardar
        document.getElementById('saveEditItem').addEventListener('click', () => {
            this.saveEditedItem(item.id);
            modal.hide();
        });
        
        modal.show();
    },
    
    // Guardar ítem editado
    saveEditedItem: function(itemId) {
        const barcode = document.getElementById('editBarcode').value;
        const description = document.getElementById('editDescription').value;
        const physicalQty = parseInt(document.getElementById('editPhysicalQty').value);
        
        Inventory.editItem(itemId, {
            barcode: barcode,
            description: description,
            physicalQty: physicalQty
        });
        
        this.updateScannedTable();
        this.updateSummary();
        Utils.showNotification('Ítem actualizado correctamente', 'success');
    },
    
    // Actualizar resumen
    updateSummary: function() {
        const summary = Inventory.getSummary();
        
        const totalTheoretical = document.getElementById('totalTheoretical');
        const totalScanned = document.getElementById('totalScanned');
        const discrepancies = document.getElementById('discrepancies');
        const completion = document.getElementById('completion');
        
        if (totalTheoretical) totalTheoretical.textContent = summary.totalTheoretical;
        if (totalScanned) totalScanned.textContent = summary.totalScanned;
        if (discrepancies) discrepancies.textContent = summary.discrepancies;
        if (completion) completion.textContent = `${summary.completion}%`;
    }
};

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});