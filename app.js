/* Node.js test
 * This script should run under Node.js on local server
 */
// Version 2.0
var http = require('http');
var https = require('https');
var app = require('express')();
var bodyParser = require('body-parser');
var app = require('express')();
var	server = http.createServer(app);
var	io = require('socket.io')(server);
var fs = require('fs');
const rln = require('readline');
const db = require('./DBfunctions.js');
const qm = require('./QMfunctions.js');
const {OAuth2Client} = require('google-auth-library');
var dbt = new db();
var qmt = new qm();

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

//********** set the port to use
const PORT = process.env.PORT || 3000;
server.listen(PORT);
console.log("Dir path: "+__dirname);
//*****Globals *************
const GOOGLE_CLIENT_ID = "132511972968-ubjmvagd5j2lngmto3tmckdvj5s7rc7q.apps.googleusercontent.com";
const SUPERADMIN = "thecodecentre@gmail.com";
var AUTHUSERS = new Object(); // keep list of authenticated users by their socket ids
var QMSockets = new Object(); // keep list of socket ids for each quizmaster
const QFile = "test.json";
//const QFile = "QMQuestions.json";
const STARTQID = 1971;
const GCOUNTDOWNTIME = 5;   // countdown in seconds before each question
var NewCats = new Object();
const oauthclient = new OAuth2Client(GOOGLE_CLIENT_ID);
const IMAGEURL = "http://tropicalfruitandveg.com/quizmaster/";
/*

//****** Callbacks for all URL requests
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});
/*app.get('/index.js', function(req, res){
	res.sendFile(__dirname + '/index.js');
});*/
app.get('/*', function(req, res){
	res.sendFile(__dirname + req.path);
});
/*
process.on('uncaughtException', function (err) {
  console.log('Exception: ' + err);
});
*/
console.log("Server started on port "+PORT);
//qmt.testDL();

// Set up socket actions and responses
io.on('connection',function(socket) {

  socket.on('disconnect',function () {
    removeSocket(socket.id,"disconnect");
  });

  socket.on('end',function() {
    removeSocket(socket.id,"end");
  });

  socket.on('connect_timeout', function() {
    removeSocket(socket.id,"timeout");
  });
/*
  socket.on('loginRequest',function(token) {
    async function verify() {
      const ticket = await oauthclient.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      console.log("sub is "+payload['sub']);
//      console.log(payload);
//      if(SUPERADMIN == payload['email']) {
//        console.log("Superadmin signed in: "+socket.id);
          dbt.getQMByEmail(payload,socket);
//        AUTHUSERS[socket.id] = obj.email;
//          socket.emit('loginResponse',payload.name);
      }
//        else
//          socket.emit('errorResponse',"Login failed, please register");
/*      }
      else {
        AUTHUSERS[socket.id] = false;
        autherror(socket);
      }
    verify().catch(console.error);
  });
*/

  socket.on('registerQMRequest',function(newqm) {
    dbt.createNewQM(newqm,socket);
  });

  /*
  * This is for localhost testing without authentication
  */
  socket.on('loginRequest',function() {
    AUTHUSERS[socket.id] = true;
  });

  socket.on('TestLoginRequest',function(qmname) {
    dbt.getQMByName(qmname,function(qm) {
      if(qm) {
        socket.emit('loginResponse',qm);
        AUTHUSERS[socket.id] = qm.qmid;
        console.log("Test Logged in: "+socket.id)
        QMSockets[qm.qmid] = socket.id;
      }
      else {
        socket.emit('errorResponse',"Login failed: "+qmname);
      }
    });
  });

  socket.on('SignInSuperRequest',function() {
    AUTHUSERS[socket.id] = true;
    let qm = new Object();
    qm['qmname'] = "TCC-Admin";
    socket.emit("SignInSuperResponse",qm);
  });

  socket.on('logoutRequest',function(token) {
    AUTHUSERS[socket.id] = false;
    console.log("Logged out: "+socket.id)
    autherror(socket);
  });

	socket.on('loadQuestionsRequest',function(filename) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    const str = "Loading Questions to DB from file "+QFile;
		console.log(str);
    loadquestions(QFile,socket);
		socket.emit('infoResponse',str);
  });

  socket.on('loadInMemRequest',function(filename) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    const str = "Loading Questions to Memory from file "+QFile;
    console.log(str);
    loadquestionstomem(QFile,socket);
  });

  socket.on('createQTableRequest',function(filename){
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    console.log("Creating Question DB Table");
	  dbt.createQTable(socket);
  });

  socket.on('createDBTablesRequest',function(filename){
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
		console.log("Creating DB Tables");
    dbt.createDBTables(socket);
  });

  socket.on('createAppRequest',function(filename){
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
		console.log("Creating test app");
    dbt.createTestApp(socket);
  });

  socket.on('getCatsRequest',function(filename){
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
//    console.log("Getting categories");
    let qcat = qmt.getCategories();
//    console.log("Categories are: "+qcat);
		socket.emit('getCatsResponse',qcat);
  });

  socket.on('getSubcatsRequest',function(cat){
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
//    console.log("Get subcats for "+cat);
    let qsubcat = qmt.getSubCategories(cat);
		socket.emit('getSubcatsResponse',qsubcat);
  });

  socket.on('getDiffsRequest',function(filename){
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    let qdiff = qmt.getDifficulties();
		socket.emit('getDiffsResponse',qdiff);
  });

  socket.on('getGameTypesRequest',function(filename) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    let qtype = qmt.getGameTypes();
		socket.emit('getGameTypesResponse',qtype);
  });

  socket.on('getQuestionsByCatandSubcat',function(cat,subcat) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    console.log("Getting questions for category: "+cat+":"+subcat);
    let qlist = dbt.getQuestionsByCatandSubcat(cat,subcat,socket);
  });

  socket.on('getQuestionByIdRequest',function(qid) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    console.log("Getting question with ID: "+qid);
    let qm = qmt.getQuestionById(qid);
//    console.log(qm);
    socket.emit("getQuestionByIdResponse",qm);
  });

  socket.on('updateQuestionRequest',function(qobj) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    console.log("Updating question with ID: "+qobj.qid);
    let qm = qmt.updateQuestion(qobj);
//    console.log(qobj);
    socket.emit("updateQuestionResponse","Question Updated");
  });

  socket.on('getGamesRequest',function(qmid) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    console.log("Getting Games for: "+qmid);
    dbt.getGames(qmid,socket);
  });

