class PrinterStatusMonitor {
    constructor() {
        // Detectar IP automáticamente
        this.baseURL = `http://${window.location.hostname}:3000/api`;
        this.printers = [];
        this.onlineCount = 0;
        this.totalCount = 0;
        this.monitoringInterval = null;
        this.isInitializing = true;
        
        console.log('🚀 Iniciando monitor de impresoras...');
        console.log('API Base URL:', this.baseURL);
        
        this.init();
    }
    
    init() {
        this.createStatusIndicator();
        this.createModal();
        this.startMonitoring();
        this.bindEvents();
    }
    
    createStatusIndicator() {
        const headerContent = document.querySelector('.header-content');
        if (headerContent) {
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'printer-status-indicator';
            statusIndicator.innerHTML = `
                <div class="status-text">Verificando...</div>
            `;
            statusIndicator.title = 'Estado de Impresoras';
            headerContent.appendChild(statusIndicator);
        }
    }
    
    createModal() {
        const modal = document.createElement('div');
        modal.className = 'printer-status-modal';
        modal.id = 'printerStatusModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Estado de Impresoras</h2>
                    <button class="modal-close" id="closePrinterModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="printer-grid" id="printerGrid">
                        <!-- Las impresoras se cargarán dinámicamente -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    createPrinterCard(printer) {
        return `
            <div class="printer-card ${printer.status}" data-printer-id="${printer.id}">
                <div class="printer-status-dot ${printer.status}"></div>
                <div class="printer-info">
                    <div class="printer-name">${printer.id}</div>
                    <div class="printer-ip">${printer.ip}</div>
                    <div class="printer-location">${printer.location}</div>
                </div>
                <div class="printer-status-label ${printer.status}">
                    ${printer.status === 'online' ? 'ONLINE' : 'OFFLINE'}
                </div>
            </div>
        `;
    }
    
    bindEvents() {
        const statusIndicator = document.querySelector('.printer-status-indicator');
        if (statusIndicator) {
            statusIndicator.addEventListener('click', () => this.openModal());
        }
        
        const closeBtn = document.getElementById('closePrinterModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        const modal = document.getElementById('printerStatusModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }
    
    openModal() {
        const modal = document.getElementById('printerStatusModal');
        if (modal) {
            modal.style.display = 'flex';
            this.updateModalContent();
        }
    }
    
    closeModal() {
        const modal = document.getElementById('printerStatusModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    updateModalContent() {
        const printerGrid = document.getElementById('printerGrid');
        if (printerGrid) {
            printerGrid.innerHTML = this.printers.map(printer => this.createPrinterCard(printer)).join('');
        }
    }
    
    updatePrinterCard(printer) {
        const card = document.querySelector(`[data-printer-id="${printer.id}"]`);
        if (card) {
            card.className = `printer-card ${printer.status}`;
            card.innerHTML = this.createPrinterCard(printer);
        }
    }
    
    getStatusColor() {
        const onlineCount = this.printers.filter(p => p.status === 'online').length;
        
        if (onlineCount === this.totalCount) {
            return 'green'; // Todas las impresoras conectadas
        } else if (onlineCount > 10) {
            return 'orange'; // Más de 10 impresoras conectadas
        } else {
            return 'red'; // 10 o menos impresoras conectadas
        }
    }
    
    updateStatusIndicator() {
        this.onlineCount = this.printers.filter(p => p.status === 'online').length;
        const statusColor = this.getStatusColor();
        
        const statusIndicator = document.querySelector('.printer-status-indicator');
        if (statusIndicator) {
            if (this.isInitializing) {
                // Mostrar mensaje de verificación
                statusIndicator.innerHTML = `
                    <div class="status-text">Verificando...</div>
                `;
            } else {
                // Mostrar indicador normal con color
                statusIndicator.innerHTML = `
                    <div class="status-dot ${statusColor}"></div>
                    <span class="status-text">${this.onlineCount}/${this.totalCount} Online</span>
                `;
            }
        }
    }
    
    async checkAllPrinters() {
        try {
            // Llamar al endpoint del backend para obtener el estado de todas las impresoras
            const response = await fetch(`${this.baseURL}/printers/status`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Actualizar la lista de impresoras con los datos del backend
            this.printers = data.printers;
            this.totalCount = data.summary.total;
            
            // Actualizar las tarjetas de impresoras
            this.printers.forEach(printer => {
                this.updatePrinterCard(printer);
            });
            
            // Marcar como inicializado después de la primera verificación
            if (this.isInitializing) {
                this.isInitializing = false;
            }
            
            this.updateStatusIndicator();
            
        } catch (error) {
            console.error('Error verificando estado de impresoras:', error);
            // En caso de error, mantener el estado anterior
        }
    }
    
    startMonitoring() {
        // Verificación inicial
        this.checkAllPrinters();
        
        // Verificación cada 20 segundos
        this.monitoringInterval = setInterval(() => {
            this.checkAllPrinters();
        }, 20000);
    }
    
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new PrinterStatusMonitor();
});
