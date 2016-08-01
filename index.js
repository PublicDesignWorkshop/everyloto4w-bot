var request = require('request').defaults({ encoding: null });
var fs = require('fs');
var jsonfile = require('jsonfile');
var moment = require('moment');
var Converter = require("csvtojson").Converter;
var Twit = require('twit');
var twitterConfig = require('./twitter-config');

var csv = new Converter({constructResult:false});

var Bot = new Twit(twitterConfig);

var obj = JSON.parse(fs.readFileSync(__dirname + '/everyloto4w-index.json', 'utf8') || '{}');
var index = obj.index || 0;
var addresses = JSON.parse(fs.readFileSync(__dirname + '/o4wAddresses.json', 'utf8'));

var doTweet = function() {
  index++;
  var lot = addresses[index];

  var street = lot.NUMBER + ' ' + lot.STREET;
  var location = encodeURI(street + ', Atlanta, GA');

  // post to twitter
  request.get('https://maps.googleapis.com/maps/api/streetview?size=600x400&location=' + location, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      imageData = "data:" + response.headers["content-type"] + ";base64," + new Buffer(body).toString('base64');

      Bot.post('media/upload', { media_data: new Buffer(body).toString('base64') }, function (err, data, response) {
        console.log('upload')
        console.log(err)
        // now we can assign alt text to the media, for use by screen readers and 
        // other text-based presentations and interpreters 
        var mediaIdStr = data.media_id_string
        var meta_params = { media_id: mediaIdStr }
      

        Bot.post('media/metadata/create', meta_params, function (err, data, response) {
          console.log(err);
          if (!err) {
            // now we can reference the media and post a tweet (media will attach to the tweet) 
            var params = { status: street, media_ids: [mediaIdStr] }
       
            Bot.post('statuses/update', params, function (err, data, response) {
              console.log('done');

              setTimeout(doTweet, 1000*60*20);
            });
          }
        })
      })
    }
  });

  // save csv index
  jsonfile.writeFile(__dirname + '/everyloto4w-index.json', { 'index': index }, { spaces: 2 }, function(err) {
    console.error(err);
  });
}

doTweet();