/**
 * Game State Management
 * Centralized state object containing all game-related variables
 */
const gameState = {
    currentOrderIndex: 0,
    correctOrder: [],
    lives: 3,
    level: 1,
    minItems: 3,
    maxItems: 0,
    items: [],
    gameStarted: false,
    currentWord: '',
    shuffledItems: [],
    wordOrder: []
};

/**
 * Game Configuration
 * Contains game settings and utility functions
 */
const gameConfig = {
    itemDimensions: { width: 160, height: 160 },
    itemSpacing: 20,

    /**
     * Shuffles array elements using Fisher-Yates algorithm
     * @param {Array} array - Array to be shuffled
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    /**
     * Calculates number of items for current level
     * @returns {number} Number of items for current level
     */
    getItemCountForLevel() {
        return Math.min(gameState.minItems + gameState.level - 1, gameState.maxItems);
    }
};

/**
 * UI Management
 * Handles all user interface updates and messages
 */
const uiManager = {
    /**
     * Updates the lives display
     */
    updateLives() {
        document.getElementById("lives-counter").textContent = gameState.lives;
    },

    /**
     * Updates the level display
     */
    updateLevel() {
        document.getElementById("level-counter").textContent = gameState.level;
        document.getElementById("game-level").textContent = `Level ${gameState.level}`;
    },

    /**
     * Shows a temporary message to the user
     * @param {string} msg - Message to display
     */
    showMessage(msg) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = msg;
        setTimeout(() => messageDiv.textContent = '', 2000);
    }
};

/**
 * Item Rendering System
 * Handles the visual representation and positioning of game items
 */
const itemRenderer = {
    /**
     * Renders draggable items in the container
     * @param {Array} items - Array of items to render
     */
    renderDraggableItems(items) {
        const boxContainer = document.getElementById('draggable-container');
        boxContainer.innerHTML = '';

        const itemCount = gameConfig.getItemCountForLevel();
        
        const itemsToRender = [...items].slice(0, itemCount);
        const wordOrderItems = [...itemsToRender];
        
        gameConfig.shuffleArray(itemsToRender);
        gameConfig.shuffleArray(wordOrderItems);
        
        gameState.shuffledItems = itemsToRender;
        gameState.wordOrder = wordOrderItems;
        
        const totalWidth = (itemCount * gameConfig.itemDimensions.width) +
            ((itemCount - 1) * gameConfig.itemSpacing);

        boxContainer.style.width = `${totalWidth}px`;
        boxContainer.style.margin = '0 auto';

        itemsToRender.forEach((item, index) => {
            const position = this.calculateItemPosition(index);
            const draggableDiv = this.createDraggableItem(item, position);
            boxContainer.appendChild(draggableDiv);
        });

        gameManager.showNextWord();
    },

    /**
     * Calculates position for an item
     * @param {number} index - Item index
     * @returns {Object} Position coordinates
     */
    calculateItemPosition(index) {
        const { width } = gameConfig.itemDimensions;
        return { left: index * (width + gameConfig.itemSpacing), top: 0 };
    },

    /**
     * Creates a draggable item element
     * @param {Object} item - Item data
     * @param {Object} position - Position coordinates
     * @returns {HTMLElement} Draggable element
     */
    createDraggableItem(item, position) {
        const draggableDiv = document.createElement('div');
        draggableDiv.classList.add('draggable');
        draggableDiv.id = item.id;

        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.name;
        img.classList.add('draggable-image');

        img.onerror = function() {
            console.error(`Failed to load image: ${item.image}`);
            this.src = 'path/to/placeholder-image.png';
        };

        draggableDiv.appendChild(img);
        draggableDiv.style.position = 'absolute';
        draggableDiv.style.left = `${position.left}px`;
        draggableDiv.style.top = `${position.top}px`;

        return draggableDiv;
    }
};

/**
 * Drag and Drop System
 * Manages all drag and drop interactions and their consequences
 */
