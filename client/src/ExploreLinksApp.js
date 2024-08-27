import Folder from "./components/Folder";
import { useState, useEffect } from 'react';

//import "./assets/.css";

const explorer = {
    "title": "",
    "links": [
        {
            "title": "Most common joseki starts:",
            "links": [
                {
                    "name": "Hoshi",
                    "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd])"
                }, {
                    "name": "Hoshi approached low",
                    "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd];W[qf])"
                }, {
                    "name": "San San invasion",
                    "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd];W[qc])"
                }, {
                    "name": "Komoku approached high",
                    "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[qd];W[od])"
                }, {
                    "name": "Komoku approached low",
                    "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[qd];W[oc])"
                }
            ]
        }, {
            "title": "Approach an already extended corner:",
            "links": [
                {
                    "name": "hoshi keima shimari",
                    "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd];W[];B[nc])"
                }, {
                    "name": "hoshi ogeima shimari",
                    "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[pd];W[];B[mc])"
                }, {
                    "name": "komoku keima shimari",
                    "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[qd];W[];B[oc])"
                }, {
                    "name": "komoku ogeima shimari",
                    "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[qd];W[];B[nc])"
                }, {
                    "name": "komoku ikentobi shimari",
                    "sgf": "(;GM[1]FF[4]CA[UTF-8]KM[7.5]SZ[19];B[qd];W[];B[nd])"
                }
            ]
        }
    ]
};
/*export const explorer = {
    name: "root",
    isFolder: true,
    items: [
        {
            name: "public",
            isFolder: true,
            items: [
                {
                    name: "index.html",
                    isFolder: false
                }
            ]
        },
        {
            name: "src",
            isFolder: true,
            items: [
                {
                    name: "data",
                    isFolder: true,
                    items: [
                        {
                            name: "folderData.js",
                            isFolder: false
                        }
                    ]
                },
                {
                    name: "App.js",
                    isFolder: false
                },
                {
                    name: "index.js",
                    isFolder: false
                },
                {
                    name: "styles.css",
                    isFolder: false
                }
            ]
        },
        {
            name: "package.json",
            isFolder: false
        }
    ]
};
*/


export default function ExploreLinksApp( {onLinkClick}) {
    const [fileStructure, setFileStructure] = useState(explorer);
    const [isEdited, setIsEdited] = useState(true);

    useEffect(() => {
        const handleEvent = e => {
            if (e.detail) {
                setFileStructure(e.detail);
            } else {
                setIsEdited(e.isEdited)
            }
        }

        document.addEventListener('setReactState', handleEvent);
        return () => {
            document.removeEventListener('setReactState', handleEvent);
        }
    }, []);

    return <Folder explorer={fileStructure} onLinkClick={onLinkClick} isEdited={isEdited}/>;
}
