import { GetShaderService } from 'app/get-shader.service';
import {Subscription} from 'rxjs/Subscription';

export enum shaderTypeEnum {
    VERTEX_SHADER = WebGLRenderingContext.VERTEX_SHADER,
    FRAGMENT_SHADER = WebGLRenderingContext.FRAGMENT_SHADER
}


export class GameSpriteLibrary {

    private canvas: HTMLCanvasElement;
    private lastError: string;

    constructor(public gl: WebGLRenderingContext, private shaderService: GetShaderService) {
        this.canvas = gl.canvas;
    }

    private getScriptText(id: string): string {
        console.log("loading: ", id);
        let shaderScript: HTMLScriptElement = <HTMLScriptElement>document.getElementById(id);
        if (!shaderScript) {
            throw 'no element: ' + id;
        }
        return shaderScript.text;
    }

    loadShaderBis(id: string, shaderType: shaderTypeEnum) :Subscription{

        return this.shaderService.getProgram().subscribe(
            next => this.loadShaderFromText(next, shaderType),
            error => console.error('error loading shader'),
            () => console.log('c\'est fini'));
    }

    loadShaderFromText(text: string, shaderType: shaderTypeEnum) {

        // Create the shader object
        var shader = this.gl.createShader(shaderType);
        if (shader == null) {
            throw "Error: unable to create shader";
        }

        // Load the shader source
        this.gl.shaderSource(shader, text);

        // Compile the shader
        this.gl.compileShader(shader);

        // Check the compile status
        var compiled = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (!compiled) {
            // Something went wrong during compilation; get the error
            this.lastError = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw "Error compiling shader '" + text + "': " + this.lastError;
        }

        return shader;
    }

    loadShader(id: string, shaderType: shaderTypeEnum) {

        let shaderSource = this.getScriptText(id);
        // Create the shader object
        var shader = this.gl.createShader(shaderType);
        if (shader == null) {
            throw "Error: unable to create shader";
        }

        // Load the shader source
        this.gl.shaderSource(shader, shaderSource);

        // Compile the shader
        this.gl.compileShader(shader);

        // Check the compile status
        var compiled = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (!compiled) {
            // Something went wrong during compilation; get the error
            this.lastError = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw "Error compiling shader '" + shaderSource + "': " + this.lastError;
        }

        return shader;
    }
}