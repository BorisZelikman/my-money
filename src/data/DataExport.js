import React from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import { initializeApp } from 'firebase/app';
import {db} from "../config/firebase"; // Import initializeApp if you haven't done it already

const DataExport = () => {
    const exportData = async () => {
        try {
            const accountsRef = collection(db, 'accounts');
            const accountsSnapshot = await getDocs(accountsRef);
            const accounts = accountsSnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
            for (const account of accounts) {
                const assetsRef = collection(
                    db, "accounts", account.id, "assets"
                );
                const assetsSnapshot = await getDocs(assetsRef);
                const assets = assetsSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id
                }));
                for (const asset of assets) {
                    const operationsRef = collection(
                        db, "accounts", account.id, "assets", asset.id, "operations"
                    );
                    const operationsSnapshot = await getDocs(operationsRef);
                    const operations = operationsSnapshot.docs.map(doc => ({
                        ...doc.data(),
                        id: doc.id
                    }));
                    asset.operations=operations;
                }
                account.assets=assets;
            }
            
            const currenciesRef = collection(db, 'currencies');
            const currenciesSnapshot = await getDocs(currenciesRef);
            const currencies = currenciesSnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
            
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);
            const users = usersSnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
            const jsonData = JSON.stringify({
                "accounts":accounts,
                "currencies":currencies,
                "users":users
            }, null, 2);

            // Save JSON data to a file using FileSaver.js
            const blob = new Blob([jsonData], { type: 'application/json' });
            saveAs(blob, 'exported-data.json');        } catch (error) {
            console.error('Error exporting data:', error);
        }
    };

    return (
        <div>
            <button onClick={exportData}>Export Data</button>
        </div>
    );
};

export default DataExport;
