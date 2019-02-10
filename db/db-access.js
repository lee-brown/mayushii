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
    insertCMD: function(collectionName, url, singlecommand, packname){ //Format object for single cmd and insert if not exist (used for seeder files)
        var query = { cmd: singlecommand.cmd};
        var toInsert = singlecommand;
        if(packname !== undefined){
            toInsert["pack"] = packname;
        }
        insertIfNotExist(collectionName, url, query, toInsert); 
    },
    insertUser: function(collectionName, url, userObject){ 
        var query = {  user: userObject.user};
        insertIfNotExist(collectionName, url, query, userObject); 
    },
    getPackCmds: function(collectionName, url){ //Returns pack names and their associated cmds [[pack-name, cmd1, cmd2], [pack-name, cmd1, cmd2]...]
    return new Promise(function(res, rej) {
        const found = find(collectionName, url, {}, { projection: { _id: 0, cmd: 1, pack: 1} });
        found.then(function(result, err){
            const fs = require('fs');
            fs.readdir("./json-commands/", (err, files) => {
            var lspacks = new Array();
            if(files !== undefined){
                files.forEach(file => {
                    lspacks.push([file.substring(0, (file.length-5))]);
                });
            }
            else{
                console.log("files not found");
            }
            for(i = 0; i < result.length; i++){
                var index = 0;
                for(j = 0; j < lspacks.length; j++){
                    if(result[i].pack === lspacks[j][0]){
                        index = j;
                        break;
                    }
                }
                lspacks[index].push(result[i].cmd);
            }
            res(lspacks);
        });
    });
})
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
}
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