"use strict";

if (!("WebSocket" in window)) {
    throw("Sorry, no WebSockets for you");
}

var TwitterStream = (function(stream, $) {
    var websocket = null, 
        doFollow = true, // Follow the stream or not
        callbackOnTweet = function(data) {}, // onmessage callback
        callbackOnClose = function() {}, 
        callbackOnOpen = function() {}; 

    /*
     * Private
     */

    function newWebSocket() {
        var ws = new WebSocket("ws://localhost:8080");

        ws.onmessage = function(evt) {
            handleMessage(evt);
        }
        ws.onopen = function(evt) { 
            //websocket.send(JSON.stringify({command:'hello'}));
            callbackOnOpen();
        };
        ws.onerror = function(evt) {
            console.error('onerror ' + evt);
        };
        ws.onclose = function() { 
            doFollow = false;
            callbackOnClose();
        };
        
        return ws;
    };

    function isClosed() {
        if (null === websocket) {
            return true;
        }
        return websocket.readyState == WebSocket.CLOSED ? true: false;
    };

    function handleMessage(evt) {
        if (!doFollow) {
            return;
        }
        callbackOnTweet(evt.data);
    };

    /*
     * Exposed
     */

    stream.start = function() {
        if (websocket == null) {
            websocket = newWebSocket();
        }
        doFollow = true;
    };

    stream.stop = function() {
        doFollow = false;
    };

    stream.close = function() {
        if (websocket != null && !isClosed()) {
            websocket.close();
        }
    };

    /*
     * Callbacks
     */

    stream.onTweet = function(fn) {
        callbackOnTweet = fn || function(data) {};
    };

    stream.onOpen = function(fn) {
        callbackOnOpen = fn || function() {};
    };

    stream.onClose = function(fn) {
        callbackOnClose = fn || function() {};
    };

    return stream;
})(TwitterStream || {}, jQuery);

;(function($, TwitterStream) {
    TwitterStream.onTweet(function(data) {
        var parsed, MAX_ITEMS = 15;

        try {
            parsed = JSON.parse(data);
        } catch (err) {
            console.error('Failed to parse ' + data);
            return;
        }
        $('<li><span class="name">@'+ parsed.user.screen_name + '</span>: <span class="text">' + parsed.text  + '</span></li>').hide().prependTo('#outputarea ul').fadeIn(); 
        if ($("#outputarea > ul > li").length > MAX_ITEMS)  {
            $('li:last', $('#outputarea ul')).remove();
        }
    });

    TwitterStream.onOpen(function() {
        $('#status').html("Connected");
    });
    TwitterStream.onClose(function() {
        $('#status').html("Disconnected");
    });

    TwitterStream.start();
})(jQuery, TwitterStream);


$(document).ready(function() {
    $("a.switch_thumb").toggle(function(){
        $(this).addClass("swap");
        $("ul.display").fadeOut("fast", function() {
            $(this).fadeIn("fast").addClass("thumb_view");
        });

        TwitterStream.stop();
    }, function () {
        $(this).removeClass("swap");
        $("ul.display").fadeOut("fast", function() {
            $(this).fadeIn("fast").removeClass("thumb_view");
        });

        TwitterStream.start();
    }); 
});
