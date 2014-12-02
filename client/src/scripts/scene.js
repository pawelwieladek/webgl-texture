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
        shaderProgram.normalMatrixUniform = gl.getUniformLocation(shaderProgram, "uNormalMatrix");

        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
        shaderProgram.useTextureUniform = gl.getUniformLocation(shaderProgram, "uUseTexture");
        shaderProgram.secondSamplerUniform = gl.getUniformLocation(shaderProgram, "uSecondSampler");
        shaderProgram.useSecondTextureUniform = gl.getUniformLocation(shaderProgram, "uUseSecondTexture");
        shaderProgram.useColorUniform = gl.getUniformLocation(shaderProgram, "uUseColor");
        shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "uColor");

        shaderProgram.directionalLightsCount = gl.getUniformLocation(shaderProgram, "directionalLightsCount");
        shaderProgram.pointLightsCount = gl.getUniformLocation(shaderProgram, "pointLightsCount");
        shaderProgram.spotLightsCount = gl.getUniformLocation(shaderProgram, "spotLightsCount");

        shaderProgram.pointLights = [];
        shaderProgram.pointLights.push({
            position: gl.getUniformLocation(shaderProgram, "pointLights[0].position"),
            diffuseColor: gl.getUniformLocation(shaderProgram, "pointLights[0].diffuseColor"),
            ambientColor: gl.getUniformLocation(shaderProgram, "pointLights[0].ambientColor"),
            constantAttenuation: gl.getUniformLocation(shaderProgram, "pointLights[0].constantAttenuation"),
            linearAttenuation: gl.getUniformLocation(shaderProgram, "pointLights[0].linearAttenuation"),
            exponentAttenuation: gl.getUniformLocation(shaderProgram, "pointLights[0].exponentAttenuation")
        });
    }

    function handleLoadedTexture(textures) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        gl.bindTexture(gl.TEXTURE_2D, textures[0]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures[0].image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        gl.bindTexture(gl.TEXTURE_2D, textures[1]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures[1].image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.bindTexture(gl.TEXTURE_2D, textures[2]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures[2].image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    var crowdTextures = [];
    var floor1Textures = [];
    var floor2Textures = [];
    var signsTextures = [];
    var ceilingTextures = [];

    function initTexture(src, textureArray) {
        var i;
        var image = new Image();

        for (i=0; i < 3; i++) {
            var texture = gl.createTexture();
            texture.image = image;
            textureArray.push(texture);
        }

        image.onload = function () {
            handleLoadedTexture(textureArray)
        };
        image.src = src;
    }

    function initTextures() {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        initTexture("images/floor_1.jpg", floor1Textures);
        initTexture("images/ceiling.jpg", ceilingTextures);
        initTexture("images/crowd.jpg", crowdTextures);
        initTexture("images/signs.jpg", signsTextures);
    }

    var modelMatrix = mat4.create();
    var viewMatrix = mat4.create();
    var projectionMatrix = mat4.create();

    var camera = {
        position: vec3.fromValues(0.0, 0.0, 10.0),
        tangent: vec3.fromValues(1.0, 0.0, 0.0),
        forward: vec3.fromValues(0.0, 0.0, 1.0),
        up: vec3.fromValues(0.0, 1.0, 0.0),
        translateStep: 0.1,
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

    function clamp(number, min, max) {
        return Math.max(min, Math.min(number, max));
    }

    function vec3clamp(position, lowerLimit, upperLimit) {
        position[0] = clamp(position[0], lowerLimit[0], upperLimit[0]);
        position[1] = clamp(position[1], lowerLimit[1], upperLimit[1]);
        position[2] = clamp(position[2], lowerLimit[2], upperLimit[2]);
        return position;
    }

    var worldSize = {
        x: 20.0,
        y: 4.0,
        z: 20.0
    };

    function handleKeys() {
        if (currentlyPressedKeys[Keys.PageUp]) {
            var upKeyUp = vec3.create();
            vec3.scale(upKeyUp, camera.up, camera.translateStep);
            vec3.add(camera.position, camera.position, upKeyUp);
            camera.position = vec3clamp(camera.position, vec3.fromValues(-worldSize.x, -worldSize.y, -worldSize.z), vec3.fromValues(worldSize.x, worldSize.y, worldSize.z));
        }
        if (currentlyPressedKeys[Keys.PageDown]) {
            var upKeyDown = vec3.create();
            vec3.scale(upKeyDown, camera.up, -camera.translateStep);
            vec3.add(camera.position, camera.position, upKeyDown);
            camera.position = vec3clamp(camera.position, vec3.fromValues(-worldSize.x, -worldSize.y, -worldSize.z), vec3.fromValues(worldSize.x, worldSize.y, worldSize.z));
        }
        if (currentlyPressedKeys[Keys.LeftArrow]) {
            var tangentLeft = vec3.create();
            vec3.scale(tangentLeft, camera.tangent, -camera.translateStep);
            vec3.add(camera.position, camera.position, tangentLeft);
            camera.position = vec3clamp(camera.position, vec3.fromValues(-worldSize.x, -worldSize.y, -worldSize.z), vec3.fromValues(worldSize.x, worldSize.y, worldSize.z));
        }
        if (currentlyPressedKeys[Keys.RightArrow]) {
            var tangentKeyRight = vec3.create();
            vec3.scale(tangentKeyRight, camera.tangent, camera.translateStep);
            vec3.add(camera.position, camera.position, tangentKeyRight);
            camera.position = vec3clamp(camera.position, vec3.fromValues(-worldSize.x, -worldSize.y, -worldSize.z), vec3.fromValues(worldSize.x, worldSize.y, worldSize.z));
        }
        if (currentlyPressedKeys[Keys.UpArrow]) {
            var forwardKeyUp = vec3.create();
            vec3.scale(forwardKeyUp, camera.forward, -camera.translateStep);
            vec3.add(camera.position, camera.position, forwardKeyUp);
            camera.position = vec3clamp(camera.position, vec3.fromValues(-worldSize.x, -worldSize.y, -worldSize.z), vec3.fromValues(worldSize.x, worldSize.y, worldSize.z));
        }
        if (currentlyPressedKeys[Keys.DownArrow]) {
            var forwardKeyDown = vec3.create();
            vec3.scale(forwardKeyDown, camera.forward, camera.translateStep);
            vec3.add(camera.position, camera.position, forwardKeyDown);
            camera.position = vec3clamp(camera.position, vec3.fromValues(-worldSize.x, -worldSize.y, -worldSize.z), vec3.fromValues(worldSize.x, worldSize.y, worldSize.z));
        }
        if(currentlyPressedKeys[Keys.S]) {
            camera.pitchAngle -= camera.rotateStep;
        }
        if(currentlyPressedKeys[Keys.W]) {
            camera.pitchAngle += camera.rotateStep;
        }
        if(currentlyPressedKeys[Keys.D]) {
            camera.yawAngle -= camera.rotateStep;
        }
        if(currentlyPressedKeys[Keys.A]) {
            camera.yawAngle += camera.rotateStep;
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
            0.0,  0.0,  -1.0,
            0.0,  0.0,  -1.0,
            0.0,  0.0,  -1.0,
            0.0,  0.0,  -1.0,

            // Back face
            0.0,  0.0, 1.0,
            0.0,  0.0, 1.0,
            0.0,  0.0, 1.0,
            0.0,  0.0, 1.0,

            // Top face
            0.0,  -1.0,  0.0,
            0.0,  -1.0,  0.0,
            0.0,  -1.0,  0.0,
            0.0,  -1.0,  0.0,

            // Bottom face
            0.0, 1.0,  0.0,
            0.0, 1.0,  0.0,
            0.0, 1.0,  0.0,
            0.0, 1.0,  0.0,

            // Right face
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,

            // Left face
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0
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

    var walls = {
        vertexBuffer: {},
        normalBuffer: {},
        textureBuffer: {},
        indexBuffer: {}
    };

    function initWallsBuffers() {
        walls.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, walls.vertexBuffer);
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
        walls.vertexBuffer.itemSize = 3;
        walls.vertexBuffer.numItems = 16;

        walls.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, walls.normalBuffer);
        var vertexNormals = [
            // Front face
            0.0,  0.0,  -1.0,
            0.0,  0.0,  -1.0,
            0.0,  0.0,  -1.0,
            0.0,  0.0,  -1.0,

            // Back face
            0.0,  0.0, 1.0,
            0.0,  0.0, 1.0,
            0.0,  0.0, 1.0,
            0.0,  0.0, 1.0,

            // Right face
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,

            // Left face
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0,
            1.0,  0.0,  0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
        walls.normalBuffer.itemSize = 3;
        walls.normalBuffer.numItems = 16;

        walls.textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, walls.textureBuffer);
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
        walls.textureBuffer.itemSize = 2;
        walls.textureBuffer.numItems = 16;

        walls.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, walls.indexBuffer);
        var cubeVertexIndices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,
            12, 13, 14,   12, 14, 15

        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
        walls.indexBuffer.itemSize = 1;
        walls.indexBuffer.numItems = 24;
    }

    var rectangle = {
        vertexBuffer: {},
        normalBuffer: {},
        textureBuffer: {},
        indexBuffer: {}
    };

    function initRectangleBuffers() {

        rectangle.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.vertexBuffer);
        var vertices = [
            -1.0, -1.0, 0.0,
            -1.0, 1.0, 0.0,
            1.0, 1.0, 0.0,
            1.0, -1.0, 0.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        rectangle.vertexBuffer.itemSize = 3;
        rectangle.vertexBuffer.numItems = 4;

        rectangle.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.normalBuffer);
        var vertexNormals = [
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
        rectangle.normalBuffer.itemSize = 3;
        rectangle.normalBuffer.numItems = 4;

        rectangle.textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.textureBuffer);
        var textureCoords = [
            0.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0

        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        rectangle.textureBuffer.itemSize = 2;
        rectangle.textureBuffer.numItems = 4;

        rectangle.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rectangle.indexBuffer);
        var indices = [
            0, 1, 2, 0, 2, 3
        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        rectangle.indexBuffer.itemSize = 1;
        rectangle.indexBuffer.numItems = 6;
    }

    function initBuffers() {
        initCubeBuffers();
        initRectangleBuffers();
        initWallsBuffers();
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
        mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(10.0, 3.0, 10.0));

        gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cube.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, cube.normalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cube.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.uniform1i(shaderProgram.useColorUniform, 0);
        gl.uniform1i(shaderProgram.useTextureUniform, 1);
        gl.uniform1i(shaderProgram.useSecondTextureUniform, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, cube.textureBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cube.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, crowdTextures[filter]);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);

        gl.uniformMatrix4fv(shaderProgram.modelMatrixUniform, false, modelMatrix);
        gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, viewMatrix);
        gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform, false, projectionMatrix);

        gl.drawElements(gl.TRIANGLES, cube.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    function drawWalls() {
        mat4.identity(modelMatrix);
        mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(worldSize.x, worldSize.y, worldSize.z));

        gl.bindBuffer(gl.ARRAY_BUFFER, walls.vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, walls.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, walls.normalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, walls.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.uniform1i(shaderProgram.useColorUniform, 0);
        gl.uniform1i(shaderProgram.useTextureUniform, 1);
        gl.uniform1i(shaderProgram.useSecondTextureUniform, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, walls.textureBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, walls.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, crowdTextures[filter]);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, walls.indexBuffer);

        gl.uniformMatrix4fv(shaderProgram.modelMatrixUniform, false, modelMatrix);
        gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, viewMatrix);
        gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform, false, projectionMatrix);

        var normalMatrix = mat3.create();
        mat3.fromMat4(normalMatrix, modelMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix3fv(shaderProgram.normalMatrixUniform, false, normalMatrix);

        gl.drawElements(gl.TRIANGLES, walls.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    function drawPole() {
        gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cube.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, cube.normalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cube.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.uniform1i(shaderProgram.useColorUniform, 1);
        gl.uniform3fv(shaderProgram.colorUniform, vec3.fromValues(0.8, 0.8, 0.8));

        gl.uniform1i(shaderProgram.useSecondTextureUniform, 0);
        gl.uniform1i(shaderProgram.useTextureUniform, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, cube.textureBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cube.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);

        gl.uniformMatrix4fv(shaderProgram.modelMatrixUniform, false, modelMatrix);
        gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, viewMatrix);
        gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform, false, projectionMatrix);

        var normalMatrix = mat3.create();
        mat3.fromMat4(normalMatrix, modelMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix3fv(shaderProgram.normalMatrixUniform, false, normalMatrix);

        gl.drawElements(gl.TRIANGLES, cube.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    function drawRectangle() {
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, rectangle.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.normalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, rectangle.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.uniform1i(shaderProgram.useColorUniform, 1);
        gl.uniform3fv(shaderProgram.colorUniform, vec3.fromValues(1.0, 0.0, 0.0));

        gl.uniform1i(shaderProgram.useTextureUniform, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.textureBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, rectangle.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rectangle.indexBuffer);

        gl.uniformMatrix4fv(shaderProgram.modelMatrixUniform, false, modelMatrix);
        gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, viewMatrix);
        gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform, false, projectionMatrix);

        var normalMatrix = mat3.create();
        mat3.fromMat4(normalMatrix, modelMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix3fv(shaderProgram.normalMatrixUniform, false, normalMatrix);

        gl.drawElements(gl.TRIANGLES, rectangle.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    function drawNet() {
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, rectangle.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.normalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, rectangle.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.uniform1i(shaderProgram.useColorUniform, 1);
        gl.uniform3fv(shaderProgram.colorUniform, vec3.fromValues(1.0, 1.0, 1.0));

        gl.uniform1i(shaderProgram.useSecondTextureUniform, 0);
        gl.uniform1i(shaderProgram.useTextureUniform, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.textureBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, rectangle.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rectangle.indexBuffer);

        gl.uniformMatrix4fv(shaderProgram.modelMatrixUniform, false, modelMatrix);
        gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, viewMatrix);
        gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform, false, projectionMatrix);

        var normalMatrix = mat3.create();
        mat3.fromMat4(normalMatrix, modelMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix3fv(shaderProgram.normalMatrixUniform, false, normalMatrix);

        gl.drawElements(gl.TRIANGLES, rectangle.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    function drawFloor() {
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, rectangle.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.normalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, rectangle.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.uniform1i(shaderProgram.useColorUniform, 0);
        gl.uniform3fv(shaderProgram.colorUniform, vec3.fromValues(1.0, 1.0, 1.0));

        gl.uniform1i(shaderProgram.useTextureUniform, 1);
        gl.uniform1i(shaderProgram.useSecondTextureUniform, 1);
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.textureBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, rectangle.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, floor1Textures[filter]);
        gl.uniform1i(shaderProgram.samplerUniform, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, signsTextures[filter]);
        gl.uniform1i(shaderProgram.secondSamplerUniform, 1);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rectangle.indexBuffer);

        gl.uniformMatrix4fv(shaderProgram.modelMatrixUniform, false, modelMatrix);
        gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, viewMatrix);
        gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform, false, projectionMatrix);

        var normalMatrix = mat3.create();
        mat3.fromMat4(normalMatrix, modelMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix3fv(shaderProgram.normalMatrixUniform, false, normalMatrix);

        gl.drawElements(gl.TRIANGLES, rectangle.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    function drawCeiling() {
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.vertexBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, rectangle.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.normalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, rectangle.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.uniform1i(shaderProgram.useColorUniform, 0);
        gl.uniform3fv(shaderProgram.colorUniform, vec3.fromValues(1.0, 1.0, 1.0));

        gl.uniform1i(shaderProgram.useSecondTextureUniform, 0);
        gl.uniform1i(shaderProgram.useTextureUniform, 1);
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.textureBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, rectangle.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, ceilingTextures[filter]);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rectangle.indexBuffer);

        gl.uniformMatrix4fv(shaderProgram.modelMatrixUniform, false, modelMatrix);
        gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, viewMatrix);
        gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform, false, projectionMatrix);

        var normalMatrix = mat3.create();
        mat3.fromMat4(normalMatrix, modelMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix3fv(shaderProgram.normalMatrixUniform, false, normalMatrix);

        gl.drawElements(gl.TRIANGLES, rectangle.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    function drawPitch() {
        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(-7.0, -2.0, 0.0));
        mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(0.1, 2.0, 0.1));
        drawPole();
        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(7.0, -2.0, 0.0));
        mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(0.1, 2.0, 0.1));
        drawPole();
        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(0.0, -1.25, 0.0));
        mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(7.0, 1.0, 1.0));
        drawNet();
        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(0.0, -worldSize.y, 0.0));
        mat4.rotateX(modelMatrix, modelMatrix, (Math.PI * 90) / 180);
        mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(worldSize.x, worldSize.z, 1.0));
        drawFloor();
        mat4.identity(modelMatrix);
        mat4.translate(modelMatrix, modelMatrix, vec3.fromValues(0.0, worldSize.y, 0.0));
        mat4.rotateX(modelMatrix, modelMatrix, (Math.PI * -90) / 180);
        mat4.scale(modelMatrix, modelMatrix, vec3.fromValues(worldSize.x, worldSize.z, 1.0));
        drawCeiling();
    }

    function drawLights() {
        gl.uniform1i(shaderProgram.directionalLightsCount, 0);
        gl.uniform1i(shaderProgram.pointLightsCount, 1);
        gl.uniform1i(shaderProgram.spotLightsCount, 0);

        gl.uniform3fv(shaderProgram.pointLights[0].position, vec3.fromValues(-worldSize.x / 2, worldSize.y - 0.1, -worldSize.z / 2));
        gl.uniform3fv(shaderProgram.pointLights[0].diffuseColor, vec3.fromValues(0.1, 0.1, 0.1));
        gl.uniform3fv(shaderProgram.pointLights[0].ambientColor, vec3.fromValues(0.8, 0.8, 0.8));
        gl.uniform1f(shaderProgram.pointLights[0].constantAttenuation, 1);
        gl.uniform1f(shaderProgram.pointLights[0].linearAttenuation, 0);
        gl.uniform1f(shaderProgram.pointLights[0].exponentAttenuation, 0);
    }

    function drawScene() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(projectionMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

        drawCamera();
        drawLights();
        drawWalls();
        drawPitch()
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
    initTextures();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
});