/**
 * Jest Test Setup
 * Global test configuration and mocks
 */

// Import jest-dom matchers
require('@testing-library/jest-dom');

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    // Uncomment to ignore specific console methods
    // log: jest.fn(),
    // debug: jest.fn(),
    // info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock window.location (only if window exists)
if (typeof window !== 'undefined') {
    delete window.location;
    window.location = {
        href: 'http://localhost:3000',
        origin: 'http://localhost:3000',
        protocol: 'http:',
        host: 'localhost:3000',
        hostname: 'localhost',
        port: '3000',
        pathname: '/',
        search: '',
        hash: '',
        assign: jest.fn(),
        replace: jest.fn(),
        reload: jest.fn(),
    };

    // Mock window.history
    window.history = {
        pushState: jest.fn(),
        replaceState: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        go: jest.fn(),
    };
} else {
    // Create global window mock for Node.js environment
    global.window = {
        location: {
            href: 'http://localhost:3000',
            origin: 'http://localhost:3000',
            protocol: 'http:',
            host: 'localhost:3000',
            hostname: 'localhost',
            port: '3000',
            pathname: '/',
            search: '',
            hash: '',
            assign: jest.fn(),
            replace: jest.fn(),
            reload: jest.fn(),
        },
        history: {
            pushState: jest.fn(),
            replaceState: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            go: jest.fn(),
        }
    };
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {
        return null;
    }
    disconnect() {
        return null;
    }
    unobserve() {
        return null;
    }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {
        return null;
    }
    disconnect() {
        return null;
    }
    unobserve() {
        return null;
    }
};

// Mock fetch globally
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        headers: new Map(),
    })
);

// Mock File and FileReader for file upload tests
global.File = class File {
    constructor(bits, name, options = {}) {
        this.bits = bits;
        this.name = name;
        this.size = bits.reduce((acc, bit) => acc + bit.length, 0);
        this.type = options.type || '';
        this.lastModified = options.lastModified || Date.now();
    }
};

global.FileReader = class FileReader {
    constructor() {
        this.readyState = 0;
        this.result = null;
        this.error = null;
        this.onload = null;
        this.onerror = null;
        this.onabort = null;
    }

    readAsDataURL(file) {
        setTimeout(() => {
            this.readyState = 2;
            this.result = `data:${file.type};base64,${btoa(file.bits.join(''))}`;
            if (this.onload) this.onload({ target: this });
        }, 0);
    }

    readAsText(file) {
        setTimeout(() => {
            this.readyState = 2;
            this.result = file.bits.join('');
            if (this.onload) this.onload({ target: this });
        }, 0);
    }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () => 'mocked-uuid-' + Math.random().toString(36).substr(2, 9),
        getRandomValues: (arr) => {
            for (let i = 0; i < arr.length; i++) {
                arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
        },
    },
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
    value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        language: 'en-US',
        languages: ['en-US', 'en'],
        platform: 'Win32',
        cookieEnabled: true,
        onLine: true,
        share: jest.fn(() => Promise.resolve()),
        clipboard: {
            writeText: jest.fn(() => Promise.resolve()),
            readText: jest.fn(() => Promise.resolve('')),
        },
    },
});

// Mock performance
global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
};

// Clean up after each test
afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset localStorage and sessionStorage
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.setItem.mockClear();
    sessionStorageMock.removeItem.mockClear();
    sessionStorageMock.clear.mockClear();
    
    // Reset fetch mock
    global.fetch.mockClear();
});

// Global test utilities
global.testUtils = {
    // Create a mock event
    createMockEvent: (type, properties = {}) => {
        const event = new Event(type);
        Object.assign(event, properties);
        return event;
    },
    
    // Wait for next tick
    nextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
    
    // Mock successful fetch response
    mockFetchSuccess: (data) => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve(data),
            text: () => Promise.resolve(JSON.stringify(data)),
        });
    },
    
    // Mock failed fetch response
    mockFetchError: (error = 'Network error', status = 500) => {
        global.fetch.mockRejectedValueOnce(new Error(error));
    },
    
    // Create mock car data
    createMockCar: (overrides = {}) => ({
        id: 1,
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        price: 25000,
        mileage: 15000,
        fuel_type: 'Gasoline',
        transmission: 'Automatic',
        description: 'Test car description',
        image_url: 'test-image.jpg',
        seller_id: 1,
        created_at: new Date().toISOString(),
        ...overrides,
    }),
    
    // Create mock user data
    createMockUser: (overrides = {}) => ({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        created_at: new Date().toISOString(),
        ...overrides,
    }),
};

// Suppress specific warnings
const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render is deprecated')
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});