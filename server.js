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

router.route('/suck').get((req, res) => {
    //const title = req.query.title;
    console.log('sucking ... ');
    const title = "";
    Db.getJoseki(title, 1000, (err, data) => {
        if (err) {
            res.status(500).send({
                message:
                err.message || "Some error occurred while retrieving players."
            });
        } else {
            /*const mocked = ogsMock.getPosition("15081");
            console.log('sucked ' ,JSON.stringify(mocked));
            const emptySGF = sgfutils.getEmptySGF();
            let currentNode = emptySGF.gameTrees[0];
            let currentIdx = 0;
            currentNode.nodes.push(sgfutils.makeNodeFromOGS(mocked))
            res.send(sgf.generate(emptySGF));*/
            //const mocked = ogsMock.getPosition("15081");
            ogsAPI.getPosition("15081", (mocked) => {
                //console.log('sucked ' ,JSON.stringify(mocked));
                const emptySGF = sgfutils.getEmptySGF();
                let currentNode = emptySGF.gameTrees[0];
                let currentIdx = 0;
                currentNode.nodes.push(sgfutils.makeNodeFromOGS(mocked))
                res.send(sgf.generate(emptySGF));

            });
        }
    });
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