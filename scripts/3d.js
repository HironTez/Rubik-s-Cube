import * as THREE from './otherScripts/three.module.js';
import { OrbitControls } from './otherScripts/OrbitControls.js';

import { rotateUpdate, onDocumentMouseDown, onDocumentTouchDown, onDocumentMouseMove, onDocumentTouchMove, onDocumentPointerUp } from './rotate.js';


let RubiksCube = [], scene, camera, renderer, controls, rotator, absoluteAxises;


function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.z = 5;
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementsByTagName('canvas')[0], alpha: true });
    const dimensions = aspectSize(window.innerWidth, window.innerHeight)
    renderer.setSize(dimensions.width, dimensions.height);
    
    window.onresize = () => {
        const newDimensions = aspectSize(window.innerWidth, window.innerHeight);
        renderer.setSize(newDimensions.width, newDimensions.height);
    };

    document.body.appendChild(renderer.domElement);

    // lights
    const dirLight1 = new THREE.DirectionalLight(0xBBBBBB);
    dirLight1.position.set(0, 0, 1);
    camera.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x303030);
    dirLight2.position.set(10, 10, 1);
    camera.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0x303030);
    dirLight3.position.set(-10, -10, 1);
    camera.add(dirLight3);

    const dirLight4 = new THREE.DirectionalLight(0x303030);
    dirLight4.position.set(10, -10, 1);
    camera.add(dirLight4);

    const dirLight5 = new THREE.DirectionalLight(0x303030);
    dirLight5.position.set(-10, 10, 1);
    camera.add(dirLight5);


    // controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.rotate(-25 * Math.PI / 180, 20 * Math.PI / 180); // Set default rotation

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    controls.minDistance = 7;
    controls.maxDistance = 10;

    controls.mouseButtons = {
        RIGHT: THREE.MOUSE.ROTATE
    };
    controls.touches = {
        TWO: THREE.TOUCH.DOLLY_ROTATE
    };

    // Object for absolute positioning in space
    absoluteAxises = new THREE.Vector3();

    // Add events listeners
    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onDocumentMouseDown);
    canvas.addEventListener('touchstart', onDocumentTouchDown);
    document.addEventListener('mousemove', onDocumentMouseMove);
    document.addEventListener('touchmove', onDocumentTouchMove);
    document.addEventListener('mouseup', onDocumentPointerUp);
    document.addEventListener('touchend', onDocumentPointerUp);

    initCube();
    
    const root = document.querySelector(':root');
    root.style.setProperty('--canvas-width', canvas.clientWidth + 'px');
    root.style.setProperty('--canvas-height', canvas.clientHeight + 'px');
    canvas.onresize = () => {
        root.style.setProperty('--canvas-width', canvas.clientWidth + 'px');
        root.style.setProperty('--canvas-height', canvas.clientHeight + 'px');
    };
};

function initCube() {
    // Cube materials
    const materials = {
        'white': new THREE.MeshPhongMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetUnits: 1000 }),
        'green': new THREE.MeshPhongMaterial({ color: 0x00ff00, polygonOffset: true, polygonOffsetUnits: 1000 }),
        'red': new THREE.MeshPhongMaterial({ color: 0xFF0000, polygonOffset: true, polygonOffsetUnits: 1000 }),
        'blue': new THREE.MeshPhongMaterial({ color: 0x0000FF, polygonOffset: true, polygonOffsetUnits: 1000 }),
        'orange': new THREE.MeshPhongMaterial({ color: 0xdd5e00, polygonOffset: true, polygonOffsetUnits: 1000 }),
        'yellow': new THREE.MeshPhongMaterial({ color: 0xffff00, polygonOffset: true, polygonOffsetUnits: 1000 }),
        'gray': new THREE.MeshPhongMaterial({ color: 0xdddddd, polygonOffset: true, polygonOffsetUnits: 1000 })
    };

    const geometry = new THREE.BoxGeometry();

    function createCube(position, materials) {
        const cube = new THREE.Mesh(geometry, materials);
        scene.add(cube);
        cube.position.set(...position);

        // Border
        const geo = new THREE.EdgesGeometry(cube.geometry);
        const mat = new THREE.LineBasicMaterial({ color: 0x000000 });

        const wireFrame = new THREE.LineSegments(geo, mat);
        cube.add(wireFrame);

        return cube;
    };

    const cords = [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1],
        [1, 1, 0],
        [-1, -1, 0],
        [1, 0, 1],
        [-1, 0, -1],
        [1, -1, 0],
        [-1, 1, 0],
        [1, 0, -1],
        [-1, 0, 1],
        [0, 1, 1],
        [0, -1, -1],
        [0, 1, -1],
        [0, -1, 1],
        [1, 1, 1],
        [1, 1, -1],
        [1, -1, 1],
        [-1, 1, 1],
        [1, -1, -1],
        [-1, 1, -1],
        [-1, -1, 1],
        [-1, -1, -1]
    ];
    const materialsNames = ['red', 'orange', 'white', 'yellow', 'green', 'blue'];
    const materialKits = [
        [0],
        [1],
        [2],
        [3],
        [4],
        [5],
        [0, 2],
        [1, 3],
        [0, 4],
        [1, 5],
        [0, 3],
        [1, 2],
        [0, 5],
        [1, 4],
        [2, 4],
        [3, 5],
        [2, 5],
        [3, 4],
        [0, 2, 4],
        [0, 2, 5],
        [0, 3, 4],
        [1, 2, 4],
        [0, 3, 5],
        [1, 2, 5],
        [1, 3, 4],
        [1, 3, 5]
    ];

    // Generate parts of a cube
    for (let i = 0; i < 26; i++) {
        const pos = cords[i];
        const materialsToApply = [materials['gray'], materials['gray'], materials['gray'], materials['gray'], materials['gray'], materials['gray']];
        const materialKit = materialKits[i];
        if (materialKit.length > 1) {
            for (const i of materialKit) {
                materialsToApply[i] = materials[materialsNames[i]];
            };
        } else materialsToApply[i] = materials[materialsNames[i]];
        RubiksCube.push(createCube(pos, materialsToApply));
    };

    // Create object for rotate a group of objects
    rotator = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0, transparent: true }));
    rotator.scale.set(3.001, 3.001, 3.001);
    scene.add(rotator);
};

function aspectSize(availableWidth, availableHeight) {
    const currentRatio = availableWidth / availableHeight;
    if (currentRatio > 1) {
        //then the height is the limiting factor
        return {
            width: availableHeight,
            height: availableHeight
        };
    } else {
        // the width is the limiting factor
        return {
            width: availableWidth,
            height: availableWidth
        };
    };
};


function animate() {
    requestAnimationFrame(animate);

    controls.update();
    rotateUpdate();

    renderer.render(scene, camera);
};

init();
animate();


export { camera, scene, controls, RubiksCube, rotator, absoluteAxises, renderer };