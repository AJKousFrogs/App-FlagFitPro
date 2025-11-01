// Mock Authentication for Static Deployment
// This replaces backend authentication for demo purposes

export class MockAuth {
    constructor() {
        this.isLoggedIn = false;
        this.currentUser = null;
    }

    async login(credentials) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Accept any email/password for demo
        if (credentials.email && credentials.password) {
            this.isLoggedIn = true;
            this.currentUser = {
                id: '1',
                email: credentials.email,
                name: credentials.email.split('@')[0],
                role: 'player'
            };
            
            // Store in localStorage
            localStorage.setItem('authToken', 'demo-token-' + Date.now());
            localStorage.setItem('userData', JSON.stringify(this.currentUser));
            
            return {
                success: true,
                data: {
                    token: 'demo-token-' + Date.now(),
                    user: this.currentUser
                }
            };
        }
        
        return {
            success: false,
            error: 'Invalid credentials'
        };
    }

    async register(userData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (userData.email && userData.password) {
            this.isLoggedIn = true;
            this.currentUser = {
                id: '1',
                email: userData.email,
                name: userData.name || userData.email.split('@')[0],
                role: 'player'
            };
            
            localStorage.setItem('authToken', 'demo-token-' + Date.now());
            localStorage.setItem('userData', JSON.stringify(this.currentUser));
            
            return {
                success: true,
                token: 'demo-token-' + Date.now(),
                user: this.currentUser
            };
        }
        
        return {
            success: false,
            error: 'Registration failed'
        };
    }

    async logout() {
        this.isLoggedIn = false;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        return { success: true };
    }

    async getCurrentUser() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            this.currentUser = JSON.parse(userData);
            this.isLoggedIn = true;
            
            return {
                success: true,
                user: this.currentUser
            };
        }
        
        return {
            success: false,
            error: 'Not authenticated'
        };
    }

    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        return !!token;
    }
}