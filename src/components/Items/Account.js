import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FunctionsIcon from '@mui/icons-material/Functions';
import EditIcon from "@mui/icons-material/Edit";
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import {Grid, Switch} from "@mui/material";
import {DragDropContext, Draggable, Droppable} from "react-beautiful-dnd";
import {Asset} from "./Asset/Asset";
import AuthStore from "../../Stores/AuthStore";
import {AssetsTotal} from "./AssetsTotal";
import {useEffect, useState} from "react";
import Button from "@mui/material/Button";
import {TextFieldEditDialog} from "../Dialogs/TextFieldEditDialog";
import {AssetEditDialog} from "../Dialogs/AssetEditDialog";
import ToggleButton from "@mui/material/ToggleButton";


export const Account = ({account, assets, exchangeRates, handleDragDropAssets,
                            onEditAccount, onDeleteAccount, onShowAccountOperations,
                            onAddAsset, onEditAsset, onDeleteAsset, onAssetVisibilityChange}) => {

    const [switched, setSwitched]=useState(false)
    const [editAssetDialog, setEditAssetDialog]=useState(false)
    const [editMode, setEditMode] = useState(false)
    const [assetData, setAssetData] = useState();

    useEffect(() => {
        setSwitched(account.switched)
    }, [account]);
    const handleSwitchChange = (event) => {
        //console.log(event.target.checked);
        setSwitched(!account.switched)
        onEditAccount(account.id,"switched", event.target.checked)
//        account.switched= event.target.checked;
    };

    const handleEditAsset = async (asset) => {
        await setAssetData({
            id: asset.id,
            title: asset.title,
            currencyId:  asset.currency,
            amount: asset.amount,
            comment: asset.comment
        });
        await setEditAssetDialog(true)

    };
    const handleCloseEditAssetDialog = (confirmed, assetData, deleteAsset) => {
        if (confirmed) {
            if (deleteAsset) onDeleteAsset(assetData)
            else {
                if (assetData.id) onEditAsset(assetData);
                else onAddAsset(account.id, assetData);
            }
        }
        setEditAssetDialog(false)
    };
    const accountUsersNames = (usersIds)=>{
        if (usersIds.length<=1) return "";
        let s= "("; //" ("+usersIds.length+": ";
        for (let i = 0; i < usersIds.length; i++) {
            s += AuthStore.getUserName(usersIds[i]);
            s += i < usersIds.length-1 ? ", " : ")";
        }
        return s;
    }
    return (
        <Box className="verticalContainer alignCenter">
            <AssetEditDialog
                assetEditDialogTitle="Edit asset data"
                // assetEditDialogDescription={`New asset will be added into "${account.title}" account`}
                currencies={AuthStore.currencies}
                initialAssetData={assetData}
                open={editAssetDialog}
                onClose={handleCloseEditAssetDialog}
                />
            <Accordion sx = {{width: "95%"}} >
                <AccordionSummary expandIcon = {<ExpandMoreIcon/>}>
                    <Grid container direction="row" item >
                        <Grid item xs direction="column" variant = "overline">
                            <Box className="verticalContainer" sx={{gap:0, p:0}}>
                                <Typography variant = "overline" sx = {{fontWeight: 700,  lineHeight:1.8}}
                                            onClick={()=>onShowAccountOperations(account.id)}
                                >
                                    {account.title}:
                                </Typography>
                                <Typography variant = "body2" sx = {{fontWeight: 300, lineHeight:1}}>
                                    {accountUsersNames(account.users)}
                                </Typography>
                            </Box>
                        </Grid>
                        {account.switched?
                        <Grid item xs direction="row" variant = "overline"
                              style={{display: "flex",justifyContent: "flex-end",alignItems:"center"}}>
                            <AssetsTotal assets={assets} exchangeRates={exchangeRates}/>
                        </Grid>:null}
                    </Grid>
                </AccordionSummary>
                <AccordionDetails  sx={{ maxHeight: "50vh", overflowY: "scroll" }}>
                    {assets.map((asset, index) => (
                        <Asset asset = {asset} editMode={editMode}
                               onEditAsset={handleEditAsset}
                               onVisibilityChange={onAssetVisibilityChange}
                        />
                    ))}



                    <Box className="horisontalContainer" sx ={{justifyContent :"space-between"}}>
                        <IconButton  size = "medium" color = "info"  variant="outlined"
                                     onClick={()=>handleEditAsset({
                                         title: "",
                                         currency:  "USD",
                                         amount: 0,
                                         comment: ""
                                     })}>
                            <AddCircleIcon/>
                        </IconButton>
                        <Box className="horisontalContainer" sx ={{justifyContent :"right" }}>
                            {editMode && <IconButton aria-label = "delete" size = "medium" color = "error"
                                        onClick={()=>onDeleteAccount(account.id)}>
                                <DeleteIcon />
                            </IconButton>}
                            <ToggleButton aria-label = "edit" size = "medium" color = "info"  variant="outlined"
                                          selected={editMode}
                                          value={editMode}
                                          onClick={()=>setEditMode(!editMode)}>
                                <EditIcon />
                            </ToggleButton>
                            <Switch checked={switched} onChange={handleSwitchChange}/>
                        </Box>
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};
