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
import {useEffect, useState} from "react";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import {SuccessRegistrationDialog} from "../Dialogs/SuccessRegistrationDialog";
import {DeleteDialog} from "../Dialogs/DeleteDialog";


export function OperationsTable({ assets, operations, currentOperationId, currencies, count,
                                    onRowSelect, onDeleteOperation}) {
    const [selectedOperationId, setSelectedOperationId] = useState("");
    const [confirmDialog, setConfirmDialog] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    useEffect(() => {
        setSelectedOperationId(currentOperationId)
    }, [currentOperationId]);

    if (Array.isArray(operations) && operations?.length > 0) {
        const sortedOperations = operations.slice().sort((a, b) => a.datetime.seconds - b.datetime.seconds).reverse();
        const handleRowClick = (operationId) => {
            setSelectedOperationId(operationId);
            onRowSelect(operationId);
        };
        const handleConfirmDelete = (confirmed) => {
            console.log (confirmed)
            setConfirmDialog(false)
            if (confirmed) {onDeleteOperation()}
        };
        const handleDelete = () => {
            setConfirmDialog(true)
            const operationToDel=operations.find(o=>o.id===currentOperationId)
            setConfirmText(`Operation-${operationToDel.type}: ${operationToDel.title} 
            (${operationToDel.amount} ${getCurrencySymbolOfAsset(assets, operationToDel.assetId, currencies)})`+
              ` will be deleted.`
            )
        };



        const isRowSelected = (id) => selectedOperationId === id;
        return (
            <>
            <TableContainer
                component={Paper}
                style={{
                    width: "100%",
                    overflow: "auto",
                    backgroundColor: "#ffffff",
                }}
            >
                <Table size="small">
                    <TableHead  style={{ position: 'sticky', top: 0, zIndex: 1000, backgroundColor: "antiquewhite" }}>
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
                            const isSelected = isRowSelected(item.id);
                            return (
                                <TableRow hover role="checkbox" tabIndex={-1} key={item.id}
                                          selected={isSelected}
                                          onClick={() => handleRowClick(item.id)}
                                          style={{
                                    opacity:  item.category.substring(0,6) === "credit" ? "40%" : "100%",
                                }}>
                                    <TableCell align="center">
                                        {isSelected?
                                            <IconButton sx={{m:0, p:0}}
                                                        aria-label = "delete" size = "small" color = "error"
                                                        onClick={handleDelete}
                                            >
                                                <DeleteIcon />
                                            </IconButton>:
                                            AuthStore.getUserName(item.userId)[0]}
                                            {/*(item.id)}*/}
                                    </TableCell>
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
            <DeleteDialog
                open = {confirmDialog} onClose={handleConfirmDelete}
                text={confirmText}
            />

            </>
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

