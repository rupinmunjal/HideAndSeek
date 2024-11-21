/**
 * Game State Management
 * Centralized state object containing all game-related variables
 */
const gameState = {
  currentOrderIndex: 0,
  correctOrder: [],
  lives: 3,
  level: 1,
  score: 0,
  minItems: 3,
  maxItems: 0,
  items: [],
  gameStarted: false,
  currentWord: "",
  shuffledItems: [],
  wordOrder: [],
  difficulty: "easy",
  timer: null,
  startTime: null,
};

/**
 * Game Configuration
 * Contains game settings and utility functions
 */
const gameConfig = {
  itemDimensions: { width: 160, height: 160 },
  itemSpacing: 20,
  difficultySettings: {
    easy: { timeLimit: 60, scoreMultiplier: 1 },
    medium: { timeLimit: 45, scoreMultiplier: 2 },
    hard: { timeLimit: 30, scoreMultiplier: 3 },
  },

  /**
   * Shuffles array elements
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
    return Math.min(
      gameState.minItems + gameState.level - 1,
      gameState.maxItems
    );
  },

  /**
   * Gets time limit based on difficulty
   * @returns {number} Time limit in seconds
   */
  getTimeLimit() {
    return this.difficultySettings[gameState.difficulty].timeLimit;
  },

  /**
   * Gets score multiplier based on difficulty
   * @returns {number} Score multiplier
   */
  getScoreMultiplier() {
    return this.difficultySettings[gameState.difficulty].scoreMultiplier;
  },
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
    document.getElementById(
      "game-level"
    ).textContent = `Level ${gameState.level}`;
  },

  /**
   * Updates the score display
   */
  updateScore() {
    document.getElementById("score-counter").textContent = gameState.score;
  },

  /**
   * Shows a temporary message to the user
   * @param {string} msg - Message to display
   */
  showMessage(msg) {
    const messageDiv = document.getElementById("message");
    messageDiv.textContent = msg;
    setTimeout(() => (messageDiv.textContent = ""), 2000);
  },

  /**
   * Updates the timer display
   * @param {number} timeLeft - Time left in seconds
   */
  updateTimer(timeLeft) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById("timer").textContent = `Time: ${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  },
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
    const boxContainer = document.getElementById("draggable-container");
    boxContainer.innerHTML = "";

    const itemCount = gameConfig.getItemCountForLevel();

    const itemsToRender = [...items].slice(0, itemCount);
    const wordOrderItems = [...itemsToRender];

    gameConfig.shuffleArray(itemsToRender);
    gameConfig.shuffleArray(wordOrderItems);

    gameState.shuffledItems = itemsToRender;
    gameState.wordOrder = wordOrderItems;

    const totalWidth =
      itemCount * gameConfig.itemDimensions.width +
      (itemCount - 1) * gameConfig.itemSpacing;

    boxContainer.style.width = `${totalWidth}px`;
    boxContainer.style.margin = "0 auto";

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
    const draggableDiv = document.createElement("div");
    draggableDiv.classList.add("draggable");
    draggableDiv.id = item.id;
    draggableDiv.setAttribute("aria-label", item.name);
    draggableDiv.setAttribute("role", "button");
    draggableDiv.setAttribute("tabindex", "0");

    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.name;
    img.classList.add("draggable-image");

    img.onerror = function () {
      console.error(`Failed to load image: ${item.image}`);
      this.src = "path/to/placeholder-image.png";
    };

    draggableDiv.appendChild(img);
    draggableDiv.style.position = "absolute";
    draggableDiv.style.left = `${position.left}px`;
    draggableDiv.style.top = `${position.top}px`;

    return draggableDiv;
  },
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
    uiManager.updateScore();
  },

  /**
   * Handles correct item drops
   *  @param {HTMLElement} element - Dropped element
   */
  handleCorrectDrop(element) {
    element.style.visibility = "hidden";
    gameState.currentOrderIndex++;
    gameState.score += 10 * gameConfig.getScoreMultiplier();

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
      gameManager.endGame("Game Over! You ran out of lives.");
    }
  },

  /**
   * Returns item to original container
   * @param {HTMLElement} item - Item to return
   */
  returnItemToContainer(item) {
    item.style.transform = "translate(0px, 0px)";
    item.setAttribute("data-x", 0);
    item.setAttribute("data-y", 0);
    document.getElementById("draggable-container").appendChild(item);
  },
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
    this.setupBackButton();
    uiManager.updateLives();
    uiManager.updateLevel();
    uiManager.updateScore();
    this.setDifficulty();
  },

  /**
   * Fetches game items from server
   */
  async fetchItems() {
    try {
      const response = await fetch("assets/json/items.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Select a random index from available categories
      const randomIndex = Math.floor(Math.random() * data.wlist.length);

      // Set items to the selected random category
      gameState.items = data.wlist[randomIndex].map((name, index) => ({
        id: `item-${index}`,
        name: name,
        image: data.ilist[randomIndex][index],
      }));

      gameState.maxItems = gameState.items.length;
      gameState.correctOrder = gameState.items.map((item) => item.id);
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
    const startButton = document.getElementById("startButton");
    startButton.addEventListener("click", () => this.startGame());
  },

  /**
   * Sets up the back button
   */
  setupBackButton() {
    const backButton = document.getElementById("back-to-home");
    backButton.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  },

  /**
   * Starts the game
   */
  startGame() {
    if (!gameState.gameStarted) {
      gameState.gameStarted = true;
      gameConfig.shuffleArray(gameState.items);
      itemRenderer.renderDraggableItems(gameState.items);
      document.getElementById("startButton").style.display = "none";
      uiManager.showMessage(
        "Game Started! Arrange the items in the correct order."
      );
      this.startTimer();
    }
  },

  /**
   * Shows the next word to match
   */
  showNextWord() {
    if (gameState.currentOrderIndex < gameConfig.getItemCountForLevel()) {
      const currentWord = gameState.wordOrder[gameState.currentOrderIndex];
      gameState.currentWord = currentWord.name;
      document.getElementById(
        "game-title"
      ).textContent = `Arrange: ${currentWord.name}`;
    }
  },

  /**
   * Sets up drag and drop interactions
   */
  setupInteractions() {
    interact(".dropzone").dropzone({
      accept: ".draggable",
      overlap: 0.5,
      ondragenter: (event) => event.target.classList.add("drop-target"),
      ondragleave: (event) => event.target.classList.remove("drop-target"),
      ondrop: (event) => dragDropHandler.onDrop(event),
    });

    interact(".draggable").draggable({
      inertia: true,
      autoScroll: true,
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: "parent",
          endOnly: true,
        }),
      ],
      listeners: { move: dragDropHandler.dragMoveListener },
    });
  },

  /**
   * Sets up the reset button
   */
  setupResetButton() {
    const resetButton = document.getElementById("reset-button");
    resetButton.addEventListener("click", () => this.resetGame());
  },

  /**
   * Resets the current level
   */
  resetLevel() {
    gameState.currentOrderIndex = 0;
    gameConfig.shuffleArray(gameState.items);
    itemRenderer.renderDraggableItems(gameState.items);
    uiManager.updateLevel();
    this.resetTimer();
    this.startTimer(); 
  },

  /**
   * Resets the entire game
   */
  resetGame() {
    gameState.lives = 3;
    gameState.level = 1;
    gameState.score = 0;
    gameState.currentOrderIndex = 0;
    gameState.gameStarted = false;
    document.getElementById("startButton").style.display = "block";
    document.getElementById("draggable-container").innerHTML = "";
    document.getElementById("game-title").textContent = "Arrange the Items";
    this.fetchItems();
    uiManager.updateLives();
    uiManager.updateLevel();
    uiManager.updateScore();
    uiManager.showMessage("Game Reset! Press Start to begin.");
    this.resetTimer();
  },

  /**
   * Sets the game difficulty based on URL parameter
   */
  setDifficulty() {
    const urlParams = new URLSearchParams(window.location.search);
    const difficulty = urlParams.get("difficulty");
    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      gameState.difficulty = difficulty;
    }
  },

  /**
   * Starts the game timer
   */
  startTimer() {
    gameState.startTime = Date.now();
    const timeLimit = gameConfig.getTimeLimit();

    gameState.timer = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
      const timeLeft = Math.max(0, timeLimit - elapsedTime);

      uiManager.updateTimer(timeLeft);

      if (timeLeft === 0) {
        this.endGame("Time's up!");
      }
    }, 1000);
  },

  /**
   * Resets the game timer
   */
  resetTimer() {
    if (gameState.timer) {
      clearInterval(gameState.timer);
    }
    uiManager.updateTimer(gameConfig.getTimeLimit());
  },

  /**
   * Ends the game
   * @param {string} message - End game message
   */
  endGame(message) {
    clearInterval(gameState.timer);
    alert(`${message} Your final score is ${gameState.score}.`);
    this.resetGame();
  },
};

/**
 * Theme Manager
 * Handles theme switching functionality
 */
const themeManager = {
  init() {
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        document.body.dataset.theme =
          document.body.dataset.theme === "dark" ? "light" : "dark";
        localStorage.setItem("theme", document.body.dataset.theme);
      });
    }

    // Set initial theme based on localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.body.dataset.theme = savedTheme;
      if (themeToggle) {
        themeToggle.checked = savedTheme === "dark";
      }
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.body.dataset.theme = "dark";
      if (themeToggle) {
        themeToggle.checked = true;
      }
    }
  },
};

/**
 * Application Initialization
 */
document.addEventListener("DOMContentLoaded", () => {
  gameManager.init();
  themeManager.init();
});
