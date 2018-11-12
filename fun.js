
require('./rng.js');
var Promise = require("bluebird");
var perms = require('./perms.js');
module.exports = {
    bigsay: function(text){
        var finalmessage = "";
        var invalidInput = false;
        var numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        for(i = 0; i < text.length; i++){
            if(text[i].match(/[a-zA-Z\s]+/)){
                var formatted = text[i].toLowerCase();
                if(text[i] === " "){
                    finalmessage = finalmessage + " ";
                }
                else{
                    finalmessage = finalmessage + ":regional_indicator_" + formatted + ":";
                }
            }
            else if (text[i].match(/[0-9]+/)){
                finalmessage = finalmessage + ":" + numbers[text[i]] + ":";
            }
            else{
                invalidInput = true;
            }
        }
        if(invalidInput){
            finalmessage = "Only alphanumeric values are allowed";
        }
        sendMessage(finalmessage);
    },
    rps: function(){
        Promise.try(function() {
            return genRandomNumber(0, 2);
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
            sendMessage(result);
        }).catch({code: "RandomGenerationError"}, function(err) {
            console.log(err);
        });
    },
    say: function(input,args, userID){
        //Check if text contains a command (only admins should have the power to do this)
        if(input.length > 0){
            if(input[0] == '!'){
                containscommand = true;
            }
        }
        else{
            containscommand = false;
        }
        if(!containscommand || perms.permissions(userID, ['admin'])){
            var text = "";
            for(i = 0; i < args.length; i++){
                text = text + args[i] + " ";
            }
            sendMessage(text);
        }
        else{
            sendMessage(text);
        }
    },
    flip: function(){
        Promise.try(function() {
            return genRandomNumber(0, 1);
        }).then(function(number) {
            var result;
            if(number == 1){
                result = "It landed on heads";
            }
            else{
                result = "It landed on tails";
            }
            sendMessage(result);
        }).catch({code: "RandomGenerationError"}, function(err) {
            console.log(err);
        });
    },
    rate: function(){
        Promise.try(function() {
            return genRandomNumber(0, 10);
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
            sendMessage(text);
        }).catch({code: "RandomGenerationError"}, function(err) {
            console.log(err);
        });
    },
    vote: function(userID, avatarArg, usernameArg, argsString){
        var avatar = "https://cdn.discordapp.com/avatars/" + userID + "/" + avatarArg + ".png?size=128";
        var username = usernameArg;
        var richembed = {
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
        sendVote(richembed);
    }
}