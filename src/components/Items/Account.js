import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from "@mui/icons-material/Edit";
import {Grid, Switch} from "@mui/material";
import {DragDropContext, Draggable, Droppable} from "react-beautiful-dnd";
import {Asset} from "./Asset/Asset";
import {getCurrencySymbol} from "../../data/currencyMethods";
import AuthStore from "../../Stores/AuthStore";
import {AssetsTotal} from "./AssetsTotal";
import {CurrencySelector} from "./CurrencySelector";
import {useEffect, useState} from "react";
import Button from "@mui/material/Button";


export const Account = ({account, assets, exchangeRates, handleDragDropAssets, onAccountChange}) => {
    const [switched, setSwitched]=useState(false)
    useEffect(() => {
        setSwitched(account.switched)
    }, [account]);
    const handleSwitchChange = (event) => {
        //console.log(event.target.checked);
        setSwitched(!account.switched)
        onAccountChange(account.id,"switched", event.target.checked)
//        account.switched= event.target.checked;
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
            <Accordion sx = {{width: "95%"}} >
                <AccordionSummary expandIcon = {<ExpandMoreIcon/>}>
                    <Grid container direction="row" item >
                        <Grid item xs direction="column" variant = "overline">
                            <Box className="verticalContainer" sx={{gap:0, p:0}}>
                                <Typography variant = "overline" sx = {{fontWeight: 700,  lineHeight:1.8}}>
                                    {account.title}:
                                </Typography>
                                <Typography variant = "body2" sx = {{fontWeight: 300, lineHeight:1}}>
                                    {accountUsersNames(account.users)}:
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
                        <Asset asset = {asset}/>
                    ))}
                    {/*<DragDropContext onDragEnd={handleDragDropAssets}>*/}

                    {/*    <Droppable droppableId="ASSETS" type="group">*/}
                    {/*        {(provided) => (*/}
                    {/*            <Box className="assetBox" {...provided.droppableProps} ref={provided.innerRef}>*/}
                    {/*                {assets.map((asset, index) => (*/}
                    {/*                    <Draggable*/}
                    {/*                        draggableId={asset.id}*/}
                    {/*                        index={index}*/}
                    {/*                        key={asset.id}*/}
                    {/*                    >*/}
                    {/*                        {(provided) => (*/}
                    {/*                            <div*/}
                    {/*                                {...provided.dragHandleProps}*/}
                    {/*                                {...provided.draggableProps}*/}
                    {/*                                ref={provided.innerRef}*/}
                    {/*                            >*/}
                    {/*                                <Asset asset = {asset}/>*/}
                    {/*                            </div>*/}
                    {/*                        )}*/}
                    {/*                    </Draggable>*/}
                    {/*                ))}*/}
                    {/*                {provided.placeholder}*/}
                    {/*            </Box>*/}
                    {/*        )}*/}
                    {/*    </Droppable>*/}
                    {/*</DragDropContext>*/}

                    <Box className="horisontalContainer" sx ={{justifyContent :"space-between" }}>
                        <IconButton aria-label = "edit" size = "medium" color = "info"  variant="outlined">
                            <EditIcon />
                        </IconButton>
                        <IconButton aria-label = "delete" size = "medium" color = "error">
                            <DeleteIcon />
                        </IconButton>
                        <Button ><VisibilityIcon /></Button>
                        <Switch checked={switched} onChange={handleSwitchChange}/>
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};
