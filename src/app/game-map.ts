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
    private mapCanvasContextGl : WebGLRenderingContext;


    constructor(tiles: Array<GameTile>, private mapCanvas: HTMLCanvasElement, private camera: GameCamera) {
        this.mapCanvasContextGl = this.getMapCtxGl();
        let self = this;
        this.tiles = tiles;
        this.imageToLoad = <Array<ImageToLoad>>_(tiles).map('imageToLoad').value();

        _(tiles).each(this.printTile);

        this.setContext();
        this.loaderImage.loadImages(this.imageToLoad).then(res => this.processLoadedImages(res));
    }

    private getMapCtxGl(): WebGLRenderingContext {
        var ctxGl: WebGLRenderingContext = this.mapCanvas.getContext('webgl');
        ctxGl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        ctxGl.clearDepth(1.0);                 // Clear everything
        ctxGl.enable(ctxGl.DEPTH_TEST);           // Enable depth testing
        ctxGl.depthFunc(ctxGl.LEQUAL);            // Near things obscure far things

        return ctxGl;
    }

    processLoadedImages(loadedImages: Array<ImageToLoad>) {
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
        console.log('drawing ..');
        let cameraClosure = this.camera;
        _(this.tiles).each(drawTile);

        function drawTile(tile: GameTile) {
            tile.draw(cameraClosure);
        }

    }
    printTile(tile: GameTile) {
        console.log(tile.getId());

    }
}
