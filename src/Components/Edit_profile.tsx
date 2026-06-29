export default function EditProfile() {
    return (
        <div>
            <h1>Editar tu perfil</h1>
            <div>
                <p>
                    <label htmlFor="">Identificate por un nickname:</label>
                </p>
                <p>
                    <input type="text" placeholder="Nickame"/>
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
                <p>
                    <button>Guardar cambios</button>
                </p>
            </div>
        </div>
    )
}