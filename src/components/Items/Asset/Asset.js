import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {getCurrencySymbol} from "../../../data/currencyMethods";
import AuthStore from "../../../Stores/AuthStore";
import {Grid, Switch} from "@mui/material";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import {CheckBox} from "@mui/icons-material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
export const Asset = ({asset, editMode, onEditAsset}) => {
    return (
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: "200px",
            backgroundColor:"light",
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
                            {editMode && <IconButton color="info" sx={{mr:1, p:0.2}}
                                                     onClick={()=>onEditAsset(asset)}
                            >
                                <EditIcon />
                            </IconButton>}
                            {/*{editMode && <Switch size="small" />}*/}

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
