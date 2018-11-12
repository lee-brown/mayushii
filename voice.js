const fs = require('fs');
var tools = require('./tools.js');
require('./bot.js');

module.exports = {
    playlist: function(args, collectionName, userVoiceChannelId){
        var playlistID = args[0].split("list=")[1];
        playlistID = playlistID.substring(0, 34);
        if(Players[collectionName] == undefined){
            var test1asdf = new player;
            Players[collectionName] = test1asdf;
            this.start(collectionName);
            Players[collectionName].currentChannelID = userVoiceChannelId;
        }
        var exec = require('child_process').exec;
        var playlist = exec('youtube-dl -i --get-id --skip-download ' + args[0]);
        playlist.stdout.on('data', function(data) {
            var cleanData = tools.removeSpaces(data);
            var url = "https://www.youtube.com/watch?v=" + cleanData;
            Players[collectionName].audioStack.push(url);
        });
    },
    start: function(collectionName){
        if(Players[collectionName].playing == undefined){
            //Clean any force stops
            if (fs.existsSync("./audio/" + collectionName  + ".webm")) {//Remove file if it exists
                fs.unlinkSync("./audio/" + collectionName  + ".webm");
            }
            setInterval(function() {
                if(Players[collectionName].audioStack[0] !== undefined && !Players[collectionName].playing){ 
                    Players[collectionName].playing = true
                    var output = '"' + './audio/' + collectionName + '.%(ext)s'+ '"';
                    var exec = require('child_process').exec;
                    exec('youtube-dl -f 251 ' + " -o " + output + " " + Players[collectionName].audioStack[0]); //Download file
                    var playlist = exec('youtube-dl --get-duration ' + Players[collectionName].audioStack[0]); //Get duration so we know when to switch songs
                    if (fs.existsSync("./audio/" + collectionName  + ".webm")) {//Remove file if it exists
                        console.log("File found");
                        playlist.stdout.on('data', function(data) {
                            var seconds;
                            if(data.toString().includes(":")){
                                if(data.split(":").length == 2){
                                    console.log(data);
                                    seconds = data.split(":")[1];
                                    seconds += data.split(":")[0]*60; //Convert duration minutes:seconds into seconds
                                }
                            }
                            else{
                                seconds = data;
                            }
                            if(seconds > 1000){
                                console.log("Video too long");
                            }
                            else if (seconds < 1000){ //Play the song
                                console.log(seconds);
                                Players[collectionName].songLength = seconds;
                                Players[collectionName].audiofile = fs.createReadStream("./audio/" + collectionName + ".webm");
                                play(Players[collectionName], collectionName);
                                Players[collectionName].audioStack.shift();
                                setTimeout(function() { //When songLength seconds has elapsed set playing to false 
                                    console.log("Next song");
                                    Players[collectionName].audiofile.unpipe();
                                    Players[collectionName].audiofile.destroy();
                                    if (fs.existsSync("./audio/" + collectionName  + ".webm")) {//Remove file if it exists
                                        fs.unlinkSync("./audio/" + collectionName  + ".webm");
                                    }
                                    Players[collectionName].playing = false;
                                }, Players[collectionName].songLength*1000 + 500); //*1000 to convert from seconds and + 500ms to ensure enough time for song transition
                            }
                        });
                    }
                    else{
                        Players[collectionName].playing = false;
                    }
                   
                    
                }
            }, 100); //"tick rate" of the player (1second)
        }
    },
    stop: function(collectionName){
        console.log("calling stop");
        stop(Players[collectionName],collectionName);
    },
    skip: function(collectionName){
        console.log("calling skip");
        Players[collectionName].playing = false;
    }
}
skip = function(player){
    index = audioStack.length;
    newindex = index -1;
    bot.getAudioContext(player.currentChannelID, function(error, stream) {
        if (error){
            console.log(error);
        }
        player.audiofile.unpipe(stream, {end: false});
        player.playing = false;
        stream.stop();
    });
    bot.getAudioContext(player.currentChannelID, function(error, stream) {
        if (error){
            console.log(error);
        }
        player.audiofile.pipe(stream, {end: false});
        player.audiofile.on('close', function() {
            player.playing = false;
         });
    });
}
stop = function(player){
    bot.getAudioContext(player.currentChannelID, function(error, stream) {
        if (error){
            console.log(error);
        }
        player.audiofile.unpipe(stream, {end: false});
        player.playing = undefined;
        stream.stop();
        player.audioStack = undefined;
        player = undefined;
    });
    if (fs.existsSync("./audio/" + collectionName  + ".webm")) {//Remove file if it exists
        fs.unlinkSync("./audio/" + collectionName  + ".webm");
    }
}
play = function(player){
    bot.getAudioContext(player.currentChannelID, function(error, stream) {
        if (error){
            console.log(error);
        }
        player.audiofile.pipe(stream, {end: false});
        });
}
player = function() {
    this.songLength;
    this.audioStack = new Array();
    this.playing;
    this.audiofile;
    this.stream;
    this.currentChannelID;
    this.downloadstarted;
}