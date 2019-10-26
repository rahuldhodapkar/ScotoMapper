/******************************************/
// DETERMINE DEVICE SETTINGS
/******************************************/

var PPI = 96

/******************************************/
// SETTINGS
/******************************************/

/* frame rate in frames/s */
FRAMERATE = 40

/* distance from eye to screen in centimeters */
EYE_SCREEN_DIST_IN = 2

/* maximum radius in visual field angle degrees */
MAX_PHI = 60
PHI_INC = 10

/* maximum theta in degrees */
MAX_THETA = 360
THETA_INC = 10

/* tabulate scaling factor */
TABULATE_SCALING_FACTOR_IN = 0.01

/******************************************/
// DATA STRUCTURES
/******************************************/

SCRES_PHI = parseInt(MAX_PHI / PHI_INC)
SCRES_THETA = parseInt(MAX_THETA / THETA_INC)

// core data structure for storing scotoma data
var scotoMap = new Array(SCRES_PHI)
for (var i = 0; i < scotoMap.length; i++) {
    scotoMap[i] = new Array(SCRES_THETA)
    for (var j = 0; j < scotoMap[i].length; j++) {
        scotoMap[i][j] = -1
    }
}

// current location of test point
var phi = 10
var theta = 0

// current mode: 1 for SEEN, 0 for NOT SEEN
var seenMode = 1

// viewing mode: "measure" or "tabulate"
var viewMode = "tabulate"

// number of segments per second the scotoma probe moves
var moveSpeedSegmentsPerSec = 1

/******************************************/
// KEYBOARD CONTROL
/******************************************/

function undo() {
    phi--;
    theta--;
}

function recordSeenMode() {
    scotoMap[parseInt(phi / PHI_INC)][parseInt(theta / THETA_INC)] = seenMode
}

function move() {
    if (viewMode != "measure") {
        return;
    }

    recordSeenMode();
    theta = theta + THETA_INC;

    if (theta > MAX_THETA){
        theta = theta % MAX_THETA;
        phi = phi + PHI_INC;
    }
    if (phi > MAX_PHI){
        console.log("done");
        viewMode = "tabulate"
    }
}

/******************************************/
// CUSTOM DRAWING TOOLS
/******************************************/

function polar2Cartesian(r, theta) {
    var canvas = document.getElementById("canvas");
    // canvas.width, canvas.height
    center_x = canvas.width / 2
    center_y = canvas.height / 2

    theta_rad = theta * Math.PI / 180;
    r_px = r * PPI

    x_offset_px = r_px * Math.cos(theta_rad)
    y_offset_px = r_px * Math.sin(theta_rad)

    return([center_x + x_offset_px, 
            center_y + y_offset_px])
}

/**
 * Convert polar coordinates to cartesian pixels for plotting
 * on HTML5 Canvas.
 * 
 * @param phi    visual angle in degrees, corresponding
 *               to "r" in normal polar coordinates
 * 
 * @param theta  displacement angle in degrees, corresponding
 *               to "theta" in normal polar coordinates
 *
 */
function visual2Cartesian(phi, theta) {
    var canvas = document.getElementById("canvas");
    // canvas.width, canvas.height
    center_x = canvas.width / 2
    center_y = canvas.height / 2

    phi_rad = phi * Math.PI / 180;
    theta_rad = theta * Math.PI / 180;

    r_px = Math.atan(phi_rad) * EYE_SCREEN_DIST_IN * PPI

    x_offset_px = r_px * Math.cos(theta_rad)
    y_offset_px = r_px * Math.sin(theta_rad)

    return([center_x + x_offset_px, 
            center_y + y_offset_px])
}

function drawCircle(ctx, x, y, size=5, color="#000") {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();
}

/**
 * draw a simple X
 */
function drawX(ctx, x, y, size=5) {
    ctx.beginPath();
    ctx.moveTo(x - size, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.stroke();
}

/******************************************/
// MAIN DRAWING
/******************************************/

function renderMeasure(ctx) {
    circle_coords = visual2Cartesian(phi, theta);
    console.log([phi, theta])
    drawCircle(ctx, circle_coords[0], circle_coords[1]);

    center_coords = visual2Cartesian(0, 0);
    drawX(ctx, center_coords[0], center_coords[1])
}

function renderTabulate(ctx) {
    center_coords = polar2Cartesian(0, 0);
    drawX(ctx, center_coords[0], center_coords[1])

    majorAngles = [10,20,30,40,50,60]

    for (var i = 0; i < majorAngles.length; i++) {
        circle_coords = polar2Cartesian(
            majorAngles[i] * TABULATE_SCALING_FACTOR_IN, 0);
        console.log(circle_coords)

        ctx.beginPath();
        ctx.arc(center_coords[0], center_coords[1], 
            circle_coords[0] - center_coords[0], 0, 2 * Math.PI);
        ctx.stroke();
    }
}

function draw() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext('2d');

    if (viewMode =='measure') {
        renderMeasure(ctx)
    } else if (viewMode == 'tabulate') {
        renderTabulate(ctx)
    }
}

/******************************************/
// MAIN DRAWING
/******************************************/

function frame() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    move();
    draw();
}

/******************************************/
// GLUE CODE FOR RESIZING
/******************************************/

init = function() {
    var canvas = document.getElementById("canvas");

    function resizeCanvas() {
        console.log("resizing")
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        draw(); 
    }
    resizeCanvas();

    // gather device information if provided
    var devicePixelRatio = window.devicePixelRatio || 1;
    PPI = PPI * devicePixelRatio;

    // bind event listeners
    window.addEventListener('resize', resizeCanvas, false);

    // begin mapping loop
    setInterval(frame, 1000 / FRAMERATE);
}