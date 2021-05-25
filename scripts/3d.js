import * as THREE from './otherScripts/three.module.js';

import { OrbitControls } from './otherScripts/OrbitControls.js';


let RubiksCube = [],
    scene, camera, renderer, controls, mouse = { x: 0, y: 0, down: false },
    intersected, cubeSideToRotate, sideGroup, absoluteAxises, history = [],
    rotate = { 'rotate': false, 'clockwise': true, 'axis': 'y' },
    movement = {axisOfMovement: undefined, axis: 'y', oldPos: {x: null, y: null}, clockwise: true, cameraOnAxisZ: true},
    speedRotate = 2.9;
const sides = ['r', 'l', 'u', 'd', 'f', 'b'],
    oppositeSides = ['lr', 'ud', 'fb'],
    displayScramble = document.querySelector('div#scramble');

document.querySelector('input#speed').addEventListener("change", function() {
    speedRotate = document.querySelector('input#speed').value;
    speedRotate = speedRotate == 2? 2.9: (speedRotate == 1? 3.9: 1.9);
});


function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight - 1);

    window.onresize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight - 1);
    };

    document.body.appendChild(renderer.domElement);

    // cube
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
        // const material = new THREE.MeshPhongMaterial({color: 0x00ff00, flatShading: true});
        const cube = new THREE.Mesh(geometry, materials); // [materials['red'], materials['orange'], materials['white'], materials['yellow'], materials['green'], materials['blue']]
        scene.add(cube);
        cube.position.set(...position);

        // Border
        const geo = new THREE.EdgesGeometry(cube.geometry);
        const mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });

        const wireFrame = new THREE.LineSegments(geo, mat);
        cube.add(wireFrame);

        return cube;
    }
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
        let pos = cords[i];
        let materialsToApply = [materials['gray'], materials['gray'], materials['gray'], materials['gray'], materials['gray'], materials['gray']];
        let materialKit = materialKits[i];
        if (materialKit.length > 1) {
            for (let i of materialKit) {
                materialsToApply[i] = materials[materialsNames[i]];
            }
        } else materialsToApply[i] = materials[materialsNames[i]];
        RubiksCube.push(createCube(pos, materialsToApply));
    }

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
    }
    controls.touches = {
        TWO: THREE.TOUCH.DOLLY_ROTATE
    }


    // Create object for rotate a group of objects
    sideGroup = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0, transparent: true }));
    sideGroup.scale.set(3.001, 3.001, 3.001);
    scene.add(sideGroup);

    // Object for absolute positioning in space
    absoluteAxises = new THREE.Vector3();

    // Add events listener
    document.addEventListener('mousedown', onDocumentMouseDown);
    document.addEventListener('touchstart', onDocumentTouchDown);
    document.addEventListener('mousemove', onDocumentMouseMove);
    document.addEventListener('touchmove', onDocumentTouchMove);
    document.addEventListener('pointerup', onDocumentMouseUp);

    // Add function for button "shuffle"
    const buttonShuffle = document.querySelector('button#shuffle-cube');
    buttonShuffle.onclick = shuffle;

    // Add function for button "solve"
    let solveButton = document.querySelector('button#solve-cube');
    solveButton.onclick = solveCube;
}


function update() {
    if (rotate['rotate'] == true) {
        let x = sideGroup.rotation[rotate['axis']];
        // x must be greater than 0
        x = x != 0? (x > 0? x : -x): x + 0.01;
        // Turning distance
        let rad = Math.sin(x * 2) / speedRotate;
        
        // Determination of direction
        if (rotate['clockwise'] == false) rad = -rad;
        
        // Rotate
        if (rotate['axis'] == 'x') sideGroup.rotateX(rad);
        else if (rotate['axis'] == 'y') sideGroup.rotateY(rad);
        else if (rotate['axis'] == 'z') sideGroup.rotateZ(rad);

        // If the sides are roughly aligned
        if (Number((sideGroup.rotation[rotate['axis']]).toFixed(2)) % 1.57 == 0) {
            sideGroup.rotation[rotate['axis']] = closest(sideGroup.rotation[rotate['axis']], [-Math.PI, -Math.PI / 2, 0, Math.PI, Math.PI / 2]) // Align exactly
            finishRotate(); // Stop rotate
        }
    }
}

function setUpCubes(cube, center = false) {
    // Add mini cube to rotator
    sideGroup.add(cube);

    if (sideGroup.children.length == 9 || sideGroup.children.length == 8 && center) return true;
}

