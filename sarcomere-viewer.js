import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

// --- DATA: Information for each part of the model ---
const partInfo = {
    'myosin': {
        title: 'Myosin (Thick Filament)',
        description: 'Myosin is the motor protein. Its "heads" act like tiny oars, pulling the actin filaments inward to generate force. This process uses ATP as energy.'
    },
    'actin-left': {
        title: 'Actin (Thin Filament)',
        description: 'Actin forms the thin, rope-like filaments. It provides the track that myosin pulls along during muscle contraction.'
    },
    'actin-right': {
        title: 'Actin (Thin Filament)',
        description: 'Actin forms the thin, rope-like filaments. It provides the track that myosin pulls along during muscle contraction.'
    },
    'z-disc': {
        title: 'Z-Disc',
        description: 'The Z-Disc is a dense protein plate that acts as the anchor point for actin filaments and defines the boundary of a sarcomere.'
    }
};

// --- MAIN SCRIPT ---
const container = document.getElementById('sarcomere-container'); 
if (!container) {
    console.error('CRITICAL ERROR: Could not find the #sarcomere-container element in the HTML.');
} else {
    // --- Basic Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1, 12);
    scene.add(camera);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Make renderer background transparent
    container.appendChild(renderer.domElement);

    // --- Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);

    // --- Lighting ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    // --- Post-Processing for Outline Effect ---
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const outlinePass = new OutlinePass(new THREE.Vector2(container.clientWidth, container.clientHeight), scene, camera);
    outlinePass.edgeStrength = 5;
    outlinePass.edgeGlow = 0.5;
    outlinePass.edgeThickness = 1.5;
    outlinePass.visibleEdgeColor.set('#00aaff'); // A nice blue outline color
    outlinePass.hiddenEdgeColor.set('#192a33');
    composer.addPass(outlinePass);

    // --- Raycasting for Interactivity ---
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let wholeModel = new THREE.Group();

    // --- Model Loading ---
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
        'sarcomere_model.glb', 
        (gltf) => {
            wholeModel = gltf.scene;
            scene.add(wholeModel);
        },
        undefined,
        (error) => {
            console.error("3D MODEL LOADING ERROR:", error);
            container.innerHTML = `<p style='color: red; text-align: center; font-weight: bold;'>Error: The 3D model could not be loaded. Please ensure 'sarcomere_model.glb' is in the correct folder.</p>`;
        }
    );
    
    // --- Info Box Elements & Logic ---
    const infoBox = document.getElementById('info-box');
    const infoTitle = document.getElementById('info-title');
    const infoDescription = document.getElementById('info-description');
    const infoCloseBtn = document.getElementById('info-box-close');
    if(infoCloseBtn) infoCloseBtn.addEventListener('click', (e) => { 
        e.stopPropagation();
        if (infoBox) infoBox.style.display = 'none'; 
    });

    // --- Event Listeners ---
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('click', onObjectClick);

    function onPointerMove(event) {
        const rect = container.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onObjectClick() {
        if (outlinePass.selectedObjects.length > 0) {
            const selectedName = outlinePass.selectedObjects[0].name;
            const data = partInfo[selectedName];
            if (data && infoBox && infoTitle && infoDescription) {
                infoTitle.innerText = data.title;
                infoDescription.innerText = data.description;
                infoBox.style.display = 'block';
            }
        }
    }

    function checkIntersection() {
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(wholeModel.children, true);
        if (intersects.length > 0) {
            outlinePass.selectedObjects = [intersects[0].object];
        } else {
            outlinePass.selectedObjects = [];
        }
    }

    // --- Main Render Loop ---
    function animate() {
        requestAnimationFrame(animate);
        checkIntersection();
        controls.update();
        composer.render(); // Use the composer to render the scene with the outline
    }
    animate();

    // --- Handle Window Resizing ---
    new ResizeObserver(() => {
        const { clientWidth, clientHeight } = container;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
        composer.setSize(clientWidth, clientHeight);
    }).observe(container);
}