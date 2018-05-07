var socket;
var myNickname, anotherNick; //Le variabili another vengono settate quando clicco su una chat
var users = [];
var user = {};
var myId, anotherId; // Le variabili my vengono settate appena possibile, dopo il login.
var obj;
var i = 0; //Contatore globale numero di user registrati;
//Questa variabile mi serve per ricordare a che punto ero quando ho letto l'ultimo messaggio completo.
var ultimoMessaggio = 0;
//Un check, nel caso in cui continuo a scrollare ma non ho più messaggi da mandare non faccio inutili chiamate al server!
var messaggiFiniti = false;
var chiamataInCorso = false; //Mi serve per regolare le chiamate durante lo scrolling..!

//i = indice. Mi serve per capire a che posizione è nella lista e fare il giusto scroll quando necessario (in ricezione messaggi).
function addUser(nickname, i, id, onLine) {
  var on;
  if (onLine == true) on = "On";
  else on = "Off";
  //Mi aggiunge tutti gli user che nel
  var element =
    '<div data-nickname="' +
    nickname +
    '" data-id ="' +
    id +
    '" num-elem="' +
    i +
    '" class="row sideBar-body" id="' +
    nickname +
    id +
    '">\
  <div class="col-sm-3 hidden-xs sideBar-avatar">\
    <div class="avatar-icon">\
      <img src="https://bootdey.com/img/Content/avatar/avatar1.png">\
    </div>\
  </div>\
  <div class="col-sm-9 col-xs-12 sideBar-main">\
    <div class="row">\
      <div class="col-sm-8 col-xs-6 sideBar-name" >\
        <span class="name-meta">' +
    nickname +
    '\
      </span>\
      </div>\
      <div class="col-sm-4 col-xs-6 pull-right sideBar-time">\
        <span class="time-meta pull-right col-xs-5" style="font-size:14px" id="data-id-notification' +
    id +
    '">\
            </span>\
        <span class="time-meta pull-right col-xs-7" id="data-id-online' +
    id +
    '"> ' +
    on +
    '   </span>\
      </div>\
    </div>\
  </div>\
  <script>  $("#' +
    nickname +
    id +
    '").on("click", function(){\
              let nick = $(this).attr("data-nickname");\
              let ida = $(this).attr("data-id");\
              clickOnChat(nick,ida);\
            });\
  </script>\
</div>';
  $("#users_list").append(element);
}

//Funzione che gestisce l'invio dei messaggi da parte mia.
function sendMessage(msg) {
  //Se il messaggio è vuoto ritorno.
  if (!msg) {
    return;
  }
  //Emetto il messaggio sulla socket in broadcast. Questo si occuperà di scrivere il messaggio al ricevente.
  console.log("Sto per fare l'emit");
  socket.emit("sendMessage", {
    message: msg,
    myNick: myNickname,
    anotherNick: anotherNick,
    myId: myId,
    anotherId: anotherId
  });

  //Nel caso di errore nell'invio messaggi creo un alert
  socket.on("error-sendMessage", function(data) {
    addMyMessage(data);
    //Pulisco il form per inserire i messaggi
    $("#msg-input").val("");
    riconnessione();
  });

  socket.on("success-sendMessage", function(data) {
    console.log("E' stato invocato il success-sendMessage");
    manipolaMessaggio(data, anotherNick, true);
    //Pulisco il form per inserire i messaggi
    $("#msg-input").val("");
    riconnessione();
  });
}

function addMessage(nickname, message, now, scorri) {
  //Utilizzata per inserire nella conversazione i messaggi dell'altro caricati sul database
  var element =
    '<div class="row message-body">\
  <div class="col-sm-12 message-main-receiver">\
    <div class="receiver">\
      <div class="message-text">\
        ' +
    message +
    '\
      </div>\
      <span class="message-time pull-right">\
' +
    nickname +
    ", " +
    now +
    "\
      </span>\
    </div>\
  </div>\
</div>";
  //Aggiungo in append a conversazione
  let provv = $("#conversation").html();
  $("#conversation").text("");
  $("#conversation").append(element + provv);
  //Serve per scrollare fino all'ultimo messaggio.
  var objDiv = document.getElementById("conversation");
  if (scorri == false) objDiv.scrollTop = objDiv.scrollHeight;
  else objDiv.scrollTop = 20;
}

