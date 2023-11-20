import {makeAutoObservable, observable} from "mobx";
import Cookies from 'js-cookie';

class AuthStore {
    currentUserID = null;
    currentUser = null;

    userAccounts= null;
    userAssets= null;
    usersNamesFromUserAccounts= null;

    currencies = null;

    constructor() {
        makeAutoObservable(this);
        this.loadFromStorage();
    }


    setCurrentUserID(currentUserID) {
        this.currentUserID = currentUserID;
        this.saveToStorage();
    }

    setCurrentUser(currentUser) {
        this.currentUser = currentUser;
        this.saveToStorage();
    }
    setCurrencies(currencies) {
        this.currencies = currencies;
        this.saveToStorage();
    }
    setUserAccounts(accounts) {
        this.userAccounts = accounts;
        this.saveToStorage();
    }

    setUserAssets(assets) {
        this.userAssets = assets;
        this.saveToStorage();
    }

    setUserNamesOfAccounts(userNamesOfAccounts) {
        this.usersNamesFromUserAccounts = userNamesOfAccounts;
        console.table(userNamesOfAccounts)
    }
    getUserName(id) {
        //console.table (Array.from( this.usersNamesFromUserAccounts).find(item=>item.id===id).name)
        return Array.from( this.usersNamesFromUserAccounts).find(item=>item.id===id).name
    }



    saveToStorage() {
        const data = {
            currentUserID: this.currentUserID,
            currentUser: this.currentUser,
            currencies: this.currencies,
            userAccounts: this.userAccounts,
            userAssets: this.userAssets
        };
        sessionStorage.setItem('authStore', JSON.stringify(data));
        Cookies.set('authStore', JSON.stringify(data), { expires: 0.5 }); // 0.5 дня = 12 часов
    }

    loadFromStorage() {
        let data = sessionStorage.getItem('authStore');

        if (!data) {
            data = Cookies.get('authStore');
        }

        if (data) {
            const parsedData = JSON.parse(data);
            this.currentUserID = parsedData.currentUserID;
            this.currentUser = parsedData.currentUser;
            this.currencies = parsedData.currencies;
            this.userAccounts= parsedData.userAccounts;
            this.userAssets= parsedData.userAssets;
        }
    }

    clearStorage() {
       sessionStorage.removeItem('authStore');
       Cookies.remove('authStore')
       this.currentUserID = null;
       this.currentUser = null;
       this.currencies=null;
       this.userAccounts=null;
       this.userAssets=null;
    }
}

export default new AuthStore();
