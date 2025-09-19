#!/bin/bash
echo "Clearing Expo cache..."
cd /d/D/Chatbasedfinance/react-native-chatbasedfinanceapp
rm -rf .expo
rm -rf node_modules/.cache

echo "Starting backend server..."
cd backend
node server.js &
BACKEND_PID=$!

sleep 3

echo "Starting Expo development server..."
cd ..
npx expo start --clear --reset-cache &
EXPO_PID=$!

echo "Cache cleared and servers started!"
echo ""
echo "Check that Expo opens on: exp://localhost:8081"
echo "Backend should be running on: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop
trap "kill $BACKEND_PID $EXPO_PID 2>/dev/null; exit" INT
wait