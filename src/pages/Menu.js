import React from 'react';
import '../App.css';
import DisplayMenu from "../components/DisplayMenu"
import UserMenu from '../components/UserMenu';

export default function Menu() {
  return (
    <div>
      <UserMenu />
      <DisplayMenu />
    </div>
  );
}
