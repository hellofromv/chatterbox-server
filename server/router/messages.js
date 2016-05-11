var express = require('express');
var router = express.Router();
var fs = require('fs');

var datas = {
  results: []
};

var onServerStart = () => {
  fs.readFile('./server/router/message.txt', 'utf8', (err, data) => {
    if (err) {
      console.log(err);
    } else {
      var splitObj = data.split(', ');
      for (var i = 0; i < splitObj.length - 1; i++) {
        datas.results.push(JSON.parse(splitObj[i]));
      }
    }
  });
};

onServerStart();

router.get('/', (request, response) => {
  response.send(datas);
});

router.post('/', (request, response) => {
  request.on('data', data => {
    var newObj = JSON.parse(data);
    newObj.objectId = datas.results[datas.results.length - 1].objectId + 1;

    datas.results.push(newObj);
    fs.appendFile('./server/router/message.txt', (`${JSON.stringify(newObj)}, `), err => {
      if (err) {
        console.log(err);
      } 
    });
    response.sendStatus(201);
  });
});

module.exports = router;

