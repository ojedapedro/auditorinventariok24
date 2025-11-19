// Módulo de escaneo de códigos de barras
const Scanner = {
    // Inicializar módulo
    init: function() {
        this.setupEventListeners();
        this.renderDashboard();
    },
    
    // Configurar event listeners
    setupEventListeners: function() {
        const barcodeInput = document.getElementById('barcodeInput');
        const clearScanned = document.getElementById('clearScanned');
        
        if (barcodeInput) {
            barcodeInput.addEventListener('keypress', (e) => this.handleBarcodeInput(e));
        }
        
        if (clearScanned) {
            clearScanned.addEventListener('click', () => this.handleClearScanned());
        }
    },
    
    // Manejar entrada de código de barras
    handleBarcodeInput: function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const barcode = e.target.value.trim();
            
            if (barcode) {
                Inventory.processBarcode(barcode);
                App.updateScannedTable();
                App.updateSummary();
                
                e.target.value = '';
                Utils.showNotification(`Código escaneado: ${barcode}`, 'success', 2000);
            }
        }
    },
    
    // Manejar limpieza de escaneos
    handleClearScanned: function() {
        if (confirm('¿Está seguro de que desea limpiar todos los ítems escaneados?')) {
            Inventory.clearScannedItems();
            App.updateScannedTable();
            App.updateSummary();
            Utils.showNotification('Ítems escaneados limpiados', 'info');
        }
    },
    
    // Renderizar dashboard
    renderDashboard: function() {
        const dashboardSection = document.getElementById('dashboardSection');
        
        dashboardSection.innerHTML = `
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-clipboard-list me-2"></i>Control de Inventario
                        </div>
                        <div class="card-body">
                            <div class="inventory-info">
                                <div class="row">
                                    <div class="col-md-4">
                                        <label for="inventoryDate" class="form-label">Fecha de Inventario</label>
                                        <input type="date" class="form-control" id="inventoryDate" 
                                               value="${Inventory.currentInventory.date}">
                                    </div>
                                    <div class="col-md-4">
                                        <label for="store" class="form-label">Tienda</label>
                                        <input type="text" class="form-control" id="store" 
                                               placeholder="Nombre de la tienda" 
                                               value="${Inventory.currentInventory.store}">
                                    </div>
                                    <div class="col-md-4">
                                        <label for="responsible" class="form-label">Responsable</label>
                                        <input type="text" class="form-control" id="responsible" 
                                               placeholder="Nombre del responsable"
                                               value="${Inventory.currentInventory.responsible}">
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="excelFile" class="form-label">Cargar Inventario Teórico (Excel)</label>
                                <input class="form-control" type="file" id="excelFile" accept=".xlsx, .xls">
                                <div class="form-text">
                                    El archivo Excel debe contener columnas: Código, Descripción, Cantidad
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="barcodeInput" class="form-label">Escáner de Código de Barras</label>
                                <input type="text" class="form-control scan-input" id="barcodeInput" 
                                       placeholder="Escanee o ingrese el código de barras" autofocus>
                                <div class="form-text">
                                    Presione Enter después de escanear cada código
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="observations" class="form-label">Observaciones</label>
                                <textarea class="form-control" id="observations" rows="3" 
                                          placeholder="Ingrese observaciones generales sobre el inventario">${Inventory.currentInventory.observations}</textarea>
                            </div>

                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button class="btn btn-primary" id="generateReport">
                                    <i class="fas fa-file-pdf me-2"></i>Generar Informe PDF
                                </button>
                                <button class="btn btn-success" id="saveInventory">
                                    <i class="fas fa-save me-2"></i>Guardar Inventario
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <i class="fas fa-chart-bar me-2"></i>Resumen
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-6 mb-3">
                                    <div class="summary-card">
                                        <h4 id="totalTheoretical">0</h4>
                                        <small>Teórico</small>
                                    </div>
                                </div>
                                <div class="col-6 mb-3">
                                    <div class="summary-card">
                                        <h4 id="totalScanned">0</h4>
                                        <small>Escaneados</small>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="summary-card">
                                        <h4 id="discrepancies">0</h4>
                                        <small>Discrepancias</small>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="summary-card">
                                        <h4 id="completion">0%</h4>
                                        <small>Completado</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card mt-4">
                        <div class="card-header">
                            <i class="fas fa-history me-2"></i>Últimos Inventarios
                        </div>
                        <div class="card-body">
                            <div id="recentInventories">
                                <!-- Se llenará dinámicamente -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mt-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span><i class="fas fa-table me-2"></i>Ítems Escaneados (Últimos ${CONFIG.LIMITS.MAX_SCANNED_ITEMS})</span>
                    <button class="btn btn-sm btn-outline-secondary" id="clearScanned">
                        <i class="fas fa-trash me-1"></i>Limpiar Escaneos
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped table-hover" id="scannedTable">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Descripción</th>
                                    <th>Cantidad Teórica</th>
                                    <th>Cantidad Física</th>
                                    <th>Discrepancia</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Se llenará dinámicamente -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Reconfigurar event listeners después de renderizar
        this.setupEventListeners();
        Reports.setupEventListeners();
    }
};