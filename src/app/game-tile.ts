import ImageToLoad from 'app/loader/image-to-load';
import GameCamera from 'app/game-camera';

class GameTile {
    private id: string;
    private imageToLoad: ImageToLoad;
    private context: CanvasRenderingContext2D;
    private image: HTMLImageElement;

    constructor(id: string, src: string) {
        this.id = id;
        this.imageToLoad = {
            name: id,
            url: src
        };
    }

    getSource(): string {
        return this.imageToLoad.url;
    }

    setImage(image: HTMLImageElement) {
        this.image = image;
    }

    setContext(mapCanvas: CanvasRenderingContext2D) {
        this.context = mapCanvas;
    }

    draw(camera: GameCamera): void {
        // on part sur une resolution 1280 x 720
        let aspectWidth:number = 1280*camera.zoom;
        let aspectHeight:number = 720*camera.zoom;

        this.context.clearRect(0, 0, 1280, 720);
        this.context.drawImage(this.imageToLoad.image, 0, 0, aspectWidth, aspectHeight, 0, 0, 1280, 720);
    }

    getId(): String {
        return this.id;
    }
}
export default GameTile;