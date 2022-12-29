import sgfutils from "./utils";

export default {


    // node is an sgf node to start from
    // stats should be an object with {leafCount}
    // localStats is a Map<signature,{leafCount: 0, failedLeafCount:0, foundLeafCount:0, successLeafCount:0}>
    getNodeStats: function(node, nodeIdx, stats, localStats) {
        //console.log('START getNodeStats ',sgfutils.copyNode(node.nodes[nodeIdx], true),stats);
        //let mistakeIndex = doubleMoveIdx < (node.nodes.length -1) && !sgfutils.isAcceptableMove(node.nodes[doubleMoveIdx+1], (nodeIdx >0 ? node.nodes[nodeIdx-1] : node.parent.nodes[node.parent.length-1])) ? doubleMoveIdx +1 : -1// we stop if a same player plays 2 times in a row (exists in some SGFs as example of continuation after tenuki...)
        let mistakeIndex = node.nodes.findIndex((oneNode, oneNodeIdx) => {
            return oneNodeIdx<node.nodes.length-1 && !sgfutils.isAcceptableMove(node.nodes[oneNodeIdx+1],oneNode);
        });
        if(mistakeIndex >= nodeIdx) { // there is a leaf here, so we return

            this.setStatsForNode({node:node, nodeIdx:mistakeIndex},{mistakeCount:1},localStats);

            let leafSignature= null;
            let leafLocalStat = null;
            if (mistakeIndex>nodeIdx) { // mistake at mistakeIndex AND leaf at mistakeIndex-1
                leafLocalStat = this.setStatsForNode({node:node, nodeIdx:mistakeIndex-1},{leafCount:1},localStats);
            }
            this.aggregateStats(stats, leafLocalStat);
            //console.log('END getNodeStats FOUND A MISTAKE at ',this.copyNode(node.nodes[mistakeIndex], true),stats);
            return;
        }

        // otherwise, call recursively
        let isAtLeastOneSeqValid = false;
        for (let sequencesIdx = 0 ; node.sequences && sequencesIdx < node.sequences.length ; sequencesIdx++) {
            let oneChild = node.sequences[sequencesIdx];
            //console.log('getNodeStats seq '+sequencesIdx);
            if(sgfutils.isAcceptableMove(oneChild.nodes[0],node.nodes[node.nodes.length-1])) {
                //console.log('getNodeStats seq '+sequencesIdx+' EXPLORED ',sgfutils.copyNode(oneChild.nodes[0], true));
                isAtLeastOneSeqValid = true;
                //const signature = this.getNodeSeparatedSGF({node:oneChild, nodeIdx:0});
                let childStats =  this.getZeroStats();
                this.getNodeStats(oneChild, 0, childStats, localStats);
                //localStats.set(signature, childStats);
                let leafLocalStat = this.setStatsForNode({node:oneChild, nodeIdx:0},childStats,localStats);
                this.aggregateStats(stats, childStats);
            }

            //console.log('END getNodeStats seq ',this.copyNode(node.nodes[node.nodes.length-1], true),stats);
        }

        if(!isAtLeastOneSeqValid) {
            let leafLocalStat = this.setStatsForNode({node:node, nodeIdx:node.nodes.length-1},{leafCount:1},localStats);

            this.aggregateStats(stats, leafLocalStat);
            //console.log('END getNodeStats NO seq after',sgfutils.copyNode(node.nodes[node.nodes.length-1], true),stats);
            return;
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
