// import { doc, getDoc } from "firebase/firestore";
// import { firestore } from "../firebase.config";

// export async function isIdCollision(collection: string, id: string): Promise<boolean> {
//     const idRef = doc(firestore, collection, id);
//     const idSnap = await getDoc(idRef);
//     return idSnap.exists();
// }