import { GameSpriteSheet } from 'app/animation/game-sprite-sheet';
import { GameSpriteSystem } from 'app/animation/game-sprite-system';

//choper ça dans https://www.spriters-resource.com/pc_computer/diablo2diablo2lordofdestruction/
import { SpriteParam } from 'app/animation/game-sprite-system'

interface SpriteMovement {
    isMoving: boolean,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number
}

export class GameSprite {
    private vertices: Array<number>;

    private movement: SpriteMovement;
    private speed: number = 100;

    /**
     * Factory
     */
    static buildGameSpriteFactory(system: GameSpriteSystem, spriteSheet: GameSpriteSheet, spriteParam: SpriteParam) {
        let sprite = new GameSprite(system, spriteSheet, spriteParam);
        sprite.resetMovement();
        return sprite;
    }

    private constructor(private system: GameSpriteSystem, public spriteSheet: GameSpriteSheet, public spriteParam: SpriteParam) { }

    public createSprite() {
        this.vertices = this.spriteSheet.createSprite(
            this.system,
            this.spriteParam);
    }

    public moveBy(x, y) {
        let spritePosition: SpriteParam = this.getSpriteParam();

        let targetX: number = x ? x + spritePosition.centerX : null;
        let targetY: number = y ? y + spritePosition.centerY : null;

        this.moveTo(targetX, targetY);
    }

    public moveTo(targetX, targetY) {

        let spritePosition: SpriteParam = this.getSpriteParam();

        let actualX = spritePosition.centerX;
        let actualY = spritePosition.centerY;
        let velocityX = this.getVelocity(actualX, targetX);
        let velocityY = this.getVelocity(actualY, targetY);

        this.spriteParam = {
            velocityX: velocityX,
            velocityY: velocityY
        };

        this.movement = {
            isMoving: true,
            startX: actualX,
            startY: actualY,
            targetX: targetX,
            targetY: targetY
        };


        this.updateSpriteParam(this.spriteParam);
    }

    private getVelocity(actual, target) {
        if (target == null) {
            return 0;
        }

        return target > actual ? this.speed : -this.speed;
    }

    public checkSpritePosition() {
        if (!this.movement.isMoving) {
            return
        }
        if (!this.isKeepMoving()) {
            this.resetMovement();
            this.updateSpriteParam(this.spriteParam);
        }
    }

    private resetMovement(): void {
        this.movement = {
            isMoving: false,
            startX: null,
            startY: null,
            targetX: null,
            targetY: null
        };
    }

    private isKeepMoving(): boolean {
        let spritePosition: SpriteParam = this.getSpriteParam();

        let actualX = spritePosition.centerX;
        let actualY = spritePosition.centerY;
        let targetX = this.movement.targetX;
        let targetY = this.movement.targetY;
        let velocityX = spritePosition.velocityX;
        let velocityY = spritePosition.velocityY;
        let keepMovingFlag: boolean = true;

        if (!this.checkPosition(actualX, targetX, velocityX)) {
            this.spriteParam.velocityX = 0;
            this.spriteParam.centerX = targetX;
            keepMovingFlag = false;
        }
        if (!this.checkPosition(actualY, targetY, velocityY)) {
            this.spriteParam.velocityY = 0;
            this.spriteParam.centerY = targetY;
            keepMovingFlag = false;
        }

        return keepMovingFlag;
    }

    /**
     * returns true if sprite is not yet arrived (or is not arrived next frame)
     */
    private checkPosition(actual: number, target, velocity): boolean {
        if (velocity > 0) {
            return target > (actual);
        }
        return target < (actual);
    }

    private getSpriteParam(): SpriteParam {
        return this.system.getVertexPosition(this.vertices[0]);
    }

    private updateSpriteParam(param: SpriteParam) {
        this.system.updateSpriteInfo(this.vertices, param);
    }
}