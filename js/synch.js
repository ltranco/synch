window.onload = function() {
	var socket = io('https://synch-backend.herokuapp.com/');
    
    var tag = document.createElement("script");
    tag.src = "//www.youtube.com/iframe_api";

    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  // This function creates an <iframe> (and YouTube player)
  // after the API code downloads.
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
    event.target.playVideo();
  }

  // The API calls this function when the player's state changes.
  function onPlayerStateChange(event) {
    var time, rate, remainingTime;
    clearTimeout(stopPlayTimer);
    if (event.data == YT.PlayerState.PLAYING) {
      time = player.getCurrentTime();
      // Add .4 of a second to the time in case it's close to the current time
      // (The API kept returning ~9.7 when hitting play after stopping at 10s)
      if (time + .4 < stopPlayAt) {
        rate = player.getPlaybackRate();
        remainingTime = (stopPlayAt - time) / rate;
        stopPlayTimer = setTimeout(pauseVideo, remainingTime * 1000);
      }
    }
  }
  function pauseVideo() {
    player.pauseVideo();
  }




    
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
}

//http://jsfiddle.net/hnkK7/
//https://gist.github.com/mahemoff/443933
//https://developers.google.com/youtube/iframe_api_reference