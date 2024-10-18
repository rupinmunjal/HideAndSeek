// Game state variables
const gameState = {
    currentOrderIndex: 0,
    correctOrder: [],
    lives: 3,
    level: 1,
    minItems: 3,
    maxItems: 0
};

// Game configuration and utilities
const gameConfig = {
    itemDimensions: {
        width: 160,
        height: 160
    },
    itemSpacing: 20, // Space between items

    // Fisher-Yates shuffle algorithm
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    // Calculate number of items for current level
    getItemCountForLevel() {
        return Math.min(gameState.minItems + gameState.level - 1, gameState.maxItems);
    },

    // Capitalize first letter of a word
    capitalizeFirstLetter(word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
};

// UI update functions
const uiManager = {
    updateLives() {
        document.getElementById("lives-counter").textContent = gameState.lives;
    },

    updateLevel() {
        document.getElementById("level-counter").textContent = gameState.level;
    },

    updateGameTitle(items) {
        const itemCount = gameConfig.getItemCountForLevel();
        const orderText = gameState.correctOrder
            .slice(0, itemCount)
            .map(id => items.find(item => item.id === id).name)
            .map(gameConfig.capitalizeFirstLetter)
            .join(", ");

        document.title = `Order: ${orderText}`;
        document.getElementById("game-level").textContent = `Level ${gameState.level}`;
        document.getElementById("game-title").textContent = `${orderText}`;
    },

    showMessage(msg) {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = msg;
        setTimeout(() => messageDiv.textContent = '', 2000);
    }
};

// Item rendering and positioning
const itemRenderer = {
    renderDraggableItems(items) {
        const boxContainer = document.getElementById('draggable-container');
        boxContainer.innerHTML = '';

        const itemCount = gameConfig.getItemCountForLevel();
        const itemsToRender = gameState.correctOrder
            .slice(0, itemCount)
            .map(id => items.find(item => item.id === id));

        // Calculate total width needed
        const totalWidth = (itemCount * gameConfig.itemDimensions.width) +
            ((itemCount - 1) * gameConfig.itemSpacing);

        // Center the container
        boxContainer.style.width = `${totalWidth}px`;
        boxContainer.style.margin = '0 auto';

        // Create and position items
        itemsToRender.forEach((item, index) => {
            const position = this.calculateItemPosition(index);
            const draggableDiv = this.createDraggableItem(item, position);
            boxContainer.appendChild(draggableDiv);
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

        draggableDiv.appendChild(img);
        draggableDiv.style.position = 'absolute';
        draggableDiv.style.left = `${position.left}px`;
        draggableDiv.style.top = `${position.top}px`;

        return draggableDiv;
    }
};

// Drag and drop handlers
const dragDropHandler = {
    dragMoveListener(event) {
        const target = event.target;
        const x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute("data-x", x);
        target.setAttribute("data-y", y);
    },

    onDrop(event) {
        const draggableElement = event.relatedTarget;
        const itemId = draggableElement.id;

        if (itemId === gameState.correctOrder[gameState.currentOrderIndex]) {
            this.handleCorrectDrop(draggableElement);
        } else {
            this.handleIncorrectDrop(draggableElement);
        }

        uiManager.updateLives();
    },

    handleCorrectDrop(element) {
        element.style.visibility = 'hidden';
        gameState.currentOrderIndex++;

        if (gameState.currentOrderIndex >= gameConfig.getItemCountForLevel()) {
            gameState.level++;
            gameState.currentOrderIndex = 0;
            gameManager.resetLevel();
        }
    },

    handleIncorrectDrop(element) {
        gameState.lives--;
        uiManager.showMessage(`Incorrect! You have ${gameState.lives} lives left.`);
        this.returnItemToContainer(element);

        if (gameState.lives <= 0) {
            alert("Game Over! No lives left. Restarting the game.");
            gameManager.resetGame();
        }
    },

    returnItemToContainer(item) {
        item.style.transform = 'translate(0px, 0px)';
        item.setAttribute('data-x', 0);
        item.setAttribute('data-y', 0);
        document.getElementById('draggable-container').appendChild(item);
    }
};

// Game manager
const gameManager = {
    async init() {
        await this.fetchItems();
        this.setupInteractions();
        this.setupResetButton();
        uiManager.updateLives();
        uiManager.updateLevel();
    },

    async fetchItems() {
        const response = await fetch('assets/json/items.json');
        const items = await response.json();
        gameState.maxItems = items.length;
        gameState.correctOrder = items.map(item => item.id);
        gameConfig.shuffleArray(gameState.correctOrder);
        itemRenderer.renderDraggableItems(items);
        uiManager.updateGameTitle(items);
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
        resetButton.addEventListener('click', () => this.resetGame());
    },

    resetLevel() {
        gameState.currentOrderIndex = 0;
        this.fetchItems();
        uiManager.updateLevel();
    },

    resetGame() {
        gameState.lives = 3;
        gameState.level = 1;
        gameState.currentOrderIndex = 0;
        this.fetchItems();
        uiManager.updateLives();
        uiManager.updateLevel();
        uiManager.showMessage('Game Reset!');
    }
};

// Initialize the game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => gameManager.init());