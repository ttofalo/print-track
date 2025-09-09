

class DashboardAPI {
    constructor() {
        // Detectar IP automáticamente
        this.baseURL = `http://${window.location.hostname}:3000/api`;
        console.log('API Base URL:', this.baseURL);
    }

    async getStats() {
        try {
            const response = await fetch(`${this.baseURL}/stats`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return {
                total_prints: 0,
                total_pages: 0
            };
        }
    }

    async getTopUsers() {
        try {
            const response = await fetch(`${this.baseURL}/top-users`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error obteniendo usuarios top:', error);
            return [];
        }
    }

    async getPrintJobs(filters = {}) {
        try {
            const params = new URLSearchParams(filters);
            const response = await fetch(`${this.baseURL}/print-jobs?${params}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error obteniendo trabajos de impresión:', error);
            return [];
        }
    }

    async getPrinters() {
        try {
            const response = await fetch(`${this.baseURL}/printers`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error obteniendo impresoras:', error);
            return [];
        }
    }
}

// Inicializar API
const api = new DashboardAPI();

// =====================================================
// FUNCIONES DE ACTUALIZACIÓN DEL DASHBOARD
// =====================================================

// Función para actualizar contadores con animación
function updateCounter(counterId, newValue) {
    const counterElement = document.querySelector(`[data-counter="${counterId}"]`);
    if (!counterElement) return;

    const currentValue = parseInt(counterElement.textContent.replace(/,/g, '')) || 0;
    const difference = newValue - currentValue;
    const duration = 1000; // 1 segundo
    const steps = 60;
    const stepValue = difference / steps;
    let currentStep = 0;

    const animate = () => {
        currentStep++;
        const currentDisplayValue = Math.round(currentValue + (stepValue * currentStep));
        counterElement.textContent = currentDisplayValue.toLocaleString();

        if (currentStep < steps) {
            requestAnimationFrame(animate);
        } else {
            counterElement.textContent = newValue.toLocaleString();
        }
    };

    if (difference !== 0) {
        requestAnimationFrame(animate);
    }
}

// Función para actualizar usuarios más activos
async function updateTopUsers() {
    try {
        const users = await api.getTopUsers();
        const usersList = document.querySelector('.users-list');
        
        if (!usersList) return;

        usersList.innerHTML = '';

        if (users.length === 0) {
            usersList.innerHTML = `
                <div class="empty-state">
                    <p>No hay usuarios activos hoy</p>
                </div>
            `;
            return;
        }

        users.forEach((user, index) => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <div class="user-rank">${index + 1}</div>
                <div class="user-info">
                    <div class="user-name">${user.user_id}</div>
                </div>
                <div class="user-pages">${user.total_pages_today} páginas</div>
            `;
            usersList.appendChild(userItem);
        });

    } catch (error) {
        console.error('Error actualizando usuarios top:', error);
    }
}

// Función para actualizar tabla de trabajos de impresión
async function updatePrintJobsTable(filters = {}) {
    try {
        const jobs = await api.getPrintJobs(filters);
        const tableBody = document.getElementById('print-jobs-tbody');
        const noJobsMessage = document.getElementById('no-jobs-message');
        
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (jobs.length === 0) {
            noJobsMessage.style.display = 'block';
            return;
        }

        noJobsMessage.style.display = 'none';

        jobs.forEach(job => {
            const row = document.createElement('tr');
            row.className = 'table-body-row';
            row.innerHTML = `
                <td>${job.job_id}</td>
                <td>${job.user_id}</td>
                <td>${job.printer_name}</td>
                <td title="${job.document_name || 'N/A'}">${job.document_name || 'N/A'}</td>
                <td>${job.pages}</td>
                <td>${new Date(job.timestamp).toLocaleString('es-ES', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error actualizando tabla de trabajos:', error);
    }
}

// Función para actualizar dashboard completo
async function updateDashboard() {
    try {
        // Obtener estadísticas
        const stats = await api.getStats();
        
        // Actualizar contadores
        updateCounter('prints', stats.total_prints);
        updateCounter('pages', stats.total_pages);
        
        // Actualizar porcentajes de cambio
        updateChangePercentage('prints-change', stats.prints_change);
        updateChangePercentage('pages-change', stats.pages_change);
        
        // Actualizar usuarios top
        await updateTopUsers();
        
        // Actualizar tabla de trabajos (sin filtros)
        await updatePrintJobsTable();
        
    } catch (error) {
        console.error('Error actualizando dashboard:', error);
    }
}

function updateChangePercentage(elementId, percentage) {
    const element = document.getElementById(elementId);
    if (element) {
        const isPositive = percentage >= 0;
        const sign = isPositive ? '+' : '';
        const color = isPositive ? '#10b981' : '#ef4444';
        
        element.textContent = `${sign}${percentage}%`;
        element.style.color = color;
    }
}

// =====================================================
// MANEJO DE FILTROS
// =====================================================

// Función para aplicar filtros
async function applyFilters() {
    const userFilter = document.getElementById('user-search').value;
    const dateFromFilter = document.getElementById('date-from').value;
    const dateToFilter = document.getElementById('date-to').value;
    const printerFilter = document.getElementById('printer-select').value;

    const filters = {};
    
    if (userFilter) filters.user = userFilter;
    if (dateFromFilter) filters.dateFrom = dateFromFilter;
    if (dateToFilter) filters.dateTo = dateToFilter;
    if (printerFilter && printerFilter !== 'all') filters.printer = printerFilter;

    // Mostrar loading
    const searchBtn = document.getElementById('search-btn');
    const originalText = searchBtn.innerHTML;
    searchBtn.innerHTML = `
        <svg class="loading-spinner" width="16" height="16" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
            </circle>
        </svg>
        Buscando...
    `;

    try {
        await updatePrintJobsTable(filters);
    } finally {
        // Restaurar botón
        searchBtn.innerHTML = originalText;
    }
}

// Función para limpiar filtros
function clearFilters() {
    document.getElementById('user-search').value = '';
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('printer-select').value = 'all';
    
    // Aplicar filtros vacíos
    updatePrintJobsTable();
}

// =====================================================
// MANEJO DE PESTAÑAS
// =====================================================

// Event Listeners para pestañas
document.addEventListener('DOMContentLoaded', function() {
    const tabsList = document.querySelector('.tabs-list');
    const tabsContent = document.querySelectorAll('.tabs-content');

    tabsList.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('.tabs-trigger');
        if (!clickedButton) return;

        // Desactivar todos los botones y contenidos
        tabsList.querySelectorAll('.tabs-trigger').forEach((btn) => {
            btn.setAttribute('data-state', 'inactive');
        });
        tabsContent.forEach((content) => {
            content.setAttribute('data-state', 'inactive');
        });

        // Activar el botón y contenido clickeado
        clickedButton.setAttribute('data-state', 'active');
        const targetTab = clickedButton.dataset.tab;
        const targetContent = document.querySelector(`[data-tab-content="${targetTab}"]`);
        targetContent.setAttribute('data-state', 'active');
    });
});

// =====================================================
// FUNCIONES DE EXPORTACIÓN
// =====================================================

// Función para exportar trabajos de impresión a XLSX
async function exportToExcel() {
    try {
        // Obtener la tabla actual
        const tableBody = document.getElementById('print-jobs-tbody');
        if (!tableBody || tableBody.children.length === 0) {
            showNotification('No hay datos para exportar', 'warning');
            return;
        }

        // Crear nuevo workbook y worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Trabajos de Impresión');

        // Definir encabezados
        const headers = [
            'ID Trabajo',
            'Usuario', 
            'Impresora',
            'Documento',
            'Páginas',
            'Fecha/Hora'
        ];

        // Agregar encabezados con estilos
        const headerRow = worksheet.addRow(headers);
        
        // Aplicar estilos a la fila de encabezados
        headerRow.eachCell((cell, colNumber) => {
            // Estilo de celda
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFB366' } // Naranja claro - Porta Hnos
            };
            
            // Estilo de fuente
            cell.font = {
                bold: true,
                color: { argb: 'FF000000' }, // Negro para mejor contraste
                size: 12
            };
            
            // Alineación
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle'
            };
            
            // Bordes
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
        });

        // Agregar filas de datos
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = [];
            
            cells.forEach((cell, index) => {
                rowData.push(cell.textContent);
            });
            
            const dataRow = worksheet.addRow(rowData);
            
            // Aplicar bordes a las celdas de datos
            dataRow.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                    bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                    left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                    right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
                };
            });
        });

        // Ajustar ancho de columnas
        worksheet.getColumn(1).width = 12; // ID Trabajo
        worksheet.getColumn(2).width = 20; // Usuario
        worksheet.getColumn(3).width = 15; // Impresora
        worksheet.getColumn(4).width = 50; // Documento
        worksheet.getColumn(5).width = 10; // Páginas
        worksheet.getColumn(6).width = 20; // Fecha/Hora

        // Generar nombre de archivo con fecha actual
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear().toString().slice(-2);
        const fileName = `Trabajos de impresion ${day}-${month}-${year}.xlsx`;

        // Generar y descargar archivo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);

        showNotification('Archivo exportado correctamente', 'success');
        
    } catch (error) {
        console.error('Error exportando a Excel:', error);
        showNotification('Error al exportar el archivo', 'error');
    }
}

// =====================================================
// FUNCIONES DE NOTIFICACIÓN
// =====================================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// =====================================================
// INICIALIZACIÓN
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando Print Server Dashboard...');
    
    // Configurar event listeners
    setupEventListeners();
    
    // Cargar datos iniciales
    updateDashboard();
    
    // Configurar actualización automática cada 30 segundos
    setInterval(updateDashboard, 30000);
    
    console.log('✅ Dashboard inicializado correctamente');
});

function setupEventListeners() {
    // Event listener para búsqueda
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', applyFilters);
    }
    
    // Event listener para limpiar filtros
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Event listener para exportar a Excel
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }
    
    // Event listeners para filtros con Enter
    const filterInputs = document.querySelectorAll('#user-search, #date-from, #date-to');
    filterInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    });
    
    // Event listener para filtro de impresora
    const printerSelect = document.getElementById('printer-select');
    if (printerSelect) {
        printerSelect.addEventListener('change', applyFilters);
    }
}



// =====================================================
// ESTILOS ADICIONALES
// =====================================================

const additionalStyles = `
    .loading-spinner {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-left: 4px solid #e48708;
        padding: 12px 16px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 300px;
    }
    
    .notification button {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
        padding: 0;
        margin-left: auto;
    }
    
    .notification button:hover {
        color: #333;
    }
    
    .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #666;
    }
    
    .empty-state p {
        margin: 0;
        font-size: 14px;
    }
`;

// Agregar estilos al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
