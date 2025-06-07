@echo off
echo ========================================
echo GymDesk Windows Build Script
echo ========================================
echo.

:: Node.js sürümünü kontrol et
echo Node.js sürümü kontrol ediliyor...
node --version
if %errorlevel% neq 0 (
    echo HATA: Node.js bulunamadı! Lütfen Node.js v16-v18 kurun.
    pause
    exit /b 1
)

:: NPM sürümünü kontrol et
echo NPM sürümü kontrol ediliyor...
npm --version
if %errorlevel% neq 0 (
    echo HATA: NPM bulunamadı!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Bağımlılıklar kuruluyor...
echo ========================================
call npm install
if %errorlevel% neq 0 (
    echo HATA: NPM install başarısız!
    pause
    exit /b 1
)

echo.
echo ========================================
echo React uygulaması build ediliyor...
echo ========================================
call npm run build
if %errorlevel% neq 0 (
    echo HATA: React build başarısız!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Electron dependencies rebuild ediliyor...
echo ========================================
call npm run rebuild
if %errorlevel% neq 0 (
    echo UYARI: Electron rebuild başarısız! Devam ediliyor...
)

echo.
echo ========================================
echo Windows installer oluşturuluyor...
echo ========================================
call npm run dist-win
if %errorlevel% neq 0 (
    echo HATA: Windows build başarısız!
    echo.
    echo Alternatif olarak şunları deneyin:
    echo 1. npm run dist-win-nsis
    echo 2. npm run dist-win-portable
    echo 3. npx electron-builder --win --publish never
    pause
    exit /b 1
)

echo.
echo ========================================
echo BUILD BAŞARILI!
echo ========================================
echo.
echo Çıktı dosyaları 'dist' klasöründe:
dir dist\*.exe 2>nul
if %errorlevel% equ 0 (
    echo.
    echo Installer dosyaları hazır!
) else (
    echo UYARI: EXE dosyaları bulunamadı!
)

echo.
echo Build tamamlandı. Herhangi bir tuşa basın...
pause >nul 