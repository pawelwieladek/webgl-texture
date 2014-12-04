var vec3 = require("gl-matrix").vec3;

function EffectsManager() {
    this.useFog = true;
    this.fogColor = vec3.fromValues(1.0, 1.0, 1.0);
    this.fogMinDistance = 5.0;
    this.fogMaxDistance = 100.0;
    this.fogDistanceStep = 0.5;
}

EffectsManager.prototype = {
    increaseFogMinDistance: function() {
        if (this.fogMinDistance + this.fogDistanceStep < this.fogMaxDistance) {
            this.fogMinDistance += this.fogDistanceStep;
        }
    },
    decreaseFogMinDistance: function() {
        if (this.fogMinDistance - this.fogDistanceStep > 0) {
            this.fogMinDistance -= this.fogDistanceStep;
        }
    },
    increaseFogMaxDistance: function() {
        this.fogMaxDistance += this.fogDistanceStep;
    },
    decreaseFogMaxDistance: function() {
        if (this.fogMaxDistance - this.fogDistanceStep > this.fogMinDistance) {
            this.fogMaxDistance -= this.fogDistanceStep;
        }
    },
    draw: function(shaderManager) {
        window.gl.uniform1i(shaderManager.getUniform("uUseFog"), this.useFog);
        window.gl.uniform1f(shaderManager.getUniform("uFogMinDistance"), this.fogMinDistance);
        window.gl.uniform1f(shaderManager.getUniform("uFogMaxDistance"), this.fogMaxDistance);
        window.gl.uniform3fv(shaderManager.getUniform("uFogColor"), this.fogColor);
    }
};

module.exports = EffectsManager;