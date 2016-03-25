window.onload = function() {
	var socket = io('https://synch-backend.herokuapp.com/');
    var seeking = false, toggling = false;
    var thisRoom = $("#thisRoom"), idButton = $("#roomIDButton"), pproom = $("#playPauseRoom"), join = $("#join"), videoDiv = $("#vid"), loop = $("#loop");
    var myAPIKey = "AIzaSyAO9KlVoJU7WMqGsFuL5HiJgRg19hCrkCw";
    var ytQuery = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=30&type=video&key=" + myAPIKey;
    var myInterval;
    var loopFlag = false;

    //Autocomplete for search box
    $("#search").autocomplete({
        source: function(request, response){
            var apiKey = 'AI39si7ZLU83bKtKd4MrdzqcjTVI3DK9FvwJR6a4kB_SW_Dbuskit-mEYqskkSsFLxN5DiG1OBzdHzYfW0zXWjxirQKyxJfdkg';
            $.ajax({
                url: "https://suggestqueries.google.com/complete/search?hl=en&ds=yt&client=youtube&hjson=t&cp=1&q="+request.term+"&key="+apiKey+"&format=5&alt=json&callback=?",  
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
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    var player;
    window.onYouTubeIframeAPIReady = function() {
        player = new YT.Player("player", {
          "videoId": "QeCDTYszuho",
          "events": {
            "onReady": onPlayerReady,
            "onStateChange": onPlayerStateChange
          }
        });
    }

    //Repeat control options
    loop.click(function() {
        if($(this).text() == "Repeat: Off") {
            socket.emit("repeatOn");
        }
        else {
            socket.emit("repeatOff");
        }
    });
    socket.on("repeatOffDone", function() {
        loopFlag = false;
        loop.text("Repeat: Off");
    });
    socket.on("repeatOnDone", function(data) {
        loopFlag = true;
        loop.text("Repeat: On");
    });

    join.click(function() {
        socket.emit("joinRoom", {roomID: $("#roomID").val()});
    });

    $("#new").click(function() {
        $("#new").html("<img width=\"30\" height=\"30\" src=\"css/ring.gif\">");
        socket.emit("newRoom");
    });

    $("#searchYT").click(function() {
        queryAndDisplayVideos($("#search").val());
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
                    sr.append("<tr><td><a class='vidlink'><img id='" + vid + "' class='thumb' src='" + thumb + "'></a><b>" + title + "</b><p>" + desc + "</p></td></tr>");
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
            pproom.text("Pause entire room");
        }
        else if (event.data == YT.PlayerState.PAUSED) {
            pproom.text("Play entire room");   
        }
        else if(event.data === YT.PlayerState.ENDED && loopFlag) {
            player.seekTo(0);
            player.playVideo();
        }
    }

    socket.on("videoSelectedDone", function(data) {
        createNewPlayer(data["vid"]);
    });

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
        $("#pproom").show();
    }

    pproom.click(function() {
        var text = pproom.text();
        if(text == "Pause entire room") {
            socket.emit("pause");    
        }
        else {
            socket.emit("play");
        }
    });

    function onPlayerReady(event) {
    }

    socket.on('currentTimeDone', function(data) {
        player.seekTo(parseInt(data["currentTime"]));
        seeking = true;
    });

    socket.on('pauseDone', function(data) {
        player.pauseVideo();
        pproom.text(data["output"]);
        toggling = true;
    });

    socket.on('playDone', function(data) {
        player.playVideo();
        pproom.text(data["output"]);
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
        join.text("Room not found!");
        setTimeout(function() {join.text("Join this room");}, 1000);
    }

    function updateRoomID(roomID) {
        idButton.css("display", "inline-block").text("ID: " + roomID);
        $("#searchArea").show(300);
    }

    function updateClientList(cList) {
        thisRoom.empty();
        for(var i in cList) {
            thisRoom.append("<a class=\"waves-effect waves-light client btn\">" + cList[i] + "</a>");
        }
        thisRoom.append("<br>");
        $("#joining").hide();
    }
}