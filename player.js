function Player(Bot, YTKey, SCInfo, channel) {
	var self = this;
	var queue = [], plQueue = [],
		last, current, next,
		announcementChannel,
		streamReference, ready = false, playing = false, playingPlaylist = false, plRef, encs = ['ffmpeg', 'avconv'], plInterruption = true,
		mods = [], 
		ytdl = require('ytdl-core'),
		request = require('request'),
		childProc = require('child_process'),
	
	var API = {
		Youtube: {
			Snippet: function(id) {
				return "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + id + "&key=" + YTKey;
			},
			ContentDetails: function(id) {
				return "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=" + id + "&key=" + YTKey;
			},
			GetPlaylist: function(id) {
				return "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=" + id + "&key=" + YTKey;
			},
			Search: function(q) {
				return "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + q + "&key=" + YTKey;
			}
		}
	}
	SC.init({
		id: SCInfo.id,
		secret: SCInfo.secret,
		uri: SCInfo.uri,
		accessToken: SCInfo.accessToken
	});
	Bot.joinVoiceChannel(channel, function() {
		Bot.testAudio({channel: channel, stereo: true}, function(stream) {
			ready = true;
			streamReference = stream;
		});
	});
	
	this.enqueue = function(user, userID, link) {
		var data = parseInput(link);
		var type = data.type,
			title, url, id, uID;
		log("Queueing: " + data.location);
		
		if (tooManyRequests(userID)) return notify(user + "(" + userID + ") has too many requests in queue.");
		
		for (var i=0; i<queue.length; i++) {
			if (queue[i].uID === data.location) return notify("This item is already in queue");
		}
		
        request (API.Youtube.ContentDetails(data.location), function(err, res, body) {
            if (err) return log('error', err);
            body = JSON.parse(body);
            if (body.items.length === 0) { return log('warn', data.location + " is not a valid YouTube video ID."); }

            var duration = turnStupidAssYoutubeShitIntoActualSeconds(body.items[0].contentDetails.duration);
            if (duration > 480) return notify("The item provided has a duration of over 8 minutes. Ignoring.");
            
            request( API.Youtube.Snippet(data.location) , function(err, res, body) {
                if (err) return log('error', err);
                body = JSON.parse(body);

                ytdl.getInfo( "https://www.youtube.com/watch?v=" + data.location, function(err, info) {
                    if (err) return log('error', err);
                    var f = info.formats;
                    var selection, hb = 0;
                    for (var i=0; i<f.length; i++) {
                        var current = f[i];
                        if (current.type && current.type.indexOf('audio/') > -1) {
                            if (Number(current.audioBitrate) > hb) {
                                hb = Number(current.audioBitrate);
                                selection = current;
                            }
                        }
                    }
                    
                    if (!selection) return notify("Unable to get stream information about link: " + data.type);
                    title = body.items[0].snippet.title;
                    url = selection.url;
                    id = qID();
                    uID = data.location;
                    

                    queue.push( new MusicItem(type, title, url, id, userID, user, uID) );
                    check();

                    notify(user + " has requested " + title);
                });
            });
        });
    
		
	};
	
	this.deleteSong = function(user, userID, songID) {
		for (var i=0; i<queue.length; i++) {
			if (queue[i].id === Number(songID)) {
				if (queue[i].requesterID === userID || mods.indexOf(userID) > -1 ) {
					notify( user + " has removed the song " + queue[i].title );
					return queue.splice(i, 1);
				}
			}
		}
	};
	
	this.wrongSong = function(user, userID) {
		for (var i = queue.length - 1; i >= 0; i--) {
			if (queue[i].requesterID === userID) {
				self.deleteSong(user, userID, queue[i].id);
			}
		}
	}
	
	this.addMods = function(idArr) {
		return idArr.forEach(function(ID) {
			mods.push(ID);
		});
	};
	
	this.removeMods = function(idArr) {
		return idArr.forEach(function(ID) {
			if (mods.indexOf(ID) > -1) {
				mods.splice( mods.indexOf(ID), 1 );
			}
		});
	};
	
	this.setDefaultPlaylist = function(ID) {
		plQueue = [];
		request( API.Youtube.GetPlaylist(ID) , function(err, res, body) {
			if (err || (res.statusCode / 100 | 0) != 2) return log('error', ID + " is not a valid Playlist ID");
			body = JSON.parse(body);
			var items = body.items;
			addQItem(items);
		});
		function addQItem(items) {
			if (items.length === 0) return check();
			var ci = items.shift();
			ytdl.getInfo( "https://www.youtube.com/watch?v=" + ci.snippet.resourceId.videoId, function(err, info) {
				var f = info.formats;
				var hb = 0;
				var selection;
				for (var i=0; i<f.length; i++) {
					if ( (Number(f[i].audioBitrate)) && Number(f[i].audioBitrate) > hb && f[i].type &&f[i].type.indexOf("audio/webm") > -1 ) {
						hb = Number(f[i].audioBitrate);
						selection = f[i];
					}
				}
				
				var title = ci.snippet.title;
				var url = selection.url;
				plQueue.push( new PlaylistItem(title, url) );
				addQItem(items);
			});
		}
	};
	
	this.setAnnouncementChannel = function(ID) {
		var sID = Bot.serverFromChannel(ID);
		if (!sID) return log('warn', "Cannot find server associated with: " + ID);
		var cList = Bot.servers[sID].channels;
		for (var channel in cList) {
			if (channel === ID && cList[channel].type === "text") {
				return announcementChannel = ID;
			}
		}
	};
	
	this.setPlaylistInterruption = function(b) {
		if (!!b) { 
			log("Songs will interrupt playlist when queued");
		} else {
			log("Songs won't interrupt playlist when queued");
		}
		return plInterruption = !!b;
	}
	
	this.query = function(what) {
		switch (what) {
				case "last":
					if (last) {
						qResponse(last.title, last.id, last.requesterID, last.requester);
					}
					break;
				case "current":
					if (current) {
						qResponse(current.title, current.id, current.requesterID, current.requester);
					}
					break;
				case "next":
					if (next) {
						qResponse(next.title, next.id, next.requesterID, next.requester);
					}
					break;
				case "all":
					if (queue.length > 0) {
						var message = "```\n";
						queue.forEach(function(song, index, arr) {
							if (index == arr.length - 1) {
								return message += song.id + ") " + song.title + "\n```";
							}
							message += song.id + ") " + song.title + "\n";
						});
						Bot.sendMessage({
							to: announcementChannel,
							message: message
						});
					}
					break;
		}
	};
	
	this.searchYoutube = function(user, userID, q) {
		q = q.split(" ").join("+");
		
		request( API.Youtube.Search(q), function(err, res, body) {
			if (err || (res.statusCode / 100 | 0 != 2) ) return log('warn', "Could not execute search");
			body = JSON.parse(body);
			for (var i=0; i<body.items.length; i++) {
				if (body.items[i].id.kind === "youtube#video") {
					return self.enqueue(user, userID, body.items[i].id.videoId);
				}
			}
		});
	};
	
	function parseInput(input) {
		var ret = {
			type: undefined,
			location: undefined
		};

		if (input.indexOf("youtube.com/watch?v=") > -1) {
			ret.type = "YT";
			ret.location = input.substring(input.indexOf("?v=") + 3, input.length);
		} else {
			ret.type = "YT";
			ret.location = input;
		}
		
		return ret;
	}
	function turnStupidAssYoutubeShitIntoActualSeconds(input) {
		var reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
		var hours = 0, minutes = 0, seconds = 0, totalseconds;
		if (reptms.test(input)) {
			var matches = reptms.exec(input);
			if (matches[1]) hours = Number(matches[1]);
			if (matches[2]) minutes = Number(matches[2]);
			if (matches[3]) seconds = Number(matches[3]);
			totalseconds = hours * 3600  + minutes * 60 + seconds;
		}
		return (totalseconds);
	}
	function tooManyRequests(userID) {
		var a = 0;
		for (var i=0; i<queue.length; i++) {
			if (queue[i].requesterID === userID) {
				a += 1;
			}
		}
		return a >= 5;
	}
	function log() {
		var types = {
			info: "[INFO]",
			warn: "[WARN]",
			error: "[ERROR]",
			sent: "[SENT]",
			received: "[RECEIVED]",
			func: "[FUNCTION STARTED]"
		};
		switch (arguments.length) {
			case 0:
				return false;
				break;
			case 1:
				console.log(types.info + ": " + arguments[0]);
				break;
			case 2:
				if (typeof(window) !== 'undefined') { 
					if (window.console[arguments[0].toLowerCase()]) {
						window.console[arguments[0].toLowerCase()](arguments[1]);
					}
				} else {
					console.log(types[arguments[0].toLowerCase()] + ": " + arguments[1]);
				}
				break;
		}
	}
	function qID() {
		return queue.length > 0 ? queue[queue.length - 1].id + 1 : 0;
	}
	
	function check() {
		if (playing) { next = queue[0]; return log('warn', "Song already playing"); }
		if (!playing && queue[0]) return play(queue[0]);
		if (!playing && plQueue[0]) return playPlaylist(plQueue[0]);
	}
	function play(currentSong) {
		if (!plInterruption && playingPlaylist) return;
		if (!ready) return log('warn', "Not ready to play audio");
		if (playingPlaylist) plRef.kill();
		
		var selection, enc;
		
		queue.shift();
		playingPlaylist = false;
		playing = true;
		
		selection = choosePlayer(encs);
		enc = childProc.spawn(selection, [
			'-loglevel', '0',
			'-i', currentSong.url,
			'-f', 's16le',
			'-ar', '48000',
			'-ac', '2',
			'pipe:1'
		], {stdio: ['pipe', 'pipe', 'ignore']});
		
		enc.stdout.once('readable', function() {
			streamReference.send(enc.stdout);
			delete currentSong.id;
			current = currentSong;
			next = queue[0];
		});
		
		enc.stdout.once('end', function() {
			playing = false;
			last = current;
			current = undefined;
			enc.kill();
			check();
		});
	}
	function playPlaylist(currentSong) {
		var selection, enc;
		if (playing) return log('warn', "Requested song already playing");
		playingPlaylist = true;
		plQueue.shift();
		plQueue.push(currentSong);
		
		selection = choosePlayer(encs);
		enc = childProc.spawn(selection, [
			'-loglevel', '0',
			'-i', currentSong.url,
			'-f', 's16le',
			'-ar', '48000',
			'-ac', '2',
			'pipe:1'
		], {stdio: ['pipe', 'pipe', 'ignore']});
		
		plRef = enc;
		enc.stdout.once('readable', function() {
			streamReference.send(enc.stdout);
			current = currentSong;
		});
		
		enc.stdout.once('end', function() {
			current = undefined;
			enc.kill();
			playingPlaylist = false;
			check();
		});
	}
	function choosePlayer(players) {
		players = JSON.parse(JSON.stringify(players));
		var spawn = childProc.spawn, spawnSync = childProc.spawnSync;
		if (players.length > 0) {
			var n = players.shift();
			var s = spawnSync(n);
			if (s.error) {
				return choosePlayer(players);
			} else {
				console.log("Using " + n);
				return n;
			}
		} else {
			console.log("You need either 'ffmpeg' or 'avconv' and they need to be added to PATH");
			return undefined;
		}
	}
	function notify(message) {
		if (!announcementChannel) return log('warn', "No announcement channel selected");
		
		Bot.sendMessage({
			to: announcementChannel,
			message: "`" + message + "`"
		});
		return log("Sent: " + message);
	}
	function qResponse(title, ID, requesterID, requester) {
		var m = "``\n" +
        	"Title         :  %TITLE%\n" +
        	(ID ? "ID            :  %ID%\n" : "") +
        	(requesterID ? "Requested By  :  %UNAME%\n" : "") +
        	"``";
		m = m.replace("%TITLE%", title)
			.replace("%ID%", ID)
			.replace("%UNAME%", requester + " " + '(' + requesterID + ')');
		
		notify(m);
	}
	/* --- Prototypes --- */
	function MusicItem(type, title, url, id, requesterID, requester, uID) {
		this.type = type;
		this.title = title;
		this.url = url;
		this.id = id;
		this.requesterID = requesterID;
		this.requester = requester;
		this.uID = uID;
	}
	function PlaylistItem(title, url) {
		this.title = title;
		this.url = url;
	}
}

module.exports = Player;