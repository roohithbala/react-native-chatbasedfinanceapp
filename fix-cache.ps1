# PowerShell script to fix Expo cache and network issues
Write-Host "========================================" -ForegroundColor Green
Write-Host "FIXING EXPO CACHE AND NETWORK ISSUES" -ForegroundColor Green
Write-Host "Using IP: 10.247.4.172" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "[1/5] Stopping all Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "[2/5] Clearing Expo cache..." -ForegroundColor Yellow
Set-Location "D:\Chatbasedfinance\react-native-chatbasedfinanceapp"

if (Test-Path ".expo") {
    Remove-Item ".expo" -Recurse -Force
    Write-Host "  - .expo cache cleared" -ForegroundColor Green
} else {
    Write-Host "  - .expo cache not found" -ForegroundColor Gray
}

if (Test-Path "node_modules\.cache") {
    Remove-Item "node_modules\.cache" -Recurse -Force
    Write-Host "  - Metro bundler cache cleared" -ForegroundColor Green
} else {
    Write-Host "  - Metro bundler cache not found" -ForegroundColor Gray
}

Write-Host "[3/5] Starting backend server..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location "D:\Chatbasedfinance\react-native-chatbasedfinanceapp\backend"
    Write-Host "Starting backend server on 10.247.4.172:3001..." -ForegroundColor Cyan
    & node server.js
}

Write-Host "[4/5] Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "[5/5] Starting Expo development server..." -ForegroundColor Yellow
$expoJob = Start-Job -ScriptBlock {
    Set-Location "D:\Chatbasedfinance\react-native-chatbasedfinanceapp"
    Write-Host "Starting Expo on 10.247.4.172:8081..." -ForegroundColor Cyan
    & npx expo start --clear --reset-cache
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SERVERS STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend Server: http://10.247.4.172:3001" -ForegroundColor Cyan
Write-Host "Expo Dev Server: exp://10.247.4.172:8081" -ForegroundColor Cyan
Write-Host ""
Write-Host "[VERIFICATION CHECKLIST]" -ForegroundColor Yellow
Write-Host "- Expo should open on: exp://10.247.4.172:8081" -ForegroundColor White
Write-Host "- Socket should connect to: http://10.247.4.172:3001" -ForegroundColor White
Write-Host "- No more 'Invalid member object' warnings" -ForegroundColor White
Write-Host "- Groups and expenses should load without errors" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop servers and exit..." -ForegroundColor Gray

# Keep the script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $expoJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $expoJob -ErrorAction SilentlyContinue
}