import { useState } from "react";
import { GoFileDirectoryFill, GoFileSymlinkFile } from "react-icons/go";
import { FaTrashAlt } from "react-icons/fa";
import { IoIosAddCircle } from "react-icons/io";
import { MdEdit } from "react-icons/md";
import EdiText from 'react-editext';




const Folder = ({ explorer, onLinkClick, isEdited }) => {
        const [expand, setExpand] = useState(false);
    if (typeof explorer.title !== "undefined") {
        return (
            <div>

                <div
                    style={{
                        display: "flex",
                        cursor: "pointer",
                        paddingLeft: "5px"
                    }}
                    onClick={() => setExpand(!expand)}
                >
                    <GoFileDirectoryFill />
                    {isEdited && editableName(explorer, "title")}
                    {!isEdited && explorer.title}
                    {isEdited && <IoIosAddCircle />}
                </div>
                <div
                    style={{
                        display: (!explorer.title || expand) ? "block" : "none",
                        paddingLeft: "15px",
                        cursor: "pointer"
                    }}
                >
                    {" "}
                    {explorer.links.map((exp, idx) => {
                        return (
                            <>
                                <Folder key={explorer.title+idx} explorer={exp} onLinkClick={onLinkClick} isEdited={isEdited}/>
                            </>
                        );
                    })}
                </div>
            </div>
        );
    } else {
        return (
            <div
                style={{
                    cursor: "default",
                    paddingLeft: "5px"
                }}
                onClick={ () => {
                    //console.log("in file, setPath");
                    localStorage.setItem("startPath", explorer.sgf);
                    if (onLinkClick) {
                        onLinkClick();
                    }
                }
                }
            >
                <GoFileSymlinkFile />
                {"  "+explorer.name}
                <br />
            </div>
        );
    }
};

function editableName(folder, fieldName) {
    const handleSave = (val) => {
        console.log('Edited Value -> ', val);
        folder[fieldName] = val;
    };
    return (<>
        <EdiText
            type="text"
            value={folder[fieldName]}
            onSave={handleSave} showButtonsOnHover
        />{" "}<FaTrashAlt />
        </>);

}
function editableNameOLD(name) {
    return (<>
        {name}{" "}<MdEdit />{" "}<FaTrashAlt />
        </>);
}

export default Folder;
