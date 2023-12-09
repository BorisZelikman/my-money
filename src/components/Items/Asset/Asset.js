import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import {getCurrencySymbol} from "../../../data/currencyMethods";
import AuthStore from "../../../Stores/AuthStore";
import {Grid, Switch} from "@mui/material";
import VisibilityCheckbox from "../../UI/VisabilityCheckbox";

export const Asset = ({asset, editMode, onEditAsset, onVisibilityChange}) => {
    const handleVisibilityChange=(isVisible)=>{
        onVisibilityChange(asset.id, isVisible)
    }
    return (
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: "200px",
            backgroundColor:"white",
            pl:1
        }}>
            <Grid container direction="row" item >

                <Grid item xs direction="row" variant = "overline"
                    style={{
                        display: "flex",
                        justifyContent: "left",
                        alignItems:"center",
                    }}
                >
                    {editMode && <IconButton color="warning" sx={{p:1.1}}
                                             onClick={()=>onEditAsset(asset)}
                    >
                        <EditIcon />
                    </IconButton>}
                    {!editMode && <VisibilityCheckbox
                        sx={{mr:0, p:0, backgroundColor:"red"}}
                        isHide={asset.isHide}
                        onChange={handleVisibilityChange}/>}

                    <Typography variant = "overline" sx = {{fontWeight: 700, alignSelf:"center"}}>
                        {asset.title}:
                    </Typography>
                </Grid>

                <Grid item xs direction="row" variant = "overline"
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems:"center",
                    }}
                >
                    <Typography >
                        {asset.amount.toFixed(2)}
                    </Typography>
                    <Typography sx = {{ml:1, mr: 1, fontWeight: 500,  border: "1px solid black",
                         width:"13px",
                        // height:"20px",
                         textAlign:"center",
                        // justifyContent:"center",
                        px:"5px",
                        borderRadius: "50%"}}>
                        {getCurrencySymbol(AuthStore.currencies, asset.currency)}
                    </Typography>

                </Grid>
            </Grid>
        </Box>
    );
};
