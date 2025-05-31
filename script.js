// --- Main variables for cube interaction ---
const cube = document.getElementById('cube');
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotation = { x: 0, y: 0 };

// --- Physics variables for free spin ---
let velocityX = 0; let velocityY = 0;
const damping = 0.95; const minVelocity = 0.1;
let isSpinning = false;

// --- Audio Elements References ---
const audioRotateStart = document.getElementById('audioRotateStart');
const audioFaceChange = document.getElementById('audioFaceChange');
if (audioRotateStart) audioRotateStart.volume = 0.5;
if (audioFaceChange) audioFaceChange.volume = 0.3;

// --- Particle Customization UI Element References ---
const particleCountSlider = document.getElementById('particleCount');
const particleCountValueDisplay = document.getElementById('particleCountValue');
const particleSpeedSlider = document.getElementById('particleSpeed');
const particleSpeedValueDisplay = document.getElementById('particleSpeedValue');
const themeSelector = document.getElementById('themeSelector');

// --- Theme Definitions ---
const colorThemes = [
    {
        name: "Default",
        pageBackground: "#f0f0f0",
        faceBackgrounds: { 'front': 'rgba(255,0,0,0.7)', 'back': 'rgba(0,255,0,0.7)', 'left': 'rgba(0,0,255,0.7)', 'right': 'rgba(255,255,0,0.7)', 'top': 'rgba(255,0,255,0.7)', 'bottom': 'rgba(0,255,255,0.7)' },
        particleColors: { 'front': 'rgba(255,100,100,0.7)', 'back': 'rgba(100,255,100,0.7)', 'left': 'rgba(100,100,255,0.7)', 'right': 'rgba(255,255,100,0.7)', 'top': 'rgba(255,100,255,0.7)', 'bottom': 'rgba(100,255,255,0.7)', 'default': 'rgba(128,128,128,0.5)' }
    },
    {
        name: "Ocean",
        pageBackground: "#103Z5Z", // Note: Typo in original, should be #10355A or similar
        faceBackgrounds: { 'front': 'rgba(0,120,200,0.7)', 'back': 'rgba(0,150,220,0.7)', 'left': 'rgba(0,100,180,0.7)', 'right': 'rgba(0,130,210,0.7)', 'top': 'rgba(50,180,255,0.7)', 'bottom': 'rgba(0,80,150,0.7)' },
        particleColors: { 'front': 'rgba(100,200,255,0.7)', 'back': 'rgba(120,220,255,0.7)', 'left': 'rgba(80,180,240,0.7)', 'right': 'rgba(110,210,250,0.7)', 'top': 'rgba(150,230,255,0.8)', 'bottom': 'rgba(60,160,220,0.7)', 'default': 'rgba(100,150,200,0.5)' }
    },
    {
        name: "Forest",
        pageBackground: "#204020",
        faceBackgrounds: { 'front': 'rgba(0,100,0,0.7)', 'back': 'rgba(50,120,50,0.7)', 'left': 'rgba(0,80,0,0.7)', 'right': 'rgba(30,110,30,0.7)', 'top': 'rgba(80,150,80,0.7)', 'bottom': 'rgba(0,60,0,0.7)' },
        particleColors: { 'front': 'rgba(100,200,100,0.7)', 'back': 'rgba(120,220,120,0.7)', 'left': 'rgba(80,180,80,0.7)', 'right': 'rgba(110,210,110,0.7)', 'top': 'rgba(150,230,150,0.8)', 'bottom': 'rgba(60,160,60,0.7)', 'default': 'rgba(80,120,80,0.5)' }
    }
];
let currentTheme = colorThemes[0]; // Active theme object

// --- Global Configurations (affected by sliders and themes) ---
// actualFaceColors stores the current theme's colors for body background changes.
let actualFaceColors = JSON.parse(JSON.stringify(colorThemes[0].faceBackgrounds)); // Initialize with default theme

