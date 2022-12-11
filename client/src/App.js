import axios from "axios";
import React, { useState, useEffect } from 'react';
import logo from './assets/images/logo2.svg';
import './App.css';
import Game from './game';

function App() {
    React.isValidElement(null);
	const [randomQuote, setRandomQuote] = useState([{id:0,nickname:'unknown',avatar:'invisible'}]);
	const [textInfo, setTextInfo] = useState('textInfo');

    var boardElement = document.querySelector(".tenuki-board");

    //localStorage.setItem("startPath", JSON.stringify([{y:3,x:15}, {pass:true}, {y:2,x:13}]));

    var game = new Game({ element: boardElement }, localStorage);

    const update = () => {
        axios
            .get("/api/orders")
            .then((res) => {
                setRandomQuote(res.data);
            });
    };
    const pass = () => {
        game.pass();
    };
    const undo = () => {
        game.undo();
    };
    const reset = () => {
        var startPath = JSON.parse(localStorage.getItem("startPath"));
        while (game.currentState().moveNumber /*&& controls.game.currentState().moveNumber != startPath.length*/) {
            game.undo();
        }
        startPath.forEach(oneMove => {
            if (oneMove.pass) {
                game.pass();
            } else {
                game.playAt(oneMove.y, oneMove.x);
            }

        });
    };
    const setPath = () => {
        localStorage.setItem("startPath", JSON.stringify(game.getPath()));
        setText("Position saved! From now on, you can click on RESET to come back to the same variation");

    };
    const playAs = (e) => {
        console.log('playAsWhite clickedz ', playAsWhite, e);
        if(e.srcElement.checked) {
            game.setAutoplay("white");
        } else {
            game.setAutoplay("black");
        }
    };

    game.setAutoplay("black"); // AI is white

    /*var controlElement = document.querySelector(".controls");
    var controls = new ExampleGameControls(controlElement, game);
    controls.setup();*/
    const setText = function(str) {
        setTextInfo(str);
    };

    const updateStats = function() {
        var newGameInfo = "";
        //newGameInfo += "Black stones captured: " + game.currentState().blackStonesCaptured;
        //newGameInfo += "\n\n";
        //newGameInfo +=  "White stones captured: " + game.currentState().whiteStonesCaptured;
        //newGameInfo += "\n\n";

        newGameInfo += "Move " + game.currentState().moveNumber;

        if (game.currentState().playedPoint) {
          newGameInfo += " (" + game.coordinatesFor(game.currentState().playedPoint.y, game.currentState().playedPoint.x) + ")";
        }

        newGameInfo += "\n";

        var currentState = game.currentState();

        if (currentState.pass) {
          var player = currentState.color[0].toUpperCase() + currentState.color.substr(1);
          newGameInfo += player + " passed."
        }
        let nextMoveOptions = game._getNextMoveOptions();
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
        newGameInfo += "\n current options: "+nextMoveOptions.map(oneMove => oneMove.pass ? "Tenuki" : game.coordinatesFor(oneMove.y,oneMove.x)).join(" or ");
        newGameInfo += "\n"+game._getPathComment();

        gameInfo.innerText = newGameInfo;

        if (currentState.pass) {
            var str = "";

            if (game.isOver()) {
                str += "Game over.";
                str += "\n"
                str += "Black's score is " + game.score().black;
                str += "\n";
                str += "White's score is " + game.score().white;
            }

            this.setText(str)
        } else {
            this.setText("");
        }
    };

    game.callbacks.postRender = function(game) {
      updateStats();
    };

    //useEffect(update, []);
    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} width="200" className="App-logo" alt="logo" />
                <div className="example-heading">
                  <p>Need to curate, rate and add josekis</p>
                </div>


                <div className="controls">
                      <div className="buttons">
                        <button className="btn btn-secondary pass" onClick={pass}>Pass</button>
                        <button className="btn btn-secondary undo" onClick={undo}>Undo</button>
                        <button className="btn btn-secondary reset" onClick={reset} accessKey="r">Reset</button>
                        <button className="btn btn-secondary setPath" onClick={setPath} accessKey="r">Set current position to be the starting point</button>
                            <input type="checkbox" id="isPlayAsWhite" name="isPlayAsWhite" value="isPlayAsWhite" onClick={playAs}/>
                            <label htmlFor="isPlayAsWhite"> I want to play as white</label>
                      </div>
                        <div className="branch-info" ><p>&nbsp;</p></div>
                        <div className="game-info" ><p>&nbsp;</p></div>
                        <div className="text-info" ><p>{textInfo}</p></div>
                </div>

            </header>
        </div>
    );
}

export default App;