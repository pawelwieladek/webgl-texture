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
        this.bindUniform("uTextureMatrix");
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

module.exports = ShaderManager;