const dragDropHandler = {
    /**
     * Handles drag movement
     * @param {Event} event - Drag event
     */
    dragMoveListener(event) {
        const target = event.target;
        const x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute("data-x", x);
        target.setAttribute("data-y", y);
    },

    /**
     * Handles drop events
     * @param {Event} event - Drop event
     */
    onDrop(event) {
        const draggableElement = event.relatedTarget;
        const itemId = draggableElement.id;

        if (itemId === gameState.wordOrder[gameState.currentOrderIndex].id) {
            this.handleCorrectDrop(draggableElement);
        } else {
            this.handleIncorrectDrop(draggableElement);
        }

        uiManager.updateLives();
    },

    /**
     * Handles correct item drops
     *  @param {HTMLElement} element - Dropped element
     */
    handleCorrectDrop(element) {
        element.style.visibility = 'hidden';
        gameState.currentOrderIndex++;
    
        if (gameState.currentOrderIndex >= gameConfig.getItemCountForLevel()) {
            gameState.level++;
            gameState.currentOrderIndex = 0;
            gameManager.resetLevel();
        } else {
            gameManager.showNextWord();
        }
    },

    /**
     * Handles incorrect item drops
     * @param {HTMLElement} element - Dropped element
     */
    handleIncorrectDrop(element) {
        gameState.lives--;
        uiManager.showMessage(`Incorrect! You have ${gameState.lives} lives left.`);
        this.returnItemToContainer(element);

        if (gameState.lives <= 0) {
            alert("Game Over! Restarting.");
            gameManager.resetGame();
        }
    },

    /**
     * Returns item to original container
     * @param {HTMLElement} item - Item to return
     */
    returnItemToContainer(item) {
        item.style.transform = 'translate(0px, 0px)';
        item.setAttribute('data-x', 0);
        item.setAttribute('data-y', 0);
        document.getElementById('draggable-container').appendChild(item);
    }
};

/**
 * Game Manager
 * Core game logic and initialization
 */
const gameManager = {
    /**
     * Initializes the game
     */
    async init() {
        await this.fetchItems();
        this.setupInteractions();
        this.setupResetButton();
        this.setupStartButton();
        uiManager.updateLives();
        uiManager.updateLevel();
    },

    /**
     * Fetches game items from server
     */
    async fetchItems() {
        try {
            const response = await fetch('assets/json/items.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const items = await response.json();
            gameState.items = items;
            gameState.maxItems = items.length;
            gameState.correctOrder = items.map(item => item.id);
            gameConfig.shuffleArray(gameState.correctOrder);
        } catch (error) {
            console.error("Failed to fetch items:", error);
            uiManager.showMessage("Failed to load game items. Please try again.");
        }
    },

    /**
     * Sets up the start button
     */
    setupStartButton() {
        const startButton = document.getElementById('startButton');
        startButton.addEventListener('click', () => this.startGame());
    },

    /**
     * Starts the game
     */
    startGame() {
        if (!gameState.gameStarted) {
            gameState.gameStarted = true;
            gameConfig.shuffleArray(gameState.items);
            itemRenderer.renderDraggableItems(gameState.items);
            document.getElementById('startButton').style.display = 'none';
            uiManager.showMessage('Game Started! Arrange the items in the correct order.');
        }
    },

    /**
     * Shows the next word to match
     */
    showNextWord() {
        if (gameState.currentOrderIndex < gameConfig.getItemCountForLevel()) {
            const currentWord = gameState.wordOrder[gameState.currentOrderIndex];
            gameState.currentWord = currentWord.name;
            document.getElementById('game-title').textContent = `Arrange: ${currentWord.name}`;
        }
    },

    /**
     * Sets up drag and drop interactions
     */
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
                interact.modifiers.restrictRect({ restriction: "parent", endOnly: true })
            ],
            listeners: { move: dragDropHandler.dragMoveListener }
        });
    },

    /**
     * Sets up the reset button
     */
    setupResetButton() {
        const resetButton = document.getElementById('reset-button');
        resetButton.addEventListener('click', () => this.resetGame());
    },

    /**
     * Resets the current level
     */
    resetLevel() {
        gameState.currentOrderIndex = 0;
        gameConfig.shuffleArray(gameState.items);
        itemRenderer.renderDraggableItems(gameState.items);
        uiManager.updateLevel();
    },

    /**
     * Resets the entire game
     */
    resetGame() {
        gameState.lives = 3;
        gameState.level = 1;
        gameState.currentOrderIndex = 0;
        gameState.gameStarted = false;
        document.getElementById('startButton').style.display = 'block';
        document.getElementById('draggable-container').innerHTML = '';
        document.getElementById('game-title').textContent = 'Arrange the Items';
        this.fetchItems();
        uiManager.updateLives();
        uiManager.updateLevel();
        uiManager.showMessage('Game Reset! Press Start to begin.');
    }
};

/**
 * Theme Manager
 * Handles theme switching functionality
 */
const themeManager = {
    init() {
        document.getElementById('theme-toggle').addEventListener('click', () => {
            document.body.dataset.theme = 
                document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        });
    }
};

/**
 * Application Initialization
 */
document.addEventListener("DOMContentLoaded", () => {
    gameManager.init();
    themeManager.init();
});