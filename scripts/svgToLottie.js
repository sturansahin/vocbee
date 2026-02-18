/**
 * SVG to Lottie converter for bee.svg
 * Parses SVG path data, applies transforms, converts to Lottie bezier format
 */

// Parse SVG path data into commands
function parseSvgPath(d) {
    const tokens = d.match(/[MmCcLlZzSsQqTtAaHhVv]|[-+]?\d*\.?\d+/g);
    const commands = [];
    let i = 0;
    while (i < tokens.length) {
        if (/^[A-Za-z]$/.test(tokens[i])) {
            const cmd = tokens[i++];
            const args = [];
            while (i < tokens.length && !/^[A-Za-z]$/.test(tokens[i])) {
                args.push(parseFloat(tokens[i++]));
            }
            commands.push({ cmd, args });
        } else {
            i++;
        }
    }
    return commands;
}

// Convert SVG path to Lottie bezier (in SVG internal coordinate space)
function svgPathToLottie(d) {
    const commands = parseSvgPath(d);
    const vertices = [];
    const inTangents = [];
    const outTangents = [];
    let cx = 0, cy = 0;
    let startX = 0, startY = 0;

    for (const { cmd, args } of commands) {
        switch (cmd) {
            case 'M':
                cx = args[0]; cy = args[1];
                startX = cx; startY = cy;
                vertices.push([cx, cy]);
                inTangents.push([0, 0]);
                outTangents.push([0, 0]);
                break;
            case 'c':
                for (let i = 0; i < args.length; i += 6) {
                    const dx1 = args[i], dy1 = args[i + 1];
                    const dx2 = args[i + 2], dy2 = args[i + 3];
                    const dx = args[i + 4], dy = args[i + 5];

                    // Set out-tangent of current (last) vertex
                    outTangents[outTangents.length - 1] = [dx1, dy1];

                    const newX = cx + dx;
                    const newY = cy + dy;

                    // In-tangent of new point (relative to new point)
                    const inTx = dx2 - dx;
                    const inTy = dy2 - dy;

                    // Check if this point closes the path (equals start)
                    if (Math.abs(newX - startX) < 1 && Math.abs(newY - startY) < 1) {
                        // Closing segment - update first vertex's in-tangent
                        inTangents[0] = [inTx, inTy];
                    } else {
                        vertices.push([newX, newY]);
                        inTangents.push([inTx, inTy]);
                        outTangents.push([0, 0]);
                    }

                    cx = newX;
                    cy = newY;
                }
                break;
            case 'l':
                for (let i = 0; i < args.length; i += 2) {
                    cx += args[i]; cy += args[i + 1];
                    vertices.push([cx, cy]);
                    inTangents.push([0, 0]);
                    outTangents.push([0, 0]);
                }
                break;
            case 'z':
            case 'Z':
                break;
        }
    }

    return { v: vertices, i: inTangents, o: outTangents, c: true };
}

// SVG has these transforms applied:
// outer: translate(0, 1024) scale(0.1, -0.1)  
// inner: translate(10240, 0) scale(-1, 1)
// Combined for point (px, py): vx = 1024 - 0.1*px, vy = 1024 - 0.1*py
// For tangent vectors: dvx = -0.1*dx, dvy = -0.1*dy
function transformToVisual(path) {
    return {
        v: path.v.map(([x, y]) => [1024 - 0.1 * x, 1024 - 0.1 * y]),
        i: path.i.map(([x, y]) => [-0.1 * x, -0.1 * y]),
        o: path.o.map(([x, y]) => [-0.1 * x, -0.1 * y]),
        c: path.c
    };
}

// Scale path to fit target canvas with padding
function scalePath(path, canvasW, canvasH, bounds, padding = 0.9) {
    const { minX, minY, maxX, maxY } = bounds;
    const bw = maxX - minX;
    const bh = maxY - minY;
    const scale = Math.min(canvasW / bw, canvasH / bh) * padding;
    const offsetX = (canvasW - bw * scale) / 2 - minX * scale;
    const offsetY = (canvasH - bh * scale) / 2 - minY * scale;

    return {
        v: path.v.map(([x, y]) => [round(x * scale + offsetX), round(y * scale + offsetY)]),
        i: path.i.map(([x, y]) => [round(x * scale), round(y * scale)]),
        o: path.o.map(([x, y]) => [round(x * scale), round(y * scale)]),
        c: path.c
    };
}

function round(n) {
    return Math.round(n * 100) / 100;
}

// Compute bounding box of a path (vertices only, good enough approximation)
function getBounds(path) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of path.v) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }
    return { minX, minY, maxX, maxY };
}

