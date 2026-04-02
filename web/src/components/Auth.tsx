import { useState, useEffect } from 'react';

export function Auth() {
    const [status, setStatus] = useState<string>("Not connected yet");
    const [password, setPassword] = useState('');
    const [login, setLogin] = useState('Not logged in');
    const [user, setUser] = useState('User');

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

    const handleLogin = async () => {
        setLogin('Logging in...')
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: password }),
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
                headers: { 'Content-Type': 'application/json' },
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

    return (
        <div>
            <h2>{status}</h2>
            <button onClick={handleUser}>Click to get {user}</button>
            <h2></h2>
            <p> {login} </p>
            <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Log in</button>
            <button onClick={handleLogout}>Log out</button>
        </div>
    );
}
