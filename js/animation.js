// Dynamically builds CSS3 animations at runtime using values derived from the gamestate.
// The jQuery.Keyframes library (https://github.com/Keyframes/jQuery.Keyframes) is used
// to insert @keyframes into the DOM.

// I went a little overboard with the OOP and it's maybe a little contrived, but it was
// mainly done as an excercise to become more familiar with Javascript's prototypal OOP.

// #region AnimationManager class
let AnimationManager = function() {
    this.runningAnimations = {};
}

// #region Static utility functions
AnimationManager.getRandom = (min, max) => Math.random() * (max - min) + min
AnimationManager.getPointOnBezierCurve = function(p1, p2, p3, t) {
    // Quadratic bezier curve function
    // https://stackoverflow.com/a/5634528
    let x = Math.pow(1 - t, 2) * p1.x + 2 * (1 - t) * t * p2.x + t * t * p3.x;
    let y = Math.pow(1 - t, 2) * p1.y + 2 * (1 - t) * t * p2.y + t * t * p3.y;
    return {x: x.toFixed(1), y: y.toFixed(1)};
}
AnimationManager.scaleMagnitude = (x, scaledMin, scaledMax) => ((x - 0) / (1 - 0)) * (scaledMax - scaledMin) + scaledMin;

AnimationManager.prototype.addDynamicAnimation = function(id, animation) {
    if (this.runningAnimations[id] !== void(0))
        throw `${id} is already running.`;
    this.runningAnimations[id] = animation;
    animation.start();
}

AnimationManager.prototype.removeDynamicAnimation = function(id) {
    if (this.runningAnimations[id] === void(0))
        throw `${id} isn't running.`;
    this.runningAnimations[id].stop();
    this.runningAnimations[id] = undefined;
}

AnimationManager.prototype.clearDynamicAnimations = function() {
    for (let key in this.runningAnimations) {
        if (this.runningAnimations.hasOwnProperty(key) && this.runningAnimations[key] !== void(0))
            this.removeDynamicAnimation(key);
    }
}
// #endregion

// #region DynamicAnimation class
let DynamicAnimation = function(element, animationData, loopCallback, cssClass) {
    this.element = element
    this.animationData = animationData;
    this.loopCallback = loopCallback;
    this.cssClass = cssClass;
}

DynamicAnimation.prototype.start = function() { 
    this.isRunning = true;
    this.run();
 }

DynamicAnimation.prototype.run = function() {
    if (!this.isRunning)
        return;
    this.loopCallback();
    
    // Trick from https://css-tricks.com/restart-css-animation/ to reset the
    // CSS animation by forcing a layout reflow, which we do by touching
    // a layout property (offsetLeft) before re-adding the class.
    this.element.classList.remove(this.cssClass);
    void this.element.offsetLeft;
    this.element.classList.add(this.cssClass)
    this.element.addEventListener("animationend", this.run.bind(this), { once: true })
}

DynamicAnimation.prototype.stop = function() { 
    this.element.classList.remove(this.cssClass);
    this.isRunning = false; 
}
// #endregion

// #region HotAnimation class (inherits DynamicAnimation)
let HotAnimation = function(domElement, magnitude) {
    DynamicAnimation.call(this, domElement, { magnitude: magnitude, lastEndPosition: 0 }, this.prepareAnimation, "hot-bounce");
}

HotAnimation.prototype = Object.create(DynamicAnimation.prototype);
HotAnimation.prototype.constructor = HotAnimation;

HotAnimation.prototype.prepareAnimation = function () {
    let range = 200 * this.animationData.magnitude,
        start = this.animationData.lastEndPosition,
        end = AnimationManager.getRandom(-1 * range, range),
        height = range,
        control = range / 2;
    this.animationData.lastEndPosition = end;
    this.buildKeyframes(start, end, control, height)
}

HotAnimation.prototype.buildKeyframes = function(startX, endX, controlX, height) {
    const startPoint = {x: startX, y: 0},
          endPoint = {x: endX, y: 0},
          controlPoint = {x: endPoint.x / 2, y: height},
          frames = 10,
          step = 100/frames,
          keyframes = { name: this.cssClass }
    //TODO: controlX
    for (let i = 0; i <= frames; i++) {
        let point = AnimationManager.getPointOnBezierCurve(startPoint, controlPoint, endPoint, i / frames);
        keyframes[`${i * step}%`] = {"transform": `translate(${point.x}px, ${-1 * point.y}px)`};
    }
    $.keyframe.define([keyframes]);
}
// #endregion

// #region ColdAnimation class (inherits DynamicAnimation)
let ColdAnimation = function(domElement, magnitude) {
    DynamicAnimation.call(this, domElement, { magnitude: magnitude}, this.prepareAnimation, "cold-shake");
}

