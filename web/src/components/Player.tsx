export function Player({ trackId }: { trackId: number }) {
    return (
        <>
            <div style={{ height: '100px' }} />
            <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: '#333', color: 'white', padding: '10px', textAlign: 'center', boxShadow: '0 -2px 10px rgba(0,0,0,0.5)' }}>
                <p style={{ margin: '0 0 10px 0' }}>Now Playing Track ID: {trackId}</p>
                <audio controls autoPlay src={`/api/stream/${trackId}`} style={{ width: '80%', maxWidth: '600px' }} />
            </div>
        </>
    );
}
