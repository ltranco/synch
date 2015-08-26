window.onload = function() {
	var socket = io('https://synch-backend.herokuapp.com/');
    
    $("#join").click(function() {
    	socket.emit("joinRoom", {roomID: 123445});
    });

    $("#new").click(function() {
    	socket.emit("newRoom", {name: "Long"});
    });

    socket.on('joinRoomDone', function(output) {
      console.log(output);
    });
}

//http://jsfiddle.net/hnkK7/
//https://gist.github.com/mahemoff/443933
//https://developers.google.com/youtube/iframe_api_reference