import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

export const AssetSelector = (assets, selectId, label, handleAssetChange) => {
    if (Array.isArray(assets)) {
        return (
            <Select
                onChange = {handleAssetChange}
                sx = {{
                    marginTop: 2,
                    width: 300
                }}
                value = {selectId}
                label = {label}
            >
                {assets.map((a) => (
                    <MenuItem value = {a.id}>
                        {a.title} ({a.amount} {a.currency})
                    </MenuItem>
                ))}
            </Select>
        );
    } else {
        return null;
    }
};
