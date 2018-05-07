var express = require("express");
var app = express();
var server_web = require("http").createServer(app);
var web_socket = require("socket.io")(server_web);
app.use("/", express.static(__dirname + "/www"));
var users_logged = [];
var sha512 = require("js-sha512");
var mysql = require("mysql");

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "chatprogetto"
});
//CONNETTI AL DB
connessione(con);

//SOCkET
web_socket.on("connection", function(client) {
  //GESTIONE REGISTRAZIONE CLIENT
  client.on("register", function(data) {
    insertClient(data, client);
  });

  client.on("login", function(data) {
    console.log("E' stato richiesto il login");
    login(data, client);
  });

  client.on("loginSpecial", function(data) {
    console.log("E' stato richiesto il loginSpecial");
    loginSpecial(data, client);
  });

  client.on("getMessage", function(data) {
    console.log("Sono stati richiesti dei messaggi!");
    getMessage(data, client);
  });

  //Restituisce dal nick l'id dell'utente
  client.on("getMyId", function(data) {
    getMyId(data, client);
  });

  client.on("disconnect", function(data) {
    if (data == "voluta") {
      disconnect(client);
      client.close();
      return;
    }
    console.log(
      "Richiesta disconnessione specicale" +
        client.nickname +
        " - " +
        client.privateId
    );
    //Caso in cui chiudo browser o clicco logout.
    let cambiaStato = { id: client.privateId, stato: "Off" };
    client.broadcast.emit("qualcuno-cambia-stato", cambiaStato);
    disconnect(client);
  });

  //Gestisce la ricezione del messaggio e l'invio tramite notifica al destinatario nel caso in cui questo sia attualmente collegato al server!
  client.on("sendMessage", function(data) {
    sendMessage(data, client);
  });
});

server_web.listen(8100);

//FUNZIONE CHE GESTISCE LA DISCONNESSIONE
function disconnect(client) {
  //Tolgo l'elemento dall'array. Per fare ciò scorro l'array, quando trovo una corrispondenza col nickname
  //mi salvo la posizione e poi vado a toglierlo. Non uso indexOf xk dentro ho un oggetto.
  let check = -1;
  for (var x = 0; x < users_logged.length; x++) {
    if (users_logged[x].nickname === client.nickname) {
      check = x;
      break;
    }
  }
  //Tolgo l'elemento dopo aver trovato il check.
  if (check != -1) {
    users_logged.splice(check, 1);
  }
  //client.broadcast.emit("user_disconnected", { nickname: client.nickname });
  console.log(client.nickname + " si è disconnesso");
}

