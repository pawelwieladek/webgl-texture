var $ = require("jquery");
var Scene = require("../lib/scene");
var vec3 = require("gl-matrix").vec3;
var mat4 = require("gl-matrix").mat4;
var mat3 = require("gl-matrix").mat3;
var vec2 = require("gl-matrix").vec2;

$(document).ready(function() {
    var canvas = document.getElementById("scene");
    canvas.width = $(document).innerWidth();
    canvas.height = $(document).innerHeight();

    var scene = new Scene(canvas);
    scene.loadTextures([
        ["crowd", "images/crowd.jpg"],
        ["ceiling", "images/ceiling.jpg"],
        ["floor_1", "images/floor_1.jpg"],
        ["floor_2", "images/floor_2.jpg"],
        ["signs", "images/signs.jpg"],
        ["poland", "images/poland.jpg"]
    ]);

    scene.getCamera().serBoundaries(vec3.fromValues(-20.0, -4.0, -20.0), vec3.fromValues(20.0, 4.0, 20.0));

    scene.bindKey(Scene.Keyboard.Keys.UpArrow, scene.getCamera(), scene.getCamera().moveForward);
    scene.bindKey(Scene.Keyboard.Keys.DownArrow, scene.getCamera(), scene.getCamera().moveBackward);
    scene.bindKey(Scene.Keyboard.Keys.LeftArrow, scene.getCamera(), scene.getCamera().moveLeft);
    scene.bindKey(Scene.Keyboard.Keys.RightArrow, scene.getCamera(), scene.getCamera().moveRight);
    scene.bindKey(Scene.Keyboard.Keys.PageUp, scene.getCamera(), scene.getCamera().moveUp);
    scene.bindKey(Scene.Keyboard.Keys.PageDown, scene.getCamera(), scene.getCamera().moveDown);
    scene.bindKey(Scene.Keyboard.Keys.S, scene.getCamera(), scene.getCamera().rotatePitchMinus);
    scene.bindKey(Scene.Keyboard.Keys.W, scene.getCamera(), scene.getCamera().rotatePitchPlus);
    scene.bindKey(Scene.Keyboard.Keys.A, scene.getCamera(), scene.getCamera().rotateYawMinus);
    scene.bindKey(Scene.Keyboard.Keys.D, scene.getCamera(), scene.getCamera().rotateYawPlus);
    scene.bindKey(Scene.Keyboard.Keys.F, scene.getTextureManager(), scene.getTextureManager().setFilter0);
    scene.bindKey(Scene.Keyboard.Keys.G, scene.getTextureManager(), scene.getTextureManager().setFilter1);
    scene.bindKey(Scene.Keyboard.Keys.H, scene.getTextureManager(), scene.getTextureManager().setFilter2);
    scene.bindKey(Scene.Keyboard.Keys.L, scene.getEffectsManager(), scene.getEffectsManager().increaseFogMinDistance);
    scene.bindKey(Scene.Keyboard.Keys.K, scene.getEffectsManager(), scene.getEffectsManager().decreaseFogMinDistance);
    scene.bindKey(Scene.Keyboard.Keys.P, scene.getEffectsManager(), scene.getEffectsManager().increaseFogMaxDistance);
    scene.bindKey(Scene.Keyboard.Keys.O, scene.getEffectsManager(), scene.getEffectsManager().decreaseFogMaxDistance);

    var wall1 = new Scene.Drawable(Scene.Primitives.Rectangle);
    wall1.addTexture(window.gl.TEXTURE0, "crowd");
    wall1.transform(mat4.scale, vec3.fromValues(20.0, 4.0, 20.0));
    wall1.transform(mat4.translate, vec3.fromValues(0.0, 0.0, -1.0));
    scene.addDrawable(wall1);

    var wallPanel = new Scene.Drawable(Scene.Primitives.Rectangle);
    wallPanel.addTexture(window.gl.TEXTURE0, "poland");
    wallPanel.transform(mat4.rotateY, -90 * Math.PI / 180);
    wallPanel.transform(mat4.scale, vec3.fromValues(20.0, 4.0, 20.0));
    wallPanel.transform(mat4.translate, vec3.fromValues(0.0, 0.0, -1.0));
    wallPanel.enableTextureScaling();
    scene.bindKey(Scene.Keyboard.Keys.C, this, function() { wallPanel.shrinkTexture(); });
    scene.bindKey(Scene.Keyboard.Keys.V, this, function() { wallPanel.enlargeTexture(); });
    scene.addDrawable(wallPanel);

    var wall3 = new Scene.Drawable(Scene.Primitives.Rectangle);
    wall3.addTexture(window.gl.TEXTURE0, "crowd");
    wall3.transform(mat4.rotateY, 90 * Math.PI / 180);
    wall3.transform(mat4.scale, vec3.fromValues(20.0, 4.0, 20.0));
    wall3.transform(mat4.translate, vec3.fromValues(0.0, 0.0, -1.0));
    scene.addDrawable(wall3);

    var wall4 = new Scene.Drawable(Scene.Primitives.Rectangle);
    wall4.addTexture(window.gl.TEXTURE0, "crowd");
    wall4.transform(mat4.scale, vec3.fromValues(20.0, 4.0, 20.0));
    wall4.transform(mat4.translate, vec3.fromValues(0.0, 0.0, 1.0));
    scene.addDrawable(wall4);

    var floor = new Scene.Drawable(Scene.Primitives.Rectangle);
    floor.addTexture(window.gl.TEXTURE0, "floor_1");
    floor.addTexture(window.gl.TEXTURE1, "signs");
    floor.transform(mat4.translate, vec3.fromValues(0.0, -4.0, 0.0));
    floor.transform(mat4.rotateX, 90 * Math.PI / 180);
    floor.transform(mat4.scale, vec3.fromValues(20.0, 20.0, 1.0));
    scene.addDrawable(floor);
    scene.bindKey(Scene.Keyboard.Keys.Z, this, function() { floor.setTexture(window.gl.TEXTURE0, "floor_1"); });
    scene.bindKey(Scene.Keyboard.Keys.X, this, function() { floor.setTexture(window.gl.TEXTURE0, "floor_2"); });

    var ceiling = new Scene.Drawable(Scene.Primitives.Rectangle);
    ceiling.setColor(vec3.fromValues(0.7, 0.7, 0.7));
    ceiling.transform(mat4.translate, vec3.fromValues(0.0, 4.0, 0.0));
    ceiling.transform(mat4.rotateX, 90 * Math.PI / 180);
    ceiling.transform(mat4.scale, vec3.fromValues(20.0, 20.0, 1.0));
    scene.addDrawable(ceiling);

    var pole1 = new Scene.Drawable(Scene.Primitives.Cube);
    pole1.setColor(vec3.fromValues(1.0, 1.0, 1.0));
    pole1.transform(mat4.translate, vec3.fromValues(7.0, -2.0, 0.0));
    pole1.transform(mat4.scale, vec3.fromValues(0.1, 2.0, 0.1));
    scene.addDrawable(pole1);

    var pole2 = new Scene.Drawable(Scene.Primitives.Cube);
    pole2.setColor(vec3.fromValues(1.0, 1.0, 1.0));
    pole2.transform(mat4.translate, vec3.fromValues(-7.0, -2.0, 0.0));
    pole2.transform(mat4.scale, vec3.fromValues(0.1, 2.0, 0.1));
    scene.addDrawable(pole2);

    var net = new Scene.Drawable(Scene.Primitives.Rectangle);
    net.setColor(vec3.fromValues(1.0, 1.0, 1.0));
    net.transform(mat4.translate, vec3.fromValues(0.0, -1.25, 0.0));
    net.transform(mat4.scale, vec3.fromValues(7.0, 1.0, 1.0));
    scene.addDrawable(net);

    scene.addPointLight();

    scene.run();
});