import { useState } from 'react'
import './App.css'

function App() {
    const [status, setStatus] = useState<string>("not connected yet")
    const [password, setPassword] = useState('')
    const [login, setLogin] = useState('Not logged in')
    const [user, setUser] = useState('User')
    const [artists, setArtists] = useState<{ id: number; name: string}[]>([])
    const [artistsError, setArtistsError] = useState<string | null>(null)
    const [albums, setAlbums] = useState<{ id: number; title: string; year: number }[]>([])
    const [albumsError, setAlbumsError] = useState<string | null>(null)
    const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null)

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

    const handleLoadAlbums = async (artistId: number) => {
        try {
            const resp = await fetch(`/api/artists/${artistId}/albums`, { credentials: 'include' })
            if (!resp.ok) {
                setAlbumsError(`Failed: ${resp.status}`)
                return
            }
            const data = await resp.json() as { albums: { id: number, title: string, year: number }[] }
            setAlbums(data.albums)
        } catch (err) {
            console.error(err)
            setAlbumsError('Network error')
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
      <h2> Albums </h2>
      <input
        type="number"
        placeholder="Artist ID"
        value={selectedArtistId ?? ''}
        onChange={(e) => setSelectedArtistId(e.target.value ? Number(e.target.value) : null)}
      />
      <button
        onClick={() => {
          const id = Number(selectedArtistId)
          if (!Number.isNaN(id) && id > 0) {
            handleLoadAlbums(id)
          } else {
            setAlbumsError('Please enter a valid artist ID')
          }
        }}
        >
        Load albums for artist
      </button>
        {albumsError && <p style={{ color: 'red' }}>{albumsError}</p>}
        <ul>
        {albums.map((album) => (
            <li key={album.id}>{album.title} ({album.year})</li>
        ))}
        </ul>
    </>
  )
}

export default App
