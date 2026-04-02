import { useState } from 'react';

export function Artist({ onPlay }: { onPlay: (trackId: number) => void }) {
    const [artists, setArtists] = useState<{ id: number; name: string }[]>([])
    const [artistsError, setArtistsError] = useState<string | null>(null)
    const [albums, setAlbums] = useState<{ id: number; title: string; year: number }[]>([])
    const [albumsError, setAlbumsError] = useState<string | null>(null)
    const [loadedArtistId, setLoadedArtistId] = useState<number | null>(null)
    const [albumTracks, setAlbumTracks] = useState<{ [albumId: number]: { id: number; title: string }[] }>({})
    const [albumTracksError, setAlbumTracksError] = useState<string | null>(null)
    const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null)

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

    return (
        <div>
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
                                        <button onClick={() => onPlay(albumTrack.id)} style={{ marginLeft: '10px', fontSize: '0.8em', padding: '2px 8px' }}>Play</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
