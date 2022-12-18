import exampleSGF from "./baseSGF";
import sgfutils from "./utils";
import axios from "axios";

var sgf = require('smartgame');

var collection = sgf.parse(exampleSGF);

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
            let newsgfPosition = _isInSequence(game, oneMove, nodeIdx+1, sgfPosition, availableTransforms, isIgnoreErrors);
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
            let newsgfPosition = _isInSequence(game, oneMove, nodeIdx+1, sgfPosition, availableTransforms);
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
            let newsgfPosition = _isInSequence(game, oneMove, nodeIdx+1, sgfPosition, availableTransforms, isIgnoreErrors);
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

    // is oneMove one of the allowed children of gameTreeSequenceNode
    // if so, returns the matching sequences.X object
const _isInSequence = function(game, oneMove, nodeIdx, gameTreeSequenceNode, availableTransforms, isIgnoreErrors) {
    //console.log('_isInSequence ? '+availableTransforms.length+' move '+nodeIdx+':',oneMove);
    if(nodeIdx< gameTreeSequenceNode.nodes.length) {
        //console.log('_isInSequence NODES '+nodeIdx,gameTreeSequenceNode.nodes[nodeIdx]);
        //console.log('2_isInSequence NODES '+nodeIdx,'#'+(oneMove.color === "black" ? gameTreeSequenceNode.nodes[nodeIdx].B : gameTreeSequenceNode.nodes[nodeIdx].W)+'#');
        //console.log('2_isInSequence NODES '+nodeIdx,'#'+typeof(oneMove.color === "black" ? gameTreeSequenceNode.nodes[nodeIdx].B : gameTreeSequenceNode.nodes[nodeIdx].W)+'#');
        //console.log('2_isInSequence NODES '+nodeIdx,'#'+(typeof(oneMove.color === "black" ? gameTreeSequenceNode.nodes[nodeIdx].B : gameTreeSequenceNode.nodes[nodeIdx].W)!== "undefined")+'#');
        //console.log('3_isInSequence NODES '+nodeIdx,'#'+(gameTreeSequenceNode.nodes[nodeIdx].B + gameTreeSequenceNode.nodes[nodeIdx].W)+'#');
        //console.log('3_isInSequence NODES '+nodeIdx,(!oneMove.pass || (gameTreeSequenceNode.nodes[nodeIdx].B + gameTreeSequenceNode.nodes[nodeIdx].W) === ""));
        const oneChildMoves = gameTreeSequenceNode.nodes.
            filter( (childNode, sequenceIdx) => sequenceIdx === nodeIdx). // we only consider the "nodeIdx" move of the nodes
            filter(childNode => typeof (oneMove.color === "black" ? childNode.B : childNode.W) !== "undefined").
            filter(childNode => !oneMove.pass || (oneMove.color === "black" ? childNode.B : childNode.W) === "").
            filter(childNode => oneMove.pass || sgfutils.getPossibleTransforms(
                sgfutils.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
                {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                availableTransforms));

        //console.log('_isInSequence NODES '+nodeIdx,oneChildMoves);
        if(oneChildMoves && oneChildMoves.length && (isIgnoreErrors || sgfutils.isAcceptableMove(oneChildMoves[0]))) {
            if(!oneMove.pass) {
                let childNode = oneChildMoves[0];
                let newAvailableTransforms = sgfutils.getPossibleTransforms(
                     sgfutils.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
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

    //console.log('_isInSequence end of nodes ?',nodeIdx);
    for (let sequencesIdx = 0 ; gameTreeSequenceNode.sequences && sequencesIdx < gameTreeSequenceNode.sequences.length ; sequencesIdx++) {
        let oneChild = gameTreeSequenceNode.sequences[sequencesIdx];
        const oneChildMoves = oneChild.nodes && oneChild.nodes.
            filter( (childNode, sequenceIdx) => sequenceIdx === 0). // we only consider the first move of the sequence
            filter(childNode => typeof (oneMove.color === "black" ? childNode.B : childNode.W) !== "undefined").
            filter(childNode => !oneMove.pass || (oneMove.color === "black" ? childNode.B : childNode.W) === "").
            filter(childNode => oneMove.pass || sgfutils.getPossibleTransforms(
                 sgfutils.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
                 {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                 availableTransforms));

        //console.log('_isInSequence '+i,oneChild);
        //console.log('_isInSequence '+i,oneChildMoves);
        if(oneChildMoves && oneChildMoves.length && (isIgnoreErrors || sgfutils.isAcceptableMove(oneChildMoves[0]))) {
            if(!oneMove.pass) {
                let childNode = oneChildMoves [0];
                let newAvailableTransforms = sgfutils.getPossibleTransforms(
                     sgfutils.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
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
};

const _childrenOptionsAsString = function(game, gameTreeSequenceNode, nodeIdx, moveColor, availableTransforms) {
    //console.log('DEBUG ',gameTreeSequenceNode);
    let allOptions = _childrenOptions(game, gameTreeSequenceNode, nodeIdx, moveColor, availableTransforms)
    return allOptions && allOptions.length ? allOptions.map(
        oneMove => oneMove.pass ? "Tenuki" : game.coordinatesFor(oneMove.y,oneMove.x)
    ).join(" or ") : "";
};

const _childrenOptionsAsString2 = function(game, gameTreeSequenceNode, nodeIdx, moveColor) {
    //console.log('DEBUG ',gameTreeSequenceNode);
    let childAsPoint;
    let resultString = "";
    let oneChildMoves;

    if(gameTreeSequenceNode.nodes && nodeIdx< gameTreeSequenceNode.nodes.length) {
        // we have only one option, because we are in the gameTreeSequenceNode.nodes[] one way street
        oneChildMoves = gameTreeSequenceNode.nodes.
            filter( (childNode, sequenceIdx) => sequenceIdx === nodeIdx). // we only consider the first move of the sequence
            filter(childNode => typeof (moveColor === "black" ? childNode.B : childNode.W)!== "undefined");

        if (oneChildMoves && oneChildMoves.length && sgfutils.isAcceptableMove(oneChildMoves[0])) {
            if (typeof oneChildMoves[0].B !== "undefined" || typeof oneChildMoves[0].W !== "undefined") {
                childAsPoint = sgfutils.sgfCoordToPoint(moveColor === "black" ? oneChildMoves[0].B : oneChildMoves[0].W);
                resultString += String(game.coordinatesFor(childAsPoint.y, childAsPoint.x));
            } else {
                resultString += "Tenuki (play away)";
            }
        }
    } else {
        // we consider sequences
        oneChildMoves = gameTreeSequenceNode.sequences && gameTreeSequenceNode.sequences[0].nodes.
                filter( (childNode, sequenceIdx) => sequenceIdx === 0). // we only consider the first move of the sequence
                filter(childNode => typeof (moveColor === "black" ? childNode.B : childNode.W) !== "undefined");
        if (oneChildMoves && oneChildMoves.length && sgfutils.isAcceptableMove(oneChildMoves[0])) {
            childAsPoint = sgfutils.sgfCoordToPoint(moveColor === "black" ? oneChildMoves[0].B : oneChildMoves[0].W);
            resultString += String(game.coordinatesFor(childAsPoint.y, childAsPoint.x));
        }
        for (let sequencesIdx = 1 ; gameTreeSequenceNode.sequences && sequencesIdx < gameTreeSequenceNode.sequences.length ; sequencesIdx++) {
            //console.log('DEBUG '+i,gameTreeSequenceNode.sequences[sequencesIdx]);
            let oneChild = gameTreeSequenceNode.sequences[sequencesIdx];

            oneChildMoves = oneChild.nodes.
                filter( (childNode, sequenceIdx) => sequenceIdx === 0). // we only consider the first move of the sequence
                filter(childNode => typeof (moveColor === "black" ? childNode.B : childNode.W)!== "undefined");

            if (oneChildMoves && oneChildMoves.length && sgfutils.isAcceptableMove(oneChildMoves[0])) {
                childAsPoint = sgfutils.sgfCoordToPoint(moveColor === "black" ? oneChildMoves[0].B : oneChildMoves[0].W);
                resultString += (resultString ? "" : " or ")+game.coordinatesFor(childAsPoint.y, childAsPoint.x);
            }
        }
    }
    return resultString;
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

        if (oneChildMoves && oneChildMoves.length && sgfutils.isAcceptableMove(oneChildMoves[0])) {
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
            if (oneChildMoves && oneChildMoves.length && sgfutils.isAcceptableMove(oneChildMoves[0])) {
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

        if(currentNode) {
            console.log('current node: ',currentNode);
            let currentSGFVariation = [];
            sgfutils.getVariationSGF(currentNode.node, currentNode.nodeIdx, currentSGFVariation, true);
            const emptySGF = sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19])');
            currentSGFVariation.forEach(node => emptySGF.gameTrees[0].nodes.push(node));
            console.log('current path: ',sgf.generate(emptySGF));
            if(this.game.currentState().moveNumber > 0) {
            //if(this.game.currentState().moveNumber > 1 ) {
                let nodeStats = {leafCount: 0, failedLeafCount:0, foundLeafCount:0, successLeafCount:0};
                sgfutils.getNodeStats( currentNode.node, currentNode.nodeIdx, nodeStats);
                newGameInfo += "\n"+nodeStats.leafCount+" valid VARIATIONS to find";
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
            if(currentNode === null) {
                this.element.classList.add("notInSequence");
            } else {
                this.element.classList.add("win");
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
            controls.updateMoveWithConfirm({BM:'', DM:'2', GW:'', GB:''});
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
            console.log('getVariationSGF:', controls.getVariationSGF({BM:'1'}));
            controls.updateMoveWithConfirm({BM:'1'});
            //console.log('getVariationSGF:', '(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd];W[];B[nc];W[qc];B[qd];W[pc]BM[1])');
            //controls.postNewJosekiSGF('');

        });

        resetButton.addEventListener("click", this.reset);
        mistakeButton.addEventListener("click", this.declareMistake);
        josekiButton.addEventListener("click", this.declareJoseki);

        //localStorage.setItem("knownVersions", JSON.stringify([]));
        // LAST getLatestSGF
        setTimeout(this.getLatestSGF,200);
        setTimeout(this.updateGUIFromState,200);

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
            let newSGF = controls.getVariationSGF({BM:'1'});
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
    this.getVariationSGF = function(nodeProperties) {
        const emptySGF = sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19])');
        // find polite transform based on first moves
        let currentSelectedTransform = sgfutils.getCurrentTransform(collection, game);

        //console.log('getVariationSGF currentSelectedTransform : ', currentSelectedTransform);
        for (let moveIdx = 0 ; moveIdx < game._moves.length ; moveIdx++) {
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

        if(!controls.isKnownVersionLoaded) {
            for(var SGFrevIdx = 0 ; SGFrevIdx < knownVersions.length; SGFrevIdx++) {
                //console.log('loading version ', knownVersions[SGFrevIdx]);
                if(knownVersions[SGFrevIdx].milestone){
                    // milestones are already merged, so we can throw away the previous versions
                    //console.log('init with ', knownVersions[SGFrevIdx]);
                    collection = sgf.parse(knownVersions[SGFrevIdx].SGF);
                    //console.log('init created ', collection);
                    controls.isKnownVersionLoaded = true;
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
                        //console.log('adding version ', res.data[SGFrevIdx]);
                        res.data[SGFrevIdx].SGF = sgfutils.bin2String(res.data[SGFrevIdx].SGF.data);
                        knownVersions.push(res.data[SGFrevIdx]);
                        if(res.data[SGFrevIdx].milestone){
                            //console.log('init with ', res.data[SGFrevIdx]);
                            collection = sgf.parse(res.data[SGFrevIdx].SGF);
                            //console.log('init created ', collection);
                        } else {
                            //console.log('merge with ', res.data[SGFrevIdx]);
                            sgfutils.merge(collection.gameTrees[0], sgf.parse(res.data[SGFrevIdx].SGF).gameTrees[0], 1, 1);
                            //console.log('merged ', collection);
                        }
                    }

                    // TODO filter out everything that precedes a milestone

                    localStorage.setItem("knownVersions", JSON.stringify(knownVersions));
                }
            });
    }
};

export default ExampleGameControls;