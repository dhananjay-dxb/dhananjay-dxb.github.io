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
  deleteDoc
} from 'firebase/firestore';
import MyCalendar from './Calendar';
import './Dashboard.css';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const activities = ['School', 'Football Club', 'Swimming', 'Other'];

function Dashboard() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
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
const handleApproval = async (notificationId, userId, approved) => {
  try {
    await updateDoc(doc(db, 'users', userId), { approved });
    await updateDoc(doc(db, 'notifications', notificationId), { status: 'processed' });
    // TODO: Send email notification to the user
    alert(`User ${approved ? 'approved' : 'denied'}`);
  } catch (error) {
    console.error('Error processing approval:', error);
  }
};
  const handleAddOrUpdateSchedule = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await updateDoc(doc(db, 'schedules', editingSchedule.id), {
          ...newSchedule,
          userId: user.uid,
          updatedAt: new Date(),
          isAutoAssigned: false
        });
        setEditingSchedule(null);
      } else {
        const existingSchedule = schedules.find(s => s.day === newSchedule.day);
        if (existingSchedule) {
          const confirmOverwrite = window.confirm(`This day is already assigned. Do you want to 
overwrite it?`);
          if (confirmOverwrite) {
            await updateDoc(doc(db, 'schedules', existingSchedule.id), {
              ...newSchedule,
              userId: user.uid,
              updatedAt: new Date(),
              isAutoAssigned: false
            });
          } else {
            return;
          }
        } else {
          await addDoc(collection(db, 'schedules'), {
            ...newSchedule,
            userId: user.uid,
            createdAt: new Date(),
            isAutoAssigned: false
          });
        }
      }
      setNewSchedule({ day: '', dropOffTime: '', pickUpTime: '', parent: '', activity: 'School', 
otherActivity: '' });
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
          <input
            type="text"
            value={newSchedule.parent}
            onChange={(e) => setNewSchedule({...newSchedule, parent: e.target.value})}
            placeholder="Parent Name"
            required
          />
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
                    Activity: {schedule.activity === 'Other' ? schedule.otherActivity : 
schedule.activity}
                    {schedule.isAutoAssigned && ' (Auto-assigned)'}
                  </>
                ) : (
                  'Not assigned'
                )}
              </div>
              {schedule && (
                <div className="schedule-buttons">
                  <button className="edit-btn" onClick={() => handleEdit(schedule)}>Edit</button>
                  <button className="delete-btn" onClick={() => 
handleDelete(schedule.id)}>Delete</button>
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
        <p>New parent sign-up: {notification.userId}</p>
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
