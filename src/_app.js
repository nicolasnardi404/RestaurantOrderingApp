// _app.js
import { PrimeReactProvider } from 'primereact/api';
import { Button } from 'primereact/button';   
import "primereact/resources/themes/lara-light-cyan/theme.css";

// _app.js
export default function MyApp() {
    return (
        <PrimeReactProvider>
            <Button onClick={() => alert("Clicked")}>Click Me</Button>
        </PrimeReactProvider>
    );
}
