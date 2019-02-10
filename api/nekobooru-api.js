
var tools = require('../tools/tools');
require('../tools/rng');
const axios = require('axios');
module.exports = {
    getRandomImg: function (tags){ 
        axios.get('https://nekobooru.xyz/api/posts/?query=' + tags + "&safety=safe", {},{
            })
            .then(response =>{ 
                console.log(tags);
                if(response.data.results[0] !== undefined){ //No results returned
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
                }
                else{
                    sendMessage("Sorry but that tag doesn't exist on nekobooru.xyz, feel free to create it");
                    console.log(response.data.results[0]);
                    console.log(response.data.results);
                }
            })
            .catch(err =>{
                sendMessage("Tuturuu~ An error occured: " + err.response.data.description);
            });
    },
    uploadImg: function(args){
        var extensionType = "image";
        var extension = tools.removeSpaces(args[0].slice(-3));
        var extensions = ["png","jpg","tif","jpeg","tiff"];
        if(extension === "gif"){
            extensionType = "animation";
        }
        else if(!extensions.includes(extension)){
            sendMessage("Warning, could not detect file type or unsupported file type");
        }
        if(args[0] === undefined){
            sendMessage("Tuturuu~ Please enter one URL (!help for formatting)");
        }
        else{
            var tags;
            var content;
            if(extensionType === "animation"){
                var content = {
                    type: extensionType,
                    safety: 'safe',
                    contentUrl: args[0]
                };
            }
            else{
                var tags = new Array();
                for(i = 1; i < args.length; i++)
                {
                    tags.push(args[i]);
                }
                var content = {
                    type: extensionType,
                    tags: tags,
                    safety: 'safe',
                    contentUrl: args[0]
                };
            }
            var headers = {   headers:{
                'Authorization': "Token " + process.env.NEKO_AUTH,
                'Content-Type': 'application/json',
                'Accept': 'application/json',     
                },
            };
            axios.post('https://nekobooru.xyz/api/posts/',content,headers)
            .then(function(response, err){
                let message = "";
                if(extensionType === "animation" && args.length > 1){
                    message += "Tuturuu~ File uploaded from URL: ``" + args[0] + "`` tags must be added on nekobooru.xyz due to an issue with gifs";
                }
                else if (args.length > 1){
                    message += "Tuturuu~ File uploaded from URL: ``" + args[0] + "`` with tags: " + tags;
                }
                else{
                    message += "Tuturuu~ File uploaded from URL: ``" + args[0] + "``";
                }
                sendMessage(message);
            })
            .catch(function (error) { 
                if(error.response.data['name'] === "PostAlreadyUploadedError"){
                    sendMessage("Tuturuu~ sorry but this image has already been uploaded here: https://nekobooru.xyz/post/" + error.response.data['otherPostId'] );
                }
                console.log(error);
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