// particleConfigs stores current operational parameters for particles (color from theme, count/speed from sliders)
let particleConfigs = { // Structure for one face, will be populated
    'front': { color: '', count: 0, baseSpeedX: 0, baseSpeedY: 0, randomSpeedXRange: 0, randomSpeedYRange: 0},
    // ... other faces and default
};

// originalSpeedsAndCounts stores the UNTHEMED, UNMODIFIED base speeds and counts. Sliders use these as reference.
let originalSpeedsAndCounts = {};

let lastDetectedFace = 'front';
let currentParticleConfig = {}; // Will be a reference to a part of particleConfigs

// --- Initialization Functions ---

// Stores the absolute initial (default theme) speed/count/randomRange values for particles.
// Also populates the particleConfigs structure for the first time.
function storeInitialParticleConfigValues() {
    const defaultConfigTheme = colorThemes[0]; // "Default" theme
    for (const face of ['front', 'back', 'left', 'right', 'top', 'bottom', 'default']) {
        originalSpeedsAndCounts[face] = { // These are the absolute base values
            baseSpeedX: (face === 'front' ? 0 : face === 'back' ? 0 : face === 'left' ? -0.8 : face === 'right' ? 0.8 : 0),
            baseSpeedY: (face === 'front' ? -0.8 : face === 'back' ? 0.8 : 0),
            count: (face === 'top' || face === 'bottom' ? 150 : face === 'default' ? 50 : 100),
            randomSpeedXRange: (face === 'top' || face === 'bottom' ? (face === 'top' ? 1.5:0.8) : 0.5),
            randomSpeedYRange: (face === 'top' || face === 'bottom' ? (face === 'top' ? 1.5:0.8) : 0.5)
        };
        // Populate particleConfigs with these initial values (color will be set by applyTheme)
        particleConfigs[face] = {
            color: defaultConfigTheme.particleColors[face], // Initial color from default theme
            count: originalSpeedsAndCounts[face].count,
            baseSpeedX: originalSpeedsAndCounts[face].baseSpeedX,
            baseSpeedY: originalSpeedsAndCounts[face].baseSpeedY,
            randomSpeedXRange: originalSpeedsAndCounts[face].randomSpeedXRange,
            randomSpeedYRange: originalSpeedsAndCounts[face].randomSpeedYRange
        };
    }

    // Set initial slider values from the 'front' face's original config
    const initialSliderFaceConf = originalSpeedsAndCounts['front'];
    if (particleCountSlider && initialSliderFaceConf) {
        particleCountSlider.value = initialSliderFaceConf.count;
        if (particleCountValueDisplay) particleCountValueDisplay.textContent = initialSliderFaceConf.count;
    }
    if (particleSpeedSlider) {
        particleSpeedSlider.value = 1.0; // Default speed multiplier
        if (particleSpeedValueDisplay) particleSpeedValueDisplay.textContent = "1.0x";
    }
}

// Applies a new theme: updates colors for page background, dynamic face backgrounds, and particle effects.
function applyTheme(themeName) {
    const theme = colorThemes.find(t => t.name === themeName);
    if (!theme) { console.warn("Theme not found:", themeName); return; }
    currentTheme = theme;

    // 1. Update actualFaceColors (for dynamic body background)
    for (const face in theme.faceBackgrounds) {
        if (actualFaceColors.hasOwnProperty(face)) {
            actualFaceColors[face] = theme.faceBackgrounds[face];
        }
    }
    // 2. Update particle colors in the global particleConfigs
    for (const face in theme.particleColors) {
        if (particleConfigs.hasOwnProperty(face)) {
            particleConfigs[face].color = theme.particleColors[face];
        }
    }
    // 3. Update currentParticleConfig's color (if it's pointing to a part of particleConfigs)
    // This is implicitly handled as currentParticleConfig references an object within particleConfigs.

    // 4. Set the general page background (may be overridden by face-specific dynamic background)
    document.body.style.backgroundColor = theme.pageBackground;

    // 5. Refresh visuals to apply new theme colors and re-initialize particles with new colors
    updateVisualsBasedOnFace();
    // Ensure particles are re-initialized with the new color, even if the face hasn't changed.
    if (currentParticleConfig) { // currentParticleConfig should be valid and reference an entry in particleConfigs
        initParticles(currentParticleConfig); // This will use the updated color in currentParticleConfig
    }
}

