module.exports = {
    removeSpaces: function (item){ //Finds and removes spaces from a string
        if(item!= null || item != ""){
            item = item.replace(/\s/g, ''); 
            return item;
        }  
    }
}
