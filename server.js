const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'print_user',
  password: 'Por7a*sis',
  database: 'print_server_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); 

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Rutas de la API

// Endpoint principal - servir el login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Endpoint para el dashboard (mantener para compatibilidad)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para obtener estadísticas del dashboard
app.get('/api/stats', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Obtener estadísticas de hoy
    const [todayStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_prints,
        SUM(pages) as total_pages
      FROM print_jobs 
      WHERE DATE(timestamp) = CURDATE()
    `);
    
    // Obtener estadísticas de ayer
    const [yesterdayStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_prints,
        SUM(pages) as total_pages
      FROM print_jobs 
      WHERE DATE(timestamp) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    `);
    
    const today = todayStats[0];
    const yesterday = yesterdayStats[0];
    
    // Calcular porcentajes de cambio
    const todayPrints = today.total_prints || 0;
    const todayPages = today.total_pages || 0;
    const yesterdayPrints = yesterday.total_prints || 0;
    const yesterdayPages = yesterday.total_pages || 0;
    
    const printsChange = yesterdayPrints === 0 ? 100 : 
      Math.round(((todayPrints - yesterdayPrints) / yesterdayPrints) * 100);
    
    const pagesChange = yesterdayPages === 0 ? 100 : 
      Math.round(((todayPages - yesterdayPages) / yesterdayPages) * 100);
    
    connection.release();
    
    res.json({
      total_prints: todayPrints,
      total_pages: todayPages,
      prints_change: printsChange,
      pages_change: pagesChange
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Endpoint para obtener usuarios más activos
app.get('/api/top-users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Obtener top 5 usuarios por páginas impresas hoy
    const [users] = await connection.execute(`
      SELECT 
        user_id,
        SUM(pages) as total_pages_today
      FROM print_jobs 
      WHERE DATE(timestamp) = CURDATE()
      GROUP BY user_id
      ORDER BY total_pages_today DESC
      LIMIT 5
    `);
    
    connection.release();
    
    res.json(users);
    
  } catch (error) {
    console.error('Error obteniendo usuarios top:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Endpoint para obtener trabajos de impresión con filtros
app.get('/api/print-jobs', async (req, res) => {
  try {
    const { user, dateFrom, dateTo, printer, limit = 1000 } = req.query;
    const connection = await pool.getConnection();
    
    let query = `
      SELECT 
        pj.job_id,
        pj.user_id,
        p.name as printer_name,
        pj.document_name,
        pj.pages,
        pj.copies,
        pj.status,
        pj.timestamp
      FROM print_jobs pj
      JOIN printers p ON pj.printer_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (user && user.trim() !== '') {
      query += ' AND pj.user_id LIKE ?';
      params.push(`%${user.trim()}%`);
    }
    
    if (dateFrom && dateFrom.trim() !== '') {
      query += ' AND DATE(pj.timestamp) >= ?';
      params.push(dateFrom.trim());
    }
    
    if (dateTo && dateTo.trim() !== '') {
      query += ' AND DATE(pj.timestamp) <= ?';
      params.push(dateTo.trim());
    }
    
    if (printer && printer !== 'all' && printer.trim() !== '') {
      query += ' AND p.name = ?';
      params.push(printer.trim());
    }
    
    query += ' ORDER BY pj.timestamp DESC LIMIT 1000';
    
    console.log('Query:', query);
    console.log('Params:', params);
    
    const [jobs] = await connection.execute(query, params);
    connection.release();
    
    res.json(jobs);
    
  } catch (error) {
    console.error('Error obteniendo trabajos de impresión:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Función para obtener la lista de impresoras
function getPrintersList() {
  return [
    { id: 'PHARI018', ip: '10.10.64.17', location: 'PARQUE TANQUES' },
    { id: 'PHARI019', ip: '10.10.64.66', location: 'RECEPCION GRANOS' },
    { id: 'PHARI030', ip: '10.10.64.16', location: 'RECEPCION GRANOS' },
    { id: 'PHARI038', ip: '10.10.64.30', location: 'SISTEMAS' },
    { id: 'PHARI001', ip: '10.10.64.4', location: 'LABORATORIO PLANTA DE ALCOHOL' },
    { id: 'PHARI038', ip: '10.10.64.17', location: 'SISTEMAS' },
    { id: 'PHARI025', ip: '10.10.64.63', location: 'INGENIERÍA' },
    { id: 'PHARI026', ip: '10.10.64.65', location: 'INGENIERÍA' },
    { id: 'PHARI056', ip: '10.10.64.20', location: 'LIDERES CALIDAD' },
    { id: 'PHARI066', ip: '10.10.64.10', location: 'OFICINA LIDERES DE CALIDAD' },
    { id: 'PHARI004', ip: '10.10.64.25', location: 'DOMI SANITARIO' },
    { id: 'PHARI024', ip: '10.10.64.64', location: 'INGENIERIA (RICOH)' },
    { id: 'PHARI031', ip: '10.10.64.22', location: 'ADUANA' },
    { id: 'PHARI039', ip: '10.10.64.29', location: 'BEATO' },
    { id: 'PHARI061', ip: '10.10.64.28', location: 'DOMI SANITARIO' },
    { id: 'PHARI062', ip: '10.10.64.6', location: 'E-COMMERCE DOMI' },
    { id: 'PHARI014', ip: '10.10.64.15', location: 'OFICINA MANTENIMIENTO' },
    { id: 'PHARI048', ip: '10.10.64.27', location: 'OFICINA PLANTA PROTEINAS' },
    { id: 'PHARI023', ip: '10.10.64.36', location: 'PAÑOL' },
    { id: 'PHARI015', ip: '10.10.64.13', location: 'PRODUCCION - BIO 1' },
    { id: 'PHARI016', ip: '10.10.64.209', location: 'IRIS' },
    { id: 'PHARI065', ip: '10.10.64.31', location: 'CAPITAL HUMANO' },
    { id: 'PHARI033', ip: '10.10.64.24', location: 'ADMINISTRACIÓN' },
    { id: 'PHARI036', ip: '10.10.64.3', location: 'ADMINISTRACION' },
    { id: 'PHARI017', ip: '10.10.64.8', location: 'ADMINISTRACION' },
    { id: 'PHARI003', ip: '10.10.64.7', location: 'RECEPCION EDIFICIO ADMINISTRACIÓN' },
    { id: 'PHARI002', ip: '10.10.64.18', location: 'LOGÍSTICA DE EXPEDICIÓN' },
    { id: 'PHARI028', ip: '10.10.64.14', location: 'SOPLADORA' },
    { id: 'PHARI005', ip: '10.10.64.2', location: 'CALIDAD' },
    { id: 'PHARI008', ip: '10.10.64.5', location: 'MARKETING' },
    { id: 'PHARI012', ip: '10.10.64.9', location: 'ADMINISTRACIÓN' },
    { id: 'PHARI064', ip: '10.10.64.21', location: 'PRODUCCION - BIO 2' },
    { id: 'PHARI013', ip: '10.10.64.202', location: 'PRODUCTO TERMINADO' }
  ];
}

// Endpoint para obtener todas las impresoras
app.get('/api/printers', async (req, res) => {
  try {
    const printers = getPrintersList().map(printer => ({
      id: printer.id,
      name: printer.id,
      ip_address: printer.ip,
      location: printer.location,
      model: null
    }));
    
    res.json(printers);
    
  } catch (error) {
    console.error('Error obteniendo impresoras:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Endpoint para verificar estado de impresoras (ping)
app.get('/api/printers/status', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Lista de impresoras con sus IPs
    const printers = getPrintersList();
    
    // Función para hacer ping a una IP
    async function pingPrinter(ip) {
      try {
        // Usar ping con timeout de 2 segundos y solo 1 paquete
        const { stdout, stderr } = await execAsync(`ping -c 1 -W 2 ${ip}`, { timeout: 3000 });
        return { online: true, response: stdout };
      } catch (error) {
        return { online: false, error: error.message };
      }
    }
    
    // Verificar estado de todas las impresoras en paralelo
    const statusPromises = printers.map(async (printer) => {
      const status = await pingPrinter(printer.ip);
      return {
        ...printer,
        status: status.online ? 'online' : 'offline',
        lastCheck: new Date().toISOString(),
        response: status.response || null,
        error: status.error || null
      };
    });
    
    const printerStatuses = await Promise.allSettled(statusPromises);
    
    // Procesar resultados
    const results = printerStatuses.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          ...printers[index],
          status: 'error',
          lastCheck: new Date().toISOString(),
          error: result.reason.message
        };
      }
    });
    
    // Contar impresoras online
    const onlineCount = results.filter(p => p.status === 'online').length;
    const totalCount = results.length;
    
    res.json({
      printers: results,
      summary: {
        online: onlineCount,
        offline: totalCount - onlineCount,
        total: totalCount,
        lastCheck: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error verificando estado de impresoras:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Endpoint de salud del servidor
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
    
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Manejo de errores

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.url,
    method: req.method
  });
});

// Middleware para manejar errores globales
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: error.message
  });
});

// Inicialización del servidor

// Verificar conexión a la base de datos
async function checkDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✓ Base de datos conectada correctamente');
    return true;
  } catch (error) {
    console.error('✗ Error conectando a la base de datos:', error.message);
    return false;
  }
}

// Inicializar el servidor
async function startServer() {
  console.log('🚀 Iniciando Print Server...');
  
  // Verificar conexión a la base de datos
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    console.error('✗ No se pudo conectar a la base de datos. Verificar configuración.');
    process.exit(1);
  }
  
  app.listen(port, '10.10.16.13', () => {
    console.log(`✓ Servidor ejecutándose en http://10.10.16.13:${port}`);
    console.log(`📊 Dashboard disponible en http://10.10.16.13:${port}`);
    console.log(`🔧 API disponible en http://10.10.16.13:${port}/api`);
    console.log(`💚 Health check: http://10.10.16.13:${port}/api/health`);
  });
}

// Manejo de señales de terminación
process.on('SIGINT', () => {
  console.log('\n🛑 Señal de terminación recibida. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Señal de terminación recibida. Cerrando servidor...');
  process.exit(0);
});

// Iniciar el servidor
startServer().catch(error => {
  console.error('✗ Error al iniciar el servidor:', error);
  process.exit(1);
}); 
