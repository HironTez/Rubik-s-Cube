import * as THREE from './otherScripts/three.module.js';

import { OrbitControls } from './otherScripts/OrbitControls.js';


let RubiksCube = [], scene, camera, renderer, controls, mouse = {x: 0, y: 0, down: false}, intersected, oldIntersected, nimiCubesSides, intersectedSide, oldIntersectedSide, cubeSideToRotate, sideGroup, absoluteAxises, rotate = {'rotate': false, 'clockwise': true, 'axis': 'y'};


function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight - 1);

    window.onresize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight - 1);
    };

    document.body.appendChild(renderer.domElement);

    // cube
    const materials = {
        'white': new THREE.MeshPhongMaterial({color: 0xffffff}),
        'green': new THREE.MeshPhongMaterial({color: 0x00ff00}),
        'red': new THREE.MeshPhongMaterial({color: 0xFF0000}),
        'blue': new THREE.MeshPhongMaterial({color: 0x0000FF}),
        'orange': new THREE.MeshPhongMaterial({color: 0xdd5e00}),
        'yellow': new THREE.MeshPhongMaterial({color: 0xffff00})
    };

    const geometry = new THREE.BoxGeometry();
    function createCube(position) {
        // const material = new THREE.MeshPhongMaterial({color: 0x00ff00, flatShading: true});
        const cube = new THREE.Mesh(geometry, [materials['red'], materials['orange'], materials['white'], materials['yellow'], materials['green'], materials['blue']]);
        scene.add(cube);
        cube.position.set(...position);

        // Border
        const geo = new THREE.EdgesGeometry(cube.geometry);
        const mat = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 1});
        const wireframe = new THREE.LineSegments(geo, mat);
        wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
        cube.add(wireframe);
        
        return cube;
    }
    const cords = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [1, 1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, -1], [1, -1, 0], [-1, 1, 0], [1, 0, -1], [-1, 0, 1], [0, 1, 1], [0, -1, -1], [0, 1, -1], [0, -1, 1], [1, 1, 1], [1, 1, -1], [1, -1, 1], [-1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]];
    nimiCubesSides = {0: {x: 0, y: 1.57, z: 0}, 1: {x: 0, y: -1.57, z: 0}, 2: {x: -1.57, y: 0, z: 0}, 3: {x: 1.57, y: 0, z: 0}, 4: {x: 0, y: 0, z: 0}, 5: {x: 0, y: 3.14, z: 0}};
    for (let pos of cords) {
        RubiksCube.push(createCube(pos));
    }

    // lights
    const dirLight1 = new THREE.DirectionalLight(0xffffff);
    dirLight1.position.set(0, 0, 1);
    camera.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x303030);
    dirLight2.position.set(2, 2, 1);
    camera.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0x303030);
    dirLight3.position.set(-2, -2, 1);
    camera.add(dirLight3);

    const dirLight4 = new THREE.DirectionalLight(0x303030);
    dirLight4.position.set(2, -2, 1);
    camera.add(dirLight4);

    const dirLight5 = new THREE.DirectionalLight(0x303030);
    dirLight5.position.set(-2, 2, 1);
    camera.add(dirLight5);


    // controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents(window); // optional

    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;

    controls.screenSpacePanning = false;

    controls.minDistance = 6;
    controls.maxDistance = 20;

    controls.mouseButtons = {
        RIGHT: THREE.MOUSE.ROTATE
    }
    controls.touches = {
        TWO: THREE.TOUCH.DOLLY_ROTATE
    }

    // Create object for rotate a group of objects
    sideGroup = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0, transparent: true}));
    sideGroup.scale.set(3.001, 3.001, 3.001);
    scene.add(sideGroup);

    // Object for absolute positioning in space
    absoluteAxises = new THREE.Vector3();

    // Add events llistener
    document.addEventListener('mousedown', onDocumentMouseDown);
    document.addEventListener('touchstart', onDocumentTouchDown);
    document.addEventListener('mousemove', onDocumentMouseMove);
    document.addEventListener('touchmove', onDocumentTouchMove);
    document.addEventListener('pointerup', onDocumentMouseUp);
}


