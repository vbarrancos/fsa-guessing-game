let GameState = function(difficulty) {
    this.guessLimit = 6;
    this.guesses = [];
    this.secretNumber = -1;
    this.gameOver = false;
    this.upperBound = 99;

    // switch(difficulty)
    // {
    //     case 0: //Easy
    //         break;
    //     case 1: //Medium
    //         break;
    //     case 2: //Hard
    //         break;
    // }
    this.secretNumber = Math.floor(Math.random() * (this.upperBound + 1))
}

GameState.prototype.makeGuess = function(guess) {
    console.log(`Input: ${guess} (${typeof(guess)})`)
    console.log(`Solution: ${this.secretNumber}`)
    let guessNumber = Number.parseInt(guess)
    if (this.gameOver)
        throw "Game is already over.";
    if (!Number.isInteger(guessNumber) || guessNumber < 0 || guessNumber > this.upperBound)
        throw `Enter a number from 0 to ${this.upperBound}.`;
    if (this.guesses.indexOf(guessNumber) !== -1)
        throw "That number has already been guessed.";
    this.guesses.push(guessNumber);
    if (guessNumber === this.secretNumber || this.guesses.length >= this.guessLimit)
        this.gameOver = true;
    return this.secretNumber - guessNumber;
}

let GuessingGame = function(ui) {
    this.uiGuessList = ui.querySelectorAll("#guess-numbers>div");
    this.uiGuessInput = ui.querySelector("#game-input>input");
    this.uiHeaderText = ui.querySelector("#game-header>h2");
    this.uiGuessButton = ui.querySelector("#guess-button");
    this.uiRestartButton = ui.querySelector("#newgame-button")
    this.uiGuessButton.onclick = this.tryGuess.bind(this)
    this.uiRestartButton.onclick = this.newGame.bind(this)
}

GuessingGame.prototype.newGame = function() {
    console.log(this)
    this.state = new GameState(0);
    this.uiGuessInput.setAttribute("placeholder", `0-${this.state.upperBound}`)
    this.updateGuessList();
}

GuessingGame.prototype.tryGuess = function() {
    let difference;
    let value = this.uiGuessInput.value;
    this.uiGuessInput.focus();
    this.uiGuessInput.value = ""
    try {
        this.state.makeGuess(value)
        this.updateGuessList();
    }
    catch(exception) {
        this.uiHeaderText.innerHTML = exception
    }

}

GuessingGame.prototype.updateGuessList = function() {
    for (let i = 0; i < this.state.guessLimit; i++) {
        let guess = this.state.guesses[i];
        this.uiGuessList[i].innerHTML = (guess === void(0) ? "" : guess)
    }
}