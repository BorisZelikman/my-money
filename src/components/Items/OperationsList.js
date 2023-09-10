import React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { light } from "@mui/material/styles/createPalette";

function OperationsList({ operations }) {
  function formatDate(date) {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }

  return (
    <Paper
      style={{
        marginTop: 20,
        width: "300px",
        height: "350px",
        overflow: "auto",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Typography variant="body1">
        <List>
          {operations.map((item, index) => (
            <ListItem key={index} style={{ padding: 0 }}>
              <ListItemButton style={{ padding: 0 }}>
                {/* <ListItemText primary={item.datetime} /> */}
                <ListItemText primary={item.title} />
                <ListItemText
                  style={{
                    color:
                      item.type === "payment" ||
                      item.category === "transfer from"
                        ? "red"
                        : "green",
                  }}
                  primary={item.amount}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Typography>
    </Paper>
  );
}

export default OperationsList;
