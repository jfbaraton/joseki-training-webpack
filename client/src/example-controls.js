import exampleSGF from "./baseSGF";
import sgfutils from "./utils";
import axios from "axios";

var sgf = require('smartgame');

import file1 from '!raw-loader!./test/eidogo_joseki_WR.sgf';
//import file1 from '!raw-loader!./test/1_hoshi_KGD_WR_clean.sgf';
//import file2 from '!raw-loader!./test/4_komoku_KGD_WR_clean.sgf';
//import file3 from '!raw-loader!./test/5_rest_KGD_WR_clean.sgf';

var collection = sgf.parse(file1.toString());
//sgfutils.merge(collection.gameTrees[0], sgf.parse(file2.toString()).gameTrees[0], 1, 1);
//sgfutils.merge(collection.gameTrees[0], sgf.parse(file3.toString()).gameTrees[0], 1, 1);
var previousLeafSignature = "";

const _getNextMoveOptions = function(game, isIgnoreErrors) {
    let sgfPosition = collection.gameTrees[0];
    const availableTransforms = sgfutils.getAllPossibleTransform();
    let isInSequence = Boolean(availableTransforms) && Boolean(availableTransforms.length);
    let nodeIdx = 0;
    let oneMove = null;
    for (let moveIdx = 0 ; moveIdx < game._moves.length ; moveIdx++) {
        oneMove =  game._moves[moveIdx];
        if (isInSequence) {
            //console.log('_getNextMoveOptions mv',moveIdx, ' transforms ', availableTransforms);
            let newsgfPosition = sgfutils.isInSequence(game, oneMove, nodeIdx+1, sgfPosition, availableTransforms, isIgnoreErrors);
            //console.log('AAAA                mv',newsgfPosition, ' transforms ', availableTransforms);
            if (newsgfPosition) {
                //console.log('BBB  in seq              mv',newsgfPosition, ' transforms ', availableTransforms);
                if(newsgfPosition === sgfPosition) {
                    //console.log('CCC  in seq              mv',newsgfPosition, ' transforms ', availableTransforms);
                    nodeIdx ++; // sgfPosition.nodes[] is the one way street that we have to follow before reaching the sequences
                } else {
                    //console.log('EEE  in seq              mv',newsgfPosition, ' transforms ', availableTransforms);
                    nodeIdx = 0; // sgfPosition.nodes[] was completed, so we continue with the sgfPosition.sequences (that iss newsgfPosition)
                    sgfPosition = newsgfPosition;
                }
            } else {
                //console.log('EEE NOT in seq              mv',newsgfPosition, ' transforms ', availableTransforms);
                isInSequence = false;
            }
        }
    }
    //console.log('_getNextMoveOptions finished in sequence ',isInSequence);
    return isInSequence? _childrenOptions(game, sgfPosition, nodeIdx+1, oneMove && oneMove.color === "black" ? "white" : "black", availableTransforms) : null;
};

const getPath = function(game) {
    let result = [];
    for (let moveIdx = 0 ; moveIdx < game._moves.length ; moveIdx++) {
        let oneMove =  game._moves[moveIdx];

        if(oneMove.pass) {
            result.push({pass:true});
        } else {
            result.push({y:oneMove.playedPoint.y, x:oneMove.playedPoint.x});
        }
    }
    return result;
};

const _getPathComment = function(game, isShowOriginalComment) {
    let pathComment = "path: ";
    let sgfPosition = collection.gameTrees[0];
    let pathCommentExtra = "extra";
    let availableTransforms = sgfutils.getAllPossibleTransform();
    let isInSequence = Boolean(availableTransforms) && Boolean(availableTransforms.length);
    let nodeIdx = 0;
    let lastoptions = "";
    for (let moveIdx = 0 ; moveIdx < game._moves.length ; moveIdx++) {
        let oneMove =  game._moves[moveIdx];
        if(oneMove.pass) {
            pathComment += "PASS - ";
        } else {
            pathComment += game.coordinatesFor(oneMove.playedPoint.y, oneMove.playedPoint.x);
            pathComment += " (" + sgfutils.pointToSgfCoord({y:oneMove.playedPoint.y, x:oneMove.playedPoint.x}) + ")";
            pathComment += " - ";
        }
        if (isInSequence) {
            let newsgfPosition = sgfutils.isInSequence(game, oneMove, nodeIdx+1, sgfPosition, availableTransforms);
            if (newsgfPosition) {
                if(newsgfPosition === sgfPosition) {
                    nodeIdx ++; // sgfPosition.nodes[] is the one way street that we have to follow before reaching the sequences
                } else {
                    nodeIdx = 0; // sgfPosition.nodes[] was completed, so we continue with the sgfPosition.sequences (that iss newsgfPosition)
                    sgfPosition = newsgfPosition;
                }
                //console.log('CORRECT PATH '+pathComment,newsgfPosition);
                pathCommentExtra = " correct!";
                lastoptions = _childrenOptionsAsString(game, sgfPosition, nodeIdx+1, oneMove.color === "black" ? "white" : "black", availableTransforms);
            } else {
                //console.log('WROOONG ',pathComment);
                pathCommentExtra = "instead of ";
                if(oneMove.pass) {
                    pathCommentExtra += "PASS ";
                } else {
                    pathCommentExtra += " " + game.coordinatesFor(oneMove.playedPoint.y, oneMove.playedPoint.x) + " ";
                    pathCommentExtra += " (" + sgfutils.pointToSgfCoord({y:oneMove.playedPoint.y, x:oneMove.playedPoint.x}) + ") ";
                }
                pathCommentExtra += "it was better to play "+lastoptions;
                isInSequence = false;
            }
        }
    }
    let result = pathComment+ "\n\n" +pathCommentExtra+ "\n\n" +(isInSequence && isShowOriginalComment ? (sgfPosition.nodes[nodeIdx].C || 'no comment') : "WROOOOOONG");
    //console.log('final pathComment ',result);
    return result;
};

