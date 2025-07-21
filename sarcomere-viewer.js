import * as THREE from './three/three.module.js';
import { OrbitControls } from './three/OrbitControls.js';
import { GLTFLoader } from './three/GLTFLoader.js';

// The TWEEN library is used for smooth animations.
const TWEEN = (function () {
    let _tweens = [];
    return {
        getAll: () => _tweens,
        removeAll: () => { _tweens = []; },
        add: (tween) => { _tweens.push(tween); },
        remove: (tween) => {
            const i = _tweens.indexOf(tween);
            if (i !== -1) _tweens.splice(i, 1);
        },
        update: (time, preserve) => {
            if (_tweens.length === 0) return false;
            let i = 0;
            time = time !== undefined ? time : (typeof window !== 'undefined' && window.performance !== undefined ? window.performance.now() : Date.now());
            while (i < _tweens.length) {
                if (_tweens[i].update(time) || preserve) {
                    i++;
                } else {
                    _tweens.splice(i, 1);
                }
            }
            return true;
        }
    };
})();

(function () {
    const _propertyMappings = {};
    TWEEN.Tween = function (object, group) {
        this._object = object;
        this._valuesStart = {};
        this._valuesEnd = {};
        this._valuesStartRepeat = {};
        this._duration = 1000;
        this._repeat = 0;
        this._repeatDelayTime = undefined;
        this._yoyo = false;
        this._isPlaying = false;
        this._reversed = false;
        this._delayTime = 0;
        this._startTime = null;
        this._easingFunction = TWEEN.Easing.Linear.None;
        this._interpolationFunction = TWEEN.Interpolation.Linear;
        this._chainedTweens = [];
        this._onStartCallback = null;
        this._onStartCallbackFired = false;
        this._onUpdateCallback = null;
        this._onRepeatCallback = null;
        this._onCompleteCallback = null;
        this._onStopCallback = null;
        this._group = group || TWEEN;
        this._isPaused = false;
        this._pauseTime = null;
    };

    TWEEN.Tween.prototype = {
        to: function (properties, duration) {
            this._valuesEnd = Object.create(properties);
            if (duration !== undefined) {
                this._duration = duration;
            }
            return this;
        },
        start: function (time) {
            this._group.add(this);
            this._isPlaying = true;
            this._onStartCallbackFired = false;
            this._startTime = time !== undefined ? (typeof time === 'string' ? TWEEN.now() + parseFloat(time) : time) : TWEEN.now();
            this._startTime += this._delayTime;

            for (const property in this._valuesEnd) {
                if (this._valuesEnd[property] instanceof Array) {
                    if (this._valuesEnd[property].length === 0) continue;
                    this._valuesEnd[property] = [this._object[property]].concat(this._valuesEnd[property]);
                }
                if (this._object[property] === undefined) continue;

                this._valuesStart[property] = this._object[property];
                if ((this._valuesStart[property] instanceof Array) === false) {
                    this._valuesStart[property] *= 1.0;
                }
                this._valuesStartRepeat[property] = this._valuesStart[property] || 0;
            }
            return this;
        },
        stop: function () {
            if (!this._isPlaying) return this;
            this._group.remove(this);
            this._isPlaying = false;
            if (this._onStopCallback !== null) {
                this._onStopCallback(this._object);
            }
            this.stopChainedTweens();
            return this;
        },
        end: function () {
            this.update(this._startTime + this._duration);
            return this;
        },
        stopChainedTweens: function () {
            for (let i = 0, numChainedTweens = this._chainedTweens.length; i < numChainedTweens; i++) {
                this._chainedTweens[i].stop();
            }
        },
        delay: function (amount) { this._delayTime = amount; return this; },
        repeat: function (times) { this._repeat = times; return this; },
        repeatDelay: function (amount) { this._repeatDelayTime = amount; return this; },
        yoyo: function (yoyo) { this._yoyo = yoyo; return this; },
        easing: function (easing) { this._easingFunction = easing; return this; },
        interpolation: function (interpolation) { this._interpolationFunction = interpolation; return this; },
        chain: function () { this._chainedTweens = arguments; return this; },
        onStart: function (callback) { this._onStartCallback = callback; return this; },
        onUpdate: function (callback) { this._onUpdateCallback = callback; return this; },
        onRepeat: function (callback) { this._onRepeatCallback = callback; return this; },
        onComplete: function (callback) { this._onCompleteCallback = callback; return this; },
        onStop: function (callback) { this._onStopCallback = callback; return this; },
        update: function (time) {
            let property;
            let elapsed;
            const value = 0;

            if (time < this._startTime) return true;

            if (this._onStartCallbackFired === false) {
                if (this._onStartCallback !== null) {
                    this._onStartCallback(this._object);
                }
                this._onStartCallbackFired = true;
            }

            elapsed = (time - this._startTime) / this._duration;
            elapsed = this._duration === 0 || elapsed > 1 ? 1 : elapsed;

            const easedElapsed = this._easingFunction(elapsed);

            for (property in this._valuesEnd) {
                if (this._valuesStart[property] === undefined) continue;
                const start = this._valuesStart[property] || 0;
                let end = this._valuesEnd[property];

                if (end instanceof Array) {
                    this._object[property] = this._interpolationFunction(end, easedElapsed);
                } else {
                    if (typeof end === 'string') {
                        if (end.charAt(0) === '+' || end.charAt(0) === '-') {
                            end = start + parseFloat(end);
                        } else {
                            end = parseFloat(end);
                        }
                    }
                    if (typeof end === 'number') {
                        this._object[property] = start + (end - start) * easedElapsed;
                    }
                }
            }

            if (this._onUpdateCallback !== null) {
                this._onUpdateCallback(this._object, elapsed);
            }

            if (elapsed === 1) {
                if (this._repeat > 0) {
                    if (isFinite(this._repeat)) this._repeat--;
                    for (property in this._valuesStartRepeat) {
                        if (typeof this._valuesEnd[property] === 'string') {
                            this._valuesStartRepeat[property] = this._valuesStartRepeat[property] + parseFloat(this._valuesEnd[property]);
                        }
                        if (this._yoyo) {
                            const tmp = this._valuesStartRepeat[property];
                            this._valuesStartRepeat[property] = this._valuesEnd[property];
                            this._valuesEnd[property] = tmp;
                        }
                        this._valuesStart[property] = this._valuesStartRepeat[property];
                    }
                    if (this._yoyo) this._reversed = !this._reversed;
                    if (this._repeatDelayTime !== undefined) {
                        this._startTime = time + this._repeatDelayTime;
                    } else {
                        this._startTime = time + this._delayTime;
                    }
                    if (this._onRepeatCallback !== null) {
                        this._onRepeatCallback(this._object);
                    }
                    return true;
                } else {
                    if (this._onCompleteCallback !== null) {
                        this._onCompleteCallback(this._object);
                    }
                    for (let i = 0, numChainedTweens = this._chainedTweens.length; i < numChainedTweens; i++) {
                        this._chainedTweens[i].start(this._startTime + this._duration);
                    }
                    return false;
                }
            }
            return true;
        }
    };
    TWEEN.Easing = {
        Linear: { None: (k) => k },
        Quadratic: { InOut: (k) => ((k *= 2) < 1 ? 0.5 * k * k : -0.5 * (--k * (k - 2) - 1)) }
        // Add other easing functions if needed
    };
    TWEEN.Interpolation = {
        Linear: function (v, k) {
            const m = v.length - 1;
            const f = m * k;
            const i = Math.floor(f);
            const fn = TWEEN.Interpolation.Utils.Linear;
            if (k < 0) return fn(v[0], v[1], f);
            if (k > 1) return fn(v[m], v[m - 1], m - f);
            return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);
        },
        Utils: { Linear: (p0, p1, t) => (p1 - p0) * t + p0 }
    };
    TWEEN.now = (typeof window !== 'undefined' && window.performance !== undefined ? window.performance.now.bind(window.performance) : Date.now);
})();


