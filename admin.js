/*
*	Quizmaster Home page
*/

var QM = new Object();
var Questions = [];

$(document).ready(function() {
	setDefaultValues();
	$('#newgame').hide();
	$('#qchoose').hide();
	checksignedin();
	$('#qchooseform').submit(function(event) {
		event.preventDefault();
	});
	$('select[name="qcat"]').change(function() {
			let cat = $('select[name="qcat"] option:selected').val();
			console.log("selected option: "+cat);
			socket.emit("getSubcatsRequest",cat);
	});
});

function register() {
	$('#registerbutton').hide();
	$('#regqm').show();
}

function regNewQM() {
	let qm = new Object();
	let sub = $('#qmsubid').val();
	qm.sub = Number(sub);
	qm.name = $('#qmname').val();
	qm.email = $('#qmemail').val();
	console.log("Registering..."+qm.name);
	socket.emit('registerQMRequest',qm);
}

function chooseq() {
	$('#qchoose').show();
	socket.emit('getCatsRequest','test');
}

function reviewq() {
	console.log("Reviewing Questions");
	socket.emit('getCatsRequest','test');
//	socket.emit('getSubcatsRequest','test');
//	socket.emit('getDiffsRequest','test');
}

function newgame() {
	$('#newgame').show();
	socket.emit('getCatsRequest','test');
	socket.emit('getDiffsRequest','test');
	socket.emit('getGameTypesRequest','test');
}

function addgame() {
//	console.log("Creating New Game");
	let newg = new Object();
	newg.qmid = QM.qmid;
	newg.gamename = $('#qmgname').val();
	console.log("Game:"+newg.gamename);
	newg.numquestions = Questions.length;
	newg.questions = Questions;
	newg.timelimit = $('#qmgtime').val();
//	newg.gametype = $('#qmgtype').val();
	newg.gametype = "FUNQUIZ";
	newg.accesscode = $('#acode').val();
/*	if(newg.gamename.length < 8)
		return(alert("Please use a name at least 8 chars long"));
	if(newg.timelimit < 5)
		return(alert("Time for each question should be at least 5 seconds"));
	if(Questions.length < 2)
		return(alert("Please select at least 2 questions"));
*/
	socket.emit('newGameRequest',newg);
}

socket.on('loginResponse',function(qm) {
	QM = qm;
//	console.log("Login response: "+QM);
	setPostLoginValues(QM);
	socket.emit("getGamesRequest",QM.qmid);
	$('#error').text("");
});

socket.on('registerQMResponse',function(qm) {
	console.log(qm);
	$('#registerbutton').hide();
	$('#regqm').hide();
});

socket.on('getGamesResponse',function(glist) {
//	console.log(glist);
	$('#gamestable').show();
	var table = new Tabulator("#gamestable", {
	    data: glist,
   		responsiveLayout:true,
	    columns:[
			{title:"Game Name", field:"gamename",width:300},
	    {title:"Game Type", field:"gametype"},
			{title:"Access Code", field:"accesscode"},
	    {title:"No of Questions", field:"numquestions"},
			{title:"Time Limit", field:"timelimit"}],
			rowDblClick:function(e, row) {
				console.log(row._row.data.gameid);
				window.open("gplay.html?gameid="+row._row.data.gameid, '_blank');
  			},
	});
});

socket.on('getQuestionsResponse',function(qlist) {
		var table = new Tabulator("#setqtable", {
		    data: qlist,
		    columns:[
		    {title:"Category", field:"category"},
		    {title:"Subcategory", field:"subcategory"},
		    {title:"Difficulty", field:"difficulty",widthGrow:2},
		    {title:"Type", field:"type", align:"center"},
		    {title:"Question", field:"question",width:320},
		    {title:"Answer", field:"answer"},
		 		{title:"Image", field:"imageurl"}],
				rowDblClick:function(e,row) {
					console.log(row._row.data.qid);
					Questions.push(row._row.data.qid);
					$('#questions').val(Questions);
	  		},
		});
});

socket.on('newGameResponse',function(data) {
	$('#message1').text("Game created");
	setPostLoginValues(QM);
	socket.emit("getGamesRequest",QM.qmid);
	$('#error').text("");
});
