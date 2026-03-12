import { useState } from 'react'
import './App.css'

function App() {
    const [status, setStatus] = useState<string>("not connected yet")
    const [password, setPassword] = useState('')
    const [login, setLogin] = useState('Not logged in')
    const [user, setUser] = useState('User')
    const [artists, setArtists] = useState<{ id: number; name: string}[]>([])
    const [artistsError, setArtistsError] = useState<string | null>(null)

    const handleLogin = async () => {
        setLogin('Logging in...')

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: password
                }),
            })

            if (response.ok) {
                setLogin('Successfully logged in.')
            } else {
                setLogin(`Failed to login. Returned status: ${response.status}`)
            }
        } catch (error) {
            console.error(error)
            setLogin('Network error: Could not reach Go server')
        }
    }

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                setLogin('Successfully logged out.')
            } else {
                setLogin(`Failed to logout. Returned status: ${response.status}`)
            }
        } catch (error) {
            console.error(error)
            setLogin('Network error: Could not reach Go server')
        }
    }

    const handleHealth = () => {
        fetch('/healthz')
        .then(res => {
            if (!res.ok) {
                throw new Error('Server responded with an error');
            }
            return res.text();
        })
        .then(text => {
            setStatus(`Server is ${text}`);
        })
        .catch(err => {
            console.error("Connection failed:", err);
            setStatus('Server is offline');
      })
    };

    const handleUser = () => {
        fetch('/api/me')
        .then(res => {
            if (!res.ok) {
                throw new Error('Server responded with an error');
            }
            return res.text();
        })
        .then(text => {
            setUser(`User ${text}`);
        })
        .catch(err => {
            console.error("Connection failed:", err);
            setUser('Failed to get user');
      })
    };

    const handleLoadArtists = async () => {
        try {
            const resp = await fetch('/api/artists', { credentials: 'include' })
            if (!resp.ok) {
                setArtistsError(`Failed: ${resp.status}`)
                return
            }
            const data = await resp.json() as { artists: { id: number, name: string }[] }
            setArtists(data.artists)
        } catch (err) {
            console.error(err)
            setArtistsError('Network error')
        }
    }


  return (
    <>
      <h2> Health check </h2>
      <div className="card">
        <button onClick={handleHealth}>
          Click for health api endpoint status: {status}
        </button>
      </div>

      <h1> Login status: {login} </h1>
      <h2> {user} </h2>
      <button onClick={handleUser}>
        Click to get user
      </button>

      <h2> Login check </h2>
      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>
        Log in
      </button>

      <h2> Logout check </h2>
      <button onClick={handleLogout}>
        Log out
      </button>

      <h2> Artists </h2>
      <button onClick={handleLoadArtists}>
        Click to list available artists
      </button>
      {artistsError && <p style={{ color: 'red' }}>{artistsError}</p>}
      <ul>
        {artists.map((artist) => (
          <li key={artist.id}>{artist.name}</li>
        ))}
      </ul>
    </>
  )
}

export default App
