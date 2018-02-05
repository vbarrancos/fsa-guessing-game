// The animation framework consists of three components.  `AnimationManager` is essentially
// just a dictionary with convenient helper functions to start, stop, and keep track of
// running animations.  
//
// `DynamicAnimation` is a class that handles basic functionality used by each animation,
// such as setting up and cleaning up when animations are started/stopped, creating and
// tracking particles for particle effects, interacting with the DOM, and triggering
// layout reflows when animations or particles need to be changed or restarted.
//
// `ParticleEffect` is a simple interface for implementing mini-animations.  Since particles
// are often created/animated in bulk, rather than having every single particle on-screen
// try to manipulate the DOM on its own (which triggers a layout reflow, which is slow),
// ParticleEffects instead simply generate @keyframes CSS rules as strings, and then pass
// those strings to their parent DynamicAnimation to insert into the DOM.  This allows
// hundreds of particle effects to have looping, dynamically generated animations with
// a single reflow.

// The jQuery.Keyframes library (https://github.com/Keyframes/jQuery.Keyframes) is used
// to insert dynamically generated @keyframes CSS rules into the DOM.  A small modfication
// has been made to the library to allow it to return generated CSS as a string without
// actually inserting it into the DOM, which allows us to insert many rules within in a
// single <style> element for improved performance.

// The OOP in this project is a little contrived, but my goal was to become a bit more
// comfortable with Javascript's prototypal inheritance and the `this` keyword, so I
// wanted to implement OOP concepts I've used in other languages in Javascript.

// #region AnimationManager class
let AnimationManager = function() {
    this.runningAnimations = {};
}

// #region Static utility methods
AnimationManager.getRandom = (min, max) => Math.random() * (max - min) + min
AnimationManager.scaleMagnitude = (x, scaledMin, scaledMax, unscaledMin = 0, unscaledMax = 1) => 
    ((x - unscaledMin) / (unscaledMax - unscaledMin)) * (scaledMax - scaledMin) + scaledMin;
AnimationManager.getPointOnBezierCurve = function(p1, p2, p3, t) {
    // Quadratic bezier curve algorithm
    // https://stackoverflow.com/a/5634528
    let x = Math.pow(1 - t, 2) * p1.x + 2 * (1 - t) * t * p2.x + t * t * p3.x;
    let y = Math.pow(1 - t, 2) * p1.y + 2 * (1 - t) * t * p2.y + t * t * p3.y;
    return {x: x.toFixed(1), y: y.toFixed(1)};
}

AnimationManager.prototype.addAnimation = function(id, animation) {
    if (this.runningAnimations[id] !== void(0))
        throw `${id} is already running.`;
    this.runningAnimations[id] = animation;
    animation.start();
}

AnimationManager.prototype.removeAnimation = function(id) {
    if (this.runningAnimations[id] === void(0))
        throw `${id} isn't running.`;
    this.runningAnimations[id].stop();
    this.runningAnimations[id] = undefined;
}

AnimationManager.prototype.clearAnimations = function() {
    for (let key in this.runningAnimations) {
        if (this.runningAnimations.hasOwnProperty(key) && this.runningAnimations[key] !== void(0))
            this.removeAnimation(key);
    }
}
// #endregion

// #region DynamicAnimation class
let DynamicAnimation = function(element, data, shouldLoop, cssClass) {
    this.element = element
    this.data = data;
    this.shouldLoop = shouldLoop
    this.cssClass = cssClass;
    this.particles = [];
    this.isRunning = false;
}

DynamicAnimation.prototype.start = function() { 
    this.isRunning = true;
    this.run();
 }

DynamicAnimation.prototype.run = function() {
    if (!this.isRunning)
        return;

    this.element.classList.remove(this.cssClass); 
    if (this.reflowParticles)
    {
        for (let i = 0; i < this.particleContainer.children.length; i++) {
            const element = this.particleContainer.children[i];
            element.style.animationName = "";
        }
    }
    void this.element.parentNode.offsetLeft;
    this.element.classList.add(this.cssClass)
    if (this.reflowParticles)
    {
        for (let i = 0; i < this.particleContainer.children.length; i++) {
            const element = this.particleContainer.children[i];
            element.style.animationName = `animation-particle-${this.cssClass}${i}`
        }
        this.applyParticleStyles();
        this.reflowParticles = false;
    }
    this.element.addEventListener("animationend", this.onFinished.bind(this), { once: true })
}

DynamicAnimation.prototype.onFinished = function() {
    console.log("DynamicAnimation.onFinished")
    if (this.shouldLoop)
        this.run.call(this);
}

DynamicAnimation.prototype.stop = function() { 
    this.element.classList.remove(this.cssClass);
    if (this.particleContainer)
        this.particleContainer.remove();
    this.isRunning = false; 
}

DynamicAnimation.prototype.invalidateParticles = function() { this.reflowParticles = true; }

DynamicAnimation.prototype.createParticles = function (character, particleClass, particleCount) {
    // Since adding elements to the DOM triggers a reflow, we add our particles to
    // a document fragment and then add the fragment to the DOM to only trigger a
    // single reflow.
    var fragment = document.createDocumentFragment();
    this.particleContainer = document.createElement("div");
    this.particleContainer.id = `particlecontainer-${this.cssClass}`;
    fragment.appendChild(this.particleContainer);
    for (let i = 0; i < particleCount; i++) {
        let element = document.createElement("div");
        element.classList.add(`particle-${this.cssClass}`);
        element.appendChild(document.createTextNode(character))
        this.particleContainer.appendChild(element);
        this.particles.push(new particleClass(element, this, i));
    }
    this.element.parentNode.insertBefore(fragment, this.element.nextSibling);
}

DynamicAnimation.prototype.applyParticleStyles = function() {
    var keyframeStyle = document.getElementById(`particlestyle-${this.cssClass}`);
    var cssStr = "";
    for (let i = 0; i < this.particles.length; i++)
        cssStr += this.particles[i].generateStyle() + "}";
    if (keyframeStyle) 
        keyframeStyle.innerHTML = cssStr;
    else
    {
        var elem = document.createElement('style');
        elem.innerHTML = cssStr;
        elem.setAttribute('class', 'keyframe-style');
        elem.setAttribute('id', `particlestyle-${this.cssClass}`);
        elem.setAttribute('type', 'text/css');
        document.getElementsByTagName('head')[0].appendChild(elem);
    }
}
// #endregion

// #region ParticleEffect interface
let ParticleEffect = function(element, parentAnimation, index) {
    this.element = element;
    this.parent = parentAnimation;
    this.cssClass = `particle-${parentAnimation.cssClass}`
    this.index = index;
}

ParticleEffect.prototype.generateStyle = function() {
    throw "generateStyle must be implemented.";
}
// #endregion
