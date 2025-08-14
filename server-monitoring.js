// Server Monitoring System - Print Server Dashboard
// Este archivo muestra cómo implementar los contadores en tiempo real

class PrintServerMonitor {
  constructor() {
    this.printers = [
          { name: 'PHARI064', ip: '10.10.3.100', status: 'unknown', lastSeen: null },
{ name: 'PHARI065', ip: '10.10.3.101', status: 'unknown', lastSeen: null },
{ name: 'PHARI066', ip: '10.10.3.102', status: 'unknown', lastSeen: null },
{ name: 'PHARI067', ip: '10.10.3.103', status: 'unknown', lastSeen: null },
{ name: 'PHARI068', ip: '10.10.3.104', status: 'unknown', lastSeen: null },
{ name: 'PHARI069', ip: '10.10.3.105', status: 'unknown', lastSeen: null },
{ name: 'PHARI070', ip: '10.10.3.106', status: 'unknown', lastSeen: null },
{ name: 'PHARI071', ip: '10.10.3.107', status: 'unknown', lastSeen: null },
{ name: 'PHARI072', ip: '10.10.3.108', status: 'unknown', lastSeen: null },
{ name: 'PHARI073', ip: '10.10.3.109', status: 'unknown', lastSeen: null },
    { name: 'PHARI074', ip: '10.10.3.110', status: 'unknown', lastSeen: null },
{ name: 'PHARI075', ip: '10.10.3.111', status: 'unknown', lastSeen: null }
    ];
    
    this.activeUsers = new Set();
    this.dailyStats = {
      totalPrints: 0,
      totalPages: 0,
      uniqueUsers: 0,
      activePrinters: 0
    };
    
    this.monitoringInterval = null;
    this.statsUpdateInterval = null;
  }

  // Iniciar monitoreo
  startMonitoring() {
    console.log('🚀 Iniciando monitoreo del Print Server...');
    
    // Verificar estado de impresoras cada 5 minutos
    this.monitoringInterval = setInterval(() => {
      this.checkPrinterStatus();
    }, 5 * 60 * 1000); // 5 minutos
    
    // Actualizar estadísticas cada minuto
    this.statsUpdateInterval = setInterval(() => {
      this.updateDailyStats();
    }, 60 * 1000); // 1 minuto
    
    // Verificación inicial
    this.checkPrinterStatus();
    this.updateDailyStats();
  }

  // Detener monitoreo
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.statsUpdateInterval) {
      clearInterval(this.statsUpdateInterval);
    }
    console.log('⏹️ Monitoreo detenido');
  }

  // Verificar estado de impresoras mediante ping
  async checkPrinterStatus() {
    console.log('🔍 Verificando estado de impresoras...');
    
    const checkPromises = this.printers.map(async (printer) => {
      try {
        const isOnline = await this.pingPrinter(printer.ip);
        printer.status = isOnline ? 'online' : 'offline';
        printer.lastSeen = isOnline ? new Date() : printer.lastSeen;
        
        console.log(`📠 ${printer.name} (${printer.ip}): ${printer.status}`);
        return printer;
      } catch (error) {
        console.error(`❌ Error verificando ${printer.name}:`, error.message);
        printer.status = 'error';
        return printer;
      }
    });

    await Promise.all(checkPromises);
    this.updatePrinterStats();
  }

  // Función para hacer ping a una impresora
  async pingPrinter(ip) {
    // En un entorno real, esto se implementaría con:
    // - Node.js: child_process.exec('ping -c 1 ' + ip)
    // - Python: subprocess.run(['ping', '-c', '1', ip])
    // - Bash: ping -c 1 $ip > /dev/null 2>&1
    
    return new Promise((resolve) => {
      // Simulación de ping (en producción usarías el comando real)
      const isOnline = Math.random() > 0.1; // 90% de probabilidad de estar online
      setTimeout(() => resolve(isOnline), 100);
    });
  }

  // Actualizar estadísticas de impresoras
  updatePrinterStats() {
    const onlinePrinters = this.printers.filter(p => p.status === 'online').length;
    this.dailyStats.activePrinters = onlinePrinters;
    
    // Actualizar el contador en el dashboard
    this.updateDashboardCounter('printers', onlinePrinters);
    
    console.log(`📊 Impresoras activas: ${onlinePrinters}/${this.printers.length}`);
  }

  // Registrar una impresión (llamado cuando un usuario imprime)
  recordPrint(userId, printerName, pages) {
    const timestamp = new Date();
    
    // Agregar usuario a la lista de activos
    this.activeUsers.add(userId);
    
    // Actualizar estadísticas diarias
    this.dailyStats.totalPrints++;
    this.dailyStats.totalPages += pages;
    this.dailyStats.uniqueUsers = this.activeUsers.size;
    
    console.log(`🖨️ Impresión registrada: ${userId} -> ${printerName} (${pages} páginas)`);
    
    // Actualizar contadores en el dashboard
    this.updateDashboardCounter('prints', this.dailyStats.totalPrints);
    this.updateDashboardCounter('pages', this.dailyStats.totalPages);
    this.updateDashboardCounter('users', this.dailyStats.uniqueUsers);
  }

  // Actualizar estadísticas diarias
  updateDailyStats() {
    // Limpiar usuarios inactivos (no han impreso en las últimas 24 horas)
    this.cleanInactiveUsers();
    
    // Actualizar contadores en el dashboard
    this.updateDashboardCounter('prints', this.dailyStats.totalPrints);
    this.updateDashboardCounter('pages', this.dailyStats.totalPages);
    this.updateDashboardCounter('users', this.dailyStats.uniqueUsers);
    this.updateDashboardCounter('printers', this.dailyStats.activePrinters);
    
    console.log('📈 Estadísticas actualizadas:', this.dailyStats);
  }

  // Limpiar usuarios inactivos
  cleanInactiveUsers() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // En un entorno real, verificarías la base de datos para ver
    // qué usuarios no han impreso desde ayer
    console.log('🧹 Limpiando usuarios inactivos...');
  }

  // Actualizar contador en el dashboard
  updateDashboardCounter(type, value) {
    // En un entorno real, esto enviaría los datos al frontend
    // mediante WebSockets o Server-Sent Events
    
    const event = new CustomEvent('statsUpdate', {
      detail: { type, value }
    });
    
    // Enviar evento al frontend
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
    
    // También podrías guardar en localStorage para persistencia
    localStorage.setItem(`printServer_${type}`, value);
  }

  // Obtener estadísticas actuales
  getCurrentStats() {
    return {
      ...this.dailyStats,
      printers: this.printers.map(p => ({
        name: p.name,
        status: p.status,
        lastSeen: p.lastSeen
      }))
    };
  }

  // Reiniciar estadísticas diarias (llamar a medianoche)
  resetDailyStats() {
    this.dailyStats = {
      totalPrints: 0,
      totalPages: 0,
      uniqueUsers: 0,
      activePrinters: this.dailyStats.activePrinters // Mantener contador de impresoras
    };
    
    this.activeUsers.clear();
    
    console.log('🔄 Estadísticas diarias reiniciadas');
  }
}

