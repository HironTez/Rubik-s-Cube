import { rotateSide } from "./rotate.js";
import { solveCube } from './auto.rotate.js';
import { controls } from './3d.js';


const MTContainer = document.querySelector('div#management-training');
const cursor = document.querySelector('#cursor');
const mouseLeft = document.querySelector('.mouse-icon#left');
const mouseCenter = document.querySelector('.mouse-icon#center');
const mouseRight = document.querySelector('.mouse-icon#right');
const arrows = document.querySelector('#arrows');
const buttonNext = document.querySelector('button#next');

class ManagementTraining {
    start() {
        // Add class "active" to elements for show them and start animation
        MTContainer.classList.add('active');
        buttonNext.classList.add('active');
        cursor.classList.add('active');
        mouseLeft.classList.add('active');
        
        // Continue after 400ms
        setTimeout(() => {
            // Declare start direction to rotate
            let direction = true;
            // Start cycle rotates
            const intervalId = setInterval(() => {
                rotateSide('u', direction);
                direction = !direction;
            }, 1000);
            // First rotate Immediately
            rotateSide('u', !direction);
            // Save cycle id for later disable
            this.leftIntervalId = intervalId;
        }, 400);

        // Set variable last training
        this.lastTraining = 'left';
    };

    break() {
        // Remove class "active" from elements for hide them
        cursor.classList.remove('active');
        mouseRight.classList.remove('active');
        MTContainer.classList.remove('active');
        buttonNext.classList.remove('active');
        // Stop rotate the cube
        clearInterval(this.rightIntervalId);
        controls.autoRotate = false;
        controls.autoRotateSpeed = 1;
    };

    next() {
        // If it's the turn to train the center
        if (this.lastTraining == 'left') {
            mouseLeft.classList.remove('active');
            cursor.classList.remove('active');
            clearInterval(this.leftIntervalId);
            solveCube();
            mouseCenter.classList.add('active');
            arrows.classList.add('active');
            this.lastTraining = 'center';

            let direction;
            const intervalId = setInterval(() => {
                if (controls.minDistance <= 7) {
                    direction = true;
                    arrows.style.transform = 'rotate(180deg) translate(50%)';
                } else if (controls.minDistance >= 10) {
                    direction = false;
                    arrows.style.transform = 'rotate(0) translate(-50%)';
                }
                if (direction) {
                    controls.minDistance += 0.01;
                    controls.maxDistance = controls.minDistance;
                } else {
                    controls.minDistance -= 0.01
                    controls.maxDistance = controls.minDistance;
                };
            }, 1);
            this.centerIntervalId = intervalId; 
        }
        // If it's the turn to train the right
        else if (this.lastTraining == 'center') {
            mouseCenter.classList.remove('active');
            arrows.classList.remove('active');
            clearInterval(this.centerIntervalId);
            cursor.classList.add('active');
            mouseRight.classList.add('active');
            this.lastTraining = 'right';
            buttonNext.innerText = 'Done';

            controls.minDistance = 7;
            controls.maxDistance = 10;

            controls.autoRotate = true;
            controls.autoRotateSpeed = 10;
            const intervalId = setInterval(() => {
                if (controls.autoRotateSpeed == 10) controls.autoRotateSpeed = -10;
                else if (controls.autoRotateSpeed == -10) controls.autoRotateSpeed = 10;
            }, 1000)
            this.rightIntervalId = intervalId;
            buttonNext.addEventListener("click", this.break);
        };
    };
};

window.addEventListener("load", () => {
    if (localStorage.trained != "true") {
        const managementTraining = new ManagementTraining();
        managementTraining.start();
        
        buttonNext.addEventListener("click", () => {
            managementTraining.next();
        });
        localStorage.trained = "true";
    } else {
        MTContainer.classList.remove('active');
    }
});