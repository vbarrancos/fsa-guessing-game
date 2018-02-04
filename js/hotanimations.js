// #region HotAnimation class (inherits DynamicAnimation)
let HotAnimation = function(domElement, magnitude) {
    DynamicAnimation.call(this, domElement, { magnitude: magnitude, lastEndPosition: 0 }, this.prepareAnimation, "hot-bounce");
    this.skipReflow = true;
}

HotAnimation.prototype = Object.create(DynamicAnimation.prototype);
HotAnimation.prototype.constructor = HotAnimation;

HotAnimation.prototype.start = function() {
    this.sparkManager = new AnimationManager();
    
    // Using a global var here because we're lazy and need to access this from a child animation
    sparkCss = []; 
    
    // Create a document fragment, then add the fragment to the DOM.
    // This only triggers a single layout reflow instead of one for
    // each Spark div.
    var newDoc = document.createDocumentFragment();
    this.sparkContainerDiv = document.createElement("div");
    this.sparkContainerDiv.id = "sparksContainer";
    newDoc.appendChild(this.sparkContainerDiv);
    for (let i = 0; i < AnimationManager.scaleMagnitude(this.animationData.magnitude, 3, 50); i++) {
        let element = document.createElement("div");
        element.classList.add("hot-spark");
        element.appendChild(document.createTextNode("🌟"))
        this.sparkContainerDiv.appendChild(element);
        this.sparkManager.addDynamicAnimation("spark" + i, new SparkParticleAnimation(element, this.animationData, this.element, i))
    }
    this.element.parentNode.insertBefore(newDoc, this.element.nextSibling);
    Object.getPrototypeOf(HotAnimation.prototype).start.call(this);
}

HotAnimation.prototype.stop = function() {
    document.getElementById("sparksContainer").remove();
    Object.getPrototypeOf(HotAnimation.prototype).stop.call(this);
}

HotAnimation.prototype.prepareAnimation = function () {
    let range = 200 * this.animationData.magnitude,
        start = this.animationData.lastEndPosition,
        end = AnimationManager.getRandom(-1 * range, range),
        height = range,
        control = range / 2;
    this.buildKeyframes(start, end, control, height)
    this.animationData.lastEndPosition = end;
    this.element.style.animationDuration = AnimationManager.scaleMagnitude(1 - this.animationData.magnitude, 600, 1200) + "ms";
    //this.element.style.animationDuration = `${AnimationManager.scaleMagnitude(this.animationData.magnitude, 0.6, 1.2)}s`;
}

HotAnimation.prototype.buildKeyframes = function(startX, endX, controlX, height) {
    const startPoint = {x: startX, y: 0},
          endPoint = {x: endX, y: 0},
          controlPoint = {x: endPoint.x / 2, y: height},
          frames = 25,
          step = 100/frames,
          keyframes = { name: this.cssClass }
    //TODO: Fix controlPoint calculation to avoid curve trajectory when crossing x = 0.

    for (let i = 0; i <= frames; i++) {
        let point = AnimationManager.getPointOnBezierCurve(startPoint, controlPoint, endPoint, i / frames);
        keyframes[`${i * step}%`] = {"transform": `translate(${point.x}px, ${-1 * point.y}px)`};
    }

    $.keyframe.define([keyframes]);
    this.reflowSparks();
    sparkCss = [];
}

// We set skipReflow to true for HotAnimation and SparkParticleAnimation, since the
// default behavior simply triggers a reflow for each DynamicAnimation on each loop in
// order to reset the CSS animation.  This means we end up triggering many reflows
// on a single animation cycle, which quickly causes performance issues.
// Here we override the default behavior and trigger a single reflow for all sparks.
HotAnimation.prototype.reflowSparks = function() {
    // First, remove the animation CSS class from each element...
    this.element.classList.remove(this.cssClass); 
    for (let i = 0; i < this.sparkContainerDiv.children.length; i++) {
        const element = this.sparkContainerDiv.children[i];
        element.style.animation = "";
    }
    
    // ...touch offsetLeft to trigger reflow of all child nodes...
    void this.element.parentNode.offsetLeft;

    // ...then re-add the classes to reset the animations and build new ones.
    this.element.classList.add(this.cssClass)
    for (let i = 0; i < this.sparkContainerDiv.children.length; i++) {
        const element = this.sparkContainerDiv.children[i];
        this.sparkManager.runningAnimations["spark" + i].prepareAnimation();
    }

    // Batch the @keyframes for all sparks in a single <style> element.
    AnimationManager.batchUpdateStyles("sparks", sparkCss)

    // Bind the event listener, since the superclass isn't handling it for us.
    this.element.addEventListener("animationend", this.run.bind(this), { once: true })
}
// #endregion

// #region SparkParticleAnimation class (inherits DynamicAnimation)
let SparkParticleAnimation = function (domElement, hotDataReference, parentElement, index) {
    let data = { hotData: hotDataReference, magnitude: hotDataReference.magnitude, parentElement: parentElement, index: index }
    DynamicAnimation.call(this, domElement, data, this.prepareAnimation, "hot-spark");
    this.skipReflow = true;
}

SparkParticleAnimation.prototype = Object.create(DynamicAnimation.prototype);
SparkParticleAnimation.prototype.constructor = SparkParticleAnimation;

SparkParticleAnimation.prototype.prepareAnimation = function () {
    this.buildKeyframes(this.animationData.index % 2 === 0 ? 1 : -1, this.animationData.magnitude) 
}

SparkParticleAnimation.prototype.buildKeyframes = function(direction, magnitude) {
    const distance = AnimationManager.getRandom(50, 300),
          height = AnimationManager.scaleMagnitude(distance, 150, 30, 50, 300),
          startPoint  = {x: this.animationData.hotData.lastEndPosition + AnimationManager.getRandom(-25, 25), y: 0},
          endPoint = {x: this.animationData.hotData.lastEndPosition + (distance * direction), y: AnimationManager.getRandom(-150, 50)},
          controlPoint = {x: AnimationManager.getRandom(startPoint.x, endPoint.x), y: height + 50},
          frames = 30,
          step = 100/frames,
          keyframes = { name: `${this.cssClass}-${this.animationData.index}` }

    for (let i = 0; i <= frames; i++) {
        let point = AnimationManager.getPointOnBezierCurve(startPoint, controlPoint, endPoint, i / frames);
        keyframes[`${(i * step).toFixed(1)}%`] = {"transform": `translate(${point.x}px, ${-1 * point.y}px)`};
    }
    keyframes["45.1%"] = {"opacity": "70", };
    keyframes["99.9%"] = {"opacity": "0", };

    // Normally this is where we'd force a reflow after updating this element's @keyframes rule.
    // However, since we have many sparks firing at once, this also causes many layout reflows
    // to fire at once, which can take 50-100ms and noticable stuttering.

    // To avoid this, I've modified jQuery.Keyframes to return a block of CSS instead of  adding 
    // the rules to the DOM itself.  We can then concatenate the CSS for each spark into a single
    // <style> element and add the rules for all sparks in one go.  This allows us to add many,
    // many more sparks than we'd be able to otherwise.
    this.element.style.animation = "hot-spark-" + this.animationData.index;
    this.element.style.animationDuration = AnimationManager.scaleMagnitude(1 - this.animationData.magnitude, 600, 1200) + "ms";
    sparkCss.push($.keyframe.generate(keyframes).css);
}
// #endregion
