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
  getDocs
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
  if (user) {
    const q = query(collection(db, 'users'), where('role', '==', 'parent'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const parentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: `${doc.data().firstName} ${doc.data().lastName}`
      }));
      setParents(parentsData);
    });
    return () => unsubscribe();
  }
}, [user]);

useEffect(() => {
  if (user) {
    const q = query(collection(db, 'schedules'), where('userId', '==', user.uid));
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
    const scheduleData = {
      ...newSchedule,
      userId: user.uid,
      updatedAt: new Date(),
      status: user.role === 'admin' ? 'approved' : 'pending'
    };

    if (editingSchedule) {
      await updateDoc(doc(db, 'schedules', editingSchedule.id), scheduleData);
    } else {
      await addDoc(collection(db, 'schedules'), scheduleData);
    }

    if (user.role === 'parent') {
      await addDoc(collection(db, 'notifications'), {
        type: 'schedule_change',
        userId: user.uid,
        scheduleData,
        createdAt: new Date(),
        status: 'pending'
      });
      alert('Schedule change submitted for approval.');
    } else {
      setSchedules([...schedules, scheduleData]);
    }

    setNewSchedule({ day: '', dropOffTime: '', pickUpTime: '', parent: '', activity: 'School', 
otherActivity: '' });
    setEditingSchedule(null);
    setChangesWereMade(true);

    // Add this line to call autoAssignWeekdays
    await autoAssignWeekdays();

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
              Activity: {schedule.activity === 'Other' ? schedule.otherActivity : schedule.activity}
            </>
          ) : (
            'Not assigned'
          )}
        </div>
        {schedule && (
          <div className="schedule-actions">
            <button onClick={() => handleEdit(schedule)}>Edit</button>
            <button onClick={() => handleDelete(schedule.id)}>Delete</button>
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
        <h4>New parent sign-up: {notification.email || 'Email not provided'}</h4>
        <p>Name: {notification.firstName || ''} {notification.lastName || ''}</p>
        <p>Address: {notification.address || 'Address not provided'}</p>
        <p>Phone: {notification.phone || 'Phone not provided'}</p>
        <p>Children: {notification.children && notification.children.length > 0 
          ? notification.children.map(child => child.name).join(', ')
          : 'No children listed'}
        </p>
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
