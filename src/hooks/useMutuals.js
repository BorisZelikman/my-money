import {useState} from "react";
import {db} from "../config/firebase";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    collectionGroup,
    updateDoc,
    where
} from "firebase/firestore";
import {useAssets} from "./useAssets";
import {useOperations} from "./useOperations";
import {getOperationsWithAssetsFields} from "../data/dataFunctions";

export const useMutuals = () => {
    const [mutualOperations, setMutualOperations] = useState(null);
    const [participants, setParticipants] = useState(null);
    const [purposes, setPurposes] = useState(null);

    const {getAccountAssets} = useAssets()
    const {getAllAssetsOperations} = useOperations()

    const getAssetIdsInAccount = async (accountId) => {
        const querySnapshot = await getDocs(collection(db, 'accounts', accountId, 'assets'));

        const assetIds = [];
        querySnapshot.forEach((doc) => {
            // Assuming your assets have an 'id' field
            const assetId = doc.id;
            assetIds.push(assetId);
        });

        return assetIds;
    };
    const getOperationsByPurpose = async (accountId, assetId, purposeId) => {
        const operationsQuery = query(
            collection(db, "accounts", accountId, "assets", assetId, "operations"),
            where('purposeId', '!=', null)
        );

        const data = await getDocs(operationsQuery);

        const filteredData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
            assetId: assetId
        }));

        return filteredData;
    };

    const getMutual = async (mutualId) => {
        try {
            const mutualDoc = doc(db, "mutuals", mutualId);
            const mutualSnapshot = await getDoc(mutualDoc)
            const mutualData = mutualSnapshot?.data()
            return (mutualData)
        } catch (err) {
            console.error(err);
        }
    };

    const getParticipants = async (mutualId) => {
        try {
            const data = await getDocs(
                collection(db, "mutuals", mutualId, "participants")
            );
            const docsWithId = data.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            setParticipants(docsWithId)
            return docsWithId;
        } catch (err) {
            console.error(err);
        }
    }

    const getPurposes = async (mutualId) => {
        try {
            const data = await getDocs(
                collection(db, "mutuals", mutualId, "purposes")
            );
            const docsWithId = data.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
            setPurposes(docsWithId)
            return docsWithId;
        } catch (err) {
            console.error(err);
        }
    }

    const getOperationsWithPurpose = async (accountId, assetId) => {
        const operationsQuery  = query(
            collection(db, "accounts", accountId, "assets", assetId, "operations"),
            where('purposeId', '!=', '')
        );
        const querySnapshot = await getDocs(operationsQuery);

        const filteredData = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
            accountId: accountId,
            assetId: assetId
        }));

        return filteredData;
    };
    const getMutualOperations = async (mutualId) => {
        const participants = await getParticipants(mutualId)
        console.log(participants)
        let assets=[]
        for (const p of participants) {
            for (const asset of await getAccountAssets(p.accountId)) {
                assets.push(asset)

            }
        }

        let allOperations=[];
        for (const asset of assets) {
            const assetOperation=await getOperationsWithPurpose(asset.accountId, asset.id)
            allOperations.push(...assetOperation)
        }

            allOperations.sort((a, b) => b.datetime.seconds - a.datetime.seconds);

        console.table(allOperations);
        setMutualOperations(allOperations)


//        setFilteredOperations(sortedOperations)
//        setAllOperations(sortedOperations)

    };

    async function getOperationsByAccountIds(accountIds) {
        const operations = [];

        for (const accountId of accountIds) {
            const accountRef = doc(collection(db, 'accounts'), accountId);
            const assetsRef = collection(accountRef, 'assets');
            //const operationsQuery = query(assetsRef, where('operations.purposeId', '!=', null));
            const operationsQuery = query(assetsRef);


            const operationsSnapshot = await getDocs(operationsQuery);

            operationsSnapshot.forEach((doc) => {
                const assetData = doc.data();
                const assetOperations = assetData.operations;

                // Extract operations with a specific "target" field
                const targetOperations = Object.values(assetOperations)
                    .filter((operation) => operation.puposeId !== undefined);

                operations.push(...targetOperations);
            });
        }

        return operations;
    }

    return {
        mutualOperations,
        participants,
        purposes,
        getParticipants,
        getPurposes,
        getMutualOperations,
        getOperationsByAccountIds
    };
};