//FUNZIONE CHE GESTISCE INVIO, INSERIMENTO NEL DB DEI MESSAGGI
function sendMessage(data, client) {
  console.log("Ho invocato sendMessage");
  //Sistemo il messaggio arrivato per come deve essere salvato sul database
  let mexTotal1 = "",
    mexTotal2 = "";
  preMitt = "$$_";
  preDest = "$_$";
  preMess = "_$$";
  preOra = "_$_";
  fineStringa = "$!$";
  mexTotal1 =
    preMitt +
    data.myId +
    preDest +
    data.anotherId +
    preMess +
    data.message +
    preOra +
    getDataOra() +
    fineStringa;
  mexTotal2 = mexTotal1;
  //Gli original servono per mandarli al mittente e al destinatario per farli stampare a schermo.
  mexTotal1_original = mexTotal1;
  mexTotal2_original = mexTotal1;

  //Estrapolo la conversazione attuale e aggiorno il file sul db. Poi faccio uguale con il destinatario e infine notifico entrambi
  //sarebbe bene che il tutto fosse dentro una transaction per evitare inconsistenza sul database
  let conversazione1 =
    "select conversazione from file where id_utente1 = " +
    data.myId +
    " && id_utente2 = " +
    data.anotherId +
    ";";
  //console.log(conversazione1);
  //let update1 =   "UPDATE `file` SET `conversazione`='"+mexTotal1 + "' where id_utente1 = "+data.myId+" && id_utente2= 22;";
  //console.log(insert1);
  let conversazione2 =
    "select conversazione from file where id_utente1 = " +
    data.anotherId +
    " && id_utente2 = " +
    data.myId +
    ";";
  //let update2 =   "UPDATE `file` SET `conversazione`='"+mexTotal2 + "' where id_utente1 = "+data.anotherId+" && id_utente2= "+data.myId+";";

  //Questa variabile è un bool che alla fine mi deciderà se eseguire la query di inserimento o quella di update.
  //Se true allora inserimento.
  let inserimento1 = true,
    inserimento2 = true;
  var insert1 = "",
    insert2 = "";

  con.query(conversazione1, function(err, result) {
    if (err) {
      console.log("Errore nella query di estrapolazione conversazione utente");
      client.emit(
        "error-sendMessage",
        "Errore nella query di estrapolazione conversazione utente!"
      );
    } else {
      //Preparo il primo messaggio, sarà la concatenazione nel caso in cui quello precedente esista altrimenti sarà un nuovo messaggio e quindi farò una insert.
      if (result.length > 0) {
        mexTotal1 = mexTotal1 + result[0]["conversazione"];
        inserimento1 = false;
      }
      con.query(conversazione2, function(err, result) {
        if (err) {
          console.log(
            "Errore nella query di estrapolazione conversazione utente 2"
          );
          client.emit(
            "error-sendMessage",
            "Errore nella query di estrapolazione conversazione utente 2!"
          );
        } else {
          //Preparo il primo messaggio, sarà la concatenazione nel caso in cui quello precedente esista altrimenti sarà un nuovo messaggio e quindi farò una insert.
          if (result.length > 0) {
            mexTotal2 = mexTotal2 + result[0]["conversazione"];
            inserimento2 = false;
          }
          //Decido cosa assegnare alla variabile insert, se la query di inserimento o quella di update.
          if (inserimento1 == true) {
            insert1 =
              "INSERT INTO `file` (`id_utente1`, `id_utente2`, `conversazione`) VALUES ('" +
              data.myId +
              "', '" +
              data.anotherId +
              "', '" +
              mexTotal1 +
              "');";
          } else {
            insert1 =
              "UPDATE `file` SET `conversazione`='" +
              mexTotal1 +
              "' where id_utente1 = " +
              data.myId +
              " && id_utente2= " +
              data.anotherId +
              ";";
          }
          //Decido cosa assegnare alla variabile insert, se la query di inserimento o quella di update.
          if (inserimento2 == true) {
            insert2 =
              "INSERT INTO `file` (`id_utente1`, `id_utente2`, `conversazione`) VALUES ('" +
              data.anotherId +
              "', '" +
              data.myId +
              "', '" +
              mexTotal1 +
              "');";
          } else {
            insert2 =
              "UPDATE `file` SET `conversazione`='" +
              mexTotal2 +
              "' where id_utente1 = " +
              data.anotherId +
              " && id_utente2= " +
              data.myId +
              ";";
          }
          //Salvo il primo messaggio sul database
          con.query(insert1, function(err, result) {
            if (err) {
              console.log(
                "Errore nella query di inserimento conversazione utente 1 " +
                  insert1
              );
              client.emit(
                "error-sendMessage",
                "Errore nella query di inserimento conversazione utente 1"
              );
            } else {
              //Salvo il seconso messaggio sul database
              con.query(insert2, function(err, result) {
                if (err) {
                  console.log(
                    "Errore nella query di inserimento conversazione utente 2"
                  );
                  client.emit(
                    "error-sendMessage",
                    "Errore nella query di inserimento conversazione utente 2"
                  );
                } else {
                  //Ho finito, notifico mittente e destinatario che tutto è andato a buon fine.
                  console.log(
                    "Inserimento messaggi mittente/destinatario avvenuto con successo sul db!"
                  );
                  //Controllo che l'utente ricevente sia on line.
                  let check = -1;
                  for (var x = 0; x < users_logged.length; x++) {
                    console.log(
                      "Users_logged id: " +
                        users_logged[x].privateId +
                        ", anotherId: " +
                        data.anotherId
                    );
                    if (users_logged[x].privateId == data.anotherId) {
                      console.log("Sono uguali!");
                      check = x;
                      break;
                    }
                  }
                  //Se check != -1 allora ho l'altro utente on line altrimenti non posso inviare la notifica immediata.
                  if (check != -1) {
                    //Notifica l'altro utente
                    console.log(
                      "Sto notificando l'altro utente, l'id socket dovrebbe essere: " +
                        users_logged[x].socketId
                    );
                    mexDaInviare = {
                      mexTotal1_original: mexTotal1_original,
                      id: data.myId,
                      nickname: data.myNick
                    };
                    client
                      .to(users_logged[x].socketId)
                      .emit("new_message", mexDaInviare);
                  } else {
                    console.log(
                      "L'altro utente non è on line, impossibile notificarlo!"
                    );
                  }
                  client.emit("success-sendMessage", mexTotal1_original);
                }
              });
            }
          });
        }
      });
    }
  });
}

