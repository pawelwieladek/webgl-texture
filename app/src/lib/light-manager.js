var vec3 = require("gl-matrix").vec3;

function LightManager() {
    this.directionalLights = [];
    this.pointLights = [];
    this.spotLights = [];
}

LightManager.prototype = {
    addPointLight: function(pointLight) {
        this.pointLights.push(pointLight);
    },
    addSpotLight: function(spotLight) {
        this.spotLights.push(spotLight);
    },
    draw: function(shaderManager) {
        window.gl.uniform1i(shaderManager.getUniform("directionalLightsCount"), this.directionalLights.length);
        window.gl.uniform1i(shaderManager.getUniform("pointLightsCount"), this.pointLights.length);
        window.gl.uniform1i(shaderManager.getUniform("spotLightsCount"), this.spotLights.length);

        var pointLightIndex = 0;
        this.pointLights.forEach(function(pointLight) {
            pointLight.draw(shaderManager, pointLightIndex++);
        });

        var spotLightIndex = 0;
        this.spotLights.forEach(function(spotLight) {
            spotLight.draw(shaderManager, spotLightIndex++);
        });
    }
};

function PointLight(options) {
    options = options || {};
    this.position = options.position || vec3.fromValues(0.0, 0.0, 0.0);
    this.diffuseColor = options.diffuseColor || vec3.fromValues(0.0, 0.0, 0.0);
    this.ambientColor = options.ambientColor || vec3.fromValues(0.0, 0.0, 0.0);
    this.constantAttenuation = options.constantAttenuation || 1;
    this.linearAttenuation = options.linearAttenuation || 0;
    this.exponentAttenuation = options.exponentAttenuation || 0;
}

PointLight.prototype = {
    setPosition: function(position) {
        this.position = position;
    },
    setDiffuseColor: function(diffuseColor) {
        this.diffuseColor = diffuseColor;
    },
    draw: function(shaderManager, index) {
        shaderManager.bindUniform("pointLights[" + index + "].position");
        shaderManager.bindUniform("pointLights[" + index + "].diffuseColor");
        shaderManager.bindUniform("pointLights[" + index + "].ambientColor");
        shaderManager.bindUniform("pointLights[" + index + "].constantAttenuation");
        shaderManager.bindUniform("pointLights[" + index + "].linearAttenuation");
        shaderManager.bindUniform("pointLights[" + index + "].exponentAttenuation");
        
        window.gl.uniform3fv(shaderManager.getUniform("pointLights[" + index + "].position"), this.position);
        window.gl.uniform3fv(shaderManager.getUniform("pointLights[" + index + "].diffuseColor"), this.diffuseColor);
        window.gl.uniform3fv(shaderManager.getUniform("pointLights[" + index + "].ambientColor"), this.ambientColor);
        window.gl.uniform1f(shaderManager.getUniform("pointLights[" + index + "].constantAttenuation"), this.constantAttenuation);
        window.gl.uniform1f(shaderManager.getUniform("pointLights[" + index + "].linearAttenuation"), this.linearAttenuation);
        window.gl.uniform1f(shaderManager.getUniform("pointLights[" + index + "].exponentAttenuation"), this.exponentAttenuation);
    }
};

function SpotLight(options) {
    options = options || {};
    this.position = options.position || vec3.fromValues(0.0, 0.0, 0.0);
    this.diffuseColor = options.diffuseColor || vec3.fromValues(0.0, 0.0, 0.0);
    this.direction = options.direction || vec3.fromValues(0.0, 0.0, 0.0);
    this.outerAngle = options.outerAngle || 10.0;
    this.innerAngle = options.innerAngle || 5.0;
    this.range = options.range || 50.0;
}

SpotLight.prototype = {
    setPosition: function(position) {
        this.position = position;
    },
    setDiffuseColor: function(diffuseColor) {
        this.diffuseColor = diffuseColor;
    },
    setDirection: function(direction) {
        this.direction = direction;
    },
    draw: function(shaderManager, index) {
        shaderManager.bindUniform("spotLights[" + index + "].position");
        shaderManager.bindUniform("spotLights[" + index + "].diffuseColor");
        shaderManager.bindUniform("spotLights[" + index + "].direction");
        shaderManager.bindUniform("spotLights[" + index + "].cosOuterAngle");
        shaderManager.bindUniform("spotLights[" + index + "].cosInnerAngle");
        shaderManager.bindUniform("spotLights[" + index + "].range");
        
        window.gl.uniform3fv(shaderManager.getUniform("spotLights[" + index + "].position"), this.position);
        window.gl.uniform3fv(shaderManager.getUniform("spotLights[" + index + "].diffuseColor"), this.diffuseColor);
        window.gl.uniform3fv(shaderManager.getUniform("spotLights[" + index + "].direction"), this.direction);
        window.gl.uniform1f(shaderManager.getUniform("spotLights[" + index + "].cosOuterAngle"), Math.cos(this.outerAngle * Math.PI / 180));
        window.gl.uniform1f(shaderManager.getUniform("spotLights[" + index + "].cosInnerAngle"), Math.cos(this.innerAngle * Math.PI / 180));
        window.gl.uniform1f(shaderManager.getUniform("spotLights[" + index + "].range"), this.range);
    }
};

LightManager.PointLight = PointLight;
LightManager.SpotLight = SpotLight;

module.exports = LightManager;