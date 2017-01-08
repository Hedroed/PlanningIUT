'use strict';
const https = require('https');

class Calendar {

    constructor(idCalendar, nomSalles){
        this.idCalendar = idCalendar;
        this.nomSalles = nomSalles;
        this.salles = (function(){
            var salles = {};
            for (var nomSalle of nomSalles){
                salles[nomSalle] = new Salle(nomSalle);
            }
            return salles;
        })();
        Calendar.updateCalendar(this);
    }



    static getCalendar(callback){
        var options = {
            host: 'planning.univ-ubs.fr',
            path: '/jsp/custom/modules/plannings/anonymous_cal.jsp?data=' + this.idCalendar
        };
        https.request(options, function(res) {
            res.setEncoding('utf8');
            var data = '';
            ///////////////////////
            res.on('data', function(chunk) {
                data += chunk;
            });
            ///////////////////////
            res.on('end', function(){
                callback(data);
            });
        }).end();
    }

    static updateCalendar(calendar){
        Calendar.getCalendar(function(data){
            // console.log(calendar);
            var arrayDataCalendar = data.split("\n");
            var dtstart = null;
            var dtend = null;

            for (var line of arrayDataCalendar){
                // console.log(line);
                var splitedLine = line.split(':');

                if (splitedLine[0] === "DTSTART"){
                    dtstart = splitedLine[1];
                }

                if (splitedLine[0] === "DTEND"){
                    dtend = splitedLine[1];
                }

                if (splitedLine[0] === "LOCATION" && dtstart != null && dtend != null){
                    for (var nomSalle of calendar.nomSalles){
                        if (splitedLine[1].indexOf(nomSalle) !== -1){
                            // console.log("[OK] " + salle + " : " + splitedLine[1]);
                            var dateDebut = new Date(dtstart.substring(0,4) + "-" + dtstart.substring(4,6) + "-" + dtstart.substring(6,11) + ":" + dtstart.substring(11,13));
                            var dateFin = new Date(dtend.substring(0,4) + "-" + dtend.substring(4,6) + "-" + dtend.substring(6,11) + ":" + dtend.substring(11,13));
                            var occupation = new Occupation(dateDebut, dateFin);
                            // console.log(salles);
                            calendar.salles[nomSalle].addOccupation(occupation);
                        }
                    }
                }

                if (splitedLine[0] === "END:VEVENT"){
                    dtstart = null;
                    dtend = null;
                }
            }
        });
    }

    sallesDisponibles(date){
        var sallesDispo = [];
        if (!date) date = Date.now()
        // console.log(this.nomSalles);
        for (var nomSalle of this.nomSalles){
            // console.log(this.salles[nomSalle]);
            if (this.salles[nomSalle].estDisponible(date)){
                sallesDispo.push(nomSalle);
            }
        }
        return sallesDispo;
    }

    // console.log(this);
    // this.updateCalendar();

};

var Salle = function(nomSalle){

    this.nomSalle = nomSalle; // String
    this.occupations = []; // Occupation array

    this.addOccupation = function(occupation){
        this.occupations.push(occupation);
    }

    this.estDisponible = function(date){
        var disponible = true;
        for (var occupation of this.occupations){
            if (!occupation.estDisponible(date)){
                disponible = false;
            }
        }
        return disponible;
    }
}

var Occupation = function(dateDebut, dateFin){

    this.dateDebut = dateDebut;
    this.dateFin = dateFin;

    this.estDisponible = function(date){
        return (date < dateDebut || date >= dateFin);
    }
}

// var idCalendar = "8241fc38732002141317a107b7ce989cd1bb95aa76bef7d8013f8ecf19fbd900729809d86cd297df23343573b6d8e6dca84371115c57ce3f92b82f42d84baba9ad770359a5f53f56f7c903b47fbaea3f809e79060ee999f4df6c31ef932e3e6c85f2b25bc040fa19498424fc3aa6bf4a7b701a69e4929514a885d1cf1c1a74d421cc8a1e31f0ca00be7c9db77b1b15d9a47c1e9b682d7428126e69f83c1b3920dbf65ba57e2fd7f3995819b0e211f491b4ef9aba751bdce73a0eaecf799cbced50c55e7f25926a723ae4bd107b2ce328d4a2ff76e2f7d5696ca90484c4b2ac6af9c4bc151f5a34001d9b6310a318facbf377b612dec2c5fba5147d40716acb136310d0ae215603f5";
// var salles = [];
// // var salles = ['B 024', 'B 029', 'B 005', 'B 022', 'B 028', 'B 035', 'B 037', 'B 126', 'B 141'];
// var calendar = new Calendar(idCalendar, salles);
// setTimeout(function(){
//     var salles = calendar.sallesDisponibles()
//     console.log(salles);
// }, 2000);
module.exports = Calendar;
