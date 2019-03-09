var schedule = require('node-schedule')
    , Discord = require('discord.io')
    , logger = require('winston')
    , database = require('./db/db-access.js')
    , neko = require('./api/nekobooru-api.js')
    , reddit = require('./api/reddit-api.js')
    , wolfram = require('./api/wolfram-api.js')
    , fun = require('./commands/fun.js')
    , help = require('./commands/help.js')
    , perms = require('./commands/perms.js')
    , serverData = require('./commands/server-data.js') 
    , tools = require('./tools/tools.js')
    , gamble = require('./commands/gambling.js') //Economy/gambling functions
    , texts = require('./commands/text.js') //Fancy text functions
    , packs = require('./commands/packs.js')
    , tester = require('./tester');

for (i = 0; i < tester.test.length; i++) {
    tester.test[i]();
}


// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
bot = new Discord.Client({
   token: process.env.DISCORD_AUTH,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

//Contains music players for each server
Players = new Object;

//Mongo variables
var collectionName 
    , url = "mongodb://localhost:27017/"

var tags = {};

var counter = 0;
var counter2 = 0;
if(collectionName === undefined){
    database.getCollections(url).then(function (collections) {

        var collectionNames = [];
        for(i = 0; i < collections.length; i++){
            collectionNames.push(collections[0].name);
        }

        for(i = 0; i < collectionNames.length; i++){
            const cmdsList = database.getAllCmds(collectionNames[i], url);
            cmdsList.then(function(result){
                for(z = 0; z < result.length; z++){
                    var nekoImages = neko.getRandomImgAll(result[z].tags); 
                    nekoImages.then(function (nekoData) { //nekoData[0] = cmdName, nekoData[1] = tags[]
                        if (nekoData[0] !== undefined){
                            tags[nekoData[0]] = [];
                            for (j = 0; j < nekoData[1].length; j++){
                                if (nekoData[1][j] !== undefined){
                                    tags[nekoData[0]].push(nekoData[1][j].contentUrl);
                                }
                            }
                            tags[nekoData[0]] = tools.shuffle(tags[nekoData[0]]);
                            counter2++;
                        }
                        counter++;
                        if(counter == result.length){
                            logger.info(counter2 + " Nekobooru reaction commands successfully cached");
                        }
                    })
                }
            });
        }
    });
}

var activeServers = [];

bot.on('message', function (user, userID, channelID, message, evt) {
    bot.setPresence({
        idle_since: null,
        game: {name: "!help", type: 0, url: null},
    });
    
    var serverID = bot.channels[channelID].guild_id;
    if(serverID.toString() !== collectionName){
        collectionName = serverID.toString(); //Each collection named after unique server ID (custom commands are tied to discord servers)
        if(!activeServers.includes(collectionName)){
            logger.info("New server active: " + collectionName);
            //Schedule daily rewards for active users
            schedule.scheduleJob('0 5 * * *', () => { 
                gamble.getAllUsers(collectionName, url).then(function(result){
                    for(i=0;i<result.length;i++){
                        if(result[i].dailyactivity == 1){
                            logger.info(result[i]._id + " was active");
                            gamble.updateActivity(collectionName, url, result[i]._id , 0);
                            gamble.addCreditsDirect(collectionName, url, result[i]._id, 50);
                            gamble.updateTotalActivity(collectionName, url, result[0]._id, (result[0].daysofactivity + 1));
                        }
                        else{
                            logger.info(result[i]._id + " was not active");
                        }
                    }
                });
            }) 
            activeServers.push(collectionName);
        }
    }
    

    //Tag daily active users as active
    gamble.getUser(collectionName, url, userID).then(function(result, err){
        if(result[0] !== undefined){
            gamble.updateActivity(collectionName, url, result[0]._id ,1);
            gamble.updateMessages(collectionName, url, result[0]._id, (result[0].numberofmessages + 1));
        }
    });

    
    serverData.getMetaDataServer(collectionName, url).then(function (metadata) {//Get server metadata 
        sendMessage = function(message){
            bot.sendMessage({
                to: channelID,
                message: message
            });
        }
        sendTwoInOrder = function(message, message2){ //Sends two messages in order
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
            richembed.color = metadata.color;
            bot.sendMessage({
                to: channelID,
                embed: richembed
            });
        }
        sendVote = function(richembed){
            richembed.color = color;
            //attempt to send two reactions at once, one will inevitbily fail, 
            //read response for the time to wait (discord rate limiting), once 
            //the time is up it sends the reaction again the wait time changes 
            //so it should not be hardcoded - more info here:
            // https://discordapp.com/developers/docs/topics/rate-limits#header-format
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

        //Insert default commands if they dont already exist
        var defaultCommands = require('./json-commands/default-commands.json'); 
        for(i = 0; i < defaultCommands.cmds.length; i++){
            database.insertCMD(collectionName, url, defaultCommands.cmds[i]);
        } 

        //Insert user if not exists
        if(user !== undefined && userID !== undefined){
            database.insertUser(collectionName, url, {dailyactivity: 0, daysofactivity: 0, numberofmessages: 0, user: userID, username: user, credits: 1000});
        }
        else{
            logger.error("user or userID undefined, try restarting the bot to fix this functionality");
        }

        //Get args and format message 
        var args = message.split(' ');
        var command = args[0].split(metadata.cmdprefix)[1];
        var argsString = message.substring(metadata.cmdprefix.length).split(command + " ")[1]; //Full message string without the command

        c = function(arg){ //Format commands with current prefix
            return "``" + metadata.cmdprefix + arg + "`` "
        }

        //Special commands that can't be affected by a new prefix (Because they help with recovering the bot in the event of a misconfiguration)
        if(args[0] === '!setprefix' && args[1] !== undefined){//Prefix for !setprefix doesnt change
            serverData.setMetaData(collectionName, url, args[1], "cmdprefix");
        }
        else if (args[0] === '!startover' && perms.permissions(userID, ['admin'])) {
            database.startover(collectionName, url);
        }
        else if(args[0] === '!prefix'){//Get the current prefix
            sendMessage("The current prefix is " + "``" + metadata.cmdprefix + "``");
        }

        //Normal commands
        else if (args[0] === (metadata.cmdprefix + command)) { //If message contains prefix
            args.shift(); //Remove cmd from args array
            
            //Customization commands
            if (command === 'setimage' && args[0] !== undefined) {
                serverData.setMetaData(collectionName, url, args[0], "image");
            }
            else if(command === 'setcolor' && args[0] !== undefined){
                serverData.setMetaData(collectionName, url, args[0], "color");
            }

            //Command packs
            else if (command === "packs"){
                packs.lspacks();
            }
            else if (command === "delpack"){
                packs.delpack(collectionName, url, args[0]);
            }
            else if(command === "pack"){
                packs.packinfo(args[0]);
            }
            else if(command === "addpack"){
                packs.addpack(collectionName, url, args[0]);
            }

            //Reddit Commands
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
            
            //Help commands
            else if(command === "help-customcmd"){
                help.customCmdsHelp(image);
            }
            else if(command === "help-reddit"){
                help.redditHelp(image);
            }
            else if(command === "help-nekobooru"){
                help.nekoHelp(image);
            }
            else if(command === 'help'){   
                help.generalHelp(collectionName, url, metadata.image);
            }   

            //Fun/useful commands
            else if(command === 'rps'){
                fun.rps();
            }
            else if(command === 'say'){
                fun.say(argsString, args, userID);
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
            else if(command === "vote" && args[0] !== undefined){
                fun.vote(userID, bot.users[userID].avatar, bot.users[userID].username, argsString);
            }

            //Permissions
            else if(command === 'add-admin' && perms.permissions(userID, ['admin']) && args[0] !== undefined){
                perms.addAdmin(args[0]);
            }
            else if(command === 'add-poweruser' && perms.permissions(userID, ['admin', 'power user']) && args[0] !== undefined){
                perms.addPowerUser(args[0]);
            }

            //Custom cmds
            else if(command === 'newcmd'){
                serverData.newCmd(collectionName, url, argsString);
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
            
            //Maths
            else if (command === 'eval'){
                wolfram.getEmbed(argsString);
            }

            //Nekobooru commands
            else if (command === 'newtag' && perms.permissions(userID, ['power user', 'admin'])){
                neko.newTag(args);
            }
            else if(command === 'upload'){
                neko.uploadImg(args);
            }
            else if (command === "updatecmd" && argsString.includes("|") && args[0] !== undefined){ //<id> | <tags>
                serverData.updateCmd(command, argsString);
            }
            else if (command === "cmd-details" && args[0] !== undefined){ //<cmd-id>
                serverData.cmdDetails(args);
            }
            else if (command === "deletecmd"){ //<cmd-id>
                serverData.deleteByID(args[0]);
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
            

            //Fancy Text
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

            //Economy/gambling
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

            //Catch all (Custom cmds)
            else {
                database.find(collectionName, url, { cmd: command.trim() }).then(function(result){
                    var number = Math.floor((Math.random() * result.length));
                    if(result[number] !== undefined){
                        var item = result[number];
                        //Get tags
                        resultTagsString = tools.commaDelimitedTags(item.tags);

                        //Handles nekobooru api requests
                        if(item.cmdsource === "neko"){

                            //Handles text
                            if(args[0] !== undefined && item.texts !== undefined){
                                sendMessage(tools.addUserId(item.texts, args[0], userID));
                            }

                            //Handles the image (Rich Embed)
                            if(tags[resultTagsString] !== undefined){ //If cache is available use it, otherwise get image directly from the api
                                neko.richEmbed(tags[resultTagsString][0]);
                                tags[resultTagsString].shift();

                                neko.getRandomContentUrl(resultTagsString)
                                .then(function(response){ //Remove used item and add new random item
                                    tags[resultTagsString].push(response);
                                })
                            }
                            else{
                                neko.getRandomImg(resultTagsString);
                            }
                        }

                        //Handles reddit api requests
                        else if (item.cmdsource === "reddit"){
                            if(item.type === "img"){
                                reddit.getHot(item.subreddit).then(function(posts){
                                    reddit.printImg(posts);
                                })
                            }
                            else if(item.type = "post"){
                                reddit.getHot(item.subreddit).then(function(posts){
                                    reddit.printPost(posts);
                                })
                            }
                            else{
                                logger.error("Unexpected item.type: " + item.type);
                            }
                        }

                        //Handles simple text requests
                        else if(item.cmdsource = "text"){
                            sendMessage(item.texts[0]);
                        }

                        //Error
                        else {
                            logger.error("Unexpected cmdsource: " + item);
                        }
                    }
                    else{
                        sendMessage("Command not found or formatted incorrectly, check !help");
                    }
                });
            }
        }
    });
});

