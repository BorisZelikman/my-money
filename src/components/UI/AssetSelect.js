import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

export const AssetSelect = ({caption, assets, currentAssetId, handleAssetChange}) => {
    if (Array.isArray(assets)) return (
        <FormControl fullWidth variant="outlined">
            <InputLabel htmlFor="select">{caption}</InputLabel>
            <Select
                onChange={handleAssetChange}
                label={caption}
                sx={{width: "100%"}}
                inputProps={{name: "select"}}
                value={currentAssetId || ""}
            >
                {assets.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                        {a.title} ({a.amount} {a.currency})
                    </MenuItem>
                ))}
            </Select>
        </FormControl>)
    else return null;
}
