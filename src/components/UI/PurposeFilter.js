import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LocalGroceryStoreOutlinedIcon from '@mui/icons-material/LocalGroceryStoreOutlined';
import SocialDistanceOutlinedIcon from '@mui/icons-material/SocialDistanceOutlined';
import FunctionsOutlinedIcon from '@mui/icons-material/FunctionsOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {getOperationsSum} from "../../data/dataFunctions";
import Box from "@mui/material/Box";
import {CommonTable} from "./CommonTable";

export const PurposeFilter = ({participantData, purposes, operations, filter, onPurposeChange}) => {
    const isInInterval = (datetime) => {
        const date = new Date(datetime.seconds * 1000);
        return filter?.start <= date && date <= filter?.end;
    }
    const totalSum = Math.floor(getOperationsSum(
        operations.filter(o => isInInterval(o.datetime))
    ))

    const totalNorm = Math.floor(totalSum * participantData.rate);

    const totalFact = Math.floor(getOperationsSum(
        operations.filter(o => o.accountId === participantData.accountId && isInInterval(o.datetime))
    ))
    const totalDiff = totalFact - totalNorm;

    return (
        <div className="horisontalContainer">

            <ToggleButtonGroup

                aria-label="Large sizes"
                color="standard"
                value={filter.checkedPurposes}
                exclusive
                onChange={(event) => onPurposeChange(event.target.value)}
                // aria-label="Platform"
                sx={{boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', // Adjust the values as needed
                }}
            >
                <ToggleButton value="" className="no-hover" style={{backgroundColor:"#ffcf6b", paddingRight:0}}>
                    {operations?.length > 0 && <div className="verticalContainer">
                        <InfoOutlinedIcon/>
                        <Box className="verticalContainerCommon" >
                            <div className="smallText" style={{textAlign:"left"}}>Total:</div>
                            <div className="smallText" style={{textAlign:"left"}}>×{participantData.rate}:</div>
                            <div className="smallText" style={{textAlign:"left"}}>My:</div>
                            <div className="smallText" style={{textAlign:"left"}} >Delta:</div>
                            {/*<div className="smallText" style={diff<0?{color:"red"}:{color:"blue"}}>⚖{diff}</div>*/}
                        </Box>
                    </div>}
                </ToggleButton>
                <ToggleButton value="" className="no-hover" style={{backgroundColor:"#ffcf6b",paddingLeft:"3px"}}>
                    {operations?.length > 0 && <div className="verticalContainer">
                        <FunctionsOutlinedIcon/>
                        <CommonTable participantData={participantData} purposes={purposes}
                                     operations={operations} filter={filter}/>
                    </div>}
                </ToggleButton>

                {
                    purposes?.map(purpose => {
                        const sum = Math.floor(getOperationsSum(
                            operations.filter(o => o.purposeId === purpose.id && isInInterval(o.datetime))
                        ))

                        const norm = Math.floor(sum * participantData.rate);

                        const fact = Math.floor(getOperationsSum(
                            operations.filter(o => o.purposeId === purpose.id &&
                                o.accountId === participantData.accountId && isInInterval(o.datetime))
                        ))
                        const difference = fact - norm;
                        console.log(sum, norm, fact, difference)
                        return (
                            <ToggleButton value={purpose.id}
                                          sx={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                                <div onClick={() => onPurposeChange(purpose.id)}
                                     className="verticalContainer"
                                >
                                    {operations?.length > 0 && <div className="verticalContainer">
                                        {purpose.icon === "bin" && <LocalGroceryStoreOutlinedIcon/>}
                                        {purpose.icon === "home" && <HomeOutlinedIcon/>}
                                        {purpose.icon === "arrows" &&
                                            <SocialDistanceOutlinedIcon sx={{alignSelf: "start"}}/>}
                                        <CommonTable participantData={participantData} purposes={purposes}
                                                     operations={operations} filter={filter}
                                                     currentPurposeId={purpose.id}
                                        />
                                        {/*<div>{sum}</div>*/}
                                        {/*{purpose.icon !== "arrows" && <div>{norm}</div>}*/}
                                        {/*{purpose.icon !== "arrows" && <div>{fact}</div>}*/}
                                        {/*{purpose.icon !== "arrows" && <div>{difference}</div>}*/}
                                    </div>}
                                </div>
                            </ToggleButton>
                        )
                    })
                }
            </ToggleButtonGroup>
        </div>
    )
};
