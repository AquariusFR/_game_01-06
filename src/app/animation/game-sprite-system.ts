import { GameSpriteLibrary, shaderTypeEnum } from 'app/animation/game-sprite-library';


interface systemInfo {
    size: number, offset: number
}
// The vertex attributes are laid out in the buffer in the following way:
// Block 1:
//   centerPosition
// Block 2 (interleaved):
//   rotation
//   spriteSize
//   cornerOffset
//   spriteTextureSize
//   spritesPerRow
//   numFrames
//
// The reason is that we want to be able to update the positions of
// the sprites independently, since the rest of the data for each
// sprite is constant after creation. We are doing the integration of
// the velocity in JavaScript to prove that it can be done at high
// speed, but in a special case like the JSGameBench scenario where
// sprites just move in a straight line, it would be much more
// efficient to send down a uniform time parameter and compute the
// position in the vertex shader, since then we would not need to
// iterate over all particles per frame and would not need to send
// down per-particle information per frame.

// These offsets are in units of floating-point numbers.
const constantAttributeInfo_: Array<systemInfo> = [
    { size: 1, offset: 0 }, // Rotation
    { size: 1, offset: 0 }, // Per-sprite frame offset
    { size: 1, offset: 0 }, // Sprite size
    { size: 2, offset: 0 }, // Corner offset
    { size: 2, offset: 0 }, // Sprite texture size
    { size: 1, offset: 0 }, // Sprites per row
    { size: 1, offset: 0 }, // Num frames
    { size: 4, offset: 0 }  // Texture weights
];
const ROTATION_INDEX: number = 0;
const PER_SPRITE_FRAME_OFFSET_INDEX: number = 1;
const SPRITE_SIZE_INDEX: number = 2;
const CORNER_OFFSET_INDEX: number = 3;
const SPRITE_TEXTURE_SIZE_INDEX: number = 4;
const SPRITES_PER_ROW_INDEX: number = 5;
const NUM_FRAMES_INDEX: number = 6;
const TEXTURE_WEIGHTS_INDEX: number = 7;
const offsets_: Array<Array<number>> = [
    [-0.5, -0.5],
    [-0.5, 0.5],
    [0.5, -0.5],
    [0.5, -0.5],
    [-0.5, 0.5],
    [0.5, 0.5]
]

export class GameSpriteSystem {
    private static initialized_: boolean = false;
    private static constantAttributeStride_: number = 0;
    private centerPositionLoc_: number;
    private rotationLoc_: number;
    private perSpriteFrameOffsetLoc_: number;
    private spriteSizeLoc_: number;
    private cornerOffsetLoc_: number;
    private spriteTextureSizeLoc_: number;
    private spritesPerRowLoc_: number;
    private numFramesLoc_: number;
    private textureWeightsLoc_: number;
    private frameOffset_: number;
    private numVertices_: number;
    private screenWidth_: number;
    private screenHeight_: number;
    private canvasWidth: number;
    private canvasHeight: number;
    private capacity_: number;
    private positionData_: Float32Array;
    private constantData_: Float32Array;
    private precisePositionView_: Float32Array;
    private startPositionData_: Array<number>;
    private velocityData_: Array<number>;
    private spriteSizeData_: Array<number>;
    // webgl reference
    private gl: WebGLRenderingContext;
    private program_: WebGLProgram;
    private frameOffsetLoc_: WebGLUniformLocation;
    private screenDimsLoc_: WebGLUniformLocation;
    private spriteBuffer_: WebGLBuffer;
    private texture0Loc_: WebGLUniformLocation;
    private texture1Loc_: WebGLUniformLocation;
    private texture2Loc_: WebGLUniformLocation;
    private texture3Loc_: WebGLUniformLocation;

    constructor(private spriteLibrary: GameSpriteLibrary) {
        this.gl = spriteLibrary.gl;
        this.canvasWidth = this.gl.canvas.width;
        this.canvasHeight = this.gl.canvas.height;
        this.initialize_();
        this.dumpOffsets();
        this.loadProgram_();
        this.frameOffset_ = 0;
        this.spriteBuffer_ = this.gl.createBuffer();
        this.clearAllSprites();
    }


    //ressemble à un singleton
    initialize_() {
        if (GameSpriteSystem.initialized_)
            return;
        console.log("Initializing globals for GameSpriteSystem");
        let constantAttributeInfo = constantAttributeInfo_;
        let cumulativeOffset = 0;
        for (let ii = 0; ii < constantAttributeInfo.length; ++ii) {
            constantAttributeInfo[ii].offset = cumulativeOffset;
            cumulativeOffset += constantAttributeInfo[ii].size;
        }
        GameSpriteSystem.constantAttributeStride_ = cumulativeOffset;
        GameSpriteSystem.initialized_ = true;
    }

