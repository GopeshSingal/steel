import { useState } from 'react';

export function Admin() {
    const [scan, setScan] = useState('Scan music library')

    const handleScan = async () => {
        try {
            const response = await fetch('/api/admin/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    return (
        <div>
            <br></br>
            <button onClick={handleScan}>{scan}</button>
            <h2></h2>
        </div>
    );
}
