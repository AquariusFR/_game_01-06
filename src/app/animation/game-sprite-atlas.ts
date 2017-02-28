//a virer éventuellement ...
import { GameSpriteSheet, SpriteSheetParams } from 'app/animation/game-sprite-sheet';

export class GameSpriteAtlas {

    onload;
    numOutstandingRequests_: number;
    spriteSheets_: Array<GameSpriteSheet>;
    textures_: Array<WebGLTexture>;
    currentTextureUnit_: number;

    constructor(private gl: WebGLRenderingContext) {
        this.onload = null;
        this.numOutstandingRequests_ = 0;
        this.spriteSheets_ = [];
        this.textures_ = [];
        this.currentTextureUnit_ = 0;
    }

    public getTextureNumber(){
        return this.textures_.length;
    }

    addSpriteSheet(params:SpriteSheetParams): GameSpriteSheet {
        let spriteSheet = new GameSpriteSheet(this, params);
        this.spriteSheets_.push(spriteSheet);
        return spriteSheet;
    }
    startLoading() :void{
        var len = this.spriteSheets_.length;
        this.numOutstandingRequests_ = len;
        for (var ii = 0; ii < len; ++ii) {
            this.spriteSheets_[ii].startLoading();
        }
    };
    numSpriteSheets(): number {
        return this.spriteSheets_.length;
    }

    getSpriteSheet(i): GameSpriteSheet {
        return this.spriteSheets_[i];
    }

    // TODO : déporter cette méthode dans sprite library pour éviter de balader la référence à gl partout
    bindTextures(): void {
        for (var ii = 0; ii < this.currentTextureUnit_; ++ii) {
            this.gl.activeTexture(this.gl.TEXTURE0 + ii);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures_[ii]);
        }
    }

    spriteSheetLoaded_(sheet: GameSpriteSheet, params: SpriteSheetParams) {
        // Upload the sprite sheet into a texture. This is where we would
        // coalesce different sprites' animations into a single texture to
        // reduce the number of texture fetches we need to do in the
        // fragment shader.
        var texture: WebGLTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        //  this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        //  this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, params.image);

        sheet.initialize(this.currentTextureUnit_, params.image.width, params.image.height);
        this.textures_[this.currentTextureUnit_] = texture;
        ++this.currentTextureUnit_;

        if (--this.numOutstandingRequests_ === 0) {
            if (this.onload) {
                this.onload();
            }
        }
    }
}