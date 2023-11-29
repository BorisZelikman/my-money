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
import AuthStore from "../../Stores/AuthStore";
import {useState} from "react";

export function OperationsTable({ assets, operations, currencies, count, onRowSelect }) {
    const [selectedOperationId, setSelectedOperationId] = useState([]);
    if (Array.isArray(operations) && operations?.length > 0) {
        const sortedOperations = operations.slice().sort((a, b) => a.datetime.seconds - b.datetime.seconds).reverse();
        const handleRowClick = (operationId) => {
            setSelectedOperationId(operationId);
            onRowSelect(operationId);
        };


        const isRowSelected = (id) => selectedOperationId === id;
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
                            <TableCell align="center">👪</TableCell>
                            <TableCell align="left">Title</TableCell>
                            <TableCell align="center">Date</TableCell>
                            <TableCell align="right">Amount</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedOperations.slice(0, count).map((item, row, id) => {
                            const date = new Date(item.datetime.seconds * 1000);
                            const formattedDate = format(date, 'dd.MM.yy');
                            const amount=parseFloat(item.amount).toFixed(2);
                            const isSelected = isRowSelected(row);
                            return (
                                <TableRow hover role="checkbox" tabIndex={-1} key={item.id}
                                          selected={isSelected}
                                          onClick={() => handleRowClick(item.id)}>
                                    <TableCell align="center">{AuthStore.getUserName(item.userId)[0]}</TableCell>
                                    <TableCell align="left">{item.title}</TableCell>
                                    <TableCell align="center">{formattedDate}</TableCell>
                                    <TableCell
                                        align="right"
                                        style={{
                                            color: item.type === "payment" || item.category === "transfer from" ? "red" : "green",
                                            whiteSpace: 'nowrap'
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

