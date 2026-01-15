@echo off
echo ====================================
echo   Deploy PWA to Netlify
echo ====================================
echo.
echo [1/2] Building PWA...
call npm run build
echo.
echo [2/2] Deploying to Netlify...
echo.
echo First time? You'll need to:
echo   1. Login to Netlify
echo   2. Create a new site (or link existing)
echo   3. Confirm deployment
echo.
call netlify deploy --prod --dir=dist
echo.
echo ====================================
echo   Deployment Complete!
echo ====================================
echo.
echo Open the URL shown above on your phone
echo and tap "Add to Home Screen"
echo.
pause