// Ejemplo de uso en el frontend
class DashboardUpdater {
  constructor() {
    this.monitor = new PrintServerMonitor();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Escuchar actualizaciones del servidor
    window.addEventListener('statsUpdate', (event) => {
      const { type, value } = event.detail;
      this.updateCounter(type, value);
    });

    // Cargar datos al iniciar
    this.loadInitialData();
  }

  updateCounter(type, value) {
    const counterElement = document.querySelector(`[data-counter="${type}"]`);
    if (counterElement) {
      // Animación suave del contador
      this.animateCounter(counterElement, value);
    }
  }

  animateCounter(element, newValue) {
    const currentValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
    const increment = (newValue - currentValue) / 10;
    let current = currentValue;

    const animate = () => {
      current += increment;
      if ((increment > 0 && current >= newValue) || 
          (increment < 0 && current <= newValue)) {
        element.textContent = newValue.toLocaleString();
      } else {
        element.textContent = Math.floor(current).toLocaleString();
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  loadInitialData() {
    // Cargar datos desde localStorage o hacer petición al servidor
    const prints = localStorage.getItem('printServer_prints') || '0';
    const pages = localStorage.getItem('printServer_pages') || '0';
    const users = localStorage.getItem('printServer_users') || '0';
    const printers = localStorage.getItem('printServer_printers') || '0';

    this.updateCounter('prints', parseInt(prints));
    this.updateCounter('pages', parseInt(pages));
    this.updateCounter('users', parseInt(users));
    this.updateCounter('printers', parseInt(printers));
  }
}

// Ejemplo de implementación en el servidor (Node.js)
/*
const { exec } = require('child_process');

class PrinterPinger {
  static async ping(ip) {
    return new Promise((resolve) => {
      const command = process.platform === 'win32' 
        ? `ping -n 1 ${ip}` 
        : `ping -c 1 ${ip}`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
}

// Ejemplo de uso con Express.js
app.get('/api/stats', (req, res) => {
  const stats = monitor.getCurrentStats();
  res.json(stats);
});

app.post('/api/print', (req, res) => {
  const { userId, printerName, pages } = req.body;
  monitor.recordPrint(userId, printerName, pages);
  res.json({ success: true });
});
*/

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new DashboardUpdater();
  
  // Simular algunas impresiones para demostración
  setTimeout(() => {
    dashboard.monitor.recordPrint('ph03272', 'PHARI064', 5);
  }, 2000);
  
  setTimeout(() => {
    dashboard.monitor.recordPrint('ph03273', 'PHARI065', 3);
  }, 4000);
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PrintServerMonitor, DashboardUpdater };
} 