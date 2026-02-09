const fs = require('fs');
const path = require('path');
const imageSizePkg = require('image-size');
const sizeOf = typeof imageSizePkg === 'function' ? imageSizePkg : imageSizePkg.imageSize || imageSizePkg.default;

const RESKIN_DIR = path.join(__dirname, '../public/assets/reskin');

// Test the getAutoFitScale function
function getAutoFitScale(outlinePath, partPath) {
    try {
        if (!fs.existsSync(outlinePath) || !fs.existsSync(partPath)) {
            console.warn(`⚠️  Missing image: ${!fs.existsSync(outlinePath) ? outlinePath : partPath}`);
            return 1.0;
        }

        const outlineBuffer = fs.readFileSync(outlinePath);
        const partBuffer = fs.readFileSync(partPath);

        const outlineDims = sizeOf(outlineBuffer);
        const partDims = sizeOf(partBuffer);

        const scaleByWidth = outlineDims.width / partDims.width;
        const scaleByHeight = outlineDims.height / partDims.height;

        const autoScale = Math.min(scaleByWidth, scaleByHeight);

        console.log(`📐 Auto-fit: ${path.basename(partPath)} → ${path.basename(outlinePath)}`);
        console.log(`   Outline: ${outlineDims.width}x${outlineDims.height}, Part: ${partDims.width}x${partDims.height}`);
        console.log(`   Scale by width: ${scaleByWidth.toFixed(3)}, by height: ${scaleByHeight.toFixed(3)}`);
        console.log(`   Final scale: ${autoScale.toFixed(3)}`);

        return parseFloat(autoScale.toFixed(3));
    } catch (error) {
        console.error(`❌ Error calculating scale: ${error.message}`);
        return 1.0;
    }
}

// Test with actual files
const outlinePath = path.join(__dirname, '../public/assets/reskin/s2_outline_1.png');
const partPath = path.join(__dirname, '../public/assets/reskin/s2_part_1_oc_1.png');

console.log('Testing getAutoFitScale...\n');
const scale = getAutoFitScale(outlinePath, partPath);
console.log(`\nResult: ${scale}`);
