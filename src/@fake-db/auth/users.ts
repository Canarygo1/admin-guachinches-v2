// ** Types
import { UserDataType } from 'src/context/types'

/**
 * Usuarios y secreto del login del panel (plantilla Materio: el login se
 * resuelve en el navegador con axios-mock-adapter, ver ./jwt.ts).
 *
 * Se extraen aquí para que las rutas API del servidor (p. ej. /api/push)
 * puedan verificar el `accessToken` con el mismo secreto. OJO: este módulo
 * también va en el bundle del cliente, así que el secreto NO es secreto; ver
 * src/server/adminSession.ts.
 */
export const users: UserDataType[] = [
  {
    id: 1,
    role: 'admin',
    password: 'Teide/02',
    fullName: 'John Doe',
    username: 'johndoe',
    email: 'tjpubliccomunity@gmail.com'
  },
  {
    id: 2,
    role: 'client',
    password: 'client',
    fullName: 'Jane Doe',
    username: 'janedoe',
    email: 'client@materio.com'
  }
]

// ! These two secrets should be in .env file and not in any other file
export const jwtConfig = {
  secret: 'dd5f3089-40c3-403d-af14-d0c228b05cb4',
  refreshTokenSecret: '7c4c1c50-3230-45bf-9eae-c9b2e401c767'
}
