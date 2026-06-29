
import { useNavigate } from "react-router-dom"

export default function Download() {
    const navigate = useNavigate()
    return(
        <div>
            <p>No deberías estar por aquí...</p>
            <button
          onClick={() => navigate('/dashboard')}>
          Regresar
        </button>
        </div>
    )
}