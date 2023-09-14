import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

export const AssetSelect = ({currentAssetId, handleAssetChange, assets}) => (
    <Select
        onChange = {handleAssetChange}
        sx = {{
            marginTop: 2,
            width: 300
        }}
        value = {currentAssetId || ""}
    >
        {assets.map((a) => (
            <MenuItem key = {a.id} value = {a.id}>
                {a.title} ({a.amount} {a.currency})
            </MenuItem>
        ))}
    </Select>
);