function update() {
    if (rotate['rotate'] == true) {
        // Turning distance
        let rad = THREE.Math.degToRad(90) / 50;
        // Determination of direction
        if (rotate['clockwise'] == false) rad = -rad;
        
        // Rotate
        if (rotate['axis'] == 'x') sideGroup.rotateX(rad);
        else if (rotate['axis'] == 'y') sideGroup.rotateY(rad);
        else if (rotate['axis'] == 'z') sideGroup.rotateZ(rad);

        // if the sides are aligned
        if (Number((sideGroup.rotation.x + (Math.PI / 2)).toFixed(2)) % 0.785 == 0 && rotate['axis'] == 'x') {
            finishRotate();
        }
        else if (Number((sideGroup.rotation.y + (Math.PI / 2)).toFixed(2)) % 0.785 == 0 && rotate['axis'] == 'y') {
            finishRotate();
        }
        else if (Number((sideGroup.rotation.z + (Math.PI / 2)).toFixed(2)) % 0.785 == 0 && rotate['axis'] == 'z') {
            finishRotate();
        }
    }
}


function rotateSide(side, hatch=false) {
    if (rotate['rotate'] == true) return

    let rotation;
    if (!hatch) {
        rotation = -(Math.PI / 2); // THREE.Math.degToRad(90)
    }
    else if (hatch) {
        rotation = Math.PI / 2;
    }

    function settingCube(cube, center=false) {
        // Add mini cube to rotator
        sideGroup.add(cube);
        
        if (sideGroup.children.length == 9 || sideGroup.children.length == 8 && center) return true;
    }
    for (let index in RubiksCube) {
        let cube = RubiksCube[index];

        let x = cube.position.x, y = cube.position.y, z = cube.position.z;
        if (side == 'top' && y == 1 && settingCube(cube)) startRotate(!hatch, 'y'); // Settings cube and start rotate
        else if (side == 'front' && z == 1 && settingCube(cube)) startRotate(!hatch, 'z');
        else if (side == 'right' && x == 1 && settingCube(cube)) startRotate(hatch, 'x');
        else if (side == 'back' && z == -1 && settingCube(cube)) startRotate(!hatch, 'z');
        else if (side == 'left' && x == -1 && settingCube(cube)) startRotate(hatch, 'x');
        else if (side == 'down' && y == -1 && settingCube(cube)) startRotate(!hatch, 'y');
        else if (side == 'centerXY' && z == 0 && settingCube(cube, true)) startRotate(!hatch, 'z');
        else if (side == 'centerXZ' && y == 0 && settingCube(cube, true)) startRotate(!hatch, 'y');
        else if (side == 'centerYZ' && x == 0 && settingCube(cube, true)) startRotate(hatch, 'x');
    }
    
    function startRotate(clockwise, axis) {
        // Settings rotator
        sideGroup.scale.set(1, 1, 1)
        rotate['axis'] = axis;
        rotate['clockwise'] = clockwise;
        // Start rotate
        rotate['rotate'] = true;
    }
}

function finishRotate() {
    // Stop rotation
    rotate['rotate'] = false;

    // Remove children from rotator
    for (var i = sideGroup.children.length - 1; i >= 0; i--) { 
        // Get child
        let obj = sideGroup.children[i];
        // Get object absolute position
        let absolutePosition = obj.getWorldPosition(absoluteAxises);

        // Remove object from perent and add to scene
        sideGroup.remove(obj);
        scene.add(obj);
        
        // Save position
        obj.position.set(Number(absolutePosition.x.toFixed(0)), Number(absolutePosition.y.toFixed(0)), Number(absolutePosition.z.toFixed(0)));

        // Get absolute rotation
        const euler = new THREE.Euler();
        euler.setFromRotationMatrix(obj.matrixWorld);

        // Save rotation
        obj.rotation.set(euler.x, euler.y, euler.z)
    }

    // Remove rotator rotation
    sideGroup.rotation.set(0, 0, 0);
    // Enlarge rotator
    sideGroup.scale.set(3.001, 3.001, 3.001);
}


