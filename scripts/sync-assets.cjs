const fs = require('fs');
const path = require('path');
const imageSizePkg = require('image-size');
const sizeOf = typeof imageSizePkg === 'function' ? imageSizePkg : imageSizePkg.imageSize || imageSizePkg.default;
const sharp = require('sharp');

const PUBLIC_DIR = process.env.PUBLIC_DIR || '../public';

// Helper to resolve paths relative to PUBLIC_DIR (which might be absolute)
const resolvePath = (subPath) => {
    if (path.isAbsolute(PUBLIC_DIR)) {
        return path.join(PUBLIC_DIR, subPath);
    }
    return path.join(__dirname, PUBLIC_DIR, subPath);
};

const RESKIN_DIR = resolvePath('assets/reskin');
const MANIFEST_PATH = resolvePath('assets/data/game_manifest.json');
const CONFIG_PATH = resolvePath('assets/data/level_s2_config.json');

/**
 * Calculate hint position by finding center of mass of non-transparent pixels
 * @param {string} partPath - Absolute path to part image
 * @returns {Promise<{hintX: number, hintY: number}>} - Hint offset from center
 */
async function calculateHintFromPixels(partPath) {
    try {
        if (!fs.existsSync(partPath)) {
            console.warn(`⚠️  Part image not found: ${partPath}`);
            return { hintX: 0, hintY: 0 };
        }

        // Read image data with sharp
        const { data, info } = await sharp(partPath)
            .ensureAlpha() // Ensure alpha channel exists
            .raw()
            .toBuffer({ resolveWithObject: true });

        let totalX = 0, totalY = 0, count = 0;

        // Iterate through all pixels to find non-transparent ones
        for (let y = 0; y < info.height; y++) {
            for (let x = 0; x < info.width; x++) {
                const idx = (y * info.width + x) * info.channels;
                const alpha = data[idx + 3]; // Alpha channel

                if (alpha > 0) { // Non-transparent pixel
                    totalX += x;
                    totalY += y;
                    count++;
                }
            }
        }

        if (count === 0) {
            console.warn(`⚠️  No visible pixels in ${path.basename(partPath)}`);
            return { hintX: 0, hintY: 0 };
        }

        // Calculate center of mass
        const centerOfMassX = totalX / count;
        const centerOfMassY = totalY / count;

        // Calculate image center
        const imageCenterX = info.width / 2;
        const imageCenterY = info.height / 2;

        // Calculate offset from center
        const hintX = Math.round(centerOfMassX - imageCenterX);
        const hintY = Math.round(centerOfMassY - imageCenterY);

        console.log(`   🎯 Center of mass: (${centerOfMassX.toFixed(1)}, ${centerOfMassY.toFixed(1)}) → Hint: (${hintX}, ${hintY})`);

        return { hintX, hintY };
    } catch (error) {
        console.error(`❌ Error calculating hint from pixels: ${error.message}`);
        return { hintX: 0, hintY: 0 };
    }
}

/**
 * Calculate auto-fit scale and offsets for a part based on outline dimensions
 * IMPORTANT: This assumes Phaser sprites use origin (0.5, 0.5) - centered
 * @param {string} outlinePath - Absolute path to outline image
 * @param {string} partPath - Absolute path to part image
 * @returns {{scale: number, offsetX: number, offsetY: number, hintX: number, hintY: number}} - Scale, offsets, and hint position
 */
