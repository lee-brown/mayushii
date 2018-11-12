const fs = require('fs');
const tools = require('./tools.js');
require('./bot.js');

module.exports = {
    playlist: function(args, collectionName, userVoiceChannelId){
        var playlistID = args[0].split("list=")[1];
        playlistID = playlistID.substring(0, 34);
        if(Players[collectionName] == undefined){
            var playerObj = new player;
            Players[collectionName] = playerObj;
            Players[collectionName].currentChannelID = userVoiceChannelId;
        }
        var exec = require('child_process').exec;  
        //Fetch info about video
        console.log("Fetching data");
        var videoInfo = exec('youtube-dl -i --get-id --get-duration --skip-download ' + "https://www.youtube.com/playlist?list=" + playlistID); 
        videoInfo.stdout.on('data', function(data) {
            var id;
            var duration;
            if(data.includes("\n")){
                data1 = data.split("\n")[0].toString().replace(/\s\n/g, '');
                data2 = data.split("\n")[1].toString().replace(/\s\n/g, '');
                if(data2 == ""){ //It contains one piece of data
                    if(data1.length == 11) {
                        id = data1;
                    }
                    else{
                        duration = YTTimeToSeconds(data1);
                    }
                }
                else{//It contains both pieces of data
                    //Identify which piece of data is ID and which is the duration
                    if(data1.length == 11){
                        duration = YTTimeToSeconds(data2);
                        id = data1;
                    }
                    else if(data2.length == 11)
                    {
                        duration = YTTimeToSeconds(data1);
                        id = data2;
                    }
                }
                url = "https://www.youtube.com/watch?v=" + id;
                if(parseInt(duration) !== NaN && parseInt(duration) !== undefined && duration !== undefined && duration !== NaN){
                    Players[collectionName].songLength.push(duration);
                }
                if(id != undefined){
                    Players[collectionName].audioStack.push(url);
                }
            }
            else{
                console.log("unexpected response: " + data);
            }
            start(collectionName, Players[collectionName]);
        });
    },
    stop: function(collectionName){
        console.log("calling stop");
        stop(Players[collectionName],collectionName);
    },
    skip: function(collectionName){
        console.log("calling skip");
        skip(Players[collectionName]);
        resume(Players[collectionName]);
        Players[collectionName].playing = false;
    }
}
YTTimeToSeconds = function(data1){//Convert duration hours:minutes:seconds into seconds
    var duration = data1;
    if(duration.includes(":")){//under and hour more than a minute
        if(duration.split(":").length == 2){
            duration = parseInt(data1.split(":")[1]); //seconds
            duration += parseInt(data1.split(":")[0])*60; //minutes converted to seconds
        }
        else if(duration.split(":").length == 3){//over an hour
            duration = parseInt(data1.split(":")[1]); //seconds
            duration += parseInt(data1.split(":")[0])*60; //minutes converted to seconds
            duration += parseInt(data1.split(":")[0])*60*60; //hours converted to seconds
        }
    }
    else{//less than minute
        duration = parseInt(data1);
    }
    console.log("returning data: " + duration);
    return duration;
}
resume = function(player){
    bot.getAudioContext(player.currentChannelID, function(error, stream) {
        stream.resume();  
    });
}
skip = function(player){
    bot.getAudioContext(player.currentChannelID, function(error, stream) {
        stream.stop();  
    });
}
start = function(collectionName, player){
    if(player.playing == undefined){
        //Clean any force stops
        if (fs.existsSync("./audio/" + collectionName  + ".webm")) {//Remove file if it exists
            fs.unlinkSync("./audio/" + collectionName  + ".webm");
        }
        setInterval(function() {
            //console.log(player);
            if(player.audioStack[0] !== undefined && player.songLength[0] !== undefined && !player.playing){ 
                player.playing = true;
                var output = '"' + './audio/' + collectionName + '.%(ext)s'+ '"';
                var exec = require('child_process').exec;
                exec('youtube-dl -f 251 ' + " -o " + output + " " + player.audioStack[0]); //Download file
                if (fs.existsSync("./audio/" + collectionName  + ".webm")) {//Remove file if it exists
                    console.log("Playing "  + player.audioStack[0]);
                    console.log("Length "  + player.songLength[0]);
                    if(player.songLength[0] > 1000){
                        console.log("Video too long");
                    }
                    else if (player.songLength[0] < 1000){ //Play the song
                        player.audiofile = fs.createReadStream("./audio/" + collectionName + ".webm");
                        console.log("Calling play");
                        play(player);
                        player.audioStack.shift();
                        player.songLength.shift();
                        console.log(player.currentChannelID);
                        playnext(player, collectionName);
                    }
                }
                else{
                    player.playing = false;
                }
            }
        }, 1000); //"tick rate" of the player (1second)
        
    }
}
playnext = function(player, collectionName){
    bot.getAudioContext(player.currentChannelID, function(error, stream) {
        stream.on('done', function () {
            console.log("Finished song");
            player.playing = false;
            if (fs.existsSync("./audio/" + collectionName  + ".webm")) {//Remove file if it exists
                fs.unlinkSync("./audio/" + collectionName  + ".webm");
            }
        });        
    });
}
stop = function(player){
    console.log(player.currentChannelID);
    bot.getAudioContext(player.currentChannelID, function(error, stream) {
        if (error){
            console.log(error);
        }
        player.audiofile.unpipe(stream, {end: false});
        player.playing = undefined;
        stream.stop();
        player.audioStack = new Array;
    });
    if (fs.existsSync("./audio/" + collectionName  + ".webm")) {//Remove file if it exists
        fs.unlinkSync("./audio/" + collectionName  + ".webm");
    }
}
play = function(player){
    console.log("Attempting file");
    bot.getAudioContext(player.currentChannelID, function(error, stream) {
        console.log("Playing file");
        if (error){
            console.log(error);
        }
        player.audiofile.pipe(stream, {end: false});
    });
}
player = function() {
    this.songLength = new Array(); //audioStacks corrosponding song length
    this.audioStack = new Array();
    this.playing;
    this.audiofile;
    this.stream;
    this.currentChannelID;
    this.downloadstarted;
}