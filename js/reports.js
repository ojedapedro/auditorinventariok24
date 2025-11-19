// Módulo de generación de reportes
const Reports = {
    // Configurar event listeners
    setupEventListeners: function() {
        const generateReport = document.getElementById('generateReport');
        
        if (generateReport) {
            generateReport.addEventListener('click', () => this.generatePDFReport());
        }
    },
    
    // Generar reporte PDF
    generatePDFReport: function() {
        if (Inventory.scannedItems.length === 0) {
            Utils.showNotification('No hay ítems escaneados para generar un informe', 'warning');
            return;
        }
        
        Inventory.updateInventoryInfo();
        
        if (!Inventory.currentInventory.store || !Inventory.currentInventory.responsible) {
            Utils.showNotification('Por favor, complete la tienda y el responsable', 'warning');
            return;
        }
        
        try {
            this.createPDF();
            Utils.showNotification('Informe PDF generado correctamente', 'success');
        } catch (error) {
            Utils.showNotification('Error al generar el informe PDF', 'error');
            console.error('Error generating PDF:', error);
        }
    },
    
    // Crear PDF
    createPDF: function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configuración inicial
        doc.setProperties({
            title: `Inventario ${Inventory.currentInventory.store}`,
            subject: 'Informe de Auditoría de Inventario',
            author: Inventory.currentUser.name
        });
        
        // Logo y encabezado
        this.addHeader(doc);
        
        // Información del inventario
        this.addInventoryInfo(doc);
        
        // Resumen
        this.addSummary(doc);
        
        // Tabla de ítems
        this.addItemsTable(doc);
        
        // Observaciones
        this.addObservations(doc);
        
        // Guardar PDF
        const fileName = `Inventario_${Inventory.currentInventory.store}_${Inventory.currentInventory.date}.pdf`;
        doc.save(fileName);
    },
    
    // Agregar encabezado
    addHeader: function(doc) {
        doc.setFontSize(20);
        doc.setTextColor(...CONFIG.REPORT_COLORS.PRIMARY);
        doc.text('INFORME DE AUDITORÍA DE INVENTARIO', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(CONFIG.APP_NAME, 105, 30, { align: 'center' });
        
        // Línea separadora
        doc.setDrawColor(...CONFIG.REPORT_COLORS.PRIMARY);
        doc.line(20, 35, 190, 35);
    },
    
    // Agregar información del inventario
    addInventoryInfo: function(doc) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        
        let yPosition = 50;
        
        doc.text(`Fecha: ${Inventory.currentInventory.date}`, 20, yPosition);
        doc.text(`Tienda: ${Inventory.currentInventory.store}`, 20, yPosition + 8);
        doc.text(`Responsable: ${Inventory.currentInventory.responsible}`, 20, yPosition + 16);
        doc.text(`Auditor: ${Inventory.currentUser.name}`, 20, yPosition + 24);
    },
    
    // Agregar resumen
    addSummary: function(doc) {
        const summary = Inventory.getSummary();
        
        doc.setFontSize(14);
        doc.setTextColor(...CONFIG.REPORT_COLORS.PRIMARY);
        doc.text('RESUMEN DEL INVENTARIO', 20, 90);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        let yPosition = 100;
        const startX = 25;
        
        doc.text(`• Total ítems teóricos: ${Inventory.theoreticalInventory.length}`, startX, yPosition);
        doc.text(`• Total ítems escaneados: ${Inventory.scannedItems.length}`, startX, yPosition + 6);
        doc.text(`• Unidades teóricas: ${summary.totalTheoretical}`, startX, yPosition + 12);
        doc.text(`• Unidades escaneadas: ${summary.totalScanned}`, startX, yPosition + 18);
        doc.text(`• Discrepancias encontradas: ${summary.discrepancies}`, startX, yPosition + 24);
        doc.text(`• Porcentaje de completado: ${summary.completion}%`, startX, yPosition + 30);
    },
    
    // Agregar tabla de ítems
    addItemsTable: function(doc) {
        const tableColumn = ["Código", "Descripción", "Teórico", "Físico", "Diferencia"];
        const tableRows = [];
        
        Inventory.scannedItems.forEach(item => {
            const discrepancy = item.physicalQty - item.theoreticalQty;
            let discrepancyText = discrepancy.toString();
            
            if (discrepancy > 0) {
                discrepancyText = `+${discrepancy}`;
            }
            
            tableRows.push([
                item.barcode,
                item.description,
                item.theoreticalQty.toString(),
                item.physicalQty.toString(),
                discrepancyText
            ]);
        });
        
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 140,
            styles: { 
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: { 
                fillColor: CONFIG.REPORT_COLORS.PRIMARY,
                textColor: 255
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            },
            didDrawCell: (data) => {
                // Resaltar discrepancias
                if (data.column.index === 4 && data.cell.raw) {
                    const value = parseInt(data.cell.raw);
                    if (value < 0) {
                        // Faltante - rojo
                        doc.setFillColor(...CONFIG.REPORT_COLORS.DISCREPANCY_HIGH);
                        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                        doc.setTextColor(255, 255, 255);
                        doc.text(data.cell.raw, data.cell.x + 2, data.cell.y + data.cell.height - 2);
                    } else if (value > 0) {
                        // Excedente - amarillo
                        doc.setFillColor(...CONFIG.REPORT_COLORS.DISCREPANCY_MEDIUM);
                        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                        doc.setTextColor(0, 0, 0);
                        doc.text(data.cell.raw, data.cell.x + 2, data.cell.y + data.cell.height - 2);
                    }
                }
            }
        });
    },
    
    // Agregar observaciones
    addObservations: function(doc) {
        const lastAutoTable = doc.lastAutoTable;
        const finalY = lastAutoTable ? lastAutoTable.finalY + 10 : 140;
        
        if (Inventory.currentInventory.observations) {
            doc.setFontSize(12);
            doc.setTextColor(...CONFIG.REPORT_COLORS.PRIMARY);
            doc.text('OBSERVACIONES:', 20, finalY);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            
            const splitObservations = doc.splitTextToSize(
                Inventory.currentInventory.observations, 
                170
            );
            doc.text(splitObservations, 20, finalY + 8);
        }
        
        // Pie de página
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Generado el ${new Date().toLocaleString()} por ${Inventory.currentUser.name}`, 
            105, 
            280, 
            { align: 'center' }
        );
    }
};