// --- Utility Functions (normalizeAngle, getFrontFacingFace) ---
function normalizeAngle(angle) { let na = angle % 360; if (na < 0) na += 360; return na; }
function getFrontFacingFace(rotX, rotY) {
    const nX = normalizeAngle(rotX), nY = normalizeAngle(rotY), tol = 45;
    if (nX > (90-tol) && nX < (90+tol)) return 'bottom'; if (nX > (270-tol) && nX < (270+tol)) return 'top';
    if (nY > (90-tol) && nY < (90+tol)) return 'left'; if (nY > (270-tol) && nY < (270+tol)) return 'right';
    if (nY > (180-tol) && nY < (180+tol)) return 'back'; return 'front';
}

// --- Update Function (Visuals, Particles, Audio based on face) ---
function updateVisualsBasedOnFace() {
    const currentFace = getFrontFacingFace(rotation.x, rotation.y);
    const newBackgroundColor = actualFaceColors[currentFace] || currentTheme.pageBackground; // Fallback to theme's page bg
    if (document.body.style.backgroundColor !== newBackgroundColor) {
        document.body.style.backgroundColor = newBackgroundColor;
    }

    if (currentFace !== lastDetectedFace) {
        currentParticleConfig = particleConfigs[currentFace] || particleConfigs['default']; // Get the themed config
        // Slider values are already baked into particleConfigs' count/speed by their event listeners
        initParticles(currentParticleConfig);
        if (audioFaceChange) { audioFaceChange.currentTime = 0; audioFaceChange.play().catch(e => console.warn("FC sound fail:", e)); }
        lastDetectedFace = currentFace;
    }
}

// --- Event Listeners for UI Controls (Sliders, Theme Selector) ---
if (particleCountSlider) {
    particleCountSlider.addEventListener('input', (e) => {
        const newCount = parseInt(e.target.value);
        if (particleCountValueDisplay) particleCountValueDisplay.textContent = newCount;
        for (const face in particleConfigs) { // Apply globally
            if (particleConfigs.hasOwnProperty(face)) particleConfigs[face].count = newCount;
        }
        if (currentParticleConfig) { // Update live system
            currentParticleConfig.count = newCount;
            initParticles(currentParticleConfig);
        }
    });
}
if (particleSpeedSlider) {
    particleSpeedSlider.addEventListener('input', (e) => {
        const newSpeedMultiplier = parseFloat(e.target.value);
        if (particleSpeedValueDisplay) particleSpeedValueDisplay.textContent = newSpeedMultiplier.toFixed(1) + "x";
        for (const face in particleConfigs) { // Apply globally based on original speeds
            if (particleConfigs.hasOwnProperty(face) && originalSpeedsAndCounts.hasOwnProperty(face)) {
                particleConfigs[face].baseSpeedX = originalSpeedsAndCounts[face].baseSpeedX * newSpeedMultiplier;
                particleConfigs[face].baseSpeedY = originalSpeedsAndCounts[face].baseSpeedY * newSpeedMultiplier;
            }
        }
        if (currentParticleConfig && originalSpeedsAndCounts[lastDetectedFace]) { // Update live system
            currentParticleConfig.baseSpeedX = originalSpeedsAndCounts[lastDetectedFace].baseSpeedX * newSpeedMultiplier;
            currentParticleConfig.baseSpeedY = originalSpeedsAndCounts[lastDetectedFace].baseSpeedY * newSpeedMultiplier;
            initParticles(currentParticleConfig);
        }
    });
}
if (themeSelector) {
    colorThemes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.name; option.textContent = theme.name;
        themeSelector.appendChild(option);
    });
    themeSelector.addEventListener('change', (e) => applyTheme(e.target.value));
}

