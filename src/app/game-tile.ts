import ImageToLoad from 'app/loader/image-to-load';
import GameCamera from 'app/game-camera';


class GameTile {
    private id: string;
    private imageToLoad: ImageToLoad;
    private context: CanvasRenderingContext2D;
    private shadowCanvas:HTMLCanvasElement;
    private imageData:ImageData;
    

    constructor(id: string, src: string) {
        this.id = id;
        this.imageToLoad = {
            name: id,
            url: src
        };
        this.shadowCanvas = <HTMLCanvasElement>document.createElement('canvas');
    }

    getSource(): string {
        return this.imageToLoad.url;
    }

    prerender() {
        this.shadowCanvas.width = this.imageToLoad.image.naturalWidth;
        this.shadowCanvas.height = this.imageToLoad.image.naturalHeight;
        let currentCtx:CanvasRenderingContext2D = this.shadowCanvas.getContext('2d');
        currentCtx.webkitImageSmoothingEnabled = false;
        currentCtx.mozImageSmoothingEnabled = false;
        //currentCtx.imageSmoothingEnabled = false;
        currentCtx.drawImage(this.imageToLoad.image, 0, 0, 1280, 720, 0, 0, 1280, 720);
        this.imageData = currentCtx.getImageData(0,0,1280,720);
    }

    setContext(mapCanvas: CanvasRenderingContext2D) {
        this.context = mapCanvas;
    }

    draw(camera: GameCamera): void {
        // on part sur une resolution 1280 x 720
        let aspectWidth: number = Math.floor(1280 * camera.zoom);
        let aspectHeight: number = Math.floor(720 * camera.zoom);
        let aspectX: number = Math.floor(camera.x * camera.zoom);
        let aspectY: number = Math.floor(camera.y * camera.zoom);

        this.context.clearRect(0, 0, 1280, 720);
        this.context.drawImage(this.shadowCanvas, aspectX, aspectY, aspectWidth, aspectHeight, 0, 0, 1280, 720);
        //this.context.putImageData(this.imageData, 0,0, aspectX, aspectY, 1280, 720);
    }

    getId(): String {
        return this.id;
    }
}
export default GameTile;