function rotateSide(side, clockwise = true, solve=false) {
    if (rotate['rotate'] == true) return

    let rotation, axis;
    const oldClockwise = clockwise;
    if (clockwise) {
        rotation = -(Math.PI / 2);
    } else if (!clockwise) {
        rotation = Math.PI / 2;
    }

    for (const cube of RubiksCube) {

        let x = cube.position.x,
            y = cube.position.y,
            z = cube.position.z;
        // Set up cube
        if (side == 'u' && y == 1 && setUpCubes(cube)) {
            clockwise = !clockwise;
            axis = 'y';
        } else if (side == 'f' && z == 1 && setUpCubes(cube)) {
            clockwise = !clockwise;
            axis = 'z';
        } else if (side == 'r' && x == 1 && setUpCubes(cube)) {
            clockwise = !clockwise;
            axis = 'x';
        } else if (side == 'b' && z == -1 && setUpCubes(cube)) {
            axis = 'z';
        } else if (side == 'l' && x == -1 && setUpCubes(cube)) {
            axis = 'x';
        } else if (side == 'd' && y == -1 && setUpCubes(cube)) {
            axis = 'y';
        } else if (side == 'centerXY' && z == 0 && setUpCubes(cube, true)) {
            clockwise = !clockwise;
            axis = 'z';
        } else if (side == 'centerXZ' && y == 0 && setUpCubes(cube, true)) {
            clockwise = !clockwise;
            axis = 'y';
        } else if (side == 'centerYZ' && x == 0 && setUpCubes(cube, true)) {
            axis = 'x';
        }
    }
    if (axis != undefined) {
        startRotate(clockwise, axis);
        if (solve == false) AddMoveToHistory([side, oldClockwise, false]);
    }
}

function startRotate(clockwise, axis) {
    // Set up rotator
    sideGroup.scale.set(1, 1, 1)
    rotate['axis'] = axis;
    rotate['clockwise'] = clockwise;
    // Start rotate
    rotate['rotate'] = true;
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
        // Save position
        obj.position.set(Math.round(absolutePosition.x), Math.round(absolutePosition.y), Math.round(absolutePosition.z));
        
        // Get absolute rotation
        const euler = new THREE.Euler();
        euler.setFromRotationMatrix(obj.matrixWorld);

        // Save rotation
        obj.rotation.set(euler.x, euler.y, euler.z);

        // Remove object from parent and add to scene
        sideGroup.remove(obj);
        scene.add(obj);
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
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;
    mouse.touchStartX = mouse.x;
    mouse.touchStartY = mouse.y;
    movement.oldPos.x = mouse.x;
    movement.oldPos.y = mouse.y;
}

function onDocumentMouseMove(event) {
    onDocumentPointerMove(event);
}

function onDocumentTouchMove(event) {
    if (event.touches.length == 1) onDocumentPointerMove(event.touches[0]);
}

