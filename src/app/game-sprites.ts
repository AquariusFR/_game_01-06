import * as _ from 'lodash';
import GameSprite from 'app/game-sprite';
import LoaderImage from 'app/loader/loader-image';
import ImageToLoad from 'app/loader/image-to-load';
import GameCamera from 'app/game-camera';


export default class GameSprites {
    private loaderImage: LoaderImage = new LoaderImage();
    private imageToLoad: Array<ImageToLoad>;
    private sprites: Array<GameSprite>;
    private mapCanvasContextGl: WebGLRenderingContext;


    constructor(private mapCanvas: HTMLCanvasElement, private camera: GameCamera) {
        this.sprites = <Array<GameSprite>>[new GameSprite({ name: 'marco', url: 'assets/sprites/marco.png' })];
        this.imageToLoad = <Array<ImageToLoad>>_(this.sprites).map('imageToLoad').value();
        this.mapCanvasContextGl = this.getMapCtxGl();
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

    playAnimation(){
        _(this.sprites).each(sprite => sprite.playAnimation(this.camera));
        //this.draw();
    }
    processLoadedImages() {
        _(this.sprites).each(sprite => sprite.prerender());
        //this.draw();
    }
    setContext() {
        this.sprites.forEach(tile => this.setTileContext(tile));
    }
    setTileContext(sprite: GameSprite) {
        sprite.setContext(this.mapCanvasContextGl);
    }

    draw() {
        let cameraClosure = this.camera;
        _(this.sprites).each((t) => t.draw(this.camera));
    }
}