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

module.exports = {
  //getOrders:  getOrders,
  getAll:  getAll,
  getJoseki:  getJoseki,
  setJoseki:  setJoseki,
  getOGSJoseki:  getOGSJoseki,
  setOGSJoseki:  setOGSJoseki
}