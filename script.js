// Main variables for cube interaction
const cube = document.getElementById('cube'); // The 3D cube element
let isDragging = false; // Flag to track if the mouse button is pressed
let previousMousePosition = { x: 0, y: 0 }; // Stores the last mouse position
let rotation = { x: 0, y: 0 }; // Stores the current rotation of the cube

// Event listener for mouse button press on the cube
cube.addEventListener('mousedown', (e) => {
    isDragging = true; // Start dragging
    previousMousePosition = { x: e.clientX, y: e.clientY }; // Store initial mouse position
});

// Event listener for mouse movement on the document
document.addEventListener('mousemove', (e) => {
    if (!isDragging) return; // Only run if dragging

    // Calculate change in mouse position
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    // Update rotation based on mouse movement
    rotation.y += deltaX * 0.5; // Rotate around Y-axis
    rotation.x += deltaY * 0.5; // Rotate around X-axis (inverted for natural feel)

    // Apply the rotation to the cube
    cube.style.transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;

    // Update previous mouse position
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

// Event listener for mouse button release on the document
document.addEventListener('mouseup', () => {
    isDragging = false; // Stop dragging
});

// Touch event support for mobile devices
// Event listener for touch start on the cube
cube.addEventListener('touchstart', (e) => {
    isDragging = true; // Start dragging
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }; // Store initial touch position
    e.preventDefault(); // Prevent default touch action (like scrolling)
});

// Event listener for touch movement on the document
document.addEventListener('touchmove', (e) => {
    if (!isDragging) return; // Only run if dragging

    // Calculate change in touch position
    const deltaX = e.touches[0].clientX - previousMousePosition.x;
    const deltaY = e.touches[0].clientY - previousMousePosition.y;

    // Update rotation based on touch movement
    rotation.y += deltaX * 0.5;
    rotation.x += deltaY * 0.5;

    // Apply the rotation to the cube
    cube.style.transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;

    // Update previous touch position
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    e.preventDefault(); // Prevent default touch action
});

// Event listener for touch end on the document
document.addEventListener('touchend', () => {
    isDragging = false; // Stop dragging
});

// Reset button functionality
const resetButton = document.getElementById('resetCube'); // The reset button element
// Event listener for click on the reset button
resetButton.addEventListener('click', () => {
    rotation.x = 0; // Reset X-axis rotation
    rotation.y = 0; // Reset Y-axis rotation
    cube.style.transform = 'rotateX(0deg) rotateY(0deg)'; // Apply reset rotation to the cube
});
