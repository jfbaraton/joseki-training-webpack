import { testData, explorer } from './utils/testData';
import FolderTree from './components/FolderTree/FolderTree';
import {useEffect, useState} from "react";
//import 'react-folder-tree/dist/style.css';

export default function ExploreLinksApp2({onLinkClick}) {
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

    return (
        <FolderTree
            data={ fileStructure }
            onNameClick={onLinkClick}
            readOnly={!isEdited}
        />

    );
};