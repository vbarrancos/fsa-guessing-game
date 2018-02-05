// #region HotAnimation class (inherits DynamicAnimation)
let HotAnimation = function(element, magnitude) {
    let data = { magnitude: magnitude,
                 lastEndPosition: 0, 
                 duration: Math.abs(AnimationManager.scaleMagnitude(1 - magnitude, 600, 1200)) + "ms"}
    DynamicAnimation.call(this, element, data, true, "hot");
}
HotAnimation.prototype = Object.create(DynamicAnimation.prototype);
HotAnimation.prototype.constructor = HotAnimation;

HotAnimation.prototype.start = function() {
    this.element.style.animationDuration = this.data.duration;
    let particleCount = AnimationManager.scaleMagnitude(this.data.magnitude, 3, 50);
    Object.getPrototypeOf(HotAnimation.prototype).createParticles.call(this, "🌟", SparkParticleEffect, particleCount);
    Object.getPrototypeOf(HotAnimation.prototype).start.call(this);
}

HotAnimation.prototype.run = function() {
    this.invalidateParticles();
    Object.getPrototypeOf(HotAnimation.prototype).run.call(this);
    let range = 200 * this.data.magnitude,
        startPoint = {x: this.data.lastEndPosition, y: 0},
        endPoint = {x: AnimationManager.getRandom(-1 * range, range), y: 0},
        controlPoint = {x: endPoint.x / 2, y: range},
        frames = 25,
        step = 100/frames,
        keyframes = { name: `${this.cssClass}` }
    //TODO: Fix controlPoint calculation to avoid curving trajectory when crossing x = 0.
    for (let i = 0; i <= frames; i++) {
        let point = AnimationManager.getPointOnBezierCurve(startPoint, controlPoint, endPoint, i / frames);
        keyframes[`${i * step}%`] = {"transform": `translate(${point.x}px, ${-1 * point.y}px)`};
    }
    $.keyframe.define([keyframes]);
    this.data.lastEndPosition = endPoint.x;
}
// #endregion

// #region SparkParticleEffect class (inherits ParticleEffect)
let SparkParticleEffect = function () {
    ParticleEffect.apply(this, arguments);
    this.element.style.animationDuration = this.parent.data.duration;
}
SparkParticleEffect.prototype = Object.create(ParticleEffect.prototype);
SparkParticleEffect.prototype.constructor = SparkParticleEffect;

SparkParticleEffect.prototype.generateStyle = function() {
    const direction = Math.random() >= 0.5 ? 1 : -1; 
          distance = AnimationManager.getRandom(50, 300),
          height = AnimationManager.scaleMagnitude(distance, 150, 30, 50, 300),
          startPoint  = {x: this.parent.data.lastEndPosition + AnimationManager.getRandom(-25, 25), y: 0},
          endPoint = {x: this.parent.data.lastEndPosition + (distance * direction), y: AnimationManager.getRandom(-150, 50)},
          controlPoint = {x: AnimationManager.getRandom(startPoint.x, endPoint.x), y: height + 50},
          frames = 30,
          step = 100/frames,
          keyframes = { name: `animation-particle-${this.parent.cssClass}${this.index}` }
    for (let i = 0; i <= frames; i++) {
        let point = AnimationManager.getPointOnBezierCurve(startPoint, controlPoint, endPoint, i / frames);
        keyframes[`${(i * step).toFixed(1)}%`] = {"transform": `translate(${point.x}px, ${-1 * point.y}px)`};
    }
    keyframes["45.1%"] = {"opacity": "70", };
    keyframes["99.9%"] = {"opacity": "0", };
    return $.keyframe.generate(keyframes).css;
}
// #endregion
