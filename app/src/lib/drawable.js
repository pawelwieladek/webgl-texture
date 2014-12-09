var mat4 = require("gl-matrix").mat4;
var mat3 = require("gl-matrix").mat3;
var vec3 = require("gl-matrix").vec3;
var vec2 = require("gl-matrix").vec2;

function Drawable(PrimitiveDefinition) {
    this.primitive = PrimitiveDefinition();
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
    this.useLight = true;
    this.color = null;
    this.textures = [];
    this.modelMatrix = mat4.create();
    this.textureMatrix = mat3.create();
    this.textureScale = 1.0;
    this.textureScaleStep = 0.02;
    this.textureScalingEnabled = false;

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
    setLight: function(useLight) {
        this.useLight = useLight;
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
    getTextureMatrix: function() {
        return this.textureMatrix;
    },
    transform: function(transformation, value) {
        transformation(this.modelMatrix, this.modelMatrix, value);
    },
    shrinkTexture: function() {
        if(this.textureScale + this.textureScaleStep <= 1.0) {
            this.textureScale += this.textureScaleStep;
        }
    },
    enlargeTexture: function() {
        if(this.textureScale - this.textureScaleStep >= 0.0) {
            this.textureScale -= this.textureScaleStep;
        }
    },
    enableTextureScaling: function() {
        this.textureScalingEnabled = true;
    },
    draw: function(shaderManager, textureManager, viewMatrix, projectionMatrix) {

        window.gl.bindBuffer(window.gl.ARRAY_BUFFER, this.buffers.vertex.buffer);
        window.gl.vertexAttribPointer(shaderManager.getAttribute("aVertexPosition"), this.buffers.vertex.itemSize, window.gl.FLOAT, false, 0, 0);

        window.gl.bindBuffer(window.gl.ARRAY_BUFFER, this.buffers.normal.buffer);
        window.gl.vertexAttribPointer(shaderManager.getAttribute("aVertexNormal"), this.buffers.normal.itemSize, window.gl.FLOAT, false, 0, 0);

        window.gl.bindBuffer(window.gl.ARRAY_BUFFER, this.buffers.texture.buffer);
        window.gl.vertexAttribPointer(shaderManager.getAttribute("aTextureCoord"), this.buffers.texture.itemSize, window.gl.FLOAT, false, 0, 0);

        window.gl.uniform1i(shaderManager.getUniform("uUseLight"), this.useLight);

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

        if(this.textureScalingEnabled) {
            var textureMatrix = mat3.clone(this.textureMatrix);
            mat3.scale(textureMatrix, this.textureMatrix, vec3.fromValues(this.textureScale, this.textureScale, 1.0));
            mat3.translate(textureMatrix, textureMatrix, vec3.fromValues(-0.5, -0.5, 0.0));
            mat3.translate(textureMatrix, textureMatrix, vec3.fromValues(0.5 / this.textureScale, 0.5 / this.textureScale, 0.0));
            window.gl.uniformMatrix3fv(shaderManager.getUniform("uTextureMatrix"), false, textureMatrix);
        } else {
            window.gl.uniformMatrix3fv(shaderManager.getUniform("uTextureMatrix"), false, this.textureMatrix);
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

module.exports = Drawable;