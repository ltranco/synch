window.onload = function() {
	var socket = io('https://synch-backend.herokuapp.com/');
    var seeking = false, toggling = false;
    var thisRoom = $("#thisRoom"), idButton = $("#roomIDButton"), pproom = $("#playPauseRoom"), join = $("#join"), videoDiv = $("#vid");
    var myAPIKey = "AIzaSyAO9KlVoJU7WMqGsFuL5HiJgRg19hCrkCw";
    var ytQuery = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=30&type=video&key=" + myAPIKey;

    //Autocomplete for search box
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

    //Initializing YouTube API Player
    var tag = document.createElement("script");
    tag.src = "//www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    var player;
    window.onYouTubeIframeAPIReady = function() {
        player = new YT.Player("player", {
          "videoId": "",
          "events": {
            "onReady": onPlayerReady,
            "onStateChange": onPlayerStateChange
          }
        });
    }

    join.click(function() {
        socket.emit("joinRoom", {roomID: $("#roomID").val()});
    });

    $("#new").click(function() {
        socket.emit("newRoom");
    });

    //Query for videos based on search term and display them
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
                    sr.append("<div class='sr'><a class='vidlink'><img id='" + vid + "'class='thumb' src='" + thumb + "'></a><span><b>" + title + "</b><br><p>" + desc + "</p></span></div>");
                }

                $(".vidlink").click(function() {
                    $("#searchResult").fadeOut(300);
                    
                    var id = $(this).find('.thumb').attr("id");
                    socket.emit("videoSelected", {vid: id});

                    createNewPlayer(id);
                });
            }
        });
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
        setInterval(reportCurrentTime(player.getCurrentTime()), 1000);
    }

    socket.on("videoSelectedDone", function(data) {
        console.log("video selected done");
        createNewPlayer(data["vid"]);
    });

    function reportCurrentTime(time) {
        console.log('currentTime is ' + time);
        socket.emit("reportCurrentTime", {currentTimeReport: time});
    }

    function createNewPlayer(vid, s) {
        if(!s) {
            s = 0;
        }
        if(player) {
            player.destroy();
        }
        player = new YT.Player("player", {
          "videoId": vid,
          "start": s,
          "events": {
            "onReady": onPlayerReady,
            "onStateChange": onPlayerStateChange
          }
        });
        videoDiv.show();
        clearInterval();
        setInterval(reportCurrentTime(), 1000);
    }

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

    function onPlayerReady(event) {
        //event.target.playVideo();
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
        var isDisconnecting = output["disconnect"];
        output = output["output"];

        if(output == "nonexistent") {
            nonexistent();
            return;
        }

        if(!isDisconnecting) {
            console.log("time " + output["time"])
            createNewPlayer(output["url"], parseFloat(output["time"]));  
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
        $("#searchArea").show(300);
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
