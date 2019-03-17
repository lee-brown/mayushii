require('../bot.js');
require('../tools/rng.js');
const axios = require('axios');
module.exports = {
    getEmbed: function(input){ 
        var authwolframalpha = process.env.WOLF_AUTH;
        axios.get('http://api.wolframalpha.com/v2/query?input=' + input + "&appid=" + authwolframalpha, {},{
            })
            .then(response =>{ 
                var parseString = require('xml2js').parseString;
                var xml = response.data.toString();
                parseString(xml, function (err, result) {
                    //console.log(result.queryresult.error['0'].msg['0']); //See error msg for debug
                    var lines = "";
                    for(i = 0; i < result.queryresult.pod[1].subpod[0].plaintext.length; i++){
                        lines = lines + result.queryresult.pod[1].subpod[0].plaintext[i];
                    }
                    var richembed = {
                        'footer': {
                            'icon_url': "https://cdn.iconscout.com/icon/free/png-256/wolfram-alpha-2-569293.png",
                            'text': 'wolframalpha.com'
                        },
                        "description": lines,
                    };
                    sendEmbed(richembed);
                })
                
            })
            .catch(err =>{
                console.log(err);
            });
    }
}