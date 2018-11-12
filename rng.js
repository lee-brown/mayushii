var randomNumber = require("random-number-csprng");
var Promise = require("bluebird");
genRandomNumber = function(min, max){
    return new Promise(function(res, err){
        if(min === max){
            res(min);
        }
        else if(min > max){
            res(0);
        }
        else{
            res(randomNumber(min, max));
        }
    })
}