import React, { useState } from 'react';
import { auth, setUserRole } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('parent');
  const [error, setError] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setUserRole(userCredential.user.uid, role);
      alert('User created successfully!');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <h2>Authentication</h2>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <form>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="parent">Parent</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={handleSignUp}>Sign Up</button>
        <button onClick={handleLogin}>Login</button>
      </form>
    </div>
  );
}

export default Auth;