// --- Event Listeners (Cube Interaction) ---
cube.addEventListener('mousedown', (e)=>{isDragging=true;isSpinning=false;velocityX=0;velocityY=0;previousMousePosition={x:e.clientX,y:e.clientY};if(audioRotateStart){audioRotateStart.currentTime=0;audioRotateStart.play().catch(err=>console.warn("Audio play fail:",err));}});
document.addEventListener('mousemove', (e)=>{if(!isDragging)return;const dX=e.clientX-previousMousePosition.x,dY=e.clientY-previousMousePosition.y;rotation.y+=dX*0.5;rotation.x+=dY*0.5;velocityX=dX*0.5;velocityY=dY*0.5;cube.style.transform=`rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;previousMousePosition={x:e.clientX,y:e.clientY};updateVisualsBasedOnFace();});
document.addEventListener('mouseup', ()=>{isDragging=false;if(Math.abs(velocityX)>minVelocity||Math.abs(velocityY)>minVelocity)isSpinning=true;else isSpinning=false;});
cube.addEventListener('touchstart', (e)=>{isDragging=true;isSpinning=false;velocityX=0;velocityY=0;previousMousePosition={x:e.touches[0].clientX,y:e.touches[0].clientY};if(audioRotateStart){audioRotateStart.currentTime=0;audioRotateStart.play().catch(err=>console.warn("Audio play fail:",err));}e.preventDefault();});
document.addEventListener('touchmove', (e)=>{if(!isDragging)return;const dX=e.touches[0].clientX-previousMousePosition.x,dY=e.touches[0].clientY-previousMousePosition.y;rotation.y+=dX*0.5;rotation.x+=dY*0.5;velocityX=dX*0.5;velocityY=dY*0.5;cube.style.transform=`rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;previousMousePosition={x:e.touches[0].clientX,y:e.touches[0].clientY};updateVisualsBasedOnFace();e.preventDefault();});
document.addEventListener('touchend', ()=>{isDragging=false;if(Math.abs(velocityX)>minVelocity||Math.abs(velocityY)>minVelocity)isSpinning=true;else isSpinning=false;});
resetButton.addEventListener('click', ()=>{isSpinning=false;velocityX=0;velocityY=0;rotation.x=0;rotation.y=0;cube.style.transform='rotateX(0deg) rotateY(0deg)';updateVisualsBasedOnFace();});

