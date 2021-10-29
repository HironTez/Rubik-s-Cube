import * as THREE from './otherScripts/three.module.js';

import { camera, scene, RubiksCube, rotator, absoluteAxises, renderer } from './3d.js';
import { AddMoveToHistory, autoRotate } from './auto.rotate.js';

let mouse = { x: 0, y: 0, down: false, downTime: null, touchStartX: 0, touchStartY: 0 }, cubeSideToRotate,
    rotate = { 'rotate': false, 'clockwise': true, 'axis': 'y' },
    movement = { axisOfMovement: undefined, axis: 'y', oldPos: { x: null, y: null }, clockwise: true, cameraOnAxisZ: true }, speedRotate = 2.9;


// Change speed rotate when slider is moved
document.querySelector('input#speed').addEventListener("change", function () {
    speedRotate = document.querySelector('input#speed').value;
    speedRotate = speedRotate == 2 ? 2.9 : (speedRotate == 1 ? 3.9 : 1.9);
});


function rotateUpdate() {
    if (rotate['rotate'] == true) {
        let x = rotator.rotation[rotate['axis']];
        // x must be greater than 0
        x = x != 0 ? (x > 0 ? x : -x) : x + 0.01;
        // Turning distance
        let rad = Math.sin(x * 2) / speedRotate;

        // Determination of direction
        if (rotate['clockwise'] == false) rad = -rad;

        // Rotate
        if (rotate['axis'] == 'x') rotator.rotateX(rad);
        else if (rotate['axis'] == 'y') rotator.rotateY(rad);
        else if (rotate['axis'] == 'z') rotator.rotateZ(rad);

        // If the sides are roughly aligned
        if (Number((rotator.rotation[rotate['axis']]).toFixed(2)) % 1.57 == 0) {
            rotator.rotation[rotate['axis']] = closest(rotator.rotation[rotate['axis']], [-Math.PI, -Math.PI / 2, 0, Math.PI, Math.PI / 2]) // Align exactly
            finishRotate(); // Stop rotate
        };
    };
};

function setUpCubes(cube, center = false) {
    // Add mini cube to rotator
    rotator.add(cube);

    if (rotator.children.length == 9 || rotator.children.length == 8 && center) return true;
};

function rotateSide(side, clockwise = true, solve = false) {
    if (rotate['rotate'] == true) return;

    let rotation, axis;
    const oldClockwise = clockwise;
    if (clockwise) {
        rotation = -(Math.PI / 2);
    } else if (!clockwise) {
        rotation = Math.PI / 2;
    };

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
        };
    }
    if (axis != undefined) {
        startRotate(clockwise, axis);
        if (solve == false) AddMoveToHistory([side, oldClockwise, false]);
    };
};

function startRotate(clockwise, axis) {
    // Set up rotator
    rotator.scale.set(1, 1, 1)
    rotate['axis'] = axis;
    rotate['clockwise'] = clockwise;
    // Start rotate
    rotate['rotate'] = true;
};

function finishRotate() {
    // Stop rotation
    rotate['rotate'] = false;

    // Remove children from rotator
    for (var i = rotator.children.length - 1; i >= 0; i--) {
        // Get child
        let obj = rotator.children[i];

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
        rotator.remove(obj);
        scene.add(obj);
    }

    // Remove rotator rotation
    rotator.rotation.set(0, 0, 0);
    // Enlarge rotator
    rotator.scale.set(3.001, 3.001, 3.001);
};


function onDocumentMouseDown(event) {
    if (event.which == 1) onDocumentPointerDown(event);
    event.preventDefault();
};

function onDocumentTouchDown(event) {
    if (event.touches.length == 1) onDocumentPointerDown(event.touches[0]);
    event.preventDefault();
};

