// Main variables for cube interaction
const cube = document.getElementById('cube');
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotation = { x: 0, y: 0 };

// --- Color & Particle Configurations ---

// Mapping of face names to their CSS background colors for the page background
const actualFaceColors = {
    'front': 'rgba(255, 0, 0, 0.7)',
    'back': 'rgba(0, 255, 0, 0.7)',
    'left': 'rgba(0, 0, 255, 0.7)', // Original .right face (Blue)
    'right': 'rgba(255, 255, 0, 0.7)', // Original .left face (Yellow)
    'top': 'rgba(255, 0, 255, 0.7)',
    'bottom': 'rgba(0, 255, 255, 0.7)'
};

// Configurations for particle effects based on the front-facing cube face
const particleConfigs = {
    'front': { color: 'rgba(255, 100, 100, 0.7)', count: 100, baseSpeedX: 0, baseSpeedY: -0.8, randomSpeedXRange: 0.5, randomSpeedYRange: 0.5 }, // Red face, particles up
    'back': { color: 'rgba(100, 255, 100, 0.7)', count: 100, baseSpeedX: 0, baseSpeedY: 0.8, randomSpeedXRange: 0.5, randomSpeedYRange: 0.5 },  // Green face, particles down
    'left': { color: 'rgba(100, 100, 255, 0.7)', count: 100, baseSpeedX: -0.8, baseSpeedY: 0, randomSpeedXRange: 0.5, randomSpeedYRange: 0.5 }, // Blue face, particles left
    'right': { color: 'rgba(255, 255, 100, 0.7)', count: 100, baseSpeedX: 0.8, baseSpeedY: 0, randomSpeedXRange: 0.5, randomSpeedYRange: 0.5 },// Yellow face, particles right
    'top': { color: 'rgba(255, 100, 255, 0.7)', count: 150, baseSpeedX: 0, baseSpeedY: 0, randomSpeedXRange: 1.5, randomSpeedYRange: 1.5 },   // Magenta face, exploding/swirling
    'bottom': { color: 'rgba(100, 255, 255, 0.7)', count: 150, baseSpeedX: 0, baseSpeedY: 0, randomSpeedXRange: 0.8, randomSpeedYRange: 0.8 }, // Cyan face, imploding/slower swirl
    'default': { color: 'rgba(128, 128, 128, 0.5)', count: 50, baseSpeedX: 0, baseSpeedY: 0, randomSpeedXRange: 0.5, randomSpeedYRange: 0.5 } // Fallback
};

let lastDetectedFace = 'front'; // Stores the last detected face to check for changes
let currentParticleConfig = particleConfigs[lastDetectedFace]; // Set initial particle config

// --- Utility Functions ---

// Normalizes angle to 0-360 range
function normalizeAngle(angle) {
    let newAngle = angle % 360;
    if (newAngle < 0) newAngle += 360;
    return newAngle;
}

// Determines which face of the cube is most directly facing the viewer
function getFrontFacingFace(rotX, rotY) {
    const normX = normalizeAngle(rotX);
    const normY = normalizeAngle(rotY);
    const tolerance = 45;
    if (normX > (90 - tolerance) && normX < (90 + tolerance)) return 'bottom';
    if (normX > (270 - tolerance) && normX < (270 + tolerance)) return 'top';
    if (normY > (90 - tolerance) && normY < (90 + tolerance)) return 'left';
    if (normY > (270 - tolerance) && normY < (270 + tolerance)) return 'right';
    if (normY > (180 - tolerance) && normY < (180 + tolerance)) return 'back';
    return 'front';
}

// --- Update Functions (Background and Particles) ---

// Updates page background color and particle system based on the current cube face
function updateVisualsBasedOnFace() {
    const currentFace = getFrontFacingFace(rotation.x, rotation.y);

    // Update background color
    const newBackgroundColor = actualFaceColors[currentFace];
    if (newBackgroundColor && document.body.style.backgroundColor !== newBackgroundColor) {
        document.body.style.backgroundColor = newBackgroundColor;
    }

    // Update particles if the face has changed
    if (currentFace !== lastDetectedFace) {
        currentParticleConfig = particleConfigs[currentFace] || particleConfigs['default'];
        initParticles(currentParticleConfig); // Re-initialize particles with new config
        lastDetectedFace = currentFace;
    }
}

// --- Event Listeners (Cube Interaction) ---

cube.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;
    rotation.y += deltaX * 0.5;
    rotation.x += deltaY * 0.5;
    cube.style.transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;
    updateVisualsBasedOnFace(); // Update background and particles
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

document.addEventListener('mouseup', () => { isDragging = false; });

// Touch events
cube.addEventListener('touchstart', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    e.preventDefault();
});

