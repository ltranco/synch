window.onload = function() {
	var socket = io('https://synch-backend.herokuapp.com/');
    
    $("#join").click(function() {
        socket.emit("joinRoom", {roomID: $("#roomID").val()});
    });

    $("#new").click(function() {
        socket.emit("newRoom", {name: "Long"});
    });

    socket.on('joinRoomDone', function(output) {
      console.log(output);
    });

    socket.on('newRoomDone', function(output) {
      console.log(output);
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
        player.seekTo(120, true);
    }

    function onPlayerReady(event) {
        event.target.playVideo();
    }

    function onPlayerStateChange(event) {
        var time, rate, remainingTime;
        clearTimeout(stopPlayTimer);
        if (event.data == YT.PlayerState.PLAYING) {
            time = player.getCurrentTime();
      
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
}

//http://jsfiddle.net/hnkK7/
//https://gist.github.com/mahemoff/443933
//https://developers.google.com/youtube/iframe_api_reference