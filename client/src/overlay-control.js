import sgfutils from "./utils";

import axios from "axios";
var sgf = require('smartgame');


let isResizing = false;
let isDragAllowed = false;




let currentResizer;

function extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
}

// An example setup showing how buttons could be set to board/game functionality.
const OverlayControl = function(element, game) {
    var controls = this;

    this.setText = function(str) {
        this.textInfo.innerText = str;
    };

    var eventMatchers = {
        'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
        'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
    }

    var defaultOptions = {
        pointerX: 0,
        pointerY: 0,
        button: 0,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        bubbles: true,
        cancelable: true
    }

    this.setup = function(boardElement) {
        var testButton = document.querySelector(".test");
        const resizers = document.querySelectorAll(".resizer");
        const el = document.querySelector(".overlay");

        el.style.left = (localStorage && localStorage.getItem("overlayLeft")) || "10px";
        el.style.top = (localStorage && localStorage.getItem("overlayTop")) || "10px";

        el.style.height = (localStorage && localStorage.getItem("overlayHeight")) || "100px";
        el.style.width = (localStorage && localStorage.getItem("overlayWidth")) || "100px";


        /*window.onmousemove = function(evt) {
            var element = document.querySelector(".intersections");
            if(element !== evt.fromElement && !isResizing) {
                //boardElement.onmousemove();
                var options = extend(defaultOptions, arguments[2] || {});
                var oEvent, eventType = null;
                var eventName = evt.type;
                console.log('onmousemove evt ',evt);
                for (var name in eventMatchers) {
                    if (eventMatchers[name].test(evt.type)) { eventType = name; break; }
                }
                if (document.createEvent){
                    oEvent = document.createEvent(eventType);
                    if (eventType == 'HTMLEvents')
                    {
                        oEvent.initEvent(eventName, options.bubbles, options.cancelable);
                    }
                    else
                    {
                        oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
                        options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
                        options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
                    }
                    element.dispatchEvent(oEvent);
                } else {
                    options.clientX = options.pointerX;
                    options.clientY = options.pointerY;
                    var evt = document.createEventObject();
                    oEvent = extend(evt, options);
                    element.fireEvent('on' + eventName, oEvent);
                }
            } else {
                console.log('onmousemove evt IGNORED');
            }
        }*/


        this.mousedown = function(e) {
            if(localStorage && localStorage.getItem("isDragAllowed") === "true") {
                console.log('click on overlay')
                window.addEventListener("mousemove", mousemove);
                window.addEventListener("mouseup", mouseup);

                let prevX = e.clientX;
                let prevY = e.clientY;

                function mousemove(e) {
                    if (!isResizing) {
                        let newX = prevX - e.clientX;
                        let newY = prevY - e.clientY;

                        const rect = el.getBoundingClientRect();

                        el.style.left = rect.left - newX + "px";
                        el.style.top = rect.top - newY + "px";

                        if(localStorage) {
                            localStorage.setItem("overlayLeft",el.style.left);
                            localStorage.setItem("overlayTop",el.style.top);
                        }

                        prevX = e.clientX;
                        prevY = e.clientY;
                    }
                }

                function mouseup() {
                    localStorage.setItem("isDragAllowed", null);
                    window.removeEventListener("mousemove", mousemove);
                    window.removeEventListener("mouseup", mouseup);
                }
            }
        }

        el.addEventListener("mousedown", controls.mousedown);
        /*
        var passButton = document.querySelector(".pass");

        var allTabHeaders = document. querySelectorAll(".tabHeader");
        this.updateGUIFromState = function(e, swapMode) {
            // tabs

        }*/


        for (let resizer of resizers) {
            console.log('setup resizer');
            resizer.addEventListener("mousedown", resizemousedown);

            function resizemousedown(e) {
                currentResizer = e.target;
                isResizing = true;

                let prevX = e.clientX;
                let prevY = e.clientY;

                window.addEventListener("mousemove", mousemove);
                window.addEventListener("mouseup", mouseup);

                function mousemove(e) {
                    const rect = el.getBoundingClientRect();

                    if (currentResizer.classList.contains("se")) {
                        localStorage.setItem("isDragAllowed", "true");
                        el.style.width = rect.width - (prevX - e.clientX) + "px";
                        el.style.height = rect.height - (prevY - e.clientY) + "px";
                    } else if (currentResizer.classList.contains("sw")) {
                        el.style.width = rect.width + (prevX - e.clientX) + "px";
                        el.style.height = rect.height - (prevY - e.clientY) + "px";
                        el.style.left = rect.left - (prevX - e.clientX) + "px";
                    } else if (currentResizer.classList.contains("ne")) {
                        el.style.width = rect.width - (prevX - e.clientX) + "px";
                        el.style.height = rect.height + (prevY - e.clientY) + "px";
                        el.style.top = rect.top - (prevY - e.clientY) + "px";
                    } else {
                        localStorage.setItem("isDragAllowed", "true");
                        el.style.width = rect.width + (prevX - e.clientX) + "px";
                        el.style.height = rect.height + (prevY - e.clientY) + "px";
                        el.style.top = rect.top - (prevY - e.clientY) + "px";
                        el.style.left = rect.left - (prevX - e.clientX) + "px";
                    }

                    if(localStorage) {
                        localStorage.setItem("overlayLeft",el.style.left);
                        localStorage.setItem("overlayTop",el.style.top);
                        localStorage.setItem("overlayHeight",el.style.height);
                        localStorage.setItem("overlayWidth",el.style.width);
                    }

                    prevX = e.clientX;
                    prevY = e.clientY;
                }

                function mouseup() {
                  window.removeEventListener("mousemove", mousemove);
                  window.removeEventListener("mouseup", mouseup);
                  isResizing = false;
                }
            }
        }

        testButton.addEventListener("click", function(e) {

            const canvas = document.getElementById('myCanvas');
            const context = canvas.getContext('2d');
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 10;

            /*context.beginPath();
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            context.fillStyle = 'green';
            context.fill();
            context.lineWidth = 5;
            context.strokeStyle = '#000033';
            context.stroke();*/
            context.beginPath();
            //context.arc(100, 75, 50, 0, 2 * Math.PI);
            console.log('context.arc('+centerX+' ,'+ centerY+', '+radius)
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            context.stroke();
        });
    }

};

export default OverlayControl ;