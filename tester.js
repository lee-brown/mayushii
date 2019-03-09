//This file tests the functionality of the bot before launch

var schedule = require('node-schedule')
    , Discord = require('discord.io')
    , winston = require('winston')
    , database = require('./db/db-access.js')
    , neko = require('./api/nekobooru-api.js')
    , reddit = require('./api/reddit-api.js')
    , wolfram = require('./api/wolfram-api.js')
    , fun = require('./commands/fun.js')
    , help = require('./commands/help.js')
    , perms = require('./commands/perms.js')
    , serverData = require('./commands/server-data.js')
    , tools = require('./tools/tools.js')
    , gamble = require('./commands/gambling.js') //Economy/gambling functions
    , texts = require('./commands/text.js') //Fancy text functions
    , packs = require('./commands/packs.js')
	, bot = require('./bot');

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
	  new winston.transports.Console(),
	  new winston.transports.File({ filename: 'logfile.log' })
	]
});
module.exports = {
	test: [
		function AuthTest() {
			if (process.env.NEKO_AUTH === undefined) {
				logger.error("Missing Nekobooru authentication");
			}
			if (process.env.CLIENT_ID === undefined || process.env.CLIENT_SECRET === undefined || process.env.REDDIT_USER === undefined || process.env.REDDIT_PASS === undefined) {
				logger.error("Missing Reddit authentication");
			}
			if (process.env.DISCORD_AUTH === undefined) {
				logger.error("Missing Discord authentication")
			}
			if (process.env.WOLF_AUTH === undefined) {
				logger.error("Missing WolframAlpha authentication")
			}
		},

	]
}
