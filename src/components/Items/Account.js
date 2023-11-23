import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {Grid} from "@mui/material";
import {DragDropContext, Draggable, Droppable} from "react-beautiful-dnd";
import {Asset} from "./Asset/Asset";
import {getCurrencySymbol} from "../../data/currencyMethods";
import AuthStore from "../../Stores/AuthStore";
import {AssetsTotal} from "./AssetsTotal";
import {CurrencySelector} from "./CurrencySelector";
import {useEffect} from "react";


export const Account = ({account, assets, exchangeRates, handleDragDropAssets}) => {

    return (
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: "200px",
        }}>
            <Accordion sx = {{width: "95%"}} >
                <AccordionSummary expandIcon = {<ExpandMoreIcon/>}>
                    <Grid container direction="row" item >

                        <Grid item xs direction="column" variant = "overline"
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems:"flex-start",
                            }}
                        >
                            <Typography variant = "overline" sx = {{fontWeight: 700}}>
                                {account.title}:
                            </Typography>
                        </Grid>
                        <Grid item xs direction="row" variant = "overline"
                              style={{display: "flex",justifyContent: "flex-end",alignItems:"center"}}>
                            <AssetsTotal assets={assets} exchangeRates={exchangeRates}/>
                        </Grid>
                    </Grid>
                </AccordionSummary>
                <AccordionDetails>
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

                    <Box sx = {{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-evenly"
                    }}>


                                <IconButton aria-label = "edit" size = "small" color = "info">
                            <EditIcon fontSize = "inherit"/>
                        </IconButton>
                        <IconButton aria-label = "delete" size = "small" color = "error">
                            <DeleteIcon fontSize = "inherit"/>
                        </IconButton>
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};
