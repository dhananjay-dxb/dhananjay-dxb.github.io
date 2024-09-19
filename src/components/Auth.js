import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { setDoc, doc, collection, addDoc, getDoc } from 'firebase/firestore';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('parent');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [spouseFirstName, setSpouseFirstName] = useState('');
  const [spouseLastName, setSpouseLastName] = useState('');
  const [children, setChildren] = useState([{ name: '' }]);
  const [error, setError] = useState(null);

const handleSignUp = async (e) => {
  e.preventDefault();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userData = {
      email,
      role,
      firstName,
      lastName,
      address,
      phone,
      spouseFirstName,
      spouseLastName,
      children: children.filter(child => child.name.trim() !== ''),
      approved: role === 'admin' // Admins are automatically approved
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    if (role === 'parent') {
      await addDoc(collection(db, 'notifications'), {
        type: 'new_parent_signup',
        userId: user.uid,
        ...userData,
        createdAt: new Date(),
        status: 'pending'
      });
      alert('Sign-up successful. Please wait for admin approval before logging in.');
      await signOut(auth);
    } else {
      alert('Admin account created successfully!');
    }
  } catch (error) {
    setError(error.message);
  }
};

const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    const userData = userDoc.data();
    if (userData.role === 'parent' && !userData.approved) {
      alert('Your account is pending approval. Please wait for admin approval.');
      await auth.signOut();
    }
  } catch (error) {
    setError(error.message);
  }
};

  return (
    <div>
      <h2>Authentication</h2>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <form onSubmit={handleSignUp}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="parent">Parent</option>
          <option value="admin">Admin</option>
        </select>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          required
        />
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          required
        />
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
          required
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          required
        />
        <input
          type="text"
          value={spouseFirstName}
          onChange={(e) => setSpouseFirstName(e.target.value)}
          placeholder="Spouse First Name"
        />
        <input
          type="text"
          value={spouseLastName}
          onChange={(e) => setSpouseLastName(e.target.value)}
          placeholder="Spouse Last Name"
        />
        {children.map((child, index) => (
          <input
            key={index}
            type="text"
            value={child.name}
            onChange={(e) => {
              const newChildren = [...children];
              newChildren[index].name = e.target.value;
              setChildren(newChildren);
            }}
            placeholder={`Child ${index + 1} Name`}
          />
        ))}
        {children.length < 3 && (
          <button type="button" onClick={() => setChildren([...children, { name: '' }])}>
            Add Child
          </button>
        )}
        <button type="submit">Sign Up</button>
      </form>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Auth;
