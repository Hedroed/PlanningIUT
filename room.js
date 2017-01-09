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



    static getCalendar(idCalendar, callback){
        var options = {
            host: 'planning.univ-ubs.fr',
            path: '/jsp/custom/modules/plannings/anonymous_cal.jsp?data=' + idCalendar
        };
        // console.log(options);
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
        Calendar.getCalendar(calendar.idCalendar, function(data){
            // console.log("download done");
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
                            // console.log("[OK] " + nomSalle + " : " + splitedLine[1]);
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
            console.log("Update Done");
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

module.exports = Calendar;
