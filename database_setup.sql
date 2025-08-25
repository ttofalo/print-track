-- =====================================================
-- BASE DE DATOS PRINT SERVER - SETUP
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE CASCADE,
    
    INDEX idx_timestamp (timestamp),
    INDEX idx_user_id (user_id),
    INDEX idx_printer_id (printer_id),
    INDEX idx_status (status),
    INDEX idx_job_id (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATOS INICIALES (MÍNIMOS PARA TESTING)
-- =====================================================

-- Insertar 2 impresoras de ejemplo
INSERT INTO printers (name, ip_address, location, model) VALUES
('PHARI074', '10.10.3.110', 'Oficina Principal', 'HP LaserJet Pro M404n'),
('PHARI075', '10.10.3.111', 'Sala de Reuniones', 'HP LaserJet Pro M404n');

-- Insertar 3 trabajos de impresión de ejemplo
INSERT INTO print_jobs (job_id, user_id, printer_id, document_name, pages, copies, status, timestamp) VALUES
('001', 'ph03272', 1, 'Reporte_Mensual.pdf', 45, 1, 'completed', NOW() - INTERVAL 2 HOUR),
('002', 'ph03150', 1, 'Factura_001.pdf', 2, 1, 'completed', NOW() - INTERVAL 3 HOUR),
('003', 'ph03272', 2, 'Presentacion.pptx', 15, 1, 'completed', NOW() - INTERVAL 4 HOUR);

-- =====================================================
-- VISTA PARA ESTADÍSTICAS DEL DASHBOARD
-- =====================================================
CREATE VIEW dashboard_stats AS
SELECT 
    COUNT(*) as total_prints,
    SUM(pages) as total_pages
FROM print_jobs 
WHERE DATE(timestamp) = CURDATE(); 