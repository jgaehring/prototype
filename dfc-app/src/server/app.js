const fs = require('node:fs');
const http = require('node:http');
const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const request = require('request');
const waitOn = require('wait-on');
// const mongoose = require('mongoose');
// const mongo_client = require('./mongo_client');

const env = process.env;
let url = env.CONFIG_URL;
if(url==undefined || url==''){
  url = "https://simonlouvet.github.io/config-private/DFC-Proto/config.json"
}

const app = express();
const safeRouter = express.Router();
const unsafeRouter = express.Router();

app.use(cors())
app.use(bodyParser.json({
  limit: '10mb'
}))
app.use(bodyParser.urlencoded({
  limit: '10mb',
  extended: true
}))


async function start() {
  const config = require("../../configuration.js")
  const middlware_express_oidc = require('./auth/middlware-express-oidc.js');
  // const productAPI = require('./api/product.js');
  const catalogAPI = require('./api/catalogItem.js');
  const entrepriseAPI = require('./api/entreprise.js');
  const entrepriseUnsafe = require('./api/entrepriseUnsafe.js');
  const redirectAPI = require('./api/redirectAPI.js');
  const userAPI = require('./api/user.js');
  const configAPI = require('./api/config.js');
  const {PlatformService,platformServiceSingleton} = require ('./service/platform.js')
  const {UnitService,unitServiceSingleton} = require ('./service/unit.js')
  const {ProductTypeService,productTypeServiceSingleton} = require ('./service/productType.js')

  // const contextResponse = await fetch(config.context);
  // const context = await contextResponse.json();
  console.log('config',config);

  var opts = {
    resources: [
      'http-get://dfc-middleware:3000/ldp/platform',
      'http-get://dfc-fuseki:3030',
    ],
    delay: 1000, // initial delay in ms, default 0
    simultaneous: 1, // limit to 1 connection per resource at a time
  }
  console.log('befor waitOn');
  await waitOn(opts);
  console.log('after waitOn');

  await platformServiceSingleton.updatePlatformsFromConfig();
  // await unitServiceSingleton.updateUnitsFromConfig();
  // await productTypeServiceSingleton.updateProductsFromReference();

  app.use(session({
    secret: config.express.session_secret,
    maxAge: null
  })); //session secret

  safeRouter.use(middlware_express_oidc);
  app.use('/login/', unsafeRouter);
  app.use('/data/core', unsafeRouter);
  app.use('/data/core', safeRouter);
  app.use(passport.initialize());
  app.use(passport.session());

  let addOidcLesCommunsPassportToApp = require('./auth/passport-oidc.js');
  addOidcLesCommunsPassportToApp(unsafeRouter);
  entrepriseUnsafe(unsafeRouter);
  redirectAPI(safeRouter);
  // productAPI(safeRouter);
  userAPI(safeRouter);
  configAPI(unsafeRouter,config);
  entrepriseAPI(safeRouter);
  catalogAPI(safeRouter);

  const port = process.env.APP_PORT || 8080;
  app.listen(port, function(err) {
    console.log('serveur started at port', port);
  });
  app.use((_err, req, res, next) => {
    if (_err) {
      console.log('error',_err);
      if (res.statusCode==undefined){
          res.status(500);
      }
      res.send({
        message: _err.message
      })
    }
  })
}

start();

// const configRaw = fs.readFileSync('config.js', 'utf8');
// const config=JSON.parse(configRaw);
// fs.readFile('config.json', (err, data) => {
//   if (err) throw err;
//   console.log('readFile',data);
// });
