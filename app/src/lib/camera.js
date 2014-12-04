var mat4 = require("gl-matrix").mat4;
var vec3 = require("gl-matrix").vec3;

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

module.exports = Camera;