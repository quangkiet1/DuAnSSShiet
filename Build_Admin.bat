@echo off
:: Kiem tra xem da co quyen Admin chua
NET SESSION >nul 2>&1
if %errorLevel% neq 0 (
    echo Dang yeu cau quyen Quan tri (Admin) de dong goi file exe...
    echo Vui long bam "Yes" hoac "Co" o bang thong bao hien len.
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

:: Neu da co quyen Admin, bat dau build
cd /d "%~dp0"
title Build GradeSync Desktop
echo ===================================================
echo   DANG DONG GOI UNG DUNG GRADESYNC THANH FILE EXE
echo ===================================================
echo.

:: Build frontend truoc
echo [1/3] Dang chuan bi giao dien...
cd gradesync-frontend
call npm run build
cd ..

:: Copy sang desktop
echo [2/3] Dang copy file...
if not exist "gradesync-desktop\public" mkdir "gradesync-desktop\public"
if not exist "gradesync-desktop\src" mkdir "gradesync-desktop\src"
xcopy /E /I /Y "gradesync-frontend\dist" "gradesync-desktop\public" >nul
xcopy /E /I /Y "gradesync-backend\src" "gradesync-desktop\src" >nul

:: Dong goi exe
echo [3/3] Dang dong goi file exe (vui long doi 1-3 phut)...
cd gradesync-desktop
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npm run dist

echo.
echo ===================================================
echo HOAN THANH! 
echo Ban hay vao thu muc "dist-installer" de lay file exe nhe!
echo ===================================================
pause