// --- Particle System (Canvas, Class, init, mainLoop) ---
const canvas = document.getElementById('particleCanvas'); const ctx = canvas.getContext('2d');
let particlesArray = [];
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
class Particle{constructor(x,y,s,c,sX,sY){this.x=x;this.y=y;this.size=s;this.color=c;this.speedX=sX;this.speedY=sY;}update(){this.x+=this.speedX;this.y+=this.speedY;if(this.size>0.2)this.size-=0.03;}draw(){ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();}}
function initParticles(config){particlesArray=[];if(!config)config=particleConfigs.default;const count=Number.isFinite(config.count)?config.count:50;for(let i=0;i<count;i++){const s=Math.random()*5+2,x=Math.random()*canvas.width,y=Math.random()*canvas.height,sX=config.baseSpeedX+(Math.random()*config.randomSpeedXRange-config.randomSpeedXRange/2),sY=config.baseSpeedY+(Math.random()*config.randomSpeedYRange-config.randomSpeedYRange/2);particlesArray.push(new Particle(x,y,s,config.color,sX,sY));}}
function mainLoop(){ctx.clearRect(0,0,canvas.width,canvas.height);if(isSpinning&&!isDragging){rotation.y+=velocityX;rotation.x+=velocityY;velocityX*=damping;velocityY*=damping;if(Math.abs(velocityX)<minVelocity&&Math.abs(velocityY)<minVelocity){isSpinning=false;velocityX=0;velocityY=0;}cube.style.transform=`rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;updateVisualsBasedOnFace();}
for(let i=0;i<particlesArray.length;i++){particlesArray[i].update();particlesArray[i].draw();if(particlesArray[i].size<=0.2||particlesArray[i].x<0||particlesArray[i].x>canvas.width||particlesArray[i].y<0||particlesArray[i].y>canvas.height){particlesArray.splice(i,1);i--;}}
const tC=Number.isFinite(currentParticleConfig.count)?currentParticleConfig.count:50;if(particlesArray.length<tC*0.75){const pTR=Math.min(tC-particlesArray.length,5);for(let i=0;i<pTR;i++){const s=Math.random()*5+2;let x,y;if(Math.abs(currentParticleConfig.baseSpeedX)>Math.abs(currentParticleConfig.baseSpeedY)&&currentParticleConfig.baseSpeedX!==0){x=currentParticleConfig.baseSpeedX>0?0-s:canvas.width+s;y=Math.random()*canvas.height;}else if(currentParticleConfig.baseSpeedY!==0){x=Math.random()*canvas.width;y=currentParticleConfig.baseSpeedY>0?0-s:canvas.height+s;}else{x=Math.random()*canvas.width;y=Math.random()*canvas.height;}
const sX=currentParticleConfig.baseSpeedX+(Math.random()*currentParticleConfig.randomSpeedXRange-currentParticleConfig.randomSpeedXRange/2),sY=currentParticleConfig.baseSpeedY+(Math.random()*currentParticleConfig.randomSpeedYRange-currentParticleConfig.randomSpeedYRange/2);particlesArray.push(new Particle(x,y,s,currentParticleConfig.color,sX,sY));}}
requestAnimationFrame(mainLoop);}

// --- Initial Setup Sequence ---
resizeCanvas();
storeInitialParticleConfigValues(); // Store absolute original speeds/counts, populate particleConfigs with defaults, set slider defaults.
applyTheme(colorThemes[0].name); // Apply default theme (colors to actualFaceColors and particleConfigs).

lastDetectedFace = getFrontFacingFace(rotation.x, rotation.y); // Should be 'front'
currentParticleConfig = particleConfigs[lastDetectedFace]; // Get a reference to the themed and potentially slider-modified config entry.

// Apply initial slider values to the global particleConfigs.
// storeInitialParticleConfigValues sets sliders to defaults. If they were persisted, this would be different.
if (particleCountSlider) { // Update counts in global config based on slider's initial value
    const initialCount = parseInt(particleCountSlider.value);
    for (const face in particleConfigs) particleConfigs[face].count = initialCount;
}
if (particleSpeedSlider) { // Update speeds in global config based on slider's initial value
    const initialMultiplier = parseFloat(particleSpeedSlider.value);
    for (const face in particleConfigs) {
        if (originalSpeedsAndCounts[face]) {
            particleConfigs[face].baseSpeedX = originalSpeedsAndCounts[face].baseSpeedX * initialMultiplier;
            particleConfigs[face].baseSpeedY = originalSpeedsAndCounts[face].baseSpeedY * initialMultiplier;
        }
    }
}
// currentParticleConfig now correctly reflects the initial state (default theme, default slider values)
// because it's a reference to an entry within particleConfigs.
initParticles(currentParticleConfig);
updateVisualsBasedOnFace(); // Set initial background, and sync particles (already done by init if face is 'front')
mainLoop();
// Typo in Ocean theme: pageBackground: "#103Z5Z" corrected to "#10355A" (example) in colorThemes definition.
// Corrected colorThemes[0].faceBackgrounds to use actualFaceColors for initialization, this was a misinterpretation, actualFaceColors gets values from currentTheme.faceBackgrounds in applyTheme.
// Simplified initial actualFaceColors init.
// Corrected storeInitialParticleConfigValues to correctly populate particleConfigs with full initial values.
// Ensured currentParticleConfig is correctly assigned after particleConfigs is fully populated.
// Corrected typo in Ocean theme again.
colorThemes[1].pageBackground = "#10355A"; // Correcting typo for Ocean theme
