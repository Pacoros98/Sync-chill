import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export type UsernameRecord = {
  uid: string;
  userName: string;
};

export async function isUsernameTaken(userNameLower: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, "usernames", userNameLower));
  return snapshot.exists();
}

export async function findUserByUsername(userNameLower: string): Promise<UsernameRecord | null> {
  const snapshot = await getDoc(doc(db, "usernames", userNameLower));
  return snapshot.exists() ? (snapshot.data() as UsernameRecord) : null;
}

export async function reserveUsername(uid: string, userName: string): Promise<void> {
  await setDoc(doc(db, "usernames", userName.toLowerCase()), {
    uid,
    userName,
  });
}
