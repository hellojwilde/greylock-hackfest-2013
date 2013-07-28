function loaded(){
    document.getElementById('room').value = randomString(8);
}

function randomString(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
}

function joinRoom(){
    var room = document.getElementById('room').value;
    if(!room){
        alert('You must give a room!');
        return;
    }
    var nextPlace = document.URL + '/' + room + '?isLeader=false';
    console.log(nextPlace);
    window.location = nextPlace;
}

function createRoom(){
    var room = document.getElementById('room').value;
    if(!room){
        alert('You must give a room!');
        return;
    }
    window.location = document.URL + '/' + room + '?isLeader=true';
}