function onDocumentMouseDown(event) {
    if (event.which == 1) onDocumentPointerDown(event);
}
function onDocumentTouchDown(event) {
    if (event.touches.length == 1) onDocumentPointerDown(event.touches[0]);
}
function onDocumentPointerDown(touch) {
    mouse.down = true;
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
	mouse.y = - (touch.clientY / window.innerHeight) * 2 + 1;
    try {
        const intersect = currentObjectHover();
        oldIntersected = intersect[0].object;
        oldIntersectedSide = intersect[1];
    }
    catch {}
}
function onDocumentMouseMove(event) {
    onDocumentPointerMove(event);
}
function onDocumentTouchMove(event) {
    if (event.touches.length == 1) onDocumentPointerMove(event.touches[0]);
}
function onDocumentPointerMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    if (mouse.down == true && rotate['rotate'] == false) {
        const intersect = currentObjectHover();
        if (intersect == undefined) return
        const intersectObject = intersect[0], intersectSide = intersect[1];
        if (intersectObject != undefined) {
            if (intersected != oldIntersected) {
                if (oldIntersectedSide == undefined || oldIntersected == undefined) {
                    if (oldIntersectedSide == undefined) oldIntersectedSide = intersectSide;
                    if (oldIntersected == undefined) oldIntersected = intersected;
                    return
                }
                if (JSON.stringify(intersectSide) == JSON.stringify(oldIntersectedSide)) {
                    const pos = intersected.position, oldPos = oldIntersected.position;
                    // If not front side
                    let prohibitRotation = [pos.x, oldPos.x, pos.z, oldPos.z, pos.y, oldPos.y];
                    if (intersectSide != 4) {
                        // If red
                        if (intersectSide == 0) prohibitRotation = [pos.x, oldPos.x, pos.y, oldPos.y, pos.z, oldPos.z];
                        else if (intersectSide == 1) prohibitRotation;
                        else if (intersectSide == 2) prohibitRotation;
                        else if (intersectSide == 3) prohibitRotation;
                        else if (intersectSide == 5) prohibitRotation;
                    }

                    if (pos.x == oldPos.x && intersectSide != 0 && intersectSide != 1) {
                        if (pos.x == 1) cubeSideToRotate = 'right';
                        else if (pos.x == -1) cubeSideToRotate = 'left';
                    }
                    else if (pos.y == oldPos.y && intersectSide != 2 && intersectSide != 3) {
                        if (pos.y == 1) cubeSideToRotate = 'top';
                        else if (pos.y == -1) cubeSideToRotate = 'down';
                    }
                    else if (pos.z == oldPos.z) {
                        if (pos.z == 1) cubeSideToRotate = 'front';
                        else if (pos.z == -1) cubeSideToRotate = 'back';
                    }

                    // If it's center
                    if (JSON.stringify(pos).split(0).length >= 2) {
                        if (pos.x == oldPos.x && pos.x == 0) cubeSideToRotate = 'centerYZ';
                        else if (pos.y == oldPos.y && pos.y == 0) cubeSideToRotate = 'centerXZ';
                        else if (pos.z == oldPos.z && pos.z == 0) cubeSideToRotate = 'centerXY';
                    }

                    let clockwise = false;
                    if (pos.x > oldPos.x || pos.y > oldPos.y || pos.z < oldPos.z) clockwise = true;
                    if (intersectSide == 1 || intersectSide == 3 || intersectSide == 5) clockwise = !clockwise;
                    if (pos.z == oldPos.z && (intersectSide == 2 || intersectSide == 3)) clockwise = !clockwise;
                    rotateSide(cubeSideToRotate, !clockwise);
                }
                oldIntersected = intersected;
            }
        }
    }
}
function onDocumentMouseUp() {
    mouse.down = false;
}


function currentObjectHover() {
    var ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);
    
    // create an array containing all objects in the scene with which the ray intersects
    var intersects = ray.intersectObjects(scene.children);
    
    if (intersects.length > 0) {
        if (intersects[1] != undefined && intersected != intersects[1].object) {
            intersected = intersects[1].object;
        }
        let firstIntersectedMiniCube = intersects[1];
        let sideIndex = intersects[0].faceIndex;
        if (sideIndex % 2 == 1) sideIndex -= 1;
        sideIndex = sideIndex / 2;
        return [firstIntersectedMiniCube, sideIndex];
    }
}


function animate() {
    requestAnimationFrame(animate);

    controls.update();
    update();

    renderer.render(scene, camera);
}

init();
animate();