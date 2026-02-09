import Phaser from 'phaser';

import { SceneKeys, TextureKeys } from '../consts/Keys';
import { GameConstants } from '../consts/GameConstants';
import { IdleManager } from '../utils/IdleManager';
import { PaintManager } from '../utils/PaintManager';
import { resetVoiceState, setGameSceneReference } from '../utils/rotateOrientation';
import AudioManager from '../audio/AudioManager';
import { game } from "@iruka-edu/mini-game-sdk";
import { sdk } from '../main';

import { Scene2Debug } from './components/Scene2Debug';
import { Scene2Intro } from './components/Scene2Intro';
import { LevelLoader } from './components/LevelLoader';
import { Scene2UI } from './components/Scene2UI';
import { ManifestLoader } from '../utils/ManifestLoader';
import { changeBackground } from '../utils/BackgroundManager';

export default class Scene2 extends Phaser.Scene {
    private paintManager!: PaintManager;
    private idleManager!: IdleManager;
    private introManager!: Scene2Intro;

    private unfinishedPartsMap: Map<string, Phaser.GameObjects.Image> = new Map();
    private finishedParts: Set<string> = new Set();
    private totalParts: number = 0;

    private paletteButtons: Phaser.GameObjects.Image[] = [];
    private handHint!: Phaser.GameObjects.Image; // Intro need this
    private activeHintTween: Phaser.Tweens.Tween | null = null;

    private readonly PALETTE_DATA = [
        { key: TextureKeys.BtnRed, color: 0xFF595E },
        { key: TextureKeys.BtnYellow, color: 0xFFCA3A },
        { key: TextureKeys.BtnGreen, color: 0x8AC926 },
        { key: TextureKeys.BtnBlue, color: 0x1982C4 },
        { key: TextureKeys.BtnPurple, color: 0x6A4C93 },
        { key: TextureKeys.BtnCream, color: 0xFDFCDC },
        { key: TextureKeys.BtnBlack, color: 0x000000 }
    ];

    constructor() { super(SceneKeys.Scene2); }

    init() {
        this.unfinishedPartsMap.clear();
        this.finishedParts.clear();
        this.totalParts = 0;
        this.paletteButtons = [];
    }

    preload() {
        const manifest = this.cache.json.get('game_manifest');
        if (manifest) {
            console.log("Scene2: Processing manifest for dynamic assets...");
            ManifestLoader.processManifest(this, manifest);
        }
    }

    create() {
        this.setupSystem();
        const customBg = this.registry.get('custom_bg');
        if (customBg) {
            changeBackground(customBg);
        } else {
            changeBackground('assets/images/bg/backgroud_game.jpg');
        }
        const autoScales = this.createUI();
        this.loadLevel(autoScales);

        // SDK Integration
        game.setTotal(this.totalParts);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).irukaGameState = {
            startTime: Date.now(),
            currentScore: 0,
        };
        sdk.score(0, 0);
        sdk.progress({ levelIndex: 1, total: 2 });

        game.startQuestionTimer();

        this.setupInput();
        this.introManager.playIntroSequence();

        // Debug
        // Scene2Debug.debugShowAllHints(this, this.unfinishedPartsMap);
        // Scene2Debug.debugShowAllOffsets(this, this.unfinishedPartsMap);

