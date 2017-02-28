import { GameSpriteSystem } from 'app/animation/game-sprite-system';
import { GameSpriteAtlas } from 'app/animation/game-sprite-atlas';
import { SpriteParam } from 'app/animation/game-sprite-system'

export class GameSpriteSheet {

    textureUnit_: number;
    textureWidth_: number;
    textureHeight_: number;
    perSpriteFrameOffset_: number;

    constructor(private atlas_: GameSpriteAtlas, private params_: SpriteSheetParams) {
        this.textureUnit_ = 0;
        this.perSpriteFrameOffset_ = 0;
        if (!params_.image) {
            this.onload_();
        }
    }

    //l'image est déjà chargée
    startLoading() {
        let image = new Image();

        this.params_.image = image;
        image.onload = () => {
            this.onload_();
        };
        image.src = this.params_.url;
    }
    onload_() {
        this.atlas_.spriteSheetLoaded_(this, this.params_);
    };
    initialize(textureUnit, width, height) {
        this.textureUnit_ = textureUnit;
        this.textureWidth_ = width;
        this.textureHeight_ = height;
    }

    createSprite(spriteSystem: GameSpriteSystem, spriteParam:SpriteParam) : Array<number>{
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
        return spriteSystem.addSprite(spriteParam,
            perSpriteFrameOffset,
            spriteSize,
            spriteTextureSizeX,
            spriteTextureSizeY,
            spritesPerRow,
            numFrames,
            textureWeights);
    }
}

export interface SpriteSheetParams {
    name: string,
    url?: string,
    image?: HTMLImageElement,
    frames: number,
    spritesPerRow: number,
    framepos: Array<Array<number>>,
    width: number,
    height: number
}