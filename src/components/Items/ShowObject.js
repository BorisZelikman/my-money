import React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

export default function ShowObject({ object }) {
  return (
    <TableContainer component={Paper} style={{ backgroundColor: "wheat" }}>
      <Table>
        <TableBody>
          {Object.entries(object).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell
                component="th"
                scope="row"
                style={{ fontWeight: "bold" }}
              >
                {key}
              </TableCell>
              <TableCell>{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
