import * as _ from 'lodash';
import GameSprite from 'app/game-sprite';
import LoaderImage from 'app/loader/loader-image';
import ImageToLoad from 'app/loader/image-to-load';
import GameCamera from 'app/game-camera';
import { GameSpriteAtlas } from 'app/animation/game-sprite-atlas';
import { GameSpriteSystem } from 'app/animation/game-sprite-system';
import { GameSpriteLibrary } from 'app/animation/game-sprite-library';
import { SpriteSheetParams, GameSpriteSheet } from 'app/animation/game-sprite-sheet';



export default class GameSprites {
    private loaderImage: LoaderImage = new LoaderImage();
    private spriteContextGl: WebGLRenderingContext;
    private atlas: GameSpriteAtlas;
    private spriteSystem: GameSpriteSystem;
    private sprites: Array<GameSprite>;
    private imageToLoad: Array<ImageToLoad>;
    private spritesheetsParams: Array<SpriteSheetParams>;
    private spriteSheetMap:Map<string, GameSpriteSheet>

    constructor(private mapCanvas: HTMLCanvasElement, private camera: GameCamera) {

        this.spriteContextGl = this.getMapCtxGl();
        this.atlas = new GameSpriteAtlas(this.spriteContextGl);

        // load all spritesheetes images
        this.spritesheetsParams = [{
            name: 'marco',
            url: 'assets/sprites/marco.png',
            frames: 6,
            spritesPerRow: 6,
            framepos: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0]],
            width: 55, height: 55
        }, {
            name: 'powerup',
            url: 'assets/sprites/powerup.png', frames: 40,
            spritesPerRow: 8,
            framepos: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0],
            [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1],
            [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2],
            [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3],
            [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4]],
            width: 64, height: 64
        }
        ];

        this.imageToLoad = <Array<ImageToLoad>>_(this.spritesheetsParams).map(s => mapImageToLoad(s)).value();
        this.loaderImage.loadImages(this.imageToLoad).then((c) => this.processLoadedImages());

        function mapImageToLoad(s: SpriteSheetParams): ImageToLoad {
            return { name: s.name, url: s.url };
        }
    }

    private mapGameSpriteSheet(){
        this.spriteSheetMap = new Map<string, GameSpriteSheet>();

        this.spritesheetsParams.forEach((s, i) => {
        s.image = this.imageToLoad[i].image;
        this.spriteSheetMap.set(s.name,  this.atlas.addSpriteSheet(s));
        });
    }

    private processLoadedImages(): void {
        // once spritesheets are loaded
        // create GameSpriteSheet
        this.mapGameSpriteSheet();
        //create sprites and bind the corresponding sprite sheet.
        //this.spriteSheet = this.atlas.addSpriteSheet(this.spriteName, this.params);
        this.spriteSheetMap.get('marco');


        this.sprites = <Array<GameSprite>>[
            new GameSprite(this.spriteSheetMap.get('marco')),
            new GameSprite(this.spriteSheetMap.get('powerup'))
        ];

        var spriteLibrary: GameSpriteLibrary = new GameSpriteLibrary(this.spriteContextGl);

        this.spriteSystem = new GameSpriteSystem(spriteLibrary);
        this.spriteSystem.setScreenSize(1280, 720);


        this.atlas.onload = start;
        let self = this;
        function start() {
            self.start();
        }

        this.atlas.startLoading();
    }

    private start(): void {
        this.spriteSystem.clearAllSprites();
        this.sprites.forEach((s) => this.createSprite(s));
        this.render();
    }
    private createSprite(sprite: GameSprite) {
        let atlas = this.atlas,
            spriteSystem = this.spriteSystem;
        sprite.spriteSheet.createSprite(spriteSystem, 10, 32, 0, 128, 0);
    }

    private lastTime = new Date().getTime() * 0.001;

    private render() {
        window.requestAnimationFrame(c => this.render());
        let spriteSystem = this.spriteSystem,
            atlas = this.atlas
        var now = new Date().getTime() * 0.001;
        var deltaT = now - this.lastTime;

        this.spriteContextGl.viewport(0, 0, 1280, 720);
        this.spriteContextGl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.spriteContextGl.clear(this.spriteContextGl.COLOR_BUFFER_BIT | this.spriteContextGl.DEPTH_BUFFER_BIT);

        spriteSystem.draw(atlas, deltaT);

        this.lastTime = now;
    }
    private getMapCtxGl(): WebGLRenderingContext {
        var ctxGl: WebGLRenderingContext = this.mapCanvas.getContext('webgl');

        ctxGl.clearColor(0.0, 0.0, 0.0, 0.0);  // Clear to black, fully opaque
        ctxGl.clearDepth(1.0);                 // Clear everything
        ctxGl.enable(ctxGl.DEPTH_TEST);           // Enable depth testing
        ctxGl.depthFunc(ctxGl.LEQUAL);            // Near things obscure far things

        return ctxGl;
    }
}