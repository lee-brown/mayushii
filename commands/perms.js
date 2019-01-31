const fs = require('fs');
module.exports = {
    addAdmin: function(id){
        var stringtoadd = id;
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
            fs.appendFile('../admin.txt', stringtoadd , function (err) {
                if (err){
                    logger.error(err);
                    throw err;
                } 
                });
        }
        else{
            sendMessage("Already exists");
        }
    },
    addPowerUser: function(id){
        var stringtoadd = id;
        stringtoadd = stringtoadd.replace(/<|>|@/g, '');
        var dataFromFile = fs.readFileSync('../power user' + '.txt');
        var data = dataFromFile.toString();
        var items = data.split('\n');
        var alreadyexists = false;
        for(i = 0; i < items.length; i++){
            if(items[i] === stringtoadd){
                alreadyexists = true;
            }
        }
        if(!alreadyexists){
            fs.appendFile('../power user.txt', stringtoadd , function (err) {
                if (err){
                    logger.error(err);
                    throw err;
                } 
                });
        }
        else{
            sendMessage("Already exists");
        }
    },
    permissions: function(user, rank){ //returns true if user has correct permissions
        user = user.toString();
        var permission = false;
        for(i = 0; i < rank.length; i++){ //Check all ranks that have permission to do the action
            var dataFromFile = fs.readFileSync(rank[i] + '.txt');
            var dataaa = dataFromFile.toString();
            var items = dataaa.split('\n');
            for(j = 0; j < items.length; j++){
                if(items[j] == user){
                    permission = true;
                }
            }
        }
        if(permission){
            return true;
        }
        else{
            sendMessage("Sorry, you do not have permission to do that, contact an admin");
            return false;
        }
    }

}
