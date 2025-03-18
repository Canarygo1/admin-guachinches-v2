import React, { useState } from 'react';
import BlankLayout from '../../@core/layouts/BlankLayout';

function DeleteAccount() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const handleDelete = () => {
    if (!email || !password) {
      setConfirmation('Por favor, ingrese ambos campos.');
      return;
    }

    setTimeout(() => {
      setConfirmation(`La cuenta asociada con el correo ${email} ha sido eliminada (simulado).`);
      setEmail('');
      setPassword('');
    }, 1000);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '1rem', textAlign: 'center', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Eliminar Cuenta</h2>
      <form onSubmit={handleDelete}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email">Correo Electrónico:</label><br />
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ingrese su correo"
            style={{ padding: '0.5rem', width: '100%' }}
            required
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password">Contraseña:</label><br />
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingrese su contraseña"
            style={{ padding: '0.5rem', width: '100%' }}
            required
          />
        </div>
        <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Eliminar Cuenta
        </button>
      </form>
      {confirmation && <p style={{ marginTop: '1rem', color: 'green' }}>{confirmation}</p>}
    </div>
  );
}

DeleteAccount.getLayout = (page:any) => <BlankLayout>{page}</BlankLayout>;

export default DeleteAccount;
