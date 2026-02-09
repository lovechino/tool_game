import Phaser from 'phaser';
import { GameConstants } from '../../consts/GameConstants';
import { GameUtils } from '../../utils/GameUtils';
import { TextureKeys } from '../../consts/Keys';
import AudioManager from '../../audio/AudioManager';

export class Scene1UI {
    static createBanner(scene: Phaser.Scene) {
        const UI = GameConstants.SCENE1.UI;
        const cx = GameUtils.pctX(scene, 0.5);
        const bannerY = GameUtils.pctY(scene, UI.BANNER_Y);

        // Uses the STANDARDIZED KEY mapped by ManifestLoader
        const bannerBg = scene.add.image(cx, bannerY, TextureKeys.S1_BannerBg)
            .setOrigin(0.5, 0);

        // Banner Scaling Logic
        const maxBannerWidth = scene.scale.width * 0.7;
        if (bannerBg.width > maxBannerWidth) {
            bannerBg.setDisplaySize(maxBannerWidth, bannerBg.height * (maxBannerWidth / bannerBg.width));
        } else {
            bannerBg.setScale(0.7);
        }


        // Banner Frame Wrapper (Decorative border)
        if (scene.textures.exists(TextureKeys.BannerFrame)) {
            const frameWrapper = scene.add.image(cx, bannerY, TextureKeys.BannerFrame)
                .setOrigin(0.5, 0)
                .setDepth(bannerBg.depth - 1);

            // Resize frame to wrap around inner banner with padding
            const framePaddingX = 60; // Extra width on each side
            const framePaddingY = 30; // Extra height top/bottom
            frameWrapper.setDisplaySize(
                bannerBg.displayWidth + framePaddingX,
                bannerBg.displayHeight + framePaddingY
            );
        }

        // Optional Text Banner
        if (scene.textures.exists(TextureKeys.S1_BannerText)) {
            const textY = bannerY + bannerBg.displayHeight / 2;
            scene.add.image(cx, textY, TextureKeys.S1_BannerText).setScale(0.7);
        }

        const handHint = scene.add.image(0, 0, TextureKeys.HandHint)
            .setDepth(200).setAlpha(0).setScale(0.7);

        return { bannerBg, handHint };
    }

