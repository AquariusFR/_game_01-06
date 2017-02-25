import ImageToLoad from 'app/loader/image-to-load';
import GameCamera from 'app/game-camera';
import GameWebglUtils from 'app/game-webgl-utils';
import { GameSpriteLibrary } from 'app/animation/game-sprite-library';
import { GameSpriteAtlas } from 'app/animation/game-sprite-atlas';
import { GameSpriteSheet, SpriteSheetParams } from 'app/animation/game-sprite-sheet';

//choper ça dans https://www.spriters-resource.com/pc_computer/diablo2diablo2lordofdestruction/
export default class GameSprite {

    spriteSheet: GameSpriteSheet;

    constructor(private atlas: GameSpriteAtlas, public spriteName: string, public params: SpriteSheetParams) {
    }

    public onImageLoaded() {
        this.spriteSheet = this.atlas.addSpriteSheet(this.spriteName, this.params);
    }
}