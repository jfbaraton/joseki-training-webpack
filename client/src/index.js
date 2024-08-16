import App from './App';
import ExploreLinksApp from "./ExploreLinksApp";
import tenuki from 'tenuki';
import { StrictMode } from "react";
import { createRoot } from 'react-dom/client';
import ExampleGameControls from './example-controls';

var boardElement = document.querySelector(".tenuki-board");

//localStorage.setItem("startPath", JSON.stringify([{y:3,x:15}, {pass:true}, {y:2,x:13}]));

var game = new tenuki.Game({ element: boardElement }, localStorage);
//game.setAutoplay("black"); // AI is white

var controlElement = document.querySelector(".controls");
var controls = new ExampleGameControls(controlElement, game);
//var overlayControls = new OverlayControl();
//overlayControls.setup(boardElement);


controls.setup();
controls.setAutoplay(localStorage.getItem("autoplay") || "black"); // AI is white

game.callbacks.postRender = function(game) {
  controls.updateStats();
};
controls.updateStats();



const rootElement = document.getElementById("folderRoot");
const root = createRoot(rootElement);
root.render(
    <StrictMode>
        <ExploreLinksApp onLinkClick={controls.reset}/>
    </StrictMode>,
    rootElement
);

document.addEventListener("keydown",  function (e) {
        //console.log("keydown ",e);
        //if (e.keyCode == 82) { // r pressed
        if ('r' === e.key) { // e pressed
            controls.reset(e);
        } else if ('u' === e.key) { // e pressed
            controls.game.undo(e);
        } else if (e.keyCode == 27) { // enter pressed
            controls.reset(e);
      }
   }, false);