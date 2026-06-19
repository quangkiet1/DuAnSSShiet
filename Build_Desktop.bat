@echo off
chcp 65001 >nul
title Build GradeSync Desktop App

echo.
echo ===================================================
echo   BUILD PHAN MEM GRADESYNC - DESKTOP VERSION
echo ===================================================
echo.

:: Kiem tra Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js!
    echo Tai ve tai: https://nodejs.org
    pause
    exit /b
)

:: Buoc 1: Build giao dien Frontend
echo [1/5] Dang build giao dien Frontend...
cd gradesync-frontend
call npm install
if %errorlevel% neq 0 ( echo [LOI] npm install frontend that bai! & pause & exit /b )
call npm run build
if %errorlevel% neq 0 ( echo [LOI] npm run build that bai! & pause & exit /b )
cd ..

echo.
echo [2/5] Dang copy giao dien da build...
if not exist "gradesync-desktop\public" mkdir "gradesync-desktop\public"
xcopy /E /I /Y "gradesync-frontend\dist" "gradesync-desktop\public" >nul

echo.
echo [3/5] Dang copy source code Backend...
if not exist "gradesync-desktop\src" mkdir "gradesync-desktop\src"
xcopy /E /I /Y "gradesync-backend\src" "gradesync-desktop\src" >nul

echo.
echo [4/5] Dang copy icon...
if not exist "gradesync-desktop\build" mkdir "gradesync-desktop\build"
if exist "gradesync-desktop\build\icon.png" (
    echo    Icon da co san.
) else (
    echo    [CANH BAO] Khong tim thay icon.png trong gradesync-desktop\build\
    echo    Se dung icon mac dinh cua Electron.
)

echo.
echo [5/5] Dang cai thu vien va dong goi ung dung...
cd gradesync-desktop
call npm install
if %errorlevel% neq 0 ( echo [LOI] npm install desktop that bai! & pause & exit /b )
call npm run dist
if %errorlevel% neq 0 ( echo [LOI] Dong goi ung dung that bai! & pause & exit /b )
cd ..

echo.
echo ===================================================
echo  HOAN THANH! File cai dat nam trong thu muc:
echo  dist-installer\
echo ===================================================
echo.
pause
