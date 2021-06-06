import { rotate, rotateSide } from './rotate.js'


let history = [], solveProcess = false;
const sides = ['r', 'l', 'u', 'd', 'f', 'b'], oppositeSides = ['lr', 'ud', 'fb'];

// Add function for button "shuffle"
const buttonShuffle = document.querySelector('button#shuffle-cube');
buttonShuffle.onclick = shuffle;

// Add function for button "solve"
let solveButton = document.querySelector('button#solve-cube');
solveButton.onclick = solveCube;


function getRandomSide() {
    const side = sides[Math.floor(Math.random() * sides.length)];
    return side;
};

function getRandomDirection() {
    const clockWise = Math.round(Math.random());
    let double = Math.round(Math.random() * 2);
    if (double == 2) double = true;
    else double = false;
    return { 'clockWise': clockWise, 'double': double };
};

function availableToRotate(side, previousSide, beforeThePreviousSide) {
    if (side == previousSide) {
        return false;
    };
    // Check if the sides are opposite
    if ((side == beforeThePreviousSide) && ((oppositeSides[0].includes(side) && oppositeSides[0].includes(previousSide)) || (oppositeSides[1].includes(side) && oppositeSides[1].includes(previousSide)) || (oppositeSides[2].includes(side) && oppositeSides[2].includes(previousSide)))) {
        return false;
    };
    return true;
};

function generateScramble() {
    let scramble = [];
    for (let i = 0; i < 20; i++) {
        let side = getRandomSide();
        if (i > 0) {
            let beforeThePreviousSide = null;
            if (scramble[i - 2] != undefined) beforeThePreviousSide = scramble[i - 2][0];
            while (!availableToRotate(side, scramble[i - 1][0], beforeThePreviousSide)) side = getRandomSide();
        };
        const direction = getRandomDirection();
        scramble.push([side, direction['clockWise'], direction['double']]);
    };
    return scramble;
};

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
    };
    return result.toUpperCase();
};

/**
    @param {Array} formula
*/
async function twistByFormula(formula) {
    for (let action of formula) {
        // Wait while something rotates
        while (rotate['rotate'] != false) await sleep(100);
        // If not double rotate
        if (!action[2]) {
            rotateSide(action[0], action[1], solveProcess);
        }
        // If double rotate
        else if (action[2]) {
            rotateSide(action[0], true, solveProcess);
            while (rotate['rotate'] != false) await sleep(100);
            rotateSide(action[0], true, solveProcess);
        };
    };
};

function shuffle() {
    const scramble = generateScramble();
    document.querySelector('div#scramble').innerText = 'Scramble: ' + scrambleToDisplayString(scramble);
    twistByFormula(scramble);
};

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
        };
    } else {
        history.push(move);
    };
    // If the penultimate 2 moves on one side are double
    if ((lastMove[0] == previousMove[0]) && (lastMove[2] == true) && (previousMove[2] == true)) {
        // Remove them
        history.splice(-3, 2);
    };
};

async function solveCube() {
    // Exit if cube is currently being solved
    if (solveProcess == true) return;
    // Reverse history
    let formula;
    formula = history.reverse().slice();
    // Reverse direction of turns
    for (let move of formula) {
        if (move[2] == false) {
            move[1] = !move[1];
        };
    };
    // Set a new value to the variable
    solveProcess = true;
    // Rotates the sides of a cube using the formula
    await twistByFormula(formula, true);
    // Clear history & reset variable
    history = [];
    solveProcess = false;
};


export { AddMoveToHistory, solveCube };