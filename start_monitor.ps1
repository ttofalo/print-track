# Script PowerShell para monitoreo automático de logs CUPS
# Ejecuta procesar_logs.py cada 10 minutos automáticamente

Write-Host "========================================" -ForegroundColor Green
Write-Host "   MONITOR AUTOMATICO DE LOGS CUPS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Cambiar al directorio del script
Set-Location $PSScriptRoot

# Función para ejecutar el procesador de logs
function Invoke-LogProcessor {
    try {
        Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Ejecutando procesamiento de logs..." -ForegroundColor Yellow
        
        $result = & python procesar_logs.py 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Procesamiento completado exitosamente" -ForegroundColor Green
            if ($result) {
                Write-Host "Salida: $result" -ForegroundColor Gray
            }
        } else {
            Write-Host "❌ Error en el procesamiento: $result" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error ejecutando procesador: $_" -ForegroundColor Red
    }
}

# Bucle principal
Write-Host "🚀 Iniciando monitoreo automático cada 10 minutos..." -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Yellow
Write-Host ""

try {
    while ($true) {
        # Ejecutar procesamiento
        Invoke-LogProcessor
        
        # Calcular próxima ejecución
        $nextRun = (Get-Date).AddMinutes(10)
        Write-Host "⏳ Próxima ejecución: $($nextRun.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Cyan
        Write-Host "----------------------------------------" -ForegroundColor Gray
        
        # Esperar 10 minutos
        Start-Sleep -Seconds 600
    }
}
catch {
    Write-Host "🛑 Monitoreo detenido por el usuario" -ForegroundColor Yellow
} 