ColdAnimation.prototype = Object.create(DynamicAnimation.prototype);
ColdAnimation.prototype.constructor = ColdAnimation;

ColdAnimation.prototype.start = function() {
    this.snowflakeDivs = [];
    this.snowflakeManager = new AnimationManager();
    let snowflakeCount = Math.floor(AnimationManager.scaleMagnitude(this.animationData.magnitude, 1, 75));
    if (snowflakeCount > 200)
        snowflakeCount = 200;
    for (let i = 0; i < snowflakeCount; i++) {
        let element = document.createElement("div");
        element.classList.add("cold-snowflake");
        element.appendChild(document.createTextNode("❄"))
        this.element.parentNode.insertBefore(element, this.nextSibling);
        this.snowflakeManager.addDynamicAnimation("snowflake" + i, new SnowflakeParticleAnimation(element, this.animationData.magnitude, this.element, i))
        this.snowflakeDivs.push(element);
    }
    Object.getPrototypeOf(ColdAnimation.prototype).start.call(this);
}

ColdAnimation.prototype.stop = function() {
    for (let i = 0; i < this.snowflakeDivs.length; i++) {
        let element = this.snowflakeDivs[i];
        element.parentNode.removeChild(element);
    }
    Object.getPrototypeOf(ColdAnimation.prototype).stop.call(this);
}

ColdAnimation.prototype.prepareAnimation = function() {
    const maxOffset = 5 * this.animationData.magnitude,
          minOffset = maxOffset * -1,
          maxRotate = 5 * this.animationData.magnitude,
          minRotate = maxRotate * -1,
          frames = 20,
          step = 100/frames,
          keyframes = { name: this.cssClass }

    for (let i = 0; i <= frames; i++) {
        let offsetX = AnimationManager.getRandom(minOffset, maxOffset).toFixed(2);
        let offsetY = AnimationManager.getRandom(minOffset, maxOffset).toFixed(2);
        let rotate = AnimationManager.getRandom(minRotate, maxRotate).toFixed(2);
        keyframes[`${i * step}%`] = {"transform": `translate(${offsetX}px, ${offsetY}px) rotate(${rotate}deg)`};
    }
    $.keyframe.define([keyframes]);
}
// #endregion

// #region SnowflakeParticleAnimation class (inherits DynamicAnimation)
let SnowflakeParticleAnimation = function(domElement, magnitude, parentElement, index) {
    let data = { magnitude: magnitude, 
        parentElement: parentElement, 
        index: index }
    DynamicAnimation.call(this, domElement, data, this.prepareAnimation, "cold-snowflake");
}

SnowflakeParticleAnimation.prototype = Object.create(DynamicAnimation.prototype);
SnowflakeParticleAnimation.prototype.constructor = SnowflakeParticleAnimation;

SnowflakeParticleAnimation.prototype.prepareAnimation = function() {
    const rotation = AnimationManager.scaleMagnitude(this.animationData.magnitude, 180, 540),
          duration = AnimationManager.scaleMagnitude(this.animationData.magnitude, 2.5, 1.5),
          keyframes = { name: `${this.cssClass}-${this.animationData.index}` };
    for (let i = 0; i < 10; i++) {
        this.addFallFrames(keyframes, i*10, this.animationData.parentElement.clientWidth, rotation)      
    }
    this.element.style.animation = "";
    void this.element.offsetLeft;
    this.element.style.animationName = "cold-snowflake-" + this.animationData.index;
    this.element.style.animationDelay = AnimationManager.getRandom(0,duration * 1000) + "ms";
    this.element.style.animationDuration = `${duration * 10}s`;
    $.keyframe.define([keyframes]);
}

// Each time we want to reset an animation, we have to force a browser layout reflow.  If a single
// falling snowflake causes one layout reflow, we'll quickly start to run into performance issues
// due to forcing too many reflows too frequently.

// If we stitch together multiple falling snowflake cycles into a single long @keyframes element,
// we can dramtically reduce the number of reflows and thereby increase the number of snowflakes
// we can have onscreen.

SnowflakeParticleAnimation.prototype.addFallFrames = function(keyframeObj, timelinePosition, range, rotation) {
    const randomYOffset = AnimationManager.getRandom(0, 10),
          position = AnimationManager.getRandom(0, range).toFixed(1);
    keyframeObj[`${0 + timelinePosition}%`] = { transform: `translate(${position}px, ${20 + randomYOffset}px) rotate(0deg)` };
    keyframeObj[`${3 + timelinePosition}%`] = { opacity: "100" };
    keyframeObj[`${9 + timelinePosition}%`] = { transform: `translate(${position}px, ${300 + randomYOffset}px) rotate(${rotation}deg)`, opacity: "0" };
}
// #endregion