function onDocumentPointerMove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    // If mouse is down (drag) and nothing rotate
    if (mouse.down == true && rotate['rotate'] == false) {
        // If axis of movement direction != undefined
        if (movement.axisOfMovement == undefined) {
            // Get data where the mouse is hovering
            const intersect = currentObjectHover();
            if (intersect == undefined) return
            const intersectSide = intersect[1];
            let deviationInX = mouse.x - mouse.touchStartX;
            let deviationInY = mouse.y - mouse.touchStartY;
            if (deviationInX < 0) deviationInX = -deviationInX;
            if (deviationInY < 0) deviationInY =  -deviationInY
            if (deviationInX + deviationInY >= 0.005) {
                movement.axisOfMovement = deviationInX > deviationInY? 'x': 'y';
                const pos = intersected.position;
                const cameraOnAxisZ = ((camera.position.z > 0)? ((camera.position.x > 0)? (camera.position.z > camera.position.x): (camera.position.z > -camera.position.x)): ((camera.position.x > 0)? (-camera.position.z > camera.position.x): (-camera.position.z > -camera.position.x)));

                // Detect which side need to rotate
                if (movement.axisOfMovement == 'x') {
                    if (intersectSide != 2 && intersectSide != 3) {
                        if (pos.y == 1) cubeSideToRotate = 'u';
                        else if (pos.y == 0) cubeSideToRotate = 'centerXZ';
                        else if (pos.y == -1) cubeSideToRotate = 'd';
                    } else if ((intersectSide == 2 || intersectSide == 3) && cameraOnAxisZ) {
                        if (pos.z == 1) cubeSideToRotate = 'f';
                        else if (pos.z == 0) cubeSideToRotate = 'centerXY';
                        else if (pos.z == -1) cubeSideToRotate = 'b';
                    } else if ((intersectSide == 2 || intersectSide == 3) && !cameraOnAxisZ) {
                        if (pos.x == -1) cubeSideToRotate = 'l';
                        else if (pos.x == 0) cubeSideToRotate = 'centerYZ';
                        else if (pos.x == 1) cubeSideToRotate = 'r';
                    }
                } else if (movement.axisOfMovement == 'y') {
                    if (intersectSide != 0 && intersectSide != 1 && !((intersectSide == 2 || intersectSide == 3) && !cameraOnAxisZ)) {
                        if (pos.x == -1) cubeSideToRotate = 'l';
                        else if (pos.x == 0) cubeSideToRotate = 'centerYZ';
                        else if (pos.x == 1) cubeSideToRotate = 'r';
                    } else if ((intersectSide == 0 || intersectSide == 1)) {
                        if (pos.z == 1) cubeSideToRotate = 'f';
                        else if (pos.z == 0) cubeSideToRotate = 'centerXY';
                        else if (pos.z == -1) cubeSideToRotate = 'b';
                    } else if ((intersectSide == 2 || intersectSide == 3) && !cameraOnAxisZ) {
                        if (pos.z == 1) cubeSideToRotate = 'f';
                        else if (pos.z == 0) cubeSideToRotate = 'centerXY';
                        else if (pos.z == -1) cubeSideToRotate = 'b';
                    }
                }

                let axis;
                let clockwise = movement.axisOfMovement == 'x'? (mouse.x - mouse.touchStartX) > 0: (mouse.y - mouse.touchStartY) > 0;
                for (const cube of RubiksCube) {
                    let x = cube.position.x,
                        y = cube.position.y,
                        z = cube.position.z;
                    // Set up cube
                    if (cubeSideToRotate == 'u' && y == 1 && setUpCubes(cube)) {
                        clockwise = !clockwise;
                        axis = 'y';
                    } else if (cubeSideToRotate == 'f' && z == 1 && setUpCubes(cube)) {
                        clockwise = !clockwise;
                        axis = 'z';
                    } else if (cubeSideToRotate == 'r' && x == 1 && setUpCubes(cube)) {
                        clockwise = !clockwise;
                        axis = 'x';
                    } else if (cubeSideToRotate == 'b' && z == -1 && setUpCubes(cube)) {
                        axis = 'z';
                    } else if (cubeSideToRotate == 'l' && x == -1 && setUpCubes(cube)) {
                        axis = 'x';
                    } else if (cubeSideToRotate == 'd' && y == -1 && setUpCubes(cube)) {
                        axis = 'y';
                    } else if (cubeSideToRotate == 'centerXY' && z == 0 && setUpCubes(cube, true)) {
                        clockwise = !clockwise;
                        axis = 'z';
                    } else if (cubeSideToRotate == 'centerXZ' && y == 0 && setUpCubes(cube, true)) {
                        clockwise = !clockwise;
                        axis = 'y';
                    } else if (cubeSideToRotate == 'centerYZ' && x == 0 && setUpCubes(cube, true)) {
                        axis = 'x';
                    }
                }

                // Allow to rotate side
                sideGroup.scale.set(1, 1, 1);
                movement['axis'] = axis;
                movement['side'] = cubeSideToRotate;
                movement['intersectSide'] = intersectSide;
                movement['clockwise'] = clockwise;
                movement['cameraOnAxisZ'] = cameraOnAxisZ;
            }
        } else {
            // Calculate mouse deviation
            let deviationInX = mouse.x - movement.oldPos.x;
            let deviationInY = mouse.y - movement.oldPos.y;
            // Calculate rad to rotate
            let rad = (movement['axis'] == 'y'? deviationInX:
                ((movement['intersectSide'] == 2 || movement['intersectSide'] == 3) && movement['axisOfMovement'] == 'x'? deviationInX: deviationInY)) / (speedRotate == 2.9? 200: (speedRotate == 3.9? 300: 100));
            // Set up rad
            if (movement['intersectSide'] == 5 && movement['axis'] == 'x') rad = -rad;
            else if ((movement['intersectSide'] == 0 || movement['intersectSide'] == 2) && movement['axis'] == 'z') rad = -rad;
            if (movement['intersectSide'] == 2 && ((!movement['cameraOnAxisZ'] && ((movement['axis'] == 'x' && camera.position.x > 0) || (movement['axis'] == 'z' && camera.position.x < 0)) || (movement['cameraOnAxisZ'] && camera.position.z < 0)))) rad = -rad;
            else if (movement['intersectSide'] == 3 && ((!movement['cameraOnAxisZ'] && ((movement['axis'] == 'z' && camera.position.x > 0) || (movement['axis'] == 'x' && camera.position.x < 0)) || (movement['cameraOnAxisZ'] && camera.position.z < 0)))) rad = -rad;
            // Rotate
            if (movement['axis'] == 'x') sideGroup.rotateX(rad);
            else if (movement['axis'] == 'y') sideGroup.rotateY(rad);
            else if (movement['axis'] == 'z') sideGroup.rotateZ(rad);

            // Update old mouse position
            movement.oldPos.x = mouse.x;
            movement.oldPos.y = mouse.y;
        }
    }
}

