var sgf = require('smartgame');

// how many points can you lose in one move and still consider it "joseki"?
const JOSEKI_MARGIN = 2;

export default {
    getEmptySGF: function() {
        return sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19])');
    },

    sgfCoordToPoint:function(_18a){
        if(!_18a||_18a==="tt"){
            return {x:null,y:null,pass:true};
        }
        let _18b={a:0,b:1,c:2,d:3,e:4,f:5,g:6,h:7,i:8,j:9,k:10,l:11,m:12,n:13,o:14,p:15,q:16,r:17,s:18};
        return {x:_18b[_18a.charAt(0)],y:_18b[_18a.charAt(1)]};
    },

    pointToSgfCoord:function(pt){
        if(!pt||(this.board&&!this.boundsCheck(pt.x,pt.y,[0,this.board.boardSize-1]))){
            return "";
        }
        let pts={0:"a",1:"b",2:"c",3:"d",4:"e",5:"f",6:"g",7:"h",8:"i",9:"j",10:"k",11:"l",12:"m",13:"n",14:"o",15:"p",16:"q",17:"r",18:"s"};
        return pts[pt.x]+pts[pt.y];
    },

    getAllPossibleTransform:function(){
        // diagonal means symmetry along bot-left to top-right diagonal
        // horizontal means symmetry that transforms left to right
        // vertical means symmetry that transforms top to bottom
        const ALL_POSSIBLE_TRANSFORMS = [
            {diagonal:false, horizontal:false, vertical: false }, // identity, does not change anything
            {diagonal:false, horizontal:false, vertical: true  }, // R16 -> R4
            {diagonal:false, horizontal:true , vertical: false }, // R16 -> C16
            {diagonal:false, horizontal:true , vertical: true  }, // R16 -> C4
            {diagonal:true , horizontal:false, vertical: false }, // R16 -> Q17
            {diagonal:true , horizontal:false, vertical: true  }, // R16 -> Q3
            {diagonal:true , horizontal:true , vertical: false }, // R16 -> D17
            {diagonal:true , horizontal:true , vertical: true  }  // R16 -> D3
        ];

        return ALL_POSSIBLE_TRANSFORMS;
    },

    getTopRightTransform:function(){
        // diagonal means symmetry along bot-left to top-right diagonal
        // horizontal means symmetry that transforms left to right
        // vertical means symmetry that transforms top to bottom
        const ALL_POSSIBLE_TRANSFORMS = [
            {diagonal:false, horizontal:false, vertical: false }, // identity, does not change anything
            {diagonal:true , horizontal:false, vertical: false } // R16 -> Q17
        ];

        return ALL_POSSIBLE_TRANSFORMS;
    },


    getIdentityTransform:function(){
        // diagonal means symmetry along bot-left to top-right diagonal
        // horizontal means symmetry that transforms left to right
        // vertical means symmetry that transforms top to bottom
        const ALL_POSSIBLE_TRANSFORMS = [
            {diagonal:false, horizontal:false, vertical: false }
        ];

        return ALL_POSSIBLE_TRANSFORMS;
    },

    // if any availableTransform transforms sourcePoint into targetPoint, return them. otherwise return null
    getPossibleTransforms:function(sourcePoint, targetPoint, availableTransform){
        if(sourcePoint.pass && targetPoint.pass) {return availableTransform;}
        if(sourcePoint.pass || targetPoint.pass) {return null;}
        let result = [];
        availableTransform.forEach(oneTransform => {
            let target = this.transformMove(sourcePoint, oneTransform);
            //console.log('IS one possible transform ',targetPoint,' =?= ', sourcePoint, ' -- ',oneTransform,' -> ',target);
            if(target.y === targetPoint.y && target.x === targetPoint.x) {
                //console.log('found one possible transform ',targetPoint,' =?= ',oneTransform,' -> ',target);
                //console.log('YESS !');
                result.push(oneTransform);
            }
        });
        //console.log('return ', result);
        return result.length?result:null;
    },

    // if any availableTransform transforms sourcePoint into targetPoint, return them. otherwise return null
    transformMove:function(sourcePoint, oneTransform){
        if(sourcePoint.pass) {return sourcePoint;}
        let target = {y:sourcePoint.y, x:sourcePoint.x};
        if(oneTransform.diagonal) {
            target.y = 18-sourcePoint.x;
            target.x = 18-sourcePoint.y;
        }
        if(oneTransform.horizontal) {
            target.x = 18 - target.x;
        }
        if(oneTransform.vertical) {
            target.y = 18 - target.y;
        }
        return target;
    },
    // if any availableTransform transforms sourcePoint into targetPoint, return them. otherwise return null
    revertMove:function(sourcePoint, oneTransform){
        if(sourcePoint.pass) {return sourcePoint;}
        let target = {y:sourcePoint.y, x:sourcePoint.x};

        if( oneTransform.diagonal) {
            //console.log('swap diag ', target.y, target.x);
             target.y = 18-sourcePoint.x;
             target.x = 18-sourcePoint.y;
        }
        if( oneTransform.diagonal && oneTransform.vertical || !oneTransform.diagonal && oneTransform.horizontal) {
            //console.log('swap x ', target.x);
            target.x = 18 - target.x;
        }
        if(oneTransform.diagonal && oneTransform.horizontal || !oneTransform.diagonal && oneTransform.vertical) {
            //console.log('swap y ',target.y);
            target.y = 18 - target.y;
        }

        return target;
    },

    isAcceptableMove: function(node, previousNode, minimumScore) {
        if(!node || node.BM || node.UC) return false;
        if(node.DM || typeof node.B === "string" && node.B == '' || typeof node.W === "string" && node.W == '' ) return true; // joseki or pass always accepted

        if(previousNode) {
            // if same move color as the previous move, we don t accept
            if(this.areMovesSameColor(node,previousNode)) return false;
            const margin = typeof node.B === "string" ? JOSEKI_MARGIN : -JOSEKI_MARGIN;
            let scoreThreshold = typeof minimumScore !== "undefined" ? minimumScore : typeof previousNode.V !== "undefined" ? (parseFloat(previousNode.V)-margin) : null;
            if(typeof node.V !== "undefined" && scoreThreshold != null && node.W === "pc") {
                console.log("is acceptable based on V?", node);
                console.log("?", previousNode);
                console.log("B<?", typeof node.B === "string", parseFloat(node.V), scoreThreshold);
                console.log("W>?", typeof node.W === "string");
                if(typeof node.B === "string" && parseFloat(node.V)<scoreThreshold) { // black move
                    return false;
                } else if(typeof node.W === "string" && parseFloat(node.V)>scoreThreshold) { // white move
                    return false;
                }
            }

        }
        return true;
    },

    areMovesSameColor: function(node, previousNode) {
        if(!node || !previousNode) return false;
        return typeof node.B === typeof previousNode.B &&
                               typeof node.W === typeof previousNode.W;
    },

    copyMetadata: function(target, source) {
        //console.log("copyMetadata ", target, source);
        if(!source || !target) return;
        if(typeof source.BM !== "undefined") {target.BM = source.BM;}
        if(typeof source.UC !== "undefined") {target.UC = source.UC;}
        if(typeof source.GW !== "undefined") {target.GW = source.GW;}
        if(typeof source.GB !== "undefined") {target.GB = source.GB;}
        if(typeof source.DM !== "undefined") {target.DM = source.DM;}
    },

    isSameMove: function(node1, node2) {
        //console.log('isSameMove ? ', node1, node2);
        if (node1 === node2) return true;
        if (!node1 || !node2) return false;
        if (node1.pass && node2.pass) return true;
        if (node1.pass || node2.pass) return false;
        if (typeof node1.B !== "undefined" && node1.B === node2.B) return true;
        if (typeof node1.W !== "undefined"  && node1.W === node2.W) return true;

        return false;
    },

    getNodeSeparatedSGF: function(currentNode) {
        let currentSGFVariation = [];
        this.getVariationSGF(currentNode.node, currentNode.nodeIdx, currentSGFVariation, true);
        const emptySGF = this.getEmptySGF();
        currentSGFVariation.filter(node => !!node).forEach(node => emptySGF.gameTrees[0].nodes.push(node));
        return sgf.generate(emptySGF);
    },


    getVariationSGF: function(node, nodeIdx, result, isKeepOnlyMove, isRemoveComment) {
        if(!node.parent) return;
        if(node.parent && node.parent.gameTrees) {
            for (let nodesIdx = 1 ; node.nodes && nodesIdx < node.nodes.length && nodesIdx <= nodeIdx ; nodesIdx++) {
                result.push(this.copyNode(node.nodes[nodesIdx], isKeepOnlyMove, isRemoveComment));
            }
            return;
        }
        this.getVariationSGF(node.parent, 10000, result, isKeepOnlyMove, isRemoveComment);
        for (let nodesIdx = 0 ; node.nodes && nodesIdx < node.nodes.length && nodesIdx <= nodeIdx ; nodesIdx++) {
            result.push(this.copyNode(node.nodes[nodesIdx], isKeepOnlyMove, isRemoveComment));
        }
    },

    copyNode: function(nodeToCopy, isKeepOnlyMove, isRemoveComment) {
        let copiedNode;
        if(typeof nodeToCopy.B === "undefined" && typeof nodeToCopy.W === "undefined") return null;
        if (isKeepOnlyMove) {
            if(typeof nodeToCopy.B !== "undefined") {
                return {B:nodeToCopy.B};
            } else if(typeof nodeToCopy.W !== "undefined") {
                return {W:nodeToCopy.W};
            }
        } else {
            copiedNode = JSON.parse(JSON.stringify(nodeToCopy));
            if (isRemoveComment) {
                delete copiedNode.C;
            }
        }
        return copiedNode;
    },

    getCurrentTransform: function(collection, game) {
        let sgfPosition = collection.gameTrees[0];
        let availableTransforms = this.getAllPossibleTransform();
        let currentSelectedTransform = availableTransforms[0];
        let nodeIdx=0;
        for (let moveIdx = 0 ; moveIdx < 4 && moveIdx < game._moves.length && availableTransforms && availableTransforms.length ; moveIdx++) {
            let oneMove =  game._moves[moveIdx];
            let newsgfPosition = this.isInSequence(game, oneMove, nodeIdx+1, sgfPosition, availableTransforms);
            if(newsgfPosition) {
                if(newsgfPosition === sgfPosition) {
                    nodeIdx ++; // sgfPosition.nodes[] is the one way street that we have to follow before reaching the sequences
                } else {
                    nodeIdx = 0; // sgfPosition.nodes[] was completed, so we continue with the sgfPosition.sequences (that iss newsgfPosition)
                    sgfPosition = newsgfPosition;
                }
                currentSelectedTransform = availableTransforms && availableTransforms.length ? availableTransforms[0] : currentSelectedTransform;
            }
            //console.log('getVariationSGF currentSelectedTransform : ', currentSelectedTransform);
            //console.log('getVariationSGF transforms : ', availableTransforms && availableTransforms.length);
        }

        return currentSelectedTransform;
    },

        // is oneMove one of the allowed children of gameTreeSequenceNode
        // if so, returns the matching sequences.X object
    isInSequence : function(game, oneMove, nodeIdx, gameTreeSequenceNode, availableTransforms, isIgnoreErrors) {
        if(nodeIdx< gameTreeSequenceNode.nodes.length) {
            const oneChildMoves = gameTreeSequenceNode.nodes.
                filter( (childNode, sequenceIdx) => sequenceIdx === nodeIdx). // we only consider the "nodeIdx" move of the nodes
                filter(childNode => typeof (oneMove.color === "black" ? childNode.B : childNode.W) !== "undefined").
                filter(childNode => !oneMove.pass || (oneMove.color === "black" ? childNode.B : childNode.W) === "").
                filter(childNode => oneMove.pass || this.getPossibleTransforms(
                    this.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
                    {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                    availableTransforms));

            if(oneChildMoves && oneChildMoves.length && (isIgnoreErrors || this.isAcceptableMove(oneChildMoves[0], (nodeIdx >0 ? gameTreeSequenceNode.nodes[nodeIdx-1] : gameTreeSequenceNode.parent.nodes[gameTreeSequenceNode.parent.length-1])))) {
                if(!oneMove.pass) {
                    let childNode = oneChildMoves[0];
                    let newAvailableTransforms = this.getPossibleTransforms(
                         this.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
                         {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                         availableTransforms);
                    let idx = availableTransforms.length;
                    while (idx--) {
                        if (newAvailableTransforms.indexOf(availableTransforms[idx]) <0) {
                            availableTransforms.splice(idx, 1);
                        }
                    }
                }
                return gameTreeSequenceNode; // in sequence according to gameTreeSequenceNode.nodes
            } else {
                return false; // not in sequence
            }
        }

        for (let sequencesIdx = 0 ; gameTreeSequenceNode.sequences && sequencesIdx < gameTreeSequenceNode.sequences.length ; sequencesIdx++) {
            let oneChild = gameTreeSequenceNode.sequences[sequencesIdx];
            const oneChildMoves = oneChild.nodes && oneChild.nodes.
                filter( (childNode, sequenceIdx) => sequenceIdx === 0). // we only consider the first move of the sequence
                filter(childNode => typeof (oneMove.color === "black" ? childNode.B : childNode.W) !== "undefined").
                filter(childNode => !oneMove.pass || (oneMove.color === "black" ? childNode.B : childNode.W) === "").
                filter(childNode => oneMove.pass || this.getPossibleTransforms(
                     this.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
                     {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                     availableTransforms));

            if(oneChildMoves && oneChildMoves.length && (isIgnoreErrors || this.isAcceptableMove(oneChildMoves[0], gameTreeSequenceNode.nodes[gameTreeSequenceNode.nodes.length-1]))) {
                if(!oneMove.pass) {
                    let childNode = oneChildMoves [0];
                    let newAvailableTransforms = this.getPossibleTransforms(
                         this.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
                         {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                         availableTransforms);
                    let idx = availableTransforms.length;
                    while (idx--) {
                        if (newAvailableTransforms.indexOf(availableTransforms[idx]) <0) {
                            availableTransforms.splice(idx, 1);
                        }
                    }
                }
                return oneChild;// in sequence according to sequences.
            }
        }
        return false;
    },

    string2Bin: function(str) {
      var result = [];
      for (var i = 0; i < str.length; i++) {
        result.push(str.charCodeAt(i));
      }
      return result;
    },

    bin2String: function(array) {
        var result = "";
        for (var arrayIdx = 0; arrayIdx < array.length; arrayIdx++) {
            result += String.fromCharCode(array[arrayIdx]);
        }
        return result;
    },

    replacer: function(key, value) {
        if(value instanceof Map) {
            return {
                dataType: 'Map',
                value: Array.from(value.entries()), // or with spread: value: [...value]
            };
        } else {
            return value;
        }
    },

    reviver: function(key, value) {
        if(typeof value === 'object' && value !== null) {
            if (value.dataType === 'Map') {
                return new Map(value.value);
            }
        }
        return value;
    },

    deepStringify: function(object) {
        return JSON.stringify(object, this.replacer);
    },

    deepParse: function(str) {
        return JSON.parse(str, this.reviver);
    },

    cleanPassForShow: function(node) {
        let allNodeIdx = 0;
        while(node.nodes.length >1 && allNodeIdx <node.nodes.length) {
                // move is PASS
            if(node.nodes[allNodeIdx].C && node.nodes[allNodeIdx].C.indexOf('PASS to show continuation') >=0) {
                const lengthBefore = node.nodes.length
                node.nodes.splice(allNodeIdx, 1);
                //console.log('cleanPassForShow removed! '+lengthBefore +'->'+ node.nodes.length);
            } else {
                allNodeIdx++;
            }
        }

        if(node.nodes.length === 1 && node.nodes[0].C && node.nodes[0].C.indexOf('PASS to show continuation') >=0) {
            console.log('cleanPassForShow could not remove !', this.getNodeSeparatedSGF({node:node, nodeIdx:0}));
        }
        for(let seqIdx = 0 ; node.sequences && seqIdx < node.sequences.length;seqIdx++) {
            this.cleanPassForShow(node.sequences[seqIdx]);
        }
    },

    // check for several moves in a row by the same player
    // adds opponent PASS between them (when it is not a handicap move)
    // returns a gameTree
    cleanSGF: function(originalSGFOrgameTree) {
        // make a copy of the original gametree
        const originalSGFString = typeof originalSGFOrgameTree === "string" ? originalSGFOrgameTree : sgf.generate(originalSGFOrgameTree);
        let resultTree = sgf.parse(originalSGFString);
        this.cleanKatrainNode(resultTree.gameTrees[0].nodes[0]);
        this.cleanSGFBranch(resultTree.gameTrees[0], 1, resultTree.gameTrees[0].nodes[0], 1, 1)
        return resultTree;
    },

    cleanSGFBranch: function(node, pNodeIdx, lastMoveNode, moveNumberIfHandicap, moveNumber) {
        let nodeIdx = pNodeIdx;

        //look for pass+pass+move
        let allNodeIdx = 0;
        while(nodeIdx < node.nodes.length && node.nodes.length >1 && allNodeIdx <node.nodes.length) {
            if(!node.nodes[allNodeIdx].B && !node.nodes[allNodeIdx].W) {
                // move is PASS
                if(node.nodes[allNodeIdx].C === 'PASS to show continuation') {
                    node.nodes.splice(allNodeIdx, 1);
                    if(allNodeIdx <nodeIdx) {
                        nodeIdx--;
                    }
                } else {
                    allNodeIdx++;
                }
            } else {
                allNodeIdx++;
            }
        }

        let isHandicap = moveNumberIfHandicap;
        if(nodeIdx < node.nodes.length) {

            // next move is in nodes
            //this.isTenukiAsD4({node:node, nodeIdx:nodeIdx}, moveNumber);
            //this.is17N16({node:node, nodeIdx:nodeIdx}, moveNumber);
            if(node.nodes[nodeIdx].AW || node.nodes[nodeIdx].AB) {
                this.deleteVariation(node,nodeIdx);
                return;
            }
            if(this.areMovesSameColor(node.nodes[nodeIdx],lastMoveNode)) {
                if(isHandicap) {
                    isHandicap ++;
                } else {
                    // add a PASS from the opponent
                    this.addPASSBefore(node, nodeIdx, lastMoveNode);
                    // nodeIdx++;
                }
            } else {
                isHandicap = 0;
            }
            this.cleanKatrainNode(node.nodes[nodeIdx]);
            this.cleanSGFBranch(node, nodeIdx+1, node.nodes[nodeIdx], isHandicap, moveNumber+1);
            return;
        }
        const originalIsHandicap = isHandicap;
        // next move is in sequences
        // keep track on same color move indexes
        const sameColorSequences = [];
        let passSequenceIdx = -1;
        for (let sequencesIdx = 0 ; node.sequences && sequencesIdx < node.sequences.length ; sequencesIdx++) {
            isHandicap = originalIsHandicap;
            let oneChild = node.sequences[sequencesIdx];
            //this.is14O16({node:oneChild, nodeIdx:0}, moveNumber);
            //this.isTenukiAsD4({node:oneChild, nodeIdx:0}, moveNumber);
            //this.is17N16({node:oneChild, nodeIdx:0}, moveNumber);
            if(oneChild.nodes[0].AW || oneChild.nodes[0].AB) {
                this.deleteVariation(oneChild,0);
                sequencesIdx--;
                continue;
            } else if(this.areMovesSameColor(oneChild.nodes[0],lastMoveNode)) {
                if(isHandicap) {
                    isHandicap ++;
                } else {
                    // add a PASS from the opponent as first move of the sequence
                    //this.addPASSBefore(oneChild, 0, lastMoveNode);
                    // add a PASS from the opponent as last .nodes
                    //this.addPASSBefore(node, nodeIdx, lastMoveNode);
                    sameColorSequences.push(sequencesIdx);
                    continue;
                }
            } else {
                if(!oneChild.nodes[0].B && !oneChild.nodes[0].W && sequencesIdx <0) { // is pass
                    passSequenceIdx = sequencesIdx;
                }
                isHandicap = 0;
            }
            this.cleanKatrainNode(oneChild.nodes[0]);
            this.cleanSGFBranch(oneChild, 1, oneChild.nodes[0], isHandicap, moveNumber+1);
            if(passSequenceIdx>=0 && passSequenceIdx < node.sequences.length && (node.sequences[passSequenceIdx].nodes[0].B || node.sequences[passSequenceIdx].nodes[0].W)) {
                passSequenceIdx = -1;
            }
        }

        if(sameColorSequences.length) {
            if (passSequenceIdx < 0) {
                // create a pass sequence
                let addedMove = {
                    nodes: [typeof lastMoveNode.W !== "undefined" ? {
                            B: '',
                            C: 'PASS to show continuationz',
                            UC: 1
                        } : {W: '', C: 'PASS to show continuation', UC: 1}
                    ],
                    parent :node,
                    sequences:[]
                };
                node.sequences.push(addedMove);
                passSequenceIdx = node.sequences.length - 1;
            } else {
                // there was already a pass sequence
                // make it one move long, and move the main variation (after pass) from nodes to sequences
                node.sequences[passSequenceIdx].sequences.push(
                    {
                        nodes:node.sequences[passSequenceIdx].nodes.splice(1, node.sequences[passSequenceIdx].nodes.length-1),
                        parent:node.sequences[passSequenceIdx],
                        sequences:node.sequences[passSequenceIdx].sequences
                    });
            }
            if (!node.sequences[passSequenceIdx].sequences) {
                node.sequences[passSequenceIdx].sequences = [];
            }
            // move all sameColorSequences to passSequenceIdx.sequences
            for (let sequencesIdx2 = sameColorSequences.length - 1; sequencesIdx2 >= 0; sequencesIdx2--) {
                if(sameColorSequences.length>1 || node.sequences[passSequenceIdx].sequences.length) {
                    node.sequences[passSequenceIdx].sequences.push(node.sequences[sameColorSequences[sequencesIdx2]]);
                } else {
                    // add the sequence straight after the pass, in nodes
                    node.sequences[passSequenceIdx].nodes.splice(1,0,...node.sequences[sameColorSequences[sequencesIdx2]].nodes.splice(1, node.sequences[sameColorSequences[sequencesIdx2]].nodes.length-1));
                }
                node.sequences.splice(sameColorSequences[sequencesIdx2],1);
                if(sameColorSequences[sequencesIdx2] < passSequenceIdx) {
                    passSequenceIdx--;
                }
            }
            let oneChild = node.sequences[passSequenceIdx];
            this.cleanSGFBranch(oneChild, 1, oneChild.nodes[0], isHandicap, moveNumber+1);
        }
    },
/*
    is14O16: function(currentNode, moveNumber){
        const O16 = "nd";
        let move = currentNode.node.nodes[currentNode.nodeIdx];
        if(14 === moveNumber && (move.B === O16 || move.W === O16)) {
            console.log('found O16 as move 14 : ',this.getNodeSeparatedSGF({node:currentNode.node, nodeIdx:currentNode.nodeIdx}));
        }

    },
    is17N16: function(currentNode, moveNumber){
        const N16 = "md";
        let move = currentNode.node.nodes[currentNode.nodeIdx];
        if(18 === moveNumber && (move.B === N16 || move.W === N16)) {
            console.log('found N16 as move 17 : ',this.getNodeSeparatedSGF({node:currentNode.node, nodeIdx:currentNode.nodeIdx}));
        }

    },
    isTenukiAsD4: function(currentNode, moveNumber){
        const D4 = "dp";
        let move = currentNode.node.nodes[currentNode.nodeIdx];
        if(move.B === D4 || move.W === D4) {
            console.log('found Tenuki as D4 : ',this.getNodeSeparatedSGF({node:currentNode.node, nodeIdx:currentNode.nodeIdx}));
            if(move.B === D4) {
                move.B = '';
            } else {
                move.W = '';
            }
        }

    },*/

    addPASSBefore: function(node, nodeIdx, lastMoveNode) {
        //console.log('addPASSBefore '+nodeIdx, lastMoveNode);
        // make a PASS that is a UC (unclear) move, so that the branch is not explored as a continuation
        // the reasons is that those double moves can have different purpose, like to show later continuations (not supposed to happen NOW)
        // we could find a different way/metadata to differentiate those variations
        let addedMove = typeof lastMoveNode.W !== "undefined" ? {B:'', C:'PASS to show continuations', UC:1} : {W:'', C:'PASS to show continuation', UC:1};

        node.nodes.splice(nodeIdx, 0, addedMove); // add move at index nodeIdx, deleting 0 nodes
    },

    deleteVariation: function(node, nodeIdx) {
        console.log('deleteVariation '+nodeIdx);
        if(nodeIdx > 0){
            // delete this node and the following ones from .nodes
            node.nodes.splice(nodeIdx, node.nodes.length-nodeIdx);
            // delete .sequences
            delete node.sequences;
        } else {
            // delete sequence from parent
            let seqIdx = node.parent.sequences.findIndex(oneSeq => oneSeq === node);
            node.parent.sequences.splice(seqIdx,1);
        }
    },

    cleanKatrainNode: function(node) {
        if (node.KT)
            delete node.KT;

        if (node.C) {
            const katrainCommentStart = "Move";
            const katrainScoreStart = "Score: ";
            const katrainCommentEnd = "​";
            const katrainCommentEnd2 = "";
            //const katrainCommentEnd3 = "¤";
            const katrainCommentEnd3 = "¤";

            const katrainCommentStartIdx = node.C.indexOf(katrainCommentStart);
            const katrainScoreStartIdx = node.C.indexOf(katrainScoreStart);
            let katrainCommentEndIdx = node.C.lastIndexOf(katrainCommentEnd);
            let katrainCommentEnd2Idx = node.C.lastIndexOf(katrainCommentEnd2);
            let katrainCommentEnd3Idx = node.C.lastIndexOf(katrainCommentEnd3);
            //console.log('node has a comment ',katrainCommentStartIdx,katrainScoreStartIdx,katrainCommentEndIdx);
            //console.log('node has a comment ',(katrainCommentStartIdx >=0));
            //console.log('node has a comment ',(katrainScoreStartIdx >katrainCommentStartIdx));
            //console.log('node has a comment ',(katrainCommentEndIdx >katrainScoreStartIdx));
            //console.log('endings ', katrainCommentEndIdx, katrainCommentEnd2Idx, katrainCommentEnd3Idx);
            if (katrainCommentStartIdx >= 0 &&
                (katrainCommentEndIdx > katrainCommentStartIdx ||katrainCommentEnd2Idx > katrainCommentStartIdx ||katrainCommentEnd3Idx > katrainCommentStartIdx)) {
                // "Score: W+1.2\n"
                let endMaxIdx = Math.max(katrainCommentEndIdx,katrainCommentEnd2Idx,katrainCommentEnd3Idx);
                if(katrainScoreStartIdx > katrainCommentStartIdx && endMaxIdx > katrainScoreStartIdx) {
                    let scoreString = node.C.slice(katrainScoreStartIdx + katrainScoreStart.length, endMaxIdx);
                    scoreString = scoreString.slice(0, scoreString.indexOf("\n"));
                    //('scoreString #'+scoreString+'#');
                    let multiplier = 1;
                    if (0 === scoreString.indexOf("W")) multiplier = -1;
                    node.V = multiplier * parseFloat(scoreString.slice(1));
                }
                let newlineIdx = node.C.slice(endMaxIdx).indexOf("\n");
                if (newlineIdx >= 0 && newlineIdx < 4) {
                    endMaxIdx += newlineIdx;
                }

                node.C = node.C.slice(0, katrainCommentStartIdx) + node.C.slice(endMaxIdx + 1);
                //console.log('node.C #'+node.C+'#');
            }/* else if (katrainCommentStartIdx >= 0) {
                console.log('couldn t parse #'+node.C+'#', node);
            }*/

        }
        //console.log('cleanKatrainNode FINISHED');

    },

    download: function(filename, text) {
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    },

    // Start file download.
    //download("hello.txt","This is the content of my file :)");


    // everything from addedTree that is not already defined in masterTree will be added to masterTree
    merge: function(masterTree, addedTree, masterTreeNodeNextMoveIdx, addedTreeNodeNextMoveIdx) {
        //console.log('START merge ',masterTree, addedTree, masterTreeNodeNextMoveIdx, addedTreeNodeNextMoveIdx);

        const isMasterNextMoveInMasterNodes = masterTree && masterTree.nodes && masterTree.nodes.length && masterTree.nodes.length > masterTreeNodeNextMoveIdx;

        if(!addedTree || !addedTree.nodes || !addedTree.nodes.length) return;
        //console.log('the next node from addedTree is in nodes?  ', (addedTree && addedTree.nodes),')');

        // if the next node from addedTree is in nodes
        if(addedTree.nodes.length> addedTreeNodeNextMoveIdx) {
            //console.log('debug merge 10'); //OK
            //console.log('the next node from addedTree is in nodes (',addedTreeNodeNextMoveIdx,'/',addedTree.nodes.length-1,')');
            // look for this addedTree node in the masterTree next node
            if(isMasterNextMoveInMasterNodes) {
                //console.log('debug merge 100'); // OK
                //console.log('look for this addedTree node in the masterTree next node');
                if(this.isSameMove(masterTree.nodes[masterTreeNodeNextMoveIdx], addedTree.nodes[addedTreeNodeNextMoveIdx])) {
                    //console.log('debug merge 1000 ',addedTree); // OK
                    // SGF1
                    // if master has this addedTree node as the next node
                    //console.log('isSameMove(masterTree.nodes[masterTreeNodeNextMoveIdx], addedTree.nodes[addedTreeNodeNextMoveIdx]', masterTree.nodes[masterTreeNodeNextMoveIdx], addedTree.nodes[addedTreeNodeNextMoveIdx]);
                    this.copyMetadata(masterTree.nodes[masterTreeNodeNextMoveIdx], addedTree.nodes[addedTreeNodeNextMoveIdx]);
                    this.merge(masterTree, addedTree, masterTreeNodeNextMoveIdx+1, addedTreeNodeNextMoveIdx+1);
                    return;
                } else {
                    //console.log('debug merge 1001'); // OK
                    // SGF1
                    //console.log('nodes moves differ ', masterTree.nodes[masterTreeNodeNextMoveIdx], addedTree.nodes[addedTreeNodeNextMoveIdx]);
                    // nodes moves differ
                    // both addedTree node and master node become master sequences two options
                    // save master.sequences to tmp
                    let seqTMP = masterTree.sequences;
                    masterTree.sequences = [];
                    // master remaining nodes -> master.sequences[0]
                    // seqTMP -> master.sequences[0].sequences
                    masterTree.sequences.push({
                        nodes:masterTree.nodes.slice(masterTreeNodeNextMoveIdx),
                        parent:masterTree,
                        sequences:seqTMP
                    });

                    // addedTree remaining nodes -> master.sequences[1]
                    // addedTree.sequences -> master.sequences[1].sequences
                    masterTree.sequences.push({
                        nodes:addedTree.nodes.slice(addedTreeNodeNextMoveIdx),
                        parent:masterTree,
                        sequences:addedTree.sequences
                    });

                    masterTree.nodes = masterTree.nodes.slice(0,masterTreeNodeNextMoveIdx);
                    // TODO check all parents
                    return;
                }
            } else if (masterTree.sequences && masterTree.sequences.length) {
                //console.log('debug merge 101 ', masterTree.sequences, addedTree.nodes[addedTreeNodeNextMoveIdx]); // OK
                // next master move is in master.sequences

                // look in master.sequences if one corresponds
                const matchingMasterSeq =  masterTree.sequences.find( masterSeq => this.isSameMove(masterSeq.nodes[0], addedTree.nodes[addedTreeNodeNextMoveIdx]));
                //console.log('debug merge 101 found? ', matchingMasterSeq);

                if(matchingMasterSeq) {
                    //console.log('debug merge 1010'); // OK
                    // SGF6
                    // if one corresponds, merge from index 0 if this master.sequences[matchingMoveIdx]
                    this.copyMetadata(matchingMasterSeq.nodes[0], addedTree.nodes[addedTreeNodeNextMoveIdx]);
                    this.merge(matchingMasterSeq, addedTree, 1, addedTreeNodeNextMoveIdx+1);
                    return;
                } else {
                    //console.log('debug merge 1011'); // OK
                    // SGF2
                    // if no move corresponds, this addedTree.nodes[addedTreeNodeNextMoveIdx] is a new sequence for master.sequences
                    masterTree.sequences.push({
                        nodes:addedTree.nodes.slice(addedTreeNodeNextMoveIdx ),
                        parent:masterTree.sequences[0].parent,
                        sequences:addedTree.sequences
                    });
                    // TODO check all parents
                }
                return;
            } else {
                //console.log('debug merge 102'); // OK
                // SGF5
                // no move in master
                // add all remaining addedTree.nodes at the end of master.nodes
                 masterTree.nodes.push(...addedTree.nodes.slice(addedTreeNodeNextMoveIdx ));
                // addedTree.sequences -> master.sequences
                 masterTree.sequences = addedTree.sequences;
                // TODO check all parents
                return;
            }

        } else if(addedTree.sequences && addedTree.sequences.length){
            //console.log('debug merge 11'); // OK
            // if the next node from addedTree is in sequences
            if(isMasterNextMoveInMasterNodes) {
                //console.log('debug merge 110'); //OK
                // SGF3
                const matchingAddedTreeSeqIdx = addedTree.sequences.findIndex(
                    oneAddedTreeSeq => this.isSameMove(masterTree.nodes[masterTreeNodeNextMoveIdx], oneAddedTreeSeq.nodes[0]));
                let seqTMP = masterTree.sequences;
                addedTree.sequences.push({
                    nodes:masterTree.nodes.slice(masterTreeNodeNextMoveIdx),
                    parent:masterTree.nodes[masterTreeNodeNextMoveIdx].parent,
                    sequences:seqTMP
                });

                masterTree.sequences = addedTree.sequences;
                masterTree.nodes = masterTree.nodes.slice(0,masterTreeNodeNextMoveIdx);

                if (matchingAddedTreeSeqIdx>=0) {
                    // console.log('debug merge 1100'); // OK
                    // SGF4
                    // if addedTree.sequences contains next master move
                    masterTree.sequences.splice(matchingAddedTreeSeqIdx,1);
                    // -> call recursively merge on those identical sequence nodes
                    this.copyMetadata(masterTree.sequences[addedTree.sequences.length-1].nodes[0],masterTree.sequences[matchingMasterSeqIdx].nodes[0]);
                    this.merge(masterTree.sequences[addedTree.sequences.length-1],masterTree.sequences[matchingMasterSeqIdx], 1, 1);
                }
                // TODO check all parents
                // and that's it, no need to merge the rest of this addedTree !!
                return;
            }
            //console.log('debug merge 111'); // Ok
            // both master and addedTree have their next move in .sequences
            for(let addedTreeSeqIdx = 0; addedTreeSeqIdx < addedTree.sequences.length ; addedTreeSeqIdx ++ ) {
                const oneAddedTreeSeq = addedTree.sequences[addedTreeSeqIdx];
                const matchingMasterSeq = masterTree.sequences && masterTree.sequences.length && masterTree.sequences.find(
                        oneMasterSeq => this.isSameMove(oneMasterSeq.nodes[0], oneAddedTreeSeq.nodes[0]));
                if (matchingMasterSeq) {
                    // if master has this sequence in its sequences
                    // -> call recursively merge on those identical sequence nodes
                    //console.log('debug merge 1110 ',matchingMasterSeq); //OK
                    // SGF7
                    this.copyMetadata(matchingMasterSeq.nodes[0],oneAddedTreeSeq.nodes[0]);
                    this.merge(matchingMasterSeq, oneAddedTreeSeq, 1, 1);
                } else {
                    //console.log('debug merge 1111'); // OK
                    // SGF7
                    if( !masterTree.sequences || !masterTree.sequences.length) {
                        masterTree.sequences = [];
                    }
                    masterTree.sequences.push(oneAddedTreeSeq);
                    // TODO check all parents
                    oneAddedTreeSeq.parent = masterTree;
                }
            }
        }
    }
};
