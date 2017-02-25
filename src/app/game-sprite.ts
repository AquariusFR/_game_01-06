import ImageToLoad from 'app/loader/image-to-load';
import GameCamera from 'app/game-camera';
import GameWebglUtils from 'app/game-webgl-utils';

declare var SpriteSheet: any;
declare var SpriteAtlas: any;
declare var SpriteSystem: any;
declare var setupSpriteWebGL: any;


//choper ça dans https://www.spriters-resource.com/pc_computer/diablo2diablo2lordofdestruction/
export default class GameSprite {

    private canvasContextGl: WebGLRenderingContext;
    private translationLocation: WebGLUniformLocation;
    private scaleLocation: WebGLUniformLocation;
    private textures: Array<WebGLTexture>;
    private texCoordLocation: number;
    private positionLocation: number;
    private textureSizeLocation: WebGLUniformLocation;
    private animation = [
    ];
    private step: number = 0;
    private atlas: any;
    private spriteSystem: any;

    constructor(private imageToLoad: ImageToLoad) {
    }

    setContext(canvasContextGl: WebGLRenderingContext) {
        //this.canvasContext = canvasContext;
        this.canvasContextGl = canvasContextGl;
    }
    public prerender() {
        //this.prerenderGL();
        this.prerenderGLNew();

    }
    private prerenderGLNew() {
        this.atlas = new SpriteAtlas();

        setupSpriteWebGL(this.canvasContextGl);

        this.spriteSystem = new SpriteSystem({});
        this.spriteSystem.setScreenSize(1280, 720);
        this.atlas.onload = start;
        this.atlas.addSpriteSheet('marco', {
            url: this.imageToLoad.url,
            frames: 6,
            spritesPerRow: 6,
            framepos: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0]],
            width: 55, height: 55
        });
        this.atlas.addSpriteSheet('powerup', {
            url: 'assets/sprites/powerup.png', frames: 40,
            spritesPerRow: 8,
            framepos: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0],
            [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1],
            [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2],
            [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3],
            [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4]],
            width: 64, height: 64
        });
        let self = this;
        function start() {
            self.start();
        }

        this.atlas.startLoading();

    }
    private start(): void {
        //this.generateSprites(3);
        this.createSprite(0);
        this.render();
    }


    private generateSprites(numSprites) {
        let atlas = this.atlas,
            spriteSystem = this.spriteSystem;

        spriteSystem.clearAllSprites();
        var spriteSheetIndex = 0;
        for (var ii = 0; ii < numSprites; ++ii) {
            this.createSprite(ii);
            ++spriteSheetIndex;
        }
    }

    private createSprite(index) {
        let atlas = this.atlas,
            spriteSystem = this.spriteSystem;
        var spriteSheet = atlas.getSpriteSheet(index);
        //spriteSheet.createRandomSprite(spriteSystem);
        spriteSheet.createSprite(spriteSystem, 10,32,0,128, 0);
    }

    private lastTime = new Date().getTime() * 0.001;

    private render() {
        window.requestAnimationFrame(c => this.render());
        let spriteSystem = this.spriteSystem,
            atlas = this.atlas
        var now = new Date().getTime() * 0.001;
        var deltaT = now - this.lastTime;

        this.canvasContextGl.viewport(0, 0, 1280, 720);
        this.canvasContextGl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.canvasContextGl.clear(this.canvasContextGl.COLOR_BUFFER_BIT | this.canvasContextGl.DEPTH_BUFFER_BIT);

        spriteSystem.draw(atlas, deltaT);

        this.lastTime = now;
    }

    private prerenderGL() {
        // setup a GLSL program
        let vertexShader = GameWebglUtils.createShaderFromScript(this.canvasContextGl, "2d-vertex-shader");
        let fragmentShader = GameWebglUtils.createShaderFromScript(this.canvasContextGl, "2d-fragment-shader");
        let program = GameWebglUtils.createProgram(this.canvasContextGl, [vertexShader, fragmentShader]);
        let width = this.imageToLoad.image.naturalWidth;
        let height = this.imageToLoad.image.naturalHeight;
        this.canvasContextGl.useProgram(program);

        // look up where the vertex data needs to go.
        this.positionLocation = this.canvasContextGl.getAttribLocation(program, "a_position");


        // set the resolution
        let resolutionLocation: WebGLUniformLocation = this.canvasContextGl.getUniformLocation(program, "u_resolution");
        this.translationLocation = this.canvasContextGl.getUniformLocation(program, "u_translation");
        this.scaleLocation = this.canvasContextGl.getUniformLocation(program, "u_scale");


        this.canvasContextGl.uniform2f(resolutionLocation, 1280, 720);
        // Create a buffer and put a single clipspace rectangle in it (2 triangles)
        let buffer = this.canvasContextGl.createBuffer();

        this.canvasContextGl.bindBuffer(this.canvasContextGl.ARRAY_BUFFER, buffer);

        GameWebglUtils.bufferRectangle(this.canvasContextGl, 0, 0, width, height);
        this.canvasContextGl.enableVertexAttribArray(this.positionLocation);
        this.canvasContextGl.vertexAttribPointer(this.positionLocation, 2, this.canvasContextGl.FLOAT, false, 0, 0);
        //texture

        this.texCoordLocation = this.canvasContextGl.getAttribLocation(program, "a_texCoord");
        this.textureSizeLocation = this.canvasContextGl.getUniformLocation(program, "u_textureSize");

        // Create a texture.
        let texture: WebGLTexture = this.canvasContextGl.createTexture();
        this.textures = [];
        this.textures.push(texture);

        this.canvasContextGl.bindTexture(this.canvasContextGl.TEXTURE_2D, this.textures[0]);

        // Set the parameters so we can render any size image.
        this.canvasContextGl.texParameteri(this.canvasContextGl.TEXTURE_2D, this.canvasContextGl.TEXTURE_WRAP_S, this.canvasContextGl.CLAMP_TO_EDGE);
        this.canvasContextGl.texParameteri(this.canvasContextGl.TEXTURE_2D, this.canvasContextGl.TEXTURE_WRAP_T, this.canvasContextGl.CLAMP_TO_EDGE);
        this.canvasContextGl.texParameteri(this.canvasContextGl.TEXTURE_2D, this.canvasContextGl.TEXTURE_MIN_FILTER, this.canvasContextGl.NEAREST);
        this.canvasContextGl.texParameteri(this.canvasContextGl.TEXTURE_2D, this.canvasContextGl.TEXTURE_MAG_FILTER, this.canvasContextGl.NEAREST);
    }

    playAnimation(camera: GameCamera) {
        window.requestAnimationFrame(c => this.nextAnimation(camera));
    }


    nextAnimation(camera: GameCamera) {
        console.log('playing animation step', this.step);

        var srcX = this.animation[this.step][0];
        var srcY = this.animation[this.step][1];
        var srcWidth = 40;
        var srcHeight = 40;
        let width = this.imageToLoad.image.naturalWidth;
        let height = this.imageToLoad.image.naturalHeight;

        var dstX = 210;
        var dstY = 40;
        var dstWidth = 40;
        var dstHeight = 40;

        var u0 = srcX / width;
        var v0 = srcY / height;
        var u1 = (srcX + 40) / width;
        var v1 = (srcY + 40) / height;

        // provide texture coordinates for the rectangle.
        var texCoordBuffer = this.canvasContextGl.createBuffer();
        this.canvasContextGl.bindBuffer(this.canvasContextGl.ARRAY_BUFFER, texCoordBuffer);
        this.canvasContextGl.bufferData(this.canvasContextGl.ARRAY_BUFFER, new Float32Array(
            [
                u0, v0,
                u1, v0,
                u0, v1,
                u0, v1,
                u1, v0,
                u1, v1]),
            this.canvasContextGl.STATIC_DRAW);
        this.canvasContextGl.enableVertexAttribArray(this.texCoordLocation);
        this.canvasContextGl.vertexAttribPointer(this.texCoordLocation, 2, this.canvasContextGl.FLOAT, false, 0, 0);


        this.canvasContextGl.texImage2D(this.canvasContextGl.TEXTURE_2D, 0, this.canvasContextGl.RGBA, this.canvasContextGl.RGBA, this.canvasContextGl.UNSIGNED_BYTE, this.imageToLoad.image);
        this.step = this.step < this.animation.length - 1 ? this.step + 1 : 0;
        this.draw(camera);
        this.playAnimation(camera);
    }


    draw(camera: GameCamera): void {

        let width = this.imageToLoad.image.naturalWidth;
        let height = this.imageToLoad.image.naturalHeight;
        let dstX = 210;
        let dstY = 40;
        let dstWidth = 40;
        let dstHeight = 40;

        this.canvasContextGl.clear(this.canvasContextGl.COLOR_BUFFER_BIT);
        this.canvasContextGl.uniform2fv(this.translationLocation, [10, 10]);
        this.canvasContextGl.uniform2fv(this.scaleLocation, [camera.zoom, camera.zoom]);

        // set the size of the image
        this.canvasContextGl.uniform2f(this.textureSizeLocation, width, height);
        // Create a buffer for the position of the rectangle corners.
        var positionBuffer = this.canvasContextGl.createBuffer();
        this.canvasContextGl.bindBuffer(this.canvasContextGl.ARRAY_BUFFER, positionBuffer);
        this.canvasContextGl.enableVertexAttribArray(this.positionLocation);
        this.canvasContextGl.vertexAttribPointer(this.positionLocation, 2, this.canvasContextGl.FLOAT, false, 0, 0);

        GameWebglUtils.bufferRectangle(this.canvasContextGl, dstX, dstY, dstWidth, dstHeight);

        this.canvasContextGl.drawArrays(this.canvasContextGl.TRIANGLES, 0, 6);
    }
}