import Phaser from 'phaser';
import { DataKeys } from '../../consts/Keys';
import { GameUtils } from '../../utils/GameUtils';
import { PaintManager } from '../../utils/PaintManager';

export class LevelLoader {
    static loadLevel(
        scene: Phaser.Scene,
        paintManager: PaintManager,
        onDebugRequest: (target: Phaser.GameObjects.Image) => void,
        autoScales?: { group1: number, group2: number }
    ) {
        const unfinishedPartsMap = new Map<string, Phaser.GameObjects.Image>();
        let totalParts = 0;

        const data = scene.cache.json.get(DataKeys.LevelS2Config);
        const manifest = scene.cache.json.get('game_manifest');
        console.log("Level Data:", data);

        if (manifest && manifest.scenes && manifest.scenes.scene2) {
            const partsCfg = manifest.scenes.scene2.parts;

            // Group 1 (Category 1)
            if (partsCfg.group1) {
                const combined = partsCfg.group1.map((p: any) => {
                    const configPart = data.goalkeeper?.parts?.find((cp: any) => cp.key === p.key);
                    return { ...p, ...configPart };
                });
                // USE autoScale group1 if available
                const scale = autoScales?.group1 ?? data.goalkeeper?.baseScale ?? 0.7;
                spawnParts(scene, paintManager, unfinishedPartsMap, combined, data.goalkeeper?.baseX_pct ?? 0.32, data.goalkeeper?.baseY_pct ?? 0.48, scale, onDebugRequest);
            }

            // Group 2 (Category 2)
            if (partsCfg.group2) {
                const combined = partsCfg.group2.map((p: any) => {
                    const configPart = data.letter?.parts?.find((cp: any) => cp.key === p.key);
                    return { ...p, ...configPart };
                });
                // USE autoScale group2 if available
                const scale = autoScales?.group2 ?? data.letter?.baseScale ?? 0.7;
                spawnParts(scene, paintManager, unfinishedPartsMap, combined, data.letter?.baseX_pct ?? 0.73, data.letter?.baseY_pct ?? 0.48, scale, onDebugRequest);
            }
        } else if (data) {
            // Fallback for games without manifest
            if (data.goalkeeper && data.goalkeeper.parts) {
                spawnParts(scene, paintManager, unfinishedPartsMap, data.goalkeeper.parts, data.goalkeeper.baseX_pct, data.goalkeeper.baseY_pct, data.goalkeeper.baseScale ?? 0.7, onDebugRequest);
            }
            if (data.letter && data.letter.parts) {
                spawnParts(scene, paintManager, unfinishedPartsMap, data.letter.parts, data.letter.baseX_pct, data.letter.baseY_pct, data.letter.baseScale ?? 0.7, onDebugRequest);
            }
        }

        totalParts = unfinishedPartsMap.size;
        return { partsMap: unfinishedPartsMap, totalParts };
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function spawnParts(
    scene: Phaser.Scene,
    paintManager: PaintManager,
    map: Map<string, Phaser.GameObjects.Image>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parts: any[],
    baseXPct: number,
    baseYPct: number,
    baseScale: number,
    onDebugRequest: (target: Phaser.GameObjects.Image) => void
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parts.forEach((part: any, index: number) => {
        const id = part.id || `${part.key}_${index}`;

        const cx = GameUtils.getW(scene) * baseXPct;
        const cy = GameUtils.getH(scene) * baseYPct;

        // const scaleAdjust = part.scaleAdjust !== undefined ? part.scaleAdjust : 1;
        const scale = part.scale || baseScale || 1.0;

        // // Apply scale to offsets to make them responsive
        // const layerX = cx + (part.offsetX || 0) * scale;
        // const layerY = cy + (part.offsetY || 0) * scale;

        // const hitArea = paintManager.createPaintableLayer(layerX, layerY, part.key, scale, id, scaleAdjust);


        const scaleAdjust = part.scaleAdjust !== undefined ? part.scaleAdjust : 1;

        // outlineScale = scale mà outline đang dùng (autoScale)
        // part.scale nếu có thì coi là multiplier (không override outline)
        const outlineScale = baseScale;
        const partScaleMul = part.scale !== undefined ? part.scale : 1;
        const partScale = outlineScale * partScaleMul;

        // ✅ offset phải scale theo outline
        const layerX = cx + (part.offsetX || 0) * outlineScale;
        const layerY = cy + (part.offsetY || 0) * outlineScale;

        const hitArea = paintManager.createPaintableLayer(layerX, layerY, part.key, partScale, id, scaleAdjust);

        // ✅ lưu scale rõ ràng
        hitArea.setData('outlineScale', outlineScale);
        hitArea.setData('originScale', partScale); // giữ để tương thích code cũ

        hitArea.setData('hintX', part.hintX || 0);
        hitArea.setData('hintY', part.hintY || 0);
        hitArea.setData('originScale', scale);
        hitArea.setData('baseX', cx);
        hitArea.setData('baseY', cy);
        hitArea.setData('partKey', part.key);
        hitArea.setData('partId', id);

        map.set(id, hitArea);

        hitArea.setInteractive();
        hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                onDebugRequest(hitArea);
            }
        });
    }
    );

}
