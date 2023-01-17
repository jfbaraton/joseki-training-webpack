var sgf = require('smartgame');
var Db = require('./dboperations');
var ogsMock = require('./OGSMock');
var ogsAPI = require('./OGSAPI');
var sgfutils  = require('./utils');


module.exports = {
    savePositionsAndContinue : function(OGSPositions, joseki_id, emptySGF, current_node, req, res, isLast, pBorW) {
        const BorW = pBorW === "W" ? "B" : "W";
        //console.log('swap move after '+joseki_id+" : "+pBorW + " -> "+BorW);
        //console.log('savePositionsAndContinue starts '+joseki_id + " ("+(OGSPositions && OGSPositions.length)+") "+ " isLast "+isLast);
        if(OGSPositions) {
            const OGSNode = OGSPositions.filter(oneOGSmove =>
                oneOGSmove.placement !== "root" &&
                oneOGSmove.category && (oneOGSmove.category === "IDEAL" || oneOGSmove.category === "GOOD" ) &&
                oneOGSmove.node_id != joseki_id
            );
            //console.log('savePositionsAndContinue filtered '+joseki_id + " ("+(OGSNode && OGSNode.length)+")");
            if(OGSNode.length>1) {
                if(!current_node.sequences) {
                    current_node.sequences = [];
                }
                OGSNode.forEach(oneOGSmove => {
                    var newNode = { nodes : [], parent:current_node, sequences:[]};
                    current_node.sequences.push(newNode);
                    if(isLast) newNode.nodes.push(sgfutils.makeNodeFromOGS(oneOGSmove, BorW));
                    else this.suck(oneOGSmove.node_id, emptySGF, newNode, req, res, isLast, BorW);
                });
            } else if(OGSNode.length === 1){
                const oneOGSmove = OGSNode[0];
                var newNode = current_node;
                if(isLast) newNode.nodes.push(sgfutils.makeNodeFromOGS(oneOGSmove, BorW));
                else this.suck(oneOGSmove.node_id, emptySGF, newNode, req, res, isLast, BorW);
            }
        }
        if(isLast) {
            //console.log('savePositionsAndContinue isLast '+joseki_id);
            //res.send(sgf.generate(emptySGF));
            return;
        }
    },

    saveAndGetPositions : function(OGSNode, joseki_id, emptySGF, current_node, req, res, pisLast, BorW) {
        let isLast = pisLast;
        //console.log('saveAndGetPositions starts ('+current_node.nodes.length+')'+joseki_id+ " isLast "+isLast + JSON.stringify(sgfutils.makeNodeFromOGS(OGSNode, BorW)));
        if(OGSNode && OGSNode.placement !== "root") {
            current_node.nodes.push(sgfutils.makeNodeFromOGS(OGSNode, BorW));
        }
        //console.log('added node ('+current_node.nodes.length+'):'+sgf.generate(emptySGF));
        //console.log('added node ('+joseki_id+'):'+BorW);
        /*if(isLast) {
            res.send(sgf.generate(emptySGF));
            return;
        }*/
        Db.getOGSJoseki(joseki_id, 'Positions', (err, data) => {
            if (err) {
                res.status(500).send({
                    message:
                        err.message || "Some error occurred while retrieving players."
                });
                return;
            } else {
                if(data && data.length === 1) {
                    //console.log('found cached Positions for '+joseki_id);
                    //console.log('found cached data type '+typeof data[0]);
                    /*console.log('found cached data type '+JSON.stringify(data[0]));
                    console.log('found cached type '+typeof data[0].SGF);
                    console.log('cached SGF ###'+sgfutils.bin2String(data[0].SGF)+'###');*/
                    const cachedSGF = JSON.parse(sgfutils.bin2String(data[0].SGF));
                    //console.log('Position  '+cachedSGF.description);
                    this.savePositionsAndContinue(cachedSGF, joseki_id, emptySGF, current_node, req, res, isLast, BorW);
                } else {
                    //console.log('NO CACHED Positions for '+joseki_id);
                    ogsAPI.getPositions( joseki_id, (callResult) => {
                        let queried = callResult || [];
                        //console.log('sucked ' , JSON.stringify(queried));
                        console.log('sucked '+joseki_id + "("+(queried ? queried.length : typeof queried)+")");
                        //const emptySGF = sgfutils.getEmptySGF();
                        //let currentNode = emptySGF.gameTrees[0];
                        if(queried && typeof queried === "object" && !!queried.forEach) {
                            queried.forEach(oneQueried => {
                                if(oneQueried.see_also) {
                                    delete oneQueried.see_also;
                                }
                            });
                        } else {
                             console.log('ERROR sucking Positions '+joseki_id + "("+(queried ? queried.length : typeof queried)+")");
                             isLast = true;
                             queried = [];
                        }
                        Db.setOGSJoseki(joseki_id, 'Positions', JSON.stringify(queried), (err, data) => {
                            console.log('storeds '+joseki_id);
                            //Db.getJoseki(null, null, (err, data) => {
                            if (err)
                                res.status(500).send({
                                    message:
                                        err.message || "Some error occurred while posting joseki."
                                });
                            else {
                                //res.status(201).json(data);
                                /*currentNode.nodes.push(sgfutils.makeNodeFromOGS(queried, BorW))
                                if (isLast) {
                                    res.send(sgf.generate(emptySGF));
                                    return;
                                }*/
                                this.savePositionsAndContinue(queried, joseki_id, emptySGF, current_node, req, res, isLast, BorW);
                            }
                        });
                    });
                }
            }
        });
    },

    suck : function(joseki_id, emptySGF, current_node, req, res, pisLast, BorW) {
        //console.log('suck starts '+joseki_id + " isLast "+isLast);
        let isLast = pisLast;
        Db.getOGSJoseki(joseki_id, 'Position', (err, data) => {
            if (err) {
                res.status(500).send({
                    message:
                        err.message || "Some error occurred while retrieving players."
                });
                return;
            } else {
                if(data && data.length === 1) {
                    //console.log('found cached Position for '+joseki_id);
                    //console.log('found cached data type '+typeof data[0]);
                    //console.log('found cached data type '+JSON.stringify(data[0]));
                    //console.log('found cached type '+typeof data[0].SGF);
                    //console.log('cached SGF ###'+sgfutils.bin2String(data[0].SGF)+'###');
                    const cachedSGF = JSON.parse(sgfutils.bin2String(data[0].SGF));
                    //console.log('Position  '+cachedSGF.description);
                    this.saveAndGetPositions(cachedSGF, joseki_id, emptySGF, current_node, req, res, isLast, BorW);
                } else {
                    //console.log('NO CACHED Position for '+joseki_id);
                    ogsAPI.getPosition( joseki_id, (queried) => {
                        //console.log('sucked ' , JSON.stringify(queried));
                        //console.log('sucked ');
                        //const emptySGF = sgfutils.getEmptySGF();
                        //let currentNode = emptySGF.gameTrees[0];
                        if(queried && typeof queried === "object") {
                            if(queried.see_also) {
                                delete queried.see_also;
                            }
                        } else {
                            console.log('error fetching Position '+joseki_id);
                            isLast = true;
                        }
                        Db.setOGSJoseki(joseki_id, 'Position', JSON.stringify(queried), (err, data) => {
                            console.log('stored '+joseki_id);
                            //Db.getJoseki(null, null, (err, data) => {
                            if (err)
                                res.status(500).send({
                                    message:
                                        err.message || "Some error occurred while posting joseki."
                                });
                            else {
                                //res.status(201).json(data);
                                /*currentNode.nodes.push(sgfutils.makeNodeFromOGS(queried, BorW))
                                if (isLast) {
                                    res.send(sgf.generate(emptySGF));
                                    return;
                                }*/
                                this.saveAndGetPositions(queried, joseki_id, emptySGF, current_node, req, res, isLast, BorW);
                            }
                        });
                    });
                }
            }
        });
    }
};
