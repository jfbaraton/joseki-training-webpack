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
            result(null, err);
            return;
        }

        console.log("joseki: ", res);
        result(null, res);
    });
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
  setJoseki:  setJoseki
}