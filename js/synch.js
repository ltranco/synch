window.onload = function() {
	var socket = io('https://synch-backend.herokuapp.com/');
    var seeking = false, toggling = false;

    var thisRoom = $("#thisRoom"), idButton = $("#roomIDButton"), pproom = $("#playPauseRoom");


    /* AutoComplete */
$("#youtube").autocomplete({
    source: function(request, response){
        /* google geliştirici kimliği (zorunlu değil) */
        var apiKey = 'AI39si7ZLU83bKtKd4MrdzqcjTVI3DK9FvwJR6a4kB_SW_Dbuskit-mEYqskkSsFLxN5DiG1OBzdHzYfW0zXWjxirQKyxJfdkg';
        /* aranacak kelime */
        var query = request.term;
        /* youtube sorgusu */
        $.ajax({
            url: "http://suggestqueries.google.com/complete/search?hl=en&ds=yt&client=youtube&hjson=t&cp=1&q="+query+"&key="+apiKey+"&format=5&alt=json&callback=?",  
            dataType: 'jsonp',
            success: function(data, textStatus, request) { 
               response( $.map( data[1], function(item) {
                    return {
                        label: item[0],
                        value: item[0]
                    }
                }));
            }
        });
    },
    /* seçilene işlem yapmak için burayı kullanabilirsin */
    select: function( event, ui ) {
        $.youtubeAPI(ui.item.label);
    }
});

/* Butona Basınca Arama */
$('button#submit').click(function(){
    var value = $('input#youtube').val();
        $.youtubeAPI(value);
});

/* Youtube Video Oynatma Fonksiyonu */
$.youtubePlay = function(yid, frame){
    $('.youtubeOynat').slideUp().empty();
    $('#'+yid).slideDown().html('<iframe src="'+ frame +'&autoplay=1" style="width: 100%; box-sizing: border-box; height: 300px" />');
}

    $("#join").click(function() {
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
        $("#nonexist").show().delay(1000).fadeOut();
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

    function updateRoomID(roomID) {
        idButton.show().prop('value', "Room ID: " + roomID);
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
