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
        window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_WRAP_S, window.gl.CLAMP_TO_EDGE);
        window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_WRAP_T, window.gl.CLAMP_TO_EDGE);

        window.gl.bindTexture(window.gl.TEXTURE_2D, textureVersions[1]);
        window.gl.texImage2D(window.gl.TEXTURE_2D, 0, window.gl.RGBA, window.gl.RGBA, window.gl.UNSIGNED_BYTE, textureVersions[1].image);
        window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_MAG_FILTER, window.gl.LINEAR);
        window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_MIN_FILTER, window.gl.LINEAR);
        window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_WRAP_S, window.gl.CLAMP_TO_EDGE);
        window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_WRAP_T, window.gl.CLAMP_TO_EDGE);

        window.gl.bindTexture(window.gl.TEXTURE_2D, textureVersions[2]);
        window.gl.texImage2D(window.gl.TEXTURE_2D, 0, window.gl.RGBA, window.gl.RGBA, window.gl.UNSIGNED_BYTE, textureVersions[2].image);
        window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_MAG_FILTER, window.gl.LINEAR);
        window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_MIN_FILTER, window.gl.LINEAR_MIPMAP_LINEAR);
        window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_WRAP_S, window.gl.CLAMP_TO_EDGE);
        window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_WRAP_T, window.gl.CLAMP_TO_EDGE);
        window.gl.generateMipmap(window.gl.TEXTURE_2D);

        window.gl.bindTexture(window.gl.TEXTURE_2D, null);
    }
}

Texture.prototype = {
    getVersion: function(filter) {
        return this.versions[filter];
    }
};

function TextureManager() {
    this.filter = 0;
    this.textures = {};
    this.renderFramebuffer = null;
    this.renderTexture = null;

    var initFrameBuffer = function() {
        this.renderFramebuffer = window.gl.createFramebuffer();
        window.gl.bindFramebuffer(window.gl.FRAMEBUFFER, this.renderFramebuffer);
        this.renderFramebuffer.width = 2048;
        this.renderFramebuffer.height = 512;

        this.renderTexture = window.gl.createTexture();
        window.gl.bindTexture(window.gl.TEXTURE_2D, this.renderTexture);
        window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_MAG_FILTER, window.gl.LINEAR);
        window.gl.texParameteri(window.gl.TEXTURE_2D, window.gl.TEXTURE_MIN_FILTER, window.gl.LINEAR_MIPMAP_NEAREST);
        window.gl.generateMipmap(window.gl.TEXTURE_2D);

        window.gl.texImage2D(window.gl.TEXTURE_2D, 0, window.gl.RGBA, this.renderFramebuffer.width, this.renderFramebuffer.height, 0, window.gl.RGBA, window.gl.UNSIGNED_BYTE, null);

        var renderBuffer = window.gl.createRenderbuffer();
        window.gl.bindRenderbuffer(window.gl.RENDERBUFFER, renderBuffer);
        window.gl.renderbufferStorage(window.gl.RENDERBUFFER, window.gl.DEPTH_COMPONENT16, this.renderFramebuffer.width, this.renderFramebuffer.height);

        window.gl.framebufferTexture2D(window.gl.FRAMEBUFFER, window.gl.COLOR_ATTACHMENT0, window.gl.TEXTURE_2D, this.renderTexture, 0);
        window.gl.framebufferRenderbuffer(window.gl.FRAMEBUFFER, window.gl.DEPTH_ATTACHMENT, window.gl.RENDERBUFFER, renderBuffer);

        window.gl.bindTexture(window.gl.TEXTURE_2D, null);
        window.gl.bindRenderbuffer(window.gl.RENDERBUFFER, null);
        window.gl.bindFramebuffer(window.gl.FRAMEBUFFER, null);
    }.bind(this);

    initFrameBuffer();
}

TextureManager.prototype = {
    addTexture: function(name, src) {
        this.textures[name] = new Texture(src);
    },
    getTexture: function(name) {
        if(name === "render_texture") {
            return this.renderTexture;
        } else {
            return this.textures[name].getVersion(this.filter);
        }
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
    },
    render: function(drawFunction, thisObject) {
        window.gl.bindFramebuffer(window.gl.FRAMEBUFFER, this.renderFramebuffer);

        drawFunction.call(thisObject);

        window.gl.bindTexture(window.gl.TEXTURE_2D, this.renderTexture);
        window.gl.generateMipmap(window.gl.TEXTURE_2D);
        window.gl.bindTexture(window.gl.TEXTURE_2D, null);

        window.gl.bindFramebuffer(window.gl.FRAMEBUFFER, null);
    }
};

TextureManager.Texture = Texture;

module.exports = TextureManager;