window.onload = function() {
	var socket = io('https://synch-backend.herokuapp.com/');
    
    $("#join").click(function() {
        socket.emit("joinRoom", {roomID: $("#roomID").val()});
    });

    $("#new").click(function() {
        socket.emit("newRoom", {name: "Long"});
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
        if (event.data == YT.PlayerState.PLAYING) {
            time = player.getCurrentTime();
            player.seekTo(100);
            /*if (time + .4 < stopPlayAt) {
                rate = player.getPlaybackRate();
                remainingTime = (stopPlayAt - time) / rate;
                stopPlayTimer = setTimeout(pauseVideo, remainingTime * 1000);
            }*/
        }
    }
    
    function pauseVideo() {
        player.pauseVideo();
    }

    socket.on('joinRoomDone', function(output) {
      console.log(output);
      player.seekTo(300);
    });

    socket.on('newRoomDone', function(output) {
      console.log(output);
    });
}

//http://jsfiddle.net/hnkK7/
//https://gist.github.com/mahemoff/443933
//https://developers.google.com/youtube/iframe_api_reference