function getAutoFitScale(outlinePath, partPath) {
    try {
        if (!fs.existsSync(outlinePath) || !fs.existsSync(partPath)) {
            console.warn(`⚠️  Missing image: ${!fs.existsSync(outlinePath) ? 'outline' : 'part'}`);
            return { scale: 1.0, offsetX: 0, offsetY: 0, hintX: 0, hintY: 0 }; // Default values if files don't exist
        }

        // Read images as buffers for image-size
        const outlineBuffer = fs.readFileSync(outlinePath);
        const partBuffer = fs.readFileSync(partPath);

        const outlineDims = sizeOf(outlineBuffer);
        const partDims = sizeOf(partBuffer);

        // Calculate scale based on the smaller ratio (width or height) to ensure part fits within outline
        const scaleByWidth = outlineDims.width / partDims.width;
        const scaleByHeight = outlineDims.height / partDims.height;

        // Use the smaller scale to ensure the part fits completely
        const autoScale = Math.min(scaleByWidth, scaleByHeight);

        // ✅ PHASER USES ORIGIN (0.5, 0.5) - CENTER POINT
        // When both outline and part use center origin and are at the same position,
        // they automatically align to center. Therefore, offset should be 0.
        // Only adjust offset if you need to deliberately shift the part from center.
        const offsetX = 0;
        const offsetY = 0;

        // Calculate hint position: default to center of outline
        // Hints are typically placed at the center to guide users
        const hintX = 0;
        const hintY = 0;

        console.log(`📐 Auto-fit: ${path.basename(partPath)} → ${path.basename(outlinePath)}`);
        console.log(`   Outline: ${outlineDims.width}x${outlineDims.height}, Part: ${partDims.width}x${partDims.height}`);
        console.log(`   Scale: ${autoScale.toFixed(3)}, Offset: (${offsetX}, ${offsetY}), Hint: (${hintX}, ${hintY})`);

        return {
            scale: parseFloat(autoScale.toFixed(3)),
            offsetX: offsetX,
            offsetY: offsetY,
            hintX: hintX,
            hintY: hintY
        };
    } catch (error) {
        console.error(`❌ Error calculating scale: ${error.message}`);
        return { scale: 1.0, offsetX: 0, offsetY: 0, hintX: 0, hintY: 0 }; // Default values on error
    }
}

