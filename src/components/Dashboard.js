import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  getDocs,
  getDoc
} from 'firebase/firestore';
import MyCalendar from './Calendar';
import './Dashboard.css';
import { signOut } from 'firebase/auth';
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const activities = ['School', 'Football Club', 'Swimming', 'Other'];

function Dashboard() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [parents, setParents] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    day: '',
    dropOffTime: '',
    pickUpTime: '',
    parent: '',
    activity: 'School',
    otherActivity: ''
  });
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [changesWereMade, setChangesWereMade] = useState(false);
  const [notifications, setNotifications] = useState([]);

useEffect(() => {
  const fetchParents = async () => {
    const q = query(collection(db, 'users'), where('role', '==', 'parent'));
    const querySnapshot = await getDocs(q);
    const parentsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: `${doc.data().firstName} ${doc.data().lastName}`
    }));
    setParents(parentsList);
  };

  fetchParents();
}, []);

useEffect(() => {
  if (user) {
    const q = query(collection(db, 'schedules'), where('status', '==', 'approved'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const schedulesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchedules(schedulesData);
    });
    return () => unsubscribe();
  }
}, [user]);

useEffect(() => {
  if (user && user.role === 'admin') {
    const q = query(collection(db, 'notifications'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notificationsData);
    });
    return () => unsubscribe();
  }
}, [user]);
const handleSignOut = () => {
  auth.signOut();
};
const autoAssignWeekdays = async () => {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const assignedDays = schedules.map(s => s.day);
  const unassignedDays = weekdays.filter(day => !assignedDays.includes(day));
  
  if (unassignedDays.length > 0 && parents.length > 0) {
    let parentIndex = 0;
    for (const day of unassignedDays) {
      const parent = parents[parentIndex % parents.length].name;
      try {
        await addDoc(collection(db, 'schedules'), {
          day,
          dropOffTime: '08:00',
          pickUpTime: '15:00',
          parent,
          userId: user.uid,
          activity: 'School',
          status: 'approved',
          createdAt: new Date(),
          isAutoAssigned: true
        });
      } catch (error) {
        console.error('Error auto-assigning schedule:', error);
      }
      parentIndex++;
    }
    alert('Unassigned weekdays have been auto-assigned.');
    // Refresh schedules
    const q = query(collection(db, 'schedules'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    setSchedules(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }
};
const handleApproval = async (notificationId, userId, approved) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    const notificationSnap = await getDoc(notificationRef);
    const notificationData = notificationSnap.data();

    if (notificationData.type === 'new_parent_signup') {
      await updateDoc(doc(db, 'users', userId), { approved });
    } else if (notificationData.type === 'schedule_change') {
      if (approved) {
        // If approved, add or update the schedule
        const scheduleData = notificationData.scheduleData;
        if (scheduleData.id) {
          await updateDoc(doc(db, 'schedules', scheduleData.id), { ...scheduleData, status: 'approved' 
});
        } else {
          await addDoc(collection(db, 'schedules'), { ...scheduleData, status: 'approved' });
        }
      }
      // You might want to notify the parent about the approval/denial here
    }

    await updateDoc(notificationRef, { status: 'processed' });
    alert(`Request ${approved ? 'approved' : 'denied'}`);
  } catch (error) {
    console.error('Error processing approval:', error);
  }
};
  
const handleAddOrUpdateSchedule = async (e) => {
  e.preventDefault();
  try {
    const scheduleData = {
      ...newSchedule,
      userId: user.uid,
      updatedAt: new Date(),
      status: user.role === 'admin' ? 'approved' : 'pending'
    };

    if (user.role === 'parent') {
      // For parents, create a new notification instead of updating the schedule directly
      await addDoc(collection(db, 'notifications'), {
        type: 'schedule_change',
        userId: user.uid,
        scheduleData,
        createdAt: new Date(),
        status: 'pending'
      });
      alert('Schedule change request submitted for approval.');
    } else {
      // For admins, update the schedule directly
      if (editingSchedule) {
        await updateDoc(doc(db, 'schedules', editingSchedule.id), scheduleData);
      } else {
        await addDoc(collection(db, 'schedules'), scheduleData);
      }
      setSchedules([...schedules, scheduleData]);
    }

    setNewSchedule({ day: '', dropOffTime: '', pickUpTime: '', parent: '', activity: 'School', 
otherActivity: '' });
    setEditingSchedule(null);
    setChangesWereMade(true);
  } catch (error) {
    console.error('Error adding/updating schedule:', error);
  }
};

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setNewSchedule({
      day: schedule.day,
      dropOffTime: schedule.dropOffTime,
      pickUpTime: schedule.pickUpTime,
      parent: schedule.parent,
      activity: schedule.activity,
      otherActivity: schedule.otherActivity || ''
    });
  };

  const handleDelete = async (scheduleId) => {
  if (window.confirm('Are you sure you want to delete this schedule?')) {
    try {
      await deleteDoc(doc(db, 'schedules', scheduleId));
      setChangesWereMade(true);
      // Add this line to call autoAssignWeekdays
      await autoAssignWeekdays();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  }
};

  const handleSubmitChanges = async () => {
    // Implement the logic for submitting changes
    setChangesWereMade(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p>Welcome, {user.email}! You are logged in as a {user.role}.</p>
      
      {user.role === 'admin' && (
        <div>
          <h3>Admin Functions</h3>
          {/* Add admin-specific functions here */}
        </div>
      )}
      
      <h3>{editingSchedule ? 'Edit' : 'Add New'} Schedule</h3>
      <form onSubmit={handleAddOrUpdateSchedule} className="schedule-form">
        <label>
          Day:
          <select
            value={newSchedule.day}
            onChange={(e) => setNewSchedule({...newSchedule, day: e.target.value})}
            required
          >
            <option value="">Select Day</option>
            {daysOfWeek.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </label>
        <label>
          Drop-off Time:
          <input
            type="time"
            value={newSchedule.dropOffTime}
            onChange={(e) => setNewSchedule({...newSchedule, dropOffTime: e.target.value})}
            required
          />
        </label>
        <label>
          Pick-up Time:
          <input
            type="time"
            value={newSchedule.pickUpTime}
            onChange={(e) => setNewSchedule({...newSchedule, pickUpTime: e.target.value})}
            required
          />
        </label>
       <label>
         Parent:
         <select
          value={newSchedule.parent}
          onChange={(e) => setNewSchedule({...newSchedule, parent: e.target.value})}
          required
       >
        <option value="">Select Parent</option>
        {parents.map(parent => (
         <option key={parent.id} value={parent.name}>{parent.name}</option>
      ))}
    </select>
   </label>
   <label>
          Activity:
          <select
            value={newSchedule.activity}
            onChange={(e) => setNewSchedule({...newSchedule, activity: e.target.value})}
            required
          >
            {activities.map(activity => (
              <option key={activity} value={activity}>{activity}</option>
            ))}
          </select>
        </label>
        {newSchedule.activity === 'Other' && (
          <label>
            Specify Other Activity:
            <input
              type="text"
              value={newSchedule.otherActivity}
              onChange={(e) => setNewSchedule({...newSchedule, otherActivity: e.target.value})}
              placeholder="Specify activity"
              required
            />
          </label>
        )}
        <button type="submit">{editingSchedule ? 'Update' : 'Add'} Schedule</button>
        {editingSchedule && (
          <button type="button" onClick={() => {
            setEditingSchedule(null);
            setNewSchedule({ day: '', dropOffTime: '', pickUpTime: '', parent: '', activity: 'School', 
otherActivity: '' });
          }}>
            Cancel Edit
          </button>
        )}
      </form>

      <h3>Your Schedules</h3>
      <div className="schedules-list">
  {daysOfWeek.map((day) => {
    const schedule = schedules.find(s => s.day === day);
    return (
      <div key={day} className="schedule-item">
        <div className="schedule-info">
          <strong>{day}:</strong>{' '}
          {schedule ? (
            <>
              Drop-off: {schedule.dropOffTime},
              Pick-up: {schedule.pickUpTime},
              Parent: {schedule.parent},
              Activity: {schedule.activity === 'Other' ? schedule.otherActivity : schedule.activity}
            </>
          ) : (
            'Not assigned'   
          )}
        </div>
        {schedule && (
          <div className="schedule-actions">
            <button className="edit-btn" onClick={() => handleEdit(schedule)}>Edit</button>
            <button className="delete-btn" onClick={() => handleDelete(schedule.id)}>Delete</button>
          </div>
        )}
      </div>
    );
  })}
</div>
              
{changesWereMade && (
  <button onClick={handleSubmitChanges} className="submit-changes-btn">
    Submit Changes
  </button>
)}
      
      <MyCalendar schedules={schedules} />
      
      <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
{user.role === 'admin' && notifications.length > 0 && (
  <div>
    <h3>Pending Approvals</h3>
    {notifications.map(notification => (
      <div key={notification.id}>
        {notification.type === 'new_parent_signup' ? (
          <>
            <h4>New parent sign-up: {notification.email}</h4>
            <p>Name: {notification.firstName} {notification.lastName}</p>
            <p>Address: {notification.address}</p>
            <p>Phone: {notification.phone}</p>
            <p>Children: {notification.children.map(child => child.name).join(', ')}</p>
          </>
        ) : notification.type === 'schedule_change' && (
          <>
            <h4>Schedule Change Request</h4>
            <p>Parent: {notification.scheduleData.parent}</p>
            <p>Day: {notification.scheduleData.day}</p>
            <p>Drop-off: {notification.scheduleData.dropOffTime}</p>
            <p>Pick-up: {notification.scheduleData.pickUpTime}</p>
            <p>Activity: {notification.scheduleData.activity}</p>
          </>
        )}
        <button onClick={() => handleApproval(notification.id, notification.userId, true)}>
          Approve
        </button>
        <button onClick={() => handleApproval(notification.id, notification.userId, false)}>
          Deny
        </button>
      </div>
    ))}
  </div>
)}
  </div>
  );
}

export default Dashboard;
