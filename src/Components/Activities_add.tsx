export default function ActivitiesAdd() {
    return (
        <div>
            <div>
                <h1>Agregar Actividad</h1>
            </div>
            <div>
                <div>
                    <p>
                        <label htmlFor="nombre">Actividad realizada:</label>
                    </p>
                    <p>
                        <select name="nombre" id="">
                            <option value="">-- Seleccione --</option>
                            <option value="actividad1">Actividad 1</option>
                            <option value="actividad2">Actividad 2</option>
                            <option value="actividad3">Actividad 3</option>
                        </select>
                    </p>
                    <p>
                        <label htmlFor="hora">Hora de inicio de actividad:</label>
                        <input type="time" name="hora" id="hora" />
                    </p>
                    <p>
                        <label htmlFor="duracion">Duración de la actividad (en minutos):</label>
                    </p>
                    <p>
                        <button>-5</button>
                        <label>0:00</label>
                        <button>+10</button>
                        <button>+15</button>
                        <button>+30</button>
                    </p>
                </div>
                <div>
                    <p>
                        <label htmlFor="Descripcion">Descripción de la actividad:</label>
                    </p>
                    <p>
                        <textarea name="Descripcion" id="Descripcion" placeholder="Descripción de actividad"></textarea>
                    </p>
                    <div>
                        <button>Registrar actividad</button>
                        <button>Volver</button>
                    </div>
                </div>
            </div>
        </div>
    )
}