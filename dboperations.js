// dbOperation.js
const sql = require("./db.js");
var sgf = require('smartgame');

getAll = (title, result) => {
  let query = "SELECT id, nickname, avatar FROM player";

  sql.query(query, (err, res) => {
    if (err) {
      console.log("error: ", err);
      result(null, err);
      return;
    }

    console.log("players: ", res);
    result(null, res);
  });
};

getJoseki = (title, id,  result) => {
    var idFilter = "";
    try{
        if(id && id == parseInt(id)) {
            idFilter = "id > "+id+" AND ";
        }
    } catch (error) {

    }
    //select id from sgfs where id >= (select max(id) from sgfs where milestone is not null and tags like '%joseki%' );
    let query = "SELECT id, tags, recordtime, milestone, SGF FROM sgfs where "+idFilter+"id >= (select max(id) from sgfs where milestone is not null and tags like '%joseki%' ) AND tags like '%joseki%' order by id";

    sql.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, err);
            return;
        }

        console.log("joseki: ", res);
        result(null, res);
    });
};

getOGSJoseki = (joseki_id, endpoint,  result) => {
    var idFilter = "joseki_id = "+parseInt(joseki_id)+" AND ";
    //select id from sgfs where id >= (select max(id) from sgfs where milestone is not null and tags like '%joseki%' );
    let query = "SELECT SGF FROM OGS where "+idFilter+"endpoint = '"+endpoint+"'";

    sql.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, err);
            return;
        }

        //console.log("OGSjoseki: ", res.length);
        result(null, res);
    });
};

setOGSJoseki = (joseki_id, endpoint, SGF,  result) => {
    try{
        if(!SGF || typeof SGF !== "string") throw 'no SGF';
        if(!joseki_id ) throw 'no joseki_id';
        if(!endpoint  || typeof endpoint !== "string") throw 'no endpoint';

        let query = "INSERT INTO `OGS` (`joseki_id`, `endpoint`, `SGF`) VALUES "+
                    "("+joseki_id+", '"+endpoint+"', ?)";

        sql.query(query, SGF,(err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, err);
                return;
            }

            //console.log("set OGS joseki: ", res);
            result(null, res);
        });
    } catch (error) {
        console.log('ERROR storing ', error);
        result(error, {error:error});
    }
};

setJoseki = (SGF,  result) => {
    var idFilter = "";
    try{
        if(!SGF || typeof SGF !== "string") throw 'no SGF';
        var collection = sgf.parse(SGF);
        if(!collection || !collection.gameTrees || !collection.gameTrees.length || (collection.gameTrees[0].nodes.length + collection.gameTrees[0].sequences.length) < 2) throw 'wrong SGF';

        let query = "INSERT INTO `sgfs` (`recordtime`, `tags`, `milestone`, `SGF`) VALUES "+
                    "(20210207232426, 'joseki', NULL, ?)";

        sql.query(query, SGF,(err, res) => {
            if (err) {
                console.log("error: ", err);
                result(null, err);
                return;
            }

            console.log("joseki: ", res);
            result(null, res);
        });
    } catch (error) {
        result(null, {error:error});
    }
};

getHandicap_SGF = (sGF, limit, result) => {
    var filterClause = sGF ? "SGF like '"+sGF+"'" : "move_amount > 0";
    let limitClause = limit ? " LIMIT "+limit : "";
    let query = "SELECT * FROM `handicap_sgfs` where "+filterClause+" ORDER BY recordtime DESC"+limitClause;

    sql.query(query, (err, res) => {
        if (err) {
            console.log("error: ", err);
            result(err, err);
            return;
        }

        console.log("Handicap SGF: ", res.length);
        result(null, res);
    });
}


addHandicap_SGF = (SGF, amountOfMoves, black_score,  result) => {
    try{
        if(!SGF || typeof SGF !== "string") throw 'no SGF';
        var collection = sgf.parse(SGF);
        //console.log("sGF: ", collection);
        if(!collection || !collection.gameTrees || !collection.gameTrees.length) throw 'wrong SGF';

        let query = "INSERT INTO `handicap_sgfs` (`recordtime`, `tags`, `milestone`, `SGF`, `move_amount`, `black_score`) VALUES "+
            "(20210207232426, 'joseki', NULL, ?, "+amountOfMoves+", "+black_score+")";

        sql.query(query, SGF, (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(null, err);
                return;
            }

            //console.log("handicap eval: ", res);
            result(null, res);
        });
    } catch (error) {
        result(null, {error:error});
    }
};

module.exports = {
  //getOrders:  getOrders,
  getAll:  getAll,
  getJoseki:  getJoseki,
  setJoseki:  setJoseki,
  getHandicap_SGF:  getHandicap_SGF,
  addHandicap_SGF:  addHandicap_SGF,
  getOGSJoseki:  getOGSJoseki,
  setOGSJoseki:  setOGSJoseki
}