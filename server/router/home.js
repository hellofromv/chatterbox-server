var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, '/../../client/index.html'));
});

module.exports = router;