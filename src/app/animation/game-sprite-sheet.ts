import { GameSpriteAtlas } from 'app/animation/game-sprite-atlas';


export class GameSpriteSheet {

    textureUnit_: number;
    textureWidth_: number;
    textureHeight_: number;
    perSpriteFrameOffset_: number;

    constructor(private atlas_: GameSpriteAtlas, private name_, private params_: SpriteSheetParams, private image_?: HTMLImageElement) {
        this.textureUnit_ = 0;
        this.perSpriteFrameOffset_ = 0;
        if (image_) {
            this.onload_();
        }
    }

    //l'image est déjà chargée
    startLoading() {
        let image = new Image();

        this.image_ = image;
        image.onload = () => {
            this.onload_();
        };
        image.src = this.params_.url;
    }
    onload_() {
        this.atlas_.spriteSheetLoaded_(this, this.image_, this.params_);
    };
    initialize(textureUnit, width, height) {
        this.textureUnit_ = textureUnit;
        this.textureWidth_ = width;
        this.textureHeight_ = height;
    }
    createSprite(system, centerX: number, centerY: number, rotation: number, velocityX: number, velocityY: number) {
        var perSpriteFrameOffset = this.perSpriteFrameOffset_++;
        if (this.perSpriteFrameOffset_ >= this.params_.frames) {
            this.perSpriteFrameOffset_ = 0;
        }
        // Generalize the sprite size to vec2 if sprites are non-square.
        var spriteSize: number = this.params_.width;
        var spriteTextureSizeX: number = (1.0 * this.params_.width) / this.textureWidth_;
        var spriteTextureSizeY: number = (1.0 * this.params_.height) / this.textureHeight_;
        var spritesPerRow: number = this.params_.spritesPerRow;
        var numFrames: number = this.params_.frames;
        var textureWeights: Array<number> = [0.0, 0.0, 0.0, 0.0];
        textureWeights[this.textureUnit_] = 1.0;
        system.addSprite(centerX, centerY,
            rotation,
            velocityX, velocityY,
            perSpriteFrameOffset,
            spriteSize,
            spriteTextureSizeX, spriteTextureSizeY,
            spritesPerRow,
            numFrames,
            textureWeights);
    }
}


export interface SpriteSheetParams {
    url: string,
    frames: number,
    spritesPerRow: number,
    framepos: Array<Array<number>>,
    width: number,
    height: number
}