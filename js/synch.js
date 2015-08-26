window.onload = function() {
	var socket = io('https://synch-backend.herokuapp.com/');
    var seeking = false, toggling = false;
    var thisRoom = $("#thisRoom"), idButton = $("#roomIDButton"), pproom = $("#playPauseRoom"), join = $("#join");

    $("#search").autocomplete({
        source: function(request, response){
            var apiKey = 'AI39si7ZLU83bKtKd4MrdzqcjTVI3DK9FvwJR6a4kB_SW_Dbuskit-mEYqskkSsFLxN5DiG1OBzdHzYfW0zXWjxirQKyxJfdkg';
            $.ajax({
                url: "http://suggestqueries.google.com/complete/search?hl=en&ds=yt&client=youtube&hjson=t&cp=1&q="+request.term+"&key="+apiKey+"&format=5&alt=json&callback=?",  
                dataType: 'jsonp',
                success: function(data, textStatus, request) { 
                   response( $.map(data[1], function(item) {
                        return {label: item[0],}
                    }));
                }
            });
        },
        select: function( event, ui ) {
            console.log(ui.item.label);
        }
    });    

    join.click(function() {
        socket.emit("joinRoom", {roomID: $("#roomID").val()});
    });

    $("#new").click(function() {
        socket.emit("newRoom");
    });

    pproom.click(function() {
        var text = pproom.attr("value");
        if(text == "Pause entire room") {
            socket.emit("pause");    
        }
        else {
            socket.emit("play");
        }
    });

    function togglePPRoom() {
        var text = pproom.attr("value") == "Pause entire room" ? "Play entire room" : "Pause entire room";
        pproom.prop('value', text);
        return text;
    }

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
            if(!seeking && !toggling) {
                socket.emit("currentTime", {currentTime: time});    
            }
            seeking = false;
            toggling = false;
        }
    }

    socket.on('currentTimeDone', function(data) {
        player.seekTo(parseInt(data["currentTime"]));
        seeking = true;
    });

    socket.on('pauseDone', function(data) {
        player.pauseVideo();
        pproom.attr('value', data["output"]);
        toggling = true;
    });

    socket.on('playDone', function(data) {
        player.playVideo();
        pproom.attr('value', data["output"]);
        toggling = true;
    });

    socket.on('joinRoomDone', function(output) {
      output = output["output"];

      if(output == "nonexistent") {
        nonexistent();
        return;
      }
      updateClientList(output["clientsList"]); 
      updateRoomID(output["roomID"]);
    });

    socket.on('newRoomDone', function(output) {
      output = output["output"];
      updateClientList(output["clientsList"]); 
      updateRoomID(output["roomID"]);
    });

    function nonexistent() {
        join.css("color", "#ff3232").attr("value", "Room not found!");
        setTimeout(function() {join.css("color", "black").attr("value", "Join this room");}, 1000);
    }

    function updateRoomID(roomID) {
        idButton.show().prop('value', "Room ID: " + roomID);
    }

    function updateClientList(cList) {
        thisRoom.empty();
        for(var i in cList) {
            thisRoom.append("<input type=\"button\" class=\"button-primary\" value=\"" + cList[i] + "\">");
        }
        thisRoom.append("</ul>");
        $("#joining").hide();
    }
}

//http://jsfiddle.net/hnkK7/
//https://gist.github.com/mahemoff/443933
//https://developers.google.com/youtube/iframe_api_reference
