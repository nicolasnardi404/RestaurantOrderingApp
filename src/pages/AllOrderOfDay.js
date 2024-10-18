import React from "react";
import "../App.css";
import UserMenu from "../components/UserMenu";
import AllOrdersOfDayComponent from "../components/AllOrdersOfDayComponent";

export default function AllOrderOfDay() {
  return (
    <div className="App">
      <UserMenu />
      <AllOrdersOfDayComponent />
    </div>
  );
}