// returns {node:sgfPosition, nodeIdx:nodeIdx}, to be used with result.node.nodes[result.nodeIdx]
const _getCurrentSGFNode = function(game, isIgnoreErrors) {
    let sgfPosition = collection.gameTrees[0];
    let availableTransforms = sgfutils.getAllPossibleTransform();
    let isInSequence = Boolean(availableTransforms) && Boolean(availableTransforms.length);
    let nodeIdx = 0;
    for (let moveIdx = 0 ; moveIdx < game._moves.length && isInSequence ; moveIdx++) {
        let oneMove =  game._moves[moveIdx];
        if (isInSequence) {
            let newsgfPosition = sgfutils.isInSequence(game, oneMove, nodeIdx+1, sgfPosition, availableTransforms, isIgnoreErrors);
            if (newsgfPosition) {
                if(newsgfPosition === sgfPosition) {
                    nodeIdx ++; // sgfPosition.nodes[] is the one way street that we have to follow before reaching the sequences
                } else {
                    nodeIdx = 0; // sgfPosition.nodes[] was completed, so we continue with the sgfPosition.sequences (that iss newsgfPosition)
                    sgfPosition = newsgfPosition;
                }
                //console.log('CORRECT PATH '+pathComment,newsgfPosition);
            } else {
                return null;
            }
        }
    }
    //console.log('final pathComment ',result);
    return {node:sgfPosition, nodeIdx:nodeIdx};
};

const _childrenOptionsAsString = function(game, gameTreeSequenceNode, nodeIdx, moveColor, availableTransforms) {
    //console.log('DEBUG ',gameTreeSequenceNode);
    let allOptions = _childrenOptions(game, gameTreeSequenceNode, nodeIdx, moveColor, availableTransforms)
    return allOptions && allOptions.length ? allOptions.map(
        oneMove => oneMove.pass ? "Tenuki" : game.coordinatesFor(oneMove.y,oneMove.x)
    ).join(" or ") : "";
};

const _childrenOptions = function(game, gameTreeSequenceNode, nodeIdx, moveColor, availableTransforms) {
    let childAsPoint;
    let result = [];
    let oneChildMoves;
    if(!availableTransforms || !availableTransforms.length) {return [];}
    //console.log('DEBUG ',gameTreeSequenceNode, nodeIdx);
    if(nodeIdx< gameTreeSequenceNode.nodes.length) {
        //console.log('_childrenOptions goes to nodes: only one option ',gameTreeSequenceNode.nodes);
        // we have only one option, because we are in the gameTreeSequenceNode.nodes[] one way street
        oneChildMoves = gameTreeSequenceNode.nodes.
            filter( (childNode, sequenceIdx) => sequenceIdx === nodeIdx). // we only consider the first move of the sequence
            filter(childNode => typeof (moveColor === "black" ? childNode.B : childNode.W)!== "undefined");

        if (oneChildMoves && oneChildMoves.length && sgfutils.isAcceptableMove(oneChildMoves[0], (nodeIdx >0 ? gameTreeSequenceNode.nodes[nodeIdx-1] : gameTreeSequenceNode.parent.nodes[gameTreeSequenceNode.parent.length-1]))) {
            if (moveColor === "black" ? oneChildMoves[0].B : oneChildMoves[0].W) {
                childAsPoint = sgfutils.sgfCoordToPoint(moveColor === "black" ? oneChildMoves[0].B : oneChildMoves[0].W);
                availableTransforms.forEach(oneTransform => {
                    const transformedMove = sgfutils.transformMove(childAsPoint, oneTransform);
                    if (!result.some(oneOption => (oneOption.pass && transformedMove.pass) || typeof transformedMove.x !== "undefined" && oneOption.x === transformedMove.x && oneOption.y === transformedMove.y )) {
                        //console.log('nodes accept move option ',transformedMove);
                        result.push(transformedMove);
                    }
                });
            } else {
                //console.log('nodes accept move option ',transformedMove);
                result.push({pass:true});
            }
        }
    } else {
        //console.log('_childrenOptions goes to sequences: SEVERAL options ',gameTreeSequenceNode.sequences);
        // we consider sequences
        for (let sequencesIdx = 0 ; gameTreeSequenceNode.sequences && sequencesIdx < gameTreeSequenceNode.sequences.length ; sequencesIdx++) {
            //console.log('DEBUG '+sequencesIdx,gameTreeSequenceNode.sequences[sequencesIdx]);
            let oneChild = gameTreeSequenceNode.sequences[sequencesIdx];

            oneChildMoves = oneChild.nodes.
                filter( (childNode, sequenceIdx) => sequenceIdx === 0). // we only consider the first move of the sequence
                filter(childNode => typeof (moveColor === "black" ? childNode.B : childNode.W)!== "undefined");

            //console.log('DEBUG oneChildMoves && oneChildMoves.length ',oneChildMoves && oneChildMoves.length);
            if (oneChildMoves && oneChildMoves.length && sgfutils.isAcceptableMove(oneChildMoves[0], gameTreeSequenceNode.nodes[gameTreeSequenceNode.nodes.length-1])) {
                //console.log('typeof oneChildMoves[0] defined ',typeof oneChildMoves[0].B !== "undefined" || typeof oneChildMoves[0].W !== "undefined");
                if (moveColor === "black" ? oneChildMoves[0].B : oneChildMoves[0].W) {
                    childAsPoint = sgfutils.sgfCoordToPoint(moveColor === "black" ? oneChildMoves[0].B : oneChildMoves[0].W);
                    availableTransforms.forEach(oneTransform => {
                        //console.log('Transform seq option ',childAsPoint, ' -- ',oneTransform, transformedMove);
                        const transformedMove = sgfutils.transformMove(childAsPoint, oneTransform);
                        if (!result.some(oneOption => (oneOption.pass && transformedMove.pass) || typeof transformedMove.x !== "undefined" && oneOption.x === transformedMove.x && oneOption.y === transformedMove.y )) {
                            //console.log('seq accept move option ',transformedMove, oneChildMoves[0],' childAsPoint ',childAsPoint );
                            result.push(transformedMove);
                        }
                    });
                } else {
                    //console.log('seq accept PASS option ');
                    result.push({pass:true});
                }
            }
        }
    }
    return result;
};

