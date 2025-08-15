// =====================================================
// PRINTER STATUS MONITOR - COMPLETELY INDEPENDENT
// =====================================================

class PrinterStatusMonitor {
    constructor() {
        this.printers = [
            { id: 'PHARI064', ip: '10.10.64.30', location: 'SISTEMAS', status: 'offline' },
            { id: 'PHARI019', ip: '10.10.64.66', location: 'RECEPCION GRANOS', status: 'offline' },
            { id: 'PHARI030', ip: '10.10.64.16', location: 'RECEPCION GRANOS', status: 'offline' },
            { id: 'PHARI029', ip: '10.10.64.21', location: 'OFI PLANTA ALCOHOL', status: 'offline' },
            { id: 'PHARI001', ip: '10.10.64.4', location: 'LABORATORIO PLANTA DE ALCOHOL', status: 'offline' },
            { id: 'PHARI038', ip: '10.10.64.17', location: 'DESPACHO DE CAMIONES', status: 'offline' },
            { id: 'PHARI025', ip: '10.10.64.63', location: 'INGENIERÍA', status: 'offline' },
            { id: 'PHARI026', ip: '10.10.64.65', location: 'INGENIERÍA', status: 'offline' },
            { id: 'PHARI056', ip: '10.10.64.20', location: 'LABORATORIO ALCOHOL', status: 'offline' },
            { id: 'PHARI066', ip: '10.10.64.10', location: 'OFICINA LIDERES DE CALIDAD', status: 'offline' },
            { id: 'PHARI014', ip: '10.10.64.15', location: 'OFICINA MANTENIMIENTO', status: 'offline' },
            { id: 'PHARI048', ip: '10.10.64.27', location: 'OFICINA DE PROTEINAS', status: 'offline' },
            { id: 'PHARI023', ip: '10.10.64.36', location: 'PAÑOL', status: 'offline' },
            { id: 'PHARI015', ip: '10.10.64.13', location: 'PRODUCCION - BIO 1', status: 'offline' },
            { id: 'PHARI016', ip: '10.10.64.238', location: 'IRIS', status: 'offline' },
            { id: 'PHARI064', ip: '10.10.64.202', location: 'SOBREROTULADO', status: 'offline' },
            { id: 'PHARI065', ip: '10.10.64.31', location: 'CAPITAL HUMANO', status: 'offline' },
            { id: 'PHARI033', ip: '10.10.64.24', location: 'ADMINISTRACIÓN', status: 'offline' },
            { id: 'PHARI036', ip: '10.10.64.99', location: 'ADMINISTRACION', status: 'offline' },
            { id: 'PHARI017', ip: '10.10.64.8', location: 'ADMINISTRACION', status: 'offline' },
            { id: 'PHARI003', ip: '10.10.64.7', location: 'RECEPCION EDIFICIO ADMINISTRACIÓN', status: 'offline' },
            { id: 'PHARI008', ip: '10.10.64.5', location: 'MARKETING', status: 'offline' },
            { id: 'PHARI002', ip: '10.10.64.18', location: 'LOGÍSTICA DE EXPEDICIÓN', status: 'offline' },
            { id: 'PHARI028', ip: '10.10.64.14', location: 'FRACCIONAMIENTO', status: 'offline' },
            { id: 'PHARI005', ip: '10.10.64.2', location: 'CALIDAD', status: 'offline' },
            { id: 'PHARI011', ip: '10.10.209.7', location: 'ADMINISTRACION', status: 'offline' },
            { id: 'PHARI012', ip: '10.10.64.9', location: 'ADMINISTRACIÓN', status: 'offline' }
        ];
        
        this.onlineCount = 0;
        this.totalCount = this.printers.length;
        this.monitoringInterval = null;
        this.pingTimeout = 3000; // 3 segundos timeout para ping
        this.isInitializing = true;
        
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
                        ${this.printers.map(printer => this.createPrinterCard(printer)).join('')}
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
    
    async pingPrinter(ip) {
        try {
            // Usar fetch con timeout para hacer ping a la IP
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.pingTimeout);
            
            // Intentar conectar al puerto 80 (HTTP) como método de ping
            const response = await fetch(`http://${ip}:80`, { 
                method: 'HEAD',
                signal: controller.signal,
                mode: 'no-cors'
            });
            
            clearTimeout(timeoutId);
            return true;
        } catch (error) {
            // Si hay timeout o error, la impresora está offline
            return false;
        }
    }
    
    async checkPrinterStatus(printer) {
        const isOnline = await this.pingPrinter(printer.ip);
        const newStatus = isOnline ? 'online' : 'offline';
        
        if (printer.status !== newStatus) {
            printer.status = newStatus;
            this.updatePrinterCard(printer);
        }
        
        return isOnline;
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
        const promises = this.printers.map(printer => this.checkPrinterStatus(printer));
        await Promise.allSettled(promises);
        
        // Marcar como inicializado después de la primera verificación
        if (this.isInitializing) {
            this.isInitializing = false;
        }
        
        this.updateStatusIndicator();
    }
    
    startMonitoring() {
        // Verificación inicial
        this.checkAllPrinters();
        
        // Verificación cada 30 segundos
        this.monitoringInterval = setInterval(() => {
            this.checkAllPrinters();
        }, 30000);
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
