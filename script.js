// --- Main variables for cube interaction ---
const cubeElement = document.getElementById('cube'); // Renamed 'cube' to 'cubeElement' for clarity
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotation = { x: 0, y: 0 };

// --- Click/Tap detection variables ---
let clickStartX = 0;
let clickStartY = 0;
const clickThreshold = 5;

// --- Physics variables for free spin ---
let velocityX = 0; let velocityY = 0;
const damping = 0.95; const minVelocity = 0.1;
let isSpinning = false;

// --- Hover State Variables ---
let currentlyHoveredFaceElement = null; // DOM element of the face being hovered
let lastHoveredFaceName = null;         // Name of the last hovered face

// --- Audio Elements References ---
const audioRotateStart = document.getElementById('audioRotateStart');
const audioFaceChange = document.getElementById('audioFaceChange');
if (audioRotateStart) audioRotateStart.volume = 0.5;
if (audioFaceChange) audioFaceChange.volume = 0.3;

// --- UI Element References ---
const particleCountSlider = document.getElementById('particleCount');
const particleCountValueDisplay = document.getElementById('particleCountValue');
const particleSpeedSlider = document.getElementById('particleSpeed');
const particleSpeedValueDisplay = document.getElementById('particleSpeedValue');
const themeSelector = document.getElementById('themeSelector');
const clickInfoDisplayDiv = document.getElementById('clickInfoDisplay');
const clickedFaceNameSpan = document.getElementById('clickedFaceName');

// --- Cube Face Data & Rotation Logic ---
const cubeFaces = {
    'front':  { name: 'front',  normal: { x: 0, y: 0, z: 1 }, element: document.querySelector('.face.front') },
    'back':   { name: 'back',   normal: { x: 0, y: 0, z: -1}, element: document.querySelector('.face.back') },
    'left':   { name: 'left',   normal: { x: -1, y: 0, z: 0}, element: document.querySelector('.face.left') },
    'right':  { name: 'right',  normal: { x: 1, y: 0, z: 0 }, element: document.querySelector('.face.right') },
    'top':    { name: 'top',    normal: { x: 0, y: 1, z: 0 }, element: document.querySelector('.face.top') },
    'bottom': { name: 'bottom', normal: { x: 0, y: -1, z: 0}, element: document.querySelector('.face.bottom') }
};
function getRotatedVector(vector, rotationX_deg, rotationY_deg) { /* ... same ... */
    const rotX_rad = rotationX_deg * (Math.PI / 180);
    const rotY_rad = rotationY_deg * (Math.PI / 180);
    let { x, y, z } = vector;
    const x1 = x;
    const y1_ = y * Math.cos(rotX_rad) - z * Math.sin(rotX_rad);
    const z1_ = y * Math.sin(rotX_rad) + z * Math.cos(rotX_rad);
    const x2 = x1 * Math.cos(rotY_rad) + z1_ * Math.sin(rotY_rad);
    const y2 = y1_;
    const z2 = -x1 * Math.sin(rotY_rad) + z1_ * Math.cos(rotY_rad);
    return { x: x2, y: y2, z: z2 };
}

