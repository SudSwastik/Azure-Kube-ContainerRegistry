'use strict';

const express = require('express');

// Constants
const PORT = 3000;
const HOST = '0.0.0.0';
let count = 0;
// App
const app = express();
app.get('/', (req, res) => {
  res.send('Current Counter is: '+ count++);
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);