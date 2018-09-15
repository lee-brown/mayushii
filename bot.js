var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
const axios = require('axios');
var Promise = require("bluebird");
const fs = require('fs');
var mongo = require('mongodb');
var randomNumber = require("random-number-csprng");
var ObjectId = require('mongodb').ObjectID;
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

    var serverID = bot.channels[channelID].guild_id;
    var args = message.substring(1).split(' ');
    var command = args[0];
    var collectionName = serverID.toString(); //Each collection named after unique server ID (custom commands are tied to discord servers)
    args = args.splice(1); 

    var MongoClient = mongo.MongoClient;
    var url = "mongodb://localhost:27017/";
    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    dbo.createCollection(collectionName, function(err, res) {
        if (err) throw err;
        db.close();
    });
    });

    var nekoimages = ["confused", "angry", "caesar", "fbi", "pout", "slap", "smug", "dance", "sleepy", "confused", "triggered", "lewd", "fite", "panic", "flee", "baited", "capitalism", "laughing", "wut", "tooloud", "excited", "niceattempt"];
        
    if (message.substring(0, 1) === '!') {
        getRandomNekoImg = function(tags){ //REST get request to nekobooru using axios
            axios.get('https://nekobooru.xyz/api/posts/?query=' + tags + ",image" + ",anim", {},{
                })
                .then(response =>{ 
                    createEmbed(response);
                        
                    })
                .catch(err =>{
                    //logger.error(err);
                });
        }
        function removeSpaces(item){
            item = item.replace(/\s/g, ''); 
            return item;
        }
        function createEmbed(response){//Create a new discord rich embed
            Promise.try(function() {
                if(response.data.results.length === 1){//randomNumber doesnt accept two of the same values (e.g pick a number from 0 to 0), if length is 1 then the only number can be 0
                    return 0;
                }
                else if(response.data.results.length === 0){
                    console.log("No images found!");
                }
                else{
                    return randomNumber(0, response.data.results.length - 1);
                }
                
            }).then(function(number) {
                var richembed = {
                    'color': 15277667,
                    'footer': {
                        'icon_url': "https://nekobooru.xyz/img/favicon.png",
                        'text': 'Nekobooru.xyz'
                    },
                    'image': {
                        'url': "https://nekobooru.xyz/" +  response.data.results[number].contentUrl
                    },
                    
                };
                console.log(response.data.results[number].contentUrl);
                bot.sendMessage({
                    to: channelID,
                    embed: richembed
                });
            }).catch({code: "RandomGenerationError"}, function(err) {
                console.log(err);
            });
        }
        function permissions(user, rank){ //returns true if user has correct permissions
            var permission = false;
            for(i = 0; i < rank.length; i++){ //Check all ranks that have permission to do the action
                var dataFromFile = fs.readFileSync(rank[i] + '.txt');
                var data = dataFromFile.toString();
                var items = data.split('\n');
                for(j = 0; j < items.length; j++){
                    if(items[j] == user){
                        permission = true;
                    }
                    else{
                        console.log(items[j] + " not equal to " + user);
                    }
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
                logger.warn("insufficient privileges for userID " + user);
                return false;
            }
        }
        function addUserId(originaltext, target){
            newtext = originaltext.replace("@user", "<@!" + userID + ">");
            if(args[0] !== undefined){
                newtext = newtext.replace("@target", target);
            }
            return newtext;
        }
        if(command === 'help')
        {
            var nekoimagesstring = "";
            for(i = 0; i < nekoimages.length; i++){
                nekoimagesstring = nekoimagesstring + " ``!" + nekoimages[i] + "`` ";
            }
            var richembed = {
                "title": "Tuturuu~ Here is a list of commands",
                "color": 15277667,
                "thumbnail": {
                  "url": "https://nekobooru.xyz/data/posts/18_9f7a09bdc35dfd01.png"
                },
                "fields": [
                  {
                      "name": "Nekobooru reactions (e.g !smug)",
                      "value": nekoimagesstring,
                      "inline": true
                    },
                    {
                        "name": "Created custom commands",
                        "value": "``undefined``",
                        "inline": true
                      },
                    {
                      "name": "Nekobooru user interactions (e.g !slap @Mayuri)",
                      "value": "``!slap`` ``!pat``",
                      "inline": true
                    },
                    {
                      "name": "Nekobooru commands (Anything in *italics* is optional)",
                      "value": "``!tag`` **Returns random image with given tag(s)**\n !tag <tag> *<tag2>* \n``!upload`` **Upload from a given URL with certain tag(s)**\n!upload <url> <tag> *<tag2>* \n``!newtag`` **Create tag and its aliases (Default category)**\n!tag <tag> *<tag-alias>*\n ``!newcategorytag`` **Same as above but can specify category**\n!newcategorytag <tag-category> <tag> *<tag2>*",
                      "inline": true
                    },
                    {
                      "name": "Mayuri commands",
                      "value": "``!suggest`` - Suggest improvements or features to Mayuri \n ``!rate`` ``!flip`` ``!say`` ``!bigsay`` ``!lenny``",
                      "inline": true
                    },
                    {
                        "name": "Custom command creation",
                        "value": "``!newcommand`` Create a new custom command (dont forget |) \n !newcommand <command-name> | <tag(s)> | <text> \n``!editcommandtag`` Replace tag of custom command \n !editcommandtag <command-name> <id> <new-tag> \n ``!editcommandtext`` Replace text of custom command \n !editcommandtext <command-name> <id> <new-text> \n ``!deletecommand`` Delete custom commands, use !listcommands to find id \n !deletecommand <command-name> <id> \n ``!listcommands`` Lists all commands with a certain command name \n !listcommands <command-name> \n ``!listallcommands`` - Lists all custom commands",
                        "inline": true
                    },
                    {
                    "name": "Permissions (!add-admin <tagged-user>)",
                    "value": "``!add-admin`` ``!add-poweruser``",
                    "inline": true
                    }
                ]
            }
          bot.sendMessage({
              to: channelID,
              embed: richembed
          });
          logger.info("Help command printed");
        }
        else if(command === 'say'){
            //Check if text contains a command (only admins should have the power to do this)
            if(args[0] !== undefined){
                containscommand = args[0].replace(/\s/g, '');
                if(containscommand[0][0].replace(/\s/g, '') === '!'){
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
        else if(command === 'add-admin' && permissions(userID, ['admin'])){
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
        else if(command === 'add-poweruser' && permissions(userID, ['admin', 'power user'])){
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
        else if(command === 'bigsay'){
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
        else if(command === 'lenny'){
            bot.sendMessage({
                to: channelID,
                message: "( ͡° ͜ʖ ͡°)"
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
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
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
                var dbo = db.db("mydb");
                dbo.collection(collectionName).insertOne(thingToPass, function(err, res) {
                  if (err) throw err;
                  console.log("1 document inserted");
                  db.close();
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
                                'Authorization': 'Token enRzYm90OjA1MzA3MTkyLWVkODEtNGM5My1iOTAxLWI2MjA4NTgzNjNkNQ==',
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',     
                            },    
                        })
                    .then(function (response){
                        bot.sendMessage({
                            to: channelID,
                            message: "Tuturuu~ File uploaded from URL: " + args[0] + " and tags " + args[1]
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
            else if (command === 'suggest'){
                var stringtoadd = "\nSuggestions of user: " + user + " - " + userID + "\n";
                for(i = 0; i < args.length; i++)
                {
                    stringtoadd += args[i];
                }
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
                                'Authorization': 'Token enRzYm90OjA1MzA3MTkyLWVkODEtNGM5My1iOTAxLWI2MjA4NTgzNjNkNQ==',
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
            else if (command === "updatecmd-text" || command === "updatecmd-tag"){ //<id> | <tags>
                MongoClient.connect(url, function(err, db) {
                    if (err) throw err;
                    if(!message.substring(1).includes('|')){
                        bot.sendMessage({
                            to: channelID,
                            message: "Forgot the | symbol"
                        });
                    }
                    else{
                        var dbo = db.db("mydb");
                        var id = ObjectId(removeSpaces(args[0]));
                        var query = { _id: id };
                        var request = command.split('-')[1];
                        dbo.collection(collectionName).find(query).toArray(function(err, result) {
                            if (err) throw err;
                            try{
                                var argstring = message.substring(1);
                                if(request === "tags"){
                                    argstring = message.split("!updatecmd-tag ");
                                }
                                else{
                                    argstring = message.split("!updatecmd-text ");
                                }
                                argstring = argstring[1];
                                argstring = argstring.split('|');
                                argstring = argstring[1]; //<tags>
                                var tagsArray = undefined;
                                var textArray = undefined;
                                if(argstring !== undefined){
                                    if(request === "tags"){
                                        textArray = removeSpaces(argstring).split('&'); //Allows for multiple texts or tags to be put in at once
                                    }
                                    else{
                                        tagsArray = argstring.split('&'); //Allows for multiple texts or tags to be put in at once
                                    }
                                }
                                if(request === "tag"){
                                    var newvalues = { $set: {tags: tagsArray}}; //update tags
                                }
                                if(request === "text"){
                                    var newvalues = { $set: {texts: textArray}}; //update tags
                                }
                                dbo.collection(collectionName).updateOne(query, newvalues, function(err, res) {
                                    if (err) throw err;
                                    console.log("1 document updated");
                                    db.close();
                                });
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
                  }); 
            }
            else if (command === "updatecmd"){ //<id> | <tags> | <text>
                MongoClient.connect(url, function(err, db) {
                    if (err) throw err;
                    if(!message.substring(1).includes('|')){
                        bot.sendMessage({
                            to: channelID,
                            message: "Forgot the | symbol"
                        });
                    }
                    else{
                        var dbo = db.db("mydb");
                        var id = ObjectId(removeSpaces(args[0]));
                        var query = { _id: id };
                        dbo.collection(collectionName).find(query).toArray(function(err, result) {
                            if (err) throw err;
                            try{
                                var argstring = message.substring(1);
                                argstring = message.split("!updatecmd ");
                                argstring = argstring[1];
                                argstring = argstring.split('|');
                                var tagsArray = undefined;
                                var textArray = undefined;
                                if(argstring[1] !== undefined){
                                    tagsArray = removeSpaces(argstring[1]).split('&'); //Allows for multiple texts or tags to be put in at once
                                }
                                if(argstring[2] !== undefined){
                                    textArray = argstring[2].split('&');
                                }
                                var newvalues = { $set: {tags: tagsArray, texts: textArray}}; //update tags
                                dbo.collection(collectionName).updateOne(query, newvalues, function(err, res) {
                                    if (err) throw err;
                                    console.log("1 document updated");
                                    db.close();
                                });
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
                  }); 
            }
            else if (command === "add-tag" || command === "add-text"){ // <id> | <item-to-add> 
                MongoClient.connect(url, function(err, db) {
                    if (err) throw err;
                    var dbo = db.db("mydb");
                    try{
                        var id = ObjectId(removeSpaces(args[0]));
                    }
                    catch{
                        bot.sendMessage({
                            to: channelID,
                            message: "Invalid id"
                        });
                    }
                    if(!message.substring(1).includes('|')){
                        bot.sendMessage({
                            to: channelID,
                            message: "Forgot the | symbol"
                        });
                    }
                    else{
                        var query = { _id: id };
                        var request = command.split('-')[1];
                        try{
                            dbo.collection(collectionName).find(query).toArray(function(err, result) {
                                if (err) throw err;
                                var argstring = message.substring(1);
                                var ogitems;
                                if(request === "tags"){
                                    argstring = message.split("!add-tag ");
                                    ogitems = result[0].tags;
                                }
                                else{
                                    argstring = message.split("!add-text ");
                                    ogitems = result[0].texts;
                                }
                                argstring = argstring[1];
                                argstring = argstring.split('|');
                                argstring = argstring[1]; //<item-to-add>
                                var itemsArray = undefined;
                                if(argstring !== undefined){//Add array of user items
                                    if(request === "tags"){
                                        itemsArray = removeSpaces(argstring).split('&'); //Allows for multiple texts or tags to be put in at once
                                    }
                                    else{
                                        itemsArray = argstring.split('&'); //Allows for multiple texts or tags to be put in at once
                                    }
                                }
                                for(i = 0; i < ogitems.length; i++){ //Add array of original items
                                    itemsArray.push(ogitems[i]);
                                }
                                if(request === "tag"){
                                    var newvalues = { $set: {tags: itemsArray}}; //update tags
                                }
                                if(request === "text"){
                                    var newvalues = { $set: {texts: itemsArray}}; //update tags
                                }
                                dbo.collection(collectionName).updateOne(query, newvalues, function(err, res) {
                                    if (err) throw err;
                                    console.log("1 document updated");
                                    db.close();
                                });
                                db.close();
                            });
                        }
                        catch{
                            bot.sendMessage({
                                to: channelID,
                                message: "Failed to add element"
                            });
                        }
                    }
                  }); 
            }
            else if (command === "del-tag" || command === "del-text"){ // <id> <tag/texts-index> 
                MongoClient.connect(url, function(err, db) {
                    if (err) throw err;
                    var dbo = db.db("mydb");
                    try{
                        var id = ObjectId(removeSpaces(args[0]));
                    }
                    catch{
                        bot.sendMessage({
                            to: channelID,
                            message: "Invalid id"
                        });
                    }
                    var query = { _id: id };
                    try{
                        var index = removeSpaces(args[1]);
                    }
                    catch{
                        bot.sendMessage({
                            to: channelID,
                            message: "Missing Index"
                        });
                    }
                    var request = command.split('-')[1]; 
                    dbo.collection(collectionName).find(query).toArray(function(err, result) {
                        if (err) throw err;
                        try{
                            var newvalues;
                            if(request === "tag"){
                                arrayToUpdate = result[0].tags;
                                arrayToUpdate.splice(index, 1); //Remove the user specified element from the array
                                newvalues = { $set: {tags: arrayToUpdate}}; //update tags
                            }
                            else if (request === "text"){
                                arrayToUpdate = result[0].texts;
                                arrayToUpdate.splice(index, 1); //Remove the user specified element from the array
                                newvalues = { $set: {texts: arrayToUpdate } }; //update texts
                            }
                            dbo.collection(collectionName).updateOne(query, newvalues, function(err, res) {
                                if (err) throw err;
                                console.log("1 document updated");
                                db.close();
                            });
                        }
                        catch(err){
                            bot.sendMessage({
                                to: channelID,
                                message: "You entered an invalid index"
                                });
                        }
                        db.close();
                    });
                  }); 
            }
            else if (command === "cmd-details"){ //<cmd-id>
                MongoClient.connect(url, function(err, db) {
                    if (err) throw err;
                    var dbo = db.db("mydb");
                    try {
                        var id = ObjectId(removeSpaces(args[0]));
                        var query = { "_id" : id };
                        dbo.collection(collectionName).find(query).toArray(function(err, result) {
                            if (err) throw err;
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
                            }
                            else{
                                bot.sendMessage({
                                    to: channelID,
                                    message: "Could not find a cmd with id " + id
                                    });
                            }
                            bot.sendMessage({
                                to: channelID,
                                message: "```" + finalMessage + "```"
                                });
                            db.close();
                        });
                    }
                    catch(err) {
                        bot.sendMessage({
                            to: channelID,
                            message: "Invalid cmd ID, you may find cmd IDs by searching for a cmd name using !lscmd <cmd-name>"
                            });
                    }
                  }); 
            }
            else if (command === "deletecmd"){ //<cmd-id>
                MongoClient.connect(url, function(err, db) {
                    if (err) throw err;
                    var dbo = db.db("mydb");
                    var myquery = { _id: args[0] };
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
            else if(command === "lscmdname"){ //list cmds with the name <cmd-name>
                MongoClient.connect(url, function(err, db) {
                    if (err) throw err;
                    var dbo = db.db("mydb");
                    commandToQuery = removeSpaces(args[0]);
                    var query = { cmd: commandToQuery };
                    dbo.collection(collectionName).find(query).toArray(function(err, result) {
                      if (err) throw err;
                      for(i = 0; i < result.length; i++){   
                          //Builds a nicely formatted message string for one command
                            var finalMessage = ""
                            //asciiidoc allows for colors, the ==== under the line makes both the '=' and the above line blue
                            finalMessage = finalMessage + "```asciidoc\nCmd ID: " + result[i]._id + "\n================================\nCmd name :: [" + result[i].cmd + "]\nTags :: "
                            if(result[i].tags != undefined){
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
                            if(result[i].texts != undefined){
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
                            finalMessage = finalMessage + "```"
                            bot.sendMessage({
                                to: channelID,
                                message: finalMessage
                                });
                      }
                      db.close();
                    });
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
                                'Authorization': 'Token enRzYm90OjA1MzA3MTkyLWVkODEtNGM5My1iOTAxLWI2MjA4NTgzNjNkNQ==',
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
                    MongoClient.connect(url, function(err, db) { //!<cmd>
                        if (err) throw err;
                        var dbo = db.db("mydb");
                        var commandToQuery = removeSpaces(command);
                        var query = { cmd: commandToQuery };
                        dbo.collection(collectionName).find(query).toArray(function(err, result) {
                            if (err) throw err;
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
                                var tagsExists = false; //Check if there are missing values
                                var textExists = false;
                                var resultTextString;
                                var resultTagsString = "";
                                if(resultTags !== null){
                                    tagsExists = true;
                                    for(i = 0; i < resultTags.length; i++){
                                        resultTagsString = resultTagsString + resultTags[i];
                                    }
                                }
                                if(resultText !== null){
                                    textExists = true;
                                    var random = Math.floor((Math.random() * resultText.length));
                                    var resultTextString = resultText[random];
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
                                    //getRandomNekoImg(resultCmd);
                                }
                                else if(tagsExists && !textExists){
                                    getRandomNekoImg(resultTagsString);
                                }
                                else{
                                    getRandomNekoImg(resultCmd);
                                }
                            }
                            else{
                                bot.sendMessage({
                                    to: channelID,
                                    message: "Command not found"
                                });
                            }
                            
                          db.close();
                        });
                      });
                }
                catch(err){

                }
                
            }
            
         }
});