// this event is used to prepare for game start.
// Needs to be called before starting play so players can join.
  socket.on('preGameStartRequest',function(qmid,gameid) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    dbt.getGameByID(qmid,gameid,function(game) {
      console.log("Got Game id: "+game.gameid);
      let newg = qmt.gameReady(game);
      socket.emit('preGameStartResponse',newg);
    });
  });

  socket.on('newGameRequest',function(game) {
    if(AUTHUSERS[socket.id] != true) return(autherror(socket));
    if(!qmt.checkGameTypes(game.gametype))
      return(socket.emit("errorResponse","Invalid Game Type"));
    if(game.gamename.length < 6)
      return(socket.emit("errorResponse","Please use a name at least 6 chars long"));
    if(game.timelimit < 5)
      return(socket.emit("errorResponse","Time for each question should be at least 5 seconds"));
    if(game.accesscode.length > 8)
        return(socket.emit("errorResponse","Access code should be no more than 8 chars long"));
    if(game.questions.length < 2)
      return(socket.emit("errorResponse","Please select at least 2 questions"));
//    game['questions'] = dbt.getQuestionsByCatandSubcat(game.cat,game.subcat);
    console.log("Creating new game");
    dbt.createNewGame(game,socket);
  });

// called by quizmaster to start a game
  socket.on('startGameRequest',function(qmid,gameid) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    socket.join(gameid);
    let game = qmt.getActiveGame(gameid);
    if(game) {
      socket.emit("startGameResponse",game);
      preQuestion(game);
    }
    else {
      socket.emit("errorResponse","Game not active or has finished");
    }
  });

// called by quizmaster to start a game
  socket.on('nextQuestionRequest',function(qmid,gameid) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    let game = qmt.getActiveGame(gameid);
    if(game) {
      game.cqno++;
      preQuestion(game);
    }
    else {
      socket.emit("errorResponse","Game not active or has finished");
    }
  });

// called by quizmaster to show latest scores
  socket.on('showScoresRequest',function(qmid,gameid) {
    if(AUTHUSERS[socket.id] != qmid) return(autherror(socket));
    let scores = qmt.getContestantScores(gameid);   // current scores
    if(scores) {
      io.in(game.gameid).emit('scoresUpdate',scores);
    }
    else {
      socket.emit("errorResponse","Game not active");
    }
  });

// used by contestant to join game so no login/auth required
  socket.on('joinGameRequest',function(contestant) {
    if(!contestant.userid.trim() || !contestant.accesscode.trim()) {
      socket.emit("errorResponse","Please enter Nickname and Accesscode");
//      console.log("No contestant info");
      return;
    }

    const game = qmt.joinGame(contestant,socket.id);
    if(game) {
      console.log(contestant.userid+" Joining game "+game.gamename);
      socket.join(game.gameid);
      socket.emit("joinGameResponse",contestant.userid+", you have joined game: "+game.gamename);
//      sending to all clients in the game room, including sender
      io.in(game.gameid).emit('announcement','Your game will start shortly');
      io.to(QMSockets[game.qmid]).emit("contestantUpdate",game.contestants);  // tell the quizmaster
    }
    else {
      socket.emit("errorResponse","Access code invalid or game not started");
    }
  });

// used by contestant to submit their answer so no login/auth required
  socket.on('submitAnswerRequest',function(answer) {
    let game = qmt.registerAnswer(answer,socket.id);
    if(game) {
      socket.emit("submitAnswerResponse","Answer successfully registered: "+answer);
      io.to(QMSockets[game.qmid]).emit("answersUpdate",game.answers);  // tell the quizmaster
    }
    else {
      socket.emit("errorResponse","Problem registering your answer");
    }
  });

