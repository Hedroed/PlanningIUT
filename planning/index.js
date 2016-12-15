var updater = require('./updater'),
	fs = require('fs');

/*polyfill*/
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
    'use strict';
    if (this == null) {
      throw new TypeError('Array.prototype.includes called on null or undefined');
    }
    var O = Object(this);
    var len = parseInt(O.length, 10) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1], 10) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {k = 0;}
    }
    var currentElement;
    while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement ||
         (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
        return true;
      }
      k++;
    }
    return false;
  };
}
	
var Planning = function (id) {
    this.idPlanning = id;
    this.data = null;
}

Planning.prototype.updatePlanning = function (callback) {
    var me = this;
	
	if(this.local) {
		fs.readFile(this.path, 'utf8', function (err,data) {
			if (err) {
				return console.log(err);
			}
			
			updater.parse(data, (d) => {
				me.data = d;
				
				console.log("Done");
				if(callback) callback();
			});
		});
	} else {
		updater.getCalendar(this.idPlanning, function (e) {
			me.data = e;
			
			console.log("Done");
			if(callback) callback();
		});
	}
};

Planning.prototype.updateLocal = function (val, path) {
    this.local = val;
	this.path = path;
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
