var sys = require("sys"),
    ws = require("./ws"), // WebSocket 
    TwitterNode = require('./twitter-node').TwitterNode,
	port = 8080, 
    username = '', // Twitter username, you need to set this
    password = '', // Twitter password, you need to set this
    keywords = ['#fail'];

if (!username || !password) {
    sys.puts("Twitter username and password not set, needed for authorisation.");
    throw "twitter authorisation needed";
}

/**
 * Twitter stream init
 *
 * @param {object} TwitterNode
 * @param {String} username 
 * @param {String} password
 * @param {Array} keywords
 */
var stream = (function (TwitterNode, username, password, keywords) {
    var st = new TwitterNode({
        user: username,
        password: password,
        track: keywords,
    });
    st.headers['User-Agent'] = 'whatever';

    // defaults
    st.addListener('tweet', function(tweet) {
        sys.puts("@" + tweet.user.screen_name + ": " + tweet.text);
    }).addListener('limit', function(limit) {
        sys.puts("LIMIT: " + sys.inspect(limit));
    }).addListener('delete', function(del) {
        sys.puts("DELETE: " + sys.inspect(del));
    }).addListener('close', function(resp) {
        sys.puts("wave goodbye... " + resp.statusCode);
    });

    return st;
})(TwitterNode, username, password, keywords);


/** 
 * WebSocket server init
 */
var socket = (function(ws, stream) {
    var srv;

	// Callbacks init
    srv = ws.createServer(function(websocket) {
        websocket.addListener("connect", function (resource) { 
            sys.puts("WebSocket connected " + resource);
        }).addListener("data", function (data) { 
            // Example
            // websocket.write(JSON.stringify({success:true, message:'Hello World'})); 
        }).addListener("close", function () { 
            sys.puts("WebSocket closed");
        });
        
        // let stream use the websocket object and push stuff
        stream.addListener("tweet", function(tweet) {
            websocket.write(JSON.stringify(tweet));
        });
    });

    return srv;
})(ws, stream);

socket.listen(port);
stream.stream();
