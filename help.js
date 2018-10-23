
module.exports = {
    generalHelp: function(collectionName, url, image){
        var database = require('./db-access.js');
        const custcmds = database.getCmds(collectionName, url,"custom");
        custcmds.then(function(custcmds){//get customcmds
            var database = require('./db-access.js');
            const defaultcmds = database.getCmds(collectionName, url,"default");
            defaultcmds.then(function(defaultcmds){//get defaultcmds
            var richembed = {
                "title": "Tuturuu~ Here is a list of commands",
                "description": "Check the other help commands for more features such as !upload and don't forget you can upload reaction images for this bot at nekobooru.xyz",
                "thumbnail": {
                    "url": image
                },
                "fields": [
                    {
                        "name": "Default Image and message commands",
                        "value": "These commands create a message or image or both. \n" + defaultcmds,
                        "inline": true
                    },
                    {
                        "name": "Custom Image and message commands",
                        "value": "Additional commands can be created from discord chat (check " + c("help-customcmd") + ")\n" + custcmds,
                        "inline": true},
                        {
                        "name": "Fun/useful commands",
                        "value": c("rate") + c("flip") + c("say") + c("bigsay") + c("vote") + c("rps") + c("eval") + c("credits") + c("slots") + c("gambleflip") + c("richlist") + c("fancy") + c("spaced") + c("metal")+ c("smallcaps")+ c("upsidedown")+ c("bubble"),
                        "inline": true
                    },
                    {
                        "name": "Permissions (!add-admin <tagged-user>)",
                        "value": c("add-admin") + c("add-poweruser"),
                        "inline": true
                    },
                    {
                        "name": "Other",
                        "value": c("suggest") + " ``prefix`` "+ " ``!setprefix`` " + c("setcolor") + "(8 digit hex code)" + c("setimage") + "(URL)",
                        "inline": true
                    },
                    {
                        "name": "Help",
                        "value":  c("help-text") + c("help-gamble") + c("help-nekobooru") + c("help-customcmd") + c("help-reddit"), 
                        "inline": true
                    }
                ]
                }
                sendEmbed(richembed);
                sendMessage("The help page is dynamically generated, if you customize the bot (new prefix, custom commands etc) you will have to do " + c("help") + "again to get the updated command list");
            });
        });
    },
    customCmdsHelp: function(image){
        var customCmdsLines = [
            "Create your own image and message commands! If multiple commands have the same name a random command with that name will be chosen. Same goes for commands with multiple messages. You can also '&' to add multiple tags/message",
            c("newcmd") + " **Create a new custom command**",
            "<cmd-name> | <tag> *&<tag2>* | <message> *&<message2>*",
            c("updatecmd-text") + " **and**" + c("updatecmd-tag") + "**Replace the tags/message**",
            "<cmd-id> | <tag> *&<tag2>* ",
            c("add-tag") + " **and** " + c("add-text") + "**add tags/message to an existing cmd**",
            "<id> | <item> *&<item2>*",
            c("del-tag") + " **and** " + c("del-text") + "**Delete tag/message in existing cmd**",
            "<id> <index>",
            c("cmd-details") + " **Details of a specific cmd**",
            "<cmd-id>",
            c("deletecmd") + " **delete a specific cmd**",
            "<cmd-id>",
            c("lscmdname") + " **list cmds with same cmd name (gives cmd-ids)**",
            "<cmd-name>",
            c("ls-allcmds") + c("ls-defaultcmds") + c("ls-customcmds"),
        ]
        var customCmdsString = "";
        for(i = 0; i < customCmdsLines.length; i++){
            customCmdsString = customCmdsString + customCmdsLines[i] + "\n";
        }
        var richembed = {
            "title": "Tuturuu~ Here is how you can create commands",
            "thumbnail": {
              "url": image
            },
            "fields": [
                {
                    "name": "Custom command creation",
                    "value": customCmdsString,
                    "inline": true
                }
            ]
        }
        sendEmbed(richembed);
    },
    redditHelp: function(image){
        var customCmdsLines = [
            "Create your own reddit commands! If multiple commands have the same name a random command with that name will be chosen. Same goes for commands with multiple messages. You can choose to filter out text posts by using the img option in !newcmdr",
            c("newcmdr") + " **Create a new custom command**",
            "<cmd-name> | <subreddit> | <img/post (default is post)>",
            c("updatecmd-subr") + "**Replace the subreddit**",
            "<cmd-id> | <subreddit>* ",
            c("cmd-details") + " **Details of a specific cmd**",
            "<cmd-id>",
            c("deletecmd") + " **delete a specific cmd**",
            "<cmd-id>",
            c("lscmdname") + " **list cmds with same cmd name (gives cmd-ids)**",
            "<cmd-name>",
            c("rpost") + " **Gets random img from Hot from specified subreddit**",
            "<subreddit>",
            c("rimg") + " **Gets random img from Hot from specified subreddit**",
            "<subreddit>",
        ]
        var customCmdsString = "";
        for(i = 0; i < customCmdsLines.length; i++){
            customCmdsString = customCmdsString + customCmdsLines[i] + "\n";
        }
        var richembed = {
            "title": "Tuturuu~ Here is how you can create commands",
            "thumbnail": {
              "url": image
            },
            "fields": [
                {
                    "name": "Custom command creation",
                    "value": customCmdsString,
                    "inline": true
                }
            ]
        }
        sendEmbed(richembed);
    },
    nekoHelp: function(image){
        var nekobooruLines = [
            c("tag") + "**Returns random image with given tag(s)**",
            "<tag> *<tag2>*",
            c("upload") + "**Upload from a given URL with certain tag(s)**",
            "<url> <tag> *<tag2>*",
            c("newtag") + "**Create tag and its aliases (Default category)**",
            "<tag> *<tag-alias>*",
            c("newcategorytag") + "**Same as above but can specify category**",
            "<tag-category> <tag> *<tag2>*"
        ]
        var nekobooruString = "";
        for(i = 0; i < nekobooruLines.length; i++){
            nekobooruString = nekobooruString + nekobooruLines[i] + "\n";
        }
        var richembed = {
            "title": "Tuturuu~ Here is how you can interact with nekobooru.xyz",
            "thumbnail": {
              "url": image
            },
            "fields": [
                {
                    "name": "Nekobooru commands",
                    "value": nekobooruString,
                    "inline": true
                }
            ]
        }
        sendEmbed(richembed);
    },
    gambleHelp: function(image){
        var gambleLines = [
            c("slots") + "**Roll a slot machine - costs 50 credits**\n",
            c("gambleflip") + "**Flip a coin and bet a certain amount**",
            "<heads/tails> <bet-amount>",
            c("credits") + "**See how many credits you have**",
            c("richlist") + "**See who the filthy 1% are**",
        ]
        var gambleString = "";
        for(i = 0; i < gambleLines.length; i++){
            gambleString = gambleString + gambleLines[i] + "\n";
        }
        var richembed = {
            "title": "Tuturuu~ Here is how you throw your money away",
            "thumbnail": {
              "url": image
            },
            "fields": [
                {
                    "name": "Gambling commands",
                    "value": gambleString,
                    "inline": true
                }
            ]
        }
        sendEmbed(richembed);
    },
    textHelp: function(image){
        var textLines = [
            c("fancy") + c("spaced") + c("metal")+ c("smallcaps")+ c("upsidedown")+ c("bubble")
        ]
        var textString = "";
        for(i = 0; i < textLines.length; i++){
            textString = textString + textLines[i] + "\n";
        }
        var richembed = {
            "title": "Tuturuu~ Here is how you can style up your text",
            "thumbnail": {
              "url": image
            },
            "fields": [
                {
                    "name": "Text commands \n(e.g !fancy this text will be fancy)",
                    "value": textString,
                    "inline": true
                }
            ]
        }
        sendEmbed(richembed);
    }
}