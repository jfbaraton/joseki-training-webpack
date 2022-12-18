var sgf = require('smartgame');

export default {
    flatten: function(ary) {
        return ary.reduce((a, b) => a.concat(b));
    },

    flatMap: function(ary, lambda) {
        return Array.prototype.concat.apply([], ary.map(lambda));
    },

    cartesianProduct: function(ary1, ary2) {
        return this.flatten(ary1.map(x => ary2.map(y => [x, y])));
    },

    randomID: function(prefix) {
        const str = [0, 1, 2, 3].map(() => {
            return Math.floor(Math.random() * 0x10000).toString(16).substring(1);
        }).join("");

        return `${prefix}-${str}`;
    },

    clone: function(element) {
        return element.cloneNode(true);
    },

    createElement: function(elementName, options) {
        const element = document.createElement(elementName);

        if (typeof options !== "undefined") {
          if (options.class) {
            element.className = options.class;
          }
        }

        return element;
    },

    createSVGElement: function(elementName, options) {
        const svgNamespace = "http://www.w3.org/2000/svg";
        const element = document.createElementNS(svgNamespace, elementName);

        if (typeof options !== "undefined") {
          if (options.class) {
            options.class.split(" ").forEach(name => {
              this.addClass(element, name);
            });
          }

          if (options.attributes) {
            Object.keys(options.attributes).forEach(k => {
              element.setAttribute(k, options.attributes[k]);
            });
          }

          if (options.text) {
            element.textContent = options.text.toString();
          }
        }

        return element;
    },

    appendElement: function(parent, el) {
        parent.insertBefore(el, null);
    },

    addEventListener: function(el, eventName, fn) {
        el.addEventListener(eventName, fn, false);
    },

    removeClass: function(el, className) {
        if (!this.hasClass(el, className)) {
          return;
        }

        if (el.classList && el.classList.remove) {
          el.classList.remove(className);
          return;
        }

        const classNameRegex = RegExp('\\b' + className + '\\b', "g");

        if (el instanceof SVGElement) {
          el.setAttribute("class", el.getAttribute("class").replace(classNameRegex, ""));
        } else {
          el.className = el.getAttribute("class").replace(classNameRegex, "");
        }
    },

    addClass: function(el, className) {
        if (el.classList && el.classList.add) {
          el.classList.add(className);
          return;
        }

        if (el instanceof SVGElement) {
          el.setAttribute("class", el.getAttribute("class") + " " + className);
        } else {
          el.className = el.getAttribute("class") + " " + className;
        }
    },

    hasClass: function(el, className) {
        if (el.classList && el.classList.contains) {
          return el.classList.contains(className);
        }

        const classNameRegex = RegExp('\\b' + className + '\\b', "g");

        if (el instanceof SVGElement) {
          return classNameRegex.test(el.getAttribute("class"));
        } else {
          return classNameRegex.test(el.className);
        }
    },

    toggleClass: function(el, className) {
        if (el.classList && el.classList.toggle) {
          el.classList.toggle(className);
          return;
        }

        if (this.hasClass(el, className)) {
          this.removeClass(el, className);
        } else {
          this.addClass(el, className);
        }
    },

    unique: function(ary) {
        let unique = [];
        ary.forEach(el => {
          if (unique.indexOf(el) < 0) {
            unique.push(el);
          }
        });
        return unique;
    },

    sgfCoordToPoint:function(_18a){
        if(!_18a||_18a==="tt"){
            return {x:null,y:null};
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

    isAcceptableMove: function(node, minimumWinrate) {
        if(!node || node.BM) return false;
        //if(node.B || node.BM) return false;
        return true;
    },

    copyMetadata: function(target, source) {
        //console.log("copyMetadata ", target, source);
        if(!source || !target) return;
        if(typeof source.BM !== "undefined") {target.BM = source.BM;}
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
        const emptySGF = sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19])');
        currentSGFVariation.filter(node => !!node).forEach(node => emptySGF.gameTrees[0].nodes.push(node));
        return sgf.generate(emptySGF);
    },

    // node is an sgf node to start from
    // stats should be an object with {leafCount}
    getNodeStats: function(node, nodeIdx, stats) {
        // if this node has only one leaf, increment leafCount
        if(!node.sequences || !node.sequences.length) {
            // no sequences, there is a leaf here, so we return
            if(this.isAcceptableMove(node.nodes[nodeIdx])) {
                // no mistake, we count this as a valid Leaf
                const signature = this.getNodeSeparatedSGF({node:node, nodeIdx:nodeIdx});
                if(signature) {
                    // TODO more stats based on localStorage history of visits (use hashmap? to search by signature?)
                    stats.foundLeafCount++;
                }
                stats.leafCount++;
            }
            return;
        } else {
            // sequences exist, check all nodes for mistakes
            let mistakeIndex = node.nodes.findIndex( oneNode => !this.isAcceptableMove(oneNode));
            if(mistakeIndex>=nodeIdx) { // there is a leaf here, so we return
                if (mistakeIndex>nodeIdx) {
                    const signature = this.getNodeSeparatedSGF({node:node, nodeIdx:nodeIdx});
                    if(signature) {
                        stats.foundLeafCount++;
                    }
                    stats.leafCount++;// no mistake, we count this as a valid Leaf
                }
                return;
            }
        }

        // otherwise, call recursively
        for (let sequencesIdx = 0 ; sequencesIdx < node.sequences.length ; sequencesIdx++) {
            let oneChild = node.sequences[sequencesIdx];
            this.getNodeStats(oneChild, 0, stats);
        }

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
            let newsgfPosition = _isInSequence(game, oneMove, nodeIdx+1, sgfPosition, availableTransforms);
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

    // everything from addedTree that is not already defined in masterTree will be added to masterTree
    merge: function(masterTree, addedTree, masterTreeNodeNextMoveIdx, addedTreeNodeNextMoveIdx) {
        //console.log('START merge ',masterTree, addedTree, masterTreeNodeNextMoveIdx, addedTreeNodeNextMoveIdx);

        const isMasterNextMoveInMasterNodes = masterTree && masterTree.nodes && masterTree.nodes.length && masterTree.nodes.length > masterTreeNodeNextMoveIdx;

        if(!addedTree || !addedTree.nodes || !addedTree.nodes.length) return;
        //console.log('the the next node from addedTree is in nodes?  ', (addedTree && addedTree.nodes),')');

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
