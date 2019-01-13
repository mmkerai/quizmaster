/*
*	Quizmaster Home page
*/

var QM = new Object();
var Questions = [];
var Marray = [];

$(document).ready(function() {
	setDefaultValues();
	checksignedin();
	$('#joinform').submit(function(event) {
		event.preventDefault();
	});
	$('#qaform').submit(function(event) {
		event.preventDefault();
	});
});

function joinquiz() {
	let contestant = new Object();
	contestant.userid = $('#cname').val();
	contestant.accesscode = $('#cacode').val();
	socket.emit('joinGameRequest',contestant);
	clearMessages();
}

socket.on('loginResponse',function(qm) {
	QM = qm;
	console.log("Login response: "+QM);
	setPostLoginValues(QM);
	socket.emit("getGamesRequest",QM.qmid);
});

socket.on('joinGameResponse',function(message) {
	$('#joingamex').hide();
	$('#menu').hide();
	$('#gameheader').text(message);
});

socket.on('announcement',function(message) {
	$('#qheader').text(message);
});

socket.on('timeUpdate',function(message) {
	$('#tremain').text(message);
});

socket.on('currentQuestionUpdate',function(qobject) {
	if(qobject.length == 0) {
		$('#qaform').hide();
		$('#qanswer').val("");
		$('#message1').text("");
	}
	else {
		$('#qaform').show();
		$('#question').text(qobject);
		$('#sbutton').removeAttr('disabled');
	}
});

socket.on('multichoice',function(arr) {
	if(arr) {
		Marray = arr;
		$('#mchoice1').text(arr[0]);
		$('#mchoice2').text(arr[1]);
		$('#mchoice3').text(arr[2]);
		$('#mchoice4').text(arr[3]);
		$('#mchoice').show();
	}
	else {
		$('#mchoice').hide();
	}
});

socket.on('image',function(im) {
	$('#qimage').attr('src',im);
});

socket.on('scoresUpdate',function(score) {
	$('#qaform').hide();
	$('#scores').show();
		var table = new Tabulator("#scores", {
		    data: score,
				width: 400,
		    columns:[
		    {title:"Name", field:"cname"},
		 		{title:"Points", field:"points"}]
		});
});

// submit a text or num answer
function submitanswer() {
		let ans = $('#qanswer').val();
		socket.emit('submitAnswerRequest',ans);
}

// submit a multichoice answer
function mcanswer(value) {
	console.log("Ans is "+Marray[value]);
	socket.emit('submitAnswerRequest',Marray[value]);
}

socket.on('submitAnswerResponse',function(msg) {
	$('#message1').text(msg);
	$('#sbutton').attr('disabled','disabled');
	$('#mchoice').hide();
});
