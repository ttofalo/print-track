// Configuración de sectores y sus impresoras asignadas
const SECTORS_CONFIG = {
    'PARQUE TANQUES': ['PHARI018'],
    'RECEPCION GRANOS': ['PHARI019'],
    'LOGISTICA TRANSPORTE': ['PHARI030'],
    'SISTEMAS': ['PHARI038'],
    'LABORATORIO ALCOHOL': ['PHARI001'],
    'INGENIERIA': ['PHARI025', 'PHARI026', 'PHARI024'],
    'LIDERES CALIDAD': ['PHARI056', 'PHARI066'],
    'I+D': ['PHARI056'],
    'DOMI SANITARIO': ['PHARI004', 'PHARI061', 'PHARI062'],
    'MANTENIMIENTO': ['PHARI014'],
    'PLANTA PROTEINAS': ['PHARI048'],
    'PAÑOL': ['PHARI023'],
    'PRODUCCION BIO 1': ['PHARI015'],
    'IRIS': ['PHARI016'],
    'CAPITAL HUMANO': ['PHARI065'],
    'RECEP ADMINISTRACION': ['PHARI003'],
    'ADMINISTRACION 1ER/PISO': ['PHARI027', 'PHARI033'],
    'FABI GOMEZ': ['PHARI036'],
    'ADMINISTRACION 2DO/PISO': ['PHARI012'],
    'LOGISTICA EXPEDICION': ['PHARI002'],
    'SOPLADORA': ['PHARI028'],
    'CALIDAD': ['PHARI005'],
    'MARKETING': ['PHARI008'],
    'PRODUCCION BIO 2': ['PHARI064'],
    'PRODUCTO TERMINADO': ['PHARI013']
};

// Función para obtener el sector de una impresora
function getSectorForPrinter(printerName) {
    for (const [sector, printers] of Object.entries(SECTORS_CONFIG)) {
        if (printers.includes(printerName)) {
            return sector;
        }
    }
    return 'SIN SECTOR'; // Para impresoras no asignadas
}

// Función para obtener todas las impresoras de un sector
function getPrintersForSector(sectorName) {
    return SECTORS_CONFIG[sectorName] || [];
}

// Función para obtener todos los sectores
function getAllSectors() {
    return Object.keys(SECTORS_CONFIG);
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SECTORS_CONFIG,
        getSectorForPrinter,
        getPrintersForSector,
        getAllSectors
    };
}

