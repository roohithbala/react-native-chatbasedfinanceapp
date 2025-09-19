@echo off
echo Starting React Native Chat Finance App
echo Using IP Address: 10.247.4.172
echo ========================================
echo.

echo [1/2] Starting Backend Server...
start "Backend" cmd /k "cd /d D:\Chatbasedfinance\react-native-chatbasedfinanceapp\backend && node server.js"

echo [2/2] Starting Expo Development Server...
start "Expo" cmd /k "cd /d D:\Chatbasedfinance\react-native-chatbasedfinanceapp && npx expo start --clear"

echo.
echo Servers starting...
echo Backend: http://10.247.4.172:3001
echo Expo: exp://10.247.4.172:8081
echo.
echo Press any key to close...
pause > nul