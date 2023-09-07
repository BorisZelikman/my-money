import React from "react";
import Typography from "@mui/material/Typography";

export const Asset = ({active}) => {
    return (
        <React.Fragment>
            <Typography align = "center" variant = "h6" key = {active.id}>
                {active.name}
                <br/>
                <Typography align = "center" variant = "overline">
                    {active.currencyId}: {active.amount}
                </Typography>
            </Typography>
        </React.Fragment>
    );
};
