var updater = require('./updater');

var Planning = function (id) {
    this.idPlanning = id;
    this.data = null;
}

Planning.prototype.updatePlanning = function (callback) {
    var me = this;

    updater.getCalendar(this.idPlanning, function (e) {
        me.data = e;
        console.log("Done");
        // var i=0;
        // console.log(e.courses[i]);
        // process.stdin.on('data', function (text) {
        //     var loop = true;
        //     while(loop && i < e.courses.length) {
        //         i++;
        //         if(e.courses[i] != undefined) {
        //             loop = e.courses[i].name.search(/C\+\+/) < 0 || e.courses[i].group[0] !== "2C";
        //         }
        //     }
        //     console.log(i);
        //     console.log(e.courses[i]);
        // });

        if(callback) callback();
    });
};

/**
 * @description determine if an array contains one or more items from another array.
 * @param {array} oneOf the array to search.
 * @param {array} inArray the array providing items to check for in the haystack.
 * @return {boolean} true|false if haystack contains at least one item from arr.
 */
var findOne = function (oneOf, inArray) {
    if(inArray == undefined || oneOf == undefined) return false;

    for(elem of oneOf) {
        if(inArray.includes(elem)) return true;
    }
    return false;
};

Planning.prototype.getCourses = function (groups, fromNow) {
    if(!groups) throw "Param null";
    if(!fromNow) fromNow = false;

    var me = this;
    var ret = [];
    for(truc of this.data.courses) {
        if(findOne(groups,truc.group)) {
            if(fromNow) {
                if(truc.start > Date.now()) ret.push(truc);
            }
            else {
                ret.push(truc);
            }
        }
    }

    return ret;
}

module.exports = Planning;
