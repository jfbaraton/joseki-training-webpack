import axios from "axios";
import "./assets/scss/dom-renderer.scss";
import "./assets/scss/renderer-cancel-button.scss";
import "./assets/scss/svg-renderer.scss";
import "./assets/css/App.css";
import logo from './assets/images/logo2.svg';

function App() {
    const update = () => {
        axios
            .get("/api/orders")
            .then((res) => {
                //setRandomQuote(res.data);
                console.log('server responded',res.data);
            });
    };
}

export default App;