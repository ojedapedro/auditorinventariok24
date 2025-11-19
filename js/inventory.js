// Módulo de gestión de inventario
const Inventory = {
    theoreticalInventory: [],
    scannedItems: [],
    currentInventory: {
        date: new Date().toISOString().split('T')[0],
        store: '',
        responsible: '',
        observations: ''
    },
    
    // Inicializar módulo
    init: function() {
        this.loadCurrentInventory();
        this.setupEventListeners();
    },
    
    // Cargar inventario actual
    loadCurrentInventory: function() {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT_INVENTORY);
        if (saved) {
            const data = JSON.parse(saved);
            this.theoreticalInventory = data.theoreticalInventory || [];
            this.scannedItems = data.scannedItems || [];
            this.currentInventory = data.currentInventory || this.currentInventory;
        }
    },
    
    // Guardar inventario actual
    saveCurrentInventory: function() {
        const data = {
            theoreticalInventory: this.theoreticalInventory,
            scannedItems: this.scannedItems,
            currentInventory: this.currentInventory
        };
        localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_INVENTORY, JSON.stringify(data));
    },
    
    // Configurar event listeners
    setupEventListeners: function() {
        const excelFile = document.getElementById('excelFile');
        const saveInventory = document.getElementById('saveInventory');
        
        if (excelFile) {
            excelFile.addEventListener('change', (e) => this.handleExcelUpload(e));
        }
        
        if (saveInventory) {
            saveInventory.addEventListener('click', () => this.saveInventoryData());
        }
    },
    
    // Manejar carga de Excel
    handleExcelUpload: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                
                this.theoreticalInventory = jsonData.map(item => ({
                    barcode: item.Codigo || item.codigo || item.CÓDIGO || '',
                    description: item.Descripcion || item.descripcion || item.DESCRIPCIÓN || '',
                    theoreticalQty: item.Cantidad || item.cantidad || item.CANTIDAD || 0
                }));
                
                this.saveCurrentInventory();
                App.updateSummary();
                
                Utils.showNotification(
                    `Inventario teórico cargado: ${this.theoreticalInventory.length} ítems`, 
                    'success'
                );
            } catch (error) {
                Utils.showNotification('Error al procesar el archivo Excel', 'error');
                console.error('Error processing Excel file:', error);
            }
        };
        reader.readAsArrayBuffer(file);
    },
    
    // Procesar código de barras escaneado
    processBarcode: function(barcode) {
        const existingItem = this.scannedItems.find(item => item.barcode === barcode);
        
        if (existingItem) {
            existingItem.physicalQty += 1;
        } else {
            const theoreticalItem = this.theoreticalInventory.find(item => item.barcode === barcode);
            
            const newItem = {
                id: Utils.generateId(),
                barcode: barcode,
                description: theoreticalItem ? theoreticalItem.description : 'Producto no encontrado en inventario teórico',
                theoreticalQty: theoreticalItem ? theoreticalItem.theoreticalQty : 0,
                physicalQty: 1
            };
            
            this.scannedItems.unshift(newItem);
            
            // Limitar a máximo de registros
            if (this.scannedItems.length > CONFIG.LIMITS.MAX_SCANNED_ITEMS) {
                this.scannedItems = this.scannedItems.slice(0, CONFIG.LIMITS.MAX_SCANNED_ITEMS);
            }
        }
        
        this.saveCurrentInventory();
    },
    
    // Actualizar información del inventario
    updateInventoryInfo: function() {
        this.currentInventory.date = document.getElementById('inventoryDate').value;
        this.currentInventory.store = document.getElementById('store').value;
        this.currentInventory.responsible = document.getElementById('responsible').value;
        this.currentInventory.observations = document.getElementById('observations').value;
        
        this.saveCurrentInventory();
    },
    
    // Guardar datos del inventario
    saveInventoryData: function() {
        this.updateInventoryInfo();
        
        if (!this.currentInventory.store || !this.currentInventory.responsible) {
            Utils.showNotification('Por favor, complete la tienda y el responsable', 'warning');
            return;
        }
        
        Utils.showNotification('Inventario guardado correctamente', 'success');
    },
    
    // Obtener resumen
    getSummary: function() {
        const totalTheoretical = this.theoreticalInventory.reduce((sum, item) => sum + item.theoreticalQty, 0);
        const totalScanned = this.scannedItems.reduce((sum, item) => sum + item.physicalQty, 0);
        
        let discrepancyCount = 0;
        this.scannedItems.forEach(item => {
            if (item.physicalQty !== item.theoreticalQty) {
                discrepancyCount++;
            }
        });
        
        const completion = this.theoreticalInventory.length > 0 
            ? Math.round((this.scannedItems.length / this.theoreticalInventory.length) * 100) 
            : 0;
        
        return {
            totalTheoretical,
            totalScanned,
            discrepancies: discrepancyCount,
            completion
        };
    },
    
    // Limpiar ítems escaneados
    clearScannedItems: function() {
        this.scannedItems = [];
        this.saveCurrentInventory();
    },
    
    // Editar ítem
    editItem: function(itemId, updates) {
        const item = this.scannedItems.find(i => i.id === itemId);
        if (item) {
            Object.assign(item, updates);
            this.saveCurrentInventory();
        }
    },
    
    // Eliminar ítem
    deleteItem: function(itemId) {
        this.scannedItems = this.scannedItems.filter(item => item.id !== itemId);
        this.saveCurrentInventory();
    }
};