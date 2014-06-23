var xml2js = require('xml2js');
var fs = require('fs');
var unirest = require('unirest');
var stable = require('stable');

function augmentStationDataWithTimeData(station, timeData) {
    station.etd = [];

    for (var k in timeData.etd) {
        var estimate = [];
        var formattedArrivals = "";
        for (var l in timeData.etd[k].estimate) {
            var est = timeData.etd[k].estimate[l];
            estimate.push({
                minutes: est.minutes[0],
                color: est.color[0],
                hexColor: est.hexcolor[0]
            });
            formattedArrivals += est.minutes[0];


            if ('Leaving' != est.minutes[0]) {
                formattedArrivals += 'm';
            }

            if (l < timeData.etd[k].estimate.length - 1) {
                formattedArrivals += ', ';
            }
            else {
                formattedArrivals += ' ';
            }
        }

        if (formattedArrivals) {
            formattedArrivals = timeData.etd[k].destination[0] + ' - ' + formattedArrivals;
        }

        station.etd.push({
            estimate: estimate,
            formattedArrivals: formattedArrivals,
            destination: timeData.etd[k].destination,
            abbr: timeData.etd[k].abbreviation,
        });

    }
}

/**
    Sorts a given array of stations with the first element being the closest statioand the
    last being the farthest. Returns the sorted array
**/
function sortByLocation(lat, lon, stationData) {

    //compute distances from point
    for (var i in stationData) {

        //calculate distance from point and add data to each station
        stationData[i].distance = Math.sqrt(Math.pow(lat - stationData[i].latitude, 2) + Math.pow(lon - stationData[i].longitude, 2));
    }
    //the function that defines the comparison between 2 stations
    var comparison = function (a, b) {
        return a.distance > b.distance;
    }

    return stable(stationData, comparison);
}

/**
    GET Station by Id (station abbrevation code)
**/
exports.getId = function (req, res) {
    var parts = req.originalUrl.split('/');
    var station = parts[parts.length - 1];

    unirest.get('http://api.bart.gov/api/etd.aspx?cmd=etd&orig=' + station + '&key=' + g_apiKey)
    .end(function(response){
        
        if (!response) {
            return res.send(500, { message: 'bart data service temporarily unavailable' });

        }

        //convert from xml to json (what a pain)
        xml2js.parseString(response.body, function (err, timeData) {

                if (timeData.root.station.length != 1) {
                    return res.send(400, {message: 'could not find station named ' + station } );
                }

                for (var i in g_Stations.root.stations[0].station) {
                    var station = g_Stations.root.stations[0].station[i];

                    if (station.name[0] == timeData.root.station[0].name[0]) {
                        //we've found the request station in the stored station data. Now splice
                        //with station time data and return

                        var stationData = {
                            longitude: station.gtfs_longitude[0],
                            latitude: station.gtfs_latitude[0],
                            name: station.name[0],
                            abbr: station.abbr[0]
                        };

                        var timeStation = timeData.root.station[0];
                        
                        augmentStationDataWithTimeData(stationData, timeStation);

                        //we've got the right station with the right data. break out and return the data;
                        return res.send(200, stationData);
                    }
                }
                

                
            }
        );

    });
    

}

/*
* GET station listing.
*/
exports.get = function (req, res) {


    unirest.get('http://api.bart.gov/api/etd.aspx?cmd=etd&orig=ALL&key=' + g_apiKey)
    .end(function (response) {
        if (!response) {
            return res.send(500, {message:'bart data service temporarily unavailable'});
        }
        var body = response.body;

        //convert from xml to json (what a pain)
        xml2js.parseString(body, function (err, timeData) {

            var stationList = [];
            for (var i in g_Stations.root.stations[0].station) {

                var station = g_Stations.root.stations[0].station[i];

                var stationData = {
                    longitude: station.gtfs_longitude[0],
                    latitude: station.gtfs_latitude[0],
                    name: station.name[0],
                    abbr: station.abbr[0]
                };

                for (var z in timeData.root.station) {
                    var timeStation = timeData.root.station[z];

                    //we found the time data for this station. splice it together
                    //with the station data
                    if (stationData.abbr == timeStation.abbr) {


                        augmentStationDataWithTimeData(stationData, timeStation);

                        break;
                    }
                }

                stationList.push(stationData);
            }

            if (req.query.longitude && req.query.latitude) {
                
                stationList = sortByLocation(req.query.latitude, req.query.longitude, stationList);
                res.send(200, stationList);
            }
            else{
                //send data without relative distances and without sorting bythat
                res.send(200, stationList);
            }
            
        });
    });
}

