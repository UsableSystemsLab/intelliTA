import { auth } from '../firebase';

const Home = ({ user }) => {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Welcome to IntelliTA</h1>

      {user ? (
        <div>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
            You are logged in as: <strong>{user.email}</strong>
          </p>
          <button
            onClick={() => auth.signOut()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5558e3'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6366f1'}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
            Please <a href="/auth" style={{ color: '#6366f1', fontWeight: '600' }}>login</a> to continue.
          </p>
        </div>
      )}
    </div>
  );
};

export default Home;
