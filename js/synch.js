window.onload = function() {
	var socket = io('https://synch-backend.herokuapp.com/');
    var seeking = false, toggling = false;
    var thisRoom = $("#thisRoom"), idButton = $("#roomIDButton"), pproom = $("#playPauseRoom"), join = $("#join");
    var myAPIKey = "AIzaSyAO9KlVoJU7WMqGsFuL5HiJgRg19hCrkCw";
    var ytQuery = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=30&type=video&key=" + myAPIKey;

    var player;

    window.onYouTubeIframeAPIReady = function() {
        player = new YT.Player("player", {
          "videoId": id,
          "events": {
            "onReady": onPlayerReady,
            "onStateChange": onPlayerStateChange
          }
        });
    }

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
            queryAndDisplayVideos(ui.item.label);
        }
    });

    function queryAndDisplayVideos(term) {
        $.ajax({
            url: ytQuery + "&q=" + term,  
            dataType: 'jsonp',
            success: function(data) { 
                var items = data["items"];
                var sr = $("#searchResult").show().empty();
                for(var i in items) {
                    var obj = items[i];
                    var vid = obj["id"]["videoId"];
                    var desc = obj["snippet"]["description"];
                    var thumb = obj["snippet"]["thumbnails"]["default"]["url"];
                    var title = obj["snippet"]["title"];
                    sr.append("<div class='sr'><a class='vidlink'><img id='" + vid + "'class='thumb' src='" + thumb + "'></a><span><b>" + title + "</b></span><br><span><p>" + desc + "</p></span></div>");
                }

                $(".vidlink").click(function() {
                    $("#searchResult").fadeOut(300);
                    $("#player").empty();
                    var id = $(this).find('.thumb').attr("id");
                    console.log(id);
                    player.loadVideoById(id);
                });
            }
        });
    }

    

    join.click(function() {
        socket.emit("joinRoom", {roomID: $("#roomID").val()});
    });

    $("#new").click(function() {
        socket.emit("newRoom");
    });

    pproom.click(function() {
        var text = pproom.attr("value");
        console.log(text);
        if(text == "Pause entire room") {
            console.log("emiting paus");
            socket.emit("pause");    
        }
        else {
            console.log("emiting play");
            socket.emit("play");
        }
    });

    function togglePPRoom() {
        var text = pproom.attr("value") == "Pause entire room" ? "Play entire room" : "Pause entire room";
        pproom.prop('value', text);
        return text;
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
        console.log("pause dones!!!");
    });

    socket.on('playDone', function(data) {
        player.playVideo();
        pproom.attr('value', data["output"]);
        toggling = true;
        console.log("play done");
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
        thisRoom.append("<br>");
        $("#joining").hide();
    }
}

//http://jsfiddle.net/hnkK7/
//https://gist.github.com/mahemoff/443933
//https://developers.google.com/youtube/iframe_api_reference
