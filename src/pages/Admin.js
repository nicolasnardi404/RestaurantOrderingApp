import React, { useState, useEffect } from "react";
import UserMenu from "../components/UserMenu";
import AdminPage from "../components/AdminPage";


export default function Admin() {

    return (
        <div className="App">
            <UserMenu />
            <AdminPage />
        </div>
    );
}
