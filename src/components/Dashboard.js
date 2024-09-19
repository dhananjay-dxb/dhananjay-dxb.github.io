import MyCalendar from './Calendar';
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, deleteDoc } from 
'firebase/firestore';
import './Dashboard.css';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const activities = ['School', 'Football Club', 'Swimming', 'Other'];
const { user } = useAuth();

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

  const handleSignOut = () => {
    auth.signOut();
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
const autoAssignUnassignedDays = async () => {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const assignedDays = schedules.map(s => s.day);
  const unassignedWeekdays = weekdays.filter(day => !assignedDays.includes(day));
  const parents = [...new Set(schedules.map(s => s.parent))];

  if (unassignedWeekdays.length > 0 && parents.length > 0) {
    let parentIndex = 0;
    for (const day of unassignedWeekdays) {
      const parent = parents[parentIndex % parents.length];
      await addDoc(collection(db, 'schedules'), {
        day,
        dropOffTime: '08:00',
        pickUpTime: '15:00',
        parent,
        activity: 'School',
        userId: user.uid,
        createdAt: new Date(),
        isAutoAssigned: true
      });
      parentIndex++;
    }
  }
  setChangesWereMade(false);
};
const handleSubmitChanges = async () => {
  if (changesWereMade) {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const assignedDays = schedules.map(s => s.day);
    const unassignedWeekdays = weekdays.filter(day => !assignedDays.includes(day));
    
    if (unassignedWeekdays.length > 0) {
      const confirmAutoAssign = window.confirm(`There are ${unassignedWeekdays.length} unassigned 
weekdays. Do you want to auto-assign them?`);
      if (confirmAutoAssign) {
        await autoAssignUnassignedDays();
      }
    }
    setChangesWereMade(false);
  }
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
      {/* Your form inputs here */}
    </form>

    <h3>Your Schedules</h3>
    <div className="schedules-list">
      {/* Your schedules list here */}
    </div>
    
    {changesWereMade && (
      <button onClick={handleSubmitChanges} className="submit-changes-btn">
        Submit Changes
      </button>
    )}
    
    <MyCalendar schedules={schedules} />
    
    <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
  </div>
);
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
    Drop-off:
    <input
      type="time"
      value={newSchedule.dropOffTime}
      onChange={(e) => setNewSchedule({...newSchedule, dropOffTime: e.target.value})}
      required
    />
  </label>
  <label>
    Pick-up:
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
  <button type="submit">{editingSchedule ? 'Update' : 'Add'}</button>
  {editingSchedule && (
    <button type="button" onClick={() => {
      setEditingSchedule(null);
      setNewSchedule({ day: '', dropOffTime: '', pickUpTime: '', parent: '', activity: 'School', 
otherActivity: '' });
    }}>
      Cancel
    </button>
  )}
  {newSchedule.activity === 'Other' && (
    <label className="other-activity">
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
</form>

      <h3>Your Schedules</h3>
<div className="schedules-list">
  {daysOfWeek.map((day) => {
    const schedule = schedules.find(s => s.day === day);
    const isWeekend = day === 'Saturday' || day === 'Sunday';
    return (
      <div key={day} className={`schedule-item ${isWeekend ? 'weekend' : ''}`}>
        <div className="schedule-info">
          <strong>{day}:</strong>{' '}
          {schedule ? (
            <>
              Drop-off: {schedule.dropOffTime}, 
              Pick-up: {schedule.pickUpTime}, 
              Parent: {schedule.parent}, 
              Activity: {schedule.activity === 'Other' ? schedule.otherActivity : schedule.activity}
              {schedule.isAutoAssigned && ' (Auto-assigned)'}
            </>
          ) : (
            isWeekend ? 'Weekend - Not auto-assigned' : 'Not assigned'
          )}
        </div>
        {schedule && (
          <div className="schedule-buttons">
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
      
    <button onClick={handleSignOut} className="sign-out-btn">Sign Out</button>
    
    <MyCalendar schedules={schedules} />
  </div>
);
}

export default Dashboard;
