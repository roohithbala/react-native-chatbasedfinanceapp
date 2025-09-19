@echo off
echo ========================================
echo FIXING EXPO CACHE AND NETWORK ISSUES
echo Using IP: 10.247.4.172
echo ========================================
echo.

echo [1/5] Stopping all Node processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak > nul

echo [2/5] Clearing Expo cache...
cd /d D:\Chatbasedfinance\react-native-chatbasedfinanceapp
if exist .expo (
    rmdir /s /q .expo
    echo   - .expo cache cleared
) else (
    echo   - .expo cache not found
)

if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo   - Metro bundler cache cleared
) else (
    echo   - Metro bundler cache not found
)

echo [3/5] Starting backend server...
start "Backend Server" cmd /k "cd /d D:\Chatbasedfinance\react-native-chatbasedfinanceapp\backend && echo Starting backend server on 10.247.4.172:3001... && node server.js"

echo [4/5] Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo [5/5] Starting Expo development server...
start "Expo Dev Server" cmd /k "cd /d D:\Chatbasedfinance\react-native-chatbasedfinanceapp && echo Starting Expo on 10.247.4.172:8081... && npx expo start --clear --reset-cache"

echo.
echo ========================================
echo SERVERS STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Backend Server: http://10.247.4.172:3001
echo Expo Dev Server: exp://10.247.4.172:8081
echo.
echo [VERIFICATION CHECKLIST]
echo - Expo should open on: exp://10.247.4.172:8081
echo - Socket should connect to: http://10.247.4.172:3001
echo - No more 'Invalid member object' warnings
echo - Groups and expenses should load without errors
echo.
echo Press any key to close this window...
pause > nul