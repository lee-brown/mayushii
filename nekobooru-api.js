var authnekobooru = require('./auth-nekobooru.json');
var nekobooruToken = "Token " + authnekobooru.token;
require('./rng.js');
const axios = require('axios');
module.exports = {
    getRandomImg: function (tags){ 
        axios.get('https://nekobooru.xyz/api/posts/?query=' + tags + ",image" + ",anim", {},{
            })
            .then(response =>{ 
                var randomNo = genRandomNumber(0, response.data.results.length - 1);
                randomNo.then(function(number){
                    var richembed = {
                        'footer': {
                            'icon_url': "https://nekobooru.xyz/img/favicon.png",
                            'text': 'nekobooru.xyz'
                        },
                        'image': {
                            'url': "https://nekobooru.xyz/" +  response.data.results[number].contentUrl
                        }
                    };
                    sendEmbed(richembed);
                })
            })
            .catch(err =>{
                sendMessage("Tuturuu~ An error occured: " + err.response.data.description);
            });
    },
    uploadImg: function(args){
        if(args[1] === undefined || args[1] === undefined){
            sendMessage("Tuturuu~ Please enter one URL and at least one tag (!help for formatting)");
        }
        else{
            var temparray = new Array();
            for(i = 1; i < args.length; i++)
            {
                temparray.push(args[i]);
            }
            axios.post('https://nekobooru.xyz/api/posts/',
            {
                tags: temparray,
                safety: 'safe',
                contentUrl: args[0]
            },
            {   headers:{
                    'Authorization': nekobooruToken,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',     
                },    
            })
            .then(function(response, err){
                let message = "Tuturuu~ File uploaded from URL: ``" + args[0] + "`` with tags: ";
                for(i = 1; i < args.length; i++){
                    message += ', ' + args[i]
                }  
                sendMessage(message);
            })
            .catch(function (error) { 
                sendMessage("Tuturuu~ An error occured: " + error.response.data.description);
            });
        }
    },
    newTag: function (args){
        if(args[0] === undefined){
            sendMessage("Tuturuu~ Missing expected arguments (!help for formatting)");
        }
        else{
            var temparray = new Array();
            for(i = 0; i < args.length; i++)
            {
                temparray.push(args[i]);
            }
            axios.post('https://nekobooru.xyz/api/tags/', {
            names: temparray,
            category: 'Default'
            },{
                headers:{
                    'Authorization': nekobooruToken,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',     
                },    
            })
            .then(function (response){
                sendMessage("Tuturuu~ Tag created");
                logger.info("A new tag was created on nekobooru.xyz");
            })
            .catch(function (error) { 
                sendMessage("Tuturuu~ An error occured: " + error.response.data.description);
            });
        }
        
    },
    newCategory: function (args){
        if(args[0] === undefined || args[1] === undefined){
            sendMessage("Tuturuu~ Missing expected arguments (!help for formatting)");
        }
        else{
            var temparray = new Array();
            for(i = 1; i < args.length; i++)
            {
                temparray.push(args[i]);
            }
            axios.post('https://nekobooru.xyz/api/tags/', {
            names: temparray,
            category: args[0]
            },{
                headers:{
                    'Authorization': nekobooruToken,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',     
                },    
            })
            .then(function (response){
                sendMessage("Tuturuu~ Tag created");
                logger.info("New tag category created on nekobooru.xyz");
            })
            .catch(function (error) { 
                sendMessage("Tuturuu~ An error occured: " + error.response.data.description);
            });
        }
        
    }
  };