    static createLeftPanel(scene: Phaser.Scene, bannerBg: Phaser.GameObjects.Image, isGameActive: () => boolean) {
        const UI = GameConstants.SCENE1.UI;
        const ANIM = GameConstants.SCENE1.ANIM;

        const boardY = bannerBg.displayHeight + GameUtils.pctY(scene, UI.BOARD_OFFSET);
        const boardX = GameUtils.pctX(scene, 0.5) - GameUtils.pctY(scene, UI.BOARD_MARGIN_X);

        // Main Board Placeholder
        // Important: Get width AFTER scaling
        const boardLeft = scene.add.image(boardX, boardY, TextureKeys.S1_Board)
            .setOrigin(1, 0).setScale(0.7).setVisible(true);

        const centerX = boardX - (boardLeft.displayWidth / 2);
        // Visual Board (Blue Frame)
        // Check removed: always use S1_Board as requested

        // --- CONTENT LAYOUT ---
        // 1. Header: Icon + Bubble (Top)
        // Move slightly higher than before (0.15 -> 0.12)
        const bubbleY = boardY + boardLeft.displayHeight * 0.12;
        const bubbleX = centerX - 30;
        // Icon (Smile) - Left aligned relative to center?
        // Image 2 shows "Smile [t]" usually centered or slightly left.
        // Let's keep it centered for now but use standardized key.

        // const icon = scene.add.image(centerX, bubbleY, TextureKeys.S1_IconOHeader).setScale(0.7);

        // 2. Body: Poem Text (Middle)
        // Move higher to create space for the example image below and separate them
        const poemY = boardY + boardLeft.displayHeight * 0.38;
        const poemText = scene.add.image(centerX, poemY, TextureKeys.S1_PoemText)
            .setScale(0.7).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });

        // Ellipse Overlay (Above poem)
        if (scene.textures.exists(TextureKeys.S1_Ellipse)) {
            // Position at the top of the board (bubbleY is ~12% from top)
            scene.add.image(centerX - 30, bubbleY, TextureKeys.S1_Ellipse)
                .setScale(0.7).setOrigin(0.5, 0.5).setDepth(10);
        }

        scene.tweens.add({ targets: poemText, y: '+=10', duration: ANIM.POEM_FLOAT, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        poemText.on('pointerdown', () => {
            if (isGameActive()) {
                AudioManager.stopAll();
                AudioManager.play('cau_do');
                scene.tweens.add({ targets: poemText, scale: 0.6, duration: 100, yoyo: true, ease: 'Sine.easeInOut' });
            }
        });

        // 3. Footer: Reference Image (Bottom)
        // Position at ~78% height and scale down to fit inside board
        const refImageY = boardY + boardLeft.displayHeight * 0.78;
        scene.add.image(centerX, refImageY, TextureKeys.S1_Player).setScale(0.6);
    }

    static createRightPanel(
        scene: Phaser.Scene,
        bannerBg: Phaser.GameObjects.Image,
        itemsData: { key: string, isCorrect: boolean }[],
        onPuzzleItemClick: (item: Phaser.GameObjects.Image, isCorrect: boolean) => void
    ) {
        const UI = GameConstants.SCENE1.UI;

        const boardY = bannerBg.displayHeight + GameUtils.pctY(scene, UI.BOARD_OFFSET);
        const boardX = GameUtils.pctX(scene, 0.5) + GameUtils.pctY(scene, UI.BOARD_MARGIN_X);

        // Uses STANDARDIZED KEY
        const boardRight = scene.add.image(boardX, boardY, TextureKeys.S1_Board)
            .setOrigin(0, 0).setScale(0.7).setVisible(true);

        const centerX = boardX + (boardRight.displayWidth / 2); // boardX is Left edge, so Add half width
        const centerY = boardY + boardRight.displayHeight / 2;

        // Visual Board
        // Check removed: always use S1_Board as requested

        const puzzleItems: Phaser.GameObjects.Image[] = [];

        const createItem = (x: number, y: number, key: string, isCorrect: boolean) => {
            const item = scene.add.image(x, y, key).setInteractive({ useHandCursor: true }).setScale(0.7);
            item.setData('isCorrect', isCorrect);

            scene.tweens.add({ targets: item, y: y - 10, duration: GameConstants.SCENE1.ANIM.FLOAT, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

            item.on('pointerdown', () => {
                onPuzzleItemClick(item, isCorrect);
            });

            puzzleItems.push(item);
            return item;
        };

        // Fallback default items if manifest had none
        const finalItems = (itemsData && itemsData.length > 0) ? itemsData : [
            { key: 's1_item_crab', isCorrect: false },
            { key: 's1_item_fish', isCorrect: false },
            { key: 's1_item_shrimp', isCorrect: true }
        ];

        // Layout items
        const spacing = boardRight.displayWidth * 0.4;
        finalItems.forEach((item, index) => {
            let x = centerX;
            let y = centerY;
            if (finalItems.length === 3) {
                if (index === 0) { x = centerX + spacing * 0.5; y = centerY - spacing; } // Top Right
                else if (index === 1) { x = centerX - spacing * 0.5; y = centerY; }      // Mid Left
                else { x = centerX + spacing * 0.5; y = centerY + spacing; }             // Bot Right
            } else if (finalItems.length === 2) {
                x = centerX + (index === 0 ? -spacing : spacing);
            }
            createItem(x, y, item.key, item.isCorrect);
        });

        // Result / Success state
        // BgPopup now mapped to reskin result bg
        const victoryBg = scene.add.image(centerX, centerY, TextureKeys.BgPopup).setScale(0).setDepth(20);

        // S1_TextResult mapped to reskin text
        const victoryText = scene.add.image(centerX, centerY + 120, TextureKeys.S1_TextResult)
            .setAlpha(0).setDepth(21).setScale(0.8);

        return { puzzleItems, victoryBg, victoryText };
    }
}
