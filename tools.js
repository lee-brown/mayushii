module.exports = {
    removeSpaces: function (item){ //Finds and removes spaces from a string
        if(item!= null || item != ""){
            item = item.replace(/\s/g, ''); 
            return item;
        }  
    },
    addUserId: function(originaltext, target){ //Replaces @user and @target with actual target and user tags
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
}
