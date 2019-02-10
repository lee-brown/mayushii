//Create/modify/delete certain objects in the database
var database = require('../db/db-access.js')
    , tools = require('../tools/tools.js');
const {ObjectId} = require('mongodb');
module.exports = {
    setPrefix: function(args){
        args[1] = tools.removeSpaces(args[1]);
        var query = { projection: { _id: 1, cmdprefix: 1} }
        const found = database.find(collectionName, url,{}, query);
        found.then(function(result){
            var formattedResult = new Array();
            for(i=0;i<result.length;i++){
                if(result[i].cmdprefix !== undefined){
                    formattedResult.push(result[i]);
                }
            }
            if(formattedResult.length === 0){
                var query = { cmdprefix: args[1]};
                database.insert(collectionName, url,query);
            }
            else{
                var id = formattedResult[0]._id;
                var query = { $set: {cmdprefix: args[1]}};
                database.update({_id: id}, query);
            }
            
        })
    },
    getMetaData: function(collectionName, url){
        var query = { projection: { _id: 0, cmdprefix: 1} }
        const found = database.find(collectionName, url, {}, query);
        found.then(function(result){
            console.log(result)
        });
        
    },
    getPrefix: function(collectionName, url){
        return new Promise(function(res, rej) {
            var query = { projection: { _id: 0, cmdprefix: 1} }
            const found = database.find(collectionName, url, {}, query);
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
    },
    getColor: function(collectionName, url){
        return new Promise(function(res, rej) {
            var query = { projection: { _id: 0, color: 1} }
            const found = database.find(collectionName, url,{}, query);
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
    },
    getImage: function(collectionName, url){
        return new Promise(function(res, rej) {
            var query = { projection: { _id: 0, image: 1} }
            const found = database.find(collectionName, url,{}, query);
            found.then(function(result){
                if(result.length === 0 || result[0].image === undefined){
                    res("https://nekobooru.xyz/data/posts/900_5f4e648619cade93.png");
                }
                else{
                    res(result[0].image);
                }
            });
        }).catch({code: "An error occured: getPrefix()"}, function(err) {
            console.log(err);
        });
    },
    setImage: function(args){
        args[0] = tools.removeSpaces(args[0]);
        var query = { projection: { _id: 1, image: 1} }
        const found = database.find(collectionName, url,{}, query);
        found.then(function(result){
            var formattedResult = new Array();
            for(i=0;i<result.length;i++){
                if(result[i].image !== undefined){
                    formattedResult.push(result[i]);
                }
            }
            if(formattedResult.length === 0){
                var query = { image: args[0]};
                database.insert(collectionName, url,query);
            }
            else{
                var id = formattedResult[0]._id;
                var query = { $set: {image: args[0]}};
                database.update({_id: id}, query);
            }
        })
    },
    setColor: function(args){
        args[0] = tools.removeSpaces(args[0]);
        var query = { projection: { _id: 1, color: 1} }
        if(args[0].length === 8){
            const found = database.find(collectionName, url,{}, query);
            found.then(function(result){
                var formattedResult = new Array();
                for(i=0;i<result.length;i++){
                    if(result[i].color !== undefined){
                        formattedResult.push(result[i]);
                    }
                }
                if(formattedResult.length === 0){
                    var query = { color: args[0]};
                    database.insert(collectionName, url,query);
                }
                else{
                    var id = formattedResult[0]._id;
                    var query = { $set: {color: args[0]}};
                    database.update({_id: id}, query);
                }
                
            })
        }
        else{
            sendMessage("Color is a 8 digit number");
        }
    },
    newCmd: function(collectionName, url, argstring){
        argstring = argstring.split('|');
        var obj = {};
        
        // cmdsource,  cmd,  subreddit/tags,  texts/type
        if(argstring[0] !== undefined){
            argstring[0] = tools.removeSpaces(argstring[0]); 
            obj["cmdsource"] = argstring[0];
            if(argstring[1] !== undefined){
                argstring[1] = tools.removeSpaces(argstring[1]); 
                obj["cmd"] = argstring[1];
                if(obj["cmdsource"] === "neko"){
                    if(argstring[2] !== undefined){
                        obj["tags"] = tools.removeSpaces(argstring[2]).split('&'); 
                    }
                    if(argstring[3] !== undefined){
                        obj["texts"] = argstring[3].split('&');
                    }
                }
                else if (obj["cmdsource"] === "reddit"){
                    if(argstring[2] !== undefined){
                        obj["subreddit"] = tools.removeSpaces(argstring[2]); 
                    }
                    if(argstring[3] !== undefined){
                        obj["type"] = argstring[3];
                    }
                }
                else if(obj["cmdsource"] === "text"){
                    obj["texts"] = argstring[2].split('&');
                }
                database.insert(collectionName, url, obj); 
            }
            else{
                sendMessage("Please give a cmd name.");
            }
        }
        else{
            sendMessage("Please add a cmd source (neko/reddit)");
        }
    },
    updateCmd: function(command, argsString){
        try{
            argsString = argsString.split('|');
            var id = ObjectId(tools.removeSpaces(argsString[1]));
            var itemtoupdate = tools.removeSpaces(argsString[0]);
            var query = { _id: id };
            argsString = argsString[2]; //<tags>
            var tagsArray = undefined;
            var textArray = undefined;
            var newvalues;

            if(itemtoupdate === "tag"){
                tagsArray = tools.removeSpaces(argsString).split('&'); //Allows for multiple texts or tags to be put in at once
                newvalues = { $set: {tags: tagsArray}}; //update tags
            }
            else if (itemtoupdate === "text"){
                textArray = argsString.split('&'); //Allows for multiple texts or tags to be put in at once
                newvalues = { $set: {texts: textArray}}; //update tags
            }
            else if (itemtoupdate === "subreddit"){
                subreddits = tools.removeSpaces(argsString);
                newvalues = { $set: {subreddit: subreddits}}; 
            }
            database.update(query, newvalues);
        }
        catch(err)
        {
            sendMessage("Invalid id");
        }
    },
    deleteByID: function(collectionName, url, id){
        id = ObjectId(id);
        database.delete(collectionName, url, { _id: id });
    },
    cmdDetails: function(args){
        try {
            var id = ObjectId(tools.removeSpaces(args[0]));
            var query = { "_id" : id };
            const found = database.find(collectionName, url,query);
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
                        sendMessage("```" + finalMessage + "```");
                    }
                }
            });
        }
        catch(err) {
            sendMessage("Invalid id");
        }
    },
    lsCmdNames: function(collectionName, url,packname){
        var query = { pack: tools.removeSpaces(packname) };
        return found = database.find(collectionName, url,query);
    },
    lsCmdName: function(collectionName, url,args){
        var query = { cmd: tools.removeSpaces(args[0]) };
        const found = database.find(collectionName, url,query);
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
                sendMessage(finalMessage);
            }
        });
    }
}