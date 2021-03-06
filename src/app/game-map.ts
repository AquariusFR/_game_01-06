import * as _ from 'lodash';
import GameTile from 'app/game-tile';
import LoaderImage from 'app/loader/loader-image';
import ImageToLoad from 'app/loader/image-to-load';
import GameCamera from 'app/game-camera';

export default class GameMap {
    private context: CanvasRenderingContext2D;
    private loaderImage: LoaderImage = new LoaderImage();
    private imageToLoad: Array<ImageToLoad>;
    private tiles: Array<GameTile>;
    private mapCanvasContextGl: WebGLRenderingContext;


    constructor(private mapCanvas: HTMLCanvasElement, private camera: GameCamera) {

        let tileA: GameTile = new GameTile('toto A', 'assets/bigtile.png');
        let tiles: Array<GameTile> = [tileA];

        this.mapCanvasContextGl = this.getMapCtxGl();
        let self = this;
        this.tiles = tiles;
        this.imageToLoad = <Array<ImageToLoad>>_(tiles).map('imageToLoad').value();
        this.setContext();
        this.loaderImage.loadImages(this.imageToLoad).then(() => this.processLoadedImages());
    }

    private getMapCtxGl(): WebGLRenderingContext {
        var ctxGl: WebGLRenderingContext = this.mapCanvas.getContext('webgl');

        ctxGl.clearColor(0.0, 0.0, 0.0, 0.0);  // Clear to black, fully opaque
        ctxGl.clearDepth(1.0);                 // Clear everything
        ctxGl.enable(ctxGl.DEPTH_TEST);           // Enable depth testing
        ctxGl.depthFunc(ctxGl.LEQUAL);            // Near things obscure far things

        return ctxGl;
    }

    processLoadedImages() {
        _(this.tiles).each(tile => tile.prerender());
        this.draw();
    }
    setContext() {
        this.tiles.forEach(tile => this.setTileContext(tile));
    }
    setTileContext(tile: GameTile) {
        tile.setContext(this.mapCanvasContextGl);
    }

    draw() {
        let cameraClosure = this.camera;
        _(this.tiles).each((t) => this.drawTile(t));

    }
    drawTile(tile: GameTile) {
        tile.draw(this.camera);
    }
}
