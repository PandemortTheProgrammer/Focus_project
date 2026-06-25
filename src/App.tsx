import { useEffect } from 'react';
import { inicializarBaseDeDatos } from './services/db';

export default function App(){
    useEffect(() => {
        inicializarBaseDeDatos();
    }, []);

    return (
        <div>
            <h1>Hola Mundo</h1>
        </div>
    )
}
