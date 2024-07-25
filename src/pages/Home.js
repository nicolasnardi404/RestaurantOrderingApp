import React from 'react';
import '../App.css';
import CsvUpload from '../components/CsvUpload'; // Adjust the import path based on your file structure

function Home() {
  return (
    <div className="App">
      <CsvUpload />
    </div>
  );
}

export default Home;