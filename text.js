
module.exports = {
    handwriting: function(argsString){
        var sentence = "";
        for (var i = 0; i <= argsString.length; i++) {
            var char = argsString.charAt(i)
            sentence += handwritingChar(char) || char
        }
        sendMessage(sentence) ;
    },
    spaced: function(argsString){
        var sentence = "";
        for (var i = 0; i <= argsString.length; i++) {
            var char = argsString.charAt(i)
            sentence += spacedChar(char) || char
        }
        sendMessage(sentence) ;
    },
    metal: function(argsString){
        var sentence = "";
        for (var i = 0; i <= argsString.length; i++) {
            var char = argsString.charAt(i)
            sentence += metalChar(char) || char
        }
        sendMessage(sentence) ;
    },
    super: function(argsString){ //super script
        var sentence = "";
        for (var i = 0; i <= argsString.length; i++) {
            var char = argsString.charAt(i)
            sentence += superChar(char) || char
        }
        sendMessage(sentence) ;
    },
    upsidedown: function(argsString){ //super script
        var sentence = "";
        for (var i = 0; i <= argsString.length; i++) {
            var char = argsString.charAt(i)
            sentence += upsidedownChar(char) || char
        }
        sendMessage(sentence) ;
    },
    bubble: function(argsString){ //super script
        var sentence = "";
        for (var i = 0; i <= argsString.length; i++) {
            var char = argsString.charAt(i)
            sentence += bubbleChar(char) || char
        }
        sendMessage(sentence) ;
    }
}
handwritingChar = function(charIn){
    var allLetters = Array.from("𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩");
    var normalLetters = Array.from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
    var charToReturn = normalLetters.indexOf(charIn);
    return allLetters[charToReturn];
}
spacedChar = function(charIn){
    var allLetters = Array.from("ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ");
    var normalLetters = Array.from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
    var charToReturn = normalLetters.indexOf(charIn);
    return allLetters[charToReturn];
}
metalChar = function(charIn){
    var allLetters = Array.from("𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅");
    var normalLetters = Array.from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
    var charToReturn = normalLetters.indexOf(charIn);
    return allLetters[charToReturn];
}
superChar = function(charIn){
    var allLetters = Array.from("ᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᵟᴿˢᵀᵁᵛᵂˣᵞᶻᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᵟᴿˢᵀᵁᵛᵂˣᵞᶻ");
    var normalLetters = Array.from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
    var charToReturn = normalLetters.indexOf(charIn);
    return allLetters[charToReturn];
}
upsidedownChar = function(charIn){
    var allLetters = Array.from("ɐqɔpǝɟƃɥıɾʞןɯuodbɹsʇnʌʍxʎzɐqɔpǝɟƃɥıɾʞןɯuodbɹsʇn𐌡ʍxʎz");
    var normalLetters = Array.from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
    var charToReturn = normalLetters.indexOf(charIn);
    return allLetters[charToReturn];
}
bubbleChar = function(charIn){
    var allLetters = Array.from("ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ ");
    var normalLetters = Array.from("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
    var charToReturn = normalLetters.indexOf(charIn);
    return allLetters[charToReturn];
}