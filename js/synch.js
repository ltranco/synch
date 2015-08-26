window.onload = function() {
	var socket = io('https://synch-backend.herokuapp.com/');
    var seeking = false;

    var thisRoom = $("#thisRoom"), idButton = $("#roomIDButton"), pproom = $("#playPauseRoom");

    $("#join").click(function() {
        socket.emit("joinRoom", {roomID: $("#roomID").val()});
    });

    $("#new").click(function() {
        socket.emit("newRoom");
    });

    pproom.click(function() {
        var text = pproom.attr("value") == "Pause entire room" ? "Play entire room" : "Pause entire room";
        console.log(text);
        if(text == "Pause entire room") {
            console.log("pause room");
            socket.emit("pause");    
        }
        else {
            console.log("play room");
            socket.emit("play");
        }
        pproom.prop('value', text);
    });

    var tag = document.createElement("script");
    tag.src = "//www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    var player;
    window.onYouTubeIframeAPIReady = function() {
        player = new YT.Player("player", {
          "videoId": "PUP7U5vTMM0",
          "events": {
            "onReady": onPlayerReady,
            "onStateChange": onPlayerStateChange
          }
        });
    }

    function onPlayerReady(event) {
        //event.target.playVideo();
    }

    function onPlayerStateChange(event) {
        var time, rate, remainingTime;
        time = player.getCurrentTime();
        if(event.data == YT.PlayerState.PLAYING) {
            if(!seeking) {
                socket.emit("currentTime", {currentTime: time});    
            }
            seeking = false;
        }
    }

    socket.on('currentTimeDone', function(data) {
        player.seekTo(parseInt(data["currentTime"]));
        seeking = true;
    });

    socket.on('pauseDone', function() {
        player.pauseVideo();
        console.log("PAUSEEE!!!!");
    });

    socket.on('pauseDone', function() {
        player.playVideo();
        console.log("PLAYYY!!!!");
    });

    socket.on('joinRoomDone', function(output) {
      output = output["output"];

      if(output == "nonexistent") {
        console.log("nonexistent room");
        $("#nonexist").show().delay(1000).fadeOut();
        return;
      }
      console.log(output);
      updateClientList(output["clientsList"]); 
      updateRoomID(output["roomID"]);
    });

    socket.on('newRoomDone', function(output) {
      output = output["output"];
      updateClientList(output["clientsList"]); 
      updateRoomID(output["roomID"]);
    });

    function updateRoomID(roomID) {
        idButton.show().prop('value', roomID);
    }

    function updateClientList(cList) {
        thisRoom.empty().append("<ul>");
        for(var i in cList) {
        thisRoom.append("<li>" + cList[i] + "</li>");
        }
        thisRoom.append("</ul>");
        $("#joining").hide();
    }
}

//http://jsfiddle.net/hnkK7/
//https://gist.github.com/mahemoff/443933
//https://developers.google.com/youtube/iframe_api_reference