import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LocalGroceryStoreOutlinedIcon from '@mui/icons-material/LocalGroceryStoreOutlined';
import SocialDistanceOutlinedIcon from '@mui/icons-material/SocialDistanceOutlined';
export const TogglePurpose = ({currentPurpose, purposes, onPurposeChange}) => {
console.log(currentPurpose)
    return (
        <ToggleButtonGroup
            color="standard"
            value={currentPurpose}
            exclusive
            onChange={(event)=>onPurposeChange (event.target.value)}
            aria-label="Platform"
            sx={{my: 1}}
        >
            {purposes?.map(purpose => (
                <ToggleButton value={purpose.id} sx={{py: 1}}>
                    <div onClick={() => onPurposeChange(purpose.id)}>
                        {purpose.icon === "bin" && <LocalGroceryStoreOutlinedIcon />}
                        {purpose.icon === "home" && <HomeOutlinedIcon />}
                        {purpose.icon === "arrows" && <SocialDistanceOutlinedIcon />}
                    </div>
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    )
};
