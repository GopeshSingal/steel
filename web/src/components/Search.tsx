import { useState } from 'react';

export function Search({ onPlay }: { onPlay: (trackId: number) => void }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<{ id: number; title: string; artist?: string; album?: string }[]>([])
    const [searchError, setSearchError] = useState<string | null>(null)

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
        <div>
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
                            <button onClick={() => onPlay(track.id)} style={{ marginLeft: '10px', fontSize: '0.8em', padding: '2px 8px' }}>Play</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
