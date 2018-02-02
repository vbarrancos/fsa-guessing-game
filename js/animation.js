// Uses jquery.keyframes (https://github.com/Keyframes/jQuery.Keyframes) to
// dynamically build CSS animations at runtime using values generated from
// the game state.

let AnimationHandler = function() {
    this.runningAnimations = {};
    this.getBezierPoints = function(p1, p2, p3, t) {
        // Quadratic bezier curve function based on: https://stackoverflow.com/a/5634528
        // x = (1 - t) * (1 - t) * p[0].x + 2 * (1 - t) * t * p[1].x + t * t * p[2].x;
        // y = (1 - t) * (1 - t) * p[0].y + 2 * (1 - t) * t * p[1].y + t * t * p[2].y;
        let x = Math.pow(1 - t, 2) * p1.x + 2 * (1 - t) * t * p2.x + t * t * p3.x;
        let y = Math.pow(1 - t, 2) * p1.y + 2 * (1 - t) * t * p2.y + t * t * p3.y;
        return {x: x.toFixed(1), y: y.toFixed(1)};
    }
}

AnimationHandler.prototype.buildColdKeyframe = function(magnitude) {
    const maxOffset = 5 * magnitude;
    const minOffset = maxOffset * -1;
    const maxRotate = 5 * magnitude;
    const minRotate = maxRotate * -1;
    const frames = 20;
    const step = 100/frames;

    let keyframes = { name: "tremble" }
    for (let i = 0; i <= frames; i++) {
        let offsetX = randomWithinRange(minOffset, maxOffset).toFixed(2);
        let offsetY = randomWithinRange(minOffset, maxOffset).toFixed(2);
        let rotate = randomWithinRange(minRotate, maxRotate).toFixed(2);
        keyframes[`${i * step}%`] = {"transform": `translate(${offsetX}px, ${offsetY}px) rotate(${rotate}deg)`};
    }
    $.keyframe.define([keyframes]);
    console.log(keyframes);
}

AnimationHandler.prototype.buildHotKeyframes = function(startX, endX, controlX, height) {
    const startPoint = {x: startX, y: 0}
    const endPoint = {x: endX, y: 0}
    const controlPoint = {x: endPoint.x / 2, y: height}
    const frames = 10;
    const step = 100/frames;
    
    let keyframes = { name: "arc" }
    //TODO: controlX

    for (let i = 0; i <= frames; i++) {
        let point = this.getBezierPoints(startPoint, controlPoint, endPoint, i / frames);
        keyframes[`${i * step}%`] = {"transform": `translate(${point.x}px, ${-1 * point.y}px)`};
    }
    $.keyframe.define([keyframes]);
}

AnimationHandler.prototype.animateCold = function(element, magnitude) {
    this.buildColdKeyframe(magnitude);
    element.classList.add("tremble");
}

AnimationHandler.prototype.animateHot = function(element)
{
    let newAnimation = new DynamicAnimation($("#" + element.id),  { magnitude: 0.5, lastEndPosition: 0, }, function() {
        console.log("DynamicAnimation callback", Date.now())
        if (!this.running) return;
        let range = 200 * this.data.magnitude;
        let start = this.data.lastEndPosition;
        let end = randomWithinRange(-1 * range, range);
        let height = range;
        let control = range / 2;
        let callbackFn = this.callback.bind(this);
        this.data.lastEndPosition = end;
        this.handlerReference.buildHotKeyframes(start, end, control, height)
        
        this.element.removeClass("arc");
        // Trick from https://css-tricks.com/restart-css-animation/ to reset the
        // CSS animation by reading from a property to force a reflow, since simply
        // removing and instantly re-adding the class isn't enough.
        void this.element.prop("offsetLeft");
        this.element.addClass("arc");
        this.element.one('animationend', callbackFn);
    })
    this.addDynamicAnimation("veryhot", newAnimation)
}

AnimationHandler.prototype.addDynamicAnimation = function(id, animation) {
    if (this.runningAnimations[id] !== void(0))
        throw `${id} is already running.`;
    this.runningAnimations[id] = animation;
    animation.handlerReference = this;
    animation.running = true;
    animation.callback();
}

AnimationHandler.prototype.removeDynamicAnimation = function(id) {
    if (this.runningAnimations[id] === void(0))
        throw `${id} isn't running.`;
    this.runningAnimations[id].running = false;
    this.runningAnimations[id] = undefined;
}

AnimationHandler.prototype.clearDynamicAnimations = function() {
    for (let key in this.runningAnimations) {
        if (this.runningAnimations.hasOwnProperty(key) && key !== void(0))
            this.removeDynamicAnimation(key);
    }
}

// Used for animations which require more functionality than pure CSS @keyframes alone can support
let DynamicAnimation = function(jqueryElement, animData, setupFn) {
    this.element = jqueryElement
    this.running = false;
    this.data = animData;
    this.callback = setupFn;
}

let randomWithinRange = (min, max) => Math.random() * (max - min) + min