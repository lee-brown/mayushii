# mayushii
A customizable and feature rich discord bot

## Features

* Support for 
  * Szurubooru's API (for websites like nekobooru.xyz) 
  * Reddit API for pictures and text
  * Wolframalpha API for calculations
* Customization options (prefix, rich embed color, image etc)
* Commands can be created and edited by users within discord itself
  * These commands can return reddit images, reddit text posts, nekobooru.xyz images, and text (which can include discord tags)
  * The name of the command can be created by the user (e.g !usercreatedcommand)
  * If there are multiple commands with the same name, a random one will be chosen
* Customization and custom commands are all tied to your personal discord server
* Basic permissions system
* Dynamically generated help command
* Easily add many commands to the bot using .JSON files (see default-commands.json) (only for the admin of the bot for now)
* Some fun commands include: !rate !flip !say !bigsay !vote !rps

## To install

* Clone to desired folder
* Install MongoDB 
* Install discord.io and other dependencies with npm
* Enter discord bot token in auth.json
* Enter nekobooru token in auth-nekobooru.json 
* Enter wolframalpha token in auth-wolframalpha.json
* Go to [Reddit and create an app](https://www.reddit.com/prefs/apps) (make sure you select script)
* Then create a file called ".env" (without quotes) and fill in and add the following lines (from information from the reddit app you created):
  * CLIENT_ID=
  * CLIENT_SECRET=
  * REDDIT_USER=
  * REDDIT_PASS=
* Run bot.js with nodejs