function onDocumentPointerDown(touch) {
    // Exit if the cursor is not over the cube or it's already rotates
    if (currentObjectHover() == undefined || rotate['rotate'] == true || autoRotate == true) return;
    // Preparing for rotation
    mouse.down = true;
    mouse.downTime = Date.now();
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;
    mouse.touchStartX = mouse.x;
    mouse.touchStartY = mouse.y;
    movement.oldPos.x = mouse.x;
    movement.oldPos.y = mouse.y;
};

function onDocumentMouseMove(event) {
    onDocumentPointerMove(event);
};

function onDocumentTouchMove(event) {
    if (event.touches.length == 1) onDocumentPointerMove(event.touches[0]);
};

function onDocumentPointerMove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    // If mouse is down (drag) and nothing rotate
    if (mouse.down == true) {
        // If axis of movement direction != undefined
        if (movement.axisOfMovement == undefined) {
            // Get data where the mouse is hovering
            const intersect = currentObjectHover();
            if (intersect == undefined) return;
            const intersectSide = intersect[1];
            let deviationInX = mouse.x - mouse.touchStartX;
            let deviationInY = mouse.y - mouse.touchStartY;
            if (deviationInX < 0) deviationInX = -deviationInX;
            if (deviationInY < 0) deviationInY = -deviationInY
            if (deviationInX + deviationInY >= 0.005) {
                movement.axisOfMovement = deviationInX > deviationInY ? 'x' : 'y';
                const pos = intersect[0].object.position;
                const cameraOnAxisZ = ((camera.position.z > 0) ? ((camera.position.x > 0) ? (camera.position.z > camera.position.x) : (camera.position.z > -camera.position.x)) : ((camera.position.x > 0) ? (-camera.position.z > camera.position.x) : (-camera.position.z > -camera.position.x)));

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
                    };
                };

                let axis;
                let clockwise;
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
                    };
                };

                // Allow to rotate side
                rotator.scale.set(1, 1, 1);
                movement['axis'] = axis;
                movement['side'] = cubeSideToRotate;
                movement['intersectSide'] = intersectSide;
                movement['clockwise'] = clockwise;
                movement['cameraOnAxisZ'] = cameraOnAxisZ;
            };
        } else {
            // Calculate mouse deviation
            let deviationInX = mouse.x - movement.oldPos.x;
            let deviationInY = mouse.y - movement.oldPos.y;
            // Calculate rad to rotate
            let rad = (movement['axis'] == 'y' ? deviationInX : ((movement['intersectSide'] == 2 || movement['intersectSide'] == 3) && movement['axisOfMovement'] == 'x' ? deviationInX : deviationInY)) / (speedRotate == 2.9 ? smallestSide() / 3 : (speedRotate == 3.9 ? smallestSide() / 2 : smallestSide() / 4));
            // Set up rad
            if (movement['intersectSide'] == 5 && movement['axis'] == 'x') rad = -rad;
            else if ((movement['intersectSide'] == 0 || movement['intersectSide'] == 2) && movement['axis'] == 'z') rad = -rad;
            if (movement['intersectSide'] == 2 && ((!movement['cameraOnAxisZ'] && ((movement['axis'] == 'x' && camera.position.x > 0) || (movement['axis'] == 'z' && camera.position.x < 0)) || (movement['cameraOnAxisZ'] && camera.position.z < 0)))) rad = -rad;
            else if (movement['intersectSide'] == 3 && ((!movement['cameraOnAxisZ'] && ((movement['axis'] == 'z' && camera.position.x > 0) || (movement['axis'] == 'x' && camera.position.x < 0)) || (movement['cameraOnAxisZ'] && camera.position.z < 0)))) rad = -rad;
            // Rotate
            if (movement['axis'] == 'x') rotator.rotateX(rad);
            else if (movement['axis'] == 'y') rotator.rotateY(rad);
            else if (movement['axis'] == 'z') rotator.rotateZ(rad);

            // Update old mouse position
            movement.oldPos.x = mouse.x;
            movement.oldPos.y = mouse.y;
        };
    };
};

