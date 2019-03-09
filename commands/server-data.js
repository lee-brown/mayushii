//Create/modify/delete certain objects in the database
var database = require('../db/db-access.js');
var tools = require('../tools/tools');
const {ObjectId} = require('mongodb');
module.exports = {
    getMetaDataServer: function (collectionName, url) { // Returns the metadata object which contains color,image and prefix
        return new Promise(function (res, rej) {
            var query = { projection: { _id: 0, metadata: 1 } }
            const found = database.find(collectionName, url, {}, query);
            found.then(function (metadata) {
                if (metadata.length > 0) { //If data exists use the first entry
                    res(metadata[0].metadata);
                }
                else {
                    res(setNewMetaData(collectionName, url)); 
                }
            });
        }).catch({ code: "An error occured: metadata error" }, function (err) {
            console.log(err);
        });
    },
    setMetaData: function (collectionName, url, item, type) {//type is the type of metadata (cmdprefix, image or color)
        var query = { projection: { _id: 1, metadata: 1 } };
        database.find(collectionName, url, {}, query).then(function (data) {

            //Get relevant data from search
            var metadataIndex;
            for (i = 0; i < data.length; i++) { //find metadata from data (mongo returns many empty _id properties)
                if (data[i].metadata !== undefined) {
                    metadataIndex = [i];
                    break;
                }
            }
            var metadata = data[metadataIndex].metadata;
            metadata[type] = item.trim();

            //Validate the data
            var isValid = true;
            if (type === "color") {
                if (metadata[type].length !== 8) {
                    sendMessage("The color should be an 8 digit number");
                    isValid = false;
                }
                else {
                    sendMessage("Color has been updated to " + metadata[type]); // todo: change this to richembed?
                }
            }
            else if (type === "cmdprefix") {
                sendMessage("Prefix has been updated to " + "``" + metadata[type] + "``")
            }
            else if (type === "image") {
                if (!tools.isURL(metadata[type])) {
                    sendMessage("Please enter a valid URL to get the image from");
                    isValid = false;
                }
            }

            //Update the db
            if (isValid) {
                database.update(collectionName, url, { _id: data[metadataIndex]._id }, { $set: { metadata: metadata } });
            }
        });
    },
    newCmd: function(collectionName, url, argstring){
        argstring = argstring.split('|');
        var obj = {};
        
        // cmdsource,  cmd,  subreddit/tags,  texts/type
        if(argstring[0] !== undefined){
            argstring[0] = argstring[0].trim(); 
            obj["cmdsource"] = argstring[0];
            if(argstring[1] !== undefined){
                argstring[1] = argstring[1].trim(); 
                obj["cmd"] = argstring[1];
                if(obj["cmdsource"] === "neko"){
                    if(argstring[2] !== undefined){
                        obj["tags"] = argstring[2].trim().split('&'); 
                    }
                    if(argstring[3] !== undefined){
                        obj["texts"] = argstring[3].split('&');
                    }
                }
                else if (obj["cmdsource"] === "reddit"){
                    if(argstring[2] !== undefined){
                        obj["subreddit"] = argstring[2].trim(); 
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
            var id = ObjectId(argsString[1].trim());
            var itemtoupdate = argsString[0].trim();
            var query = { _id: id };
            argsString = argsString[2]; //<tags>
            var tagsArray = undefined;
            var textArray = undefined;
            var newvalues;

            if(itemtoupdate === "tag"){
                tagsArray = argsString.trim().split('&'); //Allows for multiple texts or tags to be put in at once
                newvalues = { $set: {tags: tagsArray}}; //update tags
            }
            else if (itemtoupdate === "text"){
                textArray = argsString.split('&'); //Allows for multiple texts or tags to be put in at once
                newvalues = { $set: {texts: textArray}}; //update tags
            }
            else if (itemtoupdate === "subreddit"){
                subreddits = argsString.trim();
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
            var id = ObjectId(args[0].trim());
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
        var query = { pack: packname.trim() };
        return found = database.find(collectionName, url,query);
    },
    lsCmdName: function(collectionName, url,args){
        var query = { cmd: args[0].trim() };
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

function setNewMetaData(collectionName, url) { //Create default metadata in db if it doesnt exist already and returns a default metadata
    var metadataObj = {
        color: "15277667",
        cmdprefix: "!",
        image: "https://nekobooru.xyz/data/posts/900_5f4e648619cade93.png"
    }
    var query = { metadata: metadataObj }
    database.insert(collectionName, url, query);
    return metadataObj;
}