        this.events.on('wake', () => {
            this.idleManager.reset();
            if (this.input.keyboard) this.input.keyboard.enabled = true;
        });
    }

    update(time: number, delta: number) {
        if (!this.paintManager.isPainting() && !this.introManager.isIntroActive && this.finishedParts.size < this.totalParts) {
            this.idleManager.update(delta);
        }
    }

    shutdown() {
        this.introManager.stopIntro();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.paintManager = null as any;
    }

    private setupSystem() {
        resetVoiceState();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).gameScene = this;
        setGameSceneReference(this);

        this.paintManager = new PaintManager(this, (id, rt, usedColors) => {
            this.handlePartComplete(id, rt, usedColors);
        });
        this.paintManager.setColor(this.PALETTE_DATA[0].color);

        this.idleManager = new IdleManager(GameConstants.IDLE.THRESHOLD, () => {
            console.log("Idle Manager Triggered!");
            this.showHint();
        });

        this.introManager = new Scene2Intro(this, this.idleManager);
    }

    private createUI() {
        // Fix: Removed firstColorBtn from destructure
        const { handHint, autoScales } = Scene2UI.createUI(this);
        this.handHint = handHint;

        const { paletteButtons, firstColorBtn: pBtn } = Scene2UI.createPalette(this, this.paintManager, this.PALETTE_DATA);
        this.paletteButtons = paletteButtons;

        this.introManager.setTargets(this.handHint, pBtn);
        return autoScales;
    }

    private loadLevel(autoScales: { group1: number, group2: number }) {
        const { partsMap, totalParts } = LevelLoader.loadLevel(this, this.paintManager, (target) => {
            Scene2Debug.enableHintDebug(this, target, this.handHint);
        }, autoScales); // Pass scales
        this.unfinishedPartsMap = partsMap;
        this.totalParts = totalParts;

        // Key P to dump config, H for hints, O for offsets
        this.input.keyboard?.on('keydown-P', () => {
            Scene2Debug.dumpDebugConfig(this, this.unfinishedPartsMap);
        });

        this.input.keyboard?.on('keydown-H', () => {
            Scene2Debug.debugShowAllHints(this, this.unfinishedPartsMap);
        });

        this.input.keyboard?.on('keydown-O', () => {
            Scene2Debug.debugShowAllOffsets(this, this.unfinishedPartsMap);
        });
    }

    private setupInput() {
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.paintManager.handlePointerMove(p));
        this.input.on('pointerup', () => this.paintManager.handlePointerUp());

        this.input.on('pointerdown', () => {
            this.idleManager.reset();
            this.introManager.stopIntro();
        });
    }

    private handlePartComplete(id: string, rt: Phaser.GameObjects.RenderTexture, usedColors: Set<number>) {
        this.finishedParts.add(id);

        game.recordCorrect({ scoreDelta: 1 });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).irukaGameState) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).irukaGameState.currentScore = this.finishedParts.size;
        }
        sdk.score(this.finishedParts.size, 1);
        sdk.progress({
            levelIndex: 1,
            score: this.finishedParts.size,
        });

        if (usedColors.size === 1) {
            const singleColor = usedColors.values().next().value || 0;
            rt.setBlendMode(Phaser.BlendModes.NORMAL);
            rt.fill(singleColor);
        } else {
            console.log("Multi-color artwork preserved!");
        }

        this.unfinishedPartsMap.delete(id);

        AudioManager.play('sfx-ting');

        this.tweens.add({ targets: rt, alpha: 0.8, yoyo: true, duration: GameConstants.SCENE2.TIMING.AUTO_FILL, repeat: 2 });

        if (this.finishedParts.size >= this.totalParts) {
            console.log("WIN!");
            game.finishQuestionTimer();
            game.finalizeAttempt();
            sdk.requestSave({
                score: this.finishedParts.size,
                levelIndex: 1,
            });
            sdk.progress({
                levelIndex: 1,
                total: 2,
                score: this.finishedParts.size,
            });

            AudioManager.play('sfx-correct_s2');
            this.time.delayedCall(GameConstants.SCENE2.TIMING.WIN_DELAY, () => this.scene.start(SceneKeys.EndGame));
        } else {
            game.finishQuestionTimer();
            game.startQuestionTimer();
        }
    }

    private showHint() {
        const items = Array.from(this.unfinishedPartsMap.values());
        if (items.length === 0) return;

        const target = items[Math.floor(Math.random() * items.length)];

        const id = target.getData('partId');
        console.log(`%c[HINT] Hand is pointing to: ${id}`, "color: #e6007e; font-weight: bold; font-size: 14px;");

        AudioManager.play('hint');
        game.addHint();

        const IDLE_CFG = GameConstants.IDLE;

        this.activeHintTween = this.tweens.add({
            targets: target, alpha: { from: 0.01, to: 0.3 },
            scale: { from: target.getData('originScale'), to: target.getData('originScale') * 1.01 },
            duration: IDLE_CFG.FADE_IN, yoyo: true, repeat: 2,
            onComplete: () => { this.activeHintTween = null; this.idleManager.reset(); }
        });

        // const scale = target.getData('originScale') || 1;
        // const hX = (target.getData('hintX') || 0) * scale;
        // const hY = (target.getData('hintY') || 0) * scale;

        //them 3 dong
        const outlineScale = target.getData('outlineScale') || target.getData('originScale') || 1;
        const hX = (target.getData('hintX') || 0) * outlineScale;
        const hY = (target.getData('hintY') || 0) * outlineScale;

        const cx = target.getData('baseX');
        const cy = target.getData('baseY');

        const destX = cx + hX;
        const destY = cy + hY;

        // Apply Tip Correction
        const handDestX = destX + (IDLE_CFG.TIP_OFFSET_X || 0);
        const handDestY = destY + (IDLE_CFG.TIP_OFFSET_Y || 0);

        const startX = handDestX + IDLE_CFG.OFFSET_X;
        const startY = handDestY + IDLE_CFG.OFFSET_Y;

        this.handHint.setPosition(startX, startY).setAlpha(0).setScale(0.7).setDepth(300);

        this.tweens.chain({
            targets: this.handHint,
            tweens: [
                { alpha: 1, x: handDestX, y: handDestY, duration: IDLE_CFG.FADE_IN, ease: 'Power2' },
                { scale: 0.5, duration: IDLE_CFG.SCALE, yoyo: true, repeat: 3 },
                { alpha: 0, duration: IDLE_CFG.FADE_OUT }
            ]
        });
    }

    public restartIntro() {
        this.introManager.restartIntro();
    }
}
