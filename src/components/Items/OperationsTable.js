import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";
import {getCurrencyOfAsset, getCurrencySymbolOfAsset} from "../../data/currencyMethods";
import { format } from 'date-fns';

export function OperationsTable({ assets, operations, currencies, count }) {
    if (Array.isArray(operations) && operations?.length > 0) {
        const sortedOperations = operations.slice().sort((a, b) => a.datetime.seconds - b.datetime.seconds).reverse();
console.table(assets)
        return (
            <TableContainer
                component={Paper}
                style={{
                    width: "100%",
                    overflow: "auto",
                    backgroundColor: "#ffffff",
                }}
            >
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell align="left">Title</TableCell>
                            <TableCell align="center">Date</TableCell>
                            <TableCell align="right">Amount</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedOperations.slice(0, count).map((item, index) => {
                            const date = new Date(item.datetime.seconds * 1000);
                            const formattedDate = format(date, 'dd.MM.yy');
                            const amount=parseFloat(item.amount).toFixed(2);

                            return (
                                <TableRow key={index}>
                                    <TableCell align="left">{item.title}</TableCell>
                                    <TableCell align="center">{formattedDate}</TableCell>
                                    <TableCell
                                        align="right"
                                        style={{
                                            color: item.type === "payment" || item.category === "transfer from" ? "red" : "green",
                                        }}
                                    >
                                        {amount} {getCurrencySymbolOfAsset(assets, item.assetId, currencies)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    } else {
        return (
            <Box
                component={Paper}
                style={{
                    marginTop: 20,
                    width: "300px",
                    overflow: "auto",
                    backgroundColor: "#ffffff",
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                No operations
            </Box>
        );
    }
}

