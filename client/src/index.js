import App from './App';
import ExploreLinksApp2 from "./ExploreLinksApp2";
import tenuki from 'tenuki';
import { StrictMode } from "react";
import { createRoot } from 'react-dom/client';
import ExampleGameControls from './example-controls';
import { explorer } from './utils/testData'

var boardElement = document.querySelector(".tenuki-board");
var controls = null;
//localStorage.setItem("startPath", JSON.stringify([{y:3,x:15}, {pass:true}, {y:2,x:13}]));
if(boardElement) {
    var game = new tenuki.Game({element: boardElement}, localStorage);
//game.setAutoplay("black"); // AI is white

    var controlElement = document.querySelector(".controls");
    controls = new ExampleGameControls(controlElement, game);
//var overlayControls = new OverlayControl();
//overlayControls.setup(boardElement);


    controls.setup();
    controls.setAutoplay(localStorage.getItem("autoplay") || "black"); // AI is white

    game.callbacks.postRender = function (game) {
        controls.updateStats();
    };
    controls.updateStats();

}


const rootElement = document.getElementById("folderRoot");
const root = createRoot(rootElement);
/*root.render(
    <StrictMode>
        <ExploreLinksApp onLinkClick={controls ? controls.reset:null}/>
    </StrictMode>,
    rootElement
);*/
root.render(
    <StrictMode>
        <ExploreLinksApp2 
            data ={ explorer }
            onLinkClick={controls ? controls.reset:null}
            onChange={controls ? controls.storeExploreLinks:null}
            getCurrentLinkSGF={controls ? controls.getVariationSGF:null}
        />
    </StrictMode>
);

controls && setTimeout(controls.setupExploreLinks,500);
