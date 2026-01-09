Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "MONGODB CONNECTION STRING COMPARISON" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$currentEnv = Get-Content backend\.env | Select-String "MONGODB_URI"
$templateEnv = Get-Content backend\.env.TEMPLATE | Select-String "MONGODB_URI" | Select-Object -First 1

Write-Host "CURRENT (.env file):" -ForegroundColor Yellow
Write-Host $currentEnv
Write-Host ""

Write-Host "SHOULD BE (.env.TEMPLATE):" -ForegroundColor Green
Write-Host $templateEnv
Write-Host ""

# Check if database name is present
if ($currentEnv -match "\.net/[^?]+\?") {
    Write-Host "✅ Database name IS present in connection string" -ForegroundColor Green
    
    # Extract database name
    if ($currentEnv -match "\.net/([^?]+)\?") {
        $dbName = $matches[1]
        Write-Host "   Database: $dbName" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Database name is MISSING from connection string" -ForegroundColor Red
    Write-Host "   Currently connects to: 'test' (MongoDB default)" -ForegroundColor Red
    Write-Host ""
    Write-Host "ACTION REQUIRED:" -ForegroundColor Yellow
    Write-Host "1. Open backend\.env file" -ForegroundColor White
    Write-Host "2. Find: .net/?" -ForegroundColor White
    Write-Host "3. Change to: .net/fins_pro?" -ForegroundColor White
    Write-Host "4. Save the file (Ctrl+S)" -ForegroundColor White
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
