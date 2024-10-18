// Game state variables
const gameState = {
    currentOrderIndex: 0,
    correctOrder: [],
    lives: 3,
    level: 1,
    minItems: 3,
    maxItems: 0,
    audioContext: null,
    isPlaying: false  // Add state to prevent multiple simultaneous plays
};

// Game configuration and utilities
const gameConfig = {
    itemDimensions: {
        width: 160,
        height: 160
    },
    itemSpacing: 20,

    shuffleArray(array) {
        const newArray = [...array]; // Create a copy to avoid mutating original
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray; // Return new array instead of modifying in place
    },

    getItemCountForLevel() {
        return Math.min(gameState.minItems + gameState.level - 1, gameState.maxItems);
    },

    capitalizeFirstLetter(word) {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
};

// Initialize audio context
function initAudio() {
    if (!gameState.audioContext) {
        gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Function to play audio with debouncing
async function playAudio(itemName) {
    if (gameState.isPlaying) return; // Prevent multiple simultaneous plays
    
    try {
        gameState.isPlaying = true;
        
        if (!gameState.audioContext) {
            initAudio();
        }

        if (gameState.audioContext.state === 'suspended') {
            await gameState.audioContext.resume();
        }

        const response = await fetch(`assets/audio/${itemName.toLowerCase()}.mp3`);
        if (!response.ok) throw new Error(`Failed to load audio: ${response.statusText}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await gameState.audioContext.decodeAudioData(arrayBuffer);
        const source = gameState.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(gameState.audioContext.destination);
        
        return new Promise((resolve) => {
            source.onended = () => {
                gameState.isPlaying = false;
                resolve();
            };
            source.start();
        });
    } catch (error) {
        console.error('Error playing audio:', error);
        gameState.isPlaying = false;
    }
}

// UI update functions
const uiManager = {
    elements: {}, // Cache DOM elements

    init() {
        this.elements = {
            livesCounter: document.getElementById("lives-counter"),
            levelCounter: document.getElementById("level-counter"),
            gameTitle: document.getElementById("game-title"),
            gameLevel: document.getElementById("game-level"),
            message: document.getElementById("message"),
            draggableContainer: document.getElementById("draggable-container")
        };
    },

    updateLives() {
        this.elements.livesCounter.textContent = gameState.lives;
    },

    updateLevel() {
        this.elements.levelCounter.textContent = gameState.level;
    },

    updateGameTitle(items) {
        const itemCount = gameConfig.getItemCountForLevel();
        const orderText = gameState.correctOrder
            .slice(0, itemCount)
            .map(id => {
                const item = items.find(item => item.id === id);
                return item ? gameConfig.capitalizeFirstLetter(item.name) : '';
            })
            .filter(Boolean)
            .join(", ");

        document.title = `Order: ${orderText}`;
        this.elements.gameLevel.textContent = `Level ${gameState.level}`;
        this.elements.gameTitle.textContent = orderText;
    },

    showMessage(msg, duration = 2000) {
        if (!this.elements.message) return;
        
        this.elements.message.textContent = msg;
        clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            if (this.elements.message) {
                this.elements.message.textContent = '';
            }
        }, duration);
    }
};

// Item renderer with improved positioning and error handling
const itemRenderer = {
    renderDraggableItems(items) {
        if (!items || !items.length) return;

        const container = uiManager.elements.draggableContainer;
        if (!container) return;

        container.innerHTML = '';

        const itemCount = gameConfig.getItemCountForLevel();
        const itemsToRender = gameState.correctOrder
            .slice(0, itemCount)
            .map(id => items.find(item => item.id === id))
            .filter(Boolean);

        const totalWidth = (itemCount * gameConfig.itemDimensions.width) +
            ((itemCount - 1) * gameConfig.itemSpacing);

        container.style.width = `${totalWidth}px`;
        container.style.margin = '0 auto';

        itemsToRender.forEach((item, index) => {
            const position = this.calculateItemPosition(index);
            const draggableDiv = this.createDraggableItem(item, position);
            container.appendChild(draggableDiv);
        });
    },

    calculateItemPosition(index) {
        const { width: itemWidth } = gameConfig.itemDimensions;
        return {
            left: index * (itemWidth + gameConfig.itemSpacing),
            top: 0
        };
    },

    createDraggableItem(item, position) {
        const draggableDiv = document.createElement('div');
        draggableDiv.classList.add('draggable');
        draggableDiv.id = item.id;

        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.name;
        img.classList.add('draggable-image');
        img.onerror = () => {
            img.src = 'assets/images/placeholder.png'; // Fallback image
        };

        draggableDiv.appendChild(img);
        draggableDiv.style.position = 'absolute';
        draggableDiv.style.left = `${position.left}px`;
        draggableDiv.style.top = `${position.top}px`;

        return draggableDiv;
    }
};

// Improved drag and drop handlers with better error handling
const dragDropHandler = {
    dragMoveListener(event) {
        const target = event.target;
        if (!target) return;

        const x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute("data-x", x);
        target.setAttribute("data-y", y);
    },

    async onDrop(event) {
        const draggableElement = event.relatedTarget;
        if (!draggableElement) return;

        const itemId = draggableElement.id;
        const isCorrect = itemId === gameState.correctOrder[gameState.currentOrderIndex];

        if (isCorrect) {
            await this.handleCorrectDrop(draggableElement);
        } else {
            await this.handleIncorrectDrop(draggableElement);
        }

        uiManager.updateLives();
    },

    async handleCorrectDrop(element) {
        element.style.visibility = 'hidden';
        gameState.currentOrderIndex++;
        await playAudio('correct');

        if (gameState.currentOrderIndex >= gameConfig.getItemCountForLevel()) {
            gameState.level++;
            gameState.currentOrderIndex = 0;
            gameManager.resetLevel();
        }
    },

    async handleIncorrectDrop(element) {
        gameState.lives--;
        await playAudio('incorrect');
        
        if (gameState.lives <= 0) {
            alert("Game Over! No lives left. Restarting the game.");
            gameManager.resetGame();
        } else {
            uiManager.showMessage(`Incorrect! You have ${gameState.lives} lives left.`);
            this.returnItemToContainer(element);
        }
    },

    returnItemToContainer(item) {
        if (!item) return;
        
        item.style.transform = 'translate(0px, 0px)';
        item.setAttribute('data-x', 0);
        item.setAttribute('data-y', 0);
        
        const container = uiManager.elements.draggableContainer;
        if (container && item.parentElement !== container) {
            container.appendChild(item);
        }
    }
};

// Improved game manager with better error handling and state management
const gameManager = {
    async init() {
        try {
            uiManager.init();
            initAudio();
            await this.fetchItems();
            this.setupInteractions();
            this.setupResetButton();
            uiManager.updateLives();
            uiManager.updateLevel();
        } catch (error) {
            console.error('Error initializing game:', error);
            uiManager.showMessage('Error initializing game. Please refresh the page.');
        }
    },

    async fetchItems() {
        try {
            const response = await fetch('assets/json/items.json');
            if (!response.ok) throw new Error('Failed to fetch items');
            
            const items = await response.json();
            gameState.maxItems = items.length;
            gameState.correctOrder = gameConfig.shuffleArray(items.map(item => item.id));
            itemRenderer.renderDraggableItems(items);
            uiManager.updateGameTitle(items);
        } catch (error) {
            console.error('Error fetching items:', error);
            uiManager.showMessage('Error loading game items. Please refresh the page.');
        }
    },

    setupInteractions() {
        interact(".dropzone").dropzone({
            accept: ".draggable",
            overlap: 0.5,
            ondragenter: (event) => event.target.classList.add('drop-target'),
            ondragleave: (event) => event.target.classList.remove('drop-target'),
            ondrop: (event) => dragDropHandler.onDrop(event)
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
            listeners: { move: dragDropHandler.dragMoveListener }
        });
    },

    setupResetButton() {
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetGame());
        }
    },

    async resetLevel() {
        gameState.currentOrderIndex = 0;
        await this.fetchItems();
        uiManager.updateLevel();
    },

    async resetGame() {
        gameState.lives = 3;
        gameState.level = 1;
        gameState.currentOrderIndex = 0;
        await this.fetchItems();
        uiManager.updateLives();
        uiManager.updateLevel();
        uiManager.showMessage('Game Reset!');
    }
};

// Initialize the game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => gameManager.init());