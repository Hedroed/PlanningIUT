var updater = require('./updater');


var Planning = function (id) {
    this.idPlanning = id;
}

Planning.prototype.updatePlanning = function () {
    updater.getCalendar(this.idPlanning, function (e) {
        // console.log(e.courses[162]);
        // console.log(e.courses[163]);
        // console.log(e.courses[164]);
        // console.log(e.courses[165]);

        var i=0;
        console.log(e.courses[i]);
        process.stdin.on('data', function (text) {
            var loop = true;
            while(loop && i < e.courses.length) {
                i++;
                if(e.courses[i] != undefined) {
                    loop = e.courses[i].name.search(/C\+\+/) < 0 || e.courses[i].group[0] !== "2C";
                }
            }
            console.log(i);
            console.log(e.courses[i]);
        });
    });
};



module.exports = Planning;
