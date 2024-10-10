let currentOrderIndex = 0;
let correctCounter = 0;
let incorrectCounter = 0;
let correctOrder = [];

// Fetch items from JSON file and set up the game
async function fetchItems() {
    const response = await fetch('assets/json/items.json'); // Corrected path
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
    const orderText = correctOrder.join(", ");
    const capitalizedOrderText = orderText.charAt(0).toUpperCase() + orderText.slice(1);
    document.title = `Order: ${capitalizedOrderText}`;
    document.getElementById("game-title").textContent = `Drag & Drop in Order: ${capitalizedOrderText}`;
}


// Update the counters on the screen
function updateCounters() {
    document.getElementById("correct-counter").textContent = correctCounter;
    document.getElementById("incorrect-counter").textContent = incorrectCounter;
}

// Randomize the spawn location of draggable items
function randomizeSpawnLocation() {
    const spawnAreaWidth = window.innerWidth;
    const spawnAreaHeight = window.innerHeight;
    const dropZone = document.getElementById('dropzone');

    const dropZoneRect = dropZone.getBoundingClientRect();

    document.querySelectorAll('.draggable').forEach((item) => {
        let randomTop, randomLeft;

        // Ensure that items do not spawn over the drop box or outside the screen
        do {
            randomTop = Math.floor(Math.random() * (spawnAreaHeight - item.offsetHeight));
            randomLeft = Math.floor(Math.random() * (spawnAreaWidth - item.offsetWidth));
        } while (
            randomTop < dropZoneRect.bottom && randomTop + item.offsetHeight > dropZoneRect.top &&
            randomLeft < dropZoneRect.right && randomLeft + item.offsetWidth > dropZoneRect.left
        );

        // Apply random spawn position
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

    // Update counters initially
    updateCounters();
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
    
    if (itemId === correctOrder[currentOrderIndex]) {
        correctCounter++;
        currentOrderIndex++;

        if (currentOrderIndex === correctOrder.length) {
            setTimeout(resetItems, 1000); // Reset after completing all items correctly
        }
    } else {
        incorrectCounter++;
        event.target.classList.add('wrong-drop');
        setTimeout(() => {
            event.target.classList.remove('wrong-drop');
        }, 500);
    }

    draggableElement.style.visibility = 'hidden';

    const allHidden = [...document.querySelectorAll('.draggable')].every(item => item.style.visibility === 'hidden');
    if (allHidden) {
        setTimeout(resetItems, 1000); // Reset after all items are hidden
    }

    updateCounters();
}
// Add this code at the end of your JavaScript

// Add event listener to reset button
document.getElementById('reset-button').addEventListener('click', resetItems);

// Reset function (already defined) will be used here
function resetItems() {
    currentOrderIndex = 0;

    // Shuffle order again
    shuffleArray(correctOrder);
    updateGameTitle();

    // Reset visibility and randomize positions of items
    document.querySelectorAll('.draggable').forEach(item => {
        item.style.visibility = 'visible';
        item.setAttribute("data-x", 0);
        item.setAttribute("data-y", 0);
        item.style.transform = 'translate(0px, 0px)';
    });

    randomizeSpawnLocation();
    document.getElementById("dropzone").classList.remove('drop-target', 'wrong-drop');

    // Reset counters
    correctCounter = 0;
    incorrectCounter = 0;
    updateCounters();
}
