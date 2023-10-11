import { makeAutoObservable } from "mobx";
import Cookies from 'js-cookie';

class AuthStore {
    currentUserID = null;
    currentUser = null;
    
    currencies =null;

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

    saveToStorage() {
        const data = {
            currentUserID: this.currentUserID,
            currentUser: this.currentUser,
            currencies: this.currencies
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
        }
    }

    clearStorage() {
       sessionStorage.removeItem('authStore');
       Cookies.remove('authStore')
       this.currentUserID = null;
       this.currentUser = null;
    }
}

export default new AuthStore();
