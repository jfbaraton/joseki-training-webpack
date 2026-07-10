var sgf = require('smartgame');

var WGo = require('wgo');

// how many points can you lose in one move and still consider it "joseki"?
//const JOSEKI_MARGIN = 2.3;
const JOSEKI_MARGIN = 4;
const KATA_ANALYZE_TIME_MS = 1500; // multiple of 10 please

// SGF coordinates of the 4 candidate points (3-3, 3-4, 4-3, 4-4) in each corner.
// SGF board is 19x19 with letters a..s mapping to 1..19 (no skip).
const HANDICAP_CORNER_POINTS = {
    TR: ['qc', 'qd', 'pc', 'pd'], // 3-3, 3-4, 4-3(Q17), 4-4
    TL: ['cc', 'cd', 'dc', 'dd'],
    BL: ['cq', 'cp', 'dq', 'dp'],
    BR: ['qq', 'qp', 'pq', 'pp'],
};
// Q17 = SGF "pc" (column Q = 16th, row 17 from bottom = 3rd from top = SGF 'c')
const HANDICAP_TR_EXCLUDE = 'pc';

function permutations(arr) {
    if (arr.length <= 1) return [arr.slice()];
    const result = [];
    for (let i = 0; i < arr.length; i++) {
        const rest = arr.slice(0, i).concat(arr.slice(i + 1));
        for (const p of permutations(rest)) result.push([arr[i], ...p]);
    }
    return result;
}

// The 8 symmetries of the square board (dihedral group D4), acting on SGF points.
// SGF letters a..s -> 0..18; n = 18 is the max index used for mirroring.
const HANDICAP_BOARD_MAX = 18;
const HANDICAP_SYMMETRIES = [
    (x, y) => [x, y],                                             // identity
    (x, y) => [HANDICAP_BOARD_MAX - x, y],                        // mirror vertical
    (x, y) => [x, HANDICAP_BOARD_MAX - y],                        // mirror horizontal
    (x, y) => [HANDICAP_BOARD_MAX - x, HANDICAP_BOARD_MAX - y],   // rotate 180
    (x, y) => [y, x],                                             // transpose (main diagonal)
    (x, y) => [HANDICAP_BOARD_MAX - y, HANDICAP_BOARD_MAX - x],   // anti-diagonal
    (x, y) => [y, HANDICAP_BOARD_MAX - x],                        // rotate 90
    (x, y) => [HANDICAP_BOARD_MAX - y, x],                        // rotate 270
];

function sgfPointToXY(p) {
    return [p.charCodeAt(0) - 97, p.charCodeAt(1) - 97];
}

function xyToSgfPoint(x, y) {
    return String.fromCharCode(97 + x) + String.fromCharCode(97 + y);
}

// Canonical key for a combo's orbit under board symmetries: the lexicographically
// smallest sorted stone-set over all 8 transformations. Two combos that are equivalent
// through any rotation/reflection share the same key.
function symmetryOrbitKey(combo) {
    let best = null;
    for (const t of HANDICAP_SYMMETRIES) {
        const transformed = combo
            .map(p => { const [x, y] = sgfPointToXY(p); const [tx, ty] = t(x, y); return xyToSgfPoint(tx, ty); })
            .sort()
            .join('');
        if (best === null || transformed < best) best = transformed;
    }
    return best;
}

// Build the ordered list of stone quadruples ([TRmove, c2, c3, c4]) matching the constraints.
// Order of the moves does not matter, so combos that are the same set of 4 stones are
// considered equivalent; only the first (canonical) one is kept.
// Additionally, combos equivalent through a board symmetry (rotation/reflection) are
// considered equivalent too, so only one representative per symmetry orbit is kept.
function build4HandicapMoveCombos() {
    const combos = [];
    const seen = new Set();
    const seenOrbits = new Set();
    const trChoices = HANDICAP_CORNER_POINTS.TR.filter(p => p !== HANDICAP_TR_EXCLUDE);
    const otherCornerOrders = permutations(['TL', 'BL', 'BR']);
    for (const tr of trChoices) {
        for (const order of otherCornerOrders) {
            const [a, b, c] = order.map(k => HANDICAP_CORNER_POINTS[k]);
            for (const s1 of a) {
                for (const s2 of b) {
                    for (const s3 of c) {
                        const combo = [tr, s1, s2, s3];
                        const key = combo.slice().sort().join('');
                        if (seen.has(key)) continue;
                        seen.add(key);
                        const orbit = symmetryOrbitKey(combo);
                        if (seenOrbits.has(orbit)) continue;
                        seenOrbits.add(orbit);
                        combos.push(combo);
                    }
                }
            }
        }
    }
    return combos;
}

// Given a corner key ('TR'|'TL'|'BR'|'BL') and one of its handicap stones (SGF point),
// returns the approach candidates grouped by which of the corner's 2 sides they land on:
//   - sideCol: the corner-side running along the vertical edge (left/right)
//   - sideRow: the corner-side running along the horizontal edge (top/bottom)
// Approach rules (X-Y notation = X from the corner's vertical edge, Y from horizontal edge):
//   - 3-3 corner: [4-6] on sideCol, [6-4] on sideRow
//   - 4-4 corner: [3-6] on sideCol, [6-3] on sideRow
//   - 3-4 corner: [6-4, 5-4, 6-3, 5-3] on sideRow, nothing on sideCol
//   - 4-3 corner: [4-6, 4-5, 3-6, 3-5] on sideCol, nothing on sideRow (mirror of 3-4)
const HANDICAP_CORNER_ORIENTATION = {
    TR: { colEdgeIsRight: true,  rowEdgeIsTop: true  },
    TL: { colEdgeIsRight: false, rowEdgeIsTop: true  },
    BR: { colEdgeIsRight: true,  rowEdgeIsTop: false },
    BL: { colEdgeIsRight: false, rowEdgeIsTop: false },
};

function getApproachesForCornerStone(cornerKey, stoneSGF) {
    const orient = HANDICAP_CORNER_ORIENTATION[cornerKey];
    const [x, y] = sgfPointToXY(stoneSGF);
    const c = (orient.colEdgeIsRight ? HANDICAP_BOARD_MAX - x : x) + 1;
    const r = (orient.rowEdgeIsTop ? y : HANDICAP_BOARD_MAX - y) + 1;

    const toSGF = (cc, rr) => {
        const nx = orient.colEdgeIsRight ? HANDICAP_BOARD_MAX - (cc - 1) : (cc - 1);
        const ny = orient.rowEdgeIsTop ? (rr - 1) : HANDICAP_BOARD_MAX - (rr - 1);
        return xyToSgfPoint(nx, ny);
    };

    let sideCol = [];
    let sideRow = [];
    if (c === 3 && r === 3) {
        sideCol = [toSGF(4, 6)];
        sideRow = [toSGF(6, 4)];
    } else if (c === 4 && r === 4) {
        sideCol = [toSGF(3, 6)];
        sideRow = [toSGF(6, 3)];
    } else if (c === 3 && r === 4) {
        sideRow = [toSGF(6, 4), toSGF(5, 4), toSGF(6, 3), toSGF(5, 3), toSGF(4, 5), toSGF(4, 6)];
    } else if (c === 4 && r === 3) {
        sideCol = [toSGF(4, 6), toSGF(4, 5), toSGF(3, 6), toSGF(3, 5), toSGF(5, 4), toSGF(6, 4)];
    }
    return { sideCol, sideRow };
}

function getCornerOfStone(stoneSGF) {
    for (const cornerKey of Object.keys(HANDICAP_CORNER_POINTS)) {
        if (HANDICAP_CORNER_POINTS[cornerKey].includes(stoneSGF)) return cornerKey;
    }
    return null;
}

// Given one 4-handicap combo (4 SGF points, one per corner), builds all 6-handicap combos
// by adding 2 approach moves. Constraints:
//   - Each corner has 2 sides; there are 8 corner-sides total.
//   - The 2 added approaches must land on 2 different corner-sides
//     (i.e. no corner-side is used twice).
// The result is deduped by the unordered set of 6 stones.
function build6HandicapMoveCombos(combo4) {
    if (!Array.isArray(combo4) || combo4.length !== 4) {
        throw new Error('build6HandicapMoveCombos: expected a 4-handicap combo (array of 4 SGF points)');
    }

    const options = [];
    combo4.forEach((stone, idx) => {
        const cornerKey = getCornerOfStone(stone);
        if (!cornerKey) throw new Error(`build6HandicapMoveCombos: stone ${stone} is not in any handicap corner`);
        const { sideCol, sideRow } = getApproachesForCornerStone(cornerKey, stone);
        for (const mv of sideCol) options.push({ cornerIdx: idx, side: 'col', move: mv });
        for (const mv of sideRow) options.push({ cornerIdx: idx, side: 'row', move: mv });
    });

    // Also consider the 4 side-midpoint stones at coordinate 4-10 (one per board edge).
    // These are not in any corner, so they get their own unique (cornerIdx, side) tags
    // and don't conflict with corner-side dedup.
    const FOUR_TEN_POINTS = [
        { cornerIdx: 'edge-top',    side: 'mid', move: 'jd' }, // top edge:    row 4, col 10
        { cornerIdx: 'edge-bottom', side: 'mid', move: 'jp' }, // bottom edge: row 16, col 10
        { cornerIdx: 'edge-left',   side: 'mid', move: 'dj' }, // left edge:   col 4, row 10
        { cornerIdx: 'edge-right',  side: 'mid', move: 'pj' }, // right edge:  col 16, row 10
    ];
    for (const opt of FOUR_TEN_POINTS) options.push(opt);

    const combos = [];
    const seen = new Set();
    const seenOrbits = new Set();
    for (let i = 0; i < options.length; i++) {
        for (let j = i + 1; j < options.length; j++) {
            const o1 = options[i];
            const o2 = options[j];
            if (o1.cornerIdx === o2.cornerIdx && o1.side === o2.side) continue;
            if (o1.move === o2.move) continue;
            const combo6 = combo4.concat([o1.move, o2.move]);
            const key = combo6.slice().sort().join('');
            if (seen.has(key)) continue;
            seen.add(key);
            const orbit = symmetryOrbitKey(combo6);
            if (seenOrbits.has(orbit)) continue;
            seenOrbits.add(orbit);
            combos.push(combo6);
        }
    }
    return combos;
}

function movesTo4HandicapSGFString(moves) {
    // 4 black moves separated by white "pass" moves: B[..];W[];B[..];W[];B[..];W[];B[..]
    const body = moves.map((m, i) => (i === 0 ? `;B[${m}]` : `;W[];B[${m}]`)).join('');
    return `(;GM[1]FF[4]CA[UTF-8]KM[6.5]SZ[19]${body})`;
}
const start = Date.now();
console.log("building 4-handicap combos (deduped by set + board symmetry)")
const _all4HandicapMoveCombos = build4HandicapMoveCombos(); // 3 * 4 * 4 * 4 = 192 unique
const builtMs = Date.now() - start;
console.log(`built ${_all4HandicapMoveCombos.length} combos in ${Math.floor(builtMs / 1000)} seconds`)
console.log(_all4HandicapMoveCombos[0])

const all4HandicapSGFs = _all4HandicapMoveCombos.map(m => movesTo4HandicapSGFString(m));
const mapMs = Date.now() - start;
console.log(`mapped ${all4HandicapSGFs.length} combos in ${Math.floor(mapMs / 1000)} seconds`)
console.log(all4HandicapSGFs[0])

module.exports = {
    getEmptySGF: function() {
        return sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19])');
    },
    get2MoveSGF: function() {
        return sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[6.5]SZ[19];B[pd];W[dp])');
    },
    get8MoveSGF: function() {
        return sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[6.5]SZ[19];B[pd];W[dp];B[qf];W[dn];B[em];W[dm];B[ek];W[jj])');
    },
    get9HSGF: function() {
        return sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[6.5]SZ[19];B[dp];W[];B[pp];W[];B[dd];W[];B[pd];W[];B[jp];W[];B[dj];W[];B[jd];W[];B[pj];W[];B[jj])');
    },
    get9H_4shimarisSGF: function() {
        return sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[6.5]SZ[19];B[dd];W[];B[pp];W[];B[cf];W[];B[qn];W[];B[pd];W[];B[qf];W[];B[dp];W[];B[cn];W[];B[jj])');
    },
    get9H_komoku_shimarisSGF: function() {
        return sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[6.5]SZ[19];B[dc];W[];B[pq];W[];B[qd];W[];B[dq];W[];B[df];W[];B[qo];W[];B[nd];W[];B[co];W[];B[jj])');
    },
    get9H_sansanSGF: function() {
        return sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[6.5]SZ[19];B[cq];W[];B[qq];W[];B[cc];W[];B[qc];W[];B[jp];W[];B[dj];W[];B[jd];W[];B[pj];W[];B[jj])');
    },
    get9H_BADSGF: function() {
        return sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[6.5]SZ[19];B[aa];W[];B[bb];W[];B[ab];W[];B[ba];W[];B[jj];W[];B[dj];W[];B[jd];W[];B[pj];W[];B[jp])');
    },
    get154MoveSGF: function() {
        return sgf.parse('(;GM[1]FF[4]CA[UTF-8]KM[6.5]SZ[19];B[pp];W[cd];B[dp];W[qd];B[jj];W[cn];B[cl];W[en];B[dm];W[dn];B[cp];W[fp];B[fq];W[gq];B[eq];W[gp];B[jq];W[di];B[fl];W[jp];B[kq];W[iq];B[kp];W[ip];B[kn];W[ec];B[gn];W[ep];B[fn];W[eo];B[in];W[bl];B[bk];W[bm];B[cj];W[dk];B[ck];W[bo];B[bp];W[gr];B[fr];W[dr];B[dq];W[br];B[cr];W[cs];B[cq];W[bs];B[ar];W[ap];B[aq];W[ao];B[bq];W[em];B[el];W[dl];B[dj];W[ek];B[ej];W[fk];B[cm];W[gl];B[fm];W[gj];B[hk];W[gk];B[fi];W[hi];B[gh];W[hh];B[cf];W[df];B[dg];W[gs];B[fs];W[co];B[ce];W[dd];B[gf];W[ji];B[ki];W[if];B[jh];W[hf];B[hg];W[ig];B[gg];W[ih];B[gd];W[ic];B[id];W[jd];B[hc];W[jc];B[fb];W[eb];B[oc];W[mc];B[pe];W[ge];B[fe];W[he];B[fd];W[qe];B[pf];W[qg];B[qf];W[rf];B[pg];W[rh];B[qh];W[rg];B[qi];W[qq];B[pq];W[qp];B[qo];W[pr];B[or];W[ro];B[qn];W[qr];B[rn];W[oq];B[nr];W[rp];B[qb];W[lo];B[ko];W[nq];B[mq];W[po];B[op];W[np];B[oo];W[mp];B[lr];W[mm];B[om];W[mk];B[nl];W[ml];B[ln];W[mi];B[nj];W[nk];B[ok];W[mj];B[mg];W[lh];B[kg];W[lg];B[lf];W[kh])');
    },
    /**
     * returns the SGF number "number" out of all the considered 4 Handicap SGFs
     * @param number
     */
    get4HandicapSGF: function(number) {
        // 4 black moves, separated by white "pass" moves
        // the first 4 black moves will be in each different corners
        // the first move is always in the top right corner, but it cannot be Q17
        // for each corner, we consider 4 moves: 3-3, 3-4, 4-3, 4-4
        if (typeof number !== 'number' || number < 0 || number >= all4HandicapSGFs.length) {
            return null;
        }
        return all4HandicapSGFs[number];
    },

    all4HandicapSGFs: all4HandicapSGFs,
    all4HandicapMoveCombos: _all4HandicapMoveCombos,
    movesTo4HandicapSGFString: movesTo4HandicapSGFString,
    count4HandicapSGFs: all4HandicapSGFs.length,
    build6HandicapMoveCombos: build6HandicapMoveCombos,



    makeNodeFromOGS: function(ogsMove, BorW) {
        let result = {
            //C:ogsMove.description+(ogsMove.category? ogsMove.category : "")
            C: (ogsMove.description || "").replaceAll('[','(').replaceAll(']',')')/*+(ogsMove.category? ogsMove.category : "")*/
        };
        if(!result.C) delete C;
        //console.log('converting '+ogsMove.placement+ " for "+BorW)
        if(ogsMove.placement && ogsMove.placement !== "root") {
            //console.log('converting to #'+this.humanToSgfCoord(ogsMove.placement)+'#')
            if (BorW === 'B') {
                result.B = this.humanToSgfCoord(ogsMove.placement);
            } else if (BorW === 'W') {
                result.W = this.humanToSgfCoord(ogsMove.placement);
            }
        } else if (result.C){
            result.GC = result.C;
            delete result.C
        }

        return result;
    },

    yCoordinateFor: function yCoordinateFor(y) {
        return 19 - y;
    },

    xCoordinateFor: function xCoordinateFor(x) {
        var letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"];

        return letters[x];
    },

    // x, y to human
    coordinatesFor: function coordinatesFor(y, x) {
        return this.xCoordinateFor(x) + this.yCoordinateFor(y);
    },

    // human to sgfCoord
    humanToSgfCoord: function coordinatesFor(moveHumanString) {
        if(!moveHumanString || typeof moveHumanString !== "string" || moveHumanString === "root") return null;
        if(moveHumanString === "pass") return "";
        let x = moveHumanString.substring(0,1).charCodeAt(0)-'A'.charCodeAt(0);
        if(x>=8) x--; // letter 'i' is skipped
        const y = 19-parseInt(moveHumanString.substring(1));
        return this.pointToSgfCoord({y: y, x:x});
    },

    sgfCoordToPoint:function(_18a){
        if(!_18a||_18a==="tt"){
            return {x:null,y:null,pass:true};
        }
        let _18b={a:0,b:1,c:2,d:3,e:4,f:5,g:6,h:7,i:8,j:9,k:10,l:11,m:12,n:13,o:14,p:15,q:16,r:17,s:18};
        return {x:_18b[_18a.charAt(0)],y:_18b[_18a.charAt(1)]};
    },

    pointToSgfCoord:function(pt){
        if(!pt || pt.x === null || pt.y === null || pt.x <0 || pt.y <0){
            return "";
        }
        let pts={0:"a",1:"b",2:"c",3:"d",4:"e",5:"f",6:"g",7:"h",8:"i",9:"j",10:"k",11:"l",12:"m",13:"n",14:"o",15:"p",16:"q",17:"r",18:"s"};
        return pts[pt.x]+pts[pt.y];
    },

    // B."pd" -> "B Q16"
    SGFToHuman: function (sgfNode) {
        if(!sgfNode || (typeof sgfNode.B === "undefined" && typeof sgfNode.W === "undefined" )) return "";
        let result = "play "+ (typeof sgfNode.B === "undefined" ? "W " : "B ");
        const SGFmoveString = typeof sgfNode.B === "undefined" ? sgfNode.W : sgfNode.B;
        const movePoint = this.sgfCoordToPoint(SGFmoveString);

        result += this.pointToHuman(movePoint);
        return result;
    },

    // B."pd" -> "Q16"
    SGFCoordToHuman: function (SGFmove) {
        let SGFmoveString = SGFmove;
        if(typeof SGFmove !== typeof "" && !(SGFmove instanceof String)){
            SGFmoveString = typeof sgfNode.B === "undefined" ? sgfNode.W : sgfNode.B;
        }
        const movePoint = this.sgfCoordToPoint(SGFmoveString);

        return this.pointToHuman(movePoint);
    },

    pointToHuman:function(pt){
        if(!pt || pt.pass){
            return "PASS";
        }
        const pts={0:"A",1:"B",2:"C",3:"D",4:"E",5:"F",6:"G",7:"H",8:"J",9:"K",10:"L",11:"M",12:"N",13:"O",14:"P",15:"Q",16:"R",17:"S",18:"T"};
        return pts[pt.x]+(19-pt.y);
    },

    humanToPoint: function (moveHumanString) {
        if(!moveHumanString || typeof moveHumanString !== "string" || moveHumanString === "root") return null;
        if(moveHumanString === "pass") return "";
        let x = moveHumanString.substring(0,1).charCodeAt(0)-'A'.charCodeAt(0);
        if(x>=8) x--; // letter 'i' is skipped
        const y = 19-parseInt(moveHumanString.substring(1));
        return {y: y, x:x};
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

    isAcceptableMove: function(node, previousNode, minimumScore) {
        if(!node || node.BM || node.UC) return false;
        if(node.DM || typeof node.B === "string" && node.B === '' || typeof node.W === "string" && node.W === '' ) return true; // joseki or pass always accepted

        if(previousNode) {
            // if same move color as the previous move, we don't accept
            if(this.areMovesSameColor(node,previousNode)) return false;
            const margin = typeof node.B === "string" ? JOSEKI_MARGIN : -JOSEKI_MARGIN;
            let scoreThreshold = typeof minimumScore !== "undefined" ? minimumScore : typeof previousNode.V !== "undefined" ? (parseFloat(previousNode.V)-margin) : null;
            if(typeof node.V !== "undefined" && scoreThreshold != null && node.W === "pc") {
                console.log("is acceptable based on V?", node);
                console.log("?", previousNode);
                console.log("B<?", typeof node.B === "string", parseFloat(node.V), scoreThreshold);
                console.log("W>?", typeof node.W === "string");
                if(typeof node.B === "string" && parseFloat(node.V)<scoreThreshold) { // black move
                    return false;
                } else if(typeof node.W === "string" && parseFloat(node.V)>scoreThreshold) { // white move
                    return false;
                }
            }

        }
        return true;
    },

    // returns {node:node, nodeIdx:nodeIdx} or null
    getPreviousMove: function(nodeAndNodeIdx) {
        if(!nodeAndNodeIdx ||!nodeAndNodeIdx.node || !nodeAndNodeIdx.node.nodes || !nodeAndNodeIdx.node.nodes.length || nodeAndNodeIdx.nodeIdx>=nodeAndNodeIdx.node.nodes.length){
            console.log('sth wrong with ', nodeAndNodeIdx.node, nodeAndNodeIdx.nodeIdx);
            return null;
        }
        if(nodeAndNodeIdx.nodeIdx <= 0 ) {
            if(nodeAndNodeIdx.node.parent && nodeAndNodeIdx.node.parent.nodes && nodeAndNodeIdx.node.parent.nodes.length) {
                return {node:nodeAndNodeIdx.node.parent, nodeIdx:nodeAndNodeIdx.node.parent.nodes.length-1};
            } else {
                //console.log('NO PARENT ', nodeAndNodeIdx.node, nodeAndNodeIdx.nodeIdx);
                return null;
            }
        }
        return {node:nodeAndNodeIdx.node, nodeIdx:nodeAndNodeIdx.nodeIdx-1};
    },

    isAcceptableMoveIdxOLD: function(node, nodeIdx) {
        let previousNode = this.getPreviousMove({node:node, nodeIdx:nodeIdx});
        let previousMove = previousNode ? previousNode.node.nodes[previousNode.nodeIdx]: null;
        return this.isAcceptableMove(node.nodes[nodeIdx],previousMove);
    },

    isAcceptableMoveIdx: function(node, nodeIdx) {
        let move = node.nodes[nodeIdx];
        if(!move || move.BM || move.UC) return false;
        if(move.DM || typeof move.B === "string" && move.B === '' || typeof move.W === "string" && move.W === '' ) return true; // joseki or pass always accepted
        let previousNode = this.getPreviousMove({node:node, nodeIdx:nodeIdx});
        if(previousNode) {
            //console.log('found prev move');            // if same move color as the previous move, we don t accept
            if(this.areMovesSameColor(move,previousNode.node.nodes[previousNode.nodeIdx])) return false;
            const margin = typeof move.B === "string" ? JOSEKI_MARGIN : -JOSEKI_MARGIN;
            if(typeof move.V !== "undefined") {
                let lastScoreNode = previousNode;
                while(lastScoreNode && typeof lastScoreNode.node.nodes[lastScoreNode.nodeIdx].V === "undefined") {
                    lastScoreNode = this.getPreviousMove(lastScoreNode);
                }
                if(lastScoreNode) {
                    let scoreThreshold = typeof lastScoreNode.node.nodes[lastScoreNode.nodeIdx].V !== "undefined" ? (parseFloat(lastScoreNode.node.nodes[lastScoreNode.nodeIdx].V) - margin) : null;
                    //console.log("is acceptable based on V?", move);
                    //console.log("?", lastScoreNode.node.nodes[lastScoreNode.nodeIdx].V);
                    //console.log("B<?", typeof move.B === "string", parseFloat(move.V), scoreThreshold);
                    //console.log("W>?", typeof move.W === "string");
                    if (typeof move.B === "string" && parseFloat(move.V) < scoreThreshold) { // black move
                        return false;
                    } else if (typeof move.W === "string" && parseFloat(move.V) > scoreThreshold) { // white move
                        return false;
                    }
                }
            }

        }
        return true;
    },

    areMovesSameColor: function(node, previousNode) {
        if(!node || !previousNode) return false;
        return typeof node.B === typeof previousNode.B &&
                               typeof node.W === typeof previousNode.W;
    },

    copyMetadata: function(target, source) {
        //console.log("copyMetadata ", target, source);
        if(!source || !target) return;
        if(typeof source.BM !== "undefined") {target.BM = source.BM;}
        if(typeof source.UC !== "undefined") {target.UC = source.UC;}
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

    getNodeSeparatedSGF: function(currentNode, untilMove) {
        let currentSGFVariation = [];
        this.getVariationSGF(currentNode.node, currentNode.nodeIdx, currentSGFVariation, true);
        const emptySGF = this.getEmptySGF();
        currentSGFVariation.filter(node => !!node).filter((value, index) => !untilMove || index < untilMove).forEach(node => emptySGF.gameTrees[0].nodes.push(node));
        return sgf.generate(emptySGF);
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
            let newsgfPosition = this.isInSequence(game, oneMove, nodeIdx+1, sgfPosition, availableTransforms);
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

        // is oneMove one of the allowed children of gameTreeSequenceNode
        // if so, returns the matching sequences.X object
    isInSequence : function(game, oneMove, nodeIdx, gameTreeSequenceNode, availableTransforms, isIgnoreErrors) {
        if(nodeIdx< gameTreeSequenceNode.nodes.length) {
            const oneChildMoves = gameTreeSequenceNode.nodes.
                filter( (childNode, sequenceIdx) => sequenceIdx === nodeIdx). // we only consider the "nodeIdx" move of the nodes
                filter(childNode => typeof (oneMove.color === "black" ? childNode.B : childNode.W) !== "undefined").
                filter(childNode => !oneMove.pass || (oneMove.color === "black" ? childNode.B : childNode.W) === "").
                filter(childNode => oneMove.pass || this.getPossibleTransforms(
                    this.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
                    {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                    availableTransforms));

            if(oneChildMoves && oneChildMoves.length && (isIgnoreErrors || this.isAcceptableMoveIdx(gameTreeSequenceNode, nodeIdx))) {
                if(!oneMove.pass) {
                    let childNode = oneChildMoves[0];
                    let newAvailableTransforms = this.getPossibleTransforms(
                         this.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
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

        for (let sequencesIdx = 0 ; gameTreeSequenceNode.sequences && sequencesIdx < gameTreeSequenceNode.sequences.length ; sequencesIdx++) {
            let oneChild = gameTreeSequenceNode.sequences[sequencesIdx];
            const oneChildMoves = oneChild.nodes && oneChild.nodes.
                filter( (childNode, sequenceIdx) => sequenceIdx === 0). // we only consider the first move of the sequence
                filter(childNode => typeof (oneMove.color === "black" ? childNode.B : childNode.W) !== "undefined").
                filter(childNode => !oneMove.pass || (oneMove.color === "black" ? childNode.B : childNode.W) === "").
                filter(childNode => oneMove.pass || this.getPossibleTransforms(
                     this.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
                     {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                     availableTransforms));

            if(oneChildMoves && oneChildMoves.length && (isIgnoreErrors || this.isAcceptableMoveIdx(oneChild, 0))) {
                if(!oneMove.pass) {
                    let childNode = oneChildMoves [0];
                    let newAvailableTransforms = this.getPossibleTransforms(
                         this.sgfCoordToPoint(oneMove.color === "black" ? childNode.B : childNode.W) ,
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

    replacer: function(key, value) {
        if(value instanceof Map) {
            return {
                dataType: 'Map',
                value: Array.from(value.entries()), // or with spread: value: [...value]
            };
        } else {
            return value;
        }
    },

    reviver: function(key, value) {
        if(typeof value === 'object' && value !== null) {
            if (value.dataType === 'Map') {
                return new Map(value.value);
            }
        }
        return value;
    },

    deepStringify: function(object) {
        return JSON.stringify(object, this.replacer);
    },

    deepParse: function(str) {
        return JSON.parse(str, this.reviver);
    },

    cleanPassForShow: function(node) {
        let allNodeIdx = 0;
        while(node.nodes.length >1 && allNodeIdx <node.nodes.length) {
                // move is PASS
            if(node.nodes[allNodeIdx].C && node.nodes[allNodeIdx].C.indexOf('PASS to show continuation') >=0) {
                const lengthBefore = node.nodes.length
                node.nodes.splice(allNodeIdx, 1);
                //console.log('cleanPassForShow removed! '+lengthBefore +'->'+ node.nodes.length);
            } else {
                allNodeIdx++;
            }
        }

        if(node.nodes.length === 1 && node.nodes[0].C && node.nodes[0].C.indexOf('PASS to show continuation') >=0) {
            console.log('cleanPassForShow could not remove !', this.getNodeSeparatedSGF({node:node, nodeIdx:0}));
        }
        for(let seqIdx = 0 ; node.sequences && seqIdx < node.sequences.length;seqIdx++) {
            this.cleanPassForShow(node.sequences[seqIdx]);
        }
    },

    // check for several moves in a row by the same player
    // adds opponent PASS between them (when it is not a handicap move)
    // returns a gameTree
    cleanSGF: function(originalSGFOrgameTree) {
        // make a copy of the original gametree
        const originalSGFString = typeof originalSGFOrgameTree === "string" ? originalSGFOrgameTree : sgf.generate(originalSGFOrgameTree);
        let resultTree = sgf.parse(originalSGFString);
        this.cleanKatrainNode(resultTree.gameTrees[0].nodes[0]);
        this.cleanSGFBranch(resultTree.gameTrees[0], 1, resultTree.gameTrees[0].nodes[0], 1, 1)
        return resultTree;
    },

    cleanSGFBranch: function(node, pNodeIdx, lastMoveNode, moveNumberIfHandicap, moveNumber) {
        let nodeIdx = pNodeIdx;

        //look for pass+pass+move
        let allNodeIdx = 0;
        while(nodeIdx < node.nodes.length && node.nodes.length >1 && allNodeIdx <node.nodes.length) {
            if(!node.nodes[allNodeIdx].B && !node.nodes[allNodeIdx].W) {
                // move is PASS
                if(node.nodes[allNodeIdx].C === 'PASS to show continuation') {
                    node.nodes.splice(allNodeIdx, 1);
                    if(allNodeIdx <nodeIdx) {
                        nodeIdx--;
                    }
                } else {
                    allNodeIdx++;
                }
            } else {
                allNodeIdx++;
            }
        }

        let isHandicap = moveNumberIfHandicap;
        if(nodeIdx < node.nodes.length) {

            // next move is in nodes
            //this.isTenukiAsD4({node:node, nodeIdx:nodeIdx}, moveNumber);
            //this.is17N16({node:node, nodeIdx:nodeIdx}, moveNumber);
            if(node.nodes[nodeIdx].AW || node.nodes[nodeIdx].AB) {
                this.deleteVariation(node,nodeIdx);
                return;
            }
            if(this.areMovesSameColor(node.nodes[nodeIdx],lastMoveNode)) {
                if(isHandicap) {
                    isHandicap ++;
                } else {
                    // add a PASS from the opponent
                    this.addPASSBefore(node, nodeIdx, lastMoveNode);
                    // nodeIdx++;
                }
            } else {
                isHandicap = 0;
            }
            this.cleanKatrainNode(node.nodes[nodeIdx]);
            this.cleanSGFBranch(node, nodeIdx+1, node.nodes[nodeIdx], isHandicap, moveNumber+1);
            return;
        }
        const originalIsHandicap = isHandicap;
        // next move is in sequences
        // keep track on same color move indexes
        const sameColorSequences = [];
        let passSequenceIdx = -1;
        for (let sequencesIdx = 0 ; node.sequences && sequencesIdx < node.sequences.length ; sequencesIdx++) {
            isHandicap = originalIsHandicap;
            let oneChild = node.sequences[sequencesIdx];
            //this.is14O16({node:oneChild, nodeIdx:0}, moveNumber);
            //this.isTenukiAsD4({node:oneChild, nodeIdx:0}, moveNumber);
            //this.is17N16({node:oneChild, nodeIdx:0}, moveNumber);
            if(oneChild.nodes[0].AW || oneChild.nodes[0].AB) {
                this.deleteVariation(oneChild,0);
                sequencesIdx--;
                continue;
            } else if(this.areMovesSameColor(oneChild.nodes[0],lastMoveNode)) {
                if(isHandicap) {
                    isHandicap ++;
                } else {
                    // add a PASS from the opponent as first move of the sequence
                    //this.addPASSBefore(oneChild, 0, lastMoveNode);
                    // add a PASS from the opponent as last .nodes
                    //this.addPASSBefore(node, nodeIdx, lastMoveNode);
                    sameColorSequences.push(sequencesIdx);
                    continue;
                }
            } else {
                if(!oneChild.nodes[0].B && !oneChild.nodes[0].W && sequencesIdx <0) { // is pass
                    passSequenceIdx = sequencesIdx;
                }
                isHandicap = 0;
            }
            this.cleanKatrainNode(oneChild.nodes[0]);
            this.cleanSGFBranch(oneChild, 1, oneChild.nodes[0], isHandicap, moveNumber+1);
            if(passSequenceIdx>=0 && passSequenceIdx < node.sequences.length && (node.sequences[passSequenceIdx].nodes[0].B || node.sequences[passSequenceIdx].nodes[0].W)) {
                passSequenceIdx = -1;
            }
        }

        if(sameColorSequences.length) {
            if (passSequenceIdx < 0) {
                // create a pass sequence
                let addedMove = {
                    nodes: [typeof lastMoveNode.W !== "undefined" ? {
                            B: '',
                            C: 'PASS to show continuationz',
                            UC: 1
                        } : {W: '', C: 'PASS to show continuation', UC: 1}
                    ],
                    parent :node,
                    sequences:[]
                };
                node.sequences.push(addedMove);
                passSequenceIdx = node.sequences.length - 1;
            } else {
                // there was already a pass sequence
                // make it one move long, and move the main variation (after pass) from nodes to sequences
                node.sequences[passSequenceIdx].sequences.push(
                    {
                        nodes:node.sequences[passSequenceIdx].nodes.splice(1, node.sequences[passSequenceIdx].nodes.length-1),
                        parent:node.sequences[passSequenceIdx],
                        sequences:node.sequences[passSequenceIdx].sequences
                    });
            }
            if (!node.sequences[passSequenceIdx].sequences) {
                node.sequences[passSequenceIdx].sequences = [];
            }
            // move all sameColorSequences to passSequenceIdx.sequences
            for (let sequencesIdx2 = sameColorSequences.length - 1; sequencesIdx2 >= 0; sequencesIdx2--) {
                if(sameColorSequences.length>1 || node.sequences[passSequenceIdx].sequences.length) {
                    node.sequences[passSequenceIdx].sequences.push(node.sequences[sameColorSequences[sequencesIdx2]]);
                } else {
                    // add the sequence straight after the pass, in nodes
                    node.sequences[passSequenceIdx].nodes.splice(1,0,...node.sequences[sameColorSequences[sequencesIdx2]].nodes.splice(1, node.sequences[sameColorSequences[sequencesIdx2]].nodes.length-1));
                }
                node.sequences.splice(sameColorSequences[sequencesIdx2],1);
                if(sameColorSequences[sequencesIdx2] < passSequenceIdx) {
                    passSequenceIdx--;
                }
            }
            let oneChild = node.sequences[passSequenceIdx];
            this.cleanSGFBranch(oneChild, 1, oneChild.nodes[0], isHandicap, moveNumber+1);
        }
    },
/*
    is14O16: function(currentNode, moveNumber){
        const O16 = "nd";
        let move = currentNode.node.nodes[currentNode.nodeIdx];
        if(14 === moveNumber && (move.B === O16 || move.W === O16)) {
            console.log('found O16 as move 14 : ',this.getNodeSeparatedSGF({node:currentNode.node, nodeIdx:currentNode.nodeIdx}));
        }

    },
    is17N16: function(currentNode, moveNumber){
        const N16 = "md";
        let move = currentNode.node.nodes[currentNode.nodeIdx];
        if(18 === moveNumber && (move.B === N16 || move.W === N16)) {
            console.log('found N16 as move 17 : ',this.getNodeSeparatedSGF({node:currentNode.node, nodeIdx:currentNode.nodeIdx}));
        }

    },
    isTenukiAsD4: function(currentNode, moveNumber){
        const D4 = "dp";
        let move = currentNode.node.nodes[currentNode.nodeIdx];
        if(move.B === D4 || move.W === D4) {
            console.log('found Tenuki as D4 : ',this.getNodeSeparatedSGF({node:currentNode.node, nodeIdx:currentNode.nodeIdx}));
            if(move.B === D4) {
                move.B = '';
            } else {
                move.W = '';
            }
        }

    },*/

    addPASSBefore: function(node, nodeIdx, lastMoveNode) {
        //console.log('addPASSBefore '+nodeIdx, lastMoveNode);
        // make a PASS that is a UC (unclear) move, so that the branch is not explored as a continuation
        // the reasons is that those double moves can have different purpose, like to show later continuations (not supposed to happen NOW)
        // we could find a different way/metadata to differentiate those variations
        let addedMove = typeof lastMoveNode.W !== "undefined" ? {B:'', C:'PASS to show continuations', UC:1} : {W:'', C:'PASS to show continuation', UC:1};

        node.nodes.splice(nodeIdx, 0, addedMove); // add move at index nodeIdx, deleting 0 nodes
    },

    deleteVariation: function(node, nodeIdx) {
        console.log('deleteVariation '+nodeIdx);
        if(nodeIdx > 0){
            // delete this node and the following ones from .nodes
            node.nodes.splice(nodeIdx, node.nodes.length-nodeIdx);
            // delete .sequences
            delete node.sequences;
        } else {
            // delete sequence from parent
            let seqIdx = node.parent.sequences.findIndex(oneSeq => oneSeq === node);
            node.parent.sequences.splice(seqIdx,1);
        }
    },

    cleanKatrainNode: function(node) {
        if (node.KT)
            delete node.KT;

        if (node.C) {
            const katrainCommentStart = "Move";
            const katrainScoreStart = "Score: ";
            const katrainCommentEnd = "​";
            const katrainCommentEnd2 = "";
            //const katrainCommentEnd3 = "¤";
            const katrainCommentEnd3 = "¤";

            const katrainCommentStartIdx = node.C.indexOf(katrainCommentStart);
            const katrainScoreStartIdx = node.C.indexOf(katrainScoreStart);
            let katrainCommentEndIdx = node.C.lastIndexOf(katrainCommentEnd);
            let katrainCommentEnd2Idx = node.C.lastIndexOf(katrainCommentEnd2);
            let katrainCommentEnd3Idx = node.C.lastIndexOf(katrainCommentEnd3);
            //console.log('node has a comment ',katrainCommentStartIdx,katrainScoreStartIdx,katrainCommentEndIdx);
            //console.log('node has a comment ',(katrainCommentStartIdx >=0));
            //console.log('node has a comment ',(katrainScoreStartIdx >katrainCommentStartIdx));
            //console.log('node has a comment ',(katrainCommentEndIdx >katrainScoreStartIdx));
            //console.log('endings ', katrainCommentEndIdx, katrainCommentEnd2Idx, katrainCommentEnd3Idx);
            if (katrainCommentStartIdx >= 0 &&
                (katrainCommentEndIdx > katrainCommentStartIdx ||katrainCommentEnd2Idx > katrainCommentStartIdx ||katrainCommentEnd3Idx > katrainCommentStartIdx)) {
                // "Score: W+1.2\n"
                let endMaxIdx = Math.max(katrainCommentEndIdx,katrainCommentEnd2Idx,katrainCommentEnd3Idx);
                if(katrainScoreStartIdx > katrainCommentStartIdx && endMaxIdx > katrainScoreStartIdx) {
                    let scoreString = node.C.slice(katrainScoreStartIdx + katrainScoreStart.length, endMaxIdx);
                    scoreString = scoreString.slice(0, scoreString.indexOf("\n"));
                    //('scoreString #'+scoreString+'#');
                    let multiplier = 1;
                    if (0 === scoreString.indexOf("W")) multiplier = -1;
                    node.V = multiplier * parseFloat(scoreString.slice(1));
                }
                let newlineIdx = node.C.slice(endMaxIdx).indexOf("\n");
                if (newlineIdx >= 0 && newlineIdx < 4) {
                    endMaxIdx += newlineIdx;
                }

                node.C = node.C.slice(0, katrainCommentStartIdx) + node.C.slice(endMaxIdx + 1);
                //console.log('node.C #'+node.C+'#');
            }/* else if (katrainCommentStartIdx >= 0) {
                console.log('couldn t parse #'+node.C+'#', node);
            }*/

        }
        //console.log('cleanKatrainNode FINISHED');

    },

    download: function(filename, text) {
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    },

    // Start file download.
    //download("hello.txt","This is the content of my file :)");


    // everything from addedTree that is not already defined in masterTree will be added to masterTree
    merge: function(masterTree, addedTree, masterTreeNodeNextMoveIdx, addedTreeNodeNextMoveIdx) {
        //console.log('START merge ',masterTree, addedTree, masterTreeNodeNextMoveIdx, addedTreeNodeNextMoveIdx);

        const isMasterNextMoveInMasterNodes = masterTree && masterTree.nodes && masterTree.nodes.length && masterTree.nodes.length > masterTreeNodeNextMoveIdx;

        if(!addedTree || !addedTree.nodes || !addedTree.nodes.length) return;
        //console.log('the next node from addedTree is in nodes?  ', (addedTree && addedTree.nodes),')');

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
    },


    savePositionsAndContinue : function(OGSPositions, joseki_id, emptySGF, current_node, req, res, isLast) {

        if(OGSPositions) {
            const OGSNode = OGSPositions.filter(oneOGSmove => oneOGSmove.placement !== "root" && oneOGSmove.category && (oneOGSmove.category === "IDEAL" || oneOGSmove.category === "GOOD" ));
            if(OGSNode.length>1) {
                if(!current_node.sequences) {
                    current_node.sequences = [];
                }
                OGSNode.forEach(oneOGSmove => {
                    var newNode = { nodes : [], parent:current_node, sequences:[]};
                    if(isLast) newNode.nodes.push(sgfutils.makeNodeFromOGS(oneOGSmove));
                    else this.suck(oneOGSmove.node_id, emptySGF, newNode, req, res);
                });
            } else if(OGSNode.length === 1){
                const oneOGSmove = OGSNode[0];
                var newNode = current_node;
                if(isLast) newNode.nodes.push(sgfutils.makeNodeFromOGS(oneOGSmove));
                else this.suck(oneOGSmove.node_id, emptySGF, newNode, req, res);
            }
        }
        if(isLast) {
            res.send(sgf.generate(emptySGF));
            return;
        }
    },

    saveAndGetPositions : function(OGSNode, joseki_id, emptySGF, current_node, req, res, isLast) {
        currentNode.nodes.push(sgfutils.makeNodeFromOGS(cachedSGF));
        if(isLast) {
            res.send(sgf.generate(emptySGF));
            return;
        }
        Db.getOGSJoseki(joseki_id, 'Positions', (err, data) => {
            if (err) {
                res.status(500).send({
                    message:
                        err.message || "Some error occurred while retrieving players."
                });
                return;
            } else {
                if(data && data.length === 1) {
                    console.log('found cached Positions for '+joseki_id);
                    console.log('found cached data type '+typeof data[0]);
                    console.log('found cached data type '+JSON.stringify(data[0]));
                    console.log('found cached type '+typeof data[0].SGF);
                    console.log('cached SGF ###'+sgfutils.bin2String(data[0].SGF)+'###');
                    const cachedSGF = JSON.parse(sgfutils.bin2String(data[0].SGF));
                    console.log('Position  '+cachedSGF.description);
                    this.savePositionsAndContinue(cachedSGF, joseki_id, emptySGF, current_node, req, res, true);
                } else {
                    console.log('NO CACHED Position for '+joseki_id);
                    ogsAPI.getPositions( joseki_id, (queried) => {
                        //console.log('sucked ' , JSON.stringify(queried));
                        console.log('sucked ');
                        //const emptySGF = sgfutils.getEmptySGF();
                        //let currentNode = emptySGF.gameTrees[0];
                        if(queried.see_also) {
                            delete queried.see_also;
                        }
                        Db.setOGSJoseki(joseki_id, 'Positions', JSON.stringify(queried), (err, data) => {
                            console.log('stored ');
                            //Db.getJoseki(null, null, (err, data) => {
                            if (err)
                                res.status(500).send({
                                    message:
                                        err.message || "Some error occurred while posting joseki."
                                });
                            else {
                                //res.status(201).json(data);
                                /*currentNode.nodes.push(sgfutils.makeNodeFromOGS(queried))
                                if (isLast) {
                                    res.send(sgf.generate(emptySGF));
                                    return;
                                }*/
                                this.savePositionsAndContinue(queried, joseki_id, emptySGF, current_node, req, res, true);
                            }
                        });
                    });
                }
            }
        });
    },

    suck : function(joseki_id, emptySGF, current_node, req, res, isLast) {

        Db.getOGSJoseki(joseki_id, 'Position', (err, data) => {
            if (err) {
                res.status(500).send({
                    message:
                        err.message || "Some error occurred while retrieving players."
                });
                return;
            } else {
                if(data && data.length === 1) {
                    console.log('found cached Position for '+joseki_id);
                    console.log('found cached data type '+typeof data[0]);
                    console.log('found cached data type '+JSON.stringify(data[0]));
                    console.log('found cached type '+typeof data[0].SGF);
                    console.log('cached SGF ###'+sgfutils.bin2String(data[0].SGF)+'###');
                    const cachedSGF = JSON.parse(sgfutils.bin2String(data[0].SGF));
                    console.log('Position  '+cachedSGF.description);
                    this.saveAndGetPositions(cachedSGF, joseki_id, emptySGF, current_node, req, res, isLast);
                } else {
                    console.log('NO CACHED Position for '+joseki_id);
                    ogsAPI.getPosition( joseki_id, (queried) => {
                        //console.log('sucked ' , JSON.stringify(queried));
                        console.log('sucked ');
                        //const emptySGF = sgfutils.getEmptySGF();
                        //let currentNode = emptySGF.gameTrees[0];
                        if(queried.see_also) {
                            delete queried.see_also;
                        }
                        Db.setOGSJoseki(joseki_id, 'Position', JSON.stringify(queried), (err, data) => {
                            console.log('stored ');
                            //Db.getJoseki(null, null, (err, data) => {
                            if (err)
                                res.status(500).send({
                                    message:
                                        err.message || "Some error occurred while posting joseki."
                                });
                            else {
                                //res.status(201).json(data);
                                /*currentNode.nodes.push(sgfutils.makeNodeFromOGS(queried))
                                if (isLast) {
                                    res.send(sgf.generate(emptySGF));
                                    return;
                                }*/
                                this.saveAndGetPositions(queried, joseki_id, emptySGF, current_node, req, res, isLast);
                            }
                        });
                    });
                }
            }
        });
    },

    getAnalyzeAllowClause : function(color, candidateMoves) {
        if(!candidateMoves) return "";
        //allow PLAYER VERTEX,VERTEX,... UNTILDEPTH
        return " allow "+color+" "+candidateMoves.join(",")+" 1";
    },

    // currentMove is a string like "Move 10"
    getGTPCommand: function(SGFString, currentMove, candidateMoves, isFirstCommand, pAnalyzeColor, komi) {
        let currentMoveNumber = 10000;
        if(currentMove) {
            try{
                currentMoveNumber = parseInt(currentMove.split(" ")[1]);
                //console.log("will limit to currentMoveNumber");
            } catch(e) {
                //console.log("could not parse move currentMoveNumber")
            }
        }
        const SGFgame = sgf.parse(SGFString);
        let initCMD = "time_settings 0 5 1\nkomi "+(komi || 7.5)+"\nboardsize 19\nclear_board\n";
        let nodeIdx= 0;
        let nodeParent = SGFgame.gameTrees[0]
        let nodes = nodeParent.nodes;
        let lastNode = null;
        let cursorMoveNumber = 0;
        //console.log("game tree ",SGFgame.gameTrees[0])
        while (nodeIdx < nodes.length && cursorMoveNumber <= currentMoveNumber) {
            cursorMoveNumber++;
            //console.log("nodes.length ",nodes.length, nodes)
            lastNode = nodes[nodeIdx];
            initCMD += this.SGFToHuman(lastNode)+"\n";
            nodeIdx++;
            if(nodeIdx >= nodes.length && nodeParent.sequences && nodeParent.sequences.length && nodeParent.sequences[0].nodes) {
                nodeIdx = 0;
                nodeParent = nodeParent.sequences[0]
                nodes = nodeParent.nodes;
            }

        }
        //console.log("genmove after ",cursorMoveNumber, typeof lastNode.W !== "undefined", lastNode)
        const analyzeColor = pAnalyzeColor ? pAnalyzeColor : ((cursorMoveNumber<=1 || !lastNode || typeof lastNode.W !== "undefined")? "B" : "W" );
        if(!isFirstCommand) {
            initCMD = "";
        }
        const fullCmdWithAnalize = initCMD+"kata-analyze "+analyzeColor+" "+KATA_ANALYZE_TIME_MS/10;
        console.log("fullCmdWithAnalize ",fullCmdWithAnalize)
        return fullCmdWithAnalize+this.getAnalyzeAllowClause(analyzeColor, candidateMoves)+"\n";
    },

    //plays main variation until the end in WGo, and gets teh boardPosition
    getBoardFromSGF : function (parsedSGF, pUntilMove)  {
        let game = new WGo.Game();
        let untilMove = pUntilMove ? pUntilMove : 1000;
        //console.log(game)
        //game.play(4,4)
        //console.log(game.positionStack[game.positionStack.length-1].grid)
        let node = parsedSGF.gameTrees[0];
        let nodeIdx = 1;
        while(node && node.nodes.length>nodeIdx && untilMove) {
            const moveColor = typeof node.nodes[nodeIdx].B === "string" ? "B": "W";
            const moveCoords = this.sgfCoordToPoint(node.nodes[nodeIdx][moveColor])
            if (moveCoords && typeof moveCoords.x !== "undefined") {
                //console.log('playing ',moveCoords, 'from', node.nodes[nodeIdx], ' or '+moveColor+ ' in ', node.nodes[nodeIdx][moveColor]);
                game.play(moveCoords.x,moveCoords.y/*, moveColor === "B" ? WGo.B: WGo.W*/);
            } else {
                game.pass();
            }

            nodeIdx++;
            if(node.nodes.length>nodeIdx && node.sequences) {
                node = node.sequences[0];
                nodeIdx = 0;
            }
            untilMove --;
        }

        return game;
    },

    getBoardPositionFromSGF : function (parsedSGF, untilMove)  {
        const game = this.getBoardFromSGF(parsedSGF, untilMove)
        return game.positionStack[game.positionStack.length-1].grid;
    },

    getVisibleMovesFromGrid : function (grid, fromGrid) {
        const result = {
            B:[],
            W:[]
        }
        grid.forEach((value, index) => {
            if(!fromGrid || value !== fromGrid[index]) {
                if (value === WGo.Color.B) {
                    result.B.push(this.coordinatesFor(index % 19, (index - index % 19) / 19))
                } else if (value === WGo.Color.W) {
                    result.W.push(this.coordinatesFor(index % 19, (index - index % 19) / 19))
                } else {
                    // TODO handle stones that disappeared
                    // they can have been played also
                }
            }
        })
        return result;
    },

    getSGFFromVisibleMoves : async function (startSGF, visibleMoves, pEngine)  {
        const engine = (!pEngine || !pEngine.isEngineOn()) ? null: pEngine;
        let result = startSGF ? startSGF :'(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19])';
        result = result.slice(0, -1); // loose the closing ")"
        let blackMoves = visibleMoves.B;
        let whiteMoves = visibleMoves.W;
        const amountOfBlackMoves = blackMoves.length;
        const amountOfWhiteMoves = whiteMoves.length;
        const moveStatArchives = {};
        console.log('blackMoves: ',blackMoves);
        console.log('whiteMoves: ',whiteMoves);

        for (let movIdx = 0; movIdx < amountOfBlackMoves || movIdx < amountOfWhiteMoves; movIdx++) {
            console.log('move pair: '+movIdx, result+")");
            let chosenMove = "A1";
            let blackMoveSGF = "";
            if(movIdx < amountOfBlackMoves) {
                chosenMove = await this.chooseMoveAmong(result + ")", blackMoves, "B", moveStatArchives, movIdx, engine);
                if (chosenMove) {
                    blackMoveSGF = ";B[" + this.humanToSgfCoord(chosenMove) + "]";
                    if (engine && engine.isEngineOn()) {
                        if (engine.isEngineStarting()) {
                            console.log("B engine seems to be starting, lets wait ", engine.isFirstCommand);
                            await this.getRespFromEngine(engine, "\n", 10000);
                            console.log("B engine still starting?", engine.isEngineStarting(), " first command? ", engine.isFirstCommand);
                            // TODO reset engine to current boardstate
                            await this.getRespFromEngine(engine, this.getGTPCommand(result + ")", null, blackMoves, true), engine.isFirstCommand ? 10000 : null);
                        }
                        console.log("play B", chosenMove);
                        await this.getRespFromEngine(engine, "play B " + chosenMove + "\n", 25);

                    }
                } else {
                    movIdx --;
                    engine.isFirstCommand = true;
                }
            }
            if(chosenMove && movIdx < amountOfWhiteMoves) {
                chosenMove = await this.chooseMoveAmong(result+blackMoveSGF+")", whiteMoves, "W", moveStatArchives, movIdx, engine);
                if (chosenMove) {
                    result += blackMoveSGF+";W[" + this.humanToSgfCoord(chosenMove) + "]";
                    if (engine && engine.isEngineOn()) {
                        if (engine.isEngineStarting()) {
                            console.log("W engine seems to be starting, lets wait ", engine.isFirstCommand);
                            await this.getRespFromEngine(engine, "\n", 10000);
                            console.log("W engine still starting?", engine.isEngineStarting(), " first command? ", engine.isFirstCommand);
                            // TODO reset engine to current boardstate
                            await this.getRespFromEngine(engine, this.getGTPCommand(result + ")", null, whiteMoves, true), engine.isFirstCommand ? 10000 : null);
                        }
                        console.log("play W", chosenMove);
                        await this.getRespFromEngine(engine, "play W " + chosenMove + "\n", 25);
                    }
                } else {
                    movIdx --;
                    engine.isFirstCommand = true;
                }
            }
        }
        //console.log('RETURN SGF!!!!!!!!!!!!!!!!!!!');
        return result+")";
    },

    /*
    avoidMoves (list of dicts): Optional. Prohibit the search from exploring the specified moves for the specified player, until a certain number of ply deep in the search. Each dict must contain these fields:
        player - the player to prohibit, "B" or "W".
        moves - an array of move locations to prohibit, such as ["C3","Q4","pass"]
        untilDepth - a positive integer, indicating the ply such that moves are prohibited before that ply.
    Multiple dicts can specify different untilDepth for different sets of moves. The behavior is unspecified if a move is specified more than once with different untilDepth.

    allowMoves (list of dicts): Optional. Same as avoidMoves except prohibits all moves EXCEPT the moves specified. Currently, the list of dicts must also be length 1.

    allow PLAYER VERTEX,VERTEX,... UNTILDEPTH

    kata-analyze B 70 allow B Q16,Q17 1
     */
    chooseMoveAmong : async function (SGFBeforeMove, candidateMoves, color, moveStatArchives, movIdx, engine)  {
        //console.log('chooseMoveAmong START '+color);
        let chosenMoveIdx = movIdx;
        if (engine && engine.isEngineOn()) {
            //console.log('chooseMoveAmong ENGINE OK ',candidateMoves, engine.isFirstCommand);
            const engineRest = await this.getRespFromEngine(engine,this.getGTPCommand(SGFBeforeMove, null, candidateMoves, engine.isFirstCommand), engine.isFirstCommand ? 10000 : null)
            //console.log('chooseMoveAmong engine RESPONDED ', engine.isFirstCommand/*,engine.engineResHolder[0]*/);
            // choose move
            const evaluations = this.parseSuggestions(engineRest, candidateMoves, color)
            console.log('chooseMoveAmong engine Evaluated ',evaluations);
            if(!evaluations || !evaluations.possibleMoves) return null;
            chosenMoveIdx = this.getChosenMoveIdx(evaluations, candidateMoves);

        } else {
            console.log('chooseMoveAmong NO ENGINE !!!!!!!!! ',engine);
        }
        //console.log('chooseMoveAmong END '+color, chosenMoveIdx);
        return candidateMoves[chosenMoveIdx];
    },
    getEvaluations : async function (SGFBeforeMove, candidateMoves, color, engine, limit, komi)  {
        //console.log('getEvaluations START '+color);
        if (engine && engine.isEngineOn()) {
            //console.log('getEvaluations ENGINE OK ',candidateMoves, engine.isFirstCommand);
            const engineRest = await this.getRespFromEngine(engine,this.getGTPCommand(SGFBeforeMove, null, candidateMoves, engine.isFirstCommand, color, komi), engine.isFirstCommand ? 10000 : null)
            //console.log('getEvaluations engine RESPONDED ', engine.isFirstCommand/*,engine.engineResHolder[0]*/);
            // choose move
            const evaluations = this.parseSuggestions(engineRest, candidateMoves, color, limit)
            //console.log('getEvaluations engine Evaluated ',evaluations);
            if(!evaluations || !evaluations.possibleMoves) return null;
            return evaluations;

        } else {
            console.log('getEvaluations NO ENGINE !!!!!!!!! ',engine);
        }
        //console.log('getEvaluations END '+color, chosenMoveIdx);
        return null;
    },

    getRespFromEngineAfter2Seconds : function (engine, delay, cmd) {
        return new Promise((resolve) => {
            setTimeout(() => {
                engine.getStdin().write("\n");

                //console.log('done getRespFromEngineAfter', delay || KATA_ANALYZE_TIME_MS, cmd);
                resolve(engine.engineResHolder[0]);
            }, delay || KATA_ANALYZE_TIME_MS+80);
        });
    },

    getRespFromEngine : async function (engine, cmd, delay) {
        //console.log('calling ', cmd);
        engine.engineResHolder[0] = '';
        engine.getStdin().write(cmd);
        engine.engineResHolder[0] = '';
        //console.log('CLEAR resp buffer after calling ', cmd);
        engine.isFirstCommand = false;
        const result = await this.getRespFromEngineAfter2Seconds(engine, delay, cmd);
        //console.log(result);
        return result;
    },

    getChosenMoveIdx : function (evaluations, candidateMoves, defaultResult) {
        let result = typeof defaultResult === "undefined" ? -1 : defaultResult;
        evaluations.possibleMoves.forEach(oneEval => {
            if(result === -1 || evaluations.moveScores[oneEval]>evaluations.moveScores[candidateMoves[result]]) {
                //console.log(evaluations.moveScores[oneEval]+ " better than "+evaluations.moveScores[candidateMoves[result]]);
                //console.log(oneEval+ " better than "+(result === -1  ? -1 : candidateMoves[result]));
                result = candidateMoves.indexOf(oneEval);
            }
        });
        return result;
    },

    parseSuggestions : function (pResponse, candidateMoves, color, limit) {
        const result = {
            bestMoveScore : -1000,
            possibleMoves : [],
            moveScores : {}
        };
        if(pResponse && typeof pResponse === "string" && pResponse.indexOf('info move') >= 0) {
            let response;
            if(pResponse.indexOf('order 0 ')>=0) {
                response = pResponse.substring(pResponse.lastIndexOf('info move', pResponse.lastIndexOf('order 0 ')));
            } else {
                response = pResponse;
            }
            //console.log("parseSuggestions ",response);
            //overlay_goban.clearCanvas();
            const lastResponse = response.split('info move ');
            //console.log('a) ignore ', lastResponse && lastResponse[0]);
            lastResponse.splice(0,1);

            //console.log('response[0]' , response[0]);
            // console.log('lastResponse[0]' , lastResponse[0]);
            //console.log('lastResponse[1]' , lastResponse[1]);
            let bestMoveScore = -1000;
            //let maxMoveSuggestions = 20;
            let maxMoveSuggestions = 400;

            //let kataMoveSet = firstResponse[firstResponse.length-1];
            for(let moveIdx = 0; moveIdx < lastResponse.length && maxMoveSuggestions >0; moveIdx++){
                const moveSetInfo = lastResponse[moveIdx].split(' ');
                const kataMove = moveSetInfo[0];
                const scoreIdx = moveSetInfo.indexOf('scoreMean');
                if(scoreIdx > 0 && (!candidateMoves || candidateMoves.indexOf(kataMove) >-1)) {
                    //console.log('parsing '+moveSetInfo[scoreIdx+1])
                    const scoreMean = parseFloat(moveSetInfo[scoreIdx+1]);
                    //console.log('move ',moveIdx, ' score at ',scoreIdx );
                    if(bestMoveScore < scoreMean) {
                        bestMoveScore = scoreMean;
                    }

                    maxMoveSuggestions--;
                    //const kataPoint = this.humanToPoint(kataMove);
                    //isRenderedOnce = true;
                    //overlay_goban.drawCircle(kataPoint.x, kataPoint.y, color, scoreMean);
                    result.bestMoveScore = bestMoveScore;
                    if(result.possibleMoves.indexOf(kataMove) === -1) {
                        result.possibleMoves.push(kataMove);
                    }
                    result.moveScores[kataMove] = scoreMean;

                } else {
                    console.log('B) ignore ', moveSetInfo);
                }
            }
            // sort result.moveScores by score desc
            result.bestMoves = result.possibleMoves
                .map(a => ({ move: a, value: result.moveScores[a] }))
                .sort((a, b) => b.value - a.value)
            if(limit){
                result.bestMoves = result.bestMoves.slice(0,limit);
            }
        } else {
            //console.log('not renderable ', response);
            console.log('not renderable ',pResponse);
        }
        return result;
    }

};
