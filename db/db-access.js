var mongo = require('mongodb');
var Promise = require("bluebird");
var MongoClient = mongo.MongoClient;
var tools = require('../tools/tools.js');
module.exports = {
    initial: function(collectionName, url){
        MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mayushii");
            dbo.createCollection(collectionName, function(err, res) {
                if (err) throw err;
                db.close();
            });
        });
    },
    find: function(collectionName, url, query, query2){ //Finds stuff based on _id (query = _id object)
        return find(collectionName, url, query, query2);
    },
    insert: function(collectionName, url, query){ //Inserts one item
        return insert(collectionName, url, query);
    },
    update: function(collectionName, url, query, newvalues){//Updates one item with certain _id (query = _id object)
        MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mayushii");
            dbo.collection(collectionName).updateOne(query, newvalues, function(err, res) {
                if (err) throw err;
                db.close();
            });
        }); 
    },
    replace: function(collectionName, url, query, newvalues){
        MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mayushii");
            dbo.collection(collectionName).replaceOne(
                query,
                newvalues, function(err, res) {
                    if (err) throw err;
                    db.close();
                }
             );
        }); 
    },
    delete: function(collectionName, url, myquery){
        MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mayushii");
            dbo.collection(collectionName).deleteOne(myquery, function(err, obj) {
                if (err) throw err;
                db.close();
            });
        }); 
    },
    startover: function(collectionName, url){
        MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mayushii");
            dbo.collection(collectionName).drop(function(err, delOK) {
                if (err) throw err;
                if (delOK) console.log("Collection deleted");
                db.close();
            });
        });
        MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mayushii");
            dbo.collection("playlists").drop(function(err, delOK) {
                if (err) throw err;
                if (delOK) console.log("Collection deleted");
                db.close();
            });
        });
    },
    insertCMD: function(collectionName, url, singlecommand){ //Format object for single cmd and insert if not exist (used for seeder files)
        var tagsArray = undefined;
        var textArray = undefined;
        var subreddits = undefined;
        var type = undefined;
        if(singlecommand.tags !== undefined){
            tagsArray = tools.removeSpaces(singlecommand.tags.toString()).split('&'); //Allows for multiple texts or tags to be put in at once
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
        insertIfNotExist(collectionName, url, query, toInsert); 
    },
    insertUser: function(collectionName, url, userObject){ 
        var query = {  user: userObject.user};
        insertIfNotExist(collectionName, url, query, userObject); 
    },
    getCmds: function(collectionName, url, typeOfCmd){ //Returns cmd names (typeOfCmd is a string either "custom" or "default" or "all")
    return new Promise(function(res, rej) {
        const found = find(collectionName, url, {}, { projection: { _id: 0, cmd: 1} });
        found.then(function(result, err){
            var defaultCommands = require('../json-commands/default-commands.json');
            var finalmessage = "";
            if (err) throw err;
            var alphabetical = new Array;
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
                            break;
                        }
                        if(typeOfCmd == "custom"){
                            insert = false;
                            break;
                        }
                    }
                }
                if(insert){
                    if(result[i].cmd !== undefined){//Only happens with customcmds
                        alphabetical.push(result[i].cmd);
                    }
                }
            }
            alphabetical.sort();
            for(i =0;i<alphabetical.length;i++){
                if(i>0){
                    if(c(alphabetical[i]) !== c(alphabetical[i-1])){ //Prevent duplicates
                        finalmessage = finalmessage + c(alphabetical[i]);
                    }
                }
                else{
                    finalmessage = finalmessage + c(alphabetical[i]);
                }
            }
            res(finalmessage);
        });
    });
}
}
insert = function(collectionName, url, query){ //Inserts one item
    MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mayushii");
        dbo.collection(collectionName).insertOne(query, function(err, res) {
          if (err) throw err;
          db.close();
        });
    }); 
},
insertIfNotExist = function(collectionName, url, query, toInsert){//Function that will only insert if the cmd can't be found in the database 
    return new Promise(function(res, rej) {
        const found = find(collectionName, url, query);
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
            insert(collectionName, url, toInsert);
        }
    }).catch({code: "An error occured"}, function(err) {
        console.log(err);
    });
}
find = function(collectionName, url, query, query2){ //Finds stuff based on _id (query = _id object)
    return new Promise(function(res, rej) {
        MongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
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