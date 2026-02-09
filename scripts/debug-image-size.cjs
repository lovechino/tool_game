const imageSize = require('image-size');
console.log('Type of require("image-size"):', typeof imageSize);
console.log('Keys:', Object.keys(imageSize));
if (typeof imageSize === 'function') console.log('It is a function');
if (imageSize.default) console.log('Current .default:', typeof imageSize.default);
if (imageSize.imageSize) console.log('Current .imageSize:', typeof imageSize.imageSize);

try {
    const path = require('path');
    const file = path.join(__dirname, '../public/assets/reskin/s2_outline_1.png');
    console.log('Testing file:', file);

    if (imageSize.imageSize) {
        console.log('Testing imageSize.imageSize(file)...');
        console.log(imageSize.imageSize(file));
    } else if (typeof imageSize === 'function') {
        console.log('Testing imageSize(file)...');
        console.log(imageSize(file));
    } else if (imageSize.default) {
        console.log('Testing imageSize.default(file)...');
        console.log(imageSize.default(file));
    }
} catch (e) {
    console.error('Error:', e.message);
}
