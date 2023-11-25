import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import {getCurrencySymbol} from "../../data/currencyMethods";
import AuthStore from "../../Stores/AuthStore";

export const AssetSelect = ({caption, assets, currentAssetId, handleAssetChange, showAllAssets}) => {
    if (Array.isArray(assets)) return (
        <FormControl sx={{p:0}} fullWidth variant="outlined" size="small">
            <InputLabel htmlFor="select">{caption}</InputLabel>
            <Select className="input-field"
                onChange={handleAssetChange}
                label={caption}
                inputProps={{name: "select"}}
                value={currentAssetId || ""}
            >
                {showAllAssets?<MenuItem value="All Assets">All Assets</MenuItem>:null}

                {assets.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                        {a.title} ({a.amount.toFixed(2)} {getCurrencySymbol(AuthStore.currencies, a.currency)})
                    </MenuItem>
                ))}
            </Select>
        </FormControl>)
    else return null;
}
