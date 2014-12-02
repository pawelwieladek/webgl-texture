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

    function Shaders() {
        this.program = {};
        this.attributes = {};
        this.uniforms = {};
    }

    Shaders.prototype = {
        getShaderSource: function(id) {
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
        },

        createShaders: function() {
            var fragmentShader = this.getShaderSource("shader-fs");
            var vertexShader = this.getShaderSource("shader-vs");

            this.program = gl.createProgram();
            gl.attachShader(this.program, vertexShader);
            gl.attachShader(this.program, fragmentShader);
            gl.linkProgram(this.program);

            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
                alert("Could not initialise shaders");
            }

            gl.useProgram(this.program);
        },

        bindAttribute: function(name) {
            this.attributes[name] = gl.getAttribLocation(this.program, name);
            gl.enableVertexAttribArray(this.attributes[name]);
        },

        bindUniform: function(name) {
            this.uniforms[name] = gl.getUniformLocation(this.program, name);
        },

        bindLocations: function() {
            this.bindAttribute("aVertexPosition");
            this.bindAttribute("aVertexNormal");
            this.bindAttribute("aTextureCoord");

            this.bindUniform("uProjectionMatrix");
            this.bindUniform("uModelMatrix");
            this.bindUniform("uViewMatrix");
            this.bindUniform("uNormalMatrix");
            this.bindUniform("textureSamplers");
            this.bindUniform("uColor");
            this.bindUniform("texturesCount");
            this.bindUniform("directionalLightsCount");
            this.bindUniform("pointLightsCount");
            this.bindUniform("spotLightsCount");
            this.bindUniform("pointLights[0].position");
            this.bindUniform("pointLights[0].diffuseColor");
            this.bindUniform("pointLights[0].ambientColor");
            this.bindUniform("pointLights[0].constantAttenuation");
            this.bindUniform("pointLights[0].linearAttenuation");
            this.bindUniform("pointLights[0].exponentAttenuation");
        },
        init: function() {
            this.createShaders();
            this.bindLocations();
        }
    };
    
    var shaders;

    var scene;

    function Scene() {
        this.textures = {};
    }

    Scene.prototype = {
        addTexture: function(name, src) {
            this.textures[name] = new Texture(src);
        },

        init: function() {
            this.addTexture("crowd", "images/crowd.jpg");
            this.addTexture("ceiling", "images/ceiling.jpg");
            this.addTexture("floor_1", "images/floor_1.jpg");
            this.addTexture("signs", "images/signs.jpg");
        }
    };

    function Texture(src) {
        this.versions = [];

        var i;
        var image = new Image();

        for (i=0; i < 3; i++) {
            var texture = gl.createTexture();
            texture.image = image;
            this.versions.push(texture);
        }

        image.onload = function () {
            handleLoaded(this.versions);
        }.bind(this);
        image.src = src;

        function handleLoaded(textureVersions) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            gl.bindTexture(gl.TEXTURE_2D, textureVersions[0]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureVersions[0].image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

            gl.bindTexture(gl.TEXTURE_2D, textureVersions[1]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureVersions[1].image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            gl.bindTexture(gl.TEXTURE_2D, textureVersions[2]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureVersions[2].image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);

            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    }

    Texture.prototype = {
        get: function(filter) {
            return this.versions[filter];
        }
    };

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

        walls.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, walls.indexBuffer);
        var cubeVertexIndices = [
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,
            12, 13, 14,   12, 14, 15

        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
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

    function Drawable() {
        
    }

    function draw(shaders, matrices, options) {
        options.buffers = options.buffers || {};

        if(options.buffers.vertex) {
            gl.bindBuffer(gl.ARRAY_BUFFER, options.buffers.vertex.buffer);
            gl.vertexAttribPointer(shaders.attributes.aVertexPosition, options.buffers.vertex.itemSize, gl.FLOAT, false, 0, 0);
        }

        if(options.buffers.normal) {
            gl.bindBuffer(gl.ARRAY_BUFFER, options.buffers.normal.buffer);
            gl.vertexAttribPointer(shaders.attributes.aVertexNormal, options.buffers.normal.itemSize, gl.FLOAT, false, 0, 0);
        }

        if(options.buffers.texture) {
            gl.bindBuffer(gl.ARRAY_BUFFER, options.buffers.texture.buffer);
            gl.vertexAttribPointer(shaders.attributes.aTextureCoord, options.buffers.texture.itemSize, gl.FLOAT, false, 0, 0);
        }

        if(options.color) {
            gl.uniform1i(shaders.uniforms.uUseColor, 1);
            gl.uniform3fv(shaders.uniforms.uColor, options.color);
        } else {
            gl.uniform1i(shaders.uniforms.uUseColor, 0);
        }

        if(options.textures) {
            var i = 0;
            options.textures.forEach(function(textureInfo) {
                gl.uniform1i(shaders.uniforms.texturesCount, ++i);
                gl.activeTexture(textureInfo.activeId);
                gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture.get(filter));
                gl.uniform1i(shaders.uniforms["textureSamplers[" + i + "]"], i++);
            });
        }

        var normalMatrix = mat3.create();
        mat3.fromMat4(normalMatrix, matrices.model);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(shaders.uniforms.uModelMatrix, false, matrices.model);
        gl.uniformMatrix4fv(shaders.uniforms.uViewMatrix, false, matrices.view);
        gl.uniformMatrix4fv(shaders.uniforms.uProjectionMatrix, false, matrices.projection);
        gl.uniformMatrix3fv(shaders.uniforms.uNormalMatrix, false, normalMatrix);

        if(options.buffers.index) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, options.buffers.index.buffer);
            gl.drawElements(gl.TRIANGLES, options.buffers.index.numItems, gl.UNSIGNED_SHORT, 0);
        }
    }

    function drawPole() {
        gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexBuffer);
        gl.vertexAttribPointer(shaders.attributes.aVertexPosition, cube.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, cube.normalBuffer);
        gl.vertexAttribPointer(shaders.attributes.aVertexNormal, cube.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.uniform1i(shaders.uniforms.uUseColor, 1);
        gl.uniform3fv(shaders.uniforms.uColor, vec3.fromValues(0.8, 0.8, 0.8));

        gl.uniform1i(shaders.uniforms.uUseSecondTexture, 0);
        gl.uniform1i(shaders.uniforms.uUseTexture, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, cube.textureBuffer);
        gl.vertexAttribPointer(shaders.attributes.aTextureCoord, cube.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.indexBuffer);

        gl.uniformMatrix4fv(shaders.uniforms.uModelMatrix, false, modelMatrix);
        gl.uniformMatrix4fv(shaders.uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(shaders.uniforms.uProjectionMatrix, false, projectionMatrix);

        var normalMatrix = mat3.create();
        mat3.fromMat4(normalMatrix, modelMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix3fv(shaders.uniforms.uNormalMatrix, false, normalMatrix);

        gl.drawElements(gl.TRIANGLES, cube.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    function drawNet() {
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.vertexBuffer);
        gl.vertexAttribPointer(shaders.attributes.aVertexPosition, rectangle.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.normalBuffer);
        gl.vertexAttribPointer(shaders.attributes.aVertexNormal, rectangle.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.uniform1i(shaders.uniforms.uUseColor, 1);
        gl.uniform3fv(shaders.uniforms.uColor, vec3.fromValues(1.0, 1.0, 1.0));

        gl.uniform1i(shaders.uniforms.uUseSecondTexture, 0);
        gl.uniform1i(shaders.uniforms.uUseTexture, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.textureBuffer);
        gl.vertexAttribPointer(shaders.attributes.aTextureCoord, rectangle.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rectangle.indexBuffer);

        gl.uniformMatrix4fv(shaders.uniforms.uModelMatrix, false, modelMatrix);
        gl.uniformMatrix4fv(shaders.uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(shaders.uniforms.uProjectionMatrix, false, projectionMatrix);

        var normalMatrix = mat3.create();
        mat3.fromMat4(normalMatrix, modelMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix3fv(shaders.uniforms.uNormalMatrix, false, normalMatrix);

        gl.drawElements(gl.TRIANGLES, rectangle.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    function drawFloor() {
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.vertexBuffer);
        gl.vertexAttribPointer(shaders.attributes.aVertexPosition, rectangle.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.normalBuffer);
        gl.vertexAttribPointer(shaders.attributes.aVertexNormal, rectangle.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.uniform1i(shaders.uniforms.uUseColor, 0);
        gl.uniform3fv(shaders.uniforms.uColor, vec3.fromValues(1.0, 1.0, 1.0));

        gl.uniform1i(shaders.uniforms.uUseTexture, 1);
        gl.uniform1i(shaders.uniforms.uUseSecondTexture, 1);
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.textureBuffer);
        gl.vertexAttribPointer(shaders.attributes.aTextureCoord, rectangle.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, scene.textures["floor_1"].get(filter));
        gl.uniform1i(shaders.uniforms.uSampler, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, scene.textures["signs"].get(filter));
        gl.uniform1i(shaders.uniforms.uSecondSampler, 1);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rectangle.indexBuffer);

        gl.uniformMatrix4fv(shaders.uniforms.uModelMatrix, false, modelMatrix);
        gl.uniformMatrix4fv(shaders.uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(shaders.uniforms.uProjectionMatrix, false, projectionMatrix);

        var normalMatrix = mat3.create();
        mat3.fromMat4(normalMatrix, modelMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix3fv(shaders.uniforms.uNormalMatrix, false, normalMatrix);

        gl.drawElements(gl.TRIANGLES, rectangle.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

    function drawCeiling() {
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.vertexBuffer);
        gl.vertexAttribPointer(shaders.attributes.aVertexPosition, rectangle.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.normalBuffer);
        gl.vertexAttribPointer(shaders.attributes.aVertexNormal, rectangle.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.uniform1i(shaders.uniforms.uUseColor, 0);
        gl.uniform3fv(shaders.uniforms.uColor, vec3.fromValues(1.0, 1.0, 1.0));

        gl.uniform1i(shaders.uniforms.uUseSecondTexture, 0);
        gl.uniform1i(shaders.uniforms.uUseTexture, 1);
        gl.bindBuffer(gl.ARRAY_BUFFER, rectangle.textureBuffer);
        gl.vertexAttribPointer(shaders.attributes.aTextureCoord, rectangle.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, scene.textures["ceiling"].get(filter));
        gl.uniform1i(shaders.uniforms.uSampler, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rectangle.indexBuffer);

        gl.uniformMatrix4fv(shaders.uniforms.uModelMatrix, false, modelMatrix);
        gl.uniformMatrix4fv(shaders.uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(shaders.uniforms.uProjectionMatrix, false, projectionMatrix);

        var normalMatrix = mat3.create();
        mat3.fromMat4(normalMatrix, modelMatrix);
        mat3.invert(normalMatrix, normalMatrix);
        mat3.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix3fv(shaders.uniforms.uNormalMatrix, false, normalMatrix);

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
        gl.uniform1i(shaders.uniforms.directionalLightsCount, 0);
        gl.uniform1i(shaders.uniforms.pointLightsCount, 1);
        gl.uniform1i(shaders.uniforms.spotLightsCount, 0);

        gl.uniform3fv(shaders.uniforms["pointLights[0].position"], vec3.fromValues(-worldSize.x / 2, worldSize.y - 0.1, -worldSize.z / 2));
        gl.uniform3fv(shaders.uniforms["pointLights[0].diffuseColor"], vec3.fromValues(0.1, 0.1, 0.1));
        gl.uniform3fv(shaders.uniforms["pointLights[0].ambientColor"], vec3.fromValues(0.8, 0.8, 0.8));
        gl.uniform1f(shaders.uniforms["pointLights[0].constantAttenuation"], 1);
        gl.uniform1f(shaders.uniforms["pointLights[0].linearAttenuation"], 0);
        gl.uniform1f(shaders.uniforms["pointLights[0].exponentAttenuation"], 0);
    }

    function drawScene() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(projectionMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

        drawCamera();
        drawLights();
        //drawWalls();
        //drawPitch();
        var matrices = {
            model: modelMatrix,
            view: viewMatrix,
            projection: projectionMatrix
        };

        var options = {
            buffers: {
                vertex: {
                    buffer: walls.vertexBuffer,
                    itemSize: walls.vertexBuffer.itemSize
                },
                normal: {
                    buffer: walls.normalBuffer,
                    itemSize: walls.normalBuffer.itemSize
                },
                texture: {
                    buffer: walls.textureBuffer,
                    itemSize: walls.textureBuffer.itemSize
                },
                index: {
                    buffer: walls.indexBuffer,
                    numItems: walls.indexBuffer.numItems
                }
            },
            textures: [
                {
                    activeId: gl.TEXTURE0,
                    texture: scene.textures["crowd"]
                }
            ]
        };

        draw(shaders, matrices, options);
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
    shaders = new Shaders();
    shaders.init();
    initBuffers();
    scene = new Scene();
    scene.init();


    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
});