//FUNZIONE INSERIMENTO CLIENT NEL DATABASE
function insertClient(obj, client) {
  //Check input
  if (
    obj.nickname == undefined ||
    obj.nickname == "" ||
    obj.password == undefined ||
    obj.password == ""
  ) {
    client.emit(
      "error-register",
      "Stai provando a fare il furbo, ho dei controlli lato server!"
    );

    console.log("Ho un furbo durante la registrazione");
    return;
  }
  let sql = "select * from utente where `nickname` = '" + obj.nickname + "'";
  con.query(sql, function(err, result) {
    if (err) {
      console.log("Errore nella query di selezione");
      client.emit("error-register", "Errore generico!");
    } else {
      if (result.length > 0) {
        //In questo caso c'è già un utente con questo nickname.
        console.log("Nickname già utilizzato, impossibile registrare l'utente");
        client.emit(
          "error-register",
          "Nickname già utilizzato, sceglierne un'altro!"
        );
      } else {
        //Registro e invio risposta al client.
        //Crittografo la password
        let psw = sha512(obj.password);
        sql =
          "INSERT INTO utente (nome, nickname, password) VALUES ('" +
          obj.nome +
          "', '" +
          obj.nickname +
          "', '" +
          psw +
          "')";
        con.query(sql, function(err, result) {
          if (err) {
            console.log("Errore nella registrazione dell'utente");
            client.emit(
              "error-register",
              "Errore nella registrazione dell'utente"
            );
          } else {
            console.log("Cliente registrato correttamente");
            client.emit(
              "success-register",
              "Cliente registrato correttamente, puoi effettuare il login"
            );
            //Estraggo l'id per comporre l'oggetto da mandare in broadcast.
            let sql =
              "select id_utente from utente where `nickname` = '" +
              obj.nickname +
              "'";
            con.query(sql, function(err, result) {
              if (err) {
                console.log(
                  "Errore nella query di estrazione ID nuovo utente prima di inviare in broadcast."
                );
              } else {
                let data_ = {
                  nickname: obj.nickname,
                  id_utente: result[0]["id_utente"]
                };
                client.broadcast.emit("nuovo_utente", data_);
              }
            });
          }
        });
      }
    }
  });
}

