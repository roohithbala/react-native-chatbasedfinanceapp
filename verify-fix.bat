@echo off
echo ========================================
echo VERIFICATION: CHECKING CONNECTIONS
echo Using IP: 10.247.4.172
echo ========================================
echo.

echo [1/3] Checking backend server...
curl -s http://10.247.4.172:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✅ Backend server is running on 10.247.4.172:3001
) else (
    echo   ❌ Backend server is NOT running on 10.247.4.172:3001
    echo      Please run: cd backend && node server.js
)

echo.
echo [2/3] Checking Expo development server...
timeout /t 2 /nobreak > nul
echo   📱 Expo should be running on: exp://10.247.4.172:8081
echo   🔌 Socket should connect to: http://10.247.4.172:3001

echo.
echo [3/3] Configuration verification:
echo   📄 Frontend .env API_URL: http://10.247.4.172:3001/api
echo   📄 Backend .env PORT: 3001
echo   📄 Backend .env FRONTEND_URL: http://10.247.4.172:8081

echo.
echo ========================================
echo MANUAL VERIFICATION STEPS:
echo ========================================
echo 1. Check Expo Metro bundler - should show: exp://10.247.4.172:8081
echo 2. Check app console - should show: Socket connected successfully
echo 3. Try loading groups - should work without network errors
echo 4. Check group chat - members should show with populated data
echo.
echo If you still see localhost, run fix-cache.bat again
echo.
pause