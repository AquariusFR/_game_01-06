var gl, program, positionLocation, originalImageTexture, canvas;
var x = 10;
var y = 20;
function setupWebGL() {

    var canvas = document.getElementById("canvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }
    // setup GLSL program
    var program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);
    gl.useProgram(program);
    // look up where the vertex data needs to go.
    positionLocation = gl.getAttribLocation(program, "a_position");
    texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // lookup uniforms
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
    colorLocation = gl.getUniformLocation(program, "u_color");
    // set the resolution
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
}

function draw() {
    // use canvas to simulate an image
    var image = document.createElement("canvas");
    document.body.appendChild(image); // so we can see the source image
    image.width = 200;
    image.height = 150;
    var ctx = image.getContext("2d");
    ctx.fillRect(0, 0, image.width, image.height);
    for (var py = 0; py < image.height; py += 25) {
        for (var px = 0; px < image.width; px += 25) {
            ctx.fillStyle = "rgb(" + (py / image.height * 255 | 0) + "," +
                (px / image.width * 255 | 0) + "," +
                255 + ")";
            ctx.beginPath();
            ctx.arc(px + 12, py + 12, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    setupWebGL();

    var srcX = 50;
    var srcY = 0;
    var srcWidth = image.width - 50;
    var srcHeight = image.height;

    var dstX = x;
    var dstY = y;
    var dstWidth = srcWidth;
    var dstHeight = srcHeight;

    var u0 = srcX / image.width;
    var v0 = srcY / image.height;
    var u1 = (srcX + srcWidth) / image.width;
    var v1 = (srcY + srcHeight) / image.height;

    // provide texture coordinates for the rectangle.
    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([u0, v0, u1, v0, u0, v1, u0, v1, u1, v0, u1, v1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);


    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // set the size of the image
    gl.uniform2f(textureSizeLocation, image.width, image.height);
    // Create a buffer for the position of the rectangle corners.
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    setRectangle(gl, dstX, dstY, dstWidth, dstHeight);


    gl.drawArrays(gl.TRIANGLES, 0, 6);

}

function setRectangle(gl, x, y, width, height) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,//hg
        x2, y1,//hd
        x1, y2,//bg

        x1, y2,//bg
        x2, y1,//hd
        x2, y2 //bd
        ]), gl.STATIC_DRAW);
}

draw();