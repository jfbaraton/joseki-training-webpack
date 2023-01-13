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

const suck = (joseki_id, emptySGF, current_node, req, res, isLast) => {
    const saveAndGetPositions = (OGSNode, joseki_id, emptySGF, current_node, req, res, isLast) => {
        currentNode.nodes.push(sgfutils.makeNodeFromOGS(cachedSGF));
        if(isLast) {
            res.send(sgf.generate(emptySGF));
            return;
        }
        Db.getOGSJoseki(joseki_id, 'Positions', (err, data) => {
            if (err) {
                res.status(500).send({
                    message:
                        err.message || "Some error occurred while retrieving players."
                });
                return;
            } else {
                if(data && data.length === 1) {
                    console.log('found cached Positions for '+joseki_id);
                    console.log('found cached data type '+typeof data[0]);
                    console.log('found cached data type '+JSON.stringify(data[0]));
                    console.log('found cached type '+typeof data[0].SGF);
                    console.log('cached SGF ###'+sgfutils.bin2String(data[0].SGF)+'###');
                    const cachedSGF = JSON.parse(sgfutils.bin2String(data[0].SGF));
                    console.log('Position  '+cachedSGF.description);
                    savePositionsAndContinue(cachedSGF, joseki_id, emptySGF, current_node, req, res, isLast);
                } else {
                    console.log('NO CACHED Position for '+joseki_id);
                    ogsAPI.getPositions( joseki_id, (queried) => {
                        //console.log('sucked ' , JSON.stringify(queried));
                        console.log('sucked ');
                        //const emptySGF = sgfutils.getEmptySGF();
                        //let currentNode = emptySGF.gameTrees[0];
                        if(queried.see_also) {
                            delete queried.see_also;
                        }
                        Db.setOGSJoseki(joseki_id, 'Positions', JSON.stringify(queried), (err, data) => {
                            console.log('stored ');
                            //Db.getJoseki(null, null, (err, data) => {
                            if (err)
                                res.status(500).send({
                                    message:
                                        err.message || "Some error occurred while posting joseki."
                                });
                            else {
                                //res.status(201).json(data);
                                /*currentNode.nodes.push(sgfutils.makeNodeFromOGS(queried))
                                if (isLast) {
                                    res.send(sgf.generate(emptySGF));
                                    return;
                                }*/
                                savePositionsAndContinue(queried, joseki_id, emptySGF, current_node, req, res, isLast);
                            }
                        });
                    });
                }
            }
        });
    };
    Db.getOGSJoseki(joseki_id, 'Position', (err, data) => {
        if (err) {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving players."
            });
            return;
        } else {
            if(data && data.length === 1) {
                console.log('found cached Position for '+joseki_id);
                console.log('found cached data type '+typeof data[0]);
                console.log('found cached data type '+JSON.stringify(data[0]));
                console.log('found cached type '+typeof data[0].SGF);
                console.log('cached SGF ###'+sgfutils.bin2String(data[0].SGF)+'###');
                const cachedSGF = JSON.parse(sgfutils.bin2String(data[0].SGF));
                console.log('Position  '+cachedSGF.description);
                saveAndGetPositions(cachedSGF, joseki_id, emptySGF, current_node, req, res, isLast);
            } else {
                console.log('NO CACHED Position for '+joseki_id);
                ogsAPI.getPosition( joseki_id, (queried) => {
                    //console.log('sucked ' , JSON.stringify(queried));
                    console.log('sucked ');
                    //const emptySGF = sgfutils.getEmptySGF();
                    //let currentNode = emptySGF.gameTrees[0];
                    if(queried.see_also) {
                        delete queried.see_also;
                    }
                    Db.setOGSJoseki(joseki_id, 'Position', JSON.stringify(queried), (err, data) => {
                        console.log('stored ');
                        //Db.getJoseki(null, null, (err, data) => {
                        if (err)
                            res.status(500).send({
                                message:
                                    err.message || "Some error occurred while posting joseki."
                            });
                        else {
                            //res.status(201).json(data);
                            /*currentNode.nodes.push(sgfutils.makeNodeFromOGS(queried))
                            if (isLast) {
                                res.send(sgf.generate(emptySGF));
                                return;
                            }*/
                            saveAndGetPositions(queried, joseki_id, emptySGF, current_node, req, res, isLast);
                        }
                    });
                });
            }
        }
    });
};

router.route('/suck').get((req, res) => {
    //const title = req.query.title;
    console.log('sucking ... ');
    const title = "";
    const joseki_id = 15081;
    const emptySGF = sgfutils.getEmptySGF();
    let currentNode = emptySGF.gameTrees[0];
    suck(joseki_id, emptySGF, currentNode, req, res);
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