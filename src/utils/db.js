import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, 
where } from 'firebase/firestore';

// Parent operations
export const addParent = async (parentData) => {
  try {
    const docRef = await addDoc(collection(db, 'parents'), parentData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding parent: ', error);
    throw error;
  }
};

export const updateParent = async (parentId, parentData) => {
  try {
    const parentRef = doc(db, 'parents', parentId);
    await updateDoc(parentRef, parentData);
  } catch (error) {
    console.error('Error updating parent: ', error);
    throw error;
  }
};

export const deleteParent = async (parentId) => {
  try {
    await deleteDoc(doc(db, 'parents', parentId));
  } catch (error) {
    console.error('Error deleting parent: ', error);
    throw error;
  }
};

export const getParents = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'parents'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting parents: ', error);
    throw error;
  }
};

// Child operations
export const addChild = async (childData) => {
  try {
    const docRef = await addDoc(collection(db, 'children'), childData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding child: ', error);
    throw error;
  }
};

export const updateChild = async (childId, childData) => {
  try {
    const childRef = doc(db, 'children', childId);
    await updateDoc(childRef, childData);
  } catch (error) {
    console.error('Error updating child: ', error);
    throw error;
  }
};

export const deleteChild = async (childId) => {
  try {
    await deleteDoc(doc(db, 'children', childId));
  } catch (error) {
    console.error('Error deleting child: ', error);
    throw error;
  }
};

export const getChildren = async (parentId) => {
  try {
    const q = query(collection(db, 'children'), where('parentId', '==', 
parentId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting children: ', error);
    throw error;
  }
};

// Schedule operations
export const addSchedule = async (scheduleData) => {
  try {
    const docRef = await addDoc(collection(db, 'schedules'), 
scheduleData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding schedule: ', error);
    throw error;
  }
};

export const updateSchedule = async (scheduleId, scheduleData) => {
  try {
    const scheduleRef = doc(db, 'schedules', scheduleId);
    await updateDoc(scheduleRef, scheduleData);
  } catch (error) {
    console.error('Error updating schedule: ', error);
    throw error;
  }
};

export const deleteSchedule = async (scheduleId) => {
  try {
    await deleteDoc(doc(db, 'schedules', scheduleId));
  } catch (error) {
    console.error('Error deleting schedule: ', error);
    throw error;
  }
};

export const getSchedules = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'schedules'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting schedules: ', error);
    throw error;
  }
};
