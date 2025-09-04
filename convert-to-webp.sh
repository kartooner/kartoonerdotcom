#!/bin/bash

# Convert images to WebP format for optimal web performance
# Requires: webp tools (cwebp command)

echo "🖼️  Converting images to WebP format..."
echo

# Check if cwebp is available
if ! command -v cwebp &> /dev/null; then
    echo "❌ Error: cwebp not found!"
    echo "Please install WebP tools:"
    echo "  • Ubuntu/Debian: apt-get install webp"
    echo "  • macOS: brew install webp"
    echo "  • Or download from: https://developers.google.com/speed/webp/download"
    exit 1
fi

# Function to convert image with size comparison
convert_image() {
    local input="$1"
    local quality="$2"
    local extra_flags="$3"
    
    if [ -f "$input" ]; then
        local output="${input%.*}.webp"
        local filename=$(basename "$input")
        
        echo "🔄 Converting $filename..."
        
        if [ -n "$extra_flags" ]; then
            cwebp -q "$quality" $extra_flags "$input" -o "$output"
        else
            cwebp -q "$quality" "$input" -o "$output"
        fi
        
        if [ -f "$output" ]; then
            local input_size=$(stat -f%z "$input" 2>/dev/null || stat -c%s "$input" 2>/dev/null || echo "unknown")
            local output_size=$(stat -f%z "$output" 2>/dev/null || stat -c%s "$output" 2>/dev/null || echo "unknown")
            
            if [[ "$input_size" != "unknown" && "$output_size" != "unknown" ]]; then
                local savings=$((100 - (output_size * 100 / input_size)))
                echo "  ✅ $filename: $(numfmt --to=iec $input_size) → $(numfmt --to=iec $output_size) (${savings}% smaller)"
            else
                echo "  ✅ $filename: Converted successfully"
            fi
        else
            echo "  ❌ Failed to convert $filename"
        fi
    else
        echo "  ⏭️  Skipping $filename (not found)"
    fi
}

echo "🎯 Converting high-priority images (maximum compression)..."

# Large images - prioritize file size reduction
convert_image "img/xwing-ink-thumb.png" 80
convert_image "img/sketch-of-kcd2.JPG" 85  
convert_image "img/og-friendly-introduction-to-svg.png" 80
convert_image "img/pathfinder-thumb.png" 80
convert_image "img/manager-thumb.jpeg" 85
convert_image "img/power-pole.jpg" 85

echo
echo "📱 Converting medium-priority images (balanced quality/size)..."

convert_image "img/erik-avatar.jpg" 90
convert_image "img/darkwing-sprite.png" 85 "-lossless"  # Sprite needs crisp edges
convert_image "img/invader-thumb.png" 80

echo
echo "📚 Converting book covers and smaller images (higher quality)..."

convert_image "img/phil-hartman-cover.jpg" 90
convert_image "img/marc-davis-cover.jpg" 90
convert_image "img/bg.jpg" 85
convert_image "img/lisa-os-thumb.png" 85

echo
echo "📊 Summary:"

total_original=0
total_webp=0
count=0

for webp_file in img/*.webp; do
    if [ -f "$webp_file" ]; then
        # Find original file
        base="${webp_file%.*}"
        original=""
        for ext in jpg jpeg png JPG; do
            if [ -f "$base.$ext" ]; then
                original="$base.$ext"
                break
            fi
        done
        
        if [ -n "$original" ] && [ -f "$original" ]; then
            orig_size=$(stat -f%z "$original" 2>/dev/null || stat -c%s "$original" 2>/dev/null)
            webp_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null)
            
            if [[ "$orig_size" =~ ^[0-9]+$ ]] && [[ "$webp_size" =~ ^[0-9]+$ ]]; then
                total_original=$((total_original + orig_size))
                total_webp=$((total_webp + webp_size))
                count=$((count + 1))
            fi
        fi
    fi
done

if [ $count -gt 0 ] && [ $total_original -gt 0 ]; then
    total_savings=$((100 - (total_webp * 100 / total_original)))
    echo "  📈 Total savings: $(numfmt --to=iec $((total_original - total_webp))) (${total_savings}% reduction)"
    echo "  📦 Original total: $(numfmt --to=iec $total_original)"
    echo "  🎉 WebP total: $(numfmt --to=iec $total_webp)"
else
    echo "  ℹ️  Unable to calculate total savings"
fi

echo
echo "🚀 Next steps:"
echo "  1. Update your HTML to use enhanced-progressive-images.js"
echo "  2. Test WebP loading in different browsers"
echo "  3. Monitor Core Web Vitals improvements"
echo "  4. Consider setting up automated WebP generation in your build process"
echo
echo "✨ WebP conversion complete!"