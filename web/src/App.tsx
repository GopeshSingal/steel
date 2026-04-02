import { useState, useEffect } from 'react'
import './App.css'

function App() {
    const [status, setStatus] = useState<string>("Not connected yet")
    const [password, setPassword] = useState('')
    const [login, setLogin] = useState('Not logged in')
    const [user, setUser] = useState('User')
    const [scan, setScan] = useState('Scan music library')
    const [artists, setArtists] = useState<{ id: number; name: string }[]>([])
    const [artistsError, setArtistsError] = useState<string | null>(null)
    const [albums, setAlbums] = useState<{ id: number; title: string; year: number }[]>([])
    const [albumsError, setAlbumsError] = useState<string | null>(null)
    const [loadedArtistId, setLoadedArtistId] = useState<number | null>(null)
    const [albumTracks, setAlbumTracks] = useState<{ [albumId: number]: { id: number; title: string }[] }>({})
    const [albumTracksError, setAlbumTracksError] = useState<string | null>(null)
    const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<{ id: number; title: string; artist?: string; album?: string }[]>([])
    const [searchError, setSearchError] = useState<string | null>(null)
    const [currentStreamTrackId, setCurrentStreamTrackId] = useState<number | null>(null)

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

    useEffect(() => {
        handleHealth();
        const intervalId = setInterval(handleHealth, 5000);
        return () => clearInterval(intervalId);
    }, []);

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

    const handleScan = async () => {
        try {
            const response = await fetch('/api/admin/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            if (response.ok) {
                setScan('Successfully scanned music library.')
            } else {
                setScan(`Failed to scan music library. Returned status: ${response.status}`)
            }
        } catch (error) {
            console.error(error)
            setScan('Network error: Could not reach Go server')
        }

    }

    const handleLoadArtists = async () => {
        if (artists.length > 0) {
            setArtists([])
            setArtistsError(null)
            return
        }
        try {
            const response = await fetch('/api/artists', { credentials: 'include' })
            if (!response.ok) {
                setArtistsError(`Failed: ${response.status}`)
                return
            }
            const data = await response.json() as { artists: { id: number, name: string }[] }
            setArtists(data.artists)
        } catch (err) {
            console.error(err)
            setArtistsError('Network error')
        }
    }

    const handleLoadAlbums = async (artistId: number) => {
        if (albums.length > 0 && loadedArtistId === artistId) {
            setAlbums([])
            setAlbumsError(null)
            setLoadedArtistId(null)
            return
        }
        try {
            const response = await fetch(`/api/artists/${artistId}/albums`, { credentials: 'include' })
            if (!response.ok) {
                setAlbumsError(`Failed: ${response.status}`)
                setAlbums([])
                setLoadedArtistId(null)
                return
            }
            const data = await response.json() as { albums: { id: number, title: string, year: number }[] }
            setAlbums(data.albums)
            setLoadedArtistId(artistId)
        } catch (err) {
            console.error(err)
            setAlbumsError('Network error')
            setAlbums([])
            setLoadedArtistId(null)
        }
    }

    const handleLoadAlbumTracks = async (albumId: number) => {
        if (albumTracks[albumId]) {
            setAlbumTracks(prev => {
                const next = { ...prev }
                delete next[albumId]
                return next
            })
            return
        }
        try {
            const response = await fetch(`/api/albums/${albumId}/tracks`, { credentials: 'include' })
            if (!response.ok) {
                setAlbumTracksError(`Tracks failed to load: ${response.status}`)
                return
            }
            const data = await response.json() as { tracks: { id: number, title: string }[] }
            setAlbumTracks(prev => ({ ...prev, [albumId]: data.tracks }))
        } catch (err) {
            console.error(err)
            setAlbumTracksError('Network error')
        }
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchError('Please enter a search query')
            return
        }
        setSearchResults([])
        setSearchError(null)
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, { credentials: 'include' })
            if (!response.ok) {
                setSearchError(`Search failed: ${response.status}`)
                return
            }
            const data = await response.json() as { tracks: { id: number, title: string, artist?: string, album?: string }[] }
            if (data.tracks.length === 0) {
                setSearchResults([])
                setSearchError('Nothing found')
            } else {
                setSearchResults(data.tracks)
                setSearchError(null)
            }
        } catch (err) {
            console.error(err)
            setSearchError('Network error')
        }
    }

    return (
        <>
            <h2>
                {status}
            </h2>
            <button onClick={handleUser}>
                Click to get {user}
            </button>

            <h2></h2>
            <p> {login} </p>
            <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={handleLogin}>
                Log in
            </button>

            <button onClick={handleLogout}>
                Log out
            </button>
            <br></br>
            <button onClick={handleScan}>
                {scan}
            </button>
            <h2></h2>
            <button onClick={handleLoadArtists}>
                {artists.length > 0 ? 'Hide available artists' : 'Click to list available artists'}
            </button>
            {artistsError && <p style={{ color: 'red' }}>{artistsError}</p>}
            <ul>
                {artists.map((artist) => (
                    <li key={artist.id} > {artist.id} | {artist.name} </li>
                ))}
            </ul>
            <input
                type="number"
                placeholder="Artist ID"
                value={selectedArtistId ?? ''}
                onChange={(e) => setSelectedArtistId(e.target.value ? Number(e.target.value) : null)}
            />
            <button onClick={() => {
                const id = Number(selectedArtistId)
                if (Number.isNaN(id) || id <= 0) {
                    setAlbumsError('Please enter a valid artist ID')
                    setAlbums([])
                    setLoadedArtistId(null)
                    return
                }
                if (artists.length > 0 && !artists.some(a => a.id === id)) {
                    setAlbumsError('This artist ID does not exist in the loaded artists list')
                    setAlbums([])
                    setLoadedArtistId(null)
                    return
                }
                handleLoadAlbums(id)
                setAlbumsError('')
            }}>
                {albums.length > 0 && selectedArtistId === loadedArtistId ? 'Hide albums for artist' : 'Load albums for artist'}
            </button>
            {albumsError && <p style={{ color: 'red' }}> {albumsError} </p>}
            <ul>
                {albums.map((album) => (
                    <li key={album.id}>
                        {album.id} | {album.title} ({album.year})
                        {' '}
                        <button onClick={() => handleLoadAlbumTracks(album.id)} style={{ padding: '2px 8px', fontSize: '0.8em', marginLeft: '10px' }}>
                            {albumTracks[album.id] ? 'Hide' : 'Load'}
                        </button>
                        {albumTracksError && <p style={{ color: 'red' }}> {albumTracksError} </p>}
                        {albumTracks[album.id] && (
                            <ul>
                                {albumTracks[album.id].map((albumTrack) => (
                                    <li key={albumTrack.id}>
                                        {albumTrack.id} | {albumTrack.title}
                                        <button onClick={() => setCurrentStreamTrackId(albumTrack.id)} style={{ marginLeft: '10px', fontSize: '0.8em', padding: '2px 8px' }}>Play</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>

            <h2> Search Tracks </h2>
            <input
                type="text"
                placeholder="Search tracks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>
                Search
            </button>
            {searchError && <p style={{ color: 'red' }}> {searchError} </p>}
            {searchResults.length > 0 && (
                <ul>
                    {searchResults.map((track) => (
                        <li key={track.id}>
                            {track.id} | {track.artist ? `${track.artist} - ` : ''}{track.title}{track.album ? ` (${track.album})` : ''}
                            <button onClick={() => setCurrentStreamTrackId(track.id)} style={{ marginLeft: '10px', fontSize: '0.8em', padding: '2px 8px' }}>Play</button>
                        </li>
                    ))}
                </ul>
            )}
            {currentStreamTrackId && (
                <>
                    <div style={{ height: '100px' }} />
                    <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: '#333', color: 'white', padding: '10px', textAlign: 'center', boxShadow: '0 -2px 10px rgba(0,0,0,0.5)' }}>
                        <p style={{ margin: '0 0 10px 0' }}>Now Playing Track ID: {currentStreamTrackId}</p>
                        <audio controls autoPlay src={`/api/stream/${currentStreamTrackId}`} style={{ width: '80%', maxWidth: '600px' }} />
                    </div>
                </>
            )}
        </>
    )
}

export default App
