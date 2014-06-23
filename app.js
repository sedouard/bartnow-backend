
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var stations = require('./routes/stations');
var http = require('http');
var path = require('path');
var app = express();
var fs = require('fs');
var xml2js = require('xml2js');
var nconf = require('nconf');

nconf.argv().env();

//hackhack api key shouldn't be in code
g_apiKey = nconf.get('BartNow.ApiKey');

    // all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

//Allow for Cross Origin Resource Sharing (CORS).
//This allows our web app to access this API from another domain
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});


//load up the station data on initalization and keep it in memory
g_Stations = {};
fs.readFile('data/stations.xml', { encoding: 'utf8' }, function (err, xml) {
        xml2js.parseString(xml, function (err, data) {

            if (err) {
                //the file didn't exist or wasn't accessible
                throw err;
            }
            g_Stations = data;

            
            app.get('/api/stations', stations.get);
            
            for (var i in g_Stations.root.stations[0].station) {
                var station = g_Stations.root.stations[0].station[i];
                
                //create api for this particular station
                app.get('/api/stations/' + station.abbr[0], stations.getId);
            }

            http.createServer(app).listen(app.get('port'), function () {
                console.log('Express server listening on port ' + app.get('port'));
            });

        });
    }
);

