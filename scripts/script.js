// Sleep (wait) before next action
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Find closest value in array
function closest(needle, haystack) {
    return haystack.reduce((a, b) => {
        let aDiff = Math.abs(a - needle);
        let bDiff = Math.abs(b - needle);

        if (aDiff == bDiff) {
            return a > b ? a : b;
        } else {
            return bDiff < aDiff ? b : a;
        };
    });
};