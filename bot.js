var schedule = require('node-schedule');
var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
const fs = require('fs');
var database = require('./db-access.js');
var neko = require('./nekobooru-api.js');
var reddit = require('./reddit-api.js');
var ObjectId = require('mongodb').ObjectID;
var wolfram = require('./wolfram-api.js');
var fun = require('./fun.js');
var help = require('./help.js');
var perms = require('./perms.js');
var serverData = require('./server-data.js');
var tools = require('./tools.js');
var gamble = require('./gambling.js')
var texts = require('./text.js');


// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
var collectionName; 
var url = "mongodb://localhost:27017/";
schedule.scheduleJob('*/1 * * * *', () => { 
    console.log("ooo");
    var query = { projection: { _id: 0, user: 1, username: 1, credits: 1} } 
        const found = database.find(collectionName, url, {}, query);
        found.then(function(result){
            for(i=0;i<result.length;i++){
                gamble.getCredits(collectionName, url, result[i].user).then(function(result2, err){
                    console.log(result2);
                    if(result[0].dailyactivity == true){
                        gamble.updateActivity(collectionName, url, result2[0].id,userID, result[i].credits ,false);
                        gamble.addCredits(collectionName, url, userID, 50);
                    }
                });
            }
        });
 }) 
bot.on('message', function (user, userID, channelID, message, evt) {
    if(collectionName == undefined){
        var serverID = bot.channels[channelID].guild_id;
        collectionName = serverID.toString(); //Each collection named after unique server ID (custom commands are tied to discord servers)
    }
    
    gamble.getCredits(collectionName, url, userID).then(function(result, err){
        gamble.updateActivity(collectionName, url, result[0].id, userID, result[0].credits ,true);
    });

    const prefix = serverData.getPrefix(collectionName, url); 
    prefix.then(function(prefix){//Get the prefix 
    const color = serverData.getColor(collectionName, url); 
    color.then(function(color){//Get the color 
    const image = serverData.getImage(collectionName, url); 
    image.then(function(image){//Get the image 
        sendMessage = function(message){
            bot.sendMessage({
                to: channelID,
                message: message
            });
        }
        sendTwoInOrder = function(message, message2){
            bot.sendMessage({
                to: channelID,
                message: message
            }, function(err, data2){
                bot.sendMessage({
                    to: channelID,
                    message: message2
                })
            });
        }
        sendEmbed = function(richembed){
            richembed.color = color;
            bot.sendMessage({
                to: channelID,
                embed: richembed
            });
        }
        sendVote = function(richembed){
            richembed.color = color;
            //attempt to send two reactions at once, one will inevitbily fail, read response for the time to wait (discord rate limiting), once the time is up it sends the reaction again
            //the wait time changes so it should not be hardcoded - more info here https://discordapp.com/developers/docs/topics/rate-limits#header-format
            bot.sendMessage({ 
                to: channelID,
                embed: richembed
            }, function(err, data){
                bot.addReaction({
                    channelID: channelID,
                    messageID: data.id,
                    reaction: "❎"},
                    function(err, data2){
                        bot.addReaction({
                            channelID: channelID,
                            messageID: data.id,
                            reaction: "☑"
                            },function(err, data2){
                                if(err){
                                    setTimeout(function(str1, str2) { 
                                        bot.addReaction({
                                            channelID: str1,
                                            messageID: str2,
                                            reaction: "☑",})
                                    }, err.response["retry_after"], channelID, data.id);
                                }
                            });
                    }
                );
            });
        }

        var defaultCommands = require('./default-commands.json'); //Insert default commands if they dont already exist
        for(i = 0; i < defaultCommands.cmds.length; i++){
            database.insertCMD(collectionName, url, defaultCommands.cmds[i]);
        } 
        if(user != undefined){
            database.insertUser(collectionName, url, {user: userID, username: user, credits: 1000, dailyactivity: false});//Insert user if not exists
        }

        //Get args and format message 
        var args = message.split(' ');
        var command = args[0].split(prefix)[1];
        var argsString = message.substring(prefix.length).split(command + " ")[1]; //Full message string without the command

        c = function(arg){ //Format commands with current prefix
            var formatted = "``" + prefix + arg + "`` "
            return formatted;
        }
        //Commands that can't be affected by a new prefix
        if(args[0] === '!setprefix' && args[1] !== undefined){//Prefix for !setprefix doesnt change
            serverData.setPrefix(args);
        }
        else if(args[0] === '!startover' && perms.permissions(userID, ['admin'])){
            database.startover(collectionName, url);
        }
        else if(args[0] === '!prefix'){//Get the current prefix
            const prefix = serverData.getPrefix(collectionName, url);
            prefix.then(function(prefix){
                sendMessage("The current prefix is " + "``" + prefix + "``");
            })
        }
        else if (args[0] === (prefix + command)) { //If message contains prefix
            args.shift(); //Remove cmd from args array
            function addUserId(originaltext, target){ //Replaces @user and @target with actual target and user tags
                newtext = originaltext.replace("@user", "<@!" + userID + ">");
                if(args[0] !== undefined){
                    newtext = newtext.replace("@target", target);
                }
                else {
                    if(newtext.includes("@target")){
                        newtext = "";
                    }
                }
                return newtext;
            } 
            if(command === 'help')
            {   
                help.generalHelp(collectionName, url, image);
            }    
            else if(command === 'setimage' && args[0] !== undefined){//Prefix for !setprefix doesnt change
                serverData.setImage(args);
            }
            else if(command === 'setcolor' && args[0] !== undefined){//Prefix for !setprefix doesnt change
                serverData.setImage(args);
            }
            else if(command === "zarathesadist"){
                var ztsCommands = require('./zts-commands.json');
                for(i = 0; i < ztsCommands.cmds.length; i++){
                    database.insertCMD(collectionName, url,ztsCommands.cmds[i]);
                }
            }
            else if(command === "rimg" && args[0] !== undefined){
                var got = reddit.getHot(args[0]);
                got.then(function(posts){
                    reddit.printImg(posts);
                })
            }
            else if(command === "rpost" && args[0] !== undefined){
                var got = reddit.getHot(args[0]);
                got.then(function(posts){
                    reddit.printPost(posts);
                })
            }
            else if(command === "vote" && args[0] !== undefined){
                fun.vote(userID, bot.users[userID].avatar, bot.users[userID].username, argsString);
            }
            else if(command === "help-customcmd"){
                help.customCmdsHelp(image);
            }
            else if(command === "help-reddit"){
                help.redditHelp(image);
            }
            else if(command === "help-nekobooru"){
                help.nekoHelp(image);
            }
            else if(command === 'rps'){
                fun.rps();
            }
            else if(command === 'say'){
                fun.say(argsString, args, userID);
            }
            else if(command === 'add-admin' && perms.permissions(userID, ['admin']) && args[0] !== undefined){
                perms.addAdmin(args[0]);
            }
            else if(command === 'add-poweruser' && perms.permissions(userID, ['admin', 'power user']) && args[0] !== undefined){
                perms.addPowerUser(args[0]);
            }
            else if(command === 'bigsay' && args[0] !== undefined){
                fun.bigsay(argsString);
            }
            else if (command === 'flip'){
                fun.flip();
            }
            else if(command === 'rate'){
                fun.rate();
            }
            else if(command === 'newcmd'){
                serverData.newCmd(collectionName, url, message.substring(1));
            }
            else if(command === 'newcmdr'){ //<cmd> | <subreddits> | text post / image post
                serverData.newCmdr(collectionName, url, message.substring(1));
            }
            else if (command === 'ls-allcmds'){ 
                const defaultCmds = database.getCmds(collectionName, url,"all"); 
                defaultCmds.then(function(finalmessage){
                    sendMessage(finalmessage);
                });
            }
            else if (command === 'ls-defaultcmds'){
                const defaultCmds = database.getCmds(collectionName, url,"default"); 
                defaultCmds.then(function(finalmessage){
                    sendMessage(finalmessage)
                });
            }
            else if (command === 'ls-customcmds'){
                const customCmds = database.getCmds(collectionName, url,"custom"); 
                customCmds.then(function(finalmessage){
                    sendMessage(finalmessage);
                });
            }
            else if(command === 'upload'){
                neko.uploadImg(args)
            }
            else if (command === 'eval'){
                wolfram.getEmbed(argsString);
            }
            else if (command === 'suggest'){
                var stringtoadd = "\nSuggestions of user: " + user + " - " + userID + "\n";
                stringtoadd = stringtoadd + argsString;
                fs.appendFile('suggestions.txt', stringtoadd , function (err) {
                if (err){
                    logger.error(err);
                    throw err;
                } 
                });
                sendMessage("Tuturuu~ Thank you for your suggestion");
            }
            else if (command === 'newtag' && perms.permissions(userID, ['power user', 'admin'])){
                neko.newTag(args);
            }
            else if ((command === "updatecmd-text" || command === "updatecmd-tag"| command === "updatecmd-subr") && argsString.includes("|") && args[0] !== undefined){ //<id> | <tags>
                serverData.updateCmd(command, argsString);
            }
            else if ((command === "add-tag" || command === "add-text") && argsString.includes("|") && args[0] !== undefined){ // <id> | <item-to-add> 
                serverData.addCmd(command, argsString);
            }
            else if ((command === "del-tag" || command === "del-text") && args[0] !== undefined && args[1] !== undefined){ // <id> <tag/texts-index> 
                serverData.delTag(command, args);
            }
            else if (command === "cmd-details" && args[0] !== undefined){ //<cmd-id>
                serverData.cmdDetails(args);
            }
            else if (command === "deletecmd"){ //<cmd-id>
                database.delete(collectionName, url, { _id: ObjectId(tools.removeSpaces(args[0])) });
                sendMessage("cmd deleted with cmd id " + args[0]);
            }
            else if(command === "lscmdname" && args[0] !== undefined){ //list cmds with the name <cmd-name>
                serverData.lsCmdName(collectionName, url,args);
            }
            else if(command === "tag"){
                neko.getRandomImg(args[0]);
            }
            else if (command === 'newtagcategory' && (powerUser(userID) || adminUser(userID))){
                neko.newCategory(args);
            }
            else if (command === 'credits'){
                gamble.printCredits(collectionName, url, userID);
            }
            else if (command === 'gambleflip'){
                gamble.coinFlip(collectionName, url, userID, args[0], args[1]);
            }
            else if(command === 'slots'){
                gamble.slots(collectionName, url, userID);
            }
            else if (command === 'addcredits' && perms.permissions(userID, ['admin'])){
                gamble.addCredits(collectionName, url, args);
            }
            else if(command === 'fancy'){
                texts.handwriting(argsString);
            }
            else if(command === 'spaced'){
                texts.spaced(argsString);
            }
            else if(command === 'metal'){
                texts.metal(argsString);
            }
            else if(command === 'smallcaps'){
                texts.super(argsString);
            }
            else if(command === 'upsidedown'){
                texts.upsidedown(argsString);
            }
            else if(command === 'bubble'){
                texts.bubble(argsString);
            }
            else if(command === 'help-gamble'){
                help.gambleHelp(image);
            }
            else if(command === 'help-text'){
                help.textHelp(image);
            }
            else if(command === 'richlist'){
                gamble.printRichList(collectionName, url);
            }
            else if(command === 'gamblestartoover' && perms.permissions(userID, ['admin'])){
                gamble.startOver(collectionName, url, userID);
            }
            else if(command === 'gift' && perms.permissions(userID, ['admin'])){
                gamble.gift(collectionName, url, userID, args);
            }
            else {
                try{
                    var query = { cmd: tools.removeSpaces(command) };
                    const found = database.find(collectionName, url,query);
                    found.then(function(result){
                        var number;
                        if(result.length === 1){
                            number = 0;
                        }
                        else if(result.length > 1){ //Case where there are multiple commands with the same name
                            var random = Math.floor((Math.random() * result.length));
                            number = random; //Generate random number here
                        }
                        if(result[number] !== undefined){
                            resultCmd = result[number].cmd; //(string) Custom command e.g !test
                            resultTags = result[number].tags; //(array) Tags which the custom command queries nekobooru with
                            resultText = result[number].texts; //(array) Text(s) (if multiple, choose one randomly) text to print out along side reaction image
                            resultSubr = result[number].subreddit;
                            resultType = result[number].type;
                            var tagsExists = false; //Check if there are missing values
                            var textExists = false;
                            var subrExists = false; //subreddit
                            var typeExists = false; //subreddit
                            var resultTextString;
                            var resultTagsString = "";
                            if(resultTags !== null && resultTags !== undefined){
                                tagsExists = true;
                                for(i = 0; i < resultTags.length; i++){
                                    resultTagsString = resultTagsString + resultTags[i];
                                    if(i !== resultTags.length - 1){
                                        resultTagsString = resultTagsString + ",";
                                    }
                                }
                            }
                            if(resultText !== null && resultText !== undefined){
                                textExists = true;
                                var random = Math.floor((Math.random() * resultText.length));
                                var resultTextString = resultText[random];
                            }
                            if(resultSubr !== null && resultSubr !== undefined){
                                subrExists = true;
                            }
                            if(resultType !== null && resultType !== undefined){
                                typeExists = true;
                            }
                            if(tagsExists && textExists){
                                resultTextString = addUserId(resultTextString, args[0]); //replace @target and @user
                                sendMessage(resultTextString);
                                neko.getRandomImg(resultTagsString);
                            }
                            else if(!tagsExists && textExists){
                                resultTextString = addUserId(resultTextString, args[0]);//replace @target and @user
                                sendMessage(resultTextString);
                            }
                            else if(tagsExists && !textExists){
                                neko.getRandomImg(resultTagsString);
                            }
                            else{
                                if(subrExists && typeExists){
                                    if(tools.removeSpaces(resultType) === "img"){
                                        var got = reddit.getHot(resultSubr);
                                        got.then(function(posts){
                                            reddit.printImg(posts);
                                        })
                                    }
                                    else if(resultType = "post"){
                                        
                                        var got = reddit.getHot(resultSubr);
                                        got.then(function(posts){
                                            reddit.printPost(posts);
                                        })
                                    }
                                }
                                else if (subrExists){
                                    var got = reddit.getHot(resultSubr);
                                    got.then(function(posts){
                                        reddit.printPost(posts);
                                    })
                                }
                                else{
                                    neko.getRandomImg(resultCmd);
                                }
                                
                            }
                        }
                        else{
                            sendMessage("Command not found or formatted incorrectly, check !help");
                        }
                    });
                }
                catch(err){
                    logger.err("Error with catch all")
                }
            }
        }
    });
    });
    });
});

