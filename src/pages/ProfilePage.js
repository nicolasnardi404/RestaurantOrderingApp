import React from 'react';
import '../styles/ProfilePage.css';
import ProfilePage from '../components/ProfileComponent';
import UserMenu from '../components/UserMenu';

export default function Menu() {
  return (
    <div>
      <UserMenu />
      <ProfilePage />
    </div>
  );
}
