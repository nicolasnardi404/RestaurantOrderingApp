import React from "react"

export default function Form(){

    return(
        <div>
        <form action="/Form" method="GET">
        <label for="name">Nome:</label>
        <input type="text" id="name" name="name"></input>
        <br></br><br></br>
        <label for="name">Email:</label>
        <input type="text" id="email" name="email"></input>
        <br></br><br></br>
        <input type="submit" id="submit" name="submit"></input>
        </form>
        </div>
    )
}