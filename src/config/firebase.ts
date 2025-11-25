import admin from "firebase-admin";
import * as fs from "fs";

const envVar = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!envVar) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.");
}

let serviceAccountConfig: admin.ServiceAccount;

try {
    serviceAccountConfig = JSON.parse(envVar);
} catch {
    const fileContents = fs.readFileSync(envVar, "utf8");
    serviceAccountConfig = JSON.parse(fileContents);
}
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountConfig),
    });
}

export const db = admin.firestore();
export const firebaseAdmin = admin;
