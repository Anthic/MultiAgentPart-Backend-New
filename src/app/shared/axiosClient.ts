import axios from 'axios';

const PYTHON_API_URL = process.env.PYTHON_API_URL;

class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF-OPEN' = 'CLOSED';
  private failureThreshold = 5;
  private cooldownPeriod = 20000;
  private failureCount = 0;
  private lastFailureTime = 0;

  public isOpen(): boolean {
    if (this.state === 'OPEN') {
      // Transition to HALF-OPEN after cooldown expires
      if (Date.now() - this.lastFailureTime > this.cooldownPeriod) {
        this.state = 'HALF-OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  public recordSuccess(): void {
    // Any healthy response clears the streak; previously failures accumulated
    // across hours and eventually tripped the breaker on 5 *scattered* errors.
    this.failureCount = 0;
    if (this.state === 'HALF-OPEN') {
      this.state = 'CLOSED';
    }
  }

  public recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.state === 'HALF-OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      // console.warn(
      //   ` [Circuit Breaker] Python API failed ${this.failureCount} times. State set to OPEN. Cooldown active for ${this.cooldownPeriod / 1000}s.`
      // );
    }
  }
}

const breaker = new CircuitBreaker();

// Reduced timeout from 60000ms to 20000ms to prevent hanging requests
export const pythonApiClient = axios.create({
  baseURL: PYTHON_API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
  },
});

// Request interceptor: Fail fast if the circuit is open
pythonApiClient.interceptors.request.use((config) => {
  if (breaker.isOpen()) {
    throw new axios.CanceledError('Circuit Breaker is OPEN: Python API is currently unavailable.');
  }
  return config;
});

// Response interceptor: Monitor performance and manage states
pythonApiClient.interceptors.response.use(
  (response) => {
    breaker.recordSuccess();
    return response;
  },
  (error) => {
    if (!axios.isCancel(error)) {
      const status: number | undefined = error.response?.status;
      if (status && status < 500) {
        // 4xx = the service answered correctly (bad input, not found, auth).
        // It is healthy; a few bad requests must not open the breaker for
        // every user.
        breaker.recordSuccess();
      } else {
        breaker.recordFailure();
      }
      console.error(
        ' Python Agent API Error:',
        error.response?.data || error.message,
      );
    }
    return Promise.reject(error);
  },
);