    dumpOffsets(): void {
        let constantAttributeInfo = constantAttributeInfo_;
        for (let ii = 0; ii < constantAttributeInfo.length; ++ii) {
            console.log("Attribute at index " + ii + ": size = " + constantAttributeInfo[ii].size + ", offset = " + constantAttributeInfo[ii].offset);
        }
        console.log("Constant attribute stride = " + GameSpriteSystem.constantAttributeStride_);
    }

    clearAllSprites(): void {
        // Might as well choose an even multiple of 6, which is the number
        // of vertices per sprite
        this.resizeCapacity_(120, false);
        this.frameOffset_ = 0;
        this.numVertices_ = 0;
        this.precisePositionView_ = null;
    }

    resizeCapacity_(capacity: number, preserveOldContents: boolean): void {
        // Capacity is actually specified in vertices.
        var oldPositionData = null;
        var oldConstantData = null;
        var oldStartPositionData = null;
        var oldVelocityData = null;
        var oldSpriteSizeData = null;
        if (preserveOldContents) {
            oldPositionData = this.positionData_;
            oldConstantData = this.constantData_;
            oldStartPositionData = this.startPositionData_;
            oldVelocityData = this.velocityData_;
            oldSpriteSizeData = this.spriteSizeData_;
        }

        this.capacity_ = capacity;
        this.positionData_ = new Float32Array(2 * capacity);
        this.constantData_ = new Float32Array(GameSpriteSystem.constantAttributeStride_ * capacity);
        // Keep the starting positions, velocities and sprite sizes around
        // in pure JS arrays as a concession to browsers where reads from
        // Float32Array aren't fast. This should not be necessary for much
        // longer.
        this.startPositionData_ = new Array<number>(2 * capacity);
        this.velocityData_ = new Array(2 * capacity);
        this.spriteSizeData_ = new Array(capacity);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.spriteBuffer_);
        this.gl.bufferData(this.gl.ARRAY_BUFFER,
            Float32Array.BYTES_PER_ELEMENT * (this.positionData_.length + this.constantData_.length),
            this.gl.DYNAMIC_DRAW);

