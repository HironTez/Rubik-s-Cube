import { rotateSide } from "./rotate.js";
import { solveCube } from './auto.rotate.js';
import { controls } from './3d.js';


const MTContainer = document.querySelector('div#management-training');
const cursor = document.querySelector('#cursor');
const mouseLeft = document.querySelector('.mouse-icon#left');
const mouseCenter = document.querySelector('.mouse-icon#center');
const mouseRight = document.querySelector('.mouse-icon#right');
const touch = document.querySelector('.cursor#touch');
const zoom = document.querySelector('.cursor#zoom');
const doubleTouch = document.querySelector('.cursor#double-touch');
const arrows = document.querySelector('#arrows');
const buttonNext = document.querySelector('button#next');

const desktopMode = !window.mobileCheck();

class ManagementTraining {
    start() {
        // Add class "active" to elements for show them and start animation
        MTContainer.classList.add('active');
        buttonNext.classList.add('active');
        if (desktopMode) {
            cursor.classList.add('active');
            mouseLeft.classList.add('active');
            // Set variable last training
            this.lastTraining = 'left';
        } else {
            touch.classList.add('active');

            this.lastTraining = 'touch';
        }

        // Continue after 400ms
        setTimeout(() => {
            this.rotateSide();
        }, 400);
    };

    break() {
        // Remove class "active" from elements for hide them
        cursor.classList.remove('active');
        mouseRight.classList.remove('active');
        doubleTouch.classList.remove('active');
        MTContainer.classList.remove('active');
        buttonNext.classList.remove('active');
        // Stop rotate the cube
        clearInterval(this.intervalId);
        controls.autoRotate = false;
        controls.autoRotateSpeed = 1;
    };

    next() {
        // If it's the turn to train the center
        if (this.lastTraining == 'left') {
            // Clear previous changes
            mouseLeft.classList.remove('active');
            cursor.classList.remove('active');
            clearInterval(this.intervalId); // Stop side rotate
            solveCube(); // Solve cube

            // Setting to next training
            mouseCenter.classList.add('active');
            arrows.classList.add('active');
            this.lastTraining = 'center';

            // Start zoom training
            this.zoomCube([arrows]);
        }
        // If it's the turn to train the touch zoom
        else if (this.lastTraining == 'touch') {
            // Clear previous changes
            touch.classList.remove('active');
            clearInterval(this.intervalId);
            solveCube();

            // Setting to next training
            zoom.classList.add('active');
            arrows.classList.add('active');
            const arrowsCopy = arrows.cloneNode();
            MTContainer.appendChild(arrowsCopy);
            arrows.style.left = `calc(50vw + ${zoom.clientWidth / 100 * 30}px - ${zoom.clientWidth / 100 * 36}px)`;
            arrows.style.top = `calc(${zoom.offsetTop}px - ${zoom.clientHeight / 2}px + ${zoom.clientHeight / 100 * 38}px)`;
            arrows.style.transform = 'translate(-50%) rotate(210deg)';
            arrowsCopy.style.left = `calc(50vw + ${zoom.clientWidth / 100 * 30}px - ${zoom.clientWidth / 100 * 26}px)`;
            arrowsCopy.style.top = `calc(${zoom.offsetTop}px - ${zoom.clientHeight / 2}px + ${zoom.clientHeight / 100 * 24.5}px)`;
            arrowsCopy.style.transform = 'translate(-50%) rotate(30deg)';
            this.arrowsCopy = arrowsCopy;
            this.lastTraining = 'touchZoom';

            // Start zoom training
            this.zoomCube([arrows, arrowsCopy], 1 + (1 / 100 * ((zoom.clientWidth - 160) / (160 / 100))));
        }
        // If it's the turn to train the right
        else if (this.lastTraining == 'center') {
            mouseCenter.classList.remove('active');
            arrows.classList.remove('active');
            clearInterval(this.intervalId);
            controls.minDistance = 7;
            controls.maxDistance = 10;

            cursor.classList.add('active');
            mouseRight.classList.add('active');
            this.lastTraining = 'right';
            buttonNext.innerText = 'Done';

            this.rotateCube();

            // Add to button function to exit
            buttonNext.addEventListener("click", this.break);
        }
        // If it's the turn to train the double touch
        else if (this.lastTraining == 'touchZoom') {
            zoom.classList.remove('active');
            arrows.classList.remove('active');
            arrows.style.left = '50vw';
            arrows.style.top = 'calc(78vh - 40px)';
            this.arrowsCopy.remove();
            clearInterval(this.intervalId);
            controls.minDistance = 7;
            controls.maxDistance = 10;

            doubleTouch.classList.add('active');
            buttonNext.innerText = 'Done';

            this.rotateCube();

            buttonNext.addEventListener("click", this.break);
        }
    };

    rotateSide() {
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
        this.intervalId = intervalId;
    };

    zoomCube(arrowsList, arrowsScale = 1) {
        let direction;
        const intervalId = setInterval(() => {
            if (controls.minDistance <= 7) {
                direction = true;
                arrowsList.forEach(arrows => {
                    const translateX = getTranslate(arrows)[0];
                    arrows.style.transform = `translate(${translateX != 0 ? -translateX : -50}%, -50%) rotate(calc(${getRotationAngle(arrows)}deg + 180deg)) scale(${arrowsScale})`;
                });
            } else if (controls.minDistance >= 10) {
                direction = false;
                arrowsList.forEach(arrows => {
                    const translateX = getTranslate(arrows)[0];
                    arrows.style.transform = `translate(${translateX != 0 ? -translateX : -50}%, -50%) rotate(calc(${getRotationAngle(arrows)}deg - 180deg)) scale(${arrowsScale}`;
                });
            };
            if (direction) {
                controls.minDistance += 0.02;
                controls.maxDistance = controls.minDistance;
            } else {
                controls.minDistance -= 0.02
                controls.maxDistance = controls.minDistance;
            };
        }, 8);
        this.intervalId = intervalId;
    };

    rotateCube() {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 20;
        const intervalId = setInterval(() => {
            if (controls.autoRotateSpeed == 20) controls.autoRotateSpeed = -20;
            else if (controls.autoRotateSpeed == -20) controls.autoRotateSpeed = 20;
        }, 1000);
        this.intervalId = intervalId;
    };
};

window.addEventListener("load", () => {
    // if (localStorage.trained != "true") {
    if (true) {
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