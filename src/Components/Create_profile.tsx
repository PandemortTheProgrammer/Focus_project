export default function CreateProfile() {
    return (
        <div>
            <h1>Crear un nuevo perfil</h1>
            <div>
                <p>
                    <label htmlFor="">Identificate por un nickname:</label>
                </p>
                <p>
                    <input type="text" placeholder="Nickame"/>
                </p>
                <p>
                    <label htmlFor="">Rango de edad:</label>
                </p>
                <p>
                    <select name="" id="">
                        <option value="">15-17</option>
                        <option value="">18-21</option>
                    </select>
                </p>
                <p>
                    <label htmlFor="">Establece tu enfoque:</label>
                </p>
                <p>
                    <select name="" id="">
                        <option value="">Enfoque1</option>
                        <option value="">Enfoque2</option>
                        <option value="">Enfoque3</option>
                    </select>
                </p>
            </div>
        </div>
    )
}