function addSingleMessage(nickname, message, now) {
  var element =
    '<div class="row message-body">\
  <div class="col-sm-12 message-main-receiver">\
    <div class="receiver">\
      <div class="message-text">\
        ' +
    message +
    '\
      </div>\
      <span class="message-time pull-right">\
' +
    nickname +
    ", " +
    now +
    "\
      </span>\
    </div>\
  </div>\
</div>";
  //Aggiungo in append a conversazione
  $("#conversation").append(element);
  //Serve per scrollare fino all'ultimo messaggio.
  var objDiv = document.getElementById("conversation");
  objDiv.scrollTop = objDiv.scrollHeight;
}

function addMyMessage(message) {
  //Utilizzata per inserire nella conversazione i messaggi miei caricati sul database
  let now = getDataOra();
  var element =
    '<div class="row message-body">\
  <div class="col-sm-12 message-main-sender">\
    <div class="sender">\
      <div class="message-text">\
        ' +
    message +
    '\
      </div>\
      <span class="message-time pull-right">\
        Tu, ' +
    now +
    "\
      </span>\
    </div>\
  </div>\
</div>";
  let provv = $("#conversation").html();
  $("#conversation").text("");
  $("#conversation").append(element + provv);
  //Serve per scrollare fino all'ultimo messaggio.
  var objDiv = document.getElementById("conversation");
  objDiv.scrollTop = objDiv.scrollHeight;
}

function addMySingleMessage(message) {
  //Aggiunge un messaggio inviato da me alla conversazione.
  let now = getDataOra();
  var element =
    '<div class="row message-body">\
  <div class="col-sm-12 message-main-sender">\
    <div class="sender">\
      <div class="message-text">\
        ' +
    message +
    '\
      </div>\
      <span class="message-time pull-right">\
        Tu, ' +
    now +
    "\
      </span>\
    </div>\
  </div>\
</div>";
  $("#conversation").append(element);
  //Serve per scrollare fino all'ultimo messaggio.
  var objDiv = document.getElementById("conversation");
  objDiv.scrollTop = objDiv.scrollHeight;
}