function onDocumentPointerUp(event) {
    // Stop rotate by mouse
    mouse.down = false;

    // Get side rotation
    const rad = getObjectRotationInRad(rotator, movement['axis']);

    // Exit if neither side has been turned or the cube is already rotating
    if ((rad == 0) || (rotate['rotate'] == true)) return;

    // Calculate direction to complete movement
    // Calculate closest target
    let closestTarget = closest(rad, [0, Math.PI / 2, Math.PI, Math.PI * 1.5, Math.PI * 2]);
    // If the rotation was fast and not small
    if (mouse.downTime + 300 > Date.now() && getDistance(mouse.touchStartX, mouse.touchStartY, mouse.x, mouse.y) > 60) {
        // Calculate closest target except for the initial
        closestTarget = closest(rad, [Math.PI / 2, Math.PI, Math.PI * 1.5]);
    };
    // Calculate direction
    let rotateClockwise = closestTarget > rad ? true : false;
    if (((closestTarget == 0) && (rad > Math.PI * 1.5)) || ((movement['axis'] != 'y') && (((closestTarget == Math.PI / 2) && (rad > closestTarget)) || (closestTarget == Math.PI) || ((closestTarget == Math.PI * 1.5) && (rad < closestTarget))))) rotateClockwise = !rotateClockwise;

    // Set up rotator
    rotate['rotate'] = true;
    rotate['clockwise'] = rotateClockwise;
    rotate['axis'] = movement['axis'];

    // Add move to history
    if ((closestTarget != 0) && (closestTarget != Math.PI * 2)) {
        // Calculate clockwise direction with triple rotation support
        const clockwise = !movement['clockwise'] == (movement.axisOfMovement == 'x' ? (mouse.x - mouse.touchStartX) > 0 : (mouse.y - mouse.touchStartY) > 0);
        const newClockwise = (movement.axisOfMovement == 'x' ? (mouse.x - mouse.touchStartX) > 0 : (mouse.y - mouse.touchStartY) > 0) == (rad <= Math.PI) ? clockwise : !clockwise;
        // Double move or not
        const doubleMove = closestTarget == Math.PI;
        // Add to history
        AddMoveToHistory([movement['side'], newClockwise, doubleMove]);
    };

    // Reset value
    movement.axisOfMovement = undefined;
    mouse.downTime = null;

    event.preventDefault();
};


function currentObjectHover() {
    var ray = new THREE.Raycaster();
    ray.setFromCamera({ x: ((mouse.x / window.innerWidth) * 2 - 1) * window.innerWidth / renderer.domElement.clientWidth, y: -((mouse.y / window.innerHeight) * 2 - 1) * window.innerHeight / renderer.domElement.clientHeight }, camera);

    // create an array containing all objects in the scene with which the ray intersects
    var intersects = ray.intersectObjects(scene.children);

    if (intersects.length > 0) {
        let firstIntersectedMiniCube = intersects[1];
        let sideIndex = intersects[0].faceIndex;
        if (sideIndex % 2 == 1) sideIndex -= 1;
        sideIndex = sideIndex / 2;
        return [firstIntersectedMiniCube, sideIndex];
    };
};

function getObjectRotationInRad(obj, axis) {
    let rad = obj.rotation[axis];
    const otherAxises = 'xyz'.replace(axis, '');
    if ((obj.rotation[otherAxises[0]] < 0 || obj.rotation[otherAxises[0]] > 0) || (obj.rotation[otherAxises[1]] < 0 || obj.rotation[otherAxises[1]] > 0)) rad = Math.PI - rad;
    else if (rad < 0) rad += Math.PI * 2;
    return rad;
};


export { rotateUpdate, onDocumentMouseDown, onDocumentTouchDown, onDocumentMouseMove, onDocumentTouchMove, onDocumentPointerUp, rotate, rotateSide };