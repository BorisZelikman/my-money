import React from "react";
import Typography from "@mui/material/Typography";

export const Asset = ({asset}) => {
    return (
        <React.Fragment>
            <Typography align = "center" variant = "h6" key = {asset.id}>
                {asset.name}
                <br/>
                <Typography align = "center" variant = "overline">
                    {asset.currencyId}: {asset.amount}
                </Typography>
            </Typography>
        </React.Fragment>
    );
};
