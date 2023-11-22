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


export const Account = ({account, assets}) => {
    console.log(account)
    console.log(assets)


    return (
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: "200px",
            backgroundColor: "red"
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
                    </Grid>
                </AccordionSummary>
                <AccordionDetails>
                    <DragDropContext >

                        <Droppable droppableId="ROOT" type="group">
                            {(provided) => (
                                <Box className="assetBox" {...provided.droppableProps} ref={provided.innerRef}>
                                    {assets.map((asset, index) => (
                                        <Draggable
                                            draggableId={asset.id}
                                            index={index}
                                            key={asset.id}
                                        >
                                            {(provided) => (
                                                <div
                                                    {...provided.dragHandleProps}
                                                    {...provided.draggableProps}
                                                    ref={provided.innerRef}
                                                >
                                                    <Asset asset = {asset}/>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </Box>
                            )}
                        </Droppable>
                    </DragDropContext>

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
