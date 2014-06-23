bartnow-backend
===============

This is the backend api for the bartnow-winjs repository. It is a simple RESTful node.js service which parses data from the BART xml data and serves it up with json.

#Setup

Although this project uses Node tools for Visual Studio, Visual Studio isn't required. To run the api:

1) Navigate to this repository on your machine

2) npm install

3) Get a Bart API at http://www.bart.gov/schedules/developers/api

4) Set an environment variable BartNow.ApiKey="YOUR API KEY"

5) node app.js

You can use the app at bartnow-winjs which is a WinJS based Bart web app to see the api in action.


#Api's

All endpoints start from /api

GET /stations

Returns a list of stations with current applicable estimated time to departures (etd)

GET /stations/STATION-ABBREVIATION

Returns the station data and estimated arrivals for a particular station. Abbrevations can be found from the station data provided by /stations.

#Future Plans

Push notification support for Bart system alerts
