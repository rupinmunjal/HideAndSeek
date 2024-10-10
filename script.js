let currentOrderIndex = 0;
let correctOrder = [];
let lives = 3; // Initialize lives counter

// Fetch items from JSON file and set up the game
async function fetchItems() {
    const response = await fetch('assets/json/items.json');
    const items = await response.json();
    correctOrder = items.map(item => item.id); // Extract IDs for correct order
    shuffleArray(correctOrder); // Shuffle the order
    renderDraggableItems(items); // Render draggable items
    updateGameTitle(); // Update title with the current order
    randomizeSpawnLocation(); // Randomize spawn locations
}

// Function to render draggable items dynamically
function renderDraggableItems(items) {
    const container = document.getElementById('draggable-container');
    container.innerHTML = ''; // Clear the container

    items.forEach(item => {
        const draggableDiv = document.createElement('div');
        draggableDiv.classList.add('draggable');
        draggableDiv.id = item.id;

        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.name;
        img.classList.add('draggable-image');

        draggableDiv.appendChild(img);
        container.appendChild(draggableDiv);
    });
}

// Fisher-Yates shuffle to randomize order
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Update the title and game heading with the current order
function updateGameTitle() {
    const capitalizeFirstLetter = (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    
    const orderText = correctOrder.map(capitalizeFirstLetter).join(", ");
    document.title = `Order: ${orderText}`;
    document.getElementById("game-title").textContent = `Drag & Drop in Order: ${orderText}`;
}

// Update the lives counter on the screen
function updateLives() {
    document.getElementById("lives-counter").textContent = lives; // Update lives display
}

// Randomize the spawn location of draggable items
function randomizeSpawnLocation() {
    const spawnAreaWidth = window.innerWidth;
    const spawnAreaHeight = window.innerHeight;
    const dropZone = document.getElementById('dropzone');

    const dropZoneRect = dropZone.getBoundingClientRect();

    document.querySelectorAll('.draggable').forEach((item) => {
        let randomTop, randomLeft;

        do {
            randomTop = Math.floor(Math.random() * (spawnAreaHeight - item.offsetHeight));
            randomLeft = Math.floor(Math.random() * (spawnAreaWidth - item.offsetWidth));
        } while (
            randomTop < dropZoneRect.bottom && randomTop + item.offsetHeight > dropZoneRect.top &&
            randomLeft < dropZoneRect.right && randomLeft + item.offsetWidth > dropZoneRect.left
        );

        item.style.position = 'absolute'; // Ensure items are absolutely positioned
        item.style.top = randomTop + 'px';
        item.style.left = randomLeft + 'px';
    });
}

// Drag and drop logic
document.addEventListener("DOMContentLoaded", async () => {
    await fetchItems(); // Fetch items and setup the game

    interact(".dropzone").dropzone({
        accept: ".draggable",
        overlap: 0.75,
        ondragenter: onDragEnter,
        ondragleave: onDragLeave,
        ondrop: onDrop
    });

    interact(".draggable").draggable({
        inertia: true,
        autoScroll: true,
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: "parent",
                endOnly: true
            })
        ],
        listeners: { move: dragMoveListener }
    });

    // Update lives initially
    updateLives();
});

// Move dragged elements
function dragMoveListener(event) {
    let target = event.target;
    let x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
    let y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

    target.style.transform = `translate(${x}px, ${y}px)`;
    target.setAttribute("data-x", x);
    target.setAttribute("data-y", y);
}

function onDragEnter(event) {
    let dropzoneElement = event.target;
    dropzoneElement.classList.add('drop-target');
}

function onDragLeave(event) {
    let dropzoneElement = event.target;
    dropzoneElement.classList.remove('drop-target');
}

// Handle the drop logic
function onDrop(event) {
    let draggableElement = event.relatedTarget;
    let itemId = draggableElement.getAttribute('id');

    // Get the dropzone's position
    const dropzoneRect = document.getElementById('dropzone').getBoundingClientRect();

    if (itemId === correctOrder[currentOrderIndex]) {
        currentOrderIndex++;
        draggableElement.style.visibility = 'hidden'; // Hide the correct item
    } else {
        lives--; // Deduct a life on incorrect drop
        showMessage(`Incorrect! You have ${lives} lives left.`); // Show incorrect message
        
        // Push the item away from the dropzone
        pushAway(draggableElement, dropzoneRect);

        // Check if lives are 0
        if (lives <= 0) {
            alert("Game Over! No lives left. Restarting the game.");
            resetItems();
            return;
        }
    }

    const allHidden = [...document.querySelectorAll('.draggable')].every(item => item.style.visibility === 'hidden');
    if (allHidden) {
        setTimeout(resetItems, 1000); // Reset after all items are hidden
    }

    updateLives();
}

// Function to push the item away from the drop zone
function pushAway(draggableElement, dropzoneRect) {
    const itemRect = draggableElement.getBoundingClientRect();

    // Calculate the center position of the dropzone
    const dropzoneCenterX = dropzoneRect.left + dropzoneRect.width / 2;
    const dropzoneCenterY = dropzoneRect.top + dropzoneRect.height / 2;

    // Calculate the center position of the draggable item
    const itemCenterX = itemRect.left + itemRect.width / 2;
    const itemCenterY = itemRect.top + itemRect.height / 2;

    // Calculate the direction from the dropzone center to the item center
    const deltaX = itemCenterX - dropzoneCenterX;
    const deltaY = itemCenterY - dropzoneCenterY;

    // Normalize the direction vector
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const normX = deltaX / distance;
    const normY = deltaY / distance;

    // Push the item away by a specific distance (e.g., 100 pixels)
    const pushDistance = 100;
    const newLeft = itemRect.left + (normX * pushDistance);
    const newTop = itemRect.top + (normY * pushDistance);

    // Apply the new position to the draggable item
    draggableElement.style.position = 'absolute'; // Make sure it's positioned absolutely
    draggableElement.style.left = newLeft + 'px';
    draggableElement.style.top = newTop + 'px';
}


// Function to show messages to the user
function showMessage(message) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    setTimeout(() => {
        messageDiv.textContent = ''; // Clear message after 2 seconds
    }, 2000);
}

// Add event listener to reset button
document.getElementById('reset-button').addEventListener('click', resetItems);

// Reset function
function resetItems() {
    currentOrderIndex = 0;
    lives = 3; // Reset lives
    shuffleArray(correctOrder); // Shuffle order again
    updateGameTitle(); // Update the game title

    // Reset visibility and randomize positions of items
    document.querySelectorAll('.draggable').forEach(item => {
        item.style.visibility = 'visible';
        item.setAttribute("data-x", 0);
        item.setAttribute("data-y", 0);
        item.style.transform = 'translate(0px, 0px)';
    });

    randomizeSpawnLocation();
    document.getElementById("dropzone").classList.remove('drop-target');

    // Reset lives counter
    updateLives();
}
