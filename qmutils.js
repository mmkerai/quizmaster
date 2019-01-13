//var socket = io.connect();
var socket = io('', {
	'reconnection': true,
    'reconnectionDelay': 1000,
    'reconnectionAttempts': 5
});

const version = "QM v0.2";
const GOOGLE_CLIENT_ID="132511972968-co6rs3qsngvmc592v9qgreinp1q7cicf.apps.googleusercontent.com";
//const GOOGLE_CLIENT_ID="132511972968-ubjmvagd5j2lngmto3tmckdvj5s7rc7q.apps.googleusercontent.com";
var googleUser;

function onSignIn(googleUser) {
	var profile = googleUser.getBasicProfile();
	console.log("ID: " + profile.getId()); // Don't send this directly to your server!
	console.log('Full Name: ' + profile.getName());
//	console.log('Given Name: ' + profile.getGivenName());
//	console.log('Family Name: ' + profile.getFamilyName());
//	console.log("Image URL: " + profile.getImageUrl());
	console.log("Email: " + profile.getEmail());
	var id_token = googleUser.getAuthResponse().id_token;
//	console.log("ID Token: " + id_token);
	socket.emit('loginRequest',id_token);
	clearMessages();
}

// This is only for testing without using Google login
function signIn() {
	let qmname = prompt("Quizmaster Name", "quizmaster1");
	socket.emit('TestLoginRequest',qmname);
	clearMessages();
}

// This is only for testing without using Google login
function checksignedin() {
	QM = JSON.parse(localStorage.getItem("QM"));
	if(QM)
		socket.emit('TestLoginRequest',QM.qmname);

	clearMessages();
}

function signOut() {
	localStorage.removeItem('QM');
//  var auth2 = gapi.auth2.getAuthInstance();
//  auth2.signOut().then(function () {
			socket.emit('logoutRequest',"");
			$('#userbutton').hide();
			$('#signoutbutton').hide();
			$('#signinbutton').show();
      console.log('User signed out.');
//    });
}

function setDefaultValues() {
	$('#version').text(version);
	$('#userbutton').hide();
	$('#signoutbutton').hide();
	$('#regqm').hide();
	$('#signinbutton').show();
	$("#error").text("");
	$("#message1").text("");
	$('#joingame').hide();
	$('#qaform').hide();
	$('#nextq').hide();
	$('#qanswer').val('');
	$('#mchoice').hide();
	$('#sbutton').attr('disabled','disabled');
	console.log("Doc ready");
}

function setPostLoginValues(qm) {
	localStorage.setItem("QM",JSON.stringify(qm));
	$('#userbutton').text(qm.qmname);
	$('#registerbutton').hide();
	$('#signinbutton').hide();
	$('#signoutbutton').show();
	$('#signinbutton').hide();
	$('#userbutton').show();
	$('#regqm').hide();
	$('#gamestable').hide();
	console.log("User successfully signed in:"+qm.qmname);
}

function clearMessages() {
	$("#error").text("");
	$("#message1").text("");
	$("#message2").text("");
}

/*
socket.on('loginResponse', function(data) {
  $('#userbutton').text(data);
	$('#signinbutton').hide();
	$('#signoutbutton').show();
	$('#userbutton').show();
	$("#error").text("");
	console.log("User successfully signed in");
});
/*
function checksignedin(gauth2) {
//	gauth2 = gapi.auth2.getAuthInstance();
	if(gauth2.isSignedIn.get() == true)
	{
		console.log("geezer signed in");
		googleUser = gauth2.currentUser.get();
		console.log("Current user: "+googleUser.getBasicProfile().getEmail());
		onSignIn(googleUser);	// do app authentication
	}
	else
	{
		console.log("geezer not signed in");
		var gPromise = gauth2.signIn();
		gauth2.isSignedIn.listen(signinListener);
	}
}

function signinListener() {
	console.log("Listener signed in");
	var gauth2 = gapi.auth2.getAuthInstance();
	googleUser = gauth2.currentUser.get();
	onSignIn(googleUser);	// do app authentication
}

function initGSignin() {
	console.log("gapi initialised");
	var gauth2 = gapi.auth2.getAuthInstance();
	checksignedin(gauth2);
}
*/

function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}

socket.on('disconnect', function () {
	socket.emit('logoutRequest',"");
});

socket.on('infoResponse', function(data) {
	$("#message1").text(data);
});

socket.on('errorResponse',function(data) {
	$('#error').text(data);
});

socket.on('getCatsResponse',function(cats) {
	let items = Object.getOwnPropertyNames(cats);
	console.log(items);
	$('select[name="qcat"]').empty();
	$('select[name="qsubcat"]').empty();
	$('select[name="qcat"]').append($('<option>', {
			value: "select",
			text : "select a category"
		}));

	$.each(items,function(i,item) {
    $('select[name="qcat"]').append($('<option>', {
        value: item,
        text : item
    	}));
		});
	$('select[name="qcat"] option:selected').attr('disabled','disabled');
});

socket.on('getSubcatsResponse',function(subcats) {
	$('select[name="qsubcat"]').empty();
	for(const item of subcats) {
    $('select[name="qsubcat"]').append($('<option>', {
        value: item,
        text : item
    	}));
		}
});

socket.on('getDiffsResponse', function(diffs) {
	$('#qdiff').empty();
	let items = Object.getOwnPropertyNames(diffs);
	$.each(items, function(i, item) {
    $('#qdiff').append($('<option>', {
        value: item,
        text : item
    }));
	});
});

socket.on('getTypesResponse', function(types) {
	$('#qtype').empty();
	let items = Object.getOwnPropertyNames(types);
	$.each(items, function(i, item) {
    $('#qtype').append($('<option>', {
        value: item,
        text : item
    }));
	});
});

function getquestions() {
	const cat = $('select[name="qcat"] option:selected').val();
	const subcat = $('select[name="qsubcat"] option:selected').val();
	console.log("Getting Questions with Category: "+cat+":"+subcat);
	socket.emit('getQuestionsByCatandSubcat',cat,subcat);
}
