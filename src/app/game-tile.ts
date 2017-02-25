import ImageToLoad from 'app/loader/image-to-load';
import GameCamera from 'app/game-camera';
import GameWebglUtils from 'app/game-webgl-utils';


class GameTile {
    private id: string;
    private imageToLoad: ImageToLoad;
    private canvasContext: CanvasRenderingContext2D;
    private canvasContextGl: WebGLRenderingContext;
    private imageData: ImageData;
    private translationLocation:WebGLUniformLocation;
    private scaleLocation:WebGLUniformLocation;


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

    prerender() {
        this.prerenderGL();
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
        let positionLocation = this.canvasContextGl.getAttribLocation(program, "a_position");
        // set the resolution
        let resolutionLocation:WebGLUniformLocation = this.canvasContextGl.getUniformLocation(program, "u_resolution");

        this.translationLocation = this.canvasContextGl.getUniformLocation(program, "u_translation");
        this.scaleLocation = this.canvasContextGl.getUniformLocation(program, "u_scale");

        this.canvasContextGl.uniform2f(resolutionLocation, 1280, 720);
        // Create a buffer and put a single clipspace rectangle in it (2 triangles)
        let buffer = this.canvasContextGl.createBuffer();

        this.canvasContextGl.bindBuffer(this.canvasContextGl.ARRAY_BUFFER, buffer);

        GameWebglUtils.bufferRectangle(this.canvasContextGl, 0, 0, width, height);
        this.canvasContextGl.enableVertexAttribArray(positionLocation);
        this.canvasContextGl.vertexAttribPointer(positionLocation, 2, this.canvasContextGl.FLOAT, false, 0, 0);
        //texture
        let texCoordLocation = this.canvasContextGl.getAttribLocation(program, "a_texCoord");
        let texCoordBuffer = this.canvasContextGl.createBuffer();

        this.canvasContextGl.bindBuffer(this.canvasContextGl.ARRAY_BUFFER, texCoordBuffer);
        this.canvasContextGl.bufferData(this.canvasContextGl.ARRAY_BUFFER, new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0]), this.canvasContextGl.STATIC_DRAW);
        this.canvasContextGl.enableVertexAttribArray(texCoordLocation);
        this.canvasContextGl.vertexAttribPointer(texCoordLocation, 2, this.canvasContextGl.FLOAT, false, 0, 0);
        // Create a texture.
        let texture = this.canvasContextGl.createTexture();
        this.canvasContextGl.bindTexture(this.canvasContextGl.TEXTURE_2D, texture);

        // Set the parameters so we can render any size image.
        this.canvasContextGl.texParameteri(this.canvasContextGl.TEXTURE_2D, this.canvasContextGl.TEXTURE_WRAP_S, this.canvasContextGl.CLAMP_TO_EDGE);
        this.canvasContextGl.texParameteri(this.canvasContextGl.TEXTURE_2D, this.canvasContextGl.TEXTURE_WRAP_T, this.canvasContextGl.CLAMP_TO_EDGE);
        this.canvasContextGl.texParameteri(this.canvasContextGl.TEXTURE_2D, this.canvasContextGl.TEXTURE_MIN_FILTER, this.canvasContextGl.NEAREST);
        this.canvasContextGl.texParameteri(this.canvasContextGl.TEXTURE_2D, this.canvasContextGl.TEXTURE_MAG_FILTER, this.canvasContextGl.NEAREST);

        // Upload the image into the texture.
        this.canvasContextGl.texImage2D(this.canvasContextGl.TEXTURE_2D, 0, this.canvasContextGl.RGBA, this.canvasContextGl.RGBA, this.canvasContextGl.UNSIGNED_BYTE, this.imageToLoad.image);
    }

    setContext(canvasContextGl: WebGLRenderingContext) {
        //this.canvasContext = canvasContext;
        this.canvasContextGl = canvasContextGl;
    }

    draw(camera: GameCamera): void {
        // on part sur une resolution 1280 x 720
        let aspectWidth: number = Math.floor(1280 * camera.zoom);
        let aspectHeight: number = Math.floor(720 * camera.zoom);
        let aspectX: number = Math.floor(camera.x * camera.zoom);
        let aspectY: number = Math.floor(camera.y * camera.zoom);

        this.canvasContextGl.clear(this.canvasContextGl.COLOR_BUFFER_BIT);
        this.canvasContextGl.uniform2fv(this.translationLocation, [aspectX, aspectY]);
        this.canvasContextGl.uniform2fv(this.scaleLocation, [camera.zoom, camera.zoom]);
        
        this.canvasContextGl.drawArrays(this.canvasContextGl.TRIANGLES, 0, 6);
    }
    getId(): String {
        return this.id;
    }
}
export default GameTile;