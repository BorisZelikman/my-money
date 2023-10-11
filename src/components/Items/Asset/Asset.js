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
import {Grid} from "@mui/material";

export const Asset = ({asset}) => {
    return (
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            minWidth: "200px",
        }}>
            <Accordion sx = {{width: "95%"}}>
                <AccordionSummary expandIcon = {<ExpandMoreIcon/>}>
                    <Grid container direction="row" item xs={12} >

                        <Grid item xs direction="column" variant = "overline"
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems:"flex-start",
                            }}
                        >
                            <Typography variant = "overline" sx = {{fontWeight: 700}}>
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
