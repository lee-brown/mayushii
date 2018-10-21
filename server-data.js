var database = require('./db-access.js');
var tools = require('./tools.js');
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
                    res("https://nekobooru.xyz/data/posts/18_9f7a09bdc35dfd01.png");
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
        argstring = message.split("!newcmd ");
        argstring = argstring[1];
        argstring = argstring.split('|');
        var tagsArray = undefined;
        var textArray = undefined;
        if(argstring[0] !== undefined){
            argstring[0] = tools.removeSpaces(argstring[0]); //Spaces are only important for text
        }
        if(argstring[1] !== undefined){
            tagsArray = tools.removeSpaces(argstring[1]).split('&'); //Allows for multiple texts or tags to be put in at once
        }
        if(argstring[2] !== undefined){
            textArray = argstring[2].split('&');
        }
        thingToPass = {cmd: argstring[0], tags: tagsArray, texts: textArray };
        database.insert(collectionName, url, thingToPass); 
    },
    newCmdr: function(collectionName, url, argstring){
        argstring = message.split("!newcmdr ");
        argstring = argstring[1];
        argstring = argstring.split('|');
        var subreddits = undefined;
        var type = undefined;
        if(argstring[0] !== undefined){
            argstring[0] = tools.removeSpaces(argstring[0]); 
        }
        if(argstring[1] !== undefined){
            subreddits = tools.removeSpaces(argstring[1]);
        }
        if(argstring[2] !== undefined){
            type = tools.removeSpaces(argstring[2]);
        }
        
        thingToPass = {cmd: argstring[0], subreddit: subreddits, type: type };
        database.insert(collectionName, url,thingToPass); 
    },
    updateCmd: function(command, argsString){
        try{
            var id = ObjectId(tools.removeSpaces(args[0]));
            var query = { _id: id };
            argsString = argsString.split('|');
            argsString = argsString[1]; //<tags>
            var tagsArray = undefined;
            var textArray = undefined;
            if(argsString !== undefined){
                var newvalues;
                if(command === "updatecmd-tag"){
                    tagsArray = tools.removeSpaces(argsString).split('&'); //Allows for multiple texts or tags to be put in at once
                    newvalues = { $set: {tags: tagsArray}}; //update tags
                }
                else if (command === "updatecmd-text"){
                    textArray = argsString.split('&'); //Allows for multiple texts or tags to be put in at once
                    newvalues = { $set: {texts: textArray}}; //update tags
                }
                else if (command === "updatecmd-subr"){
                    subreddits = tools.removeSpaces(argsString);
                    newvalues = { $set: {subreddit: subreddits}}; 
                }
            }
            database.update(query, newvalues);
        }
        catch(err)
        {
            sendMessage("Invalid id");
        }
    },
    addTag: function(command, argsString){
        try{
            var id = ObjectId(tools.removeSpaces(args[0]));
            var query = { _id: id };
            const found = database.find(collectionName, url,query);
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
                        itemsArray = tools.removeSpaces(argsString).split('&'); //Allows for multiple texts or tags to be put in at once
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
                database.update(query, newvalues);
            });
        }
        catch(err)
        {
            sendMessage("Invalid id");
        }
    },
    delTag: function(command, args){
        try{
            var id = ObjectId(tools.removeSpaces(args[0]));
            var query = { _id: id };
            var index = tools.removeSpaces(args[1]);
            const found = database.find(collectionName, url,query);
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
                    database.update(query, newvalues);
                }
                catch(err){
                    sendMessage("You entered an invalid index");
                }
                db.close();
            });
        }
        catch(err)
        {
            sendMessage("Invalid id");
        }
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