//Se li tiro fuori dal db uso questa con due parametri
function addMyMessage(message, now, scorri) {
  //Aggiunge un messaggio inviato da me alla conversazione. Devo gestire quelle private.
  var element =
    '<div class="row message-body" >\
  <div class="col-sm-12 message-main-sender">\
    <div class="sender">\
      <div class="message-text">\
        ' +
    message +
    '\
      </div>\
      <span class="message-time pull-right">\
        Tu, ' +
    now +
    "\
      </span>\
    </div>\
  </div>\
</div>";
  let provv = $("#conversation").html();
  $("#conversation").text("");
  $("#conversation").append(element + provv);
  //Serve per scrollare fino all'ultimo messaggio.
  var objDiv = document.getElementById("conversation");
  if (scorri == false) objDiv.scrollTop = objDiv.scrollHeight;
  else objDiv.scrollTop = 20;
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

$(document).ready(function() {
  //Svuto tutte le conversazioni. Successivamente dovrò pre-caricare le ultime conversazioni salvate sul database.
  $("#conversation").empty();

  //Gestire iL TRANSFERT DA LOGIN A REGISTER.
  $("#btn-go-register").on("click", function() {
    $(".login").hide();
    $(".register").show();
  });

  //Gestire iL TRANSFERT DA REGISTER A LOGIN.
  $("#btn-go-login").on("click", function() {
    $(".register").hide();
    $(".login").show();
  });

  $("#btn-logout").on("click", function() {
    $(".app").hide();
    $(".login").show();
    //Azzero le variabili che ho settato nel login e cancello lista user + conversazioni.
    myNickname = "";
    myId = "";
    anotherId = undefined;
    anotherNick = undefined;
    users = [];
    obj = "";
    chiamataInCorso = true;
    $("#conversation").text("");
    $("#users_list").text("");
    $("#error-login").text("Logout avvenuto con successo!");
    $("#msg-input").unbind("keypress");
    $("#btn-send").unbind("click");
    $("#msg-input").val("");
    //Questo per fare il controllo se è stata selezionata una conversazione dopo il logout.
    socket.emit("disconnect");
    socket.close();
  });

  //GESTIONE REGISTRAZIONE
  $("#btn-register").on("click", function() {
    registrati();
  });

  //GESTIONE LOGIN
  //Gestisco il click sul button login. Devo implementare la gestione degli utenti e quindi salvare i dati sul db.
  //Da gestire login recupera password ecc ecc.

  $("#btn-login").on("click", function() {
    var nickname = $("#nickname_input").val();
    var password = $("#password_input_login").val();
    myNickname = nickname;
    //Controllo che le variabili non siano vuote.
    if (nickname == "" || password == "") {
      $("#error-login").text("Tutti i dati sono obbligatori!!");
      return;
    }

    //Costruisco il json da inviare e lo invio al server, poi sto in ascolto degli errori o dell'ok.
    obj = { nickname: nickname, password: password };
    socket = io.connect("http://127.0.0.1:8100");

    socket.emit("login", obj);

    //In caso di successo della login
    socket.on("success-login", function(data) {
      for (i = 0; i < data.length; i++) {
        if (data[i].nickname != myNickname)
          addUser(data[i].nickname, i, data[i].id_utente, data[i].onLine);
      }
      $(".login").hide();
      $(".app").show();
      //Farsi mandare l'id dal server
      $("#nickname_user").text(myNickname);
      getMyId(myNickname);
    });

    //Nel caso di errore nella login
    socket.on("error-login", function(data) {
      $("#error-login").text(data);
      socket.close();
    });

    //Prova

    socket.on("Messaggio_ricevuto", function(data) {
      console.log(data);
    });

    /*//Questo codice sarà eseguito soltanto dopo aver premuto entra.
    user.nickname = nickname;
    //Il nickname viene aggiunto nel layout.
    $("#nickname_user").html(user.nickname);
    socket = io.connect("http://127.0.0.1:8100");
    //Emetto il messaggio di login, così agli altri sarà notificato e viene aggiunto il nome di chi si è loggato.
    socket.emit("login", { nickname: nickname });
    //Nascondo la schermata login e apro quella della grafica app.
    $(".login").hide();
    $(".app").show();

    /*gestione socket*/
    //Quando mi collego la prima volta, mi passano tutti gli utenti on line.
    socket.on("users_list", function(data) {
      console.log(data);
      data.users.forEach(function(obj) {
        addUser(obj);
      });
    });
    //Quando qualcuno si collega mi arriva il suo nick e io lo aggiungo.
    socket.on("user_logged", function(data) {
      addUser(data);
    });
    //Quando qualcuno si disconnette mi arriva la notifica e lo cancello dalla vista.
    socket.on("user_disconnected", function(data) {
      console.log("disconnesso", data);
      $("[data-nickname='" + data.nickname + "'").remove();
    });

    //Aggiunge un messaggio arrivato in broadcast.
    socket.on("messaggio_broadcast", function(data) {
      console.log("Broadcast message");
      addMessage(data.nickname, data.message);
    });

    //Questi due gestiscono entrambi l'invio di messaggi, semplicemente.
    $("#btn-send").on("click", function() {
      if (anotherId == undefined) {
        //In questo caso non ho mai selezionato nessun Id, mi deve comparire il messaggio seleziona conversazione.
        $("#conversation").html(
          "<p style='font-size:30px;color:red;text-align:center'>Devi prima selezionare una conversazione!!</p>"
        );
      } else sendMessage($("#msg-input").val());
    });
    $("#msg-input").keypress(function(event) {
      if (event.which == 13) {
        if (anotherId == undefined) {
          //In questo caso non ho mai selezionato nessun Id, mi deve comparire il messaggio seleziona conversazione.
          $("#conversation").html(
            "<p style='font-size:30px;color:red;text-align:center'>Devi prima selezionare una conversazione!!</p>"
          );
        } else sendMessage($("#msg-input").val());
      }
    });
  });
});

//Richiede l'id al server, serve per fare i controlli su mittente e destinatario nei messaggi.
function getMyId(myNickname) {
  socket.emit("getMyId", myNickname);

  socket.on("success-getMyId", function(data) {
    myId = data;
    riconnessione();
  });

  socket.on("error-getMyId", function(data) {
    console.log("Errore nella lettura dell'id dal database");
    $(".app").hide();
    $(".login").show();
    $("#error-login").text(data);
    socket.close();
  });
}

function registrati() {
  console.log("Ho premuto registrati.");
  //CHECK INPUT
  var nome = $("#nome_input_register").val();
  var nickname = $("#nickname_input_register").val();
  var password = $("#password_input_register").val();
  var confermaPassword = $("#confirm_password_input_register").val();
  if (
    nome == "" ||
    nickname == "" ||
    password == "" ||
    confermaPassword == ""
  ) {
    $("#error-register").text("Tutti i dati sono obbligatori!!");
    return;
  }
  if (password != confermaPassword) {
    $("#error-register").text("Le due password devono coincidere!");
    return;
  }

  let obj = { nome: nome, nickname: nickname, password: password };

  //Invio i dati passati come input al server, li faccio il check, li salvo nel db e poi mando la conferma all'utente.
  socket = io.connect("http://127.0.0.1:8100");
  //Emetto il messaggio di login, così agli altri saranno notificati e viene aggiunto il nome di chi si è loggato.
  socket.emit("register", obj);

  //Nel caso in cui il server mi risponde con successo
  socket.on("success-register", function(data) {
    $(".register").hide();
    $(".login").show();
    $("#error-login").text(data);
    socket.close();
  });

  //Nel caso di errore nella registrazione
  socket.on("error-register", function(data) {
    $("#error-register").text(data);
    socket.close();
  });
}

function clickOnChat(nick, id) {
  if (anotherNick == nick) {
    //Per evitare ricarico della chat inutile!
    console.log("Ho ricliccato sulla chat");
    return;
  }
  anotherNick = nick;
  anotherId = id;
  //Azzero questa variabile perchè in questo caso, ho cliccato una nuova chat e quindi devo estrapolare da 0 le conversazioni.
  ultimoMessaggio = 0;
  //Se clicco in un altra chat allora devo mettere a false questo per attivare lo scroll e le chiamate di richiesta messaggi!
  messaggiFiniti = false;
  //Azzero chiamata in corso
  chiamataInCorso = false;

  //Azzero le notifiche nel caso in cui ce ne fossero.
  $("#data-id-notification" + anotherId).text("");
  //Setto il nome in alto con il nome della chat corrente:
  $("#nome-chat").text(nick);
  //Coloro la casella cliccata di grigetto
  $("#users_list")
    .children()
    .css("background-color", "white");
  $("#" + nick + id).css("background-color", "#f2f2f2");

  console.log(
    "My nick is: " + myNickname + ", another nick is: " + anotherNick
  );
  let obj = {
    myNickname: myNickname,
    anotherNickname: nick,
    indiceI: ultimoMessaggio
  };

  socket.emit("getMessage", obj);
  //Caso di insuccesso
  socket.on("error-getMessage-nex", function(data) {
    if (data == "Nessun messaggio con questo contatto!") {
      $("#conversation").html(
        "<p style='font-size:30px;color:red;text-align:center'>Nessun messaggio con questo contatto</p>"
      );
      //Metto a true così è sicuro che non mi parte in automatico. Infatti stampando a schermo solo un rigo potrebbe succedere che scroll == 0
      chiamataInCorso = true;
      riconnessione();
    } else {
      $(".app").hide();
      $(".login").show();
      $("#error-login").text(data + "---- Provare a rifare il login!");
      socket.close();
    }
  });

  //NEL CASO DI SUCCESSO, QUI DEVO CARICARLI GRAFICAMENTE.
  socket.on("success-getMessage", function(data) {
    $("#conversation").text("");
    manipolaMessaggio(data, nick, false);
    riconnessione();
    $("#conversation").scroll(function() {
      getMessageOnScroll(nick, id, this);
    });
  });
}

function getMessageOnScroll(nick, id, thiss) {
  //console.log(thiss.scrollTop);
  if (
    messaggiFiniti == false &&
    thiss.scrollTop < 1 &&
    chiamataInCorso == false
  ) {
    let provv = $("#conversation").html();
    let scritta =
      "<p style='font-size:30px;color:red;text-align:center'>Caricamento in corso...</p>    ";
    $("#conversation").html("");
    $("#conversation").html(scritta + provv);
    chiamataInCorso = true;
    let obj = {
      myNickname: myNickname,
      anotherNickname: nick,
      indiceI: ultimoMessaggio
    };
    socket.emit("getMessage", obj);
    console.log("Chiamata per nuove conversazioni effettuata");
    //Caso di insuccesso
    socket.on("error-getMessage", function(data) {
      if (
        data ==
        "<p style='font-size:30px;color:red;text-align:center'>Tutti i messaggi sono stati caricati!!</p>"
      ) {
        let provv = $("#conversation").html();
        provv = provv.substr(81);
        $("#conversation").html("");
        $("#conversation").append(data + "" + provv);
        messaggiFiniti = true;
        riconnessione();
      } else {
        $(".app").hide();
        $(".login").show();
        $("#error-login").text(data + "---- Provare a rifare il login!");
        socket.close();
      }
    });

    //NEL CASO DI SUCCESSO, QUI DEVO CARICARLI GRAFICAMENTE.
    socket.on("success-getMessage", function(data) {
      //Prima di manipola messaggio cancello il "caricamento in corso."
      console.log(data);
      let provv = $("#conversation").html();
      //console.log(provv.substr(0,81));
      provv = provv.substr(81);
      $("#conversation").html("");
      $("#conversation").append(provv);
      //Come terzo parametro passo una stringa che controllo nella funzione. Se è quella che dico io allora manderò true alla funzione addMessage e
      //addMyMessage così non gli faccio ricaricare la scrollbar.
      manipolaMessaggio(data, nick, false, "ScrollBar");

      riconnessione();
      $("#conversation").scroll(function() {
        getMessageOnScroll(nick, id, this);
      });
    });
  }
}

function manipolaMessaggio(result, nick, singleMessage, scrollBar) {
  //Potrebbero servire in futuro
  preMitt = "$$_";
  preDest = "$_$";
  preMess = "_$$";
  preOra = "_$_";
  fineStringa = "$!$";
  let messaggio = "";
  //Array che analizzo, se l'array è undefined allora gli ho inviato direttamente il messaggio da analizzare con success-sendMessage.
  if (result[0]["conversazione"] === undefined) messaggio = result;
  else messaggio = result[0]["conversazione"];
  //Questo mi serve per fare il check e capire cosa sto salvando
  let mittente = false,
    destinatazio = false,
    messagge = false,
    ora = false,
    stampa = false;
  //Qui mi salvo le cose che andrò a salvare
  let mitt = "",
    dest = "",
    mex = "",
    orario = "";
  let contatoreInterno = 0;
  for (let i = 2; i < messaggio.length; i++) {
    //Faccio gli if per capire se è messaggio, mittente, destinatario o orario e quindi settare le giuste variabili.
    if (
      messaggio[i - 2] == "$" &&
      messaggio[i - 1] == "!" &&
      messaggio[i] == "$"
    ) {
      //Fine messaggio, lo stampo!
      mittente = false;
      destinatario = false;
      messagge = false;
      ora = false;
      stampa = true;
      //Tolgo i caratteri speciali che rimangono, 2 per ogni messaggio.
      mitt = mitt.substring(0, mitt.length - 2);
      dest = dest.substring(0, dest.length - 2);
      mex = mex.substring(0, mex.length - 2);
      orario = orario.substring(0, orario.length - 2);
      //Qui le variabili hanno i dati del messaggio corrente.
      if (mitt != "" && dest != "" && mex != "" && orario != "") {
        //******************************************QUI CI VA IL CODICE PER STAMPARE IL MESSAGGIO A SCHERMO, DISTINGERE MITTENTE E DESTINATARIO */
        //console.log("Mitt: " + mitt + " - dest: " + dest + " - mex: " + mex + " - " + orario);
        if (myId == mitt && singleMessage == true) {
          //Vuol dire che è un messaggio spedito da me
          addMySingleMessage(mex, orario);
        } else if (myId == mitt) {
          if (scrollBar == "ScrollBar")
            //In questo caso non faccio "scrolla fino all'ultimo messaggio".
            addMyMessage(mex, orario, true);
          else addMyMessage(mex, orario, false);
        } else if (singleMessage == true) {
          //In questo caso è un messaggio singolo ma appena ricevuto.
          addSingleMessage(nick, mex, orario);
        } else {
          //Altrimenti l'ha spedito l'altro
          if (scrollBar == "ScrollBar")
            //In questo caso non faccio "scrolla fino all'ultimo messaggio".
            addMessage(nick, mex, orario, true);
          else addMessage(nick, mex, orario, false);
        }
      }
      //Azzero tutto per il prossimo messaggio.
      mitt = "";
      dest = "";
      mex = "";
      orario = "";
      //Salvo il punto in cui sono arrivato nell'ultimo messaggio. Per il caricamento futuro dei messaggi.
      contatoreInterno = i;
    }
    if (
      messaggio[i - 2] == "$" &&
      messaggio[i - 1] == "$" &&
      messaggio[i] == "_"
    ) {
      //Qui ho il mittente
      mittente = true;
      destinatario = false;
      messagge = false;
      ora = false;
      stampa = false;
      i++;
    }
    if (
      messaggio[i - 2] == "$" &&
      messaggio[i - 1] == "_" &&
      messaggio[i] == "$"
    ) {
      //Qui ho il destinatario
      mittente = false;
      destinatario = true;
      messagge = false;
      ora = false;
      stampa = false;
      i++; //Questo perchè così mi evito un carattere speciale iniziale e quindi riesco a pulire meglio la stringa
    }
    if (
      messaggio[i - 2] == "_" &&
      messaggio[i - 1] == "$" &&
      messaggio[i] == "$"
    ) {
      //Qui ho il messaggio
      mittente = false;
      destinatario = false;
      messagge = true;
      ora = false;
      stampa = false;
      i++;
    }
    if (
      messaggio[i - 2] == "_" &&
      messaggio[i - 1] == "$" &&
      messaggio[i] == "_"
    ) {
      //Qui ho l'orario
      mittente = false;
      destinatario = false;
      messagge = false;
      ora = true;
      stampa = false;
      i++;
    }

    //In base a cosa è true (cioè cosa devo salvare al momento), me li salvo.
    if (mittente == true) {
      //Salvo il mittente
      mitt += messaggio[i];
    } else if (destinatario == true) {
      //Tiro fuori il destinatario
      dest += messaggio[i];
    } else if (ora == true) {
      //Tiro fuori il destinatario
      orario += messaggio[i];
    } else if (messagge == true) {
      //Accumulo il messaggio.
      mex += messaggio[i];
    }
  }
  if (singleMessage == false) {
    //Soltanto se non è un messaggio singolo vuol dire che è la prima volta che ho effettuato
    ultimoMessaggio += contatoreInterno;
  }
  chiamataInCorso = false;
}

function riconnessione() {
  socket.emit("disconnect");
  socket.close();
  socket = io.connect("http://127.0.0.1:8100");
  socket.emit("loginSpecial", obj);

  //In caso di successo della login
  socket.on("error-login-special", function(data) {
    $(".app").hide();
    $(".login").show();
    $("#error-login").text(data + "---- Provare a rifare il login!");
    socket.close();
  });

  socket.on("new_message", function(data) {
    new_message(data);
  });
  //In caso di messaggio broadcast per la registrazione di un nuovo utente da aggiungere nella lista
  //la i è quella globale!
  socket.on("nuovo_utente", function(data) {
    addUser(data.nickname, i, data.id_utente);
    alert(
      "Nuovo utente registrato, è stato correttamente aggiunto nella lista. Il suo nick è: " +
        data.nickname
    );
  });

  //Si occupa di mettere a on o off lo stato di qualcuno che si è appena connesso o disconnesso.
  socket.on("qualcuno-cambia-stato", function(data) {
    console.log("Invocato metodo qualcuno-cambia-stato");
    console.log("Qualcuno ha cambiato stato " + data.id + " - " + data.stato);
    $("#data-id-online" + data.id).text(data.stato);
  });
}

function new_message(data) {
  //Devo separare 2 casi, uno se la finestra di chat con l'altro tizio è aperta e un'altro, se non lo è.
  //Se è aperta allora faccio comparire il messaggio
  if (anotherId == data.id) {
    console.log(
      "Finestra aperta, messaggio ricevuto: " + data.mexTotal1_original
    );
    manipolaMessaggio(data.mexTotal1_original, anotherNick, true);
  } else {
    //Altrimenti devo far comparire la notifica.
    console.log("Messaggio ricevuto correttamente, devo far comparire l'1");
    //Controllo che non ci sia già un numero. Se c'è lo incremento altrimenti scrivo 1.
    let elem = $("#data-id-notification" + data.id).text() * 1;
    console.log("Elem è " + elem);
    if (elem == "") {
      $("#data-id-notification" + data.id).text("1");
      console.log("L'if è vero");
    } else $("#data-id-notification" + data.id).text(elem * 1 + 1);

    //Scrollo la lista di elementi
    var objDiv = document.getElementById("users_list");
    var arrivo = document.getElementById("data-id-notification" + data.id);
    //arrivo = $("data-id-notification"+data.id).position();
    var provv = data.nickname + "" + data.id;
    console.log(provv);
    elemNum = $("#" + provv).attr("num-elem");
    console.log(
      objDiv.scrollTop +
        " - " +
        objDiv.scrollHeight +
        " - " +
        arrivo.scrollHeight +
        " elemNum " +
        elemNum
    );
    if (elemNum > 10 && elemNum < 20) {
      objDiv.scrollTop = (arrivo.scrollHeight + 10) * elemNum + 31;
    } else if (elemNum < 10) {
      objDiv.scrollTop = arrivo.scrollHeight * elemNum + 31;
    } else {
      objDiv.scrollTop = (arrivo.scrollHeight + 15) * elemNum + 31;
    }
  }
}