async function generateManifest() {
    console.log('Generating game manifest...');

    if (!fs.existsSync(RESKIN_DIR)) {
        fs.mkdirSync(RESKIN_DIR, { recursive: true });
        console.log('Created reskin directory. Please put your assets in public/assets/reskin/');
        return;
    }

    const files = fs.readdirSync(RESKIN_DIR);

    const manifest = {
        metadata: {
            title: "New Game",
            version: "1.0.0"
        },
        common: {},
        scenes: {
            scene1: {
                banner: "assets/reskin/s1_banner.png",
                // textBanner: "assets/reskin/s1_text_banner.png", // REMOVED DEFAULT
                board: "assets/reskin/s1_board.png",
                // bubble: "assets/reskin/s1_bubble.png", // REMOVED DEFAULT
                // refImage: "assets/reskin/s1_ref_image.png", // REMOVED DEFAULT
                resultBg: "assets/reskin/s1_result_bg.png",
                items: []
            },
            scene2: {
                banner: "assets/reskin/s2_banner.png",
                // textBanner: "assets/reskin/s2_text_banner.png", // REMOVED DEFAULT
                board: "assets/reskin/s2_board.png",
                // footerText: "assets/reskin/s2_text_footer.png", // REMOVED DEFAULT
                outlines: [],
                parts: {
                    group1: [],
                    group2: []
                }
            }
        },
        audio: {
            bgm: "assets/audio/sfx/nhac_nen.mp3"
        }
    };

    // --- NEW: Audio Mapping ---
    // s1_audio_poem.mp3 -> cau_do
    if (files.includes('s1_audio_poem.mp3')) manifest.audio.cau_do = "assets/reskin/s1_audio_poem.mp3";
    // s1_audio_correct.mp3 -> voice_cai_o
    if (files.includes('s1_audio_correct.mp3')) manifest.audio.voice_cai_o = "assets/reskin/s1_audio_correct.mp3";
    // s2_audio_intro.mp3 -> voice_intro_s2
    if (files.includes('s2_audio_intro.mp3')) manifest.audio.voice_intro_s2 = "assets/reskin/s2_audio_intro.mp3";

    // --- NEW: Common Background ---
    if (files.includes('background_game.png')) manifest.common.background = "assets/reskin/background_game.png";
    if (files.includes('background_game.jpg')) manifest.common.background = "assets/reskin/background_game.jpg";

    // Auto-detect Scene 1 items
    files.filter(f => f.startsWith('s1_item_')).forEach(f => {
        const isCorrect = f.includes('correct');
        const key = f.split('.')[0];
        manifest.scenes.scene1.items.push({
            key: key,
            path: `assets/reskin/${f}`,
            isCorrect: isCorrect
        });
    });

    // Scene 1 extra assets
    // Scene 1 extra assets
    if (files.includes('s1_text_banner.png')) manifest.scenes.scene1.textBanner = "assets/reskin/s1_text_banner.png";
    if (files.includes('s1_bubble.png')) manifest.scenes.scene1.bubble = "assets/reskin/s1_bubble.png";

    // Logic for Ref Image (Example)
    if (files.includes('s1_example.png')) {
        manifest.scenes.scene1.refImage = "assets/reskin/s1_example.png";
    } else if (files.includes('s1_ref_image.png')) {
        manifest.scenes.scene1.refImage = "assets/reskin/s1_ref_image.png";
    }

    if (files.includes('s1_poem.png')) manifest.scenes.scene1.poem = "assets/reskin/s1_poem.png";
    if (files.includes('s1_result_bg.png')) manifest.scenes.scene1.resultBg = "assets/reskin/s1_result_bg.png";
    if (files.includes('s1_text_result.png')) manifest.scenes.scene1.textResult = "assets/reskin/s1_text_result.png";

    // Auto-detect Scene 2 outlines
    files.filter(f => f.startsWith('s2_outline_')).forEach(f => {
        const key = f.split('.')[0];
        manifest.scenes.scene2.outlines.push({
            key: key,
            path: `assets/reskin/${f}`
        });
    });
    if (files.includes('s2_outline.png') && !files.some(f => f.startsWith('s2_outline_'))) {
        manifest.scenes.scene2.outlines.push({ key: 's2_outline', path: 'assets/reskin/s2_outline.png' });
    }

    // Scene 2 extra assets
    if (files.includes('s2_text_footer.png')) manifest.scenes.scene2.footerText = "assets/reskin/s2_text_footer.png";

    // Auto-detect Scene 2 parts
    files.filter(f => f.startsWith('s2_part_1_')).forEach(f => {
        manifest.scenes.scene2.parts.group1.push({
            key: f.split('.')[0],
            path: `assets/reskin/${f}`
        });
    });

    files.filter(f => f.startsWith('s2_part_2_')).forEach(f => {
        manifest.scenes.scene2.parts.group2.push({
            key: f.split('.')[0],
            path: `assets/reskin/${f}`
        });
    });

    if (manifest.scenes.scene2.parts.group1.length === 0) {
        files.filter(f => f.startsWith('s2_part_') && !f.startsWith('s2_part_1_') && !f.startsWith('s2_part_2_')).forEach(f => {
            manifest.scenes.scene2.parts.group1.push({
                key: f.split('.')[0],
                path: `assets/reskin/${f}`
            });
        });
    }

    // Common assets
    if (files.includes('common_board.png')) manifest.common.board = "assets/reskin/common_board.png";

    // --- NEW: Custom Boards & Banner via Mapping ---
    // Scene 1 Board: board_Scene_1.png -> scene1.board
    if (files.includes('board_Scene_1.png')) {
        manifest.scenes.scene1.board = "assets/reskin/board_Scene_1.png";
    } else if (files.includes('s1_board.png')) {
        manifest.scenes.scene1.board = "assets/reskin/s1_board.png";
    }

    // Scene 2 Board: board_scene_2.png -> scene2.board
    if (files.includes('board_scene_2.png')) {
        manifest.scenes.scene2.board = "assets/reskin/board_scene_2.png";
    } else if (files.includes('s2_board.png')) {
        manifest.scenes.scene2.board = "assets/reskin/s2_board.png";
    }

    // Common Banner: banner.png -> Used for both scenes if available
    if (files.includes('banner.png')) {
        manifest.scenes.scene1.banner = "assets/reskin/banner.png";
        manifest.scenes.scene2.banner = "assets/reskin/banner.png";
    }

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`Manifest saved to ${MANIFEST_PATH}`);

    // --- NEW: Also update level_s2_config.json to reset offsets for reskin assets ---
    // const CONFIG_PATH = path.join(__dirname, '../public/assets/data/level_s2_config.json'); // REMOVED
    let config = {};

    if (fs.existsSync(CONFIG_PATH)) {
        try {
            config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        } catch (e) {
            console.error("Error reading config, creating new one.");
        }
    }

    // Initialize structure if missing
    if (!config.goalkeeper) config.goalkeeper = { baseScale: 0.9, parts: [] };
    if (!config.letter) config.letter = { baseScale: 0.9, parts: [] };

    // Update Goalkeeper Parts (Group 1)
    const group1Keys = manifest.scenes.scene2.parts.group1.map(p => p.key);
    const outlineGroup1 = manifest.scenes.scene2.outlines[0]; // First outline for goalkeeper
    const outlineGroup1Path = outlineGroup1 ? path.join(__dirname, '..', 'public', outlineGroup1.path) : null;

    console.log(`\n📍 Outline Group 1: ${outlineGroup1 ? outlineGroup1.path : 'NOT FOUND'}`);

    console.log('\n🎯 Calculating scales for Goalkeeper parts (Group 1)...');
    config.goalkeeper.parts = await Promise.all(group1Keys.map(async (key) => {
        const existing = config.goalkeeper.parts.find(p => p.key === key) || {};
        const partPath = path.join(RESKIN_DIR, `${key}.png`);

        // Auto-calculate scale and offsets
        let result = { scale: 1.0, offsetX: 0, offsetY: 0 };
        if (outlineGroup1Path && fs.existsSync(outlineGroup1Path)) {
            result = getAutoFitScale(outlineGroup1Path, partPath);
        } else {
            console.warn(`⚠️  No outline found for group 1, using defaults`);
        }

        // ✅ PIXEL-BASED HINT CALCULATION
        // Calculate hint from center of mass of non-transparent pixels
        const { hintX, hintY } = await calculateHintFromPixels(partPath);

        return {
            key: key,
            note: existing.note || "",
            offsetX: result.offsetX,
            offsetY: result.offsetY,
            scaleAdjust: result.scale,
            hintX: hintX,  // PIXEL-BASED!
            hintY: hintY   // PIXEL-BASED!
        };
    }));

    // Update Letter Parts (Group 2)
    const group2Keys = manifest.scenes.scene2.parts.group2.map(p => p.key);
    const outlineGroup2 = manifest.scenes.scene2.outlines[1]; // Second outline for letter
    const outlineGroup2Path = outlineGroup2 ? path.join(__dirname, '..', 'public', outlineGroup2.path) : null;

    console.log('\n🎯 Calculating scales for Letter parts (Group 2)...');
    config.letter.parts = await Promise.all(group2Keys.map(async (key) => {
        const existing = config.letter.parts.find(p => p.key === key) || {};
        const partPath = path.join(RESKIN_DIR, `${key}.png`);

        // Auto-calculate scale and offsets
        let result = { scale: 1.0, offsetX: 0, offsetY: 0 };
        if (outlineGroup2Path && fs.existsSync(outlineGroup2Path)) {
            result = getAutoFitScale(outlineGroup2Path, partPath);
        } else {
            console.warn(`⚠️  No outline found for group 2, using defaults`);
        }

        // ✅ PIXEL-BASED HINT CALCULATION
        const { hintX, hintY } = await calculateHintFromPixels(partPath);

        return {
            key: key,
            note: existing.note || "",
            offsetX: result.offsetX,
            offsetY: result.offsetY,
            scaleAdjust: result.scale,
            hintX: hintX,  // PIXEL-BASED!
            hintY: hintY   // PIXEL-BASED!
        };
    }));

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(`Level Config updated and saved to ${CONFIG_PATH}`);
}

generateManifest().catch(error => {
    console.error('❌ Error generating manifest:', error);
    process.exit(1);
});