// --- Theme Definitions & Global Configs ---
const colorThemes = [ /* ... same ... */
    { name: "Default", pageBackground: "#f0f0f0", faceBackgrounds: { 'front': 'rgba(255,0,0,0.7)', 'back': 'rgba(0,255,0,0.7)', 'left': 'rgba(0,0,255,0.7)', 'right': 'rgba(255,255,0,0.7)', 'top': 'rgba(255,0,255,0.7)', 'bottom': 'rgba(0,255,255,0.7)' }, particleColors: { 'front': 'rgba(255,100,100,0.7)', 'back': 'rgba(100,255,100,0.7)', 'left': 'rgba(100,100,255,0.7)', 'right': 'rgba(255,255,100,0.7)', 'top': 'rgba(255,100,255,0.7)', 'bottom': 'rgba(100,255,255,0.7)', 'default': 'rgba(128,128,128,0.5)' }},
    { name: "Ocean", pageBackground: "#10355A", faceBackgrounds: { 'front': 'rgba(0,120,200,0.7)', 'back': 'rgba(0,150,220,0.7)', 'left': 'rgba(0,100,180,0.7)', 'right': 'rgba(0,130,210,0.7)', 'top': 'rgba(50,180,255,0.7)', 'bottom': 'rgba(0,80,150,0.7)' }, particleColors: { 'front': 'rgba(100,200,255,0.7)', 'back': 'rgba(120,220,255,0.7)', 'left': 'rgba(80,180,240,0.7)', 'right': 'rgba(110,210,250,0.7)', 'top': 'rgba(150,230,255,0.8)', 'bottom': 'rgba(60,160,220,0.7)', 'default': 'rgba(100,150,200,0.5)' }},
    { name: "Forest", pageBackground: "#204020", faceBackgrounds: { 'front': 'rgba(0,100,0,0.7)', 'back': 'rgba(50,120,50,0.7)', 'left': 'rgba(0,80,0,0.7)', 'right': 'rgba(30,110,30,0.7)', 'top': 'rgba(80,150,80,0.7)', 'bottom': 'rgba(0,60,0,0.7)' }, particleColors: { 'front': 'rgba(100,200,100,0.7)', 'back': 'rgba(120,220,120,0.7)', 'left': 'rgba(80,180,80,0.7)', 'right': 'rgba(110,210,110,0.7)', 'top': 'rgba(150,230,150,0.8)', 'bottom': 'rgba(60,160,60,0.7)', 'default': 'rgba(80,120,80,0.5)' }}
];
let currentTheme = colorThemes[0];
let actualFaceColors = JSON.parse(JSON.stringify(colorThemes[0].faceBackgrounds));
let particleConfigs = {};
let originalSpeedsAndCounts = {};
let lastDetectedFace = 'front';
let currentParticleConfig = {};

// --- Initialization Functions ---
function storeInitialParticleConfigValues() { /* ... same ... */
    const defaultConfigTheme = colorThemes[0];
    for (const face of ['front', 'back', 'left', 'right', 'top', 'bottom', 'default']) {
        originalSpeedsAndCounts[face] = {
            baseSpeedX: (face === 'front' ? 0 : face === 'back' ? 0 : face === 'left' ? -0.8 : face === 'right' ? 0.8 : 0),
            baseSpeedY: (face === 'front' ? -0.8 : face === 'back' ? 0.8 : 0),
            count: (face === 'top' || face === 'bottom' ? 150 : face === 'default' ? 50 : 100),
            randomSpeedXRange: (face === 'top' || face === 'bottom' ? (face === 'top' ? 1.5:0.8) : 0.5),
            randomSpeedYRange: (face === 'top' || face === 'bottom' ? (face === 'top' ? 1.5:0.8) : 0.5)
        };
        particleConfigs[face] = {
            color: defaultConfigTheme.particleColors[face],
            count: originalSpeedsAndCounts[face].count,
            baseSpeedX: originalSpeedsAndCounts[face].baseSpeedX,
            baseSpeedY: originalSpeedsAndCounts[face].baseSpeedY,
            randomSpeedXRange: originalSpeedsAndCounts[face].randomSpeedXRange,
            randomSpeedYRange: originalSpeedsAndCounts[face].randomSpeedYRange
        };
    }
    const initialSliderFaceConf = originalSpeedsAndCounts['front'];
    if (particleCountSlider && initialSliderFaceConf) {
        particleCountSlider.value = initialSliderFaceConf.count;
        if (particleCountValueDisplay) particleCountValueDisplay.textContent = initialSliderFaceConf.count;
    }
    if (particleSpeedSlider) {
        particleSpeedSlider.value = 1.0;
        if (particleSpeedValueDisplay) particleSpeedValueDisplay.textContent = "1.0x";
    }
}
function applyTheme(themeName) { /* ... same ... */
    const theme = colorThemes.find(t => t.name === themeName);
    if (!theme) { console.warn("Theme not found:", themeName); return; }
    currentTheme = theme;
    for (const face in theme.faceBackgrounds) {
        if (actualFaceColors.hasOwnProperty(face)) actualFaceColors[face] = theme.faceBackgrounds[face];
    }
    for (const face in theme.particleColors) {
        if (particleConfigs.hasOwnProperty(face)) particleConfigs[face].color = theme.particleColors[face];
    }
    document.body.style.backgroundColor = theme.pageBackground;
    updateVisualsBasedOnFace();
    if (currentParticleConfig && particleConfigs[lastDetectedFace]) {
         currentParticleConfig.color = particleConfigs[lastDetectedFace].color;
         initParticles(currentParticleConfig);
    } else if (currentParticleConfig) {
         initParticles(currentParticleConfig);
    }
}

