// server.js
var  Db = require('./dboperations');
var  ogsMock = require('./OGSMock');
var  ogsAPI = require('./OGSAPI');
var  express = require('express');
var  bodyParser = require('body-parser');
var  cors = require('cors');
var  app = express();
var  router = express.Router();
var sgf = require('smartgame');
var sgfutils  = require('./utils');
var sucker  = require('./sucker');

var exec = require('child_process').exec;
var isEngineOn = false;
var currentRes = null;
var result = '';
var child = null;
// C:\Users\yamak\.katrain\katago-v1.7.0-gpu-opencl-windows-x64.exe gtp -model C:\Users\yamak\.katrain\g170-b40c256x2-s5095420928-d1229425124.bin.gz -config C:\Users\yamak\.katrain\fast_analysis_config.cfg
const engineStartCmd = 'C:\\Users\\yamak\\.katrain\\katago-v1.7.0-gpu-opencl-windows-x64.exe gtp -model C:\\Users\\yamak\\.katrain\\g170-b40c256x2-s5095420928-d1229425124.bin.gz -config C:\\Users\\yamak\\.katrain\\fast_analysis_config.cfg';

const resetEngine = () => {
    console.log('resetEngine');
    result = '';
    isEngineOn = true;
    isEngineStarting = true;
    child = exec(engineStartCmd);
    child.stdout.on('data', function(data) {
        //result += data;
        console.log('stdout: ',data && data.length);
        if(currentRes)
            currentRes.write(data);
        if(data && data.indexOf('GTP ready, beginning main protocol loop')>=0) {
            console.log('Engine is READY')
            isEngineStarting = false;
        }
    });
    child.stderr.on('data', function(data) {
        //result += data;
        console.log('stderr: ',data && data.length)
        if(data && data.indexOf('GTP ready, beginning main protocol loop')>=0) {
            console.log('Engine is READY Err')
            isEngineStarting = false;
        }
    });

    child.on('close', function(data) {
        console.log('Engine died ', JSON.stringify(data));
        //console.log(result);
        isEngineOn = false;
        if(currentRes) {
            //currentRes.status(201).json({msg:'Engine died'});
            currentRes = null;
        }
    });
}




app.use(bodyParser.urlencoded({ extended:  true }));
app.use(bodyParser.json());
app.use(cors());
app.use('/api', router);


router.use((request, response, next) => {
  console.log('middlewarez');
  next();
});
 

router.route('/players').get((req, res) => {
  const title = req.query.title;

  Db.getAll(title, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving players."
      });
    else res.send(data);
  });
})


router.route('/suck').get((req, res) => {
    //const title = req.query.title;
    console.log('sucking ... ');
    const title = "";
    const emptySGF = sgfutils.getEmptySGF();
    const BorW = "W";
    let currentNode = emptySGF.gameTrees[0];
    //sucker.suck(15081, emptySGF, currentNode, req, res, false, BorW);
    sucker.suck(15081, emptySGF, currentNode, req, res, false, BorW);
    const renderedSGF = [""];
    const checkChanges = () => {
        const newRenderedSGF = sgf.generate(emptySGF);
        if(newRenderedSGF === renderedSGF[0]) {
            console.log('FINISHED !! ',newRenderedSGF.length );
            res.send(newRenderedSGF);
        } else {
            console.log('not yet ',newRenderedSGF.length );
            renderedSGF[0] = newRenderedSGF;
            setTimeout(checkChanges,35000);
        }
    }
    //setTimeout(()=>{res.send(sgf.generate(emptySGF));},35000);
    setTimeout(checkChanges,35000);

})


router.route('/joseki/:id?').get((req, res) => {
  const title = req.query.id;
  const id = req.params.id;

  console.log('joseki with param '+id);
  console.log('2joseki with param '+title);
  Db.getJoseki(title, id, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving joseki."
      });
    else res.send(data);
  });
})

router.route('/joseki').post((req, res) => {
  //const title = req.query.id;
  //const id = req.params.id;
  const body = { ...req.body};

  console.log('POST joseki '+JSON.stringify(body.SGF));
  Db.setJoseki(body.SGF, (err, data) => {
  //Db.getJoseki(null, null, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while posting joseki."
      });
    else res.status(201).json(data);
  });
})

router.route('/engine').post((req, res) => {
  //const title = req.query.id;
  //const id = req.params.id;
  const body = { ...req.body};

  //console.log('POST engine '+JSON.stringify(body.cmd));
  /*Db.setJoseki(body.SGF, (err, data) => {
  //Db.getJoseki(null, null, (err, data) => {
    if (err)
      res.status(500).send({
        message:
          err.message || "Some error occurred while posting joseki."
      });
    else res.status(201).json(data);
  });*/
    if(!isEngineOn) {
        console.log('Need to start engine, go');
        resetEngine();
    } else if (isEngineOn && child && child.stdin) {
        console.log('send cmd to engine: #', body.cmd, "#");
        currentRes = res;
        child.stdin.write(body.cmd);
    } else {
        console.log('but engine was dead ', isEngineOn, !!child );
    }

    /*while(isEngineOn && isEngineStarting) {

    }*/



})

/*
router.route('/orders/:id').get((request, response) => {
  Db.getOrder(request.params.id).then((data) => {
    response.json(data[0]);
  })
})

router.route('/orders').post((request, response) => {
  let  order = { ...request.body }
  Db.addOrder(order).then(data  => {
    response.status(201).json(data);
  })
})*/
  
  
var  port = process.env.PORT || 8090;
app.listen(port);
console.log('Order API is runnning at ' + port);