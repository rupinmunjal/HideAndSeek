let currentOrderIndex = 0;
let correctCounter = 0;
let incorrectCounter = 0;
const correctOrder = ["pen", "pencil", "eraser"];

// Update the counters on screen
function updateCounters() {
    document.getElementById("correct-counter").textContent = `Correct: ${correctCounter}`;
    document.getElementById("incorrect-counter").textContent = `Incorrect: ${incorrectCounter}`;
}

// Randomize the spawn location of draggable items
function randomizeSpawnLocation() {
    const spawnAreaWidth = window.innerWidth;
    const spawnAreaHeight = window.innerHeight;
    const dropZone = document.getElementById('dropzone');

    // Get drop zone dimensions to avoid spawning over it
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
        item.style.top = randomTop + 'px';
        item.style.left = randomLeft + 'px';
    });
}

document.addEventListener("DOMContentLoaded", () => {
    interact("#dropzone").dropzone({
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

    // Randomize spawn location when the page loads
    randomizeSpawnLocation();

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
    
    // Check if the dropped element matches the required order
    if (itemId === correctOrder[currentOrderIndex]) {
        correctCounter++;
        currentOrderIndex++;

        if (currentOrderIndex === correctOrder.length) {
            // Reset the game after completing all items correctly
            setTimeout(resetItems, 1000); // Add a short delay before respawning
        }
    } else {
        incorrectCounter++;
        // Turn the drop box red on incorrect drop
        event.target.classList.add('wrong-drop');
        setTimeout(() => {
            event.target.classList.remove('wrong-drop');
        }, 500);
    }

    // Hide the dropped item
    draggableElement.style.visibility = 'hidden';

    // Check if there are no more visible draggable items
    const allHidden = [...document.querySelectorAll('.draggable')].every(item => item.style.visibility === 'hidden');
    if (allHidden) {
        setTimeout(resetItems, 1000); // Add a short delay before respawning
    }

    // Update counters
    updateCounters();
}

// Respawn items and randomize locations
function resetItems() {
    currentOrderIndex = 0;

    // Reset visibility and randomize positions of items
    document.querySelectorAll('.draggable').forEach(item => {
        item.style.visibility = 'visible';
        item.setAttribute("data-x", 0);
        item.setAttribute("data-y", 0);
        item.style.transform = 'translate(0px, 0px)';
    });

    // Randomize new spawn positions
    randomizeSpawnLocation();

    // Reset dropzone color
    document.getElementById("dropzone").classList.remove('drop-target', 'wrong-drop');

    // Reset counters (if needed, for a new game)
    correctCounter = 0;
    incorrectCounter = 0;
    updateCounters();
}
