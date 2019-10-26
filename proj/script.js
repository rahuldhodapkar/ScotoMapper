/******************************************/
// DETERMINE DEVICE SETTINGS
/******************************************/

var PPI = 96

/******************************************/
// SETTINGS
/******************************************/

/* frame rate in frames/s */
FRAMERATE = 4

/* distance from eye to screen in centimeters */
EYE_SCREEN_DIST_IN = 2

/* maximum radius in visual field angle degrees */
MAX_PHI = 35
PHI_INC = 5

/* maximum theta in degrees */
MAX_THETA = 360
THETA_INC = 10

/* tabulate scaling factor */
TABULATE_SCALING_FACTOR_IN = 0.03

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
var phi = THETA_INC
var theta = 0

// current mode: 1 for SEEN, 0 for NOT SEEN
var seenMode = 1

// viewing mode: "measure" or "tabulate"
var viewMode = "measure"

// number of segments per second the scotoma probe moves
var moveSpeedSegmentsPerSec = 1

var cyclesPerCircle = parseInt(MAX_THETA/THETA_INC)
var cycleCount = 0


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
    if (viewMode == "measure") {
        recordSeenMode();

        cycleCount++;

        theta = theta + THETA_INC % MAX_THETA;
        if (cycleCount % cyclesPerCircle == 0) {
            phi = phi + PHI_INC
        }
        if (phi >= MAX_PHI){
            viewMode = "tabulate"
        }
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

/**
 * draw measure indicator
 */
function drawMeasureIndicator(ctx, x, y, type) {
    if (type == -1) {
        // not measured
        drawX(ctx, x, y)
    } else if (type == 0) {
        // NOT seen (scotoma)
        drawCircle(ctx, x, y, 5, "#0FF")
    } else if (type == 1) {
        // seen (intact visual field)
        drawCircle(ctx, x, y, 5, "#000")
    }
}


/******************************************/
// MAIN DRAWING
/******************************************/

function renderMeasure(ctx) {
    circle_coords = visual2Cartesian(phi, theta);
    drawCircle(ctx, circle_coords[0], circle_coords[1]);

    center_coords = visual2Cartesian(0, 0);
    drawX(ctx, center_coords[0], center_coords[1])
}

function renderTabulate(ctx) {
    center_coords = polar2Cartesian(0, 0);

    // render circles for phi
    majorAnglesPhi = [10,20,30]
    for (var i = 0; i < majorAnglesPhi.length; i++) {
        circle_coords = polar2Cartesian(
            majorAnglesPhi[i] * TABULATE_SCALING_FACTOR_IN, 0);

        ctx.beginPath();
        ctx.arc(center_coords[0], center_coords[1], 
            circle_coords[0] - center_coords[0], 0, 2 * Math.PI);
        ctx.stroke();
    }

    max_r_in = TABULATE_SCALING_FACTOR_IN * (
                    Math.max(...majorAnglesPhi) + 5
                )

    // render lines for theta
    majorAnglesTheta = [0, 45, 90, 135, 180, 225, 270, 315]
    for (var i = 0; i < majorAnglesTheta.length; i++) {
        circle_coords = polar2Cartesian(
            max_r_in, majorAnglesTheta[i]);

        ctx.beginPath();
        ctx.moveTo(center_coords[0], center_coords[1]);
        ctx.lineTo(circle_coords[0], circle_coords[1]);
        ctx.stroke();
    }

    // render scotoma measurements
    for (var i = 0; i < scotoMap.length; i++) {
        for (var j = 0; j < scotoMap[i].length; j++) {
            measure_coords = polar2Cartesian(
                i * PHI_INC * TABULATE_SCALING_FACTOR_IN,
                j * THETA_INC)

            drawMeasureIndicator(ctx, 
                measure_coords[0], measure_coords[1],
                scotoMap[i][j])
        }
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

function interactKeyDown(e) {
    console.log(e)
    if (e.which == 32) {
        seenMode = 1
        frame();
    }
    else if (e.which == 88) {
        seenMode = 0
        frame();
    }
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
    document.addEventListener('keydown', interactKeyDown);
}