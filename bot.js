//The bot only works with mongodb and only works with the szurubooru api and reddit, (websites like nekobooru.xyz)

//Dependencies 
var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var defaultCommands = require('./default-commands.json');
var authnekobooru = require('./auth-nekobooru.json');
const axios = require('axios');
var Promise = require("bluebird");
const fs = require('fs');
var mongo = require('mongodb');
var authwolframalpha = require('./auth-wolframalpha.json');
var randomNumber = require("random-number-csprng");
var ObjectId = require('mongodb').ObjectID;
require('dotenv').config();
const Snoowrap = require('snoowrap');
const r = new Snoowrap({
    userAgent: 'reddit-bot',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});
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
bot.on('message', function (user, userID, channelID, message, evt) {
    var MongoClient = mongo.MongoClient;
    var url = "mongodb://localhost:27017/";
    var nekobooruToken = "Token " + authnekobooru.token;
    var serverID = bot.channels[channelID].guild_id;
    var collectionName = serverID.toString(); //Each collection named after unique server ID (custom commands are tied to discord servers)
    
    //Create initial database if database for serverID doesn't already exist
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mayushii");
        dbo.createCollection(collectionName, function(err, res) {
            if (err) throw err;
            db.close();
        });
    });

    function permissions(user, rank){ //returns true if user has correct permissions
        var permission = false;
        for(i = 0; i < rank.length; i++){ //Check all ranks that have permission to do the action
            var dataFromFile = fs.readFileSync(rank[i] + '.txt');
            var data = dataFromFile.toString();
            var items = data.split('\n');
            for(j = 0; j < items.length; j++){
                permission = true;
            }
        }
        if(permission){
            return true;
        }
        else{
            bot.sendMessage({
                to: channelID,
                message: "Sorry, you do not have permission to do that, contact an admin"
            });
            return false;
        }
    }
    function removeSpaces(item){ //Finds and removes spaces from a string
        try{
            item = item.replace(/\s/g, ''); 
            return item;
        }
        catch{
            logger.error("Cannot remove spaces because arg is undefined");
        }
    }
    function insert(query){ //Inserts one item
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mayushii");
            dbo.collection(collectionName).insertOne(query, function(err, res) {
              if (err) throw err;
              db.close();
            });
        }); 
    }
    function update(query, newvalues){//Updates one item with certain _id (query = _id object)
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mayushii");
            dbo.collection(collectionName).updateOne(query, newvalues, function(err, res) {
                if (err) throw err;
                db.close();
            });
        }); 
    }
    function find(query, query2){ //Finds stuff based on _id (query = _id object)
        return new Promise(function(res, rej) {
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db("mayushii");
                dbo.collection(collectionName).find(query, query2).toArray(function(err, result) {
                    if (err) throw err;
                    db.close();
                    var formattedResult = new Array();
                    for(i=0;i<result.length;i++){//ignore undefined results
                        var ok = Object.keys(result[i]);
                        if(ok.length !== 0){
                            formattedResult.push(result[i]);
                        }
                    }
                    res(formattedResult);
                });
            })
        }).catch({code: "An error occured: find()"}, function(err) {
            console.log(err);
        });
    }
    //Function that will only insert if the cmd can't be found in the database 
    function insertIfNotExist(query, toInsert){
        return new Promise(function(res, rej) {
            const found = find(query);
            found.then(function(result){
                if(result.length === 0){
                    res(1);
                }
                else{
                    res(0);
                }
            });
        }).then(function(notexists) {
            if(notexists === 1){
                insert(toInsert);
            }
        }).catch({code: "An error occured"}, function(err) {
            console.log(err);
        });
    }
    //Format object for single cmd and insert if not exist (used for seeder files)
    function insertCMD(singlecommand){
        var tagsArray = undefined;
        var textArray = undefined;
        var subreddits = undefined;
        var type = undefined;
        if(singlecommand.tags !== undefined){
            tagsArray = removeSpaces(singlecommand.tags.toString()).split('&'); //Allows for multiple texts or tags to be put in at once
        }
        if(singlecommand.texts !== undefined){
            textArray = singlecommand.texts.toString().split('&'); //Allows for multiple texts or tags to be put in at once
        }
        if(singlecommand.subreddit !== undefined){
            subreddits = singlecommand.subreddit.toString(); //Allows for multiple texts or tags to be put in at once
        }
        if(singlecommand.type !== undefined){
            type = singlecommand.type.toString(); //Allows for multiple texts or tags to be put in at once
        }
        var query = { cmd: singlecommand.cmd};
        var toInsert = { cmd: singlecommand.cmd, tags: tagsArray, texts: textArray, subreddit: subreddits, type: type };
        insertIfNotExist(query, toInsert); 
    }
    function genRandomNumber(min, max){
        return new Promise(function(res, err){
            if(min === max){
                res(min);
            }
            else if(min > max){
                res(0);
            }
            else{
                res(randomNumber(min, max));
            }
        })
    }
    
    function getPrefix(){
        return new Promise(function(res, rej) {
            var query = { projection: { _id: 0, cmdprefix: 1} }
            const found = find({}, query);
            found.then(function(result){
                if(result.length === 0 || result[0].cmdprefix === undefined){
                    res("!");
                }
                else{
                    res(result[0].cmdprefix);
                }
            });
        }).catch({code: "An error occured: getPrefix()"}, function(err) {
            console.log(err);
        });
    }
    function getColor(){
        return new Promise(function(res, rej) {
            var query = { projection: { _id: 0, color: 1} }
            const found = find({}, query);
            found.then(function(result){
                if(result.length === 0 || result[0].color === undefined){
                    res("15277667");//default color
                }
                else{
                    res(result[0].color);
                }
            });
        }).catch({code: "An error occured: getColor()"}, function(err) {
            console.log(err);
        });
    }
    function getImage(){
        return new Promise(function(res, rej) {
            var query = { projection: { _id: 0, image: 1} }
            const found = find({}, query);
            found.then(function(result){
                if(result.length === 0 || result[0].image === undefined){
                    res("https://nekobooru.xyz/data/posts/18_9f7a09bdc35dfd01.png");
                }
                else{
                    res(result[0].image);
                }
            });
        }).catch({code: "An error occured: getPrefix()"}, function(err) {
            console.log(err);
        });
    }
    const prefix = getPrefix(); 
    prefix.then(function(prefix){//Get the prefix 
    const color = getColor(); 
    color.then(function(color){//Get the color 
    const image = getImage(); 
    image.then(function(image){//Get the image 
        //Insert default commands if they dont already exist
        for(i = 0; i < defaultCommands.cmds.length; i++){
            insertCMD(defaultCommands.cmds[i]);
        }
        //Get args and format message 
        var args = message.split(' ');
        var command = args[0].split(prefix)[1];
        var argsString = message.substring(prefix.length).split(command + " ")[1]; //Full message string without the command
        
        function printRedditImg(posts){
            var images = new Array();
            var titles = new Array();
            var selftext = new Array();
            for(i = 0; i < posts.length; i++){ //Filter out any posts without an image
                if(posts[i].url.match(/\.(gif|jpg|jpeg|tiff|png)$/i)){
                    images.push(posts[i].url);
                    titles.push(posts[i].title);
                    selftext.push(posts[i].selftext);
                }
            }
            var randomNo = genRandomNumber(0, titles.length - 1);
            randomNo.then(function(number){
                var text = "reddit.com/r/" + posts[number].subreddit;
                text = text.toLowerCase();
                var richembed = {
                    'color': color,
                    'footer': {
                        'icon_url': "https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png",
                        'text': text
                    },
                    "title": titles[number],
                    "description": selftext[number],
                    'image': {
                        'url': images[number]
                    },
                };
                bot.sendMessage({
                    to: channelID,
                    embed: richembed
                });
            })
        }
        function printRedditPost(posts){
            var randomNo = genRandomNumber(0, posts.length - 1);
            randomNo.then(function(number){
                var text = "reddit.com/r/" + posts[number].subreddit;
                text = text.toLowerCase();
                var richembed = {
                    'color': color,
                    'footer': {
                        'icon_url': "https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png",
                        'text': text
                    },
                    "title": posts[number].title,
                    "description": posts[number].selftext
                };
                bot.sendMessage({
                    to: channelID,
                    embed: richembed
                });
            })
        }
        function c(arg){ //Format commands with current prefix
            var formatted = "``" + prefix + arg + "`` "
            return formatted;
        }
        function getCmds(typeOfCmd){ //Returns cmd names (typeOfCmd is a string either "custom" or "default" or "all")
            return new Promise(function(res, rej) {
                MongoClient.connect(url, function(err, db) {
                    if (err) throw err;
                    var dbo = db.db("mayushii");
                        dbo.collection(collectionName).find({}, { projection: { _id: 0, cmd: 1} }).toArray(function(err, result) {
                            if (err) throw err;
                            var finalmessage = "";
                            for(i = 0; i<result.length; i++){   
                                var insert;
                                if(typeOfCmd == "custom"){
                                    insert = true;
                                }
                                if(typeOfCmd == "default"){
                                    insert = false;
                                }
                                if(typeOfCmd == "all"){
                                    insert = true;
                                }
                                for(j = 0; j<defaultCommands.cmds.length; j++){
                                    if(result[i].cmd === defaultCommands.cmds[j].cmd){ //If it's a default cmd
                                        if(typeOfCmd == "default"){
                                            insert = true;
                                        }
                                        if(typeOfCmd == "custom"){
                                            insert = false;
                                        }
                                    }
                                }
                                if(insert){
                                    if(result[i].cmd !== undefined){//Only happens with customcmds
                                        finalmessage = finalmessage + c(result[i].cmd);
                                    }
                                }
                            }
                            db.close();
                            res(finalmessage);
                        });
                    }); 
            }).catch({code: "An error occured: getCmds()"}, function(err) {
                console.log(err);
            });
        }

        //Commands that can't be affected by a new prefix
        if(args[0] === '!setprefix' && args[1] !== undefined){//Prefix for !setprefix doesnt change
            args[1] = removeSpaces(args[1]);
            var query = { projection: { _id: 1, cmdprefix: 1} }
            const found = find({}, query);
            found.then(function(result){
                var formattedResult = new Array();
                for(i=0;i<result.length;i++){
                    if(result[i].cmdprefix !== undefined){
                        formattedResult.push(result[i]);
                    }
                }
                if(formattedResult.length === 0){
                    var query = { cmdprefix: args[1]};
                    insert(query);
                }
                else{
                    var id = formattedResult[0]._id;
                    var query = { $set: {cmdprefix: args[1]}};
                    update({_id: id}, query);
                }
                
            })
        }
        else if(args[0] === '!startover' && permissions(userID, ['admin'])){
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db("mayushii");
                dbo.collection(collectionName).drop(function(err, delOK) {
                    if (err) throw err;
                    if (delOK) console.log("Collection deleted");
                    db.close();
                });
            });
        }
        else if(args[0] === '!prefix'){//Get the current prefix
            const prefix = getPrefix();
            prefix.then(function(prefix){
                bot.sendMessage({
                    to: channelID,
                    message: "The current prefix is " + "``" + prefix + "``"
                });
            })
        }
        
        else if (args[0] === (prefix + command)) { //If message contains prefix
            args.shift(); //Remove cmd from args array
            getRandomNekoImg = function(tags){ //REST get request to nekobooru using axios
                axios.get('https://nekobooru.xyz/api/posts/?query=' + tags + ",image" + ",anim", {},{
                    })
                    .then(response =>{ 
                        var randomNo = genRandomNumber(0, response.data.results.length - 1);
                        randomNo.then(function(number){
                            var richembed = {
                                'color': color,
                                'footer': {
                                    'icon_url': "https://nekobooru.xyz/img/favicon.png",
                                    'text': 'nekobooru.xyz'
                                },
                                'image': {
                                    'url': "https://nekobooru.xyz/" +  response.data.results[number].contentUrl
                                },
                                
                            };
                            bot.sendMessage({
                                to: channelID,
                                embed: richembed
                            });
                        })
                    })
                    .catch(err =>{
                        logger.warn("Failed to find image");
                    });
            }
            getWolframAlpha = function(input){ //REST get request to nekobooru using axios
                axios.get('http://api.wolframalpha.com/v2/query?input=' + removeSpaces(input) + "&appid=" + authwolframalpha.token, {},{
                    })
                    .then(response =>{ 
                        var parseString = require('xml2js').parseString;
                        var xml = response.data.toString();
                        parseString(xml, function (err, result) {
                            var lines = "";
                            for(i = 0; i < result.queryresult.pod[1].subpod[0].plaintext.length; i++){
                                lines = lines + result.queryresult.pod[1].subpod[0].plaintext[i];
                            }
                            var richembed = {
                                'color': color,
                                'footer': {
                                    'icon_url': "https://cdn.iconscout.com/icon/free/png-256/wolfram-alpha-2-569293.png",
                                    'text': 'wolframalpha.com'
                                },
                                "description": lines,
                            };
                            bot.sendMessage({
                                to: channelID,
                                embed: richembed
                            });
                        })
                        
                    })
                    .catch(err =>{
                        logger.warn(err);
                    });
            }
            getRedditHot = function(subreddit){
                return new Promise(function(res, err){
                    r.getSubreddit(subreddit).getHot().then(posts => {
                        var posts = posts.toJSON();
                        res(posts);
                    })
                })
            }
            
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
            {   const custcmds = getCmds("custom");
                custcmds.then(function(custcmds){//get customcmds
                    const defaultcmds = getCmds("default");
                    defaultcmds.then(function(defaultcmds){//get defaultcmds
                        
                        var richembed = {
                            "title": "Tuturuu~ Here is a list of commands",
                            "color": color,
                            "description": "Check the other help commands for more features such as !upload and don't forget you can upload reaction images for this bot at nekobooru.xyz",
                            "thumbnail": {
                              "url": image
                            },
                            "fields": [
                                {
                                    "name": "Default Image and message commands",
                                    "value": "These commands create a message or image or both. \n" + defaultcmds,
                                    "inline": true
                                },
                                {
                                    "name": "Custom Image and message commands",
                                    "value": "Additional commands can be created from discord chat (check " + c("help-customcmd") + ")\n" + custcmds,
                                    "inline": true},
                                    {
                                    "name": "Fun/useful commands",
                                    "value": c("rate") + c("flip") + c("say") + c("bigsay") + c("vote") + c("rps") + c("eval"),
                                    "inline": true
                                },
                                {
                                    "name": "Permissions (!add-admin <tagged-user>)",
                                    "value": c("add-admin") + c("add-poweruser"),
                                    "inline": true
                                },
                                {
                                    "name": "Other",
                                    "value": c("suggest") + " ``prefix`` "+ " ``!setprefix`` " + c("setcolor") + "(8 digit hex code)" + c("setimage") + "(URL)",
                                    "inline": true
                                },
                                {
                                    "name": "Help",
                                    "value": c("help-nekobooru") + c("help-customcmd") + c("help-reddit"), 
                                    "inline": true
                                }
                            ]
                            }
                            bot.sendMessage({
                                to: channelID,
                                embed: richembed
                            });
                            bot.sendMessage({
                                to: channelID,
                                message: "The help page is dynamically generated, if you customize the bot (new prefix, custom commands etc) you will have to do " + c("help") + "again to get the updated command list"
                            });
                        });
                    });
            }    
            else if(command === 'setimage' && args[0] !== undefined){//Prefix for !setprefix doesnt change
                args[0] = removeSpaces(args[0]);
                var query = { projection: { _id: 1, image: 1} }
                const found = find({}, query);
                found.then(function(result){
                    var formattedResult = new Array();
                    for(i=0;i<result.length;i++){
                        if(result[i].image !== undefined){
                            formattedResult.push(result[i]);
                        }
                    }
                    if(formattedResult.length === 0){
                        var query = { image: args[0]};
                        insert(query);
                    }
                    else{
                        var id = formattedResult[0]._id;
                        var query = { $set: {image: args[0]}};
                        update({_id: id}, query);
                    }
                })
            }
            else if(command === 'setcolor' && args[0] !== undefined){//Prefix for !setprefix doesnt change
                args[0] = removeSpaces(args[0]);
                var query = { projection: { _id: 1, color: 1} }
                if(args[0].length === 8){
                    const found = find({}, query);
                    found.then(function(result){
                        var formattedResult = new Array();
                        for(i=0;i<result.length;i++){
                            if(result[i].color !== undefined){
                                formattedResult.push(result[i]);
                            }
                        }
                        if(formattedResult.length === 0){
                            var query = { color: args[0]};
                            insert(query);
                        }
                        else{
                            var id = formattedResult[0]._id;
                            var query = { $set: {color: args[0]}};
                            update({_id: id}, query);
                        }
                        
                    })
                }
                else{
                    bot.sendMessage({ 
                        to: channelID,
                        message: "Color is a 8 digit number"
                    });
                }
            }
            else if(command === "zarathesadist"){
                var ztsCommands = require('./zts-commands.json');
                for(i = 0; i < ztsCommands.cmds.length; i++){
                    insertCMD(ztsCommands.cmds[i]);
                }
            }
            
            else if(command === "rimg" && args[0] !== undefined){
                var got = getRedditHot(args[0]);
                got.then(function(posts){
                    printRedditImg(posts);
                })
            }
            else if(command === "rpost" && args[0] !== undefined){
                var got = getRedditHot(args[0]);
                got.then(function(posts){
                    printRedditPost(posts);
                })
            }
            else if(command === "vote" && args[0] !== undefined){
                var avatar = "";
                var username = "";
                avatar = "https://cdn.discordapp.com/avatars/" + userID + "/" + bot.users[userID].avatar + ".png?size=128";
                username = bot.users[userID].username;
                var richembed = {
                    "color": color,
                    "fields": [
                        {
                            "name": "Tuturuu~ a vote has begun",
                            "value": argsString,
                            "inline": true
                        }
                    ],
                    "footer": {
                        "icon_url": avatar,
                        "text": username
                      }
                }
                //attempt to send two reactions at once, one will inevitbily fail
                //read response for the time to wait (discord rate limiting)
                //once the time is up it sends the reaction again
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
            else if(command === "help-customcmd"){
                var customCmdsLines = [
                    "Create your own image and message commands! If multiple commands have the same name a random command with that name will be chosen. Same goes for commands with multiple messages. You can also '&' to add multiple tags/message",
                    c("newcmd") + " **Create a new custom command**",
                    "<cmd-name> | <tag> *&<tag2>* | <message> *&<message2>*",
                    c("updatecmd-text") + " **and**" + c("updatecmd-tag") + "**Replace the tags/message**",
                    "<cmd-id> | <tag> *&<tag2>* ",
                    c("add-tag") + " **and** " + c("add-text") + "**add tags/message to an existing cmd**",
                    "<id> | <item> *&<item2>*",
                    c("del-tag") + " **and** " + c("del-text") + "**Delete tag/message in existing cmd**",
                    "<id> <index>",
                    c("cmd-details") + " **Details of a specific cmd**",
                    "<cmd-id>",
                    c("deletecmd") + " **delete a specific cmd**",
                    "<cmd-id>",
                    c("lscmdname") + " **list cmds with same cmd name (gives cmd-ids)**",
                    "<cmd-name>",
                    c("ls-allcmds") + c("ls-defaultcmds") + c("ls-customcmds"),
                ]
                var customCmdsString = "";
                for(i = 0; i < customCmdsLines.length; i++){
                    customCmdsString = customCmdsString + customCmdsLines[i] + "\n";
                }
                var richembed = {
                    "title": "Tuturuu~ Here is how you can create commands",
                    "color": color,
                    "thumbnail": {
                      "url": image
                    },
                    "fields": [
                        {
                            "name": "Custom command creation",
                            "value": customCmdsString,
                            "inline": true
                        }
                    ]
                }
                bot.sendMessage({
                    to: channelID,
                    embed: richembed
                });
            }
            else if(command === "help-reddit"){
                var customCmdsLines = [
                    "Create your own reddit commands! If multiple commands have the same name a random command with that name will be chosen. Same goes for commands with multiple messages. You can choose to filter out text posts by using the img option in !newcmdr",
                    c("newcmdr") + " **Create a new custom command**",
                    "<cmd-name> | <subreddit> | <img/post (default is post)>",
                    c("updatecmd-subr") + "**Replace the subreddit**",
                    "<cmd-id> | <subreddit>* ",
                    c("cmd-details") + " **Details of a specific cmd**",
                    "<cmd-id>",
                    c("deletecmd") + " **delete a specific cmd**",
                    "<cmd-id>",
                    c("lscmdname") + " **list cmds with same cmd name (gives cmd-ids)**",
                    "<cmd-name>",
                    c("rpost") + " **Gets random img from Hot from specified subreddit**",
                    "<subreddit>",
                    c("rimg") + " **Gets random img from Hot from specified subreddit**",
                    "<subreddit>",
                ]
                var customCmdsString = "";
                for(i = 0; i < customCmdsLines.length; i++){
                    customCmdsString = customCmdsString + customCmdsLines[i] + "\n";
                }
                var richembed = {
                    "title": "Tuturuu~ Here is how you can create commands",
                    "color": color,
                    "thumbnail": {
                      "url": image
                    },
                    "fields": [
                        {
                            "name": "Custom command creation",
                            "value": customCmdsString,
                            "inline": true
                        }
                    ]
                }
                bot.sendMessage({
                    to: channelID,
                    embed: richembed
                });
            }
            else if(command === "help-nekobooru"){
                var nekobooruLines = [
                    c("tag") + "**Returns random image with given tag(s)**",
                    "<tag> *<tag2>*",
                    c("upload") + "**Upload from a given URL with certain tag(s)**",
                    "<url> <tag> *<tag2>*",
                    c("newtag") + "**Create tag and its aliases (Default category)**",
                    "<tag> *<tag-alias>*",
                    c("newcategorytag") + "**Same as above but can specify category**",
                    "<tag-category> <tag> *<tag2>*"
                ]
                var nekobooruString = "";
                for(i = 0; i < nekobooruLines.length; i++){
                    nekobooruString = nekobooruString + nekobooruLines[i] + "\n";
                }
                var richembed = {
                    "title": "Tuturuu~ Here is how you can interact with nekobooru.xyz",
                    "color": color,
                    "thumbnail": {
                      "url": image
                    },
                    "fields": [
                        {
                            "name": "Nekobooru commands",
                            "value": nekobooruString,
                            "inline": true
                        }
                    ]
                }
                bot.sendMessage({
                    to: channelID,
                    embed: richembed
                });
            }
            else if(command === 'rps'){
                Promise.try(function() {
                    return randomNumber(0, 2);
                }).then(function(number) {
                    var result;
                    if(number == 0){
                        result = "Rock";
                    }
                    else if (number == 1){
                        result = "Paper";
                    }
                    else{
                        result = "Scissors";
                    }
                    bot.sendMessage({
                        to: channelID,
                        message: result
                    });
                }).catch({code: "RandomGenerationError"}, function(err) {
                    console.log(err);
                });
            }
            else if(command === 'say'){
                //Check if text contains a command (only admins should have the power to do this)
                if(args[0] !== undefined){
                    containscommand = removeSpaces(args[0]);
                    if(removeSpaces(containscommand[0][0]) === '!'){
                        containscommand = true;
                    }
                }
                else{
                    containscommand = false;
                }
                if(!containscommand || permissions(userID, ['admin'])){
                    var text = "";
                    for(i = 0; i < args.length; i++){
                        text = text + args[i] + " ";
                    }
                    bot.sendMessage({
                        to: channelID,
                        message: text
                    });
                }
            }
            else if(command === 'add-admin' && permissions(userID, ['admin']) && args[0] !== undefined){
                var stringtoadd = args[0];
                stringtoadd = stringtoadd.replace(/<|>|@/g, '');
                var dataFromFile = fs.readFileSync('admin' + '.txt');
                var data = dataFromFile.toString();
                var items = data.split('\n');
                var alreadyexists = false;
                for(i = 0; i < items.length; i++){
                    if(items[i] === stringtoadd){
                        alreadyexists = true;
                    }
                }
                if(!alreadyexists){
                    fs.appendFile('admin.txt', stringtoadd , function (err) {
                        if (err){
                            logger.error(err);
                            throw err;
                        } 
                        });
                }
                else{
                    bot.sendMessage({
                        to: channelID,
                        message: "Already exists"
                    });
                }
            }
            else if(command === 'add-poweruser' && permissions(userID, ['admin', 'power user']) && args[0] !== undefined){
                var stringtoadd = args[0];
                stringtoadd = stringtoadd.replace(/<|>|@/g, '');
                var dataFromFile = fs.readFileSync('power user' + '.txt');
                var data = dataFromFile.toString();
                var items = data.split('\n');
                var alreadyexists = false;
                for(i = 0; i < items.length; i++){
                    if(items[i] === stringtoadd){
                        alreadyexists = true;
                    }
                }
                if(!alreadyexists){
                    fs.appendFile('power user.txt', stringtoadd , function (err) {
                        if (err){
                            logger.error(err);
                            throw err;
                        } 
                        });
                }
                else{
                    bot.sendMessage({
                        to: channelID,
                        message: "Already exists"
                    });
                }
            }
            else if(command === 'bigsay' && args[0] !== undefined){
                var text = "";
                for(i = 0; i < args.length; i++){
                    text = text + args[i] + " ";
                }
                var finalmessage = "";
                var invalidInput = false;
                var numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
                for(i = 0; i < text.length - 1; i++){
                    if(text[i].match(/[a-z0-9\s]+/)){
                        text[i] = text[i].toLowerCase();
                        if(text[i] === " "){
                            finalmessage = finalmessage + " ";
                        }
                        else if (!isNaN(text[i])){
                            finalmessage = finalmessage + ":" + numbers[text[i]] + ":";
                        }
                        else{
                            finalmessage = finalmessage + ":regional_indicator_" + text[i] + ":";
                        }
                    }
                    else{
                        invalidInput = true;
                    }
                }
                if(invalidInput){
                    finalmessage = "Only alphanumeric values are allowed";
                }
                bot.sendMessage({
                    to: channelID,
                    message: finalmessage
                });
            }
            else if (command === 'flip'){
                Promise.try(function() {
                    return randomNumber(0, 1);
                }).then(function(number) {
                    var result;
                    if(number == 1){
                        result = "It landed on heads";
                    }
                    else{
                        result = "It landed on tails";
                    }
                    bot.sendMessage({
                        to: channelID,
                        message: result
                    });
                }).catch({code: "RandomGenerationError"}, function(err) {
                    console.log(err);
                });
            }
            else if(command === 'rate'){
                Promise.try(function() {
                    return randomNumber(0, 10);
                }).then(function(number) {
                    var text;
                    if(number == 10){
                        text = "I give it a " + "**" + number + "**" + " out of 10!"
                    }
                    else if(number == 0){
                        text = "I give it a " + "**" + number + "**" + " out of 10..."
                    }
                    else{
                        text = "I give it a " + number + " out of 10"
                    }
                    bot.sendMessage({
                        to: channelID,
                        message: text
                    });
                }).catch({code: "RandomGenerationError"}, function(err) {
                    console.log(err);
                });
                
            }
            else if(command === 'newcmd'){
                var argstring = message.substring(1);
                argstring = message.split("!newcmd ");
                argstring = argstring[1];
                argstring = argstring.split('|');
                var tagsArray = undefined;
                var textArray = undefined;
                if(argstring[0] !== undefined){
                    argstring[0] = removeSpaces(argstring[0]); //Spaces are only important for text
                }
                if(argstring[1] !== undefined){
                    tagsArray = removeSpaces(argstring[1]).split('&'); //Allows for multiple texts or tags to be put in at once
                }
                if(argstring[2] !== undefined){
                    textArray = argstring[2].split('&');
                }
                thingToPass = {cmd: argstring[0], tags: tagsArray, texts: textArray };
                insert(thingToPass); 
            }
            else if(command === 'newcmdr'){ //<cmd> | <subreddits> | text post / image post
                var argstring = message.substring(1);
                argstring = message.split("!newcmdr ");
                argstring = argstring[1];
                argstring = argstring.split('|');
                var subreddits = undefined;
                var type = undefined;
                if(argstring[0] !== undefined){
                    argstring[0] = removeSpaces(argstring[0]); 
                }
                if(argstring[1] !== undefined){
                    subreddits = removeSpaces(argstring[1]);
                }
                if(argstring[2] !== undefined){
                    type = removeSpaces(argstring[2]);
                }
                
                thingToPass = {cmd: argstring[0], subreddit: subreddits, type: type };
                insert(thingToPass); 
            }
            else if (command === 'ls-allcmds'){ 
                const defaultCmds = getCmds("all"); 
                defaultCmds.then(function(finalmessage){
                    bot.sendMessage({
                        to: channelID,
                        message: finalmessage
                    });
                });
            }
            else if (command === 'ls-defaultcmds'){
                const defaultCmds = getCmds("default"); 
                defaultCmds.then(function(finalmessage){
                    bot.sendMessage({
                        to: channelID,
                        message: finalmessage
                    });
                });
            }
            else if (command === 'ls-customcmds'){
                const customCmds = getCmds("custom"); 
                customCmds.then(function(finalmessage){
                    bot.sendMessage({
                        to: channelID,
                        message: finalmessage
                    });
                });
            }
            else if(command === 'upload'){
                    if(args[0] === undefined || args[1] === undefined){
                        bot.sendMessage({
                            to: channelID,
                            message: "Tuturuu~ Please enter one URL and at least one tag (!help for formatting)"
                        });
                    }
                    else{
                        var temparray = new Array();
                        for(i = 1; i < args.length; i++)
                        {
                            temparray.push(args[i]);
                        }
                        axios.post('https://nekobooru.xyz/api/posts/', {
                            tags: temparray,
                            safety: 'safe',
                            contentUrl: args[0]
                        },{
                                headers:{
                                    'Authorization': nekobooruToken,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',     
                                },    
                            })
                        .then(function (response){
                            bot.sendMessage({
                                to: channelID,
                                message: "Tuturuu~ File uploaded from URL: ``" + args[0] + "`` with tags: " + args[1]
                            });
                            logger.info("File uploaded! - URL:" + args[0] + "Tags: " + args[1]);
                        })
                        .catch(function (error) { 
                            bot.sendMessage({
                                to: channelID,
                                message: "Tuturuu~ An error occured"
                            });
                            logger.error(error.response.data);//Useful error information
                        });
                    }
            }
            else if (command === 'eval'){
                getWolframAlpha(argsString);
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
                bot.sendMessage({
                    to: channelID,
                    message: "Tuturuu~ Thank you for your suggestion"
                });
            }
            else if (command === 'newtag' && permissions(userID, ['power user', 'admin'])){
                if(args[0] === undefined){
                    bot.sendMessage({
                        to: channelID,
                        message: "Tuturuu~ Missing expected arguments (!help for formatting)"
                    });
                }
                else{
                    var temparray = new Array();
                    for(i = 0; i < args.length; i++)
                    {
                        temparray.push(args[i]);
                    }
                    axios.post('https://nekobooru.xyz/api/tags/', {
                        names: temparray,
                        category: 'Default'
                    },{
                            headers:{
                                'Authorization': nekobooruToken,
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',     
                            },    
                        })
                        .then(function (response){
                            bot.sendMessage({
                                to: channelID,
                                message: "Tuturuu~ Tag created"
                            });
                            logger.info("A new tag was created on nekobooru.xyz");
                        })
                        .catch(function (error) { 
                            bot.sendMessage({
                                to: channelID,
                                message: "Tuturuu~ An error occured"
                            });
                            logger.error(error.response.data);//Useful error information
                        });
                }
            }
            else if ((command === "updatecmd-text" || command === "updatecmd-tag"| command === "updatecmd-subr") && argsString.includes("|") && args[0] !== undefined){ //<id> | <tags>
                try{
                    var id = ObjectId(removeSpaces(args[0]));
                    var query = { _id: id };
                    argsString = argsString.split('|');
                    argsString = argsString[1]; //<tags>
                    var tagsArray = undefined;
                    var textArray = undefined;
                    if(argsString !== undefined){
                        var newvalues;
                        if(command === "updatecmd-tag"){
                            tagsArray = removeSpaces(argsString).split('&'); //Allows for multiple texts or tags to be put in at once
                            newvalues = { $set: {tags: tagsArray}}; //update tags
                        }
                        else if (command === "updatecmd-text"){
                            textArray = argsString.split('&'); //Allows for multiple texts or tags to be put in at once
                            newvalues = { $set: {texts: textArray}}; //update tags
                        }
                        else if (command === "updatecmd-subr"){
                            subreddits = removeSpaces(argsString);
                            newvalues = { $set: {subreddit: subreddits}}; 
                        }
                    }
                    update(query, newvalues);
                }
                catch{
                    bot.sendMessage({
                        to: channelID,
                        message: "Invalid id"
                    });
                }
            }
            else if ((command === "add-tag" || command === "add-text") && argsString.includes("|") && args[0] !== undefined){ // <id> | <item-to-add> 
                try{
                    var id = ObjectId(removeSpaces(args[0]));
                    var query = { _id: id };
                    const found = find(query);
                    found.then(function(result){
                        var ogitems;
                        if(command === "add-tag"){
                            ogitems = result[0].tags;
                        }
                        else{
                            ogitems = result[0].texts;
                        }
                        argsString = argsString.split('|');
                        argsString = argsString[1]; //<item-to-add>
                        var itemsArray = undefined;
                        if(argsString !== undefined){//Add array of user items
                            if(command === "add-tag"){
                                itemsArray = removeSpaces(argsString).split('&'); //Allows for multiple texts or tags to be put in at once
                            }
                            else{
                                itemsArray = argsString.split('&'); //Allows for multiple texts or tags to be put in at once
                            }
                        }
                        for(i = 0; i < ogitems.length; i++){ //Add array of original items
                            itemsArray.push(ogitems[i]);
                        }
                        if(command === "add-tag"){
                            var newvalues = { $set: {tags: itemsArray}}; //update tags
                        }
                        else{
                            var newvalues = { $set: {texts: itemsArray}}; //update texts
                        }
                        update(query, newvalues);
                    });
                }
                catch{
                    bot.sendMessage({
                        to: channelID,
                        message: "Invalid id"
                    });
                }
            }
            else if ((command === "del-tag" || command === "del-text") && args[0] !== undefined && args[1] !== undefined){ // <id> <tag/texts-index> 
                try{
                    var id = ObjectId(removeSpaces(args[0]));
                    var query = { _id: id };
                    var index = removeSpaces(args[1]);
                    const found = find(query);
                    found.then(function(result){
                        if (err) throw err;
                        try{
                            var newvalues;
                            if(command === "del-tag"){
                                arrayToUpdate = result[0].tags;
                                arrayToUpdate.splice(index, 1); //Remove the user specified element from the array
                                newvalues = { $set: {tags: arrayToUpdate}}; //update tags
                            }
                            else if (command === "del-text"){
                                arrayToUpdate = result[0].texts;
                                arrayToUpdate.splice(index, 1); //Remove the user specified element from the array
                                newvalues = { $set: {texts: arrayToUpdate } }; //update texts
                            }
                            update(query, newvalues);
                        }
                        catch(err){
                            bot.sendMessage({
                                to: channelID,
                                message: "You entered an invalid index"
                            });
                        }
                        db.close();
                    });
                }
                catch{
                    bot.sendMessage({
                        to: channelID,
                        message: "Invalid id"
                    });
                }
            }
            else if (command === "cmd-details" && args[0] !== undefined){ //<cmd-id>
                try {
                    var id = ObjectId(removeSpaces(args[0]));
                    var query = { "_id" : id };
                    const found = find(query);
                    found.then(function(result){
                        var finalMessage = "";
                        if(result !== undefined){
                            result = result[0];
                            finalMessage = finalMessage + "asciidoc\nCMD ID :: " + result._id + "\n================================"
                            finalMessage = finalMessage + "\nCmd name :: " + result.cmd;
                            finalMessage = finalMessage + "\nTags :: \n";
                            if(result.tags !== undefined){
                                for(i = 0; i < result.tags.length; i++){
                                    finalMessage = finalMessage + "ID " + i + ":";
                                    finalMessage = finalMessage + "[" + result.tags[i] + "]\n";
                                }
                            }
                            finalMessage = finalMessage + "\nTexts :: \n";
                            if(result.texts !== undefined){
                                for(i = 0; i < result.texts.length; i++){
                                    finalMessage = finalMessage + "ID " + i + ":";
                                    finalMessage = finalMessage + "[" + result.texts[i] + "]\n";
                                }
                            }
                            if(finalmessage !== ""){
                                bot.sendMessage({
                                    to: channelID,
                                    message: "```" + finalMessage + "```"
                                });
                            }
                        }
                    });
                }
                catch(err) {
                    bot.sendMessage({
                        to: channelID,
                        message: "Invalid id"
                    });
                }
            }
            else if (command === "deletecmd"){ //<cmd-id>
                MongoClient.connect(url, function(err, db) {
                    if (err) throw err;
                    var dbo = db.db("mayushii");
                    var id = ObjectId(removeSpaces(args[0]));
                    var myquery = { _id: id };
                    dbo.collection(collectionName).deleteOne(myquery, function(err, obj) {
                        if (err) throw err;
                        bot.sendMessage({
                            to: channelID,
                            message: "cmd deleted with cmd id " + args[0]
                        });
                        db.close();
                    });
                }); 
            }
            else if(command === "lscmdname" && args[0] !== undefined){ //list cmds with the name <cmd-name>
                var query = { cmd: removeSpaces(args[0]) };
                const found = find(query);
                found.then(function(result){
                    for(i = 0; i < result.length; i++){   
                        //Builds a nicely formatted message string for one command
                        var finalMessage = ""
                        //asciiidoc allows for colors, the ==== under the line makes both the '=' and the above line blue
                        finalMessage = finalMessage + "```asciidoc\nCmd ID: " + result[i]._id + "\n================================\nTags :: "
                        if(result[i].tags !== undefined && result[i].tags != null){
                            for(j = 0; j< result[i].tags.length; j++){
                                finalMessage = finalMessage + '[' + result[i].tags[j] + ']';
                                if(j != result[i].tags.length-1){ //Make sure commas are in the right place
                                    finalMessage = finalMessage + ", ";
                                }
                            }
                        }
                        else{
                            finalMessage = finalMessage + "No tags";
                        }
                        finalMessage = finalMessage + "\nTexts :: ";
                        if(result[i].texts !== undefined && result[i].texts != null){
                            for(j = 0; j< result[i].texts.length; j++){
                                finalMessage = finalMessage + '[' + result[i].texts[j] + ']';
                                if(j != result[i].texts.length-1){
                                    finalMessage = finalMessage + ", ";
                                }
                            }
                        }
                        else{
                            finalMessage = finalMessage + "No texts";
                        }
                        finalMessage = finalMessage + "\nSubreddit :: ";
                        if(result[i].subreddit !== undefined && result[i].subreddit != null){
                            finalMessage = finalMessage + result[i].subreddit;
                        }
                        else{
                            finalMessage = finalMessage + "No texts";
                        }
                        finalMessage = finalMessage + "```"
                        bot.sendMessage({
                            to: channelID,
                            message: finalMessage
                        });
                    }
                });
            }
            else if(command === "tag"){
                if(args[0] === undefined){
                    bot.sendMessage({
                        to: channelID,
                        message: "Tuturuu~ Missing expected argument(s) (!help for formatting)"
                    });
                }
                else{
                    logger.info("GET from nekobooru.xyz - " + args[0]);
                    getRandomNekoImg(args[0]);
                }
            }
            else if (command === 'newtagcategory' && (powerUser(userID) || adminUser(userID))){
                if(args[0] === undefined || args[1] === undefined){
                    bot.sendMessage({
                        to: channelID,
                        message: "Tuturuu~ Missing expected arguments (!help for formatting)"
                    });
                }
                else{
                    var temparray = new Array();
                    for(i = 1; i < args.length; i++)
                    {
                        temparray.push(args[i]);
                    }
                    axios.post('https://nekobooru.xyz/api/tags/', {
                        names: temparray,
                        category: args[0]
                    },{
                            headers:{
                                'Authorization': nekobooruToken,
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',     
                            },    
                        })
                        .then(function (response){
                            bot.sendMessage({
                                to: channelID,
                                message: "Tuturuu~ Tag created"
                            });
                            logger.info("New tag category created on nekobooru.xyz");
                        })
                        .catch(function (error) { 
                            bot.sendMessage({
                                to: channelID,
                                message: "Tuturuu~ An error occured"
                            });
                            logger.error(error.response.data);//Useful error information
                        });
                }
            }
            else {
                try{
                    var query = { cmd: removeSpaces(command) };
                    const found = find(query);
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
                                bot.sendMessage({
                                    to: channelID,
                                    message: resultTextString
                                });
                                getRandomNekoImg(resultTagsString);
                            }
                            else if(!tagsExists && textExists){
                                resultTextString = addUserId(resultTextString, args[0]);//replace @target and @user
                                bot.sendMessage({
                                    to: channelID,
                                    message: resultTextString
                                });
                            }
                            else if(tagsExists && !textExists){
                                getRandomNekoImg(resultTagsString);
                            }
                            else{
                                if(subrExists && typeExists){
                                    if(removeSpaces(resultType) === "img"){
                                        var got = getRedditHot(resultSubr);
                                        got.then(function(posts){
                                            printRedditImg(posts);
                                        })
                                    }
                                    else if(resultType = "post"){
                                        
                                        var got = getRedditHot(resultSubr);
                                        got.then(function(posts){
                                            printRedditPost(posts);
                                        })
                                    }
                                }
                                else if (subrExists){
                                    var got = getRedditHot(resultSubr);
                                    got.then(function(posts){
                                        printRedditPost(posts);
                                    })
                                }
                                else{
                                    getRandomNekoImg(resultCmd);
                                }
                                
                            }
                        }
                        else{
                            bot.sendMessage({
                                to: channelID,
                                message: "Command not found or formatted incorrectly, check !help"
                            });
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