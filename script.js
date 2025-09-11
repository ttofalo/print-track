

class DashboardAPI {
    constructor() {
        // Detectar IP automáticamente
        this.baseURL = `http://${window.location.hostname}:3000/api`;
        console.log('API Base URL:', this.baseURL);
    }

    async getStats(date = null) {
        try {
            // Si no hay fecha, usar la fecha de hoy explícitamente
            const targetDate = date || new Date().toISOString().split('T')[0];
            console.log('Enviando fecha al backend:', targetDate);
            const url = `${this.baseURL}/stats?date=${targetDate}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            console.log('Recibido del backend:', data);
            return data;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return {
                total_prints: 0,
                total_pages: 0,
                prints_change: 0,
                pages_change: 0,
                date: date || new Date().toISOString().split('T')[0]
            };
        }
    }

    async getTopUsers(date = null) {
        try {
            // Si no hay fecha, usar la fecha de hoy explícitamente
            const targetDate = date || new Date().toISOString().split('T')[0];
            const url = `${this.baseURL}/top-users?date=${targetDate}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error obteniendo usuarios top:', error);
            return [];
        }
    }

    async getSectorsStats() {
        try {
            const url = `${this.baseURL}/sectors-stats`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error obteniendo estadísticas por sector:', error);
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

// Variable para mantener el estado de los filtros activos
let activeFilters = {};

// Variable para mantener la fecha seleccionada
let selectedDate = null; // null significa "hoy"

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
        const users = await api.getTopUsers(selectedDate);
        const usersList = document.querySelector('.users-list');
        
        if (!usersList) return;

        usersList.innerHTML = '';

        if (users.length === 0) {
            const dateText = selectedDate === null ? 'HOY' : formatDate(selectedDate);
            usersList.innerHTML = `
                <div class="empty-state">
                    <p>No hay usuarios activos ${dateText}</p>
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

// Función para actualizar gráfico de sectores (horizontal)
async function updateSectorsChart() {
    try {
        const sectorsData = await api.getSectorsStats();
        const chartSvg = document.querySelector('.chart-svg');
        
        if (!chartSvg) {
            return;
        }

        // Limpiar todo el contenido del SVG
        chartSvg.innerHTML = '';

        if (!sectorsData || sectorsData.length === 0) {
            // Mostrar mensaje de no hay datos
            const noDataText = document.createElement('text');
            noDataText.setAttribute('x', '250');
            noDataText.setAttribute('y', '150');
            noDataText.setAttribute('text-anchor', 'middle');
            noDataText.setAttribute('font-size', '16');
            noDataText.setAttribute('fill', '#6b7280');
            noDataText.textContent = 'No hay datos de sectores disponibles';
            chartSvg.appendChild(noDataText);
            return;
        }

        // Crear gráfico con dos barras por sector (impresiones y páginas)
        const maxPages = Math.max(...sectorsData.map(sector => sector.total_pages));
        const maxPrints = Math.max(...sectorsData.map(sector => sector.total_prints));
        const barHeight = 15;
        const barSpacing = 50;
        const startY = 30;
        const maxBarWidth = 280;
        const labelWidth = 160;

        // Crear barras horizontales para cada sector
        sectorsData.forEach((sector, index) => {
            const y = startY + (index * barSpacing);
            
            // Calcular anchos de las barras
            const pagesBarWidth = Math.min((sector.total_pages / maxPages) * maxBarWidth, maxBarWidth);
            const printsBarWidth = Math.min((sector.total_prints / maxPrints) * maxBarWidth, maxBarWidth);
            
            // Crear barra de páginas (naranja más oscuro)
            const pagesBar = document.createElement('rect');
            pagesBar.setAttribute('x', labelWidth + 10);
            pagesBar.setAttribute('y', y);
            pagesBar.setAttribute('width', pagesBarWidth);
            pagesBar.setAttribute('height', barHeight);
            pagesBar.setAttribute('fill', '#d17a00');
            pagesBar.setAttribute('rx', '2');
            
            chartSvg.appendChild(pagesBar);

            // Crear barra de impresiones (naranja más claro)
            const printsBar = document.createElement('rect');
            printsBar.setAttribute('x', labelWidth + 10);
            printsBar.setAttribute('y', y + barHeight + 2);
            printsBar.setAttribute('width', printsBarWidth);
            printsBar.setAttribute('height', barHeight);
            printsBar.setAttribute('fill', '#e48708');
            printsBar.setAttribute('rx', '2');
            
            chartSvg.appendChild(printsBar);

            // Crear título del sector
            const label = document.createElement('text');
            label.setAttribute('x', labelWidth);
            label.setAttribute('y', y + barHeight + 8);
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('font-size', '12');
            label.setAttribute('fill', '#374151');
            label.setAttribute('font-weight', '500');
            label.textContent = sector.sector;
            
            chartSvg.appendChild(label);

            // Crear valor de páginas
            const pagesValueLabel = document.createElement('text');
            pagesValueLabel.setAttribute('x', labelWidth + 15 + pagesBarWidth);
            pagesValueLabel.setAttribute('y', y + barHeight/2 + 4);
            pagesValueLabel.setAttribute('font-size', '10');
            pagesValueLabel.setAttribute('fill', '#6b7280');
            pagesValueLabel.setAttribute('font-weight', '600');
            pagesValueLabel.textContent = `${sector.total_pages}`;
            
            chartSvg.appendChild(pagesValueLabel);

            // Crear valor de impresiones
            const printsValueLabel = document.createElement('text');
            printsValueLabel.setAttribute('x', labelWidth + 15 + printsBarWidth);
            printsValueLabel.setAttribute('y', y + barHeight + barHeight/2 + 6);
            printsValueLabel.setAttribute('font-size', '10');
            printsValueLabel.setAttribute('fill', '#6b7280');
            printsValueLabel.setAttribute('font-weight', '600');
            printsValueLabel.textContent = `${sector.total_prints}`;
            
            chartSvg.appendChild(printsValueLabel);
        });

        // Actualizar título del gráfico
        const chartTitle = document.querySelector('.chart-title');
        if (chartTitle) {
            chartTitle.textContent = 'Impresiones por sector';
        }

        const chartDescription = document.querySelector('.chart-description');
        if (chartDescription && !chartDescription.id) {
            // Calcular dinámicamente el rango de fechas de la semana actual
            const today = new Date();
            const currentDay = today.getDay(); // 0 = domingo, 1 = lunes, etc.
            const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Ajustar para que lunes sea el inicio
            
            const monday = new Date(today);
            monday.setDate(today.getDate() + mondayOffset);
            
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            
            const formatWeekDate = (date) => {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                return `${day}/${month}`;
            };
            
            const weekRange = `${formatWeekDate(monday)} - ${formatWeekDate(sunday)}`;
            chartDescription.textContent = `Estadísticas semanales por sector (${weekRange})`;
        }

    } catch (error) {
        console.error('Error actualizando gráfico de sectores:', error);
    }
}

// Función para mostrar gráfico de sectores con datos reales
async function updateSectorsChartWithTestData() {
    try {
        console.log('🔍 Creando gráfico de sectores con datos reales...');
        const chartSvg = document.querySelector('.chart-svg');
        if (!chartSvg) {
            console.error('❌ No se encontró el SVG');
            return;
        }

        // LIMPIAR TODO
        chartSvg.innerHTML = '';

        // OBTENER DATOS REALES DEL BACKEND
        const allSectorsData = await api.getSectorsStats();
        console.log('📊 Datos reales obtenidos:', allSectorsData);
        
        // FILTRAR SECTOR "SIN SECTOR" - USAR PROPIEDAD CORRECTA
        const sectorsData = allSectorsData.filter(sector => 
            sector.sector && 
            sector.sector !== 'SIN SECTOR' && 
            sector.sector.trim() !== ''
        );
        console.log('📊 Sectores filtrados (sin SIN SECTOR):', sectorsData);
        
        // CALCULAR ALTURA DINÁMICA BASADA EN CANTIDAD DE SECTORES - MUY COMPACTA
        const totalSectors = sectorsData.length;
        const dynamicHeight = Math.max(150, 60 + (totalSectors * 65) + 10); // Altura base mínima + sectores + margen pequeño
        
        // CONFIGURACIÓN EMBELLECIDA - ALTURA DINÁMICA Y APROVECHANDO ANCHO
        chartSvg.setAttribute('viewBox', `0 0 950 ${dynamicHeight}`);
        chartSvg.style.maxHeight = `${dynamicHeight}px`;
        chartSvg.style.width = '100%';
        chartSvg.style.height = `${dynamicHeight}px`;
        
        console.log(`📏 Altura calculada: ${dynamicHeight}px para ${totalSectors} sectores`);

        if (!sectorsData || sectorsData.length === 0) {
            // Mostrar mensaje si no hay datos
            const noDataText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            noDataText.setAttribute('x', '250');
            noDataText.setAttribute('y', '200');
            noDataText.setAttribute('text-anchor', 'middle');
            noDataText.setAttribute('font-size', '16');
            noDataText.setAttribute('fill', '#6b7280');
            noDataText.textContent = 'No hay datos de sectores disponibles';
            chartSvg.appendChild(noDataText);
            return;
        }

        // CONFIGURACIÓN DEL GRÁFICO - LÍMITES FIJOS (SEMANA ACTUAL)
        const maxPages = 1500; // LÍMITE FIJO PARA PÁGINAS
        const maxPrints = 1000; // LÍMITE FIJO PARA IMPRESIONES
        const barHeight = 25; // ALTURA OPTIMIZADA
        const barSpacing = 65; // ESPACIADO COMPACTO
        const startY = 30; // BARRAS PEGADAS A LA LEYENDA
        const maxBarWidth = 600; // BARRAS MÁS LARGAS PARA APROVECHAR ESPACIO
        const labelWidth = 280; // ETIQUETAS MÁS COMPACTAS

        // CREAR LEYENDA
        const legendY = 5; // LEYENDA EN EL TOP
        
        // Leyenda para páginas
        const pagesLegendBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        pagesLegendBar.setAttribute('x', labelWidth + 10);
        pagesLegendBar.setAttribute('y', legendY);
        pagesLegendBar.setAttribute('width', '30');
        pagesLegendBar.setAttribute('height', '20');
        pagesLegendBar.setAttribute('fill', '#6b7280'); // GRIS
        pagesLegendBar.setAttribute('rx', '3');
        chartSvg.appendChild(pagesLegendBar);
        
        const pagesLegendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        pagesLegendText.setAttribute('x', labelWidth + 50);
        pagesLegendText.setAttribute('y', legendY + 15);
        pagesLegendText.setAttribute('font-size', '16');
        pagesLegendText.setAttribute('fill', '#374151');
        pagesLegendText.setAttribute('font-weight', '600');
        pagesLegendText.textContent = 'Páginas';
        chartSvg.appendChild(pagesLegendText);
        
        // Leyenda para impresiones
        const printsLegendBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        printsLegendBar.setAttribute('x', labelWidth + 150);
        printsLegendBar.setAttribute('y', legendY);
        printsLegendBar.setAttribute('width', '30');
        printsLegendBar.setAttribute('height', '20');
        printsLegendBar.setAttribute('fill', '#e48708');
        printsLegendBar.setAttribute('rx', '3');
        chartSvg.appendChild(printsLegendBar);
        
        const printsLegendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        printsLegendText.setAttribute('x', labelWidth + 190);
        printsLegendText.setAttribute('y', legendY + 15);
        printsLegendText.setAttribute('font-size', '16');
        printsLegendText.setAttribute('fill', '#374151');
        printsLegendText.setAttribute('font-weight', '600');
        printsLegendText.textContent = 'Impresiones';
        chartSvg.appendChild(printsLegendText);

        // CREAR BARRAS PARA CADA SECTOR
        sectorsData.forEach((sector, index) => {
            const y = startY + (index * barSpacing);
            
            // Calcular anchos de las barras
            const pagesBarWidth = Math.min((sector.total_pages / maxPages) * maxBarWidth, maxBarWidth);
            const printsBarWidth = Math.min((sector.total_prints / maxPrints) * maxBarWidth, maxBarWidth);
            
            // BARRA DE PÁGINAS (gris - más diferente)
            const pagesBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            pagesBar.setAttribute('x', labelWidth + 10);
            pagesBar.setAttribute('y', y);
            pagesBar.setAttribute('width', pagesBarWidth);
            pagesBar.setAttribute('height', barHeight);
            pagesBar.setAttribute('fill', '#6b7280'); // GRIS OSCURO
            pagesBar.setAttribute('rx', '3');
            chartSvg.appendChild(pagesBar);

            // BARRA DE IMPRESIONES (naranja - color de la página)
            const printsBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            printsBar.setAttribute('x', labelWidth + 10);
            printsBar.setAttribute('y', y + barHeight + 5);
            printsBar.setAttribute('width', printsBarWidth);
            printsBar.setAttribute('height', barHeight);
            printsBar.setAttribute('fill', '#e48708'); // NARANJA DE LA PÁGINA
            printsBar.setAttribute('rx', '3');
            chartSvg.appendChild(printsBar);

            // TÍTULO DEL SECTOR - MUCHO MÁS GRANDE
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', labelWidth);
            label.setAttribute('y', y + barHeight + 20);
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('font-size', '18'); // MÁS GRANDE
            label.setAttribute('fill', '#374151');
            label.setAttribute('font-weight', '700'); // MUY NEGRITA
            label.textContent = sector.sector;
            chartSvg.appendChild(label);

            // VALOR DE PÁGINAS - MUCHO MÁS GRANDE
            const pagesValue = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            pagesValue.setAttribute('x', labelWidth + 20 + pagesBarWidth + 20);
            pagesValue.setAttribute('y', y + barHeight/2 + 10);
            pagesValue.setAttribute('font-size', '16'); // MÁS GRANDE
            pagesValue.setAttribute('fill', '#1f2937');
            pagesValue.setAttribute('font-weight', '800'); // MUY NEGRITA
            pagesValue.textContent = `${parseInt(sector.total_pages).toLocaleString()}`; // SIN CEROS AL INICIO
            chartSvg.appendChild(pagesValue);

            // VALOR DE IMPRESIONES - MUCHO MÁS GRANDE
            const printsValue = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            printsValue.setAttribute('x', labelWidth + 20 + printsBarWidth + 25);
            printsValue.setAttribute('y', y + barHeight + 5 + barHeight/2 + 15);
            printsValue.setAttribute('font-size', '16'); // MÁS GRANDE
            printsValue.setAttribute('fill', '#1f2937');
            printsValue.setAttribute('font-weight', '800'); // MUY NEGRITA
            printsValue.textContent = `${parseInt(sector.total_prints).toLocaleString()}`; // SIN CEROS AL INICIO
            chartSvg.appendChild(printsValue);
        });

        // ACTUALIZAR TÍTULO DEL GRÁFICO
        const chartTitle = document.querySelector('.chart-title');
        if (chartTitle) {
            chartTitle.textContent = 'Impresiones por sector';
        }

        const chartDescription = document.querySelector('.chart-description');
        if (chartDescription && !chartDescription.id) {
            // Calcular dinámicamente el rango de fechas de la semana actual
            const today = new Date();
            const currentDay = today.getDay(); // 0 = domingo, 1 = lunes, etc.
            const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Ajustar para que lunes sea el inicio
            
            const monday = new Date(today);
            monday.setDate(today.getDate() + mondayOffset);
            
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            
            const formatWeekDate = (date) => {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                return `${day}/${month}`;
            };
            
            const weekRange = `${formatWeekDate(monday)} - ${formatWeekDate(sunday)}`;
            chartDescription.textContent = `Estadísticas semanales por sector (${weekRange})`;
        }

        console.log('✅ Gráfico de sectores actualizado con datos reales');

    } catch (error) {
        console.error('❌ Error actualizando gráfico de sectores:', error);
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
        const stats = await api.getStats(selectedDate);
        
        // Actualizar contadores
        updateCounter('prints', stats.total_prints);
        updateCounter('pages', stats.total_pages);
        
        // Actualizar porcentajes de cambio
        updateChangePercentage('prints-change', stats.prints_change);
        updateChangePercentage('pages-change', stats.pages_change);
        
        // Actualizar usuarios top
        await updateTopUsers();
        
        // Actualizar gráfico de sectores (solo datos de prueba)
        updateSectorsChartWithTestData();
        
        // Actualizar títulos con la fecha
        updateTitles(stats.date);
        
        // Actualizar tabla de trabajos (mantener filtros activos si los hay)
        await updatePrintJobsTable(activeFilters);
        
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
// FUNCIONES DE NAVEGACIÓN DE FECHAS
// =====================================================

// Función para formatear fecha
function formatDate(dateString) {
    // Si no hay fecha seleccionada (selectedDate es null), significa que estamos en "hoy"
    if (selectedDate === null) {
        return 'HOY';
    }
    
    console.log('formatDate recibió:', dateString);
    
    // Parsear la fecha sin problemas de zona horaria
    // dateString viene en formato "YYYY-MM-DD"
    const [year, month, day] = dateString.split('-');
    
    // Crear la fecha directamente con los componentes
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const formatted = date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    console.log('formatDate devolvió:', formatted);
    return formatted;
}


// Función para actualizar los títulos de las tarjetas
function updateTitles(dateString) {
    const printsTitle = document.getElementById('prints-title');
    const pagesTitle = document.getElementById('pages-title');
    const usersDescription = document.getElementById('users-description');
    
    console.log('Actualizando títulos con fecha recibida:', dateString);
    console.log('selectedDate actual:', selectedDate);
    
    // Si selectedDate es null, estamos en "hoy"
    if (selectedDate === null) {
        const dateText = 'HOY';
        console.log('Mostrando HOY');
        
        if (printsTitle) {
            printsTitle.textContent = `Impresiones ${dateText}`;
        }
        
        if (pagesTitle) {
            pagesTitle.textContent = `Páginas totales ${dateText}`;
        }
        
        if (usersDescription) {
            usersDescription.textContent = `Top 5 usuarios por páginas impresas ${dateText}`;
        }
    } else {
        // Si selectedDate no es null, usar esa fecha directamente
        const dateText = formatDate(selectedDate);
        console.log('Mostrando fecha específica:', dateText, 'basada en selectedDate:', selectedDate);
        
        if (printsTitle) {
            printsTitle.textContent = `Impresiones ${dateText}`;
        }
        
        if (pagesTitle) {
            pagesTitle.textContent = `Páginas totales ${dateText}`;
        }
        
        if (usersDescription) {
            usersDescription.textContent = `Top 5 usuarios por páginas impresas ${dateText}`;
        }
    }
}

// Función para navegar al día anterior
function goToPreviousDay() {
    if (selectedDate === null) {
        // Si estamos en "hoy", calcular dinámicamente el día anterior
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        selectedDate = yesterday.toISOString().split('T')[0];
        console.log('Navegando a fecha anterior (calculada dinámicamente):', selectedDate);
    } else {
        // Si estamos en una fecha específica, ir al día anterior
        const currentDate = new Date(selectedDate + 'T12:00:00');
        currentDate.setDate(currentDate.getDate() - 1);
        selectedDate = currentDate.toISOString().split('T')[0];
        console.log('Navegando a fecha anterior:', selectedDate);
    }
    
    updateDashboard();
    updateNavigationButtons();
}

// Función para navegar al día siguiente
function goToNextDay() {
    if (selectedDate === null) {
        // Si estamos en "hoy", no podemos ir al futuro
        return;
    }
    
    // Si estamos en ayer, volver a hoy
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    if (selectedDate === yesterdayString) {
        selectedDate = null;
        console.log('Volviendo a HOY');
    } else {
        // Para otras fechas, ir al día siguiente
        const currentDate = new Date(selectedDate + 'T12:00:00');
        currentDate.setDate(currentDate.getDate() + 1);
        selectedDate = currentDate.toISOString().split('T')[0];
        console.log('Navegando a fecha siguiente:', selectedDate);
    }
    
    updateDashboard();
    updateNavigationButtons();
}

// Función para actualizar el estado de los botones de navegación
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-day-btn');
    const nextBtn = document.getElementById('next-day-btn');
    
    // El botón anterior siempre está habilitado (podemos ir al pasado)
    if (prevBtn) {
        prevBtn.disabled = false;
    }
    
    // El botón siguiente está deshabilitado solo si estamos en "hoy"
    if (nextBtn) {
        nextBtn.disabled = selectedDate === null;
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

    // Guardar filtros activos
    activeFilters = { ...filters };

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
    
    // Limpiar filtros activos
    activeFilters = {};
    
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
    
    // Inicializar botones de navegación
    updateNavigationButtons();
    
    // Cargar datos iniciales
    updateDashboard();
    
    // Configurar actualización automática cada 30 segundos
    setInterval(updateDashboard, 30000);
    
    // Configurar actualización del gráfico de sectores cada 30 segundos
    setInterval(updateSectorsChartWithTestData, 30000);
    
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
    
    // Event listeners para navegación de fechas
    const prevDayBtn = document.getElementById('prev-day-btn');
    if (prevDayBtn) {
        prevDayBtn.addEventListener('click', goToPreviousDay);
    }
    
    const nextDayBtn = document.getElementById('next-day-btn');
    if (nextDayBtn) {
        nextDayBtn.addEventListener('click', goToNextDay);
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
