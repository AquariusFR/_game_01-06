export class BitmapSprite extends Phaser.Sprite {
    private frameData: any;
    private bitmapBrother: Phaser.BitmapData


    constructor(key: string, position: Phaser.Point, game: Phaser.Game) {
        super(game, position.x, position.y - 32, key);

        this.createBitMap()
            .loadBitmapAsTextureAtlas()
            .loadTexture(this.key.toString());
    }

    createBitMap() {
        let game = this.game;
        let cache = game.cache;
        let cacheSpriteSheet: any = cache.getImage(this.key.toString(), true);
        let bitmapBrother = game.add.bitmapData(cacheSpriteSheet.width, cacheSpriteSheet.height);
        this.bitmapBrother = bitmapBrother;
        this.frameData = cache.getJSON(this.key.toString() + '-atlas');
        bitmapBrother.load(this.key.toString());
        return this;
    }
    loadBitmapAsTextureAtlas(prefix?) {
        this.game.cache.addTextureAtlas(this.key.toString() + prefix, '', this.bitmapBrother.canvas, this.frameData, Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
        return this;
    }

    modifiyBitmap() {
        this.bitmapBrother.shiftHSL(0.1);
        return this;
    }

    changeColor() {
        this.modifiyBitmap()
            .loadBitmapAsTextureAtlas('changed')
            .loadTexture(this.key.toString() + 'changed');
    }
}