function onDocumentMouseUp() {
    // Stop rotate by mouse
    mouse.down = false;
    
    // Get side rotation
    const rad = getObjectRotationInRad(sideGroup, movement['axis']);
    
    // Exit if neither side has been turned or the cube is already rotating
    if ((rad == 0) || (rotate['rotate'] == true)) return;
    
    // Calculate direction to complete movement
    let closestTarget = closest(rad, [0, Math.PI / 2, Math.PI, Math.PI * 1.5, Math.PI * 2]);
    if (closestTarget == Math.PI * 2) closestTarget = 0;
    let rotateClockwise = closestTarget > rad? true: false;
    if (((closestTarget == 0) && (rad > Math.PI * 1.5)) || ((movement['axis'] != 'y') && (((closestTarget == Math.PI / 2) && (rad > closestTarget)) || (closestTarget == Math.PI) || ((closestTarget == Math.PI * 1.5) && (rad < closestTarget))))) rotateClockwise = !rotateClockwise;
    
    // Set up rotator
    rotate['rotate'] = true;
    rotate['clockwise'] = rotateClockwise;
    rotate['axis'] = movement['axis'];
    
    // Add move to history
    if ((closestTarget != 0) && (closestTarget != Math.PI * 2)) {
        // Calculate clockwise direction with triple rotation support
        const newClockwise = (movement.axisOfMovement == 'x'? (mouse.x - mouse.touchStartX) > 0: (mouse.y - mouse.touchStartY) > 0) == (rad <= Math.PI)? movement['clockwise']: !movement['clockwise'];
        // Add to history
        AddMoveToHistory([movement['side'], newClockwise, closestTarget == Math.PI])
    }
    
    // Reset value
    movement.axisOfMovement = undefined;
}


function currentObjectHover() {
    var ray = new THREE.Raycaster();
    ray.setFromCamera({x: (mouse.x / window.innerWidth) * 2 - 1, y: -((mouse.y / window.innerHeight) * 2 - 1)}, camera);

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

function getObjectRotationInRad(obj, axis) {
    let rad = obj.rotation[axis];
    const otherAxises = 'xyz'.replace(axis, '');
    if ((obj.rotation[otherAxises[0]] < 0 || obj.rotation[otherAxises[0]] > 0) || (obj.rotation[otherAxises[1]] < 0 || obj.rotation[otherAxises[1]] > 0)) rad = Math.PI - rad;
    else if (rad < 0) rad += Math.PI * 2;
    return rad;
}


function getRandomSide() {
    const side = sides[Math.floor(Math.random() * sides.length)];
    return side
}

function getRandomDirection() {
    const clockWise = Math.round(Math.random());
    let double = Math.round(Math.random() * 2);
    if (double == 2) double = true;
    else double = false;
    return { 'clockWise': clockWise, 'double': double };
}

function availableToRotate(side, previousSide, beforeThePreviousSide) {
    if (side == previousSide) {
        return false;
    }
    // Check if the sides are opposite
    if ((side == beforeThePreviousSide) && ((oppositeSides[0].includes(side) && oppositeSides[0].includes(previousSide)) || (oppositeSides[1].includes(side) && oppositeSides[1].includes(previousSide)) || (oppositeSides[2].includes(side) && oppositeSides[2].includes(previousSide)))) {
        return false;
    }
    return true;
}

function generateScramble() {
    let scramble = [];
    for (let i = 0; i < 20; i++) {
        let side = getRandomSide();
        if (i > 0) {
            let beforeThePreviousSide = null;
            if (scramble[i - 2] != undefined) beforeThePreviousSide = scramble[i - 2][0];
            while (!availableToRotate(side, scramble[i - 1][0], beforeThePreviousSide)) side = getRandomSide();
        }
        const direction = getRandomDirection();
        scramble.push([side, direction['clockWise'], direction['double']]);
    }
    return scramble;
}

function scrambleToDisplayString(scramble) {
    let result = '';
    for (let action of scramble) {
        const side = action[0];
        const clockWise = action[1];
        const doubleRotation = action[2];
        result += side;
        if (doubleRotation) result += '2';
        else if (!clockWise) result += '\'';
        if (scramble.indexOf(action) < scramble.length - 1) result += ' ';
    }
    return result.toUpperCase();
}

/**
    @param {Array} formula
*/
async function twistByFormula(formula, solve=false) {
    for (let action of formula) {
        // Wait while something rotates
        while (rotate['rotate'] != false) await sleep(100);
        // If not double rotate
        if (!action[2]) {
            rotateSide(action[0], action[1], solve);
        }
        // If double rotate
        else if (action[2]) {
            rotateSide(action[0], true, solve);
            while (rotate['rotate'] != false) await sleep(100);
            rotateSide(action[0], true, solve);
        }
    }
}

function shuffle() {
    const scramble = generateScramble();
    displayScramble.innerText = scrambleToDisplayString(scramble);
    twistByFormula(scramble);
}

function AddMoveToHistory(move) {
    let lastMove = history[history.length - 1];
    let previousMove = history[history.length - 2];
    if (lastMove == undefined) {
        history.push(move);
        return
    } else if (previousMove == undefined) previousMove = [];
    // If the last 2 moves were doubles on the same side, then remove them from history
    if ((move[0] == lastMove[0]) && (lastMove[2] == true) && (move[2] == true)) {
        history.pop();
    }
    // If in the last 2 moves the side turned and came back then remove them from history
    else if ((move[0] == lastMove[0]) && (move[1] != lastMove[1]) && ((move[2] == false) && (lastMove[2] == false))) {
        history.pop();
    }
    // If the last move is a continuation of the previous one then replace them with one double
    else if ((move[0] == lastMove[0]) && (move[1] == lastMove[1]) && ((move[2] != true) && (lastMove[2] != true))) {
        history.pop();
        move[2] = true;
        history.push(move);
    }
    // If only one move is double
    else if ((move[0] == lastMove[0]) && (((move[2] == false) && (lastMove[2] == true)) || ((move[2] == true) && (lastMove[2] == false)))) {
        history.pop();
        // If the current move is double
        if (lastMove[2] == false) move = lastMove;
        // Change direction
        move[1] = !move[1];
        history.push(move);
    }
    // If the side of rotation is the same as the penultimate but the previous side is opposite, then combine the current and penultimate move
    else if ((move[0] == previousMove[0]) && ((oppositeSides[0].includes(move[0]) && oppositeSides[0].includes(lastMove[0])) || (oppositeSides[1].includes(move[0]) && oppositeSides[1].includes(lastMove[0])) || (oppositeSides[2].includes(move[0]) && oppositeSides[2].includes(lastMove[0])))) {
        // Remove previous move from list
        history.splice(-2, 1);
        // If the moves continue each other
        if ((move[1] == previousMove[1]) && (move[1] == previousMove[1]) && ((move[2] != true) && (previousMove[2] != true))) {
            move[2] = true;
            history.push(move);
        }
        // If only one move is double
        else if ((((move[2] == false) && (previousMove[2] == true)) || ((move[2] == true) && (previousMove[2] == false)))) {
            // If the current move is double
            if (previousMove[2] == false) move = previousMove;
            // Change direction
            move[1] = !move[1];
            history.push(move);
        }
    } else {
        history.push(move);
    }
    // If the penultimate 2 moves on one side are double
    if ((lastMove[0] == previousMove[0]) && (lastMove[2] == true) && (previousMove[2] == true)) {
        // Remove them
        history.splice(-3, 2);
    }
}

async function solveCube() {
    // Reverse history
    let formula;
    formula = history.reverse().slice();
    // Reverse direction of turns
    for (let move of formula) {
        if (move[2] == false) {
            move[1] = !move[1];
        }
    }
    // Rotates the sides of a cube using the formula
    await twistByFormula(formula, true);
    // Clear history
    history = [];
}


function animate() {
    requestAnimationFrame(animate);

    controls.update();
    update();

    renderer.render(scene, camera);
}

init();
animate();