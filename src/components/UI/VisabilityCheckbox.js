import React, {useEffect, useState} from 'react';
import Checkbox from '@mui/material/Checkbox';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const VisibilityCheckbox = ({isHide, onChange}) => {
    const [isVisible, setIsVisible] = useState(true);

    const toggleVisibility = async() => {
//        await setIsVisible(!isVisible);
        onChange(!isVisible)
    };
    useEffect(() => {
        if (isHide===undefined) return
        setIsVisible(!isHide)
    }, [isHide]);

    return (
        <div>
            <Checkbox
                checked={isVisible}
                onChange={toggleVisibility}
                icon={<VisibilityOffIcon />} // Icon when unchecked
                checkedIcon={<VisibilityIcon />} // Icon when checked
            />

        </div>
    );
};

export default VisibilityCheckbox;