// Path data from bee.svg
const pathData = {
    wingL: "M6723 8072 c-73 -26 -116 -57 -271 -195 -267 -237 -623 -606 -806 -836 -203 -254 -366 -574 -354 -693 4 -44 35 -58 133 -58 248 0 661 120 996 291 331 169 554 372 674 614 143 287 138 620 -10 784 -84 93 -246 135 -362 93",
    wingR: "M4749 8037 c-68 -19 -127 -58 -190 -123 -130 -138 -179 -302 -150 -504 17 -115 58 -227 156 -425 90 -181 175 -323 271 -451 114 -153 167 -190 207 -146 39 43 123 340 153 542 22 148 29 461 15 589 -30 255 -123 438 -256 500 -55 26 -148 34 -206 18",
    body1: "M4025 6166 c-181 -30 -314 -74 -482 -160 -310 -159 -549 -387 -682 -653 -75 -150 -107 -351 -81 -510 43 -276 252 -529 520 -633 120 -46 192 -60 336 -67 263 -12 494 54 727 210 110 73 281 241 353 347 110 161 188 349 220 530 25 143 15 364 -20 485 -74 248 -199 375 -431 436 -103 27 -342 35 -460 15",
    body2: "M4856 6141 c-27 -5 -22 -8 45 -30 129 -41 222 -95 318 -186 357 -335 398 -995 94 -1520 -246 -426 -663 -719 -1198 -840 -60 -14 -122 -25 -137 -25 -16 0 -28 -4 -28 -8 0 -9 164 -128 270 -195 104 -66 274 -152 339 -171 140 -41 354 2 600 121 490 238 858 699 970 1217 45 204 47 482 6 682 -114 551 -485 899 -1016 954 -109 11 -216 11 -263 1",
    body3: "M5940 5967 c3 -3 37 -22 75 -42 239 -126 454 -350 588 -613 102 -198 156 -391 177 -633 25 -275 -36 -593 -162 -844 -193 -386 -501 -676 -891 -839 -100 -42 -277 -97 -362 -112 l-40 -7 38 -13 c21 -7 108 -26 195 -41 140 -24 182 -27 387 -28 240 0 297 6 475 51 264 66 515 205 717 397 221 212 351 442 415 740 32 149 32 434 0 595 -106 529 -428 945 -927 1194 -143 72 -276 121 -424 157 -111 27 -273 51 -261 38"
};

// Step 1: Parse and transform all paths to visual coordinates (1024x1024)
const visualPaths = {};
for (const [name, d] of Object.entries(pathData)) {
    const raw = svgPathToLottie(d);
    visualPaths[name] = transformToVisual(raw);
}

// Step 2: Find global bounds
let gMinX = Infinity, gMinY = Infinity, gMaxX = -Infinity, gMaxY = -Infinity;
for (const path of Object.values(visualPaths)) {
    const b = getBounds(path);
    gMinX = Math.min(gMinX, b.minX);
    gMinY = Math.min(gMinY, b.minY);
    gMaxX = Math.max(gMaxX, b.maxX);
    gMaxY = Math.max(gMaxY, b.maxY);
}
const globalBounds = { minX: gMinX, minY: gMinY, maxX: gMaxX, maxY: gMaxY };
console.log('Global visual bounds:', JSON.stringify(globalBounds));
console.log('Visual size:', round(gMaxX - gMinX), 'x', round(gMaxY - gMinY));

// Step 3: Scale to target canvas (320x320)
const canvasW = 320, canvasH = 320;
const scaledPaths = {};
for (const [name, path] of Object.entries(visualPaths)) {
    scaledPaths[name] = scalePath(path, canvasW, canvasH, globalBounds, 0.9);
}

// Step 4: Calculate wing anchor points for rotation
// wingL transform-origin: -5% 10% of its fill-box
// wingR transform-origin: 80% 5% of its fill-box
function getWingAnchor(path, originXPct, originYPct) {
    const b = getBounds(path);
    const ax = b.minX + (b.maxX - b.minX) * originXPct;
    const ay = b.minY + (b.maxY - b.minY) * originYPct;
    return [round(ax), round(ay)];
}

const wingLAnchor = getWingAnchor(scaledPaths.wingL, -0.05, 0.10);
const wingRAnchor = getWingAnchor(scaledPaths.wingR, 0.80, 0.05);

console.log('Wing L anchor:', JSON.stringify(wingLAnchor));
console.log('Wing R anchor:', JSON.stringify(wingRAnchor));

// Step 5: Output the Lottie data
console.log('\n=== LOTTIE PATH DATA ===\n');
for (const [name, path] of Object.entries(scaledPaths)) {
    console.log(`// ${name}`);
    console.log(JSON.stringify(path));
    console.log('');
}

// Step 6: Output full Lottie animation structure
const output = {
    canvasW,
    canvasH,
    wingLAnchor,
    wingRAnchor,
    paths: scaledPaths
};
console.log('\n=== FULL OUTPUT ===\n');
console.log(JSON.stringify(output, null, 2));