        if (preserveOldContents) {
            this.positionData_.set(oldPositionData);
            this.constantData_.set(oldConstantData);
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.positionData_);
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, Float32Array.BYTES_PER_ELEMENT * this.positionData_.length, this.constantData_);
            var ii;
            for (ii = 0; ii < oldStartPositionData.length; ++ii) {
                this.startPositionData_[ii] = oldStartPositionData[ii];
            }
            for (ii = 0; ii < oldVelocityData.length; ++ii) {
                this.velocityData_[ii] = oldVelocityData[ii];
            }
            for (ii = 0; ii < oldSpriteSizeData.length; ++ii) {
                this.spriteSizeData_[ii] = oldSpriteSizeData[ii];
            }
        }
    }
    loadProgram_(): void {
        let fragmentShaderName = 'spriteFragmentShader'; // je m'en tappe du slow shader :)
        let vertexShader = this.spriteLibrary.loadShader('spriteVertexShader', shaderTypeEnum.VERTEX_SHADER);
        let fragmentShader = this.spriteLibrary.loadShader(fragmentShaderName, shaderTypeEnum.FRAGMENT_SHADER);
        let program = this.gl.createProgram(); // a déporter dans spritelbrary

        console.log("GameSpriteSystem using fragment shader " + fragmentShaderName);

        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        let linked = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
        if (!linked) {
            // something went wrong with the link
            let error = this.gl.getProgramInfoLog(program);
            throw "Error in program linking:" + error;
        }
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
        this.program_ = program;

        this.frameOffsetLoc_ = this.gl.getUniformLocation(program, "u_frameOffset");
        this.screenDimsLoc_ = this.gl.getUniformLocation(program, "u_screenDims");

        this.centerPositionLoc_ = this.gl.getAttribLocation(program, "centerPosition");
        this.rotationLoc_ = this.gl.getAttribLocation(program, "rotation");
        this.perSpriteFrameOffsetLoc_ = this.gl.getAttribLocation(program, "perSpriteFrameOffset");
        this.spriteSizeLoc_ = this.gl.getAttribLocation(program, "spriteSize");
        this.cornerOffsetLoc_ = this.gl.getAttribLocation(program, "cornerOffset");
        this.spriteTextureSizeLoc_ = this.gl.getAttribLocation(program, "spriteTextureSize");
        this.spritesPerRowLoc_ = this.gl.getAttribLocation(program, "spritesPerRow");
        this.numFramesLoc_ = this.gl.getAttribLocation(program, "numFrames");
        this.textureWeightsLoc_ = this.gl.getAttribLocation(program, "textureWeights");

        this.texture0Loc_ = this.gl.getUniformLocation(program, "u_texture0");
        this.texture1Loc_ = this.gl.getUniformLocation(program, "u_texture1");
        this.texture2Loc_ = this.gl.getUniformLocation(program, "u_texture2");
        this.texture3Loc_ = this.gl.getUniformLocation(program, "u_texture3");
    }
    private offsetForIndex(index): number {
        return constantAttributeInfo_[index].offset;
    }

    setScreenSize(width: number, height: number): void {
        this.screenWidth_ = width;
        this.screenHeight_ = height;
    }
    screenWidth(): number {
        return this.screenWidth_;
    }

    screenHeight(): number {
        return this.screenHeight_;
    }

    //todo créer une interface spriteInfo ...
    addSprite(centerX, centerY,
        rotation,
        velocityX, velocityY,
        perSpriteFrameOffset,
        spriteSize,
        spriteTextureSizeX, spriteTextureSizeY,
        spritesPerRow,
        numFrames,
        textureWeights): void {
        var offsets = offsets_;
        for (var ii = 0; ii < offsets.length; ++ii) {
            this.addVertex_(centerX, centerY,
                rotation,
                velocityX, velocityY,
                perSpriteFrameOffset,
                spriteSize,
                offsets[ii][0], offsets[ii][1],
                spriteTextureSizeX, spriteTextureSizeY,
                spritesPerRow,
                numFrames,
                textureWeights);
        }
    }
    addVertex_ = function (centerX, centerY,
        rotation,
        velocityX, velocityY,
        perSpriteFrameOffset,
        spriteSize,
        cornerOffsetX, cornerOffsetY,
        spriteTextureSizeX, spriteTextureSizeY,
        spritesPerRow,
        numFrames,
        textureWeights) {
        if (this.numVertices_ == this.capacity_) {
            this.resizeCapacity_(this.capacity_ * 2, true);
        }

        let vertexIndex = this.numVertices_;
        ++this.numVertices_;

        this.positionData_[2 * vertexIndex] = centerX;
        this.positionData_[2 * vertexIndex + 1] = centerY;
        this.startPositionData_[2 * vertexIndex] = centerX;
        this.startPositionData_[2 * vertexIndex + 1] = centerY;
        this.velocityData_[2 * vertexIndex] = velocityX;
        this.velocityData_[2 * vertexIndex + 1] = velocityY;
        this.spriteSizeData_[vertexIndex] = spriteSize;

        // Base index into the constant data
        let baseIndex = GameSpriteSystem.constantAttributeStride_ * vertexIndex;

        this.constantData_[baseIndex + this.offsetForIndex(ROTATION_INDEX)] = rotation;
        this.constantData_[baseIndex + this.offsetForIndex(PER_SPRITE_FRAME_OFFSET_INDEX)] = perSpriteFrameOffset;
        this.constantData_[baseIndex + this.offsetForIndex(SPRITE_SIZE_INDEX)] = spriteSize;
        this.constantData_[baseIndex + this.offsetForIndex(CORNER_OFFSET_INDEX)] = cornerOffsetX;
        this.constantData_[baseIndex + this.offsetForIndex(CORNER_OFFSET_INDEX) + 1] = cornerOffsetY;
        this.constantData_[baseIndex + this.offsetForIndex(SPRITE_TEXTURE_SIZE_INDEX)] = spriteTextureSizeX;
        this.constantData_[baseIndex + this.offsetForIndex(SPRITE_TEXTURE_SIZE_INDEX) + 1] = spriteTextureSizeY;
        this.constantData_[baseIndex + this.offsetForIndex(SPRITES_PER_ROW_INDEX)] = spritesPerRow;
        this.constantData_[baseIndex + this.offsetForIndex(NUM_FRAMES_INDEX)] = numFrames;
        this.constantData_[baseIndex + this.offsetForIndex(TEXTURE_WEIGHTS_INDEX)] = textureWeights[0];
        this.constantData_[baseIndex + this.offsetForIndex(TEXTURE_WEIGHTS_INDEX) + 1] = textureWeights[1];
        this.constantData_[baseIndex + this.offsetForIndex(TEXTURE_WEIGHTS_INDEX) + 2] = textureWeights[2];
        this.constantData_[baseIndex + this.offsetForIndex(TEXTURE_WEIGHTS_INDEX) + 3] = textureWeights[3];

        // Upload the changes to the constant data immediately, since we
        // won't touch it again.
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.spriteBuffer_);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, Float32Array.BYTES_PER_ELEMENT * (this.positionData_.length + baseIndex), this.constantData_.subarray(baseIndex, baseIndex + GameSpriteSystem.constantAttributeStride_));
    }
    setupConstantLoc_(location, index): void {
        if (location == -1)
            return; // Debugging
        var baseOffset = Float32Array.BYTES_PER_ELEMENT * this.positionData_.length;
        var constantStride = GameSpriteSystem.constantAttributeStride_;
        var constantAttributeInfo = constantAttributeInfo_;
        this.gl.enableVertexAttribArray(location);
        this.gl.vertexAttribPointer(location,
            constantAttributeInfo[index].size, this.gl.FLOAT, false,
            constantStride * Float32Array.BYTES_PER_ELEMENT,
            baseOffset + Float32Array.BYTES_PER_ELEMENT * constantAttributeInfo[index].offset);
    }



    public draw = function (atlas, deltaTime) {
        this.gl.enable(this.gl.BLEND);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.disable(this.gl.CULL_FACE);
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);

        // Recompute all sprites' positions. Wrap around offscreen.
        var numVertices = this.numVertices_;
        for (var ii = 0; ii < numVertices; ++ii) {
            var newPosX = this.startPositionData_[2 * ii] + deltaTime * this.velocityData_[2 * ii];
            var newPosY = this.startPositionData_[2 * ii + 1] + deltaTime * this.velocityData_[2 * ii + 1];

            var spriteSize = this.spriteSizeData_[ii];
            if (newPosX > this.canvasWidth + 1.1 * spriteSize) {
                newPosX = -spriteSize;
            } else if (newPosX < -1.1 * spriteSize) {
                newPosX = this.canvasWidth + spriteSize;
            }

            if (newPosY > this.canvasHeight + 1.1 * spriteSize) {
                newPosY = -spriteSize;
            } else if (newPosY < -1.1 * spriteSize) {
                newPosY = this.canvasHeight + spriteSize;
            }

            this.startPositionData_[2 * ii] = newPosX;
            this.startPositionData_[2 * ii + 1] = newPosY;
            this.positionData_[2 * ii] = newPosX;
            this.positionData_[2 * ii + 1] = newPosY;
        }

        // Upload all sprites' positions.
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.spriteBuffer_);
        if (!this.precisePositionView_ || this.precisePositionView_.length != 2 * numVertices) {
            this.precisePositionView_ = this.positionData_.subarray(0, 2 * numVertices);
        }
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.precisePositionView_);

        // Bind all textures.
        atlas.bindTextures();

        // Prepare to draw.
        this.gl.useProgram(this.program_);

        // Set up streams.
        this.gl.enableVertexAttribArray(this.centerPositionLoc_);
        this.gl.vertexAttribPointer(this.centerPositionLoc_, 2, this.gl.FLOAT, false, 0, 0);
        this.setupConstantLoc_(this.rotationLoc_, ROTATION_INDEX);
        this.setupConstantLoc_(this.perSpriteFrameOffsetLoc_, PER_SPRITE_FRAME_OFFSET_INDEX);
        this.setupConstantLoc_(this.spriteSizeLoc_, SPRITE_SIZE_INDEX);
        this.setupConstantLoc_(this.cornerOffsetLoc_, CORNER_OFFSET_INDEX);
        this.setupConstantLoc_(this.spriteTextureSizeLoc_, SPRITE_TEXTURE_SIZE_INDEX);
        this.setupConstantLoc_(this.spritesPerRowLoc_, SPRITES_PER_ROW_INDEX);
        this.setupConstantLoc_(this.numFramesLoc_, NUM_FRAMES_INDEX);
        this.setupConstantLoc_(this.textureWeightsLoc_, TEXTURE_WEIGHTS_INDEX);

        // Set up uniforms.
        this.gl.uniform1f(this.frameOffsetLoc_, this.frameOffset_++);
        this.gl.uniform4f(this.screenDimsLoc_,
            2.0 / this.screenWidth_,
            -2.0 / this.screenHeight_,
            -1.0,
            1.0);
        // FIXME: query atlas for the number of textures.
        this.gl.uniform1i(this.texture0Loc_, 0);
        this.gl.uniform1i(this.texture1Loc_, 1);
        this.gl.uniform1i(this.texture2Loc_, 2);
        this.gl.uniform1i(this.texture3Loc_, 3);

        // Do the draw call.
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.numVertices_);
    }
}