import {makeAutoObservable, observable} from "mobx";
import Cookies from 'js-cookie';

class AuthStore {
    currentUserID = null;
    currentUser = null;

    userAccounts= null;
    assetsSettings= null;
    userNamesOfAccounts= null;

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
    setUserNamesOfAccounts(accounts) {
        this.userAccounts = accounts;
    }

    setUserAssets(assets) {
        this.assetsSettings = assets;
        this.saveToStorage();
    }

    saveToStorage() {
        const data = {
            currentUserID: this.currentUserID,
            currentUser: this.currentUser,
            currencies: this.currencies,
            userAccounts: this.userAccounts,
            userAssets: this.assetsSettings
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
            this.assetsSettings= parsedData.userAssets;
        }
    }

    clearStorage() {
       sessionStorage.removeItem('authStore');
       Cookies.remove('authStore')
       this.currentUserID = null;
       this.currentUser = null;
       this.currencies=null;
       this.userAccounts=null;
       this.assetsSettings=null;
    }
}

export default new AuthStore();
