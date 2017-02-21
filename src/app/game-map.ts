import * as _ from 'lodash';
import GameTile from 'app/game-tile';
import LoaderImage from 'app/loader/loader-image';
import ImageToLoad from 'app/loader/image-to-load';

export default class GameMap {
    canvas: CanvasRenderingContext2D;
    loaderImage: LoaderImage = new LoaderImage();
    constructor(private tiles: Array<GameTile>) {
        let imageToLoad:Array<ImageToLoad> = <Array<ImageToLoad>> _(tiles).map('imageToLoad').value();

        _(tiles).each(this.printTile);

        this.loaderImage.loadImages(imageToLoad);

    }

    setCanvas(mapCanvas: CanvasRenderingContext2D) {
        this.canvas = mapCanvas;
    }

    draw() {
        console.log('drawing ..');
    }
    printTile(tile: GameTile) {
        console.log(tile.getId());

    }
}
