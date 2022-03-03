import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Page from '../Common/Page';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    fetch(process.env.REACT_APP_SERVICE_URL + 'login', {
      method: 'POST',
      body: JSON.stringify({
        email: email,
        password: password,
      }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      console.log(res);
      if (res.status === 200) {
        navigate('/');
      } else {
        throw res.text();
      }
    })
    .catch(err => {
      console.error(err);
      alert('Error logging in please try again');
    });
  }

  return (
    <Page title={'Log In'}>
      <>
        <form onSubmit={onSubmit}>
          <div>
            <input
              type='email'
              name='email'
              placeholder='Enter email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{color: 'rgb(0, 0, 0)'}}
              required
            />
          </div>
          <div>
            <input
              type='password'
              name='password'
              placeholder='Enter password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{color: 'rgb(0, 0, 0)'}}
              required
            />
          </div>
          <button type='submit'>LOG IN</button>
        </form>
        <div><Link to='/signup'>SIGN UP</Link></div>
      </>
    </Page>
  );
}