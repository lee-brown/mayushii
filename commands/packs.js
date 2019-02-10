var serverdata = require('../commands/server-data.js');
var db = require('../db/db-access');
const fs = require('fs');
require('../tools/rng.js');
module.exports = {
    lspacks: function(){
        fs.readdir("./json-commands/", (err, files) => {
            var lspacks = "";
            if(files !== undefined){
                files.forEach(file => {
                    lspacks += "``" + file.substring(0, (file.length-5)) + "`` ";
                });
            }
            else{
                console.log("files not found");
            }
            sendMessage(lspacks);
        })
    },
    delpack: function(collection, url, packname){
        serverdata.lsCmdNames(collection, url, packname).then(function(result){
            var counter = 0;
            for(i = 0; i < result.length; i++){
                serverdata.deleteByID(collection, url, result[i]._id);
                counter++;
            }
            sendMessage(counter + " commands from " + packname + " deleted.");
        })
    },
    packinfo: function(packname){
        if (packname != undefined){
            if (fs.existsSync('./json-commands/' + packname + '.json')) {
                var pack = require('../json-commands/' + packname + '.json');
                var packmessage = "";
                for(i = 0; i < pack.cmds.length; i++){
                    packmessage += '``' + pack.cmds[i]["cmd"] + '`` ';
                }
                sendMessage(packmessage);
            }
            else{
                sendMessage("Pack not found, Use command the packs command to show all available packs");
            }
        }
        else{
            sendMessage("You need to specify the pack name to get the pack details, use packs to show all pack names");
        }
    },
    addpack: function(collectionName, url, packname){
        if (packname != undefined){
            if (fs.existsSync('./json-commands/' + packname + '.json')) {
                var pack = require('../json-commands/' + packname + '.json');
                var counter = 0;
                for(i = 0; i < pack.cmds.length; i++){
                    db.insertCMD(collectionName, url,pack.cmds[i], packname);
                    counter++;
                }
                sendMessage(counter + " commands added from " + packname);
            }
            else{
                sendMessage("Pack not found, Use the command 'packs' to show all available packs");
            }
        }
        else{
            sendMessage("You need to specify the pack name to add a pack, use 'packs' to show all pack names");
        }
    }
}