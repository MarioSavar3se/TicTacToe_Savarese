const statusDisplay = document.querySelector('.game--status');
let gameActive = true;
let currentPlayer = "X";
let gameState = ["", "", "", "", "", "", "", "", ""];

const winningMessage = () => `Player ${currentPlayer} has won!`;
const drawMessage = () => `Game ended with a draw!`;
const currentPlayerTurn = () => `It's ${currentPlayer}'s turn`;

// Recupera lo stato corrente del gioco dal database
function getDataFromDB(gameId) {
  const gameRef = database.ref('games/' + gameId);
  gameRef.on('value', (snapshot) => {     //uno snapshot è una vista statica dei dati in un certo punto nel tempo
    const gameData = snapshot.val();
    if (gameData) {
      gameState = gameData.gameState;
      currentPlayer = gameData.currentPlayer;
      gameActive = gameData.gameActive;
    }
  });
}

// Crea una nuova partita nel database
function createNewGame() {
  const gameRef = database.ref('games').push();
  const gameId = gameRef.key;

  // Aggiungi i dati iniziali della partita al database
  gameRef.set({
    gameState,
    currentPlayer,
    gameActive
  });

  // Aggiungi il gameId all'URL per condividerlo con l'altro giocatore
  const gameURL = window.location.href + '?gameId=' + gameId;
  console.log('Condividi il seguente URL con l\'altro giocatore:', gameURL);
}



// Recupera il gameId dai parametri dell'URL
function getGameIdFromURL() {
  const params = new URLSearchParams(window.location.search);   //collezione di parametri di query nella parte di ricerca dell'URL
  return params.get('gameId');  //Questo metodo restituisce il valore del parametro di query corrispondente all'argomento specificato. In altre parole, cerca il valore del parametro di query chiamato 'gameId'
}

// Recupera lo stato corrente del gioco dal database
function getGameState(gameId) {
  getDataFromDB(gameId);
  updateGameDisplay();
}

// Aggiorna l'interfaccia del gioco
function updateGameDisplay() {
  const cells = document.querySelectorAll('.cell');   //restituirà un'array contenente tutti gli elementi HTML che hanno la classe CSS "cell"
  for (let i = 0; i < gameState.length; i++) {
    cells[i].innerHTML = gameState[i];
  }
  statusDisplay.innerHTML = gameActive ? currentPlayerTurn() : gameActive === null ? '' : drawMessage();
}

// Gestisce il clic sulla cella di gioco
function handleCellClick(clickedCellEvent) {
  const clickedCell = clickedCellEvent.target;  //L'oggetto evento clickedCell ha una proprietà chiamata target che restituisce l'elemento HTML a cui l'evento è stato inizialmente indirizzato, ovvero l'elemento specifico che è stato cliccato.
  const clickedCellIndex = parseInt(clickedCell.getAttribute('data-cell-index')); //trasforma in un valore intero data-cell-index

  if (gameState[clickedCellIndex] !== "" || !gameActive) {
    return;
  }

  gameState[clickedCellIndex] = currentPlayer;
  clickedCell.innerHTML = currentPlayer;

  // Aggiorna lo stato del gioco nel database
  const gameId = getGameIdFromURL();
  const gameRef = database.ref('games/' + gameId);
  gameRef.update({
    gameState
  });

  // Controlla il risultato del gioco
  handleResultValidation();
}

// Controlla se c'è un vincitore o un pareggio
function handleResultValidation() {
  let roundWon = false;
  for (let i = 0; i <= 7; i++) {
    const winCondition = winningConditions[i];
    let a = gameState[winCondition[0]];
    let b = gameState[winCondition[1]];
    let c = gameState[winCondition[2]];
    if (a === '' || b === '' || c === '') {
      continue;
    }
    if (a === b && b === c) {
      roundWon = true;
      break;
    }
  }

  if (roundWon) {
    statusDisplay.innerHTML = winningMessage();
    gameActive = false;

    // Aggiorna lo stato del gioco nel database
    const gameId = getGameIdFromURL();
    const gameRef = database.ref('games/' + gameId);
    gameRef.update({
      gameActive: false
    });

    return;
  }

  let roundDraw = !gameState.includes("");  //restituisce true se la stringa di ricerca è presente nella stringa su cui viene chiamato, altrimenti restituisce false 
  if (roundDraw) {
    statusDisplay.innerHTML = drawMessage();
    gameActive = null;

    // Aggiorna lo stato del gioco nel database
    const gameId = getGameIdFromURL();
    const gameRef = database.ref('games/' + gameId);
    gameRef.update({
      gameActive: null
    });

    return;
  }

  handlePlayerChange();
}

// Gestisce il cambio del giocatore corrente
function handlePlayerChange() {
  currentPlayer = currentPlayer === "X" ? "O" : "X"; //condizione ? valoreSeVero : valoreSeFalso;
  statusDisplay.innerHTML = currentPlayerTurn();

  // Aggiorna lo stato del gioco nel database
  const gameId = getGameIdFromURL();
  const gameRef = database.ref('games/' + gameId);
  gameRef.update({
    currentPlayer
  });
}

// Gestisce il click sul pulsante "Restart Game"
function handleRestartGame() {
  const gameId = getGameIdFromURL();
  const gameRef = database.ref('games/' + gameId);

  // Resetta lo stato del gioco nel database
  gameRef.update({
    currentPlayer: "X",
    gameState,
    gameActive: true
  });

  // Resetta l'interfaccia del gioco
  const cells = document.querySelectorAll('.cell');
  cells.forEach(cell => (cell.innerHTML = "")); //utilizza il metodo forEach per iterare su ogni elemento nell'array-like object cells e assegna una stringa vuota ("") alla proprietà innerHTML di ciascun elemento
  statusDisplay.innerHTML = currentPlayerTurn();
}

// Imposta gli event listener
document.querySelectorAll('.cell').forEach(cell => cell.addEventListener('click', handleCellClick));
document.querySelector('.game--restart').addEventListener('click', handleRestartGame);

// Inizializza la partita
const gameId = getGameIdFromURL();
if (gameId) {
  // Recupera lo stato del gioco esistente dal database
  getGameState(gameId);
} else {
  // Crea una nuova partita nel database
  createNewGame();
}



//callback del dato che cambia (nativo)
