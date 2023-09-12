import React from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

export function OperationsList({ operations }) {
    function formatDate(date) {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear().toString().slice(-2);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");

        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    return (
        <TableContainer
            component={Paper}
            style={{
                marginTop: 20,
                width: "300px",
                height: "350px",
                overflow: "auto",
                backgroundColor: "#ffffff", // Set background color to white
            }}
        >
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell align="left">Title</TableCell>
                        <TableCell align="right">Amount</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {operations.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell align="left">{item.title}</TableCell>
                            <TableCell
                                align="right"
                                style={{
                                    color:
                                        item.type === "payment" || item.category === "transfer from"
                                            ? "red"
                                            : "green",
                                }}
                            >
                                {item.amount}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
