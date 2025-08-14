-- =====================================================
-- BASE DE DATOS PRINT SERVER - SETUP SIMPLIFICADO
-- =====================================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS print_server_db;
USE print_server_db;

-- =====================================================
-- TABLA DE IMPRESORAS
-- =====================================================
CREATE TABLE printers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nombre de la impresora (ej: PHARI074)',
    ip_address VARCHAR(15) NOT NULL COMMENT 'Dirección IP de la impresora',
    location VARCHAR(100) COMMENT 'Ubicación física de la impresora',
    model VARCHAR(100) COMMENT 'Modelo de la impresora',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
    
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA DE TRABAJOS DE IMPRESIÓN
-- =====================================================
CREATE TABLE print_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id VARCHAR(50) NOT NULL COMMENT 'ID del trabajo de CUPS',
    user_id VARCHAR(50) NOT NULL COMMENT 'Usuario que imprimió (ej: ph03272)',
    printer_id INT NOT NULL COMMENT 'ID de la impresora',
    document_name VARCHAR(255) COMMENT 'Nombre del documento impreso',
    pages INT NOT NULL DEFAULT 1 COMMENT 'Número de páginas',
    copies INT NOT NULL DEFAULT 1 COMMENT 'Número de copias',
    status ENUM('completed', 'pending', 'cancelled', 'error') DEFAULT 'completed' COMMENT 'Estado del trabajo',
    timestamp TIMESTAMP NOT NULL COMMENT 'Fecha y hora de la impresión',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
    
    FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE CASCADE,
    
    INDEX idx_timestamp (timestamp),
    INDEX idx_user_id (user_id),
    INDEX idx_printer_id (printer_id),
    INDEX idx_status (status),
    INDEX idx_job_id (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERTAR DATOS DE EJEMPLO
-- =====================================================

-- Insertar impresoras de ejemplo
INSERT INTO printers (name, ip_address, location, model) VALUES
('PHARI074', '10.10.3.110', 'Oficina Principal', 'HP LaserJet Pro M404n'),
('PHARI075', '10.10.3.111', 'Sala de Reuniones', 'HP LaserJet Pro M404n'),
('PHARI076', '10.10.3.112', 'Área de Producción', 'HP LaserJet Pro M404n'),
('PHARI077', '10.10.3.113', 'Recepción', 'HP LaserJet Pro M404n'),
('PHARI078', '10.10.3.114', 'Almacén', 'HP LaserJet Pro M404n');

-- Insertar trabajos de impresión de ejemplo (últimas 24 horas)
INSERT INTO print_jobs (job_id, user_id, printer_id, document_name, pages, copies, status, timestamp) VALUES
('001', 'ph03272', 1, 'Reporte_Mensual.pdf', 45, 1, 'completed', NOW() - INTERVAL 2 HOUR),
('002', 'ph03150', 1, 'Factura_001.pdf', 2, 1, 'completed', NOW() - INTERVAL 3 HOUR),
('003', 'ph03272', 2, 'Presentacion.pptx', 15, 1, 'completed', NOW() - INTERVAL 4 HOUR),
('004', 'ph03300', 1, 'Contrato.pdf', 8, 2, 'completed', NOW() - INTERVAL 5 HOUR),
('005', 'ph03150', 3, 'Manual.pdf', 25, 1, 'completed', NOW() - INTERVAL 6 HOUR),
('006', 'ph03272', 1, 'Boleta.pdf', 1, 1, 'completed', NOW() - INTERVAL 7 HOUR),
('007', 'ph03300', 2, 'Informe.pdf', 12, 1, 'completed', NOW() - INTERVAL 8 HOUR),
('008', 'ph03150', 1, 'Recibo.pdf', 1, 1, 'completed', NOW() - INTERVAL 9 HOUR),
('009', 'ph03272', 4, 'Documento.pdf', 5, 1, 'completed', NOW() - INTERVAL 10 HOUR),
('010', 'ph03300', 1, 'Reporte.pdf', 30, 1, 'completed', NOW() - INTERVAL 11 HOUR);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para estadísticas del dashboard
CREATE VIEW dashboard_stats AS
SELECT 
    COUNT(*) as total_prints,
    SUM(pages) as total_pages
FROM print_jobs 
WHERE DATE(timestamp) = CURDATE();

-- =====================================================
-- CONSULTAS DE EJEMPLO PARA TESTING
-- =====================================================

-- Ver estadísticas del dashboard
-- SELECT * FROM dashboard_stats;

-- Ver trabajos de impresión recientes
-- SELECT 
--     pj.job_id,
--     pj.user_id,
--     p.name as printer_name,
--     pj.document_name,
--     pj.pages,
--     pj.timestamp
-- FROM print_jobs pj
-- JOIN printers p ON pj.printer_id = p.id
-- ORDER BY pj.timestamp DESC
-- LIMIT 10;

-- =====================================================
-- FIN DEL SCRIPT
-- ===================================================== 