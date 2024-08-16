import { useState } from "react";
import { GoFileDirectoryFill, GoFileSymlinkFile } from "react-icons/go";
const Folder = ({ explorer, onLinkClick }) => {
        const [expand, setExpand] = useState(false);
    if (typeof explorer.title !== "undefined") {
        return (
            <div>
                <GoFileDirectoryFill />
                <span
                    style={{
                        cursor: "pointer",
                        paddingLeft: "5px"
                    }}
                    onClick={() => setExpand(!expand)}
                >
          {explorer.title}
                    <br />
        </span>
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
                                <Folder key={idx} explorer={exp} onLinkClick={onLinkClick}/>
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
                {explorer.name}
                <br />
            </div>
        );
    }
};

export default Folder;
