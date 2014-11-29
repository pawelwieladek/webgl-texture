$(document).ready(function() {

    var gl;

    function initGL(canvas) {
        try {
            gl = canvas.getContext("experimental-webgl");
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } catch (e) {
        }
        if (!gl) {
            alert("Could not initialise WebGL");
        }
    }


    function getShader(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }


    var shaderProgram;

    function initShaders() {
        var fragmentShader = getShader(gl, "shader-fs");
        var vertexShader = getShader(gl, "shader-vs");

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(shaderProgram);

        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

        shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

        shaderProgram.projectionMatrixUniform = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
        shaderProgram.modelMatrixUniform = gl.getUniformLocation(shaderProgram, "uModelMatrix");
        shaderProgram.viewMatrixUniform = gl.getUniformLocation(shaderProgram, "uViewMatrix");
        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    }

    function handleLoadedTexture(textures) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        gl.bindTexture(gl.TEXTURE_2D, textures[0]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures[0].image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        gl.bindTexture(gl.TEXTURE_2D, textures[1]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures[0].image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.bindTexture(gl.TEXTURE_2D, textures[2]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures[0].image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    var crateTextures = [];

    function initTexture() {
        var crateImage = new Image();

        for (var i=0; i < 3; i++) {
            var texture = gl.createTexture();
            texture.image = crateImage;
            crateTextures.push(texture);
        }

        crateImage.onload = function () {
            handleLoadedTexture(crateTextures)
        };
        crateImage.src = "crate.gif";
    }

    var modelMatrix = mat4.create();
    var viewMatrix = mat4.create();
    var projectionMatrix = mat4.create();

    var camera = {
        position: vec3.fromValues(0.0, 0.0, 0.0),
        tangent: vec3.fromValues(1.0, 0.0, 0.0),
        forward: vec3.fromValues(0.0, 0.0, 1.0),
        up: vec3.fromValues(0.0, 1.0, 0.0),
        translateStep: 0.05,
        rotateStep: Math.PI / 180,
        pitchAngle: 0.0,
        yawAngle: 0.0
    };

    var filter = 0;

    var currentlyPressedKeys = {};

    function handleKeyDown(event) {
        currentlyPressedKeys[event.keyCode] = true;

        if (String.fromCharCode(event.keyCode) == "F") {
            filter += 1;
            if (filter == 3) {
                filter = 0;
            }
        }
    }

    function handleKeyUp(event) {
        currentlyPressedKeys[event.keyCode] = false;
    }

    var Keys = {
        LeftArrow: 37,
        UpArrow: 38,
        RightArrow: 39,
        DownArrow: 40,
        PageUp: 33,
        PageDown: 34,
        A: 65,
        B: 66,
        C: 67,
        D: 68,
        E: 69,
        F: 70,
        G: 71,
        H: 72,
        I: 73,
        J: 74,
        K: 75,
        L: 76,
        M: 77,
        N: 78,
        O: 79,
        P: 80,
        Q: 81,
        R: 82,
        S: 83,
        T: 84,
        U: 85,
        V: 86,
        W: 87,
        X: 88,
        Y: 89,
        Z: 90
    };

    function handleKeys() {
        if (currentlyPressedKeys[Keys.PageUp]) {
            var upKeyUp = vec3.create();
            vec3.scale(upKeyUp, camera.up, camera.translateStep);
            vec3.add(camera.position, camera.position, upKeyUp);
        }
        if (currentlyPressedKeys[Keys.PageDown]) {
            var upKeyDown = vec3.create();
            vec3.scale(upKeyDown, camera.up, -camera.translateStep);
            vec3.add(camera.position, camera.position, upKeyDown);
        }
        if (currentlyPressedKeys[Keys.LeftArrow]) {
            var tangentLeft = vec3.create();
            vec3.scale(tangentLeft, camera.tangent, -camera.translateStep);
            vec3.add(camera.position, camera.position, tangentLeft);
        }
        if (currentlyPressedKeys[Keys.RightArrow]) {
            // Right cursor key
            var tangentKeyRight = vec3.create();
            vec3.scale(tangentKeyRight, camera.tangent, camera.translateStep);
            vec3.add(camera.position, camera.position, tangentKeyRight);
        }
        if (currentlyPressedKeys[Keys.UpArrow]) {
            var forwardKeyUp = vec3.create();
            vec3.scale(forwardKeyUp, camera.forward, -camera.translateStep);
            vec3.add(camera.position, camera.position, forwardKeyUp);
        }
        if (currentlyPressedKeys[Keys.DownArrow]) {
            var forwardKeyDown = vec3.create();
            vec3.scale(forwardKeyDown, camera.forward, camera.translateStep);
            vec3.add(camera.position, camera.position, forwardKeyDown);
        }
    }

    var cube = {
        vertexBuffer: {},
        normalBuffer: {},
        textureBuffer: {},
        indexBuffer: {}
    };

    function initCubeBuffers() {
        cube.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexBuffer);
        var vertices = [
            // Front face
            -1.0, -1.0,  1.0,
            1.0, -1.0,  1.0,
            1.0,  1.0,  1.0,
            -1.0,  1.0,  1.0,

            // Back face
            -1.0, -1.0, -1.0,
            -1.0,  1.0, -1.0,
            1.0,  1.0, -1.0,
            1.0, -1.0, -1.0,

            // Top face
            -1.0,  1.0, -1.0,
            -1.0,  1.0,  1.0,
            1.0,  1.0,  1.0,
            1.0,  1.0, -1.0,

            // Bottom face
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, -1.0,  1.0,
            -1.0, -1.0,  1.0,

            // Right face
            1.0, -1.0, -1.0,
            1.0,  1.0, -1.0,
            1.0,  1.0,  1.0,
            1.0, -1.0,  1.0,

            // Left face
            -1.0, -1.0, -1.0,
            -1.0, -1.0,  1.0,
            -1.0,  1.0,  1.0,
            -1.0,  1.0, -1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        cube.vertexBuffer.itemSize = 3;
        cube.vertexBuffer.numItems = 24;

        cube.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cube.normalBuffer);
        var vertexNormals = [
            // Front face
            0.0,  0.0,  1.0,
            0.0,  0.0,  1.0,
            0.0,  0.0,  1.0,
            0.0,  0.0,  1.0,

            // Back face
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,
            0.0,  0.0, -1.0,

            // Top face
            0.0,  1.0,  0.0,
            0.0,  1.0,  0.0,
            0.0,  1.0,  0.0,
            0.0,  1.0,  0.0,

            // Bottom face
            0.0, -1.0,  0.0,
            0.0, -1.0,  0.0,
            0.0, -1.0,  0.0,
            0.0, -1.0,  0.0,

            // Right face
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,

            // Left face
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
        cube.normalBuffer.itemSize = 3;
        cube.normalBuffer.numItems = 24;

        cube.textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cube.textureBuffer);
        var textureCoords = [
            // Front face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            // Back face
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,

            // Top face
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,

            // Bottom face
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,

            // Right face
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,

            // Left face
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        cube.textureBuffer.itemSize = 2;
        cube.textureBuffer.numItems = 24;

        cube.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);
        var cubeVertexIndices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,  // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
        cube.indexBuffer.itemSize = 1;
        cube.indexBuffer.numItems = 36;
    }

    function initBuffers() {
        initCubeBuffers();
    }

    function drawCamera() {
        var rotationMatrix = mat4.create();
        var direction = vec3.fromValues(0.0, 0.0, -1.0);
        var tangent = vec3.fromValues(1.0, 0.0, 0.0);
        var forward = vec3.fromValues(0.0, 0.0, 1.0);
        var up = vec3.fromValues(0.0, 1.0, 0.0);
        mat4.rotateX(rotationMatrix, rotationMatrix, camera.pitchAngle);
        vec3.transformMat4(direction, direction, rotationMatrix);
        vec3.transformMat4(forward, forward, rotationMatrix);
        vec3.transformMat4(tangent, tangent, rotationMatrix);
        vec3.transformMat4(up, up, rotationMatrix);
        mat4.identity(rotationMatrix);
        mat4.rotateY(rotationMatrix, rotationMatrix, camera.yawAngle);
        vec3.transformMat4(direction, direction, rotationMatrix);
        vec3.transformMat4(forward, forward, rotationMatrix);
        vec3.transformMat4(tangent, tangent, rotationMatrix);
        vec3.transformMat4(up, up, rotationMatrix);
        camera.tangent = tangent;
        camera.forward = forward;
        camera.up = up;
        vec3.add(direction, direction, camera.position, up);
        mat4.lookAt(viewMatrix, camera.position, direction, up);
    }

    function drawCube() {
        mat4.identity(modelMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cube.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, cube.normalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cube.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, cube.textureBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cube.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, crateTextures[filter]);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);

        gl.uniformMatrix4fv(shaderProgram.modelMatrixUniform, false, modelMatrix);
        gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, viewMatrix);
        gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform, false, projectionMatrix);

        gl.drawElements(gl.TRIANGLES, cube.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    function drawScene() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(projectionMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

        drawCamera();
        drawCube();
    }

    window.requestAnimFrame = (function() {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
                window.setTimeout(callback, 1000/60);
            };
    })();

    function tick() {
        requestAnimFrame(tick);
        handleKeys();
        drawScene();
    }

    var canvas = document.getElementById("scene");
    canvas.width = $(document).innerWidth();
    canvas.height = $(document).innerHeight();
    initGL(canvas);
    initShaders();
    initBuffers();
    initTexture();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
});