let currentOrderIndex = 0;
let correctOrder = [];
let lives = 3; // Initialize lives counter
let level = 1; // Initialize level
const minItems = 3; // Minimum number of items per level
let maxItems = 0; // Maximum number of items in the JSON file

// Fetch items from JSON file and set up the game
async function fetchItems() {
    const response = await fetch('assets/json/items.json');
    const items = await response.json();
    maxItems = items.length; // Get the total number of items available
    correctOrder = items.map(item => item.id); // Extract IDs for correct order
    shuffleArray(correctOrder); // Shuffle the order
    renderDraggableItems(items); // Render draggable items
    updateGameTitle(items); // Update title with the current order
    randomizeSpawnLocation(); // Randomize spawn locations
}

// Function to render draggable items dynamically with equal spacing
function renderDraggableItems(items) {
    const boxContainer = document.getElementById('draggable-container');
    boxContainer.innerHTML = ''; // Clear the boxContainer

    const numItemsToRender = Math.min(minItems + level - 1, maxItems); 
    const itemsToRender = correctOrder.slice(0, numItemsToRender).map(id => items.find(item => item.id === id));

    const containerWidth = boxContainer.clientWidth;
    const containerHeight = boxContainer.clientHeight;

    const itemWidth = 160; // Assuming fixed width for each item
    const itemHeight = 160; // Assuming fixed height for each item

    const rows = Math.ceil(Math.sqrt(numItemsToRender)); // Calculate rows for even distribution
    const cols = Math.ceil(numItemsToRender / rows); // Calculate columns needed

    const horizontalSpacing = (containerWidth - (cols * itemWidth)) / (cols + 1);
    const verticalSpacing = (containerHeight - (rows * itemHeight)) / (rows + 1);

    itemsToRender.forEach((item, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        const draggableDiv = document.createElement('div');
        draggableDiv.classList.add('draggable');
        draggableDiv.id = item.id;

        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.name;
        img.classList.add('draggable-image');

        draggableDiv.appendChild(img);
        boxContainer.appendChild(draggableDiv);

        // Set position with equal spacing
        draggableDiv.style.position = 'absolute';
        draggableDiv.style.left = `${horizontalSpacing + col * (itemWidth + horizontalSpacing)}px`;
        draggableDiv.style.top = `${verticalSpacing + row * (itemHeight + verticalSpacing)}px`;
    });
}


// Fisher-Yates shuffle to randomize order
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Update the title and game heading with the current order and level
function updateGameTitle(items) {
    const capitalizeFirstLetter = (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

    const numItemsToRender = Math.min(minItems + level - 1, maxItems); // Calculate the number of items for the current level
    const orderText = correctOrder.slice(0, numItemsToRender).map(id => items.find(item => item.id === id).name).map(capitalizeFirstLetter).join(", ");
    document.title = `Order: ${orderText}`;
    document.getElementById("game-title").textContent = `Level ${level} - Drag & Drop in Order: ${orderText} (${numItemsToRender} items)`;
}

// Update the lives counter on the screen
function updateLives() {
    document.getElementById("lives-counter").textContent = lives; // Update lives display
}

// Update the level counter on the screen
function updateLevel() {
    document.getElementById("level-counter").textContent = level; // Update level display
}

// Randomize the spawn location of draggable items
function randomizeSpawnLocation() {
    const spawnAreaWidth = window.height;
    const spawnAreaHeight = window.width;
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
        overlap: 0.5,
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

    // Update lives and level initially
    updateLives();
    updateLevel();
});

// Drag move listener to allow smooth dragging
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

function onDrop(event) {
    let draggableElement = event.relatedTarget;
    let itemId = draggableElement.getAttribute('id');

    // Get the dropzone's position
    const dropzoneRect = document.getElementById('dropzone').getBoundingClientRect();

    if (itemId === correctOrder[currentOrderIndex]) {
        currentOrderIndex++;
        draggableElement.style.visibility = 'hidden'; // Hide the correct item

        // Check if the current level is complete
        if (currentOrderIndex >= Math.min(minItems + level - 1, maxItems)) {
            level++; // Go to the next level
            currentOrderIndex = 0; // Reset order index for the new level
            resetItems(); // Reset items for the next level
        }
    } else {
        lives--; // Deduct a life on incorrect drop
        showMessage(`Incorrect! You have ${lives} lives left.`); // Show incorrect message

        // Return the incorrect item back to the draggable container
        returnItemToContainer(draggableElement);

        // Check if lives are 0
        if (lives <= 0) {
            alert("Game Over! No lives left. Restarting the game.");
            resetItems();
            return;
        }
    }

    updateLives();
}


// Function to return incorrect item to the draggable container
function returnItemToContainer(item) {
    const boxContainer = document.getElementById('draggable-container');
    item.style.transform = 'translate(0px, 0px)'; // Reset position
    item.setAttribute('data-x', 0);
    item.setAttribute('data-y', 0);
    boxContainer.appendChild(item); // Re-append to the container
}


// Show feedback message
function showMessage(msg) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = msg;
    setTimeout(() => {
        messageDiv.textContent = ''; // Clear the message after a delay
    }, 2000);
}

// Reset items and game state
function resetItems() {
    lives = 3; // Reset lives
    currentOrderIndex = 0; // Reset order index
    fetchItems(); // Fetch items again for new game
    updateLives(); // Update lives display
    updateLevel(); // Update level display
}