// An example setup showing how buttons could be set to board/game functionality.
const ExampleGameControls = function(element, game) {
    var controls = this;
    this.element = element;
    this.game = game;
    this.isKnownVersionLoaded = false;
    this.isAllowDifferentCorners = !localStorage.getItem("isAllowDifferentCorners") || localStorage.getItem("isAllowDifferentCorners") === "true";
    this.isAllowSymmetry = localStorage.getItem("isAllowSymmetry") === "true";
    this.textInfo = element.querySelector(".text-info p");
    this.gameInfo = element.querySelector(".game-info p");
    this.branchInfo = element.querySelector(".branch-info p");

    this.setText = function(str) {
        this.textInfo.innerText = str;
    };

    this.updateStats = function() {
        var newGameInfo = "";
        //newGameInfo += "Black stones captured: " + this.game.currentState().blackStonesCaptured;
        //newGameInfo += "\n\n";
        //newGameInfo +=  "White stones captured: " + this.game.currentState().whiteStonesCaptured;
        //newGameInfo += "\n\n";

        newGameInfo += "Move " + this.game.currentState().moveNumber;

        if (this.game.currentState().playedPoint) {
          newGameInfo += " (" + this.game.coordinatesFor(this.game.currentState().playedPoint.y, this.game.currentState().playedPoint.x) + ")";
        }


        var currentState = this.game.currentState();
        var currentNodeDespiteErrors = _getCurrentSGFNode(this.game, true);
        var currentNode = _getCurrentSGFNode(this.game);
        //localStorage.setItem("localStats", null);
        let localStats = sgfutils.deepParse(localStorage.getItem("localStats")) || new Map();

        if(currentNode) {
            //console.log('current node: ',currentNode);
            newGameInfo += ": Black Score "+currentNode.node.nodes[currentNode.nodeIdx].V || "??"+ " Pts";
            let currentSGFVariation = [];
            sgfutils.getVariationSGF(currentNode.node, currentNode.nodeIdx, currentSGFVariation, true);
            const emptySGF = sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19])');
            currentSGFVariation.forEach(node => emptySGF.gameTrees[0].nodes.push(node));
            //console.log('current path: ',sgf.generate(emptySGF));
            const moveSignature = sgfutils.getNodeSeparatedSGF({node:currentNode.node, nodeIdx:currentNode.nodeIdx});
            let nodeStats = localStats.get(moveSignature);
            //let nodeStats = addStatsForNode();
            console.log(' stats for move ('+this.game.currentState().moveNumber+') '+moveSignature+' :',nodeStats);
            //if(/*!nodeStats && */this.game.currentState().moveNumber > 1) {
            if(/*!nodeStats && */this.game.currentState().moveNumber > 4) {
            //if(this.game.currentState().moveNumber > 1 ) {
                if(!nodeStats) {
                    console.log('re-calculating stats for move '+this.game.currentState().moveNumber)
                    nodeStats = sgfutils.getZeroStats();
                }
                let freshStats = sgfutils.getZeroStats();
                sgfutils.addStats(freshStats,nodeStats);
                //let freshStats = nodeStats;
                sgfutils.getNodeStats( currentNode.node, currentNode.nodeIdx, freshStats, localStats);
                nodeStats = freshStats;
                localStorage.setItem("localStats",sgfutils.deepStringify(localStats));
            }
            newGameInfo += "\n"+(nodeStats && (nodeStats.leafCount + nodeStats.agg_leafCount )|| "Lots of")+" valid VARIATIONS to find ";
            if(nodeStats) {
                newGameInfo += JSON.stringify(nodeStats);
            }
        }

        if (currentState.pass) {
            var player = currentState.color[0].toUpperCase() + currentState.color.substr(1);
            newGameInfo += player + " PASSED (TENUKI)."
        }
        let nextMoveOptions = _getNextMoveOptions(game);
        // TODO add "protest" buttons to allow to add/remove variations
        if(nextMoveOptions && nextMoveOptions.length) {
            this.element.classList.remove("notInSequence");
            this.element.classList.remove("win");
        } else {
            let signature = null;
            let newStatToSet = null;
            let newStatToAdd = null;
            if(currentNode === null) {
                this.element.classList.add("notInSequence");
                signature = this.getVariationSGF({}, 1);
                newStatToAdd = {mistakeCount:1};
                //newStatToSet = {foundLeafCount:1};
            } else {
                signature = sgfutils.getNodeSeparatedSGF({node:currentNode.node, nodeIdx:currentNode.nodeIdx});
                this.element.classList.add("win");
                newStatToAdd = {successLeafCount:1};
                newStatToSet = {foundLeafCount:1};
            }
            if(signature && previousLeafSignature !== signature) {
                previousLeafSignature = signature;
                let nodeStats = sgfutils.setStatsForSignature(signature, newStatToSet, localStats);
                sgfutils.addStats(nodeStats, newStatToAdd);

                newGameInfo += "\nnew Stats for "+signature+":  "+JSON.stringify(nodeStats);
                localStorage.setItem("localStats",sgfutils.deepStringify(localStats));
            }
            nextMoveOptions = _getNextMoveOptions(game, true);
        }
        //console.log('current options:',nextMoveOptions);
        newGameInfo += "\n current options: "+ (nextMoveOptions && nextMoveOptions.map(oneMove => oneMove.pass ? "Tenuki" : this.game.coordinatesFor(oneMove.y,oneMove.x)).join(" or "));
        newGameInfo += "\n_getPathComment:\n"+_getPathComment(this.game, true);
        //newGameInfo += "\nEND of getPathComment \n";

        this.gameInfo.innerText = newGameInfo;

        this.setText("");
        if (currentState.pass) {
          var str = "";

          if (this.game.isOver()) {
            str += "Game over.";
            str += "\n"
            str += "Black's score is " + this.game.score().black;
            str += "\n";
            str += "White's score is " + this.game.score().white;
          }

          this.setText(str)
        } else {
          this.setText("");
        }
        setTimeout(this.autoPlay,500, game);
    };


    this.setup = function() {

        var passButton = document.querySelector(".pass");
        var undoButton = document.querySelector(".undo");
        var resetButton = document.querySelector(".reset");
        var mistakeButton = document.querySelector(".mistake");
        var josekiButton = document.querySelector(".joseki");
        var setPathButton = document.querySelector(".setPath");
        var testButton = document.querySelector(".test");
        var playAsWhite = document.querySelector("#isPlayAsWhite");
        var autoPlay = document.querySelector("#isAutoPlay");
        var allowDifferentCorners = document.querySelector("#isAllowDifferentCorners");
        var allowSymmetry = document.querySelector("#isAllowSymmetry");
        var allowDifferentCornersLabel = document.querySelector("#isAllowDifferentCornersLabel");
        var allowSymmetryContainer = document.querySelector("#isAllowSymmetryContainer");
        var autoPlayContainer = document.querySelector("#isAutoPlayContainer");
        var playAsWhiteContainer = document.querySelector("#isPlayAsWhiteContainer");

        this.updateGUIFromState = function(e) {
            if(controls.isAllowDifferentCorners) {
                allowDifferentCorners.checked = true;
                allowSymmetryContainer.style.display = "none";
                allowDifferentCornersLabel.innerText = "I want to play in any corner";
            } else {
                allowDifferentCorners.checked = false;
                allowSymmetryContainer.style.display = "block";
                allowDifferentCornersLabel.innerText = "I want to play in other corners than Top-right";
            }
            if(controls.isAllowSymmetry) {
                allowSymmetry.checked = true;
            } else {
                allowSymmetry.checked = false;
            }
            if(controls.isAutoplay === "white") {
                playAsWhiteContainer.style.display = "block";
                playAsWhite.checked = true;
                autoPlay.checked = true;
            } else if(controls.isAutoplay === "black") {
                playAsWhiteContainer.style.display = "block";
                playAsWhite.checked = false;
                autoPlay.checked = true;
            } else {
                playAsWhiteContainer.style.display = "none";
                playAsWhite.checked = false;
                autoPlay.checked = false;
            }
        }
        this.declareMistake = function(e) {
            e.preventDefault();
            controls.updateMoveWithConfirm({BM:'1', DM:''});
        }
        this.declareJoseki = function(e) {
            e.preventDefault();
            controls.updateMoveWithConfirm({BM:'',UC:'', DM:'2', GW:'', GB:''});
        }
        this.reset = function(e) {
            e.preventDefault();
            var startPath = JSON.parse(localStorage.getItem("startPath")) || [];
            while (controls.game.currentState().moveNumber /*&& controls.game.currentState().moveNumber != startPath.length*/) {
                controls.game.undo();
            }

            const availableTransforms =
                controls.isAllowDifferentCorners ? sgfutils.getAllPossibleTransform() :
                controls.isAllowSymmetry? sgfutils.getTopRightTransform() :
                sgfutils.getIdentityTransform();
            let oneTransformIdx = Math.floor(availableTransforms.length * Math.random());

            const oneTransform = availableTransforms[oneTransformIdx];
            startPath.forEach(oneMove => {
                if (oneMove.pass) {
                    controls.game.pass();
                } else {
                    const transformed = sgfutils.transformMove(oneMove, oneTransform);
                    controls.game.playAt(transformed.y, transformed.x);
                }

            });

        };

        this.setAutoplay = function(newIsAutoplay) {
            controls.isAutoplay =newIsAutoplay;
            localStorage.setItem("autoplay", newIsAutoplay);
            controls.updateGUIFromState();
        }

        playAsWhite.onclick = function(e) {
            //console.log('playAsWhite clicked ', playAsWhite, e);
            if(e.srcElement.checked) {
                controls.setAutoplay("white");
            } else {
                controls.setAutoplay("black");
            }
        };

        autoPlay.onclick = function(e) {
            //console.log('playAsWhite clicked ', playAsWhite, e);
            if(e.srcElement.checked) {
                controls.setAutoplay("black");
            } else {
                controls.setAutoplay(null);
            }
        };

        allowDifferentCorners.onclick = function(e) {
            //console.log('allowDifferentCorners clicked ', e);
            controls.isAllowDifferentCorners = e.srcElement.checked;
            localStorage.setItem("isAllowDifferentCorners", JSON.stringify(e.srcElement.checked));
            controls.updateGUIFromState();
        };

        allowSymmetry.onclick = function(e) {
            //console.log('allowSymmetry clicked ', e);
            controls.isAllowSymmetry = e.srcElement.checked;
            localStorage.setItem("isAllowSymmetry", JSON.stringify(e.srcElement.checked));
            controls.updateGUIFromState();
        };

        passButton.addEventListener("click", function(e) {
          e.preventDefault();

          controls.game.pass();
        });

        undoButton.addEventListener("click", function(e) {
          e.preventDefault();

          controls.game.undo();
        });

        setPathButton.addEventListener("click", function(e) {
            localStorage.setItem("startPath", JSON.stringify(getPath(controls.game)));
            controls.setText("Position saved! From now on, you can click on RESET to come back to the same variation");
        });
        testButton.addEventListener("click", function(e) {
            //controls.testMerge();
            //console.log('getVariationSGF:', controls.getVariationSGF({BM:'1'}));
            //controls.updateMoveWithConfirm({BM:'1'});
            //console.log('getVariationSGF:', '(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd];W[];B[nc];W[qc];B[qd];W[pc]BM[1])');
            //controls.postNewJosekiSGF('');

            sgfutils.download("fixed.sgf",sgf.generate(sgfutils.cleanSGF(collection)));
            //sgf.generate(sgfutils.cleanSGF(collection));

            //sgfutils.cleanSGF(collection);
            //controls.testNodeCleaner();

        });

        resetButton.addEventListener("click", this.reset);
        mistakeButton.addEventListener("click", this.declareMistake);
        josekiButton.addEventListener("click", this.declareJoseki);

        localStorage.setItem("knownVersions", JSON.stringify([]));
        // LAST getLatestSGF
        setTimeout(this.getLatestSGF,200);
        setTimeout(this.updateGUIFromState,200);

    }

    this.testNodeCleaner = function() {

        //sgfutils.cleanSGF(collection);
        /*const katrainNode = {
            B:'pd',LB:['qc:f','qd:h','rd:k','re:l','pf:b','qf:a','pg:c','qg:d','qh:i','qi:g','qj:j','dp:e'],
            KT:'H4sIAEqpqWMC/w3JeUgUURwA4EqzyyzUlc1tl9mZ99783rzRNc3IslLcMizKNCqSysryiMigwMgOCaIoPMAzdV1n110ddyXNtKzQICJD0RDTLro8StuwiE66vn+/D34KF4TmYZ59hjGE8CDyRUXGONAyPXsUEi/+rfxq/Y0z5+9f/IArACu7DsuD83SZ6AIuIQshDWJhH6uYY1QD3GbbJ2ERVmgLPsGWUl9+J1+Jv5AQ7CWnh/aEXQu/avrR1OfItT4WR7grNXOb2/QtMEj74CdNktZIt2WDaUEERLIVESYfxx54BqO1JYa4hgPoPc2d5kFteFiMpcdZdMjeJRsjMiMjw80csEtitnUf6lLM+HLNqkXeyEpSYQj6aRwbCLWFFYRnmJx2f/rC2G8/WFhW5RPsnZfNOVGj+B1G4RUUU708KWtDk0MzDG/FrcZflRbhVmW2UKLPRLfITaihX6lCRyGBjknDdLa0RSAwyedqx409l6KFKMyRDlGFfLpMEv7/dDoBu0GLykkqvSecKTkSfMxvHBlwPn5MdNANWdRMn0MSHBezoAoqIFFKQPmBWbo03Q2kQfHoG14ghoED0iFJNJB2UkXvSDnSa7YZrdb3cP2aNt6rsFy/gcd4gHSJU6Qbd+AZNFk+Kp+WvFgytnDzDOrldcp6yw1Lom61oOLzpBP/QWHopbhLfsImpAPSB1Ku6cXM1VEX1GBS3pVt4nNQAGb4jfhRY5FWSvdD0iVv2WgstdU4Jt0jrtTaSAerkLlvyIMTxAnRn5RxF8GLnacXpbu1vg2d6tnWDPWw0xjoqdtWlVI0zl0hGvEkCkTvmuPRU+hiLY0ad5Qrxz2zPoZrsP+xKtUXgsIFLZqFTSjVdko5hKJta7UxLtbU7t7h8m68ac2yf6k2lz7VpwnFyM538Sl1d2pLnXn6qfqHrpNN7SpxeBRcaDZ8594I53AvWUa241Y8VDy1uNp2SH2l/gNIfTzp0gIAAA==][H4sIAEqpqWMC/x1SW0hUURRd++o9505OiF4tX02aoylpjo5TWlIfBaJEQxCIlFEEDkKhaY8PQRkIhIGBokFxygoRBBGVCNNR0JSkFKEygvyK+grRDw2kn6ZlbPY5+9677tpr7XNsHEchfIyTrEpRBDdcjFTWlShAGfdD/NKIfsSRIQuIYRELzEnMYwlRWZVGOS9tRHoRwtPsuLsl7ZHzmdWiEvQJ1WeWmx2OaykR4621nmFKDnH5csftrQyk3jePmYOJLeqwbjY/J9apQbPEwOxNR4GcRgWuSoVdnxaVP7DlkmxIkfFFeiQsfRKQbXlhBKSaunbhcRY7FsQhLmmQxxIlok2Ckiud8juxLmWH/cqotF6vqT65IJflnryUERlmdpFrWOLmlDWGTKLeY0B9V7XGlISImZE5xpgM8I+g7CaUm5OchYfOwzrPChmrEmGvIfK8Jk9Q2ll9Nf1qBEeImscP3WRFjCVieoiMEhkiU7t8kBXt0zHksuMb1OhWXW2E+L6NeoKM2/RRy/26rlETOEDUHN6pb+ovfd/4j+pkNEiVpDOXzYNqETmcxCy69KiO0OFZcvRwFiHOLVk2kSxJymHFkEVdn9DlDOuo5JDrIT2uUnWD7GITWeJXTUkxnqIPdRK3x9ODVD0it4xtY1/CsrHX30tdd1PCqRv0WAGXBAo7fO3p0+YW9a1YPy2H5VIeta6703q9Q+4dnKGuXpRmdhf67fykj6ZHndMP9JZyq1ar3um3+92/Mp6TqwhX8IR8tqxhDNMY5foKE7xjazjFvuNoRglssuWhiquXXlzI5/3cu63ZKOZzJSd6FPtxEf8AFtRPCtQCAAA=][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',
            SQ:['dd','dp','pd'],MA:'pp',C:"Move 1: B Q16\n"+
            "Score: W+1.2\n"+
            "Win rate: W 58.2%\n"+
            "Predicted top move was Q4 (W+1.3).\n"+
            "PV: BQ4\n"+
            "Move was #4 according to policy  (9.58%).\n"+
            "Top policy move was Q4 (10.5%).\n"+
            "ㅤ​ㅤㅤ\n"+
            "Star Point = Hoshi = Hwajeom, Seongjeom = Xingwei\n"+
            "---------------------------------------------------------\n"+
            "\n"+
            "The star or hoshi (4-4) point, emphasizing influence at the potential expense of territory.\n\n"+

            "The first experiments with the star point were around 1840 in Japan; its first appearances in pro games date to the early 1900's.\n"+
            "Its rise to preeminence came during the 'New Fuseki' movement in Japan in the mid-1930's.\n\n"+

            "White approaches with 'a', 'b', 'c' or 'd'. White 'a' is the standard approach move. The variations after it cover the great majority of hoshi joseki. Other approaches invite a local loss, but may make sense strategically.\n\n"+

            "'e' covers White playing elsewhere. These variations show White approaches when there are multiple Black stones locally.\n\n"+

            "'f' shows the too early sansan invasion (which is not joseki).\n\n"+

            "'g' shows a splitting move (esp. when Black has already played at the top).\n\n"+

            "'h' is feasible if strategically sensible.\n\n"+

            "'i' is a move on the side preparing to approach from the other side.\n\n"+

            "'j', 'k' and 'l' are covered in another branching.\n\n"+

            "g7, f6, e5, d4, c3, b2, a1\n"

        };

        let copiedNode = JSON.parse(JSON.stringify(katrainNode));
        delete copiedNode.KT;
        copiedNode.V = -1.2;
        copiedNode.C =
        //"Move 1: B Q16\n"+
        //"Score: W+1.2\n"+
        //"Win rate: W 58.2%\n"+
        //"Predicted top move was Q4 (W+1.3).\n"+
        //"PV: BQ4\n"+
        //"Move was #4 according to policy  (9.58%).\n"+
        //"Top policy move was Q4 (10.5%).\n"+
        //"ㅤ​ㅤㅤ\n"+
        "Star Point = Hoshi = Hwajeom, Seongjeom = Xingwei\n"+
        "---------------------------------------------------------\n"+
        "\n"+
        "The star or hoshi (4-4) point, emphasizing influence at the potential expense of territory.\n\n"+

        "The first experiments with the star point were around 1840 in Japan; its first appearances in pro games date to the early 1900's.\n"+
        "Its rise to preeminence came during the 'New Fuseki' movement in Japan in the mid-1930's.\n\n"+

        "White approaches with 'a', 'b', 'c' or 'd'. White 'a' is the standard approach move. The variations after it cover the great majority of hoshi joseki. Other approaches invite a local loss, but may make sense strategically.\n\n"+

        "'e' covers White playing elsewhere. These variations show White approaches when there are multiple Black stones locally.\n\n"+

        "'f' shows the too early sansan invasion (which is not joseki).\n\n"+

        "'g' shows a splitting move (esp. when Black has already played at the top).\n\n"+

        "'h' is feasible if strategically sensible.\n\n"+

        "'i' is a move on the side preparing to approach from the other side.\n\n"+

        "'j', 'k' and 'l' are covered in another branching.\n\n"+

        "g7, f6, e5, d4, c3, b2, a1\n"

        sgfutils.cleanKatrainNode(katrainNode)
        console.log('wholenode:'+(JSON.stringify(katrainNode) == JSON.stringify(copiedNode)),katrainNode);
        console.log('KT:'+(katrainNode.KT === copiedNode.KT));
        console.log('C:'+(katrainNode.C === copiedNode.C));
        console.log('original:'+katrainNode.C);
        console.log('cleaned:'+copiedNode.C);
        console.log('V:'+(katrainNode.V === copiedNode.V));
        console.log('cleaned V:'+copiedNode.V);*/
        const katrainNode = collection.gameTrees[0].nodes[0];

        let copiedNode = JSON.parse(JSON.stringify(katrainNode));
        delete copiedNode.KT;
        //copiedNode.V = -1.2;
        copiedNode.C =
         "Kogo's Joseki Dictionary\n"+
         "-------------------------------------------------\n\n"+

         "Variation 1: 3-3 Point = San-san = Sam-sam = San-san\n"+
         "Variation 2: 3-4 Point = Komoku = Somok = Xiao~mu\n"+
         "Variation 3: 4-4 Point = Hoshi = Hwajeom, Seongjeom = Xingwei\n"+
         "Variation 4: 5-3 Point = Mokuhazushi = Waemok = Waimu\n"+
         "Variation 5: 5-4 Point = Takamoku = Gomok = Gaomu\n"+
         "Variation 6: 6-3 Point = Oomokuhazushi\n"+
         "Variation 7: 6-4 Point = Ootakamoku = Chaogao\n"+
         "Variation 8: 5-5 Point = Go-no-go = Wu~wu~\n"+
         "Variation 9: Reducing against 10-3\n\n\n"+


         "A joseki is a variation that gives an equitable result for both players. In other words, a joseki is fair to both players. A player should of course prefer a variation that gives a favorable result, but be satisfied with joseki in the context of whole-board strategy.\n\n"+

         "Choosing a joseki:\n"+
         "Since josekis work effectively in a certain direction, examine positions at adjacent corners and sides before choosing a joseki.\n\n"+

         "The opposite corner matters only if a ladder is involved. Some guidelines:\n"+
         "1. Have support for a fight. A high position provides support; a low position does not.\n"+
         "2. Take the side with most value.\n"+
         "2a. A juncture point for both sides is of great value.\n"+
         "2b. A side where making territory is uncertain is of little value.\n"+
         "3. Consider strategic balance.\n"+
         "4. Get sente if there are more big points on the board.\n"+
         "5. If there are two variations with similar outcome, but one with a ladder and one without, avoid the ladder, because you don't need to risk an opponent's ladder breaker.\n\n"+

         "How to learn joseki:\n"+
         "If you don't know joseki or a specific joseki, which you want to learn, don't try to remember every single variation you find here. Look first at the joseki. Then try to remember the easiest variations. When you learn a joseki, look also for the follow-ups in the middle and end game.\n\n"+

         "If something goes wrong or you want to know more, look up variations, special strategies, trick plays and mistakes. To understand why variations are only for special situations, or are always mistakes, compare their results with the results of joseki (instead of looking at their results in isolation).\n\n"+

         "Open this file twice to put two results beside each other on your screen.\n\n"+

         "-----------------------------------------------------------------------------------------------\n\n"+

         "Mistakes:\n"+
         "If you find a mistake in KJD content, please email kogo@waterfire.us.";

        sgfutils.cleanKatrainNode(katrainNode)
        console.log('wholenode:'+(JSON.stringify(katrainNode) == JSON.stringify(copiedNode)),katrainNode);
        console.log('KT:'+(katrainNode.KT === copiedNode.KT));
        console.log('C:'+(katrainNode.C === copiedNode.C));
        console.log('cleaned:'+katrainNode.C.slice(0,40));
        console.log('expected:'+copiedNode.C.slice(0,40));
        console.log('V:'+(katrainNode.V === copiedNode.V));
        console.log('cleaned V:'+katrainNode.V);
        console.log('expected V:'+copiedNode.V);
    }

    this.renderPropertyChanges = function(nodeProperties) {
        let changes = [];

        if(typeof nodeProperties.BM !== "undefined") {
            if(nodeProperties.BM) {
                changes.push("should be considered a big mistake, not even a joseki for low level players or an outdated joseki");
            } else {
                changes.push("is not a mistake");
            }
        }
        if(typeof nodeProperties.UC !== "undefined") {
            if(nodeProperties.UC) {
                changes.push("This move should not be part of the variation. Maybe a move to consider later in the game");
            } else {
                changes.push("is not a mistake");
            }
        }
        if(typeof nodeProperties.GW !== "undefined") {
            if(nodeProperties.GW) {
                changes.push("is good for white");
            } else {
                changes.push("is not (specially) good for white");
            }
        }
        if(typeof nodeProperties.GB !== "undefined") {
            if(nodeProperties.GB) {
                changes.push("is good for black");
            } else {
                changes.push("is not (specially) good for black");
            }
        }
        if(typeof nodeProperties.DM !== "undefined") {
            if(nodeProperties.DM) {
                changes.push("should be considered a joseki (this can also be for outdated joseki that dont have a clear refutation, and for joseki that are only good enough for amateur players)");
            } else {
                changes.push("is not (specially) even");
            }
        }
        return changes.join("\n --- ");
    }

    // nodeProperties contains the updated metadata for this move
    this.updateMoveWithConfirm = function(nodeProperties) {
        let text = "Are you sure that you want to submit the change?\n";
        if(nodeProperties) {
            text += "\n - Last played move:"+ controls.renderPropertyChanges(nodeProperties);
        } else {
            text += "\n - All the moves of this variation (just the one line) that were NOT in the DB, are going to be added to DB and accepted as valid moves";
        }
        if (confirm(text) == true) {
            let newSGF = controls.getVariationSGF(nodeProperties);
            //controls.postNewJosekiSGF(newSGF);
        }
    }

    this.autoPlay = function(game) {
        let startPath = JSON.parse(localStorage && localStorage.getItem("startPath") || "[]");
        //console.log('autoPlay startPath:', startPath);
        //console.log('autoPlay ? this.isAutoplay:', controls.isAutoplay);
        //console.log('autoPlay ? game.currentState().moveNumber:', game.currentState().moveNumber);
        //console.log('autoPlay ? game.currentState().color:', game.currentState().color);
        if(controls.isAutoplay && game.currentState().moveNumber >= startPath.length && game.currentState().color === controls.isAutoplay) {
            let nextMoveOptions = _getNextMoveOptions(game);
            // check if the next move should be played automatically
            if(nextMoveOptions && nextMoveOptions.length) {
                let nextMoveIdx = Math.floor(nextMoveOptions.length * Math.random());
                //if(nextMoveOptions[nextMoveIdx].pass || typeof nextMoveOptions[nextMoveIdx].x === "undefined" || nextMoveOptions[nextMoveIdx].x === null) {
                if(nextMoveOptions[nextMoveIdx].pass) {
                    game.pass();
                } else {
                    game.playAt(nextMoveOptions[nextMoveIdx].y, nextMoveOptions[nextMoveIdx].x);
                }
            }
        }
    }

    // returns a one thread variation SGF of the current board state
    // sets nodeProperties to the leaf, like BM for bad move, GW/GB for "Good for White/Black"
    this.getVariationSGF = function(nodeProperties, skippedLastMoves = 0) {
        const emptySGF = sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19])');
        // find polite transform based on first moves
        let currentSelectedTransform = sgfutils.getCurrentTransform(collection, game);

        //console.log('getVariationSGF currentSelectedTransform : ', currentSelectedTransform);
        for (let moveIdx = 0 ; moveIdx < game._moves.length-skippedLastMoves ; moveIdx++) {
            let oneMove =  game._moves[moveIdx];
            const node = moveIdx === game._moves.length-1 ? nodeProperties : {};
            const sgfCoords = oneMove.pass ? "" : sgfutils.pointToSgfCoord( sgfutils.revertMove({y:oneMove.playedPoint.y, x:oneMove.playedPoint.x}, currentSelectedTransform));
            //console.log('getVariationSGF original coords : ',(oneMove.pass ? "PASS" : {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x}), oneMove.pass ? "" : sgfutils.pointToSgfCoord( {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x}));
            //console.log('getVariationSGF sgfCoords : ', sgfCoords);
            if(oneMove.color === "black") {
                node.B = sgfCoords;
            } else {
                node.W = sgfCoords;
            }
            emptySGF.gameTrees[0].nodes.push(node);
        }
        return sgf.generate(emptySGF);
    }

    // SGF parameter has to be a string like '(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.51.1]KM[7.5]SZ[19]DT[2022-12-17];B[pd];W[];B[nc];W[qc];B[qd];W[pc]BM[1])'
    this.postNewJosekiSGF = function(SGF) {
        axios
            .post("/api/joseki", {
                SGF:SGF
            })
            .then(function (response) {
                console.log('POST response',response);
                controls.getLatestSGF();
            })
            .catch(function (error) {
                console.log('POST error',error);
            });
    }
    this.testMerge = function() {

        var sansan_simple_haneSGF           = String.raw`(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.51.1]KM[7.5]SZ[19]DT[2022-12-08];B[pd];W[qc];B[qd];W[pc];B[oc];W[ob];B[nc])`;
        var sansan_double_haneSGF           = String.raw`(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.51.1]KM[7.5]SZ[19]DT[2022-12-08];B[pd];W[qc];B[qd];W[pc];B[oc];W[ob];B[nb])`;
        var double_hane_continuationSGF     = String.raw`(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.51.1]KM[7.5]SZ[19]DT[2022-12-08];B[pd];W[qc];B[qd];W[pc];B[oc];W[ob];B[nb];W[nc])`;
        var sansan_hane_trickcutSGF         = String.raw`(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.51.1]KM[7.5]SZ[19]DT[2022-12-08];B[pd];W[qc];B[qd];W[pc];B[oc];W[ob];B[pb];W[nb])`;
        var sansan_hane_trickcut2SGF        = String.raw`(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.51.1]KM[7.5]SZ[19]DT[2022-12-08];B[pd];W[qc];B[qd];W[pc];B[oc];W[ob];B[pb];W[nb];B[bb])`;
        var sansan_hane_mistakeSGF          = String.raw`(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.51.1]KM[7.5]SZ[19]DT[2022-12-08];B[pd];W[qc];B[qd];W[pc];B[oc];W[ob];B[rc];W[nb];B[bb])`;

        var sansan_simple_hane = sgf.parse(sansan_simple_haneSGF);
        console.log('parsed sansan_simple_hane SGF: ', sansan_simple_hane);

        var sansan_double_hane = sgf.parse(sansan_double_haneSGF);
        console.log('parsed sansan_double_hane SGF: ', sansan_double_hane);

        var double_hane_continuation = sgf.parse(double_hane_continuationSGF);
        console.log('parsed double_hane_continuation SGF: ', double_hane_continuation);

        var sansan_hane_trickcut = sgf.parse(sansan_hane_trickcutSGF);
        console.log('parsed sansan_hane_trickcut SGF: ', sansan_hane_trickcut);

        var sansan_hane_trickcut2 = sgf.parse(sansan_hane_trickcut2SGF);
        console.log('parsed sansan_hane_trickcut2 SGF: ', sansan_hane_trickcut2);


        console.log('SGF-------------------- merge double hane into simple hane----------------------');
        sgfutils.merge(sansan_simple_hane.gameTrees[0], sansan_double_hane.gameTrees[0], 1, 1);
        var mergedSGF = sgf.generate(sansan_simple_hane);
        //fs.writeFileSync('sansan_merged.sgf', mergedSGF, { encoding: 'utf8' });

        console.log('merged SGF: ', sansan_simple_hane, sgf.parse(mergedSGF));
        console.log('merged SGF: ', mergedSGF);

        console.log('SGF2-------------------- merge trick into simple+double------------------------------------------');
        sgfutils.merge(sansan_simple_hane.gameTrees[0], sansan_hane_trickcut.gameTrees[0], 1, 1);
        var mergedSGF2 = sgf.generate(sansan_simple_hane);
        //fs.writeFileSync('sansan_merged2.sgf', mergedSGF2, { encoding: 'utf8' });

        console.log('merged SGF2: ', sansan_simple_hane, sgf.parse(mergedSGF2));
        console.log('merged SGF2: ', mergedSGF2);

        var simple_plus_double = sgf.parse(mergedSGF);
        console.log('parsed simple_plus_double SGF: ', simple_plus_double);

        console.log('SGF3--------------------- merge simple+double into trick (same result)-----------------------------------------');
        sgfutils.merge(sansan_hane_trickcut.gameTrees[0], simple_plus_double.gameTrees[0], 1, 1);
        var mergedSGF3 = sgf.generate(sansan_hane_trickcut);
        //fs.writeFileSync('sansan_merged3.sgf', mergedSGF3, { encoding: 'utf8' });

        console.log('merged SGF3: ', sansan_hane_trickcut, sgf.parse(mergedSGF3));
        console.log('merged SGF3: ', mergedSGF3);
        console.log('merged SGF2 =?= SGF3: ', mergedSGF2 === mergedSGF3);

        console.log('SGF4--------------------- merge trick cut into trickcut continuation-----------------------------------------');
        sgfutils.merge(sansan_hane_trickcut2.gameTrees[0], sansan_hane_trickcut.gameTrees[0], 1, 1);
        var mergedSGF4 = sgf.generate(sansan_hane_trickcut2);
        //fs.writeFileSync('sansan_merged3.sgf', mergedSGF3, { encoding: 'utf8' });

        console.log('merged SGF4: ', sansan_hane_trickcut2, sgf.parse(mergedSGF4));
        console.log('merged SGF4: ', mergedSGF4);

        sansan_double_hane = sgf.parse(sansan_double_haneSGF);
        console.log('SGF5-------------------- merge double hane continuation into double------------------------------------------');
        console.log('double_hane_continuation: ', sgf.generate(double_hane_continuation));
        sgfutils.merge(sansan_double_hane.gameTrees[0], double_hane_continuation.gameTrees[0], 1, 1);
        var mergedSGF5 = sgf.generate(sansan_double_hane);
        //fs.writeFileSync('sansan_merged3.sgf', mergedSGF3, { encoding: 'utf8' });

        console.log('merged SGF5: ', sansan_double_hane, sgf.parse(mergedSGF5));
        console.log('merged SGF5: ', mergedSGF5);


        simple_plus_double = sgf.parse(mergedSGF);
        console.log('SGF6-------------------- merge double hane continuation into simple + double------------------------------------------');
        console.log('double_hane_continuation: ', sgf.generate(double_hane_continuation));
        console.log('simple_plus_double: ', sgf.generate(simple_plus_double));
        sgfutils.merge(simple_plus_double.gameTrees[0], double_hane_continuation.gameTrees[0], 1, 1);
        var mergedSGF6 = sgf.generate(simple_plus_double);
        //fs.writeFileSync('sansan_merged3.sgf', mergedSGF3, { encoding: 'utf8' });

        console.log('merged SGF6: ', simple_plus_double, sgf.parse(mergedSGF6));
        console.log('merged SGF6: ', mergedSGF6);
        //console.log('double_hane_continuation: ', sgf.generate(double_hane_continuation));

        var trick_plus_double = sgf.parse(sansan_hane_trickcut2SGF);
        sansan_double_hane = sgf.parse(sansan_double_haneSGF);
        sgfutils.merge(trick_plus_double.gameTrees[0], sansan_double_hane.gameTrees[0], 1, 1);

        console.log('SGF7-------------------- merge double hane continuation+ simple into trick + double------------------------------------------');
        sgfutils.merge(trick_plus_double.gameTrees[0], simple_plus_double.gameTrees[0], 1, 1);
        var mergedSGF7 = sgf.generate(trick_plus_double);
        console.log('merged SGF7: ', trick_plus_double, sgf.parse(mergedSGF7));
        console.log('merged SGF7: ', mergedSGF7);
        console.log('--------------------------------------------------------------');

    }

    this.getLatestSGF = function() {
        let knownVersions = JSON.parse(localStorage && localStorage.getItem("knownVersions") || "[]");
        //console.log('getLatestSGF ', knownVersions);
        const lastKnownVersion = knownVersions.length && knownVersions[knownVersions.length-1].id || 0;
        let milestoneVersion = knownVersions.length && knownVersions[0].id || 0;

        if(!controls.isKnownVersionLoaded) {
            for(var SGFrevIdx = 0 ; SGFrevIdx < knownVersions.length; SGFrevIdx++) {
                console.log('loading version ', knownVersions[SGFrevIdx].id);
                if(knownVersions[SGFrevIdx].milestone){
                    // milestones are already merged, so we can throw away the previous versions
                    //console.log('init with ', knownVersions[SGFrevIdx]);
                    collection = sgf.parse(knownVersions[SGFrevIdx].SGF);
                    //console.log('init created ', collection);
                    controls.isKnownVersionLoaded = true;
                    milestoneVersion = knownVersions[SGFrevIdx].id;
                } else {
                    //console.log('merge with ', knownVersions[SGFrevIdx]);
                    //console.log('2merge with ', sgf.parse(knownVersions[SGFrevIdx].SGF));
                    sgfutils.merge(collection.gameTrees[0], sgf.parse(knownVersions[SGFrevIdx].SGF).gameTrees[0], 1, 1);
                    //console.log('merged ', collection);
                }
            }
            /*console.log('-----------------------------------------------------');
            const bm_variation = sgf.parse('(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.51.1]KM[7.5]SZ[19]DT[2022-12-17];B[pd];W[];B[nc];W[qc];B[qd];W[pc]BM[1])').gameTrees[0];
            sgfutils.merge(collection.gameTrees[0], bm_variation, 1, 1);
            console.log('merged ', collection, bm_variation);*/
        }
        axios
            .get("/api/joseki/"+lastKnownVersion)
            .then((res) => {
                if(res.data && res.data.length) {
                    for(var SGFrevIdx = 0 ; SGFrevIdx < res.data.length; SGFrevIdx++) {
                        console.log('adding version ', res.data[SGFrevIdx].id);
                        res.data[SGFrevIdx].SGF = sgfutils.bin2String(res.data[SGFrevIdx].SGF.data);
                        knownVersions.push(res.data[SGFrevIdx]);
                        if(res.data[SGFrevIdx].milestone){
                            //console.log('init with ', res.data[SGFrevIdx]);
                            collection = sgf.parse(res.data[SGFrevIdx].SGF);
                            milestoneVersion = knownVersions[SGFrevIdx].id;
                            //console.log('init created ', collection);
                        } else {
                            //console.log('merge with ', res.data[SGFrevIdx]);
                            sgfutils.merge(collection.gameTrees[0], sgf.parse(res.data[SGFrevIdx].SGF).gameTrees[0], 1, 1);
                            //console.log('merged ', collection);
                        }
                    }

                    // TODO filter out everything that precedes a milestone
                    knownVersions = knownVersions.filter(oneVersion => oneVersion.id >= milestoneVersion);
                    localStorage.setItem("knownVersions", JSON.stringify(knownVersions));
                }
            });
    }
};

export default ExampleGameControls;