import { makeAutoObservable } from "mobx";

class AuthStore {
    currentUserID = null;
    currentUser = null;

    constructor() {
        makeAutoObservable(this);
        this.loadFromLocalStorage();
    }

    setCurrentUserID(currentUserID) {
        this.currentUserID = currentUserID;
        this.saveToLocalStorage();
    }

    setCurrentUser(currentUser) {
        this.currentUser = currentUser;
        this.saveToLocalStorage();
    }
    saveToLocalStorage() {
        localStorage.setItem('authStore', JSON.stringify({
            currentUserID: this.currentUserID,
            currentUser: this.currentUser,
        }));
    }
    loadFromLocalStorage() {
        const data = localStorage.getItem('authStore');
        if (data) {
            const parsedData = JSON.parse(data);
            this.currentUserID = parsedData.currentUserID;
            this.currentUser = parsedData.currentUser;
        }
    }
}

export default new AuthStore();
