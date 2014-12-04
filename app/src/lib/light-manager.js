var vec3 = require("gl-matrix").vec3;

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

LightManager.PointLight = PointLight;

module.exports = LightManager;