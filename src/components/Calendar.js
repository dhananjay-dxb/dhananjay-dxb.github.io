import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMinutes, setHours, setMinutes } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Function to generate a color based on a string (parent name)
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

const MyCalendar = ({ schedules }) => {
  const events = schedules.flatMap(schedule => {
    if (!schedule || !schedule.day || !schedule.dropOffTime || !schedule.pickUpTime || 
!schedule.parent) {
      console.warn('Invalid schedule object:', schedule);
      return []; // Skip this schedule
    }

    const date = new Date();
    const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 
'Saturday'].indexOf(schedule.day);
    if (dayIndex === -1) {
      console.warn('Invalid day in schedule:', schedule.day);
      return []; // Skip this schedule
    }
    date.setDate(date.getDate() + (dayIndex + 7 - date.getDay()) % 7);
    
    const createEvent = (time, type) => {
      const [hours, minutes] = time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        console.warn(`Invalid ${type} time:`, time);
        return null; // Skip this event
      }
      const start = new Date(date);
      start.setHours(hours, minutes, 0);
      return {
        title: `${type}: ${schedule.parent}`,
        start,
        end: addMinutes(start, 30),
        parent: schedule.parent,
        type
      };
    };

    const dropOffEvent = createEvent(schedule.dropOffTime, 'Drop-off');
    const pickUpEvent = createEvent(schedule.pickUpTime, 'Pick-up');

    return [dropOffEvent, pickUpEvent].filter(Boolean); // Remove null events
  });

  const eventStyleGetter = (event) => {
    const backgroundColor = stringToColor(event.parent);
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  // Find the earliest and latest times in the schedules
  const times = events.flatMap(event => [event.start, event.end]);
  const minTime = times.reduce((min, time) => time < min ? time : min, times[0]);
  const maxTime = times.reduce((max, time) => time > max ? time : max, times[0]);

  // Round to nearest hour
  const min = setMinutes(setHours(new Date(), minTime.getHours()), 0);
  const max = setMinutes(setHours(new Date(), maxTime.getHours() + 1), 0);

  return (
    <div style={{ height: '500px' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        eventPropGetter={eventStyleGetter}
        views={['week']}
        defaultView='week'
        min={min}
        max={max}
      />
    </div>
  );
};

export default MyCalendar;