function login(obj, client) {
  client.nickname = obj.nickname;
  //Check input
  if (
    obj.nickname == undefined ||
    obj.nickname == "" ||
    obj.password == undefined ||
    obj.password == ""
  ) {
    client.emit(
      "error-register",
      "Stai provando a fare il furbo, ho dei controlli lato server!"
    );
    console.log("Ho un furbo durante il login");
    return;
  }
  //Controllo che non sia già loggato!
  let check = giaLoggato(client);
  if (check != -1) {
    console.log(
      "L'utente " +
        client.nickname +
        " ha provato a fare l'accesso ma risulta già loggato!"
    );
    client.emit(
      "error-login",
      "L'utente risulta già loggato.. Impossibile accedere."
    );
    return;
  }
  let sql =
    "select * from utente where `nickname` = '" +
    obj.nickname +
    "' && password = '" +
    sha512(obj.password) +
    "'";
  con.query(sql, function(err, result) {
    if (err) {
      console.log("Errore nella query di controllo nome utente - password");
      client.emit("error-login", "Errore generico!");
    } else {
      if (result.length == 1) {
        //In questo caso ho trovato l'utente corretto, ora devo preparare i dati da inviare al client.
        console.log(
          "Login avvenuto con successo, adesso provvedo a estrapolare le conversazioni e a mandargliele!"
        );
        //Mi salvo nick e client id per poi inviare le notifiche dei messaggi********************************
        users_logged.push({
          nickname: obj.nickname,
          socketId: client.id,
          privateId: result[0]["id_utente"]
        });
        client.privateId = result[0]["id_utente"];
        //********************************* */
        //************************************************************************************************** */
        //Estrapolazione e invio lista degli utenti al client.
        let sql = "select nickname, id_utente from utente order by nickname";
        con.query(sql, function(err, result) {
          if (err) {
            //Errore estrapolazione dati dal database
            console.log(
              "Errore nella query di estrazione nickname dal database"
            );
            client.emit("error-login", "Impossibile recuperare lista utenti!");
          } else {
            //Metto tutto a false
            for (var y = 0; y < result.length; y++) {
              result[y].onLine = false;
            }
            //Invio i dati estrapolati all'utente.
            for (var x = 0; x < users_logged.length; x++) {
              for (var y = 0; y < result.length; y++) {
                if (users_logged[x].nickname === result[y].nickname) {
                  result[y].onLine = true;
                }
              }
            }
            console.log("Lista utenti inviata al client ");
            client.emit("success-login", result);
            let cambiaStato = { id: client.privateId, stato: "On" };
            client.broadcast.emit("qualcuno-cambia-stato", cambiaStato);
          }
        });
      } else {
        //Errore nel nome utente o nella password inserita
        console.log("Nome utente o password errata");
        client.emit("error-login", "Nome utente o password sbagliati!");
      }
    }
  });
}

function giaLoggato(client) {
  let check = -1;
  for (var x = 0; x < users_logged.length; x++) {
    if (users_logged[x].nickname === client.nickname) {
      check = x;
      break;
    }
  }
  return check;
}

function loginSpecial(obj, client) {
  client.nickname = obj.nickname;
  let sql =
    "select * from utente where `nickname` = '" +
    obj.nickname +
    "' && password = '" +
    sha512(obj.password) +
    "'";
  con.query(sql, function(err, result) {
    if (err) {
      console.log("Errore nella query di controllo nome utente - password");
      client.emit("error-login-special", "Errore generico!");
    } else {
      if (result.length == 1) {
        //In questo caso ho trovato l'utente corretto, ora devo preparare i dati da inviare al client.
        console.log(
          "LoginSpecial avvenuto con successo da parte di: " +
            obj.nickname +
            "id: " +
            client.id
        );
        //Mi salvo nick e client id per poi inviare le notifiche dei messaggi********************************
        users_logged.push({
          nickname: obj.nickname,
          socketId: client.id,
          privateId: result[0]["id_utente"]
        });
        client.privateId = result[0]["id_utente"];
        //Metto tutto a false
        for (var y = 0; y < result.length; y++) {
          result[y].onLine = false;
        }
        //Invio i dati estrapolati all'utente.
        for (var x = 0; x < users_logged.length; x++) {
          for (var y = 0; y < result.length; y++) {
            if (users_logged[x].nickname === result[y].nickname) {
              result[y].onLine = true;
            }
          }
        }
        let cambiaStato = { id: client.privateId, stato: "On" };
        client.broadcast.emit("qualcuno-cambia-stato", cambiaStato);

        //********************************* */
        //************************************************************************************************** */
      } else {
        //Errore nel nome utente o nella password inserita
        console.log("Nome utente o password errata");
        client.emit("error-login-special", "Nome utente o password sbagliati!");
      }
    }
  });
}

