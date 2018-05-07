// Caricamento delle librerie Node.js
const { app, BrowserWindow } = require("electron");
const path = require("path");
const url = require("url");

// Mantiene la referenza globale dell'oggetto window, in caso contrario
// la finestra verrà chiusa automaticamente quando l'oggetto JavaScript
// verrà deallocato dal garbage collector.
let win;

function createWindow() {
  // Creazione della GUI, non ancora visibile
  //win.setMenu(null);
  win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false
  });

  // Indichiamo quale file HTML deve essere renderizzato
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, "/www/index.html"),
      protocol: "file:",
      slashes: true
    })
  );

  // Quando la GUI è pronta allora mostriamo la finestra
  win.once("ready-to-show", () => {
    win.show();
  });

  // Evento di chiusura dell'applicazione
  win.on("closed", () => {
    // Deferenziamo l'oggetto window
    win = null;
  });
}

// Questo evento viene scatenato quanto Electron ha terminato il caricamento,
// alcune API possono essere chiamate ad inizializzazione avvenuta
app.on("ready", createWindow);

// Evento scatenato alla chiusura di tutte le finestre
app.on("window-all-closed", () => {
  // Su macOS le applicazioni e la loro barra dei menu rimangono attive
  // finché l'utente non forza la chiusara con Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Su macOS è una pratica comune ricreare la finestra quando
// viene cliccata l'icona sulla dock e non ci sono altre finestre aperte
app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});
