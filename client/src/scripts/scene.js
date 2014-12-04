$(document).ready(function() {

    function Scene(canvas) {
        this.canvas = canvas;
        this.camera = new Camera();
        this.keyboard = new Keyboard();
        this.shaderManager = new ShaderManager();
        this.lightManager = new LightManager();
        this.textureManager = new TextureManager();
        this.effectsManager = new EffectsManager();
        this.projectionMatrix = mat4.create();
        this.drawables = [];

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

        try {
            window.gl = canvas.getContext("experimental-webgl");
            window.gl.viewportWidth = this.canvas.width;
            window.gl.viewportHeight = this.canvas.height;
        }
        catch (e) {
            console.log(e);
        }

        if (!window.gl) {
            alert("Could not initialise WebGL");
        }

        this.shaderManager.init();
    }

    Scene.prototype = {
        getProjectionMatrix: function() {
            mat4.perspective(this.projectionMatrix, 45, window.gl.viewportWidth / window.gl.viewportHeight, 0.1, 100.0);
            return this.projectionMatrix;
        },
        addDrawable: function(drawable) {
            this.drawables.push(drawable);
        },
        addPointLight: function(light) {
            this.lightManager.addPointLight(light);
        },
        loadTextures: function(textureList) {
            this.textureManager.init(textureList);
        },
        getTexture: function(name) {
            return this.textureManager.getTexture(name);
        },
        getCamera: function() {
            return this.camera;
        },
        getTextureManager: function() {
            return this.textureManager;
        },
        bindKey: function(keyCode, handler, action) {
            this.keyboard.bind(keyCode, handler, action);
        },
        draw: function() {
            window.gl.clearColor(0.0, 0.0, 0.0, 1.0);
            window.gl.enable(window.gl.DEPTH_TEST);
            window.gl.viewport(0, 0, window.gl.viewportWidth, window.gl.viewportHeight);
            window.gl.clear(window.gl.COLOR_BUFFER_BIT | window.gl.DEPTH_BUFFER_BIT);

            this.keyboard.handle();

            this.lightManager.draw(this.shaderManager);
            this.effectsManager.draw(this.shaderManager);
            this.drawables.forEach(function(drawable) {
                drawable.draw(this.shaderManager, this.textureManager, this.camera.getViewMatrix(), this.getProjectionMatrix());
            }.bind(this));
        },
        run: function() {
            var self = this;
            function tick() {
                requestAnimFrame(tick);
                self.draw();
            }
            tick();
        }
    };

    function ShaderManager() {
        this.program = {};
        this.attributes = {};
        this.uniforms = {};
    }

    ShaderManager.prototype = {
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
                shader = window.gl.createShader(window.gl.FRAGMENT_SHADER);
            } else if (shaderScript.type == "x-shader/x-vertex") {
                shader = window.gl.createShader(window.gl.VERTEX_SHADER);
            } else {
                return null;
            }

            window.gl.shaderSource(shader, str);
            window.gl.compileShader(shader);

            if (!window.gl.getShaderParameter(shader, window.gl.COMPILE_STATUS)) {
                alert(window.gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;
        },

        createShaders: function() {
            var fragmentShader = this.getShaderSource("shader-fs");
            var vertexShader = this.getShaderSource("shader-vs");

            this.program = window.gl.createProgram();
            window.gl.attachShader(this.program, vertexShader);
            window.gl.attachShader(this.program, fragmentShader);
            window.gl.linkProgram(this.program);

            if (!window.gl.getProgramParameter(this.program, window.gl.LINK_STATUS)) {
                alert("Could not initialise shaders");
            }

            window.gl.useProgram(this.program);
        },

        bindAttribute: function(name) {
            this.attributes[name] = window.gl.getAttribLocation(this.program, name);
            window.gl.enableVertexAttribArray(this.attributes[name]);
        },

        bindUniform: function(name) {
            this.uniforms[name] = window.gl.getUniformLocation(this.program, name);
        },
        getAttribute: function(name) {
            return this.attributes[name];
        },
        getUniform: function(name) {
            return this.uniforms[name];
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
            this.bindUniform("uUseFog");
            this.bindUniform("uFogColor");
            this.bindUniform("uFogMinDistance");
            this.bindUniform("uFogMaxDistance");
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

    function EffectsManager() {
        this.useFog = true;
        this.fogColor = vec3.fromValues(1.0, 1.0, 1.0);
        this.fogMinDistance = 5.0;
        this.fogMaxDistance = 100.0;
        
    }

    EffectsManager.prototype = {
        draw: function(shaderManager) {
            window.gl.uniform1i(shaderManager.getUniform("uUseFog"), this.useFog);
            window.gl.uniform1f(shaderManager.getUniform("uFogMinDistance"), this.fogMinDistance);
            window.gl.uniform1f(shaderManager.getUniform("uFogMaxDistance"), this.fogMaxDistance);
            window.gl.uniform3fv(shaderManager.getUniform("uFogColor"), this.fogColor);
        }
    };

    function TextureManager() {
        this.filter = 0;
        this.textures = {};
    }

    TextureManager.prototype = {
        addTexture: function(name, src) {
            this.textures[name] = new Texture(src);
        },
        getTexture: function(name) {
            return this.textures[name].getVersion(this.filter);
        },
        setFilter0: function() {
            this.filter = 0;
        },
        setFilter1: function() {
            this.filter = 1;
        },
        setFilter2: function() {
            this.filter = 2;
        },
        init: function(textures) {
            textures.forEach(function(textureInfo) {
                this.addTexture(textureInfo[0], textureInfo[1]);
            }.bind(this));
        }
    };

    function Texture(src) {
        this.versions = [];

        var i;
        var image = new Image();

        for (i=0; i < 3; i++) {
            var texture = window.gl.createTexture();
            texture.image = image;
            this.versions.push(texture);
        }

        image.onload = function () {
            handleLoaded(this.versions);
        }.bind(this);
        image.src = src;

        function handleLoaded(textureVersions) {
            window.gl.pixelStorei(window.gl.UNPACK_FLIP_Y_WEBGL, true);

            window.gl.bindTexture(window.gl.TEXTURE_2D, textureVersions[0]);
            window.gl.texImage2D(window.gl.TEXTURE_2D, 0, window.gl.RGBA, window.gl.RGBA, window.gl.UNSIGNED_BYTE, textureVersions[0].image);
            window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_MIN_FILTER, window.gl.NEAREST);

            window.gl.bindTexture(window.gl.TEXTURE_2D, textureVersions[1]);
            window.gl.texImage2D(window.gl.TEXTURE_2D, 0, window.gl.RGBA, window.gl.RGBA, window.gl.UNSIGNED_BYTE, textureVersions[1].image);
            window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_MAG_FILTER, window.gl.LINEAR);
            window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_MIN_FILTER, window.gl.LINEAR);

            window.gl.bindTexture(window.gl.TEXTURE_2D, textureVersions[2]);
            window.gl.texImage2D(window.gl.TEXTURE_2D, 0, window.gl.RGBA, window.gl.RGBA, window.gl.UNSIGNED_BYTE, textureVersions[2].image);
            window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_MAG_FILTER, window.gl.LINEAR);
            window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_MIN_FILTER, window.gl.LINEAR_MIPMAP_NEAREST);
            window.gl.generateMipmap(window.gl.TEXTURE_2D);

            window.gl.bindTexture(window.gl.TEXTURE_2D, null);
        }
    }

    Texture.prototype = {
        getVersion: function(filter) {
            return this.versions[filter];
        }
    };

    function Camera() {
        this.viewMatrix = mat4.create();
        this.position = vec3.fromValues(0.0, 0.0, 10.0);
        this.tangent = vec3.fromValues(1.0, 0.0, 0.0);
        this.forward = vec3.fromValues(0.0, 0.0, 1.0);
        this.up = vec3.fromValues(0.0, 1.0, 0.0);
        this.translateStep = 0.1;
        this.rotateStep = Math.PI / 180;
        this.pitchAngle = 0.0;
        this.yawAngle = 0.0;
        this.boundaries = {
            lower: vec3.fromValues(-1.0, -1.0, -1.0),
            upper: vec3.fromValues(1.0, 1.0, 1.0),
            epsilon: 0.1
        }
    }

    Camera.prototype = {
        setPosition: function(position) {
            this.position = position;
        },
        serBoundaries: function(lower, upper) {
            this.boundaries = {
                lower: lower,
                upper: upper
            }
        },
        clamp: function(out, position, lower, upper) {
            for(var i = 0; i < position.length; i++) {
                out[i] = position[i] < lower[i] ? lower[i] : (position[i] > upper[i] ? upper[i] : position[i]);
            }
        },
        getViewMatrix: function() {
            var rotationMatrix = mat4.create();
            var direction = vec3.fromValues(0.0, 0.0, -1.0);
            var tangent = vec3.fromValues(1.0, 0.0, 0.0);
            var forward = vec3.fromValues(0.0, 0.0, 1.0);
            var up = vec3.fromValues(0.0, 1.0, 0.0);
            mat4.rotateX(rotationMatrix, rotationMatrix, this.pitchAngle);
            vec3.transformMat4(direction, direction, rotationMatrix);
            vec3.transformMat4(forward, forward, rotationMatrix);
            vec3.transformMat4(tangent, tangent, rotationMatrix);
            vec3.transformMat4(up, up, rotationMatrix);
            mat4.identity(rotationMatrix);
            mat4.rotateY(rotationMatrix, rotationMatrix, this.yawAngle);
            vec3.transformMat4(direction, direction, rotationMatrix);
            vec3.transformMat4(forward, forward, rotationMatrix);
            vec3.transformMat4(tangent, tangent, rotationMatrix);
            vec3.transformMat4(up, up, rotationMatrix);
            this.tangent = tangent;
            this.forward = forward;
            this.up = up;
            vec3.add(direction, direction, this.position, up);

            mat4.lookAt(this.viewMatrix, this.position, direction, up);
            return this.viewMatrix;
        },
        moveForward: function() {
            var forward = vec3.create();
            vec3.scale(forward, this.forward, -this.translateStep);
            vec3.add(this.position, this.position, forward);
            this.clamp(this.position, this.position, this.boundaries.lower, this.boundaries.upper);
        },
        moveBackward: function() {
            var forward = vec3.create();
            vec3.scale(forward, this.forward, this.translateStep);
            vec3.add(this.position, this.position, forward);
            this.clamp(this.position, this.position, this.boundaries.lower, this.boundaries.upper);
        },
        moveLeft: function() {
            var tangent = vec3.create();
            vec3.scale(tangent, this.tangent, -this.translateStep);
            vec3.add(this.position, this.position, tangent);
            this.clamp(this.position, this.position, this.boundaries.lower, this.boundaries.upper);
        },
        moveRight: function() {
            var tangent = vec3.create();
            vec3.scale(tangent, this.tangent, this.translateStep);
            vec3.add(this.position, this.position, tangent);
            this.clamp(this.position, this.position, this.boundaries.lower, this.boundaries.upper);
        },
        moveUp: function() {
            var up = vec3.create();
            vec3.scale(up, this.up, this.translateStep);
            vec3.add(this.position, this.position, up);
            this.clamp(this.position, this.position, this.boundaries.lower, this.boundaries.upper);
        },
        moveDown: function() {
            var up = vec3.create();
            vec3.scale(up, this.up, -this.translateStep);
            vec3.add(this.position, this.position, up);
            this.clamp(this.position, this.position, this.boundaries.lower, this.boundaries.upper);
        },
        rotatePitchMinus: function() {
            this.pitchAngle -= this.rotateStep;
        },
        rotatePitchPlus: function() {
            this.pitchAngle += this.rotateStep;
        },
        rotateYawMinus: function() {
            this.yawAngle += this.rotateStep;
        },
        rotateYawPlus: function() {
            this.yawAngle -= this.rotateStep;
        }
    };

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

    function Keyboard() {
        var pressedKeys = {};
        this.actions = {};
        function handleKeyDown(event) {
            pressedKeys[event.keyCode] = true;
        }
        function handleKeyUp(event) {
            pressedKeys[event.keyCode] = false;
        }
        document.onkeydown = handleKeyDown;
        document.onkeyup = handleKeyUp;
        this.pressedKeys = pressedKeys;
    }

    Keyboard.prototype = {
        bind: function(keyCode, handler, action) {
            this.actions[keyCode] = {
                handler: handler,
                action: action
            };
        },
        handle: function() {
            for(var key in this.actions) {
                if (this.actions.hasOwnProperty(key) && this.pressedKeys[key]) {
                    this.actions[key].action.call(this.actions[key].handler);
                }
            }
        }
    };

    function Cube() {
        return {
            vertex: {
                array: [
                    // Front face
                    -1.0, -1.0, 1.0,
                    1.0, -1.0, 1.0,
                    1.0, 1.0, 1.0,
                    -1.0, 1.0, 1.0,

                    // Back face
                    -1.0, -1.0, -1.0,
                    -1.0, 1.0, -1.0,
                    1.0, 1.0, -1.0,
                    1.0, -1.0, -1.0,

                    // Top face
                    -1.0, 1.0, -1.0,
                    -1.0, 1.0, 1.0,
                    1.0, 1.0, 1.0,
                    1.0, 1.0, -1.0,

                    // Bottom face
                    -1.0, -1.0, -1.0,
                    1.0, -1.0, -1.0,
                    1.0, -1.0, 1.0,
                    -1.0, -1.0, 1.0,

                    // Right face
                    1.0, -1.0, -1.0,
                    1.0, 1.0, -1.0,
                    1.0, 1.0, 1.0,
                    1.0, -1.0, 1.0,

                    // Left face
                    -1.0, -1.0, -1.0,
                    -1.0, -1.0, 1.0,
                    -1.0, 1.0, 1.0,
                    -1.0, 1.0, -1.0
                ],
                itemSize: 3
            },
            normal: {
                array: [
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
                ],
                itemSize: 3
            },
            texture: {
                array: [
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
                ],
                itemSize: 2
            },
            index: {
                array: [
                    0, 1, 2,      0, 2, 3,    // Front face
                    4, 5, 6,      4, 6, 7,    // Back face
                    8, 9, 10,     8, 10, 11,  // Top face
                    12, 13, 14,   12, 14, 15, // Bottom face
                    16, 17, 18,   16, 18, 19, // Right face
                    20, 21, 22,   20, 22, 23  // Left face
                ],
                numItems: 36
            }
        }
    }

    function Rectangle() {
        return {
            vertex: {
                array: [
                    -1.0, -1.0, 0.0,
                    -1.0, 1.0, 0.0,
                    1.0, 1.0, 0.0,
                    1.0, -1.0, 0.0
                ],
                itemSize: 3
            },
            normal: {
                array: [
                    0.0, 0.0, 1.0,
                    0.0, 0.0, 1.0,
                    0.0, 0.0, 1.0,
                    0.0, 0.0, 1.0
                ],
                itemSize: 3
            },
            texture: {
                array: [
                    0.0, 0.0,
                    0.0, 1.0,
                    1.0, 1.0,
                    1.0, 0.0
                ],
                itemSize: 2
            },
            index: {
                array: [
                    0, 1, 2, 0, 2, 3
                ],
                numItems: 6
            }
        }
    }

    function Drawable(Primitive) {
        this.primitive = Primitive();
        this.buffers = {
            vertex: {
                buffer: window.gl.createBuffer(),
                itemSize: this.primitive.vertex.itemSize
            },
            normal: {
                buffer: window.gl.createBuffer(),
                itemSize: this.primitive.normal.itemSize
            },
            texture: {
                buffer: window.gl.createBuffer(),
                itemSize: this.primitive.texture.itemSize
            },
            index: {
                buffer: window.gl.createBuffer(),
                numItems: this.primitive.index.numItems
            }
        };
        this.color = null;
        this.textures = [];
        this.modelMatrix = mat4.create();
        mat4.identity(this.modelMatrix);

        window.gl.bindBuffer(window.gl.ARRAY_BUFFER, this.buffers.vertex.buffer);
        window.gl.bufferData(window.gl.ARRAY_BUFFER, new Float32Array(this.primitive.vertex.array), window.gl.STATIC_DRAW);
        window.gl.bindBuffer(window.gl.ARRAY_BUFFER, this.buffers.normal.buffer);
        window.gl.bufferData(window.gl.ARRAY_BUFFER, new Float32Array(this.primitive.normal.array), window.gl.STATIC_DRAW);
        window.gl.bindBuffer(window.gl.ARRAY_BUFFER, this.buffers.texture.buffer);
        window.gl.bufferData(window.gl.ARRAY_BUFFER, new Float32Array(this.primitive.texture.array), window.gl.STATIC_DRAW);
        window.gl.bindBuffer(window.gl.ELEMENT_ARRAY_BUFFER, this.buffers.index.buffer);
        window.gl.bufferData(window.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.primitive.index.array), window.gl.STATIC_DRAW);
    }

    Drawable.prototype = {
        addTexture: function(activeId, textureName) {
            this.textures.push({
                activeId: activeId,
                textureName: textureName
            })
        },
        setTexture: function(activeId, textureName) {
            for (var i = 0; i < this.textures.length; i++) {
                if(this.textures[i].activeId == activeId) {
                    this.textures[i].textureName = textureName;
                    return;
                }
            }
        },
        setColor: function(color) {
            this.color = color;
        },
        getNormalMatrix: function() {
            var normalMatrix = mat3.create();
            mat3.fromMat4(normalMatrix, this.modelMatrix);
            mat3.invert(normalMatrix, normalMatrix);
            mat3.transpose(normalMatrix, normalMatrix);
            return normalMatrix;
        },
        getModelMatrix: function() {
            return this.modelMatrix;
        },
        transform: function(transformation, value) {
            transformation(this.modelMatrix, this.modelMatrix, value);
        },
        draw: function(shaderManager, textureManager, viewMatrix, projectionMatrix) {

            window.gl.bindBuffer(window.gl.ARRAY_BUFFER, this.buffers.vertex.buffer);
            window.gl.vertexAttribPointer(shaderManager.getAttribute("aVertexPosition"), this.buffers.vertex.itemSize, window.gl.FLOAT, false, 0, 0);

            window.gl.bindBuffer(window.gl.ARRAY_BUFFER, this.buffers.normal.buffer);
            window.gl.vertexAttribPointer(shaderManager.getAttribute("aVertexNormal"), this.buffers.normal.itemSize, window.gl.FLOAT, false, 0, 0);

            window.gl.bindBuffer(window.gl.ARRAY_BUFFER, this.buffers.texture.buffer);
            window.gl.vertexAttribPointer(shaderManager.getAttribute("aTextureCoord"), this.buffers.texture.itemSize, window.gl.FLOAT, false, 0, 0);

            if (this.color) {
                window.gl.uniform3fv(shaderManager.getUniform("uColor"), this.color);
                window.gl.uniform1i(shaderManager.getUniform("texturesCount"), 0);
            } else if (this.textures.length > 0) {
                var i = 0;
                this.textures.forEach(function (textureInfo) {
                    window.gl.uniform1i(shaderManager.getUniform("texturesCount"), i + 1);
                    window.gl.activeTexture(textureInfo.activeId);
                    window.gl.bindTexture(window.gl.TEXTURE_2D, textureManager.getTexture(textureInfo.textureName));
                    shaderManager.bindUniform("textureSamplers[" + i + "]");
                    window.gl.uniform1i(shaderManager.getUniform("textureSamplers[" + i + "]"), i++);
                });
            }

            var normalMatrix = this.getNormalMatrix();
            window.gl.uniformMatrix4fv(shaderManager.getUniform("uModelMatrix"), false, this.modelMatrix);
            window.gl.uniformMatrix4fv(shaderManager.getUniform("uViewMatrix"), false, viewMatrix);
            window.gl.uniformMatrix4fv(shaderManager.getUniform("uProjectionMatrix"), false, projectionMatrix);
            window.gl.uniformMatrix3fv(shaderManager.getUniform("uNormalMatrix"), false, normalMatrix);

            if (this.buffers.index) {
                window.gl.bindBuffer(window.gl.ELEMENT_ARRAY_BUFFER, this.buffers.index.buffer);
                window.gl.drawElements(window.gl.TRIANGLES, this.buffers.index.numItems, window.gl.UNSIGNED_SHORT, 0);
            }
        }
    };

    function LightManager() {
        this.directionalLights = [];
        this.pointLights = [];
        this.spotLights = [];
    }

    LightManager.prototype = {
        addPointLight: function(options) {
            var index = this.pointLights.length;
            this.pointLights.push(new PointLight(index, options));
        },
        draw: function(shaderManager) {
            window.gl.uniform1i(shaderManager.getUniform("directionalLightsCount"), this.directionalLights.length);
            window.gl.uniform1i(shaderManager.getUniform("pointLightsCount"), this.pointLights.length);
            window.gl.uniform1i(shaderManager.getUniform("spotLightsCount"), this.spotLights.length);

            this.pointLights.forEach(function(pointLight) {
                pointLight.draw(shaderManager);
            });
        }
    };

    function PointLight(index, options) {
        options = options || {};
        this.index = index;
        this.position = options.position || vec3.fromValues(0.0, 0.0, 1.0);
        this.diffuseColor = options.diffuseColor || vec3.fromValues(0.1, 0.1, 0.1);
        this.ambientColor = options.ambientColor || vec3.fromValues(0.8, 0.8, 0.8);
        this.constantAttenuation = options.constantAttenuation || 1;
        this.linearAttenuation = options.linearAttenuation || 0;
        this.exponentAttenuation = options.exponentAttenuation || 0;
    }

    PointLight.prototype = {
        draw: function(shaderManager) {
            window.gl.uniform3fv(shaderManager.getUniform("pointLights[" + this.index + "].position"), this.position);
            window.gl.uniform3fv(shaderManager.getUniform("pointLights[" + this.index + "].diffuseColor"), this.diffuseColor);
            window.gl.uniform3fv(shaderManager.getUniform("pointLights[" + this.index + "].ambientColor"), this.ambientColor);
            window.gl.uniform1f(shaderManager.getUniform("pointLights[" + this.index + "].constantAttenuation"), this.constantAttenuation);
            window.gl.uniform1f(shaderManager.getUniform("pointLights[" + this.index + "].linearAttenuation"), this.linearAttenuation);
            window.gl.uniform1f(shaderManager.getUniform("pointLights[" + this.index + "].exponentAttenuation"), this.exponentAttenuation);
        }
    };

    var canvas = document.getElementById("scene");
    canvas.width = $(document).innerWidth();
    canvas.height = $(document).innerHeight();

    var scene = new Scene(canvas);
    scene.loadTextures([
        ["crowd", "images/crowd.jpg"],
        ["ceiling", "images/ceiling.jpg"],
        ["floor_1", "images/floor_1.jpg"],
        ["floor_2", "images/floor_2.jpg"],
        ["signs", "images/signs.jpg"]
    ]);

    scene.getCamera().serBoundaries(vec3.fromValues(-20.0, -4.0, -20.0), vec3.fromValues(20.0, 4.0, 20.0));

    scene.bindKey(Keys.UpArrow, scene.getCamera(), scene.getCamera().moveForward);
    scene.bindKey(Keys.DownArrow, scene.getCamera(), scene.getCamera().moveBackward);
    scene.bindKey(Keys.LeftArrow, scene.getCamera(), scene.getCamera().moveLeft);
    scene.bindKey(Keys.RightArrow, scene.getCamera(), scene.getCamera().moveRight);
    scene.bindKey(Keys.PageUp, scene.getCamera(), scene.getCamera().moveUp);
    scene.bindKey(Keys.PageDown, scene.getCamera(), scene.getCamera().moveDown);
    scene.bindKey(Keys.S, scene.getCamera(), scene.getCamera().rotatePitchMinus);
    scene.bindKey(Keys.W, scene.getCamera(), scene.getCamera().rotatePitchPlus);
    scene.bindKey(Keys.A, scene.getCamera(), scene.getCamera().rotateYawMinus);
    scene.bindKey(Keys.D, scene.getCamera(), scene.getCamera().rotateYawPlus);
    scene.bindKey(Keys.F, scene.getTextureManager(), scene.getTextureManager().setFilter0);
    scene.bindKey(Keys.G, scene.getTextureManager(), scene.getTextureManager().setFilter1);
    scene.bindKey(Keys.H, scene.getTextureManager(), scene.getTextureManager().setFilter2);

    var wall1 = new Drawable(Rectangle);
    wall1.addTexture(window.gl.TEXTURE0, "crowd");
    wall1.transform(mat4.scale, vec3.fromValues(20.0, 4.0, 20.0));
    wall1.transform(mat4.translate, vec3.fromValues(0.0, 0.0, -1.0));
    scene.addDrawable(wall1);

    var wall2 = new Drawable(Rectangle);
    wall2.addTexture(window.gl.TEXTURE0, "crowd");
    wall2.transform(mat4.rotateY, -90 * Math.PI / 180);
    wall2.transform(mat4.scale, vec3.fromValues(20.0, 4.0, 20.0));
    wall2.transform(mat4.translate, vec3.fromValues(0.0, 0.0, -1.0));
    scene.addDrawable(wall2);

    var wall3 = new Drawable(Rectangle);
    wall3.addTexture(window.gl.TEXTURE0, "crowd");
    wall3.transform(mat4.rotateY, 90 * Math.PI / 180);
    wall3.transform(mat4.scale, vec3.fromValues(20.0, 4.0, 20.0));
    wall3.transform(mat4.translate, vec3.fromValues(0.0, 0.0, -1.0));
    scene.addDrawable(wall3);

    var wall4 = new Drawable(Rectangle);
    wall4.addTexture(window.gl.TEXTURE0, "crowd");
    wall4.transform(mat4.scale, vec3.fromValues(20.0, 4.0, 20.0));
    wall4.transform(mat4.translate, vec3.fromValues(0.0, 0.0, 1.0));
    scene.addDrawable(wall4);

    var floor = new Drawable(Rectangle);
    floor.addTexture(window.gl.TEXTURE0, "floor_1");
    floor.addTexture(window.gl.TEXTURE1, "signs");
    floor.transform(mat4.translate, vec3.fromValues(0.0, -4.0, 0.0));
    floor.transform(mat4.rotateX, 90 * Math.PI / 180);
    floor.transform(mat4.scale, vec3.fromValues(20.0, 20.0, 1.0));
    scene.addDrawable(floor);
    scene.bindKey(Keys.Z, this, function() { floor.setTexture(window.gl.TEXTURE0, "floor_1"); });
    scene.bindKey(Keys.X, this, function() { floor.setTexture(window.gl.TEXTURE0, "floor_2"); });

    var ceiling = new Drawable(Rectangle);
    ceiling.setColor(vec3.fromValues(0.7, 0.7, 0.7));
    ceiling.transform(mat4.translate, vec3.fromValues(0.0, 4.0, 0.0));
    ceiling.transform(mat4.rotateX, 90 * Math.PI / 180);
    ceiling.transform(mat4.scale, vec3.fromValues(20.0, 20.0, 1.0));
    scene.addDrawable(ceiling);

    var pole1 = new Drawable(Cube);
    pole1.setColor(vec3.fromValues(1.0, 1.0, 1.0));
    pole1.transform(mat4.translate, vec3.fromValues(7.0, -2.0, 0.0));
    pole1.transform(mat4.scale, vec3.fromValues(0.1, 2.0, 0.1));
    scene.addDrawable(pole1);

    var pole2 = new Drawable(Cube);
    pole2.setColor(vec3.fromValues(1.0, 1.0, 1.0));
    pole2.transform(mat4.translate, vec3.fromValues(-7.0, -2.0, 0.0));
    pole2.transform(mat4.scale, vec3.fromValues(0.1, 2.0, 0.1));
    scene.addDrawable(pole2);

    var net = new Drawable(Rectangle);
    net.setColor(vec3.fromValues(1.0, 1.0, 1.0));
    net.transform(mat4.translate, vec3.fromValues(0.0, -1.25, 0.0));
    net.transform(mat4.scale, vec3.fromValues(7.0, 1.0, 1.0));
    scene.addDrawable(net);

    scene.addPointLight();

    scene.run();
});