// --- Utility Functions ---
function normalizeAngle(angle) { let na = angle % 360; if (na < 0) na += 360; return na; }
function getFrontFacingFaceUsingNormals(currentRotationX, currentRotationY) { /* ... same ... */
    let bestFaceName = 'front';
    let maxPositiveZ = -Infinity;
    for (const faceName in cubeFaces) {
        if (cubeFaces.hasOwnProperty(faceName)) {
            const face = cubeFaces[faceName];
            const rotatedNormal = getRotatedVector(face.normal, currentRotationX, currentRotationY);
            if (rotatedNormal.z > maxPositiveZ) {
                maxPositiveZ = rotatedNormal.z;
                bestFaceName = face.name;
            }
        }
    }
    return bestFaceName;
}

// --- Click Handling ---
function performFaceClickAction(faceName) { /* ... same ... */
    console.log(`Cube face clicked (identified by normals): ${faceName}`);
    if (clickInfoDisplayDiv && clickedFaceNameSpan) {
        clickedFaceNameSpan.textContent = faceName.charAt(0).toUpperCase() + faceName.slice(1);
        clickInfoDisplayDiv.style.display = 'block';
        if (performFaceClickAction.hideTimeout) {
            clearTimeout(performFaceClickAction.hideTimeout);
        }
        performFaceClickAction.hideTimeout = setTimeout(() => {
            if (clickInfoDisplayDiv) {
                clickInfoDisplayDiv.style.display = 'none';
            }
        }, 3000);
    } else {
        alert(`You clicked on the ${faceName} face!`);
    }
}
performFaceClickAction.hideTimeout = null;
function handleCubeClick() { /* ... same ... */
    const clickedFaceName = getFrontFacingFaceUsingNormals(rotation.x, rotation.y);
    performFaceClickAction(clickedFaceName);
}

// --- Update Function (Visuals, Particles, Audio based on face) ---
function updateVisualsBasedOnFace() { /* ... same, uses getFrontFacingFaceUsingNormals ... */
    const currentFace = getFrontFacingFaceUsingNormals(rotation.x, rotation.y);
    const newBackgroundColor = actualFaceColors[currentFace] || currentTheme.pageBackground;
    if (document.body.style.backgroundColor !== newBackgroundColor) {
        document.body.style.backgroundColor = newBackgroundColor;
    }
    if (currentFace !== lastDetectedFace) {
        currentParticleConfig = particleConfigs[currentFace] || particleConfigs['default'];
        initParticles(currentParticleConfig);
        if (audioFaceChange) { audioFaceChange.currentTime = 0; audioFaceChange.play().catch(e => console.warn("FC sound fail:", e)); }
        lastDetectedFace = currentFace; // Update lastDetectedFace only if currentFace is different
    }
}

