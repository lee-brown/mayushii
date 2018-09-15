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
                var googlespell = require('googlespell');
                var checker = new googlespell.Checker({
                    threshold: 1,
                    language: 'en'
                });
                var stringToCheck = "";
                for(let i =0; i<args.length; i++) //Convert to string
                {
                    stringToCheck = stringToCheck + args[i];
                }
                checker.check(stringToCheck, function(err, result) {
                    bot.sendMessage({
                        to: channelID,
                        message: result['context']
                    });
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