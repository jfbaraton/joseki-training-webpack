import sgfutils from "./utils";

export default {
    // node is an sgf node to start from
    // stats should be an object with {leafCount}
    // localStats is a Map<signature,{leafCount: 0, failedLeafCount:0, foundLeafCount:0, successLeafCount:0}>
    getNodeStats: function(node, nodeIdx, stats, localStats, isDebug) {
        isDebug && console.log('START getNodeStats ',
            sgfutils.getPrintablePath(sgfutils.getNodeSeparatedSGF({node:node, nodeIdx:node.nodes.length-1})),
            JSON.stringify(stats),"-----------------------------------------------------");
        //let mistakeIndex = doubleMoveIdx < (node.nodes.length -1) && !sgfutils.isAcceptableMove(node.nodes[doubleMoveIdx+1], (nodeIdx >0 ? node.nodes[nodeIdx-1] : node.parent.nodes[node.parent.length-1])) ? doubleMoveIdx +1 : -1// we stop if a same player plays 2 times in a row (exists in some SGFs as example of continuation after tenuki...)
        let mistakeIndex = node.nodes.findIndex((oneNode, oneNodeIdx) => {
            return oneNodeIdx<node.nodes.length-1 && !sgfutils.isAcceptableMoveIdx(node,oneNodeIdx+1);
        });
        if(mistakeIndex >= nodeIdx) { // there is a leaf here, so we return
            //console.log("found a MISTAKE !!!!!!!!!!!!!!")
            //this.setStatsForNode({node:node, nodeIdx:mistakeIndex},{mistakeCount:1},localStats);


            let leafLocalStat = null;
            if (mistakeIndex>nodeIdx) { // mistake at mistakeIndex AND leaf at mistakeIndex-1
                leafLocalStat = this.setStatsForNode({node:node, nodeIdx:mistakeIndex-1},{leafCount:1},localStats);
                this.aggregateStats(stats, leafLocalStat);
                let nodeAggIdx = mistakeIndex-2;
                while (nodeAggIdx-- >= 0) {
                    const moveSignature = sgfutils.getNodeSeparatedSGF({node:node, nodeIdx:nodeAggIdx});
                    this.aggregateStats(stats, localStats.get(moveSignature));
                }
            }
            //console.log('END getNodeStats FOUND A MISTAKE at ',this.copyNode(node.nodes[mistakeIndex], true),JSON.stringify(stats),JSON.stringify(leafLocalStat));
            return;
        }
        //console.log('END getNodeStats NO MISTAKE in nodes ', node.sequences);
        // otherwise, call recursively
        let isAtLeastOneSeqValid = false;
        for (let sequencesIdx = 0 ; node.sequences && sequencesIdx < node.sequences.length ; sequencesIdx++) {
            let oneChild = node.sequences[sequencesIdx];
            //console.log('getNodeStats seq '+sequencesIdx);
            let childStats = null;
            if(sgfutils.isAcceptableMoveIdx(oneChild,0)) {
                //console.log('getNodeStats seq '+sequencesIdx+' EXPLORED ',sgfutils.copyNode(oneChild.nodes[0], true));
                isAtLeastOneSeqValid = true;
                //const signature = this.getNodeSeparatedSGF({node:oneChild, nodeIdx:0});
                childStats =  this.getZeroStats();
                isDebug && console.log('getNodeStats valid seq ',
                    //sgfutils.copyNode(node.nodes[node.nodes.length-1], true),
                    sgfutils.getPrintablePath(sgfutils.getNodeSeparatedSGF({node:node, nodeIdx:node.nodes.length-1})),
                    JSON.stringify(stats));
                this.getNodeStats(oneChild, 0, childStats, localStats, isDebug);
                //localStats.set(signature, childStats);
                //let leafLocalStat = this.setStatsForNode({node:oneChild, nodeIdx:0},childStats,localStats);
                this.aggregateStats(stats, childStats);

                isDebug && console.log('getNodeStats valid seq ',
                    //sgfutils.copyNode(node.nodes[node.nodes.length-1], true),
                    sgfutils.getPrintablePath(sgfutils.getNodeSeparatedSGF({node:node, nodeIdx:node.nodes.length-1})),
                    JSON.stringify(stats),JSON.stringify(childStats));
            }

        }

        if(!isAtLeastOneSeqValid) {
            //console.log("getNodeStats - NO valid Seq !isAtLeastOneSeqValid")
            let leafLocalStat = this.setStatsForNode({node:node, nodeIdx:node.nodes.length-1},{leafCount:1},localStats);
            this.aggregateStats(stats, leafLocalStat);
            let nodeAggIdx = node.nodes.length-2;
            while (nodeAggIdx >= nodeIdx) {
                const moveSignature = sgfutils.getNodeSeparatedSGF({node:node, nodeIdx:nodeAggIdx});
                this.aggregateStats(stats, localStats.get(moveSignature));
                isDebug && console.log("YYY - ", sgfutils.copyNode(node.nodes[nodeAggIdx], true),JSON.stringify(stats), localStats.get(moveSignature))
                nodeAggIdx--;
            }
            isDebug && console.log('END getNodeStats NO seq after',
                sgfutils.getPrintablePath(sgfutils.getNodeSeparatedSGF({node:node, nodeIdx:node.nodes.length-1})),
                JSON.stringify(stats),JSON.stringify(leafLocalStat));
            return;
        }
        //console.log("getNodeStats - Last case (nodes array is valid)")
        let nodeAggIdx = node.nodes.length-1;
        while (nodeAggIdx >= nodeIdx) {
            const moveSignature = sgfutils.getNodeSeparatedSGF({node:node, nodeIdx:nodeAggIdx});
            this.aggregateStats(stats, localStats.get(moveSignature));
            isDebug && console.log("1XXX - "+sgfutils.getPrintablePath(moveSignature), JSON.stringify(stats), localStats.get(moveSignature))
            nodeAggIdx--;
        }
    },

    setStatsForNode: function(currentNode, stats, pLocalStats) {
        const moveSignature = sgfutils.getNodeSeparatedSGF({node:currentNode.node, nodeIdx:currentNode.nodeIdx});
        return this.setStatsForSignature(moveSignature, stats, pLocalStats);
    },

    setStatsForSignature: function(moveSignature, stats, pLocalStats) {
        let localStats = pLocalStats || sgfutils.deepParse(localStorage.getItem("localStats")) || new Map();
        let nodeStats = localStats.get(moveSignature);
        if(!nodeStats) {
            //console.log('setStatsForSignature NEW for '+moveSignature);
            nodeStats = this.getZeroStats();
            pLocalStats.set(moveSignature, nodeStats);
        }

        this.setStats(nodeStats, stats);
        return nodeStats;
    },

    aggregateStatsForNode: function(currentNode, stats, pLocalStats) {
        const moveSignature = this.getNodeSeparatedSGF({node:currentNode.node, nodeIdx:currentNode.nodeIdx});
        return this.aggregateStatsForSignature(moveSignature, stats, pLocalStats);
    },

    aggregateStatsForSignature: function(moveSignature, stats, pLocalStats) {
        let localStats = pLocalStats || sgfutils.deepParse(localStorage.getItem("localStats")) || new Map();
        let nodeStats = localStats.get(moveSignature);
        if(!nodeStats) {
            //console.log('aggregateStatsForSignature NEW for '+moveSignature);
            nodeStats = this.getZeroStats();
            pLocalStats.set(moveSignature, nodeStats);
        }

        this.aggregateStats(nodeStats, stats);
        return nodeStats;
    },

    addStatsForNode: function(currentNode, stats, pLocalStats) {
        const moveSignature = this.getNodeSeparatedSGF({node:currentNode.node, nodeIdx:currentNode.nodeIdx});
        return this.addStatsForSignature(moveSignature, stats, pLocalStats);
    },

    addStatsForSignature: function(moveSignature, stats, pLocalStats) {
        let localStats = pLocalStats || sgfutils.deepParse(localStorage.getItem("localStats")) || new Map();
        let nodeStats = localStats.get(moveSignature);
        if(!nodeStats) {
            //console.log('addStatsForSignature NEW for '+moveSignature);
            nodeStats = this.getZeroStats();
            pLocalStats.set(moveSignature, nodeStats);
        }

        this.addStats(nodeStats, stats);
        return nodeStats;
    },

    addStats: function(target, source) {
        if(!source) return;
        if(typeof source.leafCount !== "undefined")
            target.leafCount = (target.leafCount || 0) + source.leafCount;
        if(typeof source.failedLeafCount !== "undefined")
            target.failedLeafCount = (target.failedLeafCount || 0) + source.failedLeafCount;
        if(typeof source.foundLeafCount !== "undefined")
            target.foundLeafCount = (target.foundLeafCount || 0) + source.foundLeafCount;
        if(typeof source.successLeafCount !== "undefined")
            target.successLeafCount = (target.successLeafCount || 0) + source.successLeafCount;
        if(typeof source.mistakeCount !== "undefined")
            target.mistakeCount = (target.mistakeCount || 0) + source.mistakeCount;
    },

    aggregateStats: function(target, source) {
        if(!source) return;
        if(typeof source.leafCount !== "undefined")
            target.agg_leafCount = (target.agg_leafCount || 0) + source.leafCount;
        if(typeof source.failedLeafCount !== "undefined")
            target.agg_failedLeafCount = (target.agg_failedLeafCount || 0) + source.failedLeafCount;
        if(typeof source.foundLeafCount !== "undefined")
            target.agg_foundLeafCount = (target.agg_foundLeafCount || 0) + source.foundLeafCount;
        if(typeof source.successLeafCount !== "undefined")
            target.agg_successLeafCount = (target.agg_successLeafCount || 0) + source.successLeafCount;
        if(typeof source.mistakeCount !== "undefined")
            target.agg_mistakeCount = (target.agg_mistakeCount || 0) + source.mistakeCount;

        if(typeof source.agg_leafCount !== "undefined")
            target.agg_leafCount = (target.agg_leafCount || 0) + source.agg_leafCount;
        if(typeof source.agg_failedLeafCount !== "undefined")
            target.agg_failedLeafCount = (target.agg_failedLeafCount || 0) + source.agg_failedLeafCount;
        if(typeof source.agg_foundLeafCount !== "undefined")
            target.agg_foundLeafCount = (target.agg_foundLeafCount || 0) + source.agg_foundLeafCount;
        if(typeof source.agg_successLeafCount !== "undefined")
            target.agg_successLeafCount = (target.agg_successLeafCount || 0) + source.agg_successLeafCount;
        if(typeof source.agg_mistakeCount !== "undefined")
            target.agg_mistakeCount = (target.agg_mistakeCount || 0) + source.agg_mistakeCount;
    },

    setStats: function(target, source) {
        if(!source) return;
        if(typeof source.leafCount !== "undefined")
            target.leafCount =source.leafCount;
        if(typeof source.failedLeafCount !== "undefined")
            target.failedLeafCount =source.failedLeafCount;
        if(typeof source.foundLeafCount !== "undefined")
            target.foundLeafCount =source.foundLeafCount;
        if(typeof source.successLeafCount !== "undefined")
            target.successLeafCount =source.successLeafCount;
        if(typeof source.mistakeCount !== "undefined")
            target.mistakeCount =source.mistakeCount;
    },

    getZeroStats: function() {
        return {
            leafCount: 0,
            failedLeafCount:0,
            mistakeCount:0,
            foundLeafCount:0,
            successLeafCount:0
        };
    },
};
