import ImageToLoad from 'app/loader/image-to-load';

class GameTile {
    private id:String;
    private imageToLoad:ImageToLoad;
    private context: CanvasRenderingContext2D;
    private image:HTMLImageElement;

    constructor(id:String, src:string){
        this.id = id;
        this.imageToLoad = {
            name:id,
            url: src
        };
    }

    setImage(image:HTMLImageElement){
        this.image = image;
    }

    setContext(mapCanvas: CanvasRenderingContext2D) {
        this.context = mapCanvas;
    }

    draw():void{
        this.context.drawImage(this.image, 0, 0);
		/*drawTile: function(_tile, _lineNumber, _column) {
			_.contextBackground.drawImage(_tile.img, 500 * _column + 5, 500 * _lineNumber + 5, 250 * 2, 250 * 2);
			console.debug('drawing image : ' + _tile.img.src + ", pos=" + 500 * _column + 1 + ":" + 500 * _lineNumber + 1);
		},*/
    }

    getId() :String{
        return this.id;
    }
}
export default GameTile;