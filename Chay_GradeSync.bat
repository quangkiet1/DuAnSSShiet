@echo off
chcp 65001 >nul
title Phần mềm So sánh bảng điểm GradeSync

echo ===================================================
echo     KHOI DONG PHAN MEM GRADESYNC - LOCAL MODE
echo ===================================================
echo.

:: Kiểm tra xem Node.js đã được cài đặt chưa
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js tren may tinh nay!
    echo Vui long truy cap https://nodejs.org de tai va cai dat Node.js truoc.
    pause
    exit /b
)

:: Kiểm tra xem Frontend đã được build chưa (thư mục dist)
if not exist "gradesync-frontend\dist" (
    echo [1/3] Dang chuan bi giao dien lan dau - chi chay 1 lan...
    cd gradesync-frontend
    call npm install
    call npm run build
    cd ..
)

echo [2/3] Dang khoi dong may chu Backend...
cd gradesync-backend
if not exist "node_modules" (
    echo Dang cai dat thu vien Backend...
    call npm install
)

echo [3/3] Mo trinh duyet...
start http://localhost:5000

echo.
echo ===================================================
echo HE THONG DANG HOAT DONG! 
echo KHONG TAT CUA SO NAY TRONG QUA TRINH SU DUNG PHAN MEM.
echo De tat phan mem, hay tat cua so mau den nay.
echo ===================================================
cmd /k "node server.js"
