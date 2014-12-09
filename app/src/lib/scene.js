var mat4 = require("gl-matrix").mat4;

var Camera = require("./camera");
var Keyboard = require("./keyboard");
var ShaderManager = require("./shader-manager");
var LightManager = require("./light-manager");
var TextureManager = require("./texture-manager");
var EffectsManager = require("./effects-manager");
var Primitives = require("./primitives");
var Drawable = require("./drawable");

function Scene(canvas) {
    this.canvas = canvas;

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
        window.gl = canvas.getContext("experimental-webgl", { antialias: true });
        window.gl.viewportWidth = this.canvas.width;
        window.gl.viewportHeight = this.canvas.height;
    }
    catch (e) {
        console.log(e);
    }

    if (!window.gl) {
        alert("Could not initialise WebGL");
    }

    this.camera = new Camera();
    this.telebim = new Camera();
    this.keyboard = new Keyboard();
    this.shaderManager = new ShaderManager();
    this.lightManager = new LightManager();
    this.textureManager = new TextureManager();
    this.effectsManager = new EffectsManager();

    this.projectionMatrix = mat4.create();
    this.drawables = [];
    this.renderables = [];
    this.callables = [];

    this.shaderManager.init();
}

Scene.Drawable = Drawable;
Scene.Primitives = Primitives;
Scene.Keyboard = Keyboard;
Scene.LightManager = LightManager;

Scene.prototype = {
    getProjectionMatrix: function() {
        mat4.perspective(this.projectionMatrix, 45, window.gl.viewportWidth / window.gl.viewportHeight, 0.1, 100.0);
        return this.projectionMatrix;
    },
    addDrawable: function(drawable) {
        this.drawables.push(drawable);
    },
    addRenderable: function(renderable) {
        this.renderables.push(renderable);
    },
    addCallable: function(func, context) {
        this.callables.push({
            func: func,
            context: context
        });
    },
    addPointLight: function(light) {
        this.lightManager.addPointLight(light);
    },
    addSpotLight: function(light) {
        this.lightManager.addSpotLight(light);
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
    getTelebim: function() {
        return this.telebim;
    },
    getTextureManager: function() {
        return this.textureManager;
    },
    getEffectsManager: function() {
        return this.effectsManager;
    },
    bindKey: function(keyCode, handler, action) {
        this.keyboard.bind(keyCode, handler, action);
    },
    draw: function() {
        this.textureManager.render(this.render, this);

        window.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        window.gl.disable(window.gl.DEPTH_TEST);
        window.gl.enable(window.gl.BLEND);
        window.gl.viewport(0, 0, window.gl.viewportWidth, window.gl.viewportHeight);
        window.gl.clear(window.gl.COLOR_BUFFER_BIT | window.gl.DEPTH_BUFFER_BIT);

        this.keyboard.handle();

        this.lightManager.draw(this.shaderManager);
        this.effectsManager.draw(this.shaderManager);
        this.drawables.forEach(function(drawable) {
            drawable.draw(this.shaderManager, this.textureManager, this.camera.getViewMatrix(), this.getProjectionMatrix());
        }.bind(this));
        this.callables.forEach(function(callable) {
            callable.func.call(callable.context);
        });
    },
    render: function() {
        window.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        window.gl.disable(window.gl.DEPTH_TEST);
        window.gl.enable(window.gl.BLEND);
        window.gl.blendFunc(window.gl.SRC_ALPHA, window.gl.ONE);
        window.gl.viewport(0, 0, this.textureManager.renderFramebuffer.width, this.textureManager.renderFramebuffer.height);
        window.gl.clear(window.gl.COLOR_BUFFER_BIT | window.gl.DEPTH_BUFFER_BIT);

        this.lightManager.draw(this.shaderManager);
        this.effectsManager.draw(this.shaderManager);
        this.renderables.forEach(function(renderable) {
            renderable.draw(this.shaderManager, this.textureManager, this.telebim.getViewMatrix(), this.getProjectionMatrix());
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

module.exports = Scene;