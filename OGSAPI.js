// OGSMock.js
var https = require('https');

// wait 1000 ms between 2 OGS calls (of will answer 429)
const OGSPatience = 1000;


function pausecomp(millis)
{
    var date = new Date();
    var curDate = null;
    do { curDate = new Date(); }
    while(curDate-date < millis);
}

getPosition = (id, callback) => {
    /*var options = {
        host: 'https://online-go.com',
        port: 80,
        path: '/oje/positions?id='+id+'&tfilterid=37&mode=0',
        method: 'GET',
        headers: {
            'accept': 'application/json, text/javascript; q=0.01',

        }
    };*/
    var options = new URL('https://online-go.com/oje/position?id='+id+'&tfilterid=37&mode=0');
    const responseData = []
    pausecomp(OGSPatience);
    https.request(options, function(res) {
          //console.log('STATUS: ' + res.statusCode);
          //console.log('HEADERS: ' + JSON.stringify(res.headers));
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
              //console.log('BODY: ' + chunk);
              //console.log('BODY ');
              responseData.push(chunk);
              //callback(chunk)
          });
        res.on('end', function () {
            //console.log('END');
            callback(JSON.parse(responseData.join('')));
        });
    }).on('error', function(err) {
        // Handle error
        console.log('ERROR ',err);
    }).end();
};

getPositions = (id, callback) => {
    /*var options = {
        host: 'https://online-go.com',
        port: 80,
        path: '/oje/positions?id='+id+'&tfilterid=37&mode=0',
        method: 'GET',
        headers: {
            'accept': 'application/json, text/javascript; q=0.01',

        }
    };*/
    var options = new URL('https://online-go.com/oje/positions?id='+id+'&tfilterid=37&mode=0');
    const responseData = []
    pausecomp(OGSPatience);
    https.request(options, function(res) {
          console.log('STATUS: ' + res.statusCode);
          //console.log('HEADERS: ' + JSON.stringify(res.headers));
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
              //console.log('BODY: ' + chunk);
              //console.log('BODY ');
              responseData.push(chunk);
              //callback(chunk)
          });
        res.on('end', function () {
            //console.log('END');
            callback(JSON.parse(responseData.join('')));
        });
    }).on('error', function(err) {
        // Handle error
        console.log('ERROR ',err);
    }).end();
};
/*
curl 'https://online-go.com/oje/positions?id=24140&tfilterid=37&mode=0' \
  -H 'authority: online-go.com' \
  -H 'accept: application/json, text/javascript' \
  -H 'accept-language: fr-FR,fr;q=0.9,sv;q=0.8,en-US;q=0.7,en;q=0.6,zh;q=0.5,nl;q=0.4' \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -H 'cookie: _ga=GA1.2.891948005.1610913690; csrftoken=8cJAIEeYOO4g3RgqRxXSgMVfPSkIL5v62XFxw4qE6ldAqHEWv2kWv3YLgJJeFvxg; sessionid=4ecudz6apqnynwlgwj908q0sgikux0mg' \
  -H 'pragma: no-cache' \
  -H 'referer: https://online-go.com/joseki/24140' \
  -H 'sec-ch-ua: "Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' \
  -H 'x-requested-with: XMLHttpRequest' \
  --
  */

//getPositions = (id) => {joseki_positions_calls.properties(id)};

module.exports = {
  getPosition:  getPosition,
  getPositions:  getPositions
}