# OBIETTIVO
Realizzare chat singola, creare app desktop con electron, salvare utenti su database, creare server con nodeJs.

# FUNZIONAMENTO
Chat singola funzionante.
Possibilità di registrazione, controllo accesso.
Controllo doppio accesso, non consentito.
Durante login recupero di tutti gli utenti nel db in ordine alfabetico e lista caricata a vista.
Possibilità di effettuare il logout.
In caso di errore di qualche query logout automatico.
Al click sulla chat vengono recuperate tutte le chat con quel determinato utente. Rimane vuoto nel caso di nessuna chat.
Nel caso un utente invii un messaggio mentre siamo on line questo ci viene notificato immediatamente, se abbiamo la schermata di chat con quell'utente aperta allora il messaggio viene aggiunto 
altrimenti viene aggiunto un numero incrementale vicino al nome della chat e viene scrollata la lista degli utenti.
Viene notificato vicino al nome di un utente se questo è on o off.
Nel caso di registrazione nuovo utente, se noi siamo on line, questo ci viene notificato e l'utente viene aggiunto alla lista utenti.

# PRIMO AVVIO
Scaricare il progetto, eseguire il comando "node node.js" nella cartella pricipale, eseguire il comando "electron electron.js" se si desidera aprire una finestra desktop, 
collegarsi al link "127.0.0.1:8100" per aprire l'interfaccia web.
Creare un database mysql con il nome "chatprogetto" e eseguire l'sql inserito all'interno del file "chatprogetto.sql".
Tutta la grafica è all'interno del file index.html, gestita tramite il file style.css all'interno della cartella css.
N.B. 
Per avviare il progetto sono necessari: npm, node, electron, xampp (per avviare il server e per la gestione del database), un browser.

