import axios from "axios";
import React, { useState, useEffect } from 'react';
import logo from './assets/images/logo2.svg';
import './App.css';

function App() {
    React.isValidElement(null);
	const [randomQuote, setRandomQuote] = useState([{id:0,nickname:'unknown',avatar:'invisible'}]);

    const update = () => {
        axios
            .get("/api/orders")
            .then((res) => {
                setRandomQuote(res.data);
            });
    };

    //useEffect(update, []);
    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    Edit <code>src/App.js</code> and save to reload.
                </p>
				<div>
					<button className="btn btn-secondary" onClick={update}>Get Players</button>
				</div>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React
                </a>
				  <div>
					<ul>
					{randomQuote.map((item,i) => <li key={i}>{i}:{item.nickname}</li>)}
					</ul>
				  </div>
            </header>
        </div>
    );
}

export default App;