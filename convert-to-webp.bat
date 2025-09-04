@echo off
echo Converting images to WebP format...
echo.

REM Check if cwebp (WebP converter) is available
where cwebp >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: cwebp not found! 
    echo Please install WebP tools from: https://developers.google.com/speed/webp/download
    echo Or use online converters for now.
    pause
    exit /b 1
)

REM Create WebP versions of high-priority images
echo Converting high-priority images...

REM Large images (high compression for maximum savings)
if exist "img\xwing-ink-thumb.png" (
    echo Converting xwing-ink-thumb.png...
    cwebp -q 80 img\xwing-ink-thumb.png -o img\xwing-ink-thumb.webp
)

if exist "img\sketch-of-kcd2.JPG" (
    echo Converting sketch-of-kcd2.JPG...
    cwebp -q 85 img\sketch-of-kcd2.JPG -o img\sketch-of-kcd2.webp
)

if exist "img\og-friendly-introduction-to-svg.png" (
    echo Converting og-friendly-introduction-to-svg.png...
    cwebp -q 80 img\og-friendly-introduction-to-svg.png -o img\og-friendly-introduction-to-svg.webp
)

if exist "img\pathfinder-thumb.png" (
    echo Converting pathfinder-thumb.png...
    cwebp -q 80 img\pathfinder-thumb.png -o img\pathfinder-thumb.webp
)

if exist "img\manager-thumb.jpeg" (
    echo Converting manager-thumb.jpeg...
    cwebp -q 85 img\manager-thumb.jpeg -o img\manager-thumb.webp
)

if exist "img\power-pole.jpg" (
    echo Converting power-pole.jpg...
    cwebp -q 85 img\power-pole.jpg -o img\power-pole.webp
)

REM Medium priority images (balanced quality/size)
echo Converting medium-priority images...

if exist "img\erik-avatar.jpg" (
    echo Converting erik-avatar.jpg...
    cwebp -q 90 img\erik-avatar.jpg -o img\erik-avatar.webp
)

if exist "img\darkwing-sprite.png" (
    echo Converting darkwing-sprite.png...
    cwebp -q 85 -lossless img\darkwing-sprite.png -o img\darkwing-sprite.webp
)

if exist "img\invader-thumb.png" (
    echo Converting invader-thumb.png...
    cwebp -q 80 img\invader-thumb.png -o img\invader-thumb.webp
)

REM Book covers and smaller images (higher quality)
echo Converting book covers and smaller images...

if exist "img\phil-hartman-cover.jpg" (
    echo Converting phil-hartman-cover.jpg...
    cwebp -q 90 img\phil-hartman-cover.jpg -o img\phil-hartman-cover.webp
)

if exist "img\marc-davis-cover.jpg" (
    echo Converting marc-davis-cover.jpg...
    cwebp -q 90 img\marc-davis-cover.jpg -o img\marc-davis-cover.webp
)

if exist "img\bg.jpg" (
    echo Converting bg.jpg...
    cwebp -q 85 img\bg.jpg -o img\bg.webp
)

if exist "img\lisa-os-thumb.png" (
    echo Converting lisa-os-thumb.png...
    cwebp -q 85 img\lisa-os-thumb.png -o img\lisa-os-thumb.webp
)

echo.
echo Conversion complete! 
echo.
echo File size comparison:
for %%f in (img\*.webp) do (
    if exist "%%~dpnf.jpg" (
        echo %%~nf: 
        for %%s in ("%%~dpnf.jpg") do echo   JPG: %%~zs bytes
        for %%s in ("%%f") do echo   WebP: %%~zs bytes
        echo.
    )
    if exist "%%~dpnf.png" (
        echo %%~nf: 
        for %%s in ("%%~dpnf.png") do echo   PNG: %%~zs bytes
        for %%s in ("%%f") do echo   WebP: %%~zs bytes
        echo.
    )
    if exist "%%~dpnf.jpeg" (
        echo %%~nf: 
        for %%s in ("%%~dpnf.jpeg") do echo   JPEG: %%~zs bytes
        for %%s in ("%%f") do echo   WebP: %%~zs bytes
        echo.
    )
)

echo Next steps:
echo 1. Replace the enhanced-progressive-images.js in your HTML
echo 2. Test the WebP loading in different browsers
echo 3. Monitor load times and file size savings
echo.
pause