// --- Event Listeners for UI Controls ---
if (particleCountSlider) { /* ... same ... */
    particleCountSlider.addEventListener('input', (e) => {
        const newCount = parseInt(e.target.value);
        if (particleCountValueDisplay) particleCountValueDisplay.textContent = newCount;
        for (const face in particleConfigs) { if (particleConfigs.hasOwnProperty(face)) particleConfigs[face].count = newCount; }
        if (currentParticleConfig) { currentParticleConfig.count = newCount; initParticles(currentParticleConfig); }
    });
}
if (particleSpeedSlider) { /* ... same ... */
    particleSpeedSlider.addEventListener('input', (e) => {
        const newSpeedMultiplier = parseFloat(e.target.value);
        if (particleSpeedValueDisplay) particleSpeedValueDisplay.textContent = newSpeedMultiplier.toFixed(1) + "x";
        for (const face in particleConfigs) {
            if (particleConfigs.hasOwnProperty(face) && originalSpeedsAndCounts.hasOwnProperty(face)) {
                particleConfigs[face].baseSpeedX = originalSpeedsAndCounts[face].baseSpeedX * newSpeedMultiplier;
                particleConfigs[face].baseSpeedY = originalSpeedsAndCounts[face].baseSpeedY * newSpeedMultiplier;
            }
        }
        if (currentParticleConfig && originalSpeedsAndCounts[lastDetectedFace]) {
            currentParticleConfig.baseSpeedX = originalSpeedsAndCounts[lastDetectedFace].baseSpeedX * newSpeedMultiplier;
            currentParticleConfig.baseSpeedY = originalSpeedsAndCounts[lastDetectedFace].baseSpeedY * newSpeedMultiplier;
            initParticles(currentParticleConfig);
        }
    });
}
if (themeSelector) { /* ... same ... */
    colorThemes.forEach(theme => { const opt = document.createElement('option'); opt.value = theme.name; opt.textContent = theme.name; themeSelector.appendChild(opt); });
    themeSelector.addEventListener('change', (e) => applyTheme(e.target.value));
}

