import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import "./Active.css";

export const Active = ({asset}) => {
    return (
        <Card className = "card">
            <CardContent>
                <Typography variant = "h6" align = "center" gutterBottom>
                    {asset.title}
                </Typography>
                <Typography variant = "overline" align = "center">
                    {asset.amount.toFixed(2)} {asset.currency}
                </Typography>
            </CardContent>
        </Card>
    );
};
