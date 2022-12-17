import utils from "./utils";
import exampleSGF from "./baseSGF";
import sgfutils from "./utils";
import axios from "axios";

var sgf = require('smartgame');

var collection = sgf.parse(exampleSGF);

const _getNextMoveOptions = function(game) {
    let sgfPosition = collection.gameTrees[0];
    const availableTransforms = utils.getAllPossibleTransform();
    let isInSequence = Boolean(availableTransforms) && Boolean(availableTransforms.length);
    let nodeIdx = 0;
    let oneMove = null;
    for (let moveIdx = 0 ; moveIdx < game._moves.length ; moveIdx++) {
        oneMove =  game._moves[moveIdx];
        if (isInSequence) {
            //console.log('_getNextMoveOptions mv',moveIdx, ' transforms ', availableTransforms);
            let newsgfPosition = _isInSequence(game, oneMove, nodeIdx+1, sgfPosition, availableTransforms);
            //console.log('AAAA                mv',newsgfPosition, ' transforms ', availableTransforms);
            if (newsgfPosition) {
                if(newsgfPosition === sgfPosition) {
                    nodeIdx ++; // sgfPosition.nodes[] is the one way street that we have to follow before reaching the sequences
                } else {
                    nodeIdx = 0; // sgfPosition.nodes[] was completed, so we continue with the sgfPosition.sequences (that iss newsgfPosition)
                    sgfPosition = newsgfPosition;
                }
            } else {
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

const _getPathComment = function(game) {
    let pathComment = "path: ";
    let sgfPosition = collection.gameTrees[0];
    let pathCommentExtra = "extra";
    let availableTransforms = utils.getAllPossibleTransform();
    let isInSequence = Boolean(availableTransforms) && Boolean(availableTransforms.length);
    let nodeIdx = 0;
    for (let moveIdx = 0 ; moveIdx < game._moves.length ; moveIdx++) {
        let oneMove =  game._moves[moveIdx];
        if(oneMove.pass) {
            pathComment += "PASS - ";
        } else {
            pathComment += " " + game.coordinatesFor(oneMove.playedPoint.y, oneMove.playedPoint.x) + " - ";
            pathComment += " (" + utils.pointToSgfCoord({y:oneMove.playedPoint.y, x:oneMove.playedPoint.x}) + ") - ";
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
            } else {
                //console.log('WROOONG ',pathComment);
                pathCommentExtra = "instead of ";
                if(oneMove.pass) {
                    pathCommentExtra += "PASS ";
                } else {
                    pathCommentExtra += " " + game.coordinatesFor(oneMove.playedPoint.y, oneMove.playedPoint.x) + " ";
                    pathCommentExtra += " (" + utils.pointToSgfCoord({y:oneMove.playedPoint.y, x:oneMove.playedPoint.x}) + ") ";
                }
                pathCommentExtra += "it was better to play one of ["+_childrenOptionsAsString(game, sgfPosition, nodeIdx+1, oneMove.color === "black" ? "white" : "black", availableTransforms)+"]";
                isInSequence = false;
            }
        }
    }
    let result = pathComment+ "\n\n" +pathCommentExtra+ "\n\n" +(isInSequence ? (sgfPosition.nodes[nodeIdx].C || 'no comment') : "WROOOOOONG");
    //console.log('final pathComment ',result);
    return result;
};

    // is oneMove one of the allowed children of gameTreeSequenceNode
    // if so, returns the matching sequences.X object
const _isInSequence = function(game, oneMove, nodeIdx, gameTreeSequenceNode, availableTransforms) {
    //console.log('_isInSequence ? '+availableTransforms.length+' move '+nodeIdx+':',oneMove);
    if(nodeIdx< gameTreeSequenceNode.nodes.length) {
        //console.log('_isInSequence NODES '+nodeIdx,gameTreeSequenceNode.nodes[nodeIdx]);
        const oneChildMoves = gameTreeSequenceNode.nodes.
            filter( (childNode, sequenceIdx) => sequenceIdx === nodeIdx). // we only consider the "nodeIdx" move of the nodes
            filter(childNode => typeof (oneMove.color === "black" ? childNode.B : childNode.W) !== "undefined").
            filter(childNode => !oneMove.pass || (childNode.B || childNode.W) === "").
            filter(childNode => oneMove.pass || utils.getPossibleTransforms(
                utils.sgfCoordToPoint(childNode.B || childNode.W) ,
                {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                availableTransforms));

        //console.log('_isInSequence NODES '+nodeIdx,oneChildMoves);
        if(oneChildMoves && oneChildMoves.length) {
            if(!oneMove.pass) {
                let childNode = oneChildMoves[0];
                let newAvailableTransforms = utils.getPossibleTransforms(
                     utils.sgfCoordToPoint(childNode.B || childNode.W) ,
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
            filter(childNode => !oneMove.pass || (childNode.B || childNode.W) === "").
            filter(childNode => oneMove.pass || utils.getPossibleTransforms(
                 utils.sgfCoordToPoint(childNode.B || childNode.W) ,
                 {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                 availableTransforms));

        //console.log('_isInSequence '+i,oneChild);
        //console.log('_isInSequence '+i,oneChildMoves);
        if(oneChildMoves && oneChildMoves.length) {
            if(!oneMove.pass) {
                let childNode = oneChildMoves [0];
                let newAvailableTransforms = utils.getPossibleTransforms(
                     utils.sgfCoordToPoint(childNode.B || childNode.W) ,
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

const _childrenOptionsAsString = function(game, gameTreeSequenceNode, nodeIdx, moveColor) {
    //console.log('DEBUG ',gameTreeSequenceNode);
    let childAsPoint;
    let resultString = "";
    let oneChildMoves;

    if(gameTreeSequenceNode.nodes && nodeIdx< gameTreeSequenceNode.nodes.length) {
        // we have only one option, because we are in the gameTreeSequenceNode.nodes[] one way street
        oneChildMoves = gameTreeSequenceNode.nodes.
            filter( (childNode, sequenceIdx) => sequenceIdx === nodeIdx). // we only consider the first move of the sequence
            filter(childNode => typeof (moveColor === "black" ? childNode.B : childNode.W)!== "undefined");

        if (oneChildMoves && oneChildMoves.length) {
            if (typeof oneChildMoves[0].B !== "undefined" || typeof oneChildMoves[0].W !== "undefined") {
                childAsPoint = utils.sgfCoordToPoint(oneChildMoves[0].B || oneChildMoves[0].W);
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
        if (oneChildMoves && oneChildMoves.length) {
            childAsPoint = utils.sgfCoordToPoint(oneChildMoves[0].B || oneChildMoves[0].W);
            resultString += String(game.coordinatesFor(childAsPoint.y, childAsPoint.x));
        }
        for (let sequencesIdx = 1 ; gameTreeSequenceNode.sequences && sequencesIdx < gameTreeSequenceNode.sequences.length ; sequencesIdx++) {
            //console.log('DEBUG '+i,gameTreeSequenceNode.sequences[sequencesIdx]);
            let oneChild = gameTreeSequenceNode.sequences[sequencesIdx];

            oneChildMoves = oneChild.nodes.
                filter( (childNode, sequenceIdx) => sequenceIdx === 0). // we only consider the first move of the sequence
                filter(childNode => typeof (moveColor === "black" ? childNode.B : childNode.W)!== "undefined");

            if (oneChildMoves && oneChildMoves.length) {
                childAsPoint = utils.sgfCoordToPoint(oneChildMoves[0].B || oneChildMoves[0].W);
                resultString += " or "+game.coordinatesFor(childAsPoint.y, childAsPoint.x);
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

        if (oneChildMoves && oneChildMoves.length) {
            if (oneChildMoves[0].B || oneChildMoves[0].W) {
                childAsPoint = utils.sgfCoordToPoint(oneChildMoves[0].B || oneChildMoves[0].W);
                availableTransforms.forEach(oneTransform => {
                    const transformedMove = utils.transformMove(childAsPoint, oneTransform);
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
            if (oneChildMoves && oneChildMoves.length) {
                //console.log('typeof oneChildMoves[0] defined ',typeof oneChildMoves[0].B !== "undefined" || typeof oneChildMoves[0].W !== "undefined");
                if (oneChildMoves[0].B || oneChildMoves[0].W) {
                    childAsPoint = utils.sgfCoordToPoint(oneChildMoves[0].B || oneChildMoves[0].W);
                    availableTransforms.forEach(oneTransform => {
                        //console.log('Transform seq option ',childAsPoint, ' -- ',oneTransform, transformedMove);
                        const transformedMove = utils.transformMove(childAsPoint, oneTransform);
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

        newGameInfo += "\n";

        var currentState = this.game.currentState();

        if (currentState.pass) {
          var player = currentState.color[0].toUpperCase() + currentState.color.substr(1);
          newGameInfo += player + " passed."
        }
        let nextMoveOptions = _getNextMoveOptions(game);
        // TODO add "protest" buttons to allow to add/remove variations
        if(nextMoveOptions && nextMoveOptions.length) {
            this.element.classList.remove("notInSequence");
            this.element.classList.remove("win");
        } else {
            if(nextMoveOptions === null) {
                this.element.classList.add("notInSequence");
            } else {
                this.element.classList.add("win");
            }
        }
        //console.log('current options:',nextMoveOptions);
        newGameInfo += "\n current options: "+ (nextMoveOptions && nextMoveOptions.map(oneMove => oneMove.pass ? "Tenuki" : this.game.coordinatesFor(oneMove.y,oneMove.x)).join(" or "));
        newGameInfo += "\n_getPathComment:\n"+_getPathComment(this.game);
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
        var setPathButton = document.querySelector(".setPath");
        var testButton = document.querySelector(".test");
        var playAsWhite = document.querySelector("#isPlayAsWhite");

        this.reset = function(e) {
            e.preventDefault();
            var startPath = JSON.parse(localStorage.getItem("startPath")) || [];
            while (controls.game.currentState().moveNumber /*&& controls.game.currentState().moveNumber != startPath.length*/) {
                controls.game.undo();
            }
            startPath.forEach(oneMove => {
              if (oneMove.pass) {
                  controls.game.pass();
              } else {
                  controls.game.playAt(oneMove.y, oneMove.x);
              }

            });

        };
        playAsWhite.onclick = function(e) {
            console.log('playAsWhite clicked ', playAsWhite, e);
            if(e.srcElement.checked) {
                controls.setAutoplay("white");
            } else {
                controls.setAutoplay("black");
            }
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
            controls.getLatestSGF();
        });

        resetButton.addEventListener("click", this.reset);

        //localStorage.setItem("knownVersions", JSON.stringify([]));
        // LAST getLatestSGF
        setTimeout(this.getLatestSGF,200);

    }

    this.setAutoplay = function(newIsAutoplay) {
        controls.isAutoplay =newIsAutoplay;
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
        axios
            .get("/api/joseki/"+lastKnownVersion)
            .then((res) => {
                if(!controls.isKnownVersionLoaded) {
                    for(var SGFrevIdx = 0 ; SGFrevIdx < knownVersions.length; SGFrevIdx++) {
                        //console.log('loading version ', knownVersions[SGFrevIdx]);
                        if(knownVersions[SGFrevIdx].id == 1){
                            //console.log('init with ', knownVersions[SGFrevIdx]);
                            collection = sgf.parse(knownVersions[SGFrevIdx].SGF);
                            //console.log('init created ', collection);
                            controls.isKnownVersionLoaded = true;
                        } else {
                            //console.log('merge with ', knownVersions[SGFrevIdx]);
                            sgfutils.merge(collection.gameTrees[0], sgf.parse(knownVersions[SGFrevIdx].SGF), 1, 1);
                            //console.log('merged ', collection);
                        }
                    }
                }
                if(res.data && res.data.length) {
                    for(var SGFrevIdx = 0 ; SGFrevIdx < res.data.length; SGFrevIdx++) {
                        //console.log('adding version ', res.data[SGFrevIdx]);
                        res.data[SGFrevIdx].SGF = sgfutils.bin2String(res.data[SGFrevIdx].SGF.data);
                        knownVersions.push(res.data[SGFrevIdx]);
                        if(res.data[SGFrevIdx].id == 1){
                            //console.log('init with ', res.data[SGFrevIdx]);
                            collection = sgf.parse(res.data[SGFrevIdx].SGF);
                            //console.log('init created ', collection);
                        } else {
                            //console.log('merge with ', res.data[SGFrevIdx]);
                            sgfutils.merge(collection.gameTrees[0], sgf.parse(res.data[SGFrevIdx].SGF), 1, 1);
                            //console.log('merged ', collection);
                        }
                    }

                    localStorage.setItem("knownVersions", JSON.stringify(knownVersions));
                }
            });
    }
};

export default ExampleGameControls;