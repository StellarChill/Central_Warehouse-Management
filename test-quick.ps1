$ErrorActionPreference = "Stop"
Write-Host "Testing backend connection..."
try {
    $r = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 5
    Write-Host "Health: $($r.status) - DB: $($r.database)"
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    exit 1
}

Write-Host ""
Write-Host "Testing login..."
try {
    $body = '{"UserName":"platform-admin","UserPassword":"admin123"}'
    $r = Invoke-RestMethod -Uri "http://localhost:3000/api/login" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 5
    Write-Host "Login OK! User: $($r.user.UserName), Role: $($r.user.RoleCode)"
    Write-Host "Token: $($r.token.Substring(0,30))..."
}
catch {
    Write-Host "Login ERROR: $($_.Exception.Message)"
}
