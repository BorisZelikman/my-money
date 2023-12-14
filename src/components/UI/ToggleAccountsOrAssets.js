import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import SupervisedUserCircleIcon from "@mui/icons-material/SupervisedUserCircle";
import WalletIcon from "@mui/icons-material/Wallet";

export const ToggleAccountsOrAssets = ({value, onToggle}) => {
    return (
        <ToggleButtonGroup   value={value} sx = {{my: 1}}>
            <ToggleButton value = "Accounts" sx={{py:1}}
                          onClick={()=>onToggle("Accounts")}>
                <SupervisedUserCircleIcon sx={value==="Accounts"?{mr:1, color:"#1976d2"}:{mr:1}}/>
                Accounts</ToggleButton>
            <ToggleButton value = "Assets" sx={{py:1}}
                          onClick={()=>onToggle("Assets")}>
                <WalletIcon sx={value==="Assets"?{mr:1, color:"#1976d2"}:{mr:1}}/>
                Assets</ToggleButton>
        </ToggleButtonGroup>
    )
}