document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - previousMousePosition.x;
    const deltaY = e.touches[0].clientY - previousMousePosition.y;
    rotation.y += deltaX * 0.5;
    rotation.x += deltaY * 0.5;
    cube.style.transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;
    updateVisualsBasedOnFace(); // Update background and particles
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    e.preventDefault();
});

document.addEventListener('touchend', () => { isDragging = false; });

// Reset button functionality
const resetButton = document.getElementById('resetCube');
resetButton.addEventListener('click', () => {
    rotation.x = 0;
    rotation.y = 0;
    cube.style.transform = 'rotateX(0deg) rotateY(0deg)';
    updateVisualsBasedOnFace(); // Update background and particles to 'front' state
});

// --- Particle Animation System ---

const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particlesArray = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

// Particle class definition
class Particle {
    constructor(x, y, size, color, speedX, speedY) {
        this.x = x; this.y = y; this.size = size; this.color = color;
        this.speedX = speedX; this.speedY = speedY;
    }
    update() {
        this.x += this.speedX; this.y += this.speedY;
        if (this.size > 0.2) this.size -= 0.03; // Slower shrink
    }
    draw() {
        ctx.fillStyle = this.color; ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
    }
}

// Initializes particles based on the provided configuration object
function initParticles(config) {
    particlesArray = []; // Clear existing particles
    if (!config) config = particleConfigs['default']; // Fallback safety

    for (let i = 0; i < config.count; i++) {
        const size = Math.random() * 5 + 2;
        const x = Math.random() * canvas.width; // Initial position anywhere on canvas
        const y = Math.random() * canvas.height;

        // Calculate speed based on config's base speed and random range
        const speedX = config.baseSpeedX + (Math.random() * config.randomSpeedXRange - config.randomSpeedXRange / 2);
        const speedY = config.baseSpeedY + (Math.random() * config.randomSpeedYRange - config.randomSpeedYRange / 2);

        particlesArray.push(new Particle(x, y, size, config.color, speedX, speedY));
    }
}

// Animation loop for particles
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();

        // Remove particles if they are too small or off-screen
        if (particlesArray[i].size <= 0.2 ||
            particlesArray[i].x < 0 || particlesArray[i].x > canvas.width ||
            particlesArray[i].y < 0 || particlesArray[i].y > canvas.height) {
            particlesArray.splice(i, 1);
            i--; // Adjust index after removal
        }
    }

    // Replenish particles to maintain desired count according to current config
    // This creates a continuous effect.
    if (particlesArray.length < currentParticleConfig.count * 0.75) { // Replenish if count drops below 75%
        const particlesToReplenish = Math.min(currentParticleConfig.count - particlesArray.length, 5); // Add up to 5 per frame
        for (let i = 0; i < particlesToReplenish; i++) {
            const size = Math.random() * 5 + 2;
            let x, y;

            // Spawn particles from edges based on their general direction of movement
            // This makes the replenishment look more natural.
            if (Math.abs(currentParticleConfig.baseSpeedX) > Math.abs(currentParticleConfig.baseSpeedY) && currentParticleConfig.baseSpeedX !== 0) { // Horizontal movement is dominant
                x = currentParticleConfig.baseSpeedX > 0 ? 0 - size : canvas.width + size; // Spawn on left or right edge
                y = Math.random() * canvas.height;
            } else if (currentParticleConfig.baseSpeedY !== 0) { // Vertical movement is dominant or primary
                x = Math.random() * canvas.width;
                y = currentParticleConfig.baseSpeedY > 0 ? 0 - size : canvas.height + size; // Spawn on top or bottom edge
            } else { // No dominant base speed (e.g., swirling/exploding effects)
                x = Math.random() * canvas.width; // Spawn randomly across canvas
                y = Math.random() * canvas.height;
            }

            const speedX = currentParticleConfig.baseSpeedX + (Math.random() * currentParticleConfig.randomSpeedXRange - currentParticleConfig.randomSpeedXRange / 2);
            const speedY = currentParticleConfig.baseSpeedY + (Math.random() * currentParticleConfig.randomSpeedYRange - currentParticleConfig.randomSpeedYRange / 2);
            particlesArray.push(new Particle(x, y, size, currentParticleConfig.color, speedX, speedY));
        }
    }
    requestAnimationFrame(animateParticles);
}

// --- Initial Setup Calls ---
resizeCanvas(); // Set initial canvas size
lastDetectedFace = getFrontFacingFace(rotation.x, rotation.y); // Determine initial face
currentParticleConfig = particleConfigs[lastDetectedFace] || particleConfigs['default']; // Set initial particle config
initParticles(currentParticleConfig); // Initialize particles with the correct config for the initial face
updateVisualsBasedOnFace(); // Set initial background color and potentially particles
animateParticles(); // Start the animation loop
