import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";

export function OperationsTable({operations}) {
    if (Array.isArray(operations) && operations.length>0) {
        return (
        <TableContainer
            component = {Paper}
            style = {{
                marginTop: 20,
                width: "300px",
                overflow: "auto",
                backgroundColor: "#ffffff"
            }}
        >
            <Table size = "small">
                <TableHead>
                    <TableRow>
                        <TableCell align = "left">Title</TableCell>
                        <TableCell align = "right">Amount</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {operations.map((item, index) => (
                        <TableRow key = {index}>
                            <TableCell align = "left">{item.title}</TableCell>
                            <TableCell
                                align = "right"
                                style = {{
                                    color:
                                        item.type === "payment" || item.category === "transfer from"
                                            ? "red"
                                            : "green"
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
    else return (
        <Box
        component = {Paper}
        style = {{
            marginTop: 20,
            width: "300px",
            overflow: "auto",
            backgroundColor: "#ffffff",
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            No operations
        </Box>)

}
