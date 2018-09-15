var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
            break;
            case 'irbz':
                var SpellChecker = require('simple-spellchecker');
                var fixedString = "Translation: ";
                SpellChecker.getDictionary("en-GB", function(err, dictionary) {
                    if(!err) {
                        foreach(el in args)
                        {
                            var misspelled = !dictionary.spellCheck(el);
                            if(misspelled) {
                               
                                var suggestions = dictionary.getSuggestions(el);
                                bot.sendMessage({
                                    to: channelID,
                                    message: suggestions[0]
                                });
                                fixedString = fixedString + (suggestions[0]);
                            }
                        }
                    }
                    else{
                        bot.sendMessage({
                            to: channelID,
                            message: "error"
                        });
                    }
                });
                bot.sendMessage({
                    to: channelID,
                    message: fixedString
                });
            break;
            default:
                bot.sendMessage({
                    to: channelID,
                    message: args
                });
         }
     }
});