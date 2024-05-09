import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";
import {getCurrencyOfAsset, getCurrencySymbol, getCurrencySymbolOfAsset} from "../../data/currencyMethods";
import {format} from 'date-fns';
import AuthStore from "../../Stores/AuthStore";
import {useEffect, useState} from "react";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import {SuccessRegistrationDialog} from "../Dialogs/SuccessRegistrationDialog";
import {DeleteDialog} from "../Dialogs/DeleteDialog";
import {categories} from "../../data/categoryData";
import useMediaQuery from "@mui/material/useMediaQuery";
import EditIcon from "@mui/icons-material/Edit";
import {useNavigate} from "react-router-dom";


export function OperationsTable({
                                    operations, currentOperationId, currencies,
                                    selectForEdit,
                                    showAssets, showCategories, showComments,
                                    onRowSelect, onDeleteOperation
                                }) {
    const navigate = useNavigate();
    const isSmallWidthScreen = useMediaQuery("(max-width: 782px)");
    const [selectedOperationId, setSelectedOperationId] = useState("");
    const [confirmDialog, setConfirmDialog] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [columns, setColumns] = useState({
        user: true,
        asset: false,
        title: true,
        date: true,
        amount: true,
        category: false,
        comment: false,
    })

    useEffect(() => {
        setSelectedOperationId(currentOperationId)
    }, [currentOperationId]);

    useEffect(() => {
        setColumns(() => ({
            ...columns,
            asset: showAssets,
            category: showCategories,
            comment: showComments,
        }))
    }, []);


    if (Array.isArray(operations) && operations?.length > 0) {
        const sortedOperations = operations.sort((a, b) => a.datetime.seconds - b.datetime.seconds).reverse();


        const handleRowClick = (operationId) => {
            setSelectedOperationId(operationId);
            onRowSelect(operationId);
        };
        const handleConfirmDelete = (confirmed) => {
            console.log(confirmed)
            setConfirmDialog(false)
            if (confirmed) {
                onDeleteOperation()
            }
        };
        const handleEdit = () => {
            setConfirmDialog(true)
            const operationToEdit = operations.find(o => o.id === selectedOperationId)
            console.log(operationToEdit)
            setConfirmText(
                `Operation-${operationToEdit.title} (${operationToEdit.id}); assetId:${operationToEdit.assetId}`
            )
            AuthStore.setSelectedOperationId(
                operationToEdit.editOperation ? operationToEdit.editOperation.operationId : operationToEdit.id)
            AuthStore.setSelectedAssetId(
                operationToEdit.editOperation ? operationToEdit.editOperation.assetId : operationToEdit.assetId)
            navigate(`/operations`);
        };
        const handleDelete = () => {
            setConfirmDialog(true)
            const operationToDel = operations.find(o => o.id === selectedOperationId)
            setConfirmText(`Operation-${operationToDel.type}: ${operationToDel.title} 
            (${operationToDel.amount} ${getCurrencySymbol(currencies, operationToDel.currency)})` +
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
                        <TableHead style={{position: 'sticky', top: 0, backgroundColor: "antiquewhite"}}>
                            <TableRow>
                                <TableCell align="center" sx={{p: 1}}>👪</TableCell>
                                {!isSmallWidthScreen && <TableCell align="left">Category</TableCell>}
                                <TableCell align="left">Title</TableCell>
                                {!isSmallWidthScreen && <TableCell align="left">Comment</TableCell>}
                                <TableCell align="center">Date</TableCell>
                                <TableCell align="right">Amount</TableCell>
                                {!isSmallWidthScreen && <TableCell align="left">Asset</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {operations.map((item, row, id) => {
                                console.log(operations.length)
                                const date = new Date(item.datetime.seconds * 1000);
                                const formattedDate = format(date, 'dd.MM.yy');
                                const amount = parseFloat(item.amount).toFixed(2);
                                const isSelected = isRowSelected(item.id);
                                const colorStyle = {
                                    color: item.type === "payment" || item.category === "transfer from" ? "red" : "green",
                                    whiteSpace: 'nowrap'
                                }
                                return (
                                    <>
                                        <TableRow hover role="checkbox" tabIndex={-1} key={item.id}
                                                  selected={isSelected}
                                                  onClick={() => handleRowClick(item.id)}
                                                  style={{
                                                      opacity: item.category === "credit" ? "40%" : "100%",
                                                  }}>
                                            <TableCell align="center" sx={{m: 0, p: 1}}>
                                                {isSelected ?
                                                    selectForEdit ?
                                                        <IconButton sx={{m: 0, p: 0}}
                                                                    aria-label="edit" size="small" color="primary"
                                                                    onClick={handleEdit}
                                                        >
                                                            <EditIcon/>
                                                        </IconButton> :
                                                        <IconButton sx={{m: 0, p: 0}}
                                                                    aria-label="delete" size="small" color="error"
                                                                    onClick={handleDelete}
                                                        >
                                                            <DeleteIcon/>
                                                        </IconButton> :
                                                    AuthStore.getUserName(item.userId)[0]}
                                            </TableCell>
                                            {!isSmallWidthScreen &&
                                                <TableCell sx={{p: 0.5}} align="left">{item.category}</TableCell>}
                                            <TableCell sx={{p: 0.5}} align="left">{item.title}</TableCell>
                                            {!isSmallWidthScreen &&
                                                <TableCell sx={{p: 0.5}} align="left">{item.comment}</TableCell>}
                                            <TableCell sx={{p: 0.5}} align="center">{formattedDate}</TableCell>
                                            <TableCell align="right" style={colorStyle}>
                                                {amount} {getCurrencySymbol(currencies, item.currency)}
                                            </TableCell>
                                            {!isSmallWidthScreen && <TableCell sx={{p: 0.5}} style={colorStyle}
                                                                               align="center">{item.assetTitle}</TableCell>}
                                        </TableRow>
                                        {isSelected && isSmallWidthScreen ?
                                            <TableRow hover role="checkbox" tabIndex={-1} key={item.id}
                                                      selected={isSelected}
                                                      onClick={() => handleRowClick(item.id)}
                                                      style={{
                                                          opacity: item.category === "credit" ? "40%" : "100%",
                                                      }}>
                                                {columns.comment && <TableCell align="center" sx={{m: 0, p: 1}}>
                                                    {AuthStore.getUserName(item.userId)[0]}
                                                </TableCell>}
                                                {columns.comment &&
                                                    <TableCell sx={{p: 0.5}} align="left">{item.comment}</TableCell>}
                                                {columns.category &&
                                                    <TableCell sx={{p: 0.5}} align="center">{item.category}</TableCell>}
                                                {columns.asset && <TableCell style={colorStyle} sx={{p: 0.5}}
                                                                             align="center">{item.assetTitle}</TableCell>}
                                            </TableRow>
                                            : null
                                        }
                                    </>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                <DeleteDialog
                    open={confirmDialog} onClose={handleConfirmDelete}
                    text={confirmText}
                />

            </>
        );
    } else {
        return (
            <p> No operations</p>
        );
    }
}

