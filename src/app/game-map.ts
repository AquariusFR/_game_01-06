import * as _ from 'lodash';
import GameTile from 'app/game-tile';
import LoaderImage from 'app/loader/loader-image';
import ImageToLoad from 'app/loader/image-to-load';

export default class GameMap {
    context: CanvasRenderingContext2D;
    loaderImage: LoaderImage = new LoaderImage();
    imageToLoad:Array<ImageToLoad>;
    tiles: Array<GameTile>;

    constructor(tiles: Array<GameTile>, ctx: CanvasRenderingContext2D) {
        
        let self = this;

        this.imageToLoad = <Array<ImageToLoad>> _(tiles).map('imageToLoad').value();

        _(tiles).each(this.printTile);

        this.loaderImage.loadImages(this.imageToLoad).then(fullfilled);
        
        function fullfilled(loadedImages:Array<ImageToLoad>){
            
            
            tiles.forEach(setTileImage);

            setContext(ctx);
            self.draw();

            function setTileImage(tile:GameTile){
                let foundedImage:ImageToLoad = loadedImages.find(byUrl);

                console.log(foundedImage.result);

                //tile.setImage(foundedImage);
                function byUrl(imageToLoad:ImageToLoad, ):boolean{
                    return imageToLoad.url === tile.getSource();
                }
            }
        }
        function setContext(ctx: CanvasRenderingContext2D) {
            self.context = ctx;
            
            _(self.tiles).each(setTileContext);
            
            function setTileContext(tile: GameTile){
                tile.setContext(ctx);
            }
        }
    }




    draw() {
        console.log('drawing ..');
        
        _(this.tiles).each(drawTile);

        function drawTile(tile: GameTile){
            tile.draw();
        }

    }
    printTile(tile: GameTile) {
        console.log(tile.getId());

    }
}
