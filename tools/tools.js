module.exports = {
    shuffle: function (array) { // Fisher-Yates Shuffle 
        let counter = array.length;

        // While there are elements in the array
        while (counter > 0) {
            // Pick a random index
            let index = Math.floor(Math.random() * counter);

            // Decrease counter by 1
            counter--;

            // And swap the last element with it
            let temp = array[counter];
            array[counter] = array[index];
            array[index] = temp;
        }

        return array;
    },
    isURL: function(str) {
        var urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
        var url = new RegExp(urlRegex, 'i');
        return str.length < 2083 && url.test(str);
    },
    addUserId: function(originaltext, target,userID){ //Replaces @user and @target with actual target and user tags
        newtext = originaltext.replace("@user", "<@!" + userID + ">");
        if(target !== undefined){
            newtext = newtext.replace("@target", target);
        }
        else {
            if(newtext.includes("@target")){
                newtext = "";
            }
        }
        return newtext;
    },
    commaDelimitedTags: function(item){ //Returns string which seperates tags by commas instead of "&"
        var resultTagsString = "";
        if(item !== null && item !== undefined){
            item = item.split("&");
            for(i = 0; i < item.length; i++){
                resultTagsString = resultTagsString + item[i];
                if(i !== item.length - 1){
                    resultTagsString = resultTagsString + ",";
                }
            }
        }
        return resultTagsString;
    }
}
