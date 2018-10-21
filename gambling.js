var database = require('./db-access.js');
require('./rng.js');
module.exports = {
    printCredits: function(collectionName, url, userID){
        const found = database.find(collectionName, url, { user: userID });
        found.then(function(result, err){
            if(result[0].credits > 750){
                sendMessage("<@!" + userID + ">" + " has " + result[0].credits + " credits! 😎");
            }
            else if(result[0].credits < 10){
                sendMessage("<@!" + userID + ">" + " only has "+ result[0].credits + " credits....... what are you doing with your life..?");
            }
            else if(result[0].credits < 100){
                sendMessage( "<@!" + userID + ">" + " has " + result[0].credits + " credits... better start saving up!");
            }
            else{
                sendMessage("<@!" + userID + ">" + " has " + result[0].credits + " credits.");
            }
        });
    },
    
    coinFlip: function(collectionName, url, userID, userBet, betAmount){ 
        getCredits(collectionName, url, userID).then(function(result, err){
            var possiblities = ["heads", "tails"];
            if(betAmount == undefined || betAmount == ""){
                betAmount = 100;
            }
            if(possiblities.includes(userBet) && result[0].credits >= betAmount){
                genRandomNumber(0,1).then(function(roll, err){
                    var message = "The coin has flipped in the air several times and lands...\n"
                    var credits = result[0].credits;
                    if(roll === 0 && userBet.toLowerCase() == "heads"){
                        message += "on heads, congratulations!" + "\n " + "<@!" + userID + ">" + " won " + betAmount + " credits!";
                        credits += betAmount;
                    }
                    else if (roll === 1 && userBet.toLowerCase() == "tails"){
                        message += "on tails, congratulations!"  + "\n"  + "<@!" + userID + ">" + " won " + betAmount + " credits!";
                        credits += betAmount;
                    }
                    else{
                        message += "on " + possiblities[roll] + ", unluck!"  + "\n"  + "<@!" + userID + ">" + " lost " + betAmount + " credits!";
                        credits -= betAmount;
                    }
                    updateCredits(collectionName, url, result[0].id, userID, credits);
                    sendMessage(message);
                });
            }
            else{
                sendMessage("Either you don't have enough credits to make this gamble or you formatted the command incorrectly.");
            }
        });
    },
    slots: function(collectionName, url, userID){
        getCredits(collectionName, url, userID).then(function(result, err){
            var possiblities = ["🍉", "🍒", " :seven: ", "🔔", "🍋"];
            var betAmount = 50;
            var credits = result[0].credits - betAmount;
            var originalCredits = result[0].credits;
            if(result[0].credits >= betAmount){
                genRandomNumber(0,4).then(function(numbers, err){
                genRandomNumber(0,4).then(function(numbers1, err){
                genRandomNumber(0,4).then(function(numbers2, err){
                    var res1 = possiblities[numbers];
                    var res2 = possiblities[numbers1];
                    var res3 = possiblities[numbers2];
                    var message2 = "";
                    var message1 = res1 + res2 + res3;
                    sendMessage();
                    if(res1 == res2 && res2 == res3 && res1 == "🍋"){ 
                        credits += betAmount + 1;
                    }
                    else if(res1 == res2 && res2 == res3 && res1 == "🔔"){ 
                        credits += betAmount + 100;
                    }
                    else if(res1 == res2 && res2 == res3 && res1 == " :seven: "){
                        sendMessage("**JACKPOT!**");
                        credits += betAmount + 10000;
                    }
                    else if(res1 == res2 && res2 == res3 && res1 == "🍒"){ 
                        credits += betAmount + 50;
                    }
                    else if(res1 == res2 && res2 == res3 && res1 == "🍉"){ 
                        credits += betAmount + 25;
                    }
                    else if((res1 == "🍋" && res2 == "🍋" ) || (res2 == "🍋" && res3 == "🍋" )){
                        credits += betAmount;
                    }
                    else if((res1 == "🔔" && res2 == "🔔" ) || (res2 == "🔔" && res3 == "🔔")){ 
                        credits += betAmount + 50;
                    }
                    else if((res1 == " :seven: " && res2 == " :seven: " ) || (res2 == " :seven: " && res3 == " :seven: ")){ 
                        sendMessage("**MINI JACKPOT!**");
                        credits += betAmount + 500;
                    }
                    else if((res1 == "🍒" && res2 == "🍒" ) || (res2 == "🍒" && res3 == "🍒" )){ 
                        credits += betAmount + 25;
                    }
                    else if((res1 == "🍉" && res2 == "🍉" ) || (res2 == "🍉" && res3 == "🍉" )){
                        credits += betAmount + 15;
                    }
                    if(credits >= originalCredits){
                        message2 += "\nCongrats! " + "<@!" + userID + ">" +  " won " + (credits - originalCredits) + " credits!";
                    }
                    else{
                        message2 += "\n " + "<@!" + userID + ">" + " lost " + (originalCredits - credits) + " credits... unluck";
                    }
                    sendTwoInOrder(message1, message2);
                    updateCredits(collectionName, url, result[0].id, userID, credits);
                });
                });
                });
            }
            else{
                sendMessage("Either you don't have enough credits to make this gamble or you formatted the command incorrectly.");
            }
        });
    },
    addCredits: function(collectionName, url, args){
        var user = args[0];
        user = user.replace(/<|>|@/g, '');
        getCredits(collectionName, url, user).then(function(result, err){
            console.log(result);
            if(args[0] !== "" && args[1] !== "" && args[0] !== undefined && args[1] !== undefined){
                var credits = result[0].credits;
                credits += parseInt(args[1]);
                updateCredits(collectionName, url, result[0].id, user, credits)
            }
            else{
                sendMessage("Command formmated incorrectly");
            }
        });
        ;
    }
}
getCredits = function(collectionName, url, userID){
    return database.find(collectionName, url, { user: userID });
}
updateCredits = function(collectionName, url, id, userID, newCredits){
    database.update(collectionName, url, {user: userID}, {$set: {user: userID, credits: newCredits}} )
}