import { GameSpriteSheet } from 'app/animation/game-sprite-sheet';
import { GameSpriteSystem } from 'app/animation/game-sprite-system';

//choper ça dans https://www.spriters-resource.com/pc_computer/diablo2diablo2lordofdestruction/
export class GameSprite {

    private vertices: Array<number>;

    constructor(private system: GameSpriteSystem, public spriteSheet: GameSpriteSheet, public spriteParam: SpriteParam) {
    }

    public createSprite() {
        this.vertices = this.spriteSheet.createSprite(
            this.system,
            this.spriteParam.centerX,
            this.spriteParam.centerY,
            this.spriteParam.rotation,
            this.spriteParam.velocityX,
            this.spriteParam.velocityY);
    }

    updateSpriteParam(param: SpriteParam) {
        this.system.updateSpriteInfo(this.vertices,
            param.centerX,
            param.centerY,
            param.rotation,
            param.velocityX,
            param.velocityY);
    }
}


export interface SpriteParam {
    centerX: number,
    centerY: number,
    rotation: number,
    velocityX: number,
    velocityY: number
}