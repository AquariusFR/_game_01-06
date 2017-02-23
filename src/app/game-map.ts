import * as _ from 'lodash';
import GameTile from 'app/game-tile';
import LoaderImage from 'app/loader/loader-image';
import ImageToLoad from 'app/loader/image-to-load';
import GameCamera from 'app/game-camera';

export default class GameMap {
    context: CanvasRenderingContext2D;
    loaderImage: LoaderImage = new LoaderImage();
    imageToLoad: Array<ImageToLoad>;
    tiles: Array<GameTile>;
    

    constructor(tiles: Array<GameTile>, ctx: CanvasRenderingContext2D, private camera: GameCamera) {

        let self = this;
        this.tiles = tiles;
        this.imageToLoad = <Array<ImageToLoad>>_(tiles).map('imageToLoad').value();

        _(tiles).each(this.printTile);

        this.setContext(ctx);
        this.loaderImage.loadImages(this.imageToLoad).then(res => this.processLoadedImages(res));
    }


    processLoadedImages(loadedImages: Array<ImageToLoad>) {
        this.draw();
    }
    setContext(ctx: CanvasRenderingContext2D) {
        this.context = ctx;

        _(this.tiles).each(setTileContext);

        function setTileContext(tile: GameTile) {
            tile.setContext(ctx);
        }
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
