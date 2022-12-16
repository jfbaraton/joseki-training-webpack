var sgf = require('smartgame');
var fs = require('fs');

var sansan_simple_haneSGF = String.raw`(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.51.1]KM[7.5]SZ[19]DT[2022-12-08];B[pd];W[qc];B[qd];W[pc];B[oc];W[ob];B[nc])`;
var sansan_double_haneSGF = String.raw`(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.51.1]KM[7.5]SZ[19]DT[2022-12-08];B[pd];W[qc];B[qd];W[pc];B[oc];W[ob];B[nb])`;

var sansan_simple_hane = sgf.parse(sansan_simple_haneSGF);
console.log('parsed sansan_simple_hane SGF: ', sansan_simple_hane);

var sansan_double_hane = sgf.parse(sansan_double_haneSGF);
console.log('parsed sansan_double_hane SGF: ', sansan_double_hane);

const isSameMove = function(node1, node2) {
	if (node1 === node2) return true;
	if (!node1 || !node2) return false;
	if (node1.pass && node2.pass) return true;
	if (node1.pass || node2.pass) return false;
	if (node1.B && node1.B === node2.B) return true;
	if (node1.W && node1.W === node2.W) return true;
	
	return false;
}

// everything from addedTree that is not already defined in masterTree will be added to masterTree
const merge = function(masterTree, addedTree, masterTreeNodeNextMoveIdx, addedTreeNodeNextMoveIdx) {
	console.log('START merge ', masterTreeNodeNextMoveIdx, addedTreeNodeNextMoveIdx);

	const isMasterNextMoveInMasterNodes = masterTree && masterTree.nodes && masterTree.nodes.length && masterTree.nodes.length > masterTreeNodeNextMoveIdx;

	if(!addedTree || !addedTree.nodes || !addedTree.nodes.length) return;
	// if the next node from addedTree is in nodes
	if(addedTree.nodes.length> addedTreeNodeNextMoveIdx) {
		console.log('the next node from addedTree is in nodes (',addedTreeNodeNextMoveIdx,'/',addedTree.nodes.length,')');
		// look for this addedTree node in the masterTree next node
		if(isMasterNextMoveInMasterNodes) {
			console.log('look for this addedTree node in the masterTree next node');
			if(isSameMove(masterTree.nodes[masterTreeNodeNextMoveIdx], addedTree.nodes[addedTreeNodeNextMoveIdx])) {
				// if master has this addTree node as the next node
				console.log('isSameMove(masterTree.nodes[masterTreeNodeNextMoveIdx], addedTree.nodes[addedTreeNodeNextMoveIdx]');
				merge(masterTree, addedTree, masterTreeNodeNextMoveIdx+1, addedTreeNodeNextMoveIdx+1);
				return;
			} else {
				console.log('nodes moves differ');
				// nodes moves differ
				// both addTree node and master node become master sequences two options
				// save master.sequences to tmp
				let seqTMP = masterTree.sequences;
				masterTree.sequences = [];
				// master remaining nodes -> master.sequences[0]
				// seqTMP -> master.sequences[0].sequences
				masterTree.sequences.push({
					nodes:masterTree.nodes.slice(masterTreeNodeNextMoveIdx),
					parent:masterTree.nodes[masterTreeNodeNextMoveIdx].parent,
					sequences:seqTMP
				});

				// addTree remaining nodes -> master.sequences[1]
				// addTree.sequences -> master.sequences[1].sequences
				masterTree.sequences.push({
					nodes:addedTree.nodes.slice(addedTreeNodeNextMoveIdx),
					parent:masterTree.nodes[masterTreeNodeNextMoveIdx].parent,
					sequences:addedTree.sequences
				});
				// TODO check all parents
				return;
			}
		} else if (masterTree.sequences && masterTree.sequences.length) {
			// next master move is in master.sequences

			// look in master.sequences if one corresponds
			const matchingMasterSeq =  masterTree.sequences.find( masterSeq => isSameMove(masterSeq.nodes[0], addedTree.nodes[addedTreeNodeNextMoveIdx]));

			if(matchingMasterSeq && matchingMasterSeq.length) {
				// if one corresponds, merge from index 0 if this master.sequences[matchingMoveIdx]
				merge(matchingMasterSeq[0], addTree, 1, addedTreeNodeNextMoveIdx+1);
		 		return;
			} else {
				// if no move corresponds, this addTree.nodes[addedTreeNodeNextMoveIdx] is a new sequence for master.sequences
				masterTree.sequences.push({
					nodes:addedTree.nodes.slice(addedTreeNodeNextMoveIdx ),
					parent:masterTree.nodes[masterTreeNodeNextMoveIdx].parent,
					sequences:addedTree.sequences
				});
		 		// TODO check all parents
			}
			return;
		} else {
			// no move in master
			// add all remaining addTree.nodes at the end of master.nodes
			 masterTree.nodes.push(...addedTree.nodes.slice(addedTreeNodeNextMoveIdx ));
			// addTree.sequences -> master.sequences
			 masterTree.sequences = addedTree.sequences;
			// TODO check all parents
		}
	 
	} else if(addedTree.sequences && addedTree.sequences.length){
		// if the next node from addedTree is in sequences
		if(isMasterNextMoveInMasterNodes) {

			const matchingMasterSeqIdx = addedTree.sequences.findIndex(
				oneAddedTreeSeq => isSameMove(masterTree.nodes[masterTreeNodeNextMoveIdx], oneAddTreeSeq.nodes[0]));
			let seqTMP = masterTree.sequences;
			addedTree.sequences.push({
				nodes:masterTree.nodes.slice(masterTreeNodeNextMoveIdx),
				parent:masterTree.nodes[masterTreeNodeNextMoveIdx].parent,
				sequences:seqTMP
			});

			masterTree.sequences = addedTree.sequences;
			masterTree.nodes = masterTree.nodes.slice(0,masterTreeNodeNextMoveIdx);

			if (matchingMasterSeqIdx>=0) {
				// if addedTree.sequences contains next master move
				masterTree.sequences.splice(matchingMasterSeqIdx,1);
				// -> call recursively merge on those identical sequence nodes
				merge(addedTree.sequences[addedTree.sequences.length-1],addedTree.sequences[matchingMasterSeqIdx], 1, 1);
			}
		  	// TODO check all parents
		  	// and that's it, no need to merge the rest of this addTree !!
		  	return;
	  	}
	  	for(let addedTreeSeqIdx = 0; addedTreeSeqIdx < addedTree.sequences.length ; addedTreeSeqIdx ++ ) {
		  	const oneAddTreeSeq = addedTree.sequences[addedTreeSeqIdx];
			if (masterTree.sequences && masterTree.sequences.length && masterTree.sequences.some(
				oneMasterSeq => isSameMove(oneMasterSeq.nodes[0], oneAddTreeSeq.nodes[0]))) {
				// if master has this sequence in its sequences
				// -> call recursively merge on those identical sequence nodes
				const matchingMasterSeq = masterTree.sequences.find(
					oneMasterSeq => isSameMove(oneMasterSeq.nodes[0], oneAddTreeSeq.nodes[0]))[0];
				merge(matchingMasterSeq[0], oneAddTreeSeq, 1, 1);
			} else {
				if( !masterTree.sequences || !masterTree.sequences.length) {
					masterTree.sequences = [];
				}
				masterTree.sequences.push(oneAddTreeSeq);
			}
		}
  	}
};

var mergedSGF = sgf.generate(sansan_simple_hane);
merge(mergedSGF, sansan_double_hane, 0, 0);
fs.writeFileSync('sansan_merged.sgf', mergedSGF, { encoding: 'utf8' });