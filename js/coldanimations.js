// #region ColdAnimation class (inherits DynamicAnimation)
let ColdAnimation = function(element, magnitude) {
    let data = { magnitude: magnitude,
                 spread: element.clientWidth,
                 snowflakeDuration: AnimationManager.scaleMagnitude(magnitude, 2500, 1500)}
    DynamicAnimation.call(this, element, data, true, "cold");
}
ColdAnimation.prototype = Object.create(DynamicAnimation.prototype);
ColdAnimation.prototype.constructor = ColdAnimation;

ColdAnimation.prototype.start = function() {
    this.invalidateParticles();
    let particleCount = AnimationManager.scaleMagnitude(this.data.magnitude, 1, 150);
    Object.getPrototypeOf(ColdAnimation.prototype).createParticles.call(this, "❄", SnowflakeParticleEffect, particleCount);
    Object.getPrototypeOf(ColdAnimation.prototype).start.call(this);
}

ColdAnimation.prototype.run = function() {
    Object.getPrototypeOf(HotAnimation.prototype).run.call(this);
    const maxOffset = 5 * this.data.magnitude,
          minOffset = maxOffset * -1,
          maxRotate = 5 * this.data.magnitude,
          minRotate = maxRotate * -1,
          frames = 20,
          step = 100/frames,
          keyframes = { name: `${this.cssClass}` }
    for (let i = 0; i <= frames; i++) {
        let offsetX = AnimationManager.getRandom(minOffset, maxOffset).toFixed(2);
        let offsetY = AnimationManager.getRandom(minOffset, maxOffset).toFixed(2);
        let rotate = AnimationManager.getRandom(minRotate, maxRotate).toFixed(2);
        keyframes[`${i * step}%`] = {"transform": `translate(${offsetX}px, ${offsetY}px) rotate(${rotate}deg)`};
    }
    $.keyframe.define([keyframes]);
}
// #endregion

// #region SnowflakeParticleEffect class (inherits ParticleEffect)
let SnowflakeParticleEffect = function() {
    ParticleEffect.apply(this, arguments);
    let duration = this.parent.data.snowflakeDuration;
    if (duration < 1800) this.parent.data.snowflakeDuration = 1800;
    this.element.style.animationDuration = `${this.parent.data.snowflakeDuration * 10}ms`;
}
SnowflakeParticleEffect.prototype = Object.create(ParticleEffect.prototype);
SnowflakeParticleEffect.prototype.constructor = SnowflakeParticleEffect;

SnowflakeParticleEffect.prototype.generateStyle = function() {
    const rotation = AnimationManager.scaleMagnitude(this.parent.data.magnitude, 180, 540),
          keyframes = { name: `animation-particle-${this.parent.cssClass}${this.index}` },
          delay = AnimationManager.getRandom(0, this.parent.data.snowflakeDuration * 2);
    for (let i = 0; i <= 9; i++) {
        this.addFallFrames(keyframes, i * 10, this.parent.data.spread, rotation)      
    }
    
    this.element.style.animationDelay = delay + "ms";
    return $.keyframe.generate(keyframes).css;
}

SnowflakeParticleEffect.prototype.addFallFrames = function(keyframeObj, timelinePosition, range, rotation) {
    const randomYOffset = AnimationManager.getRandom(0, 10),
          position = AnimationManager.getRandom(0, range).toFixed(1);
    keyframeObj[`${0.5 + timelinePosition}%`] = { transform: `translate(${position}px, ${20 + randomYOffset}px) rotate(0deg)`, opacity: "0"};
    keyframeObj[`${1.0 + timelinePosition}%`] = { transform: `translate(${position}px, ${20 + randomYOffset}px) rotate(0deg)`, opacity: "100"};
    keyframeObj[`${3.0 + timelinePosition}%`] = { opacity: "100" };
    keyframeObj[`${9.5 + timelinePosition}%`] = { transform: `translate(${position}px, ${300 + randomYOffset}px) rotate(${rotation}deg)`, opacity: "0" };
}
// #endregion