// get all questions for a game
  socket.on('getQuestionsRequest',function(game) {
    if(AUTHUSERS[socket.id] != game.qmid) return(autherror(socket));
    let qlist = qmt.getGameQuestions(game);
      socket.emit('getQuestionsResponse',qlist);
//      console.log('qlist: '+JSON.stringify(qlist));
  });

}); //end of io.on

/*******************************************
/* Functions below this point
********************************************/
function removeSocket(id,evname) {
		console.log("Socket "+id+evname+" at "+ new Date().toISOString());
    delete AUTHUSERS[id];
}

function loadquestions(file,socket) {

    dbt.clearAllQuestions();
    var rd = rln.createInterface({
        input: fs.createReadStream(file),
        console: false
    });

    rd.on('line', function(line) {
//      collectCats(line);
      let qobj = qmt.validatequestion(line);  // check that question have correct values
      if(qobj != null)
        dbt.insertQuestion(qobj);
    });

    rd.on('close', function() {
      dbt.getNumQuestionsByCat("",socket);
      console.log(JSON.stringify(NewCats));
  });
}

function autherror(socket) {
  socket.emit("errorResponse","Please login as admin");
}

function setAuthUsers() {

}

function loadquestionstomem(file,socket) {

  let qid = STARTQID;
  qmt.clearAllQuestions();

  var rd = rln.createInterface({
      input: fs.createReadStream(file),
      console: false
  });

  rd.on('line', function(line) {
    let qmq = qmt.insertQuestion(line,qid++);
  });

  rd.on('close', function() {
    socket.emit("infoResponse",qmt.getNumQuestions()+" questions loaded");
  });
}

function collectCats(str) {
  let scexists = 0;
  let subcats = new Array();
  let obj = JSON.parse(str,'utf8');
  if(NewCats[obj.Category.toUpperCase()]) {
    subcats = NewCats[obj.Category.toUpperCase()];
    for(var i in subcats) {
      if(subcats[i] == obj.Subcategory.toUpperCase())
        scexists = 1;         // sub cat already in array
    }
    if(scexists == 0) {   // sub cat doesnt exist so add it to this Category
      subcats.push(obj.Subcategory.toUpperCase());
      NewCats[obj.Category.toUpperCase()] = subcats;
    }
  }
  else {    // category doesnt exist so add both category and subcategory
    subcats.push(obj.Subcategory.toUpperCase());
    NewCats[obj.Category.toUpperCase()] = subcats;
  }
}

// prepare to countdown before each question
function preQuestion(game) {
  io.in(game.gameid).emit('announcement','Get ready!');
  io.in(game.gameid).emit('currentQuestionUpdate','');
  io.in(game.gameid).emit('image','');
  io.in(game.gameid).emit('multichoice','');
  game.answers = 0;   // reset the no of answers received
  io.to(QMSockets[game.qmid]).emit("answersUpdate",game.answers);  // tell the QM
  var clock = setTimeout(gcountdown,1000,game,GCOUNTDOWNTIME);
}

// count down before start of each question. Once coundown hits 0, show the question
function gcountdown(game,time) {
  io.in(game.gameid).emit('timeUpdate','Next question in: '+time);
  if(time > 0)
    setTimeout(gcountdown,1000,game,time-1);  // continue countdown
  else {
    postQuestion(game); // show the question
    }
}

// prepare to countdown during each question
function postQuestion(game) {
  let q = game.questions[game.cqno];
  io.in(game.gameid).emit('currentQuestionUpdate',q.question);
  if(q.type == 'MULTICHOICE') {
    let answers = q.answer.split('#');
    q.answer = answers[0];     // the first value is the correct answer
    answers.sort(function(a, b) {return 0.5 - Math.random()});   //mix up the multichoice options
    io.in(game.gameid).emit('multichoice',answers);
  }
  if(q.imageurl)
    io.in(game.gameid).emit('image',IMAGEURL+q.imageurl);
  else {
    io.in(game.gameid).emit('image',"");
  }
  let str = "Question "+(game.cqno+1) +" of "+game.numquestions;
  io.in(game.gameid).emit('announcement',str);
  game.qstarttime = new Date();   // question start time
  setTimeout(qcountdown,1000,game,game.timelimit);
}

// count down after start of each question duration is as per game settings
function qcountdown(game,time) {
  io.in(game.gameid).emit('timeUpdate','Time Remaining: '+time);
  if(time > 0)
    setTimeout(qcountdown,1000,game,time-1);  // continue countdown
  else {
    endQuestion(game);
    }
}

// question has finished, clear question and prepare for the next one
function endQuestion(game) {
  io.in(game.gameid).emit('timeUpdate','');
  io.in(game.gameid).emit('currentQuestionUpdate','');
  io.in(game.gameid).emit('image','');
  io.in(game.gameid).emit('multichoice','');
  let points = qmt.getContestantPoints(game);
  io.in(game.gameid).emit('scoresUpdate',points);
  if((game.cqno+1) >= game.numquestions) {    // been through all questions
    io.in(game.gameid).emit('announcement','End of Game');
    game.cqno = -1;   // game has ended setting
  }
  else {
    io.in(game.gameid).emit('announcement','Please wait for the next question');
//    preQuestion(game);
  }
}
