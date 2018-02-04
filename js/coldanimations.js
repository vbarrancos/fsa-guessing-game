
// #region ColdAnimation class (inherits DynamicAnimation)
let ColdAnimation = function(domElement, magnitude) {
    console.log(domElement.clientWidth)
    DynamicAnimation.call(this, domElement, { magnitude: magnitude, spread: domElement.clientWidth}, this.prepareAnimation, "cold-shake");
}

ColdAnimation.prototype = Object.create(DynamicAnimation.prototype);
ColdAnimation.prototype.constructor = ColdAnimation;

ColdAnimation.prototype.start = function() {
    this.snowflakeManager = new AnimationManager();
    var newDoc = document.createDocumentFragment();
    this.snowflakeContainerDiv = document.createElement("div");
    this.snowflakeContainerDiv.id = "snowflakesContainer";
    newDoc.appendChild(this.snowflakeContainerDiv);
    snowflakeCss = [];
    for (let i = 0; i < AnimationManager.scaleMagnitude(this.animationData.magnitude, 1, 100); i++) {
        let element = document.createElement("div");
        element.classList.add("cold-snowflake");
        element.appendChild(document.createTextNode("❄"))
        this.snowflakeContainerDiv.appendChild(element);
        this.snowflakeManager.addDynamicAnimation("snowflake" + i, new SnowflakeParticleAnimation(element, this.animationData.magnitude, this.animationData.spread, i))
    }
    this.element.parentNode.insertBefore(newDoc, this.element.nextSibling);
    Object.getPrototypeOf(ColdAnimation.prototype).start.call(this);
}

ColdAnimation.prototype.stop = function() {
    document.getElementById("snowflakesContainer").remove();
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
let SnowflakeParticleAnimation = function(domElement, magnitude, spread, index) {
    let data = { magnitude: magnitude, spread: spread, index: index }
    DynamicAnimation.call(this, domElement, data, this.prepareAnimation, "cold-snowflake");
    this.skipReflow = true;
}

SnowflakeParticleAnimation.prototype = Object.create(DynamicAnimation.prototype);
SnowflakeParticleAnimation.prototype.constructor = SnowflakeParticleAnimation;

SnowflakeParticleAnimation.prototype.prepareAnimation = function() {
    const rotation = AnimationManager.scaleMagnitude(this.animationData.magnitude, 180, 540),
          duration = AnimationManager.scaleMagnitude(this.animationData.magnitude, 2.5, 1.5),
          keyframes = { name: `${this.cssClass}-${this.animationData.index}` };

    let idleFrames = AnimationManager.getRandom(0, 12);
    keyframes["0%"] = { transform: "translate(0px, 0px) rotate(0deg)"};
    for (let i = idleFrames; i <= 90; i = i + 10) {
        this.addFallFrames(keyframes, i, this.animationData.spread, rotation)      
    }

    this.element.style.animation = "";
    this.element.style.animationName = "cold-snowflake-" + this.animationData.index;
    this.element.style.animationDuration = `${duration * 10}s`;
    snowflakeCss.push($.keyframe.generate(keyframes).css);
    let limit = AnimationManager.scaleMagnitude(this.animationData.magnitude, 1, 100) - 1
    if (this.animationData.index === Math.floor(limit))
    {
        AnimationManager.batchUpdateStyles("snowflakes", snowflakeCss);
        void this.element.offsetLeft;
        this.element.addEventListener("animationend", this.run.bind(this), { once: true })
    }
}

// Each time we want to reset an animation, we have to force a browser layout reflow.  If a single
// falling snowflake causes one layout reflow, we'll quickly start to run into performance issues
// due to forcing too many reflows too frequently.

// If we stitch together multiple falling snowflake cycles into a single long @keyframes element,
// we can dramatically reduce the number of reflows and thereby increase the number of snowflakes
// we can have onscreen.


SnowflakeParticleAnimation.prototype.addFallFrames = function(keyframeObj, timelinePosition, range, rotation) {
    const randomYOffset = AnimationManager.getRandom(0, 10),
          position = AnimationManager.getRandom(0, range).toFixed(1);
    keyframeObj[`${0 + timelinePosition}%`] = { transform: `translate(${position}px, ${20 + randomYOffset}px) rotate(0deg)`, opacity: "100"};
    keyframeObj[`${3 + timelinePosition}%`] = { opacity: "100" };
    keyframeObj[`${9 + timelinePosition}%`] = { transform: `translate(${position}px, ${300 + randomYOffset}px) rotate(${rotation}deg)`, opacity: "0" };
}
// #endregion
