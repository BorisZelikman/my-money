import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import AuthStore from "../../Stores/AuthStore";
export const AccountSelect = ({caption, accounts,currentAccountId, onAccountSelect, showNewAccount}) => {

    const accountHint=(id)=>{
        const found=accounts.find (a=>a.id=id)
        const name=found.title? found.title: found.id;

    }
    const accountUsersNames = (usersIds)=>{
        if (usersIds.length<=1) return "";
        let s= " ("+usersIds.length+": ";
        //console.log("FIND USER:",Object.from(usersIds))
       //console.log("QQQQQQQQQQQQ",Array.from( AuthStore.userNamesOfAccounts).find(item=>item.id=== "LFQkbFvJETQdy9lBdMjrjhxLaGv1").name)
        for (let i = 0; i < usersIds.length; i++) {
             s += AuthStore.getUserName(usersIds[i]);
//            s += usersIds[i];
            s += i < usersIds.length-1 ? ", " : ")";
        }
        return s;
    }

    console.log("currentAccountId:",currentAccountId)
    if (Array.isArray(accounts)) return (
         <FormControl sx={{p:0}} fullWidth variant="outlined" size="small">
             <InputLabel htmlFor="select">{caption}</InputLabel>
             <Select className="input-field"
                onChange={(event)=>onAccountSelect(event.target.value)}
                label={caption}
                inputProps={{name: "select"}}
                value={currentAccountId || ""}
            >
                {accounts.map((a) => (
                    <MenuItem key={a.id} value={a.id} >
                        {a.title?a.title:a.id}
                        {accountUsersNames(a.users)}
                    </MenuItem>
                ))}
                {showNewAccount?<MenuItem value="New account...">New account...</MenuItem>:null}
            </Select>
         </FormControl>)
    else return null;

}
