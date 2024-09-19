import React, { useState, useEffect } from 'react';
import { getParents, addParent, updateParent, deleteParent } from 
'../utils/db';

function AdminDashboard() {
  const [parents, setParents] = useState([]);
  const [newParent, setNewParent] = useState({ name: '', email: '', phone: 
'', address: '' });

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    const fetchedParents = await getParents();
    setParents(fetchedParents);
  };

  const handleAddParent = async (e) => {
    e.preventDefault();
    await addParent(newParent);
    setNewParent({ name: '', email: '', phone: '', address: '' });
    fetchParents();
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <h3>Add New Parent</h3>
      <form onSubmit={handleAddParent}>
        <input
          type="text"
          placeholder="Name"
          value={newParent.name}
          onChange={(e) => setNewParent({...newParent, name: 
e.target.value})}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={newParent.email}
          onChange={(e) => setNewParent({...newParent, email: 
e.target.value})}
          required
        />
        <input
          type="tel"
          placeholder="Phone"
          value={newParent.phone}
          onChange={(e) => setNewParent({...newParent, phone: 
e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Address"
          value={newParent.address}
          onChange={(e) => setNewParent({...newParent, address: 
e.target.value})}
          required
        />
        <button type="submit">Add Parent</button>
      </form>

      <h3>Parents List</h3>
      <ul>
        {parents.map(parent => (
          <li key={parent.id}>
            {parent.name} - {parent.email} - {parent.phone}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminDashboard;