// --- Event Listeners (Cube Interaction & Hover Effects) ---
if (cubeElement) { // Ensure cubeElement is not null
    cubeElement.addEventListener('mousedown', (e) => {
        isDragging = true; isSpinning = false; velocityX = 0; velocityY = 0;
        previousMousePosition = {x:e.clientX,y:e.clientY};
        clickStartX = e.clientX; clickStartY = e.clientY;
        if (audioRotateStart) { audioRotateStart.currentTime = 0; audioRotateStart.play().catch(err=>console.warn("Audio play fail:",err));}
        // Remove hover effect when drag starts
        if (currentlyHoveredFaceElement) {
            currentlyHoveredFaceElement.classList.remove('hover-highlight');
            currentlyHoveredFaceElement = null;
            lastHoveredFaceName = null;
        }
    });

    cubeElement.addEventListener('mousemove', (e) => {
        if (isDragging) {
            // If dragging, ensure no hover effect is active
            if (currentlyHoveredFaceElement) {
                currentlyHoveredFaceElement.classList.remove('hover-highlight');
                currentlyHoveredFaceElement = null;
                lastHoveredFaceName = null;
            }
            // Drag logic (copied from document.mousemove)
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;
            rotation.y += deltaX * 0.5;
            rotation.x += deltaY * 0.5;
            velocityX = deltaX * 0.5;
            velocityY = deltaY * 0.5;
            cubeElement.style.transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`; // Use cubeElement
            previousMousePosition = { x: e.clientX, y: e.clientY };
            updateVisualsBasedOnFace();
            return; // Don't proceed to hover logic if dragging
        }

        // Hover logic: Highlight the dominant face if not dragging
        const dominantFaceName = getFrontFacingFaceUsingNormals(rotation.x, rotation.y);
        if (dominantFaceName !== lastHoveredFaceName) {
            if (currentlyHoveredFaceElement) {
                currentlyHoveredFaceElement.classList.remove('hover-highlight');
            }
            if (cubeFaces[dominantFaceName] && cubeFaces[dominantFaceName].element) {
                currentlyHoveredFaceElement = cubeFaces[dominantFaceName].element;
                currentlyHoveredFaceElement.classList.add('hover-highlight');
                lastHoveredFaceName = dominantFaceName;
            } else {
                currentlyHoveredFaceElement = null;
                lastHoveredFaceName = null;
            }
        }
    });

    cubeElement.addEventListener('mouseleave', () => {
        if (currentlyHoveredFaceElement) {
            currentlyHoveredFaceElement.classList.remove('hover-highlight');
            currentlyHoveredFaceElement = null;
            lastHoveredFaceName = null;
        }
    });

    cubeElement.addEventListener('touchstart', (e) => { // Using cubeElement for touch
        isDragging = true; isSpinning = false; velocityX = 0; velocityY = 0;
        const touch = e.touches[0];
        previousMousePosition = {x:touch.clientX,y:touch.clientY};
        clickStartX = touch.clientX; clickStartY = touch.clientY;
        if (audioRotateStart) { audioRotateStart.currentTime = 0; audioRotateStart.play().catch(err=>console.warn("Audio play fail:",err));}
        // Remove hover on touch start as well
        if (currentlyHoveredFaceElement) {
            currentlyHoveredFaceElement.classList.remove('hover-highlight');
            currentlyHoveredFaceElement = null;
            lastHoveredFaceName = null;
        }
        e.preventDefault(); // Prevent default touch actions like scrolling
    });

    cubeElement.addEventListener('touchmove', (e) => { // Using cubeElement for touch
        if(!isDragging)return;
        // Clear hover if any active during touch move (though touchstart should handle it)
        if (currentlyHoveredFaceElement) {
            currentlyHoveredFaceElement.classList.remove('hover-highlight');
            currentlyHoveredFaceElement = null;
            lastHoveredFaceName = null;
        }
        const touch=e.touches[0];
        const dX=touch.clientX-previousMousePosition.x,dY=touch.clientY-previousMousePosition.y;
        rotation.y+=dX*0.5;rotation.x+=dY*0.5;
        velocityX=dX*0.5;velocityY=dY*0.5;
        cubeElement.style.transform=`rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`; // Use cubeElement
        previousMousePosition={x:touch.clientX,y:touch.clientY};
        updateVisualsBasedOnFace();
        e.preventDefault();
    });
} // End of if (cubeElement)

// Global mouseup/touchend for reliable drag end and click detection
document.addEventListener('mouseup', (e) => {
    if (isDragging) { // Only process if a drag was initiated on the cube
        const deltaClickX = Math.abs(e.clientX - clickStartX);
        const deltaClickY = Math.abs(e.clientY - clickStartY);
        if (deltaClickX < clickThreshold && deltaClickY < clickThreshold) {
            handleCubeClick();
        }
    }
    isDragging = false;
    if(Math.abs(velocityX)>minVelocity||Math.abs(velocityY)>minVelocity)isSpinning=true;else isSpinning=false;
});

document.addEventListener('touchend', (e) => {
    if (isDragging) { // Only process if a drag was initiated on the cube
        const finalTouch = e.changedTouches[0];
        if (finalTouch) {
            const deltaClickX = Math.abs(finalTouch.clientX - clickStartX);
            const deltaClickY = Math.abs(finalTouch.clientY - clickStartY);
            if (deltaClickX < clickThreshold && deltaClickY < clickThreshold) {
                handleCubeClick();
            }
        }
    }
    isDragging = false;
    if(Math.abs(velocityX)>minVelocity||Math.abs(velocityY)>minVelocity)isSpinning=true;else isSpinning=false;
});

resetButton.addEventListener('click', ()=>{ /* ... same ... */
    isSpinning=false;velocityX=0;velocityY=0;rotation.x=0;rotation.y=0;
    cubeElement.style.transform='rotateX(0deg) rotateY(0deg)'; // Use cubeElement
    updateVisualsBasedOnFace();
    // Clear hover on reset
    if (currentlyHoveredFaceElement) {
        currentlyHoveredFaceElement.classList.remove('hover-highlight');
        currentlyHoveredFaceElement = null;
        lastHoveredFaceName = null;
    }
});

// --- Particle System & Main Loop ---
const canvas = document.getElementById('particleCanvas'); const ctx = canvas.getContext('2d');
let particlesArray = [];
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
class Particle{constructor(x,y,s,c,sX,sY){this.x=x;this.y=y;this.size=s;this.color=c;this.speedX=sX;this.speedY=sY;}update(){this.x+=this.speedX;this.y+=this.speedY;if(this.size>0.2)this.size-=0.03;}draw(){ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();}}
function initParticles(config){particlesArray=[];if(!config)config=particleConfigs.default;const count=Number.isFinite(config.count)?config.count:50;for(let i=0;i<count;i++){const s=Math.random()*5+2,x=Math.random()*canvas.width,y=Math.random()*canvas.height,sX=config.baseSpeedX+(Math.random()*config.randomSpeedXRange-config.randomSpeedXRange/2),sY=config.baseSpeedY+(Math.random()*config.randomSpeedYRange-config.randomSpeedYRange/2);particlesArray.push(new Particle(x,y,s,config.color,sX,sY));}}
function mainLoop(){ctx.clearRect(0,0,canvas.width,canvas.height);if(isSpinning&&!isDragging){rotation.y+=velocityX;rotation.x+=velocityY;velocityX*=damping;velocityY*=damping;if(Math.abs(velocityX)<minVelocity&&Math.abs(velocityY)<minVelocity){isSpinning=false;velocityX=0;velocityY=0;}cubeElement.style.transform=`rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;updateVisualsBasedOnFace();} // Use cubeElement
for(let i=0;i<particlesArray.length;i++){particlesArray[i].update();particlesArray[i].draw();if(particlesArray[i].size<=0.2||particlesArray[i].x<0||particlesArray[i].x>canvas.width||particlesArray[i].y<0||particlesArray[i].y>canvas.height){particlesArray.splice(i,1);i--;}}
const tC=Number.isFinite(currentParticleConfig.count)?currentParticleConfig.count:50;if(particlesArray.length<tC*0.75){const pTR=Math.min(tC-particlesArray.length,5);for(let i=0;i<pTR;i++){const s=Math.random()*5+2;let x,y;if(Math.abs(currentParticleConfig.baseSpeedX)>Math.abs(currentParticleConfig.baseSpeedY)&&currentParticleConfig.baseSpeedX!==0){x=currentParticleConfig.baseSpeedX>0?0-s:canvas.width+s;y=Math.random()*canvas.height;}else if(currentParticleConfig.baseSpeedY!==0){x=Math.random()*canvas.width;y=currentParticleConfig.baseSpeedY>0?0-s:canvas.height+s;}else{x=Math.random()*canvas.width;y=Math.random()*canvas.height;}
const sX=currentParticleConfig.baseSpeedX+(Math.random()*currentParticleConfig.randomSpeedXRange-currentParticleConfig.randomSpeedXRange/2),sY=currentParticleConfig.baseSpeedY+(Math.random()*currentParticleConfig.randomSpeedYRange-currentParticleConfig.randomSpeedYRange/2);particlesArray.push(new Particle(x,y,s,currentParticleConfig.color,sX,sY));}}
requestAnimationFrame(mainLoop);}

// --- Initial Setup Sequence ---
resizeCanvas(); storeInitialParticleConfigValues(); applyTheme(colorThemes[0].name);
lastDetectedFace = getFrontFacingFaceUsingNormals(rotation.x, rotation.y);
currentParticleConfig = particleConfigs[lastDetectedFace];
if (particleCountSlider) { const initialCount = parseInt(particleCountSlider.value); for (const face in particleConfigs) particleConfigs[face].count = initialCount; }
if (particleSpeedSlider) { const initialMultiplier = parseFloat(particleSpeedSlider.value); for (const face in particleConfigs) { if (originalSpeedsAndCounts[face]) { particleConfigs[face].baseSpeedX = originalSpeedsAndCounts[face].baseSpeedX * initialMultiplier; particleConfigs[face].baseSpeedY = originalSpeedsAndCounts[face].baseSpeedY * initialMultiplier; } } }
initParticles(currentParticleConfig); updateVisualsBasedOnFace(); mainLoop();
colorThemes[1].pageBackground = "#10355A";
// Renamed `cube` to `cubeElement` for DOM element to avoid confusion with `#cube` CSS selector in querySelector calls if those were ever ambiguous.
// Moved drag logic from document.mousemove to cubeElement.mousemove for hover integration.
// This might change drag behavior if mouse leaves cube while dragging. Consider if this is desired.
// For simplicity and to ensure hover logic is only active when over the cube, this change is made.
// Global mouseup/touchend listeners are kept for robust drag end detection.
// Ensured cubeElement is used for transform updates.
// Added clearing of hover effect on touchstart and during drag in cubeElement.mousemove.
// Added clearing of hover effect on reset.
