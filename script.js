// Initialize important variables
let currentOrderIndex = 0; // Tracks the current order for the correct items
let correctCounter = 0;    // Tracks the number of correct drops
let incorrectCounter = 0;  // Tracks the number of incorrect drops
const correctOrder = ["pen", "pencil", "eraser"]; // The correct order for dragging items

// Function to update the correct and incorrect counters on the screen
function updateCounters() {
    document.getElementById("correct-counter").textContent = `Correct: ${correctCounter}`;
    document.getElementById("incorrect-counter").textContent = `Incorrect: ${incorrectCounter}`;
}

// Function to randomize the spawn location of draggable items, ensuring they don't overlap the drop zone
function randomizeSpawnLocation() {
    const spawnAreaWidth = window.innerWidth;
    const spawnAreaHeight = window.innerHeight;
    const dropZone = document.getElementById('dropzone');

    // Get dimensions of the drop zone to prevent item spawn overlap
    const dropZoneRect = dropZone.getBoundingClientRect();

    // Iterate over each draggable item and assign random positions
    document.querySelectorAll('.draggable').forEach((item) => {
        let randomTop, randomLeft;

        // Keep generating random positions until they don't overlap with the drop zone
        do {
            randomTop = Math.floor(Math.random() * (spawnAreaHeight - item.offsetHeight));
            randomLeft = Math.floor(Math.random() * (spawnAreaWidth - item.offsetWidth));
        } while (
            randomTop < dropZoneRect.bottom && randomTop + item.offsetHeight > dropZoneRect.top &&
            randomLeft < dropZoneRect.right && randomLeft + item.offsetWidth > dropZoneRect.left
        );

        // Apply the randomized positions to the draggable items
        item.style.top = randomTop + 'px';
        item.style.left = randomLeft + 'px';
    });
}

// Function to handle the movement of draggable elements
function dragMoveListener(event) {
    let target = event.target; // The item being dragged
    let x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx; // Calculate the new x position
    let y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy; // Calculate the new y position

    // Update the item's transform property to move it to the new position
    target.style.transform = `translate(${x}px, ${y}px)`;

    // Store the new x and y coordinates for the next drag movement
    target.setAttribute("data-x", x);
    target.setAttribute("data-y", y);
}

// Function to add visual feedback when a draggable item enters the drop zone
function onDragEnter(event) {
    let dropzoneElement = event.target;
    dropzoneElement.classList.add('drop-target'); // Add a class to visually indicate the target zone
}

// Function to remove the visual feedback when the item leaves the drop zone
function onDragLeave(event) {
    let dropzoneElement = event.target;
    dropzoneElement.classList.remove('drop-target'); // Remove the visual feedback class
}

// Function to handle the logic when an item is dropped into the drop zone
function onDrop(event) {
    let draggableElement = event.relatedTarget;  // The dragged item that was dropped
    let itemId = draggableElement.getAttribute('id'); // Get the ID of the dropped item
    
    // Check if the item was dropped in the correct order
    if (itemId === correctOrder[currentOrderIndex]) {
        correctCounter++;     // Increment the correct counter
        currentOrderIndex++;  // Move to the next expected item in the correctOrder array

        // If all items are dropped in the correct order, reset the game
        if (currentOrderIndex === correctOrder.length) {
            setTimeout(resetItems, 1000); // Add a short delay before resetting
        }
    } else {
        incorrectCounter++;  // Increment the incorrect counter for a wrong drop

        // Briefly turn the drop zone red to indicate an incorrect drop
        event.target.classList.add('wrong-drop');
        setTimeout(() => {
            event.target.classList.remove('wrong-drop');
        }, 500);
    }

    // Hide the draggable item once it is dropped
    draggableElement.style.visibility = 'hidden';

    // Check if all draggable items are hidden, indicating the end of the game
    const allHidden = [...document.querySelectorAll('.draggable')].every(item => item.style.visibility === 'hidden');
    if (allHidden) {
        setTimeout(resetItems, 1000); // Reset the game if all items are hidden
    }

    // Update the counters on the screen after a drop
    updateCounters();
}

// Function to reset the game and randomize the draggable item positions
function resetItems() {
    currentOrderIndex = 0; // Reset the index for correct item order

    // Reset each draggable item's visibility and position
    document.querySelectorAll('.draggable').forEach(item => {
        item.style.visibility = 'visible';       // Make the item visible again
        item.setAttribute("data-x", 0);          // Reset the x-coordinate to 0
        item.setAttribute("data-y", 0);          // Reset the y-coordinate to 0
        item.style.transform = 'translate(0px, 0px)'; // Reset the item's position
    });

    // Call the function to randomize new spawn positions for the items
    randomizeSpawnLocation();

    // Remove any visual feedback classes from the drop zone
    document.getElementById("dropzone").classList.remove('drop-target', 'wrong-drop');

    // Reset counters to start the game fresh
    correctCounter = 0;
    incorrectCounter = 0;
    updateCounters(); // Update the counters on the screen
}

// Event listener for when the page has fully loaded
document.addEventListener("DOMContentLoaded", () => {

    // Initialize the drop zone, where items can be dropped, using Interact.js
    interact("#dropzone").dropzone({
        accept: ".draggable",     // Accept only elements with the class '.draggable'
        overlap: 0.75,            // Require 75% overlap for the drop to register
        ondragenter: onDragEnter, // Function for when an item enters the drop zone
        ondragleave: onDragLeave, // Function for when an item leaves the drop zone
        ondrop: onDrop            // Function for handling when an item is dropped
    });

    // Initialize draggable elements using Interact.js
    interact(".draggable").draggable({
        inertia: true,    // Makes dragging more fluid by adding inertia to movement
        autoScroll: true, // Automatically scroll the page if the item is dragged near the edge
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: "parent", // Restrict the draggable items within the parent container
                endOnly: true           // Allow dragging only within the boundaries
            })
        ],
        listeners: { move: dragMoveListener } // Handle the movement of dragged items
    });

    // Call the randomizeSpawnLocation function to set the initial positions of draggable items
    randomizeSpawnLocation();

    // Call the updateCounters function to set the initial counter values
    updateCounters();
});