function getMyId(nick, client) {
  let sql = "select id_utente from utente where `nickname` = '" + nick + "'";
  con.query(sql, function(err, result) {
    if (err) {
      console.log("Errore nella query di estrazione ID");
      client.emit(
        "error-getMyId",
        "Impossibile estrarre l'id dal database, impossibile continuare. Riprova il login."
      );
    } else {
      client.emit("success-getMyId", result[0]["id_utente"]);
    }
  });
}

function insertMessage(message) {}

function getMessage(obj, client) {
  let sql =
    "select conversazione from file, utente as uno, utente as due where uno.nickname = '" +
    obj.myNickname +
    "' && due.nickname = '" +
    obj.anotherNickname +
    "' \
              && uno.id_utente = id_utente1 && due.id_utente = id_utente2 ";
  con.query(sql, function(err, result) {
    if (err) {
      console.log("Errore nella query di estrazione messaggi!");
      client.emit(
        "error-getMessage",
        "Errore nella query di estrazione messaggi!"
      );
    } else if (result.length == 1) {
      console.log(
        "Messaggi trovati, adesso bisogna manipolarli e poi inviarli."
      );
      //Invoco cutMessage che mi taglia ciò che ho estratto a partire dall'indice che mi ha inviato il client.
      let provv = cutMessage(obj.indiceI, result[0]["conversazione"]);
      console.log(
        "Sto per emettere messaggio finale! provv.length vale: " + provv.length
      );
      //Se c'è un messaggio questo ha una lunghezza minima considerando tutti i caratteri speciali che gli passo.
      console.log(provv.length);
      if (provv.length > 15) client.emit("success-getMessage", provv);
      else
        client.emit(
          "error-getMessage",
          "<p style='font-size:30px;color:red;text-align:center'>Tutti i messaggi sono stati caricati!!</p>"
        );
    } else {
      //Errore generico
      console.log("Non ci sono messaggi!");
      client.emit(
        "error-getMessage-nex",
        "Nessun messaggio con questo contatto!"
      );
      console.log(client.id);
      //client.to(users_logged[0].socketId).emit("Messaggio_ricevuto", "magicaBu");
      console.log("Messaggio privato inviato!");
    }
  });
}

function cutMessage(indiceI, stringa) {
  console.log("IndiceI vale: " + indiceI);
  return stringa.substr(indiceI, 2500);
}

function connessione(con) {
  con.connect(function(err) {
    if (err) {
      console.log("Errore nella connessione!");
      return;
    } else {
      console.log("Connessione al db avvenuta con successo!");
    }
  });
}

function getDataOra() {
  //Mi costruisce la data che aggiungo al messaggio in basso. Successivamente la potrei sostituire con quella che prendo dad database.
  data = new Date();
  ora = data.getHours();
  minuti = data.getMinutes();
  secondi = data.getSeconds();
  giorno = data.getDate();
  mese = data.getMonth() + 1;
  year = data.getFullYear();
  if (minuti < 10) minuti = "0" + minuti;
  if (secondi < 10) secondi = "0" + secondi;
  if (ora < 10) ora = "0" + ora;
  let now =
    giorno + "-" + mese + "-" + year + " " + ora + ":" + minuti + ":" + secondi;
  return now;
}
