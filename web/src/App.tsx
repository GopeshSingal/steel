import { useState } from 'react'
import './App.css'
import { Auth } from './components/Auth'
import { Admin } from './components/Admin'
import { Artist } from './components/Artist'
import { Search } from './components/Search'
import { Player } from './components/Player'

function App() {
    const [currentStreamTrackId, setCurrentStreamTrackId] = useState<number | null>(null)

    return (
        <div className="App">
            <Auth />
            <Admin />
            <Artist onPlay={setCurrentStreamTrackId} />
            <Search onPlay={setCurrentStreamTrackId} />
            {currentStreamTrackId && <Player trackId={currentStreamTrackId} />}
        </div>
    )
}

export default App
