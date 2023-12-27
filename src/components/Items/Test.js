import {observer} from "mobx-react";
import {useNavigate} from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import BarChart from "../Diagrams/BarChart";
import {useEffect, useState} from "react";
import {useAssets} from "../../hooks/useAssets";
import {useOperations} from "../../hooks/useOperations";
import AuthStore from "../../Stores/AuthStore";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {ToggleAccountsOrAssets} from "../UI/ToggleAccountsOrAssets";
import {AccountSelect} from "../UI/AccountSelect";
import {AssetSelect} from "../UI/AssetSelect";
import {OperationsTable} from "./OperationsTable";
import {OperationsFilter} from "./OperationsFilter";
import {FieldsValuesFilter} from "./FieldsValuesFilter";
import {InputSearch} from "./InputSearch";
import {DateIntervalPicker} from "./DateIntervalPicker";
import {AmountCheckbox} from "./AmountCheckbox";


export const Test = () => {

    return (
        <Box className="page" >
            <Box className="title-box" >
                <Typography variant = "h5">
                    Test
                </Typography>
            </Box>
            <Box className="resultContainer" sx={{flex:1,backgroundColor:"blue"}}>
                <p>123</p>
            </Box>
            <Box className="resultContainer" sx = {{ backgroundColor:"cyan"}}>
                <DateIntervalPicker/>
                <AmountCheckbox color="red" amountTitle="2154.21$" onChange={()=>(console.log("Changed"))}/>
                <AmountCheckbox color="green" amountTitle="32154.21$" onChange={()=>(console.log("Changed"))}/>
                <AmountCheckbox color="silver" amountTitle="3154.21$" onChange={()=>(console.log("Changed"))}/>
            </Box>
            {/*</Box>*/}

        </Box>
    );
}
