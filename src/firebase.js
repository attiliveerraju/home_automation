import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDeZQNEyKqoTxSrxkOgUW-yMBBKMfwNM9A",
  authDomain: "wiffi-5c9ba.firebaseapp.com",
  databaseURL: "https://wiffi-5c9ba.firebaseio.com",
  projectId: "wiffi-5c9ba"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
