window.onload = function() {
	var socket = io('https://synch-backend.herokuapp.com/');
    var seeking = false;

    $("#join").click(function() {
        socket.emit("joinRoom", {roomID: $("#roomID").val()});
    });

    $("#new").click(function() {
        socket.emit("newRoom");
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

        
        
        if (event.data == YT.PlayerState.PLAYING) {
            
            if(!seeking) {
                socket.emit("currentTime", {currentTime: time});    
            }
            seeking = false;
        }
    }
    
    function pauseVideo() {
        player.pauseVideo();
    }

    socket.on('currentTimeDone', function(data) {
        player.seekTo(parseInt(data["currentTime"]));
        seeking = true;
    });

    socket.on('joinRoomDone', function(output) {
      
    });

    socket.on('newRoomDone', function(output) {
      output = output["output"];
      var cList = output["clientsList"], roomID = output["roomID"];
      var thisRoom = $("#thisRoom"), idButton = $("#roomIDButton");

      thisRoom.empty().append("<ul>");
      for(var i in cList) {
        thisRoom.append("<li>" + cList[i] + "</li>");
      }
      thisRoom.show().append("</ul>");
      idButton.prop('value', roomID);
    });
}

//http://jsfiddle.net/hnkK7/
//https://gist.github.com/mahemoff/443933
//https://developers.google.com/youtube/iframe_api_reference