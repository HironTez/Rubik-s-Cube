import * as THREE from './otherScripts/three.module.js';

import { OrbitControls } from './otherScripts/OrbitControls.js';


let RubiksCube = [],
    scene, camera, renderer, controls, mouse = { x: 0, y: 0, down: false },
    intersected, oldIntersected, oldIntersectedSide, cubeSideToRotate, sideGroup, absoluteAxises, history = [],
    rotate = { 'rotate': false, 'clockwise': true, 'axis': 'y' };
const sides = ['r', 'l', 'u', 'd', 'f', 'b'],
    oppositeSides = ['lr', 'ud', 'fb'],
    displayScramble = document.querySelector('div#scramble');;


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

        const wireframe = new THREE.LineSegments(geo, mat);
        cube.add(wireframe);

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
    controls.maxDistance = 30;

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
        } else if (Number((sideGroup.rotation.y + (Math.PI / 2)).toFixed(2)) % 0.785 == 0 && rotate['axis'] == 'y') {
            finishRotate();
        } else if (Number((sideGroup.rotation.z + (Math.PI / 2)).toFixed(2)) % 0.785 == 0 && rotate['axis'] == 'z') {
            finishRotate();
        }
    }
}

function settingCubes(cube, center = false) {
    // Add mini cube to rotator
    sideGroup.add(cube);

    if (sideGroup.children.length == 9 || sideGroup.children.length == 8 && center) return true;
}

function rotateSide(side, clockwise = true) {
    if (rotate['rotate'] == true) return

    let rotation, axis;
    const oldClockwise = clockwise;
    if (!!clockwise) {
        rotation = -(Math.PI / 2); // THREE.Math.degToRad(90)
    } else if (!clockwise) {
        rotation = Math.PI / 2;
    }

    for (let index in RubiksCube) {
        let cube = RubiksCube[index];

        let x = cube.position.x,
            y = cube.position.y,
            z = cube.position.z;
        // Settings cube
        if (side == 'u' && y == 1 && settingCubes(cube)) {
            clockwise = !clockwise;
            axis = 'y';
        } else if (side == 'f' && z == 1 && settingCubes(cube)) {
            clockwise = !clockwise;
            axis = 'z';
        } else if (side == 'r' && x == 1 && settingCubes(cube)) {
            clockwise = !clockwise;
            axis = 'x';
        } else if (side == 'b' && z == -1 && settingCubes(cube)) {
            axis = 'z';
        } else if (side == 'l' && x == -1 && settingCubes(cube)) {
            axis = 'x';
        } else if (side == 'd' && y == -1 && settingCubes(cube)) {
            axis = 'y';
        } else if (side == 'centerXY' && z == 0 && settingCubes(cube, true)) {
            clockwise = !clockwise;
            axis = 'z';
        } else if (side == 'centerXZ' && y == 0 && settingCubes(cube, true)) {
            clockwise = !clockwise;
            axis = 'y';
        } else if (side == 'centerYZ' && x == 0 && settingCubes(cube, true)) {
            axis = 'x';
        }
    }
    if (axis != undefined) {
        startRotate(clockwise, axis);
        AddMoveToHistory([side, oldClockwise, false]);
    }
}

function startRotate(clockwise, axis) {
    // Settings rotator
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
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    try {
        const intersect = currentObjectHover();
        oldIntersected = intersect[0].object;
        oldIntersectedSide = intersect[1];
    } catch {}
}

function onDocumentMouseMove(event) {
    onDocumentPointerMove(event);
}

function onDocumentTouchMove(event) {
    if (event.touches.length == 1) onDocumentPointerMove(event.touches[0]);
}

function onDocumentPointerMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    // If mouse is down (drag) and nothing rotate
    if (mouse.down == true && rotate['rotate'] == false) {
        // Get data where the mouse is hovering
        const intersect = currentObjectHover();
        if (intersect == undefined) return
        const intersectObject = intersect[0],
            intersectSide = intersect[1];
        // If current hover object != undefined
        if (intersectObject != undefined) {
            // If the mouse has moved to another mini-cube
            if (intersected != oldIntersected) {
                // If the mouse has not yet been over other mini-cubes
                if (oldIntersectedSide == undefined || oldIntersected == undefined) {
                    if (oldIntersectedSide == undefined) oldIntersectedSide = intersectSide;
                    if (oldIntersected == undefined) oldIntersected = intersected;
                    return
                }
                // If the mouse is over the same side of the cube as before
                if (JSON.stringify(intersectSide) == JSON.stringify(oldIntersectedSide)) {
                    const pos = intersected.position,
                        oldPos = oldIntersected.position;

                    // Detect which side need to rotate
                    if (pos.x == oldPos.x && intersectSide != 0 && intersectSide != 1) {
                        if (pos.x == 1) cubeSideToRotate = 'r';
                        else if (pos.x == -1) cubeSideToRotate = 'l';
                    } else if (pos.y == oldPos.y && intersectSide != 2 && intersectSide != 3) {
                        if (pos.y == 1) cubeSideToRotate = 'u';
                        else if (pos.y == -1) cubeSideToRotate = 'd';
                    } else if (pos.z == oldPos.z) {
                        if (pos.z == 1) cubeSideToRotate = 'f';
                        else if (pos.z == -1) cubeSideToRotate = 'b';
                    }

                    // If it's center
                    if (JSON.stringify(pos).split(0).length >= 2) {
                        if (pos.x == oldPos.x && pos.x == 0) cubeSideToRotate = 'centerYZ';
                        else if (pos.y == oldPos.y && pos.y == 0) cubeSideToRotate = 'centerXZ';
                        else if (pos.z == oldPos.z && pos.z == 0) cubeSideToRotate = 'centerXY';
                    }

                    // Determine which direction to turn
                    let clockwise = false;
                    if (pos.x > oldPos.x || pos.y > oldPos.y || pos.z < oldPos.z) clockwise = true;
                    if (intersectSide == 1 || intersectSide == 3 || intersectSide == 5) clockwise = !clockwise;
                    if (pos.z == oldPos.z && (intersectSide == 2 || intersectSide == 3)) clockwise = !clockwise;
                    if (cubeSideToRotate == 'r' || cubeSideToRotate == 'd' || cubeSideToRotate == 'b') clockwise = !clockwise;

                    // Rotate side
                    rotateSide(cubeSideToRotate, !clockwise);
                }
                // Update old intersected object
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
async function twistByFormula(formula) {
    for (let action of formula) {
        // Wait while something rotates
        while (rotate['rotate'] != false) await sleep(100);
        // If not double rotate
        if (!action[2]) {
            rotateSide(action[0], action[1]);
        }
        // If double rotate
        else if (action[2]) {
            rotateSide(action[0]);
            while (rotate['rotate'] != false) await sleep(100);
            rotateSide(action[0]);
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
    await twistByFormula(formula);
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