// The animation framework consists of two parts: the Manager, which is essentially
// just a dictionary to keep track of any running animations with helper functions to
// conveniently start, stop, or clear animations, and the DynamicAnimation class, which
// is a simple interface that specifies callbacks each animation should implement and
// provides common properties such as an associated DOM element, a place to store
// state data, and an associated CSS classes (defined in animation.css).

// The jQuery.Keyframes library (https://github.com/Keyframes/jQuery.Keyframes) is used
// to insert dynamically generated @keyframes CSS rules into the DOM.  A small modfication
// has been made to the library to allow it to return generated CSS as a string without
// actually inserting it into the DOM, which allows us to insert many rules within in a
// single <style> element for improved performance.

// The OOP in this project is a little contrived, but my goal was to become a bit more
// comfortable with Javascript's prototypal inheritance and the `this` keyword, so I
// wanted to implement OOP concepts I've used in other languages in Javascript.

// Possible improvements would be to implement a DynamicParticleEffect class with a
// better default implementation for animations that needed batch reflows, since our
// particle effects end up overriding the default DynamicAnimation behavior anyway.

// #region AnimationManager class
let AnimationManager = function() {
    this.runningAnimations = {};
}

// #region Static utility methods
AnimationManager.getRandom = (min, max) => Math.random() * (max - min) + min
AnimationManager.getPointOnBezierCurve = function(p1, p2, p3, t) {
    // Quadratic bezier curve algorithm
    // https://stackoverflow.com/a/5634528
    let x = Math.pow(1 - t, 2) * p1.x + 2 * (1 - t) * t * p2.x + t * t * p3.x;
    let y = Math.pow(1 - t, 2) * p1.y + 2 * (1 - t) * t * p2.y + t * t * p3.y;
    return {x: x.toFixed(1), y: y.toFixed(1)};
}
AnimationManager.scaleMagnitude = function(x, scaledMin, scaledMax, unscaledMin, unscaledMax) {
    if (unscaledMin === void(0)) unscaledMin = 0;
    if (unscaledMax === void(0)) unscaledMax = 1;
    return ((x - unscaledMin) / (unscaledMax - unscaledMin)) * (scaledMax - scaledMin) + scaledMin;
}
AnimationManager.batchUpdateStyles = function (styleId, cssArray) {
    // The jQuery.Keyframes library builds @keyframes rules from JS objects and
    // inserts them into the DOM.  However, this is undesirable when building many
    // animations at once (such as for random particle effects) because it triggers
    // too many reflows.  The library has been modified to return a string of
    // generated CSS instead, which we then combine into a single <style> element
    // here for better performance.
    var keyframeStyle = document.getElementById(styleId);
    var cssStr = "";
    for (let i = 0; i < cssArray.length; i++)
        cssStr += cssArray[i] + "}";
    if (keyframeStyle) 
        keyframeStyle.innerHTML = cssStr;
    else
    {
        var elem = document.createElement('style');
        elem.innerHTML = cssStr;
        elem.setAttribute('class', 'keyframe-style');
        elem.setAttribute('id', styleId);
        elem.setAttribute('type', 'text/css');
        document.getElementsByTagName('head')[0].appendChild(elem);
    }
}

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

// This method is attached to onAnimationEnd, allowing us to generate new 
// keyframes each time the animation loops.
DynamicAnimation.prototype.run = function() {
    if (!this.isRunning)
        return;
    this.loopCallback();
    
    // Trick from https://css-tricks.com/restart-css-animation/ to reset a
    // CSS animation by forcing a layout reflow, which we do by touching
    // a layout property (such as offsetLeft) before re-adding the class.

    // If an animation wants to handle reflow itself (for example to consolidate
    // many particle effects into a single reflow) it can set the `skipReflow`
    // property.  It must then implement its own reflow logic.

    // Ideally we'd do this by overriding run() from the subclass but I was
    // running into issues with incorrect execution contexts being passed around
    // when I did that, probably because there's something wrong with my prototypal
    // inheritance implementation.
    if (this.skipReflow)
        return
        console.log(this.element.id)
    this.element.classList.remove(this.cssClass);
    this.element.addEventListener("animationend", this.run.bind(this), { once: true })
    void this.element.offsetLeft;
    this.element.classList.add(this.cssClass)
}

DynamicAnimation.prototype.stop = function() { 
    this.element.classList.remove(this.cssClass);
    this.isRunning = false; 
}
// #endregion
