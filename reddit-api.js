require('dotenv').config();
require('./bot.js');
require('./rng.js');
const Snoowrap = require('snoowrap');
const r = new Snoowrap({
    userAgent: 'reddit-bot',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});
module.exports = {
    getHot: function(subreddit){
        return new Promise(function(res, err){
            r.getSubreddit(subreddit).getHot().then(posts => {
                var posts = posts.toJSON();
                res(posts);
            })
        })
    },
    printImg: function(posts){
        var images = new Array();
        var titles = new Array();
        var selftext = new Array();
        for(i = 0; i < posts.length; i++){ //Filter out any posts without an image
            if(posts[i].url.match(/\.(gif|jpg|jpeg|tiff|png)$/i)){
                images.push(posts[i].url);
                titles.push(posts[i].title);
                selftext.push(posts[i].selftext);
            }
        }
        var randomNo = genRandomNumber(0, titles.length - 1);
        randomNo.then(function(number){
            var text = "reddit.com/r/" + posts[number].subreddit;
            text = text.toLowerCase();
            var richembed = {
                'footer': {
                    'icon_url': "https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png",
                    'text': text
                },
                "title": titles[number],
                "description": selftext[number],
                'image': {
                    'url': images[number]
                },
            };
            sendEmbed(richembed);
        })
    },
    printPost: function(posts){
        var randomNo = genRandomNumber(0, posts.length - 1);
        randomNo.then(function(number){
            var text = "reddit.com/r/" + posts[number].subreddit;
            text = text.toLowerCase();
            var richembed = {
                'footer': {
                    'icon_url': "https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png",
                    'text': text
                },
                "title": posts[number].title,
                "description": posts[number].selftext
            };
            sendEmbed(richembed);
        })
    }
}
