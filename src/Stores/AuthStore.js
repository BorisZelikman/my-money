import {makeAutoObservable} from "mobx";
import Cookies from 'js-cookie';

class AuthStore {
    isBusy= false;

    selectedAssetId = null;
    selectedOperationId = null;

    currentUserID = null;
    currentUser = null;

    userAccounts= null;
    userAssets= null;
    usersNamesFromUserAccounts= null;
    userMainCurrency= null;

    currencies = null;

    constructor() {
        makeAutoObservable(this);
        this.loadFromStorage();
    }



    setIsBusy(isBusy){
        this.isBusy=isBusy;
    }

    setSelectedAssetId(selectedAssetId){
        this.selectedAssetId=selectedAssetId;
    }

    setSelectedOperationId (selectedOperationId){
        this.selectedOperationId = selectedOperationId
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
    setUserMainCurrency(userMainCurrency) {
        this.userMainCurrency = userMainCurrency;
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
        this.saveToStorage();
    }
    getUserName(id) {
        //console.table (Array.from( this.usersNamesFromUserAccounts).find(item=>item.id===id).name)
        return Array.from( this.usersNamesFromUserAccounts).find(item=>item.id===id).name
    }



    saveToStorage() {
        const data = {
            selectedAssetId:this.selectedAssetId,
            selectedOperationId:this.selectedOperationId,
            currentUserID: this.currentUserID,
            currentUser: this.currentUser,
            currencies: this.currencies,
            userAccounts: this.userAccounts,
            userAssets: this.userAssets,
            usersNamesFromUserAccounts: this.usersNamesFromUserAccounts
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
            this.selectedAssetId= parsedData.selectedAssetId;
            this.selectedOperationId=parsedData.selectedOperationId;
            this.currentUserID = parsedData.currentUserID;
            this.currentUser = parsedData.currentUser;
            this.currencies = parsedData.currencies;
            this.userAccounts= parsedData.userAccounts;
            this.userAssets= parsedData.userAssets;
            this.usersNamesFromUserAccounts= parsedData.usersNamesFromUserAccounts;
        }
    }

    clearStorage() {
       sessionStorage.removeItem('authStore');
       Cookies.remove('authStore');
       this.selectedAssetId=null;
       this.selectedOperationId=null;
       this.currentUserID = null;
       this.currentUser = null;
       this.currencies=null;
       this.userAccounts=null;
       this.userAssets=null;
       this.usersNamesFromUserAccounts=null;
    }
}

export default new AuthStore();
