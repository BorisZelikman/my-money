import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

export const Asset = ({asset}) => {
    return (
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: "200px"
        }}>
            <Accordion sx = {{width: "95%"}}>
                <AccordionSummary expandIcon = {<ExpandMoreIcon/>}>
                    <div>
                    <Typography variant = "overline"
                                sx = {{
                                    display:"inline",
                                    flexDirection: "column",
                                    fontSize:16,
                                    fontWeight: 900,
                                    lineHeight: 0.5,
                                    marginRight:"10px"
                                }}>
                        {asset.title}
                    </Typography>
                    <Typography variant = "overline" >
                        {asset.amount.toFixed(2)} {asset.currency}
                    </Typography>
                    </div>
                </AccordionSummary>
                <AccordionDetails>
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