// --- MAIN SCRIPT ---

// Find the container and buttons on the page
const container = document.getElementById('sarcomere-viewer');
const contractBtn = document.getElementById('contract-btn');
const relaxBtn = document.getElementById('relax-btn');

if (container) {
    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const sizes = {
        width: container.clientWidth,
        height: container.clientHeight,
    };

    // --- CAMERA ---
    const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 0, 30);
    scene.add(camera);

    // --- RENDERER ---
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- CONTROLS ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // --- MODEL LOADING & ANIMATION LOGIC ---
    let actinLeft, actinRight;
    const relaxedPosition = 5.5; 
    const contractedPosition = 2.5;

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
        'sarcomere_model.glb',
        (gltf) => {
            const model = gltf.scene;

            // Find the specific parts of the model by name
            actinLeft = model.getObjectByName('actin-left');
            actinRight = model.getObjectByName('actin-right');
            const myosin = model.getObjectByName('myosin'); // Optional, if you want to reference it

            if (actinLeft && actinRight) {
                // Set initial positions
                actinLeft.position.x = -relaxedPosition;
                actinRight.position.x = relaxedPosition;
            } else {
                console.error("Could not find 'actin-left' or 'actin-right' objects in the model. Animation buttons will not work.");
            }

            // Center the entire model in the scene
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);

            scene.add(model);
        },
        undefined,
        (error) => {
            console.error("An error happened while loading the model:", error);
        }
    );

    // --- BUTTON EVENT LISTENERS ---
    contractBtn.addEventListener('click', () => animateActin(contractedPosition));
    relaxBtn.addEventListener('click', () => animateActin(relaxedPosition));

    function animateActin(targetPosition) {
        if (!actinLeft || !actinRight) return;

        const duration = 800; // Animation duration in milliseconds

        new TWEEN.Tween(actinLeft.position)
            .to({ x: -targetPosition }, duration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();

        new TWEEN.Tween(actinRight.position)
            .to({ x: targetPosition }, duration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
    }

    // --- RENDER LOOP ---
    function animate() {
        requestAnimationFrame(animate);
        TWEEN.update(); // Update animations
        controls.update(); // Update camera controls
        renderer.render(scene, camera);
    }
    animate();

    // --- RESIZE OBSERVER ---
    new ResizeObserver(() => {
        sizes.width = container.clientWidth;
        sizes.height = container.clientHeight;

        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();

        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }).observe(container);

} else {
    console.error('Could not find the #sarcomere-viewer container in the document.');
}