//const fs = require("fs");
//import file1 from './test/1_hoshi_KGD_WR_clean.sgf';
import file1 from '!raw-loader!./test/1_hoshi_KGD_WR_clean.sgf';
//const exampleSGF = String.raw`(;GM[1]FF[4]CA[UTF-8]AP[Sabaki:0.51.1]KM[7.5]SZ[19]DT[2022-12-08];B[pd];W[qc];B[qd];W[pc];B[oc];W[ob];B[nc])`;
//const exampleSGF = fs.readFileSync("/Users/jeff/Documents/POCs/joseki-training-webpack/client/src/test/1_hoshi_KGD_WR_clean.sgf").toString();
//const exampleSGF = fs.readFileSync(logo).toString();
const exampleSGF = file1.toString();
export default exampleSGF;