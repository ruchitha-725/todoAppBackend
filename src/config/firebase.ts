import admin from 'firebase-admin';
import * as fs from 'fs';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountPath) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.");
}
const serviceAccountConfig = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountConfig),
    });
}

export const db = admin.firestore();
export const firebaseAdmin = admin;
