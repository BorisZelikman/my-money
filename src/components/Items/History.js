import {useEffect, useState} from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import {useOperations} from "../../hooks/useOperations";
import {useAssets} from "../../hooks/useAssets";
import {AssetSelect} from "../UI/AssetSelect";
import AuthStore from "../../Stores/AuthStore";

export function History() {
    const [user, setUser] = useState(null);
    const [currentActiveId, setCurrentActiveId] = useState("");
    const {actives, getAssets} = useAssets();
    const {operations, getOperations} = useOperations();

    useEffect(() => {
        if (AuthStore.currentUser) {
            setUser(AuthStore.currentUser);
        } else {
            setUser(null);
        }
    }, []);

    useEffect(() => {
        if (user) {
            getAssets(user.uid);
            if (currentActiveId) {
                getOperations(user.uid, currentActiveId);
            }
        }
    }, [user, currentActiveId]);

    useEffect(() => {
        if (actives && actives.length > 0) {
            setCurrentActiveId(actives[0].id);
        }
    }, [actives]);

    const handleActiveChange = (event) => {
        setCurrentActiveId(event.target.value);
    };

    return (
        <>
            <AssetSelect currentActiveId = {currentActiveId} handleActiveChange = {handleActiveChange}
                         actives = {actives}/>
            <TableContainer
                component = {Paper}
                style = {{
                    marginTop: 20,
                    width: "300px",
                    height: "350px",
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
        </>
    );
}
