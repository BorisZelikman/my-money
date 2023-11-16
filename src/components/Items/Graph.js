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


export const Graph = observer(() => {

    const userId = AuthStore.currentUserID;
    const { assets, getAssets,  deleteAsset, updateAssetField } = useAssets();
    const { operations, getOperations, getAllOperations, addOperation, deleteOperation, updateOperationField } = useOperations();
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState([]);
    const [operationsLoading, setOperationsLoading] = useState(true);


    // Initialize the selected month to the current month
    const currentMonthIndex = new Date().getMonth();
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const [selectedMonth, setSelectedMonth] = useState(monthNames[currentMonthIndex]);
	const navigate = useNavigate();
	      if (AuthStore.currentUserID === null) {
            navigate(`/`);
        }
        
    useEffect(() => {
        console.log(userId)
        if (userId && isLoading) {
            (async () => {
                try {
                    await getAssets(AuthStore.currentUserID);
                    setIsLoading(false);
                } catch (error) {
                    console.error("Error in receiving assets:", error);
                }
            })();
        }
    }, [userId]);

    useEffect(() => {
        const fetchOperations = async () => {
            setOperationsLoading(true);
            await getAllOperations(userId, assets);
            setOperationsLoading(false);
        };
        fetchOperations();
    }, [assets]);

    const calculateMonthlyExpensesAndIncome = (operations) => {
        const monthlyData = {};

        operations.forEach((operation) => {
            const { type, amount, datetime } = operation;

            // Check if amount is not a number
            if (isNaN(amount) || amount === null || amount === "" || amount === undefined){
                console.error(`Invalid amount value: ${amount}`);
                return; // Skip this iteration
            }

            // Convert time from Unix format to Date object
            const date = new Date(datetime.seconds * 1000);

            // Getting the name of the month
            const month = monthNames[date.getMonth()];

            // Initialisation of the object for the month, if it has not been initialised yet
            if (!monthlyData[month]) {
                monthlyData[month] = { expense: 0, income: 0 };
            }

            // Adding values for payment and income
            if (type === 'payment') {
                monthlyData[month].expense += parseFloat(amount);
                console.log("pay: ", amount)
            } else if (type === 'income') {
                monthlyData[month].income += parseFloat(amount);
            }
        });

        return monthlyData;
    };

    useEffect(() => {
        const calculatedData = calculateMonthlyExpensesAndIncome(operations);
        setData(calculatedData);
        setLoading(false);
    }, [operations]);

    const handleMonthChange = (event) => {
        setSelectedMonth(event.target.value);
    };

    const currentMonthData = data ? { [selectedMonth]: data[selectedMonth] } : null;

    if (operationsLoading || loading || operationsLoading) {
        return (
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                height: "100%"
            }}>
                <Box sx = {{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    py: 2,
                    backgroundColor: "rgb(243, 156, 18)"
                }}>
                    <Typography variant = "h5">
                        Statistic
                    </Typography>
                </Box>
                <Box sx = {{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "90%",
                    overflowY: "auto"
                }}>
                    Loading...
                </Box>
            </Box>
        );
    }
    else {
    return (
        <Box sx = {{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "100%"
        }}>
            <Box sx = {{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                py: 2,
                backgroundColor: "rgb(243, 156, 18)"
            }}>
                <Typography variant = "h5">
                    Statistic
                </Typography>
            </Box>
            <Box sx = {{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "90%",
                overflowY: "auto",
                padding: 2
            }}>
                <Select
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    sx={{
                        minWidth: 150,
                        maxHeight: 40,
                        backgroundColor: '#34495e',
                        color: 'white'
                    }}
                    IconComponent={(props) => (
                        <ArrowDropDownIcon {...props} style={{ color: 'white' }} />
                    )}
                >

                    <MenuItem value="January">January</MenuItem>
                    <MenuItem value="February">February</MenuItem>
                    <MenuItem value="March">March</MenuItem>
                    <MenuItem value="April">April</MenuItem>
                    <MenuItem value="May">May</MenuItem>
                    <MenuItem value="June">June</MenuItem>
                    <MenuItem value="July">July</MenuItem>
                    <MenuItem value="August">August</MenuItem>
                    <MenuItem value="September">September</MenuItem>
                    <MenuItem value="October">October</MenuItem>
                    <MenuItem value="November">November</MenuItem>
                    <MenuItem value="December">December</MenuItem>
                </Select>
                {(!operationsLoading && currentMonthData && currentMonthData[selectedMonth]) ? (
                    <BarChart data={currentMonthData} />
                ) : (
                    <Typography variant="h6">No data available for {selectedMonth}</Typography>
                )}
            </Box>
        </Box>
    );}
});