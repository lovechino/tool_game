import Phaser from 'phaser';
import { GameConstants } from '../../consts/GameConstants';
import { GameUtils } from '../../utils/GameUtils';
import { TextureKeys } from '../../consts/Keys';
import { PaintManager } from '../../utils/PaintManager';

export class Scene2UI {
    static createUI(scene: Phaser.Scene) {
        const UI = GameConstants.SCENE2.UI;
        const cx = GameUtils.pctX(scene, 0.5);
        const bannerY = GameUtils.pctY(scene, UI.BANNER_Y);

        // --- BOARD (Puzzle Area) ---
        // Move board down more to match reference image 2
        const boardY = GameUtils.pctY(scene, 0.50); // Increased from 0.45 to 0.50
        const boardScale = 0.7;

        // Banner
        const banner = scene.add.image(cx, bannerY, TextureKeys.S2_Banner).setOrigin(0.5, 0);

        // Banner Scaling Logic (Same as Scene 1)
        const maxBannerWidth = scene.scale.width * 0.7;
        if (banner.width > maxBannerWidth) {
            banner.setDisplaySize(maxBannerWidth, banner.height * (maxBannerWidth / banner.width));
        } else {
            banner.setScale(0.7);
        }


        // Banner Frame Wrapper (Decorative border)
        if (scene.textures.exists(TextureKeys.BannerFrame)) {
            const frameWrapper = scene.add.image(cx, bannerY, TextureKeys.BannerFrame)
                .setOrigin(0.5, 0)
                .setDepth(banner.depth - 1);

            // Resize frame to wrap around inner banner with padding
            const framePaddingX = 60; // Extra width on each side
            const framePaddingY = 30; // Extra height top/bottom
            frameWrapper.setDisplaySize(
                banner.displayWidth + framePaddingX,
                banner.displayHeight + framePaddingY
            );
        }

        // Optional Text Banner
        if (scene.textures.exists(TextureKeys.S2_TextBanner)) {
            scene.add.image(cx, bannerY + 50, TextureKeys.S2_TextBanner).setScale(0.7);
        }

        // Single central board
        // Widen the board (Scale X increased to 1.45)
        // Ensure we use 's2_board' key which maps to board_scene_2.png
        scene.add.image(cx, boardY, TextureKeys.S2_Board) // Changed from S2_Rectangle1 to S2_Board
            .setOrigin(0.5, 0.5)
            .setScale(boardScale * 1.45, boardScale * 1.05);

        // Optional: common board behind objects
        if (scene.textures.exists('common_board')) {
            scene.add.image(cx, boardY, 'common_board')
                .setOrigin(0.5, 0.5)
                .setScale(boardScale * 1.4, boardScale);
        }

        // --- OUTLINES (Visual Guides) ---
        const outlineY = GameUtils.pctY(scene, 0.40); // Adjusted higher again per request
        const outline1X = GameUtils.pctX(scene, 0.32); // Matches Group 1 X
        const outline2X = GameUtils.pctX(scene, 0.73); // Matches Group 2 X

        // Auto-calc scales if not provided
        // We want the octopus to fit roughly within 40% width and 45% height of screen
        const scale1 = GameUtils.getScaleToFit(scene, 's2_outline_1', 0.5, 0.6);
        const scale2 = GameUtils.getScaleToFit(scene, 's2_outline_2', 0.35, 0.6);

        // Outline 1 (Visual Guide)
        if (scene.textures.exists('s2_outline_1')) {
            // High depth to be on top of paint
            scene.add.image(outline1X, outlineY, 's2_outline_1')
                .setScale(scale1)
                .setDepth(20);
        }

        // Outline 2 (Visual Guide)
        if (scene.textures.exists('s2_outline_2')) {
            scene.add.image(outline2X, outlineY, 's2_outline_2')
                .setScale(scale2)
                .setDepth(20);
        }

        // Footer Text
        if (scene.textures.exists(TextureKeys.S2_TextScene2)) {
            // Position relative to board bottom
            const txtY = GameUtils.pctY(scene, 0.68); // Adjusted to be between outline and palette
            scene.add.image(cx + 100, txtY, TextureKeys.S2_TextScene2).setOrigin(0.5, 0.5).setScale(boardScale * 0.85);
        }

        // Hand Hint
        const handHint = scene.add.image(0, 0, TextureKeys.HandHint).setAlpha(0).setDepth(100);

        return { handHint, boardCenterX: cx, boardCenterY: boardY, boardScale, autoScales: { group1: scale1, group2: scale2 } };
    }

    static createPalette(scene: Phaser.Scene, paintManager: PaintManager, paletteData: { key: string, color: number }[]) {
        const UI = GameConstants.SCENE2.UI;
        const startX = GameUtils.pctX(scene, 0.5) - (paletteData.length - 1) * GameUtils.pctX(scene, UI.PALETTE_SPACING) / 2;
        const y = GameUtils.pctY(scene, UI.PALETTE_Y);

        const paletteButtons: Phaser.GameObjects.Image[] = [];

        paletteData.forEach((p, i) => {
            const btn = scene.add.image(startX + i * GameUtils.pctX(scene, UI.PALETTE_SPACING), y, p.key)
                .setInteractive({ useHandCursor: true })
                .setScale(0.8); // Init scale

            // Selected effect logic
            btn.on('pointerdown', () => {
                paletteButtons.forEach(b => b.setScale(0.8).clearTint());
                btn.setScale(1.0);
                paintManager.setColor(p.color);
            });

            // Default select first one
            if (i === 0) {
                btn.setScale(1.0);
                paintManager.setColor(p.color);
            }

            paletteButtons.push(btn);
        });

        return { paletteButtons, firstColorBtn: paletteButtons[0] };
    }
}
