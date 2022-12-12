import utils from "./utils";
import exampleSGF from "./baseSGF";


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
    let result = pathComment+ "\n\n" +pathCommentExtra+ "\n\n" +isInSequence ? sgfPosition.nodes[nodeIdx].C : "WROOOOOONG";
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
  this.element = element;
  this.game = game;
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
    console.log('current options:',nextMoveOptions);
    newGameInfo += "\n current options: "+nextMoveOptions.map(oneMove => oneMove.pass ? "Tenuki" : this.game.coordinatesFor(oneMove.y,oneMove.x)).join(" or ");
    newGameInfo += "\n"+_getPathComment(this.game);

    this.gameInfo.innerText = newGameInfo;

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

  this.reset = function(e) {
    e.preventDefault();
    var startPath = JSON.parse(localStorage.getItem("startPath"));
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

  this.setup = function() {
    var controls = this;

    var passButton = document.querySelector(".pass");
    var undoButton = document.querySelector(".undo");
    var resetButton = document.querySelector(".reset");
    var setPathButton = document.querySelector(".setPath");
    var playAsWhite = document.querySelector("#isPlayAsWhite");

    playAsWhite.onclick = function(e) {
      console.log('playAsWhite clickedz ', playAsWhite, e);
      if(e.srcElement.checked) {
        controls.game.setAutoplay("white");
      } else {
        controls.game.setAutoplay("black");
      }
      //controls.game.pass();
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
        localStorage.setItem("startPath", JSON.stringify(controls.game.getPath()));
        controls.setText("Position saved! From now on, you can click on RESET to come back to the same variation");
    });

    resetButton.addEventListener("click", this.reset);
  }

  this.setAutoplay = function(newIsAutoplay) {
    this.isAutoplay =newIsAutoplay;
  }


  this.autoPlay = function(game) {
    console.log('autoPlay ?');
    let startPath = JSON.parse(localStorage && localStorage.getItem("startPath") || "[]");
    if(this.isAutoplay && game.currentState().moveNumber >= startPath.length && game.currentState().color === this.isAutoplay) {
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

};

export default ExampleGameControls;