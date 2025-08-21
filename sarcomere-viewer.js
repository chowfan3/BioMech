console.log("Sarcomere viewer script has started!");

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { gsap } from "gsap";

// --- DATA: Information for each part of the model ---
const partInfo = {
    'myosin': { title: 'Myosin (Thick Filament)', description: 'Myosin is the motor protein...' },
    'myosin_head': { title: 'Myosin Head', description: 'This is the motor part of the myosin...' },
    'actin1': { title: 'Actin (Thin Filament)', description: 'Actin forms the thin, rope-like filaments...' },
    'actin2': { title: 'Actin (Thin Filament)', description: 'Actin forms the thin, rope-like filaments...' },
    'tropomyosin': { title: 'Tropomyosin', description: 'This regulatory protein is a long strand...' }
};

// --- MAIN SCRIPT ---
const container = document.getElementById('sarcomere-container');
if (!container) {
    console.error('CRITICAL ERROR: Could not find the #sarcomere-container element in the HTML.');
} else {
    // --- Basic Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 1.25);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const outlinePass = new OutlinePass(new THREE.Vector2(container.clientWidth, container.clientHeight), scene, camera);
    outlinePass.edgeStrength = 5;
    outlinePass.edgeGlow = 0.5;
    outlinePass.edgeThickness = 1.5;
    outlinePass.visibleEdgeColor.set('#ffffff');
    composer.addPass(outlinePass);

    // --- Raycasting & Animation Variables ---
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let wholeModel = new THREE.Group();
    let actinMaterial = null; // To hold the material for the actin filaments
    let isAnimating = false;

    // --- Model Loading ---
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
        'sarcomere_model.glb',
        (gltf) => {
            wholeModel = gltf.scene;
            scene.add(wholeModel);

            // NEW: Find the material used by the actin filaments
            wholeModel.traverse((object) => {
                if (object.isMesh && (object.name === 'actin1' || object.name === 'actin2')) {
                    if (!actinMaterial) {
                        actinMaterial = object.material;
                        // Enable the texture to be repeated/tiled for the animation
                        if (actinMaterial.map) {
                            actinMaterial.map.wrapS = THREE.RepeatWrapping;
                            actinMaterial.map.wrapT = THREE.RepeatWrapping;
                        }
                    }
                }
            });
        },
        undefined,
        (error) => console.error("3D MODEL LOADING ERROR:", error)
    );

    // --- Info Box Elements & Logic ---
    const infoBox = document.getElementById('info-box');
    const infoTitle = document.getElementById('info-title');
    const infoDescription = document.getElementById('info-description');
    window.addEventListener('scroll', () => {
        if (infoBox && infoBox.style.display !== 'none') infoBox.style.display = 'none';
    });

    // ======================================================
    //  UPDATED: Hybrid Animation (Scaling + Texture Sliding)
    // ======================================================

    const contractBtn = document.getElementById('contractBtn');
    const relaxBtn = document.getElementById('relaxBtn');

    function contract() {
        if (isAnimating || !wholeModel || !actinMaterial) return;
        isAnimating = true;
        contractBtn.disabled = true;

        const tl = gsap.timeline({
            onComplete: () => {
                isAnimating = false;
                if (relaxBtn) relaxBtn.disabled = false;
            }
        });

        // Action 1: "Squish" the whole model to show shortening
        tl.to(wholeModel.scale, {
            duration: 0.7,
            x: 0.7, // Shorten
            y: 1.05, // Thicken
            z: 1.05, // Thicken
            ease: "power2.inOut"
        }, 0); // Start at time 0

        // Action 2: Animate the texture offset to simulate sliding
        if (actinMaterial && actinMaterial.map) {
            tl.to(actinMaterial.map.offset, {
                duration: 0.7,
                x: 0.25, // Move the texture a quarter of its length. Adjust for speed.
                ease: "power2.inOut"
            }, 0); // Start at time 0
        }
    }

    function relax() {
        if (isAnimating || !wholeModel || !actinMaterial) return;
        isAnimating = true;
        relaxBtn.disabled = true;

        const tl = gsap.timeline({
            onComplete: () => {
                isAnimating = false;
                if (contractBtn) contractBtn.disabled = false;
            }
        });

        // Action 1: Return the model to its normal scale
        tl.to(wholeModel.scale, {
            duration: 0.7,
            x: 1, y: 1, z: 1,
            ease: "power2.inOut"
        }, 0);

        // Action 2: Return the texture to its original position
        if (actinMaterial && actinMaterial.map) {
            tl.to(actinMaterial.map.offset, {
                duration: 0.7,
                x: 0, // Reset the offset
                ease: "power2.inOut"
            }, 0);
        }
    }

    if (contractBtn) contractBtn.addEventListener('click', contract);
    if (relaxBtn) relaxBtn.addEventListener('click', relax);

    // --- Event Listeners for Highlighting and Info Box ---
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('click', onObjectClick);

    function onPointerMove(event) {
        const rect = container.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onObjectClick(event) {
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(wholeModel.children, true);
        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;
            const data = partInfo[selectedObject.name];
            if (data) {
                outlinePass.selectedObjects = [selectedObject];
                infoTitle.innerText = data.title;
                infoDescription.innerText = data.description;
                // Position and display info box...
                const popUpHeight = infoBox.offsetHeight, popUpWidth = infoBox.offsetWidth;
                let top = event.clientY + 20, left = event.clientX - (popUpWidth / 2);
                if (top + popUpHeight > window.innerHeight) {
                    top = event.clientY - popUpHeight - 20;
                    infoBox.className = 'info-box-top';
                } else {
                    infoBox.className = 'info-box-bottom';
                }
                infoBox.style.top = `${top}px`;
                infoBox.style.left = `${left}px`;
                infoBox.style.display = 'block';
            }
        } else {
            infoBox.style.display = 'none';
            outlinePass.selectedObjects = [];
        }
    }

    // --- Main Render Loop & Resizing ---
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        composer.render();
    }
    animate();
    new ResizeObserver(() => {
        const { clientWidth, clientHeight } = container;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
        composer.setSize(clientWidth, clientHeight);
    }).observe(container);
}