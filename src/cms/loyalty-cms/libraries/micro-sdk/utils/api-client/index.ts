import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import axios from "axios";
import { LocalStorage } from "../localStorage";

export type ClientRequestConfig<D> = AxiosRequestConfig<D>;
// Define the type alias
export type Mode = "development" | "production";

export class ApiClient {
  private readonly apiCaller: AxiosInstance;
  private readonly mode: Mode;
  private accessToken: string = "";

  constructor(baseURL: string, mode: Mode = "development") {
    this.apiCaller = axios.create({
      baseURL,
      timeout: 50000,
    });
    this.mode = mode;
    this.accessToken = LocalStorage.getToken() ?? "";
    this.onRequest = this.onRequest.bind(this);
    this.apiCaller.interceptors.request.use(
      this.onRequest,
      this.onErrorResponse
    );
    this.apiCaller.interceptors.response.use(
      this.onResponse,
      this.onErrorResponse
    );
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  setBaseURL(url: string) {
    this.apiCaller.defaults.baseURL = url;
  }

  async get<T, D>(url: string, config?: ClientRequestConfig<D>): Promise<T> {
    const response = await this.apiCaller.get<T, AxiosResponse<T>, D>(
      url,
      config
    );

    return response.data;
  }

  async post<T, D>(
    url: string,
    body?: D,
    config?: ClientRequestConfig<D>
  ): Promise<T> {
    const response = await this.apiCaller.post<T, AxiosResponse<T>, D>(
      url,
      body,
      config
    );

    return response.data;
  }

  async put<T, D>(
    url: string,
    body?: D,
    config?: ClientRequestConfig<D>
  ): Promise<T> {
    const response = await this.apiCaller.put<T, AxiosResponse<T>, D>(
      url,
      body,
      config
    );

    return response.data;
  }

  async patch<T, D>(
    url: string,
    body?: D,
    config?: ClientRequestConfig<D>
  ): Promise<T> {
    const response = await this.apiCaller.patch<T, AxiosResponse<T>, D>(
      url,
      body,
      config
    );

    return response.data;
  }

  async delete<T, D>(url: string, config?: ClientRequestConfig<D>): Promise<T> {
    const response = await this.apiCaller.delete<T, AxiosResponse<T>, D>(
      url,
      config
    );

    return response.data;
  }

  // For Make Log on Develop Mode
  private logOnDev = (message: string): void => {
    if (this.mode === "development") {
      console.log(message);
    }
  };

  private onRequest = (
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig => {
    const { method, url } = config;

    this.logOnDev(`🚀 [API] ${method?.toUpperCase()} ${url} | Request`);
    const lang = localStorage.getItem('lng');

    const latestToken = LocalStorage.getToken();
    if (latestToken) {
      this.accessToken = latestToken;
    }

    // Modify the request config here (e.g., add headers, authentication tokens)
    // ** If token is present add it to request's Authorization Header
    if (this.accessToken) {
      if (config.headers)
        config.headers["Authorization"] = "Bearer " + this.accessToken;
    }
    if (config.headers) config.headers["language"] = lang || 'en';
    if (method === "get") {
      config.timeout = 15000;
    }

    return config;
  };

  private onResponse = (response: AxiosResponse): AxiosResponse => {
    const { method, url } = response.config;
    const { status } = response;

    this.logOnDev(
      `🚀 [API] ${method?.toUpperCase()} ${url} | Response ${status}`
    );

    // Modify the response data here (e.g., parse, transform)

    return response;
  };

  private onErrorResponse = (
    error: AxiosError | Error
  ): Promise<AxiosError> => {
    // Handle response errors here
    if (axios.isAxiosError(error)) {
      const { message } = error;
      const { method, url } = error.config as AxiosRequestConfig;
      const { status } = (error.response as AxiosResponse) ?? {};

      this.logOnDev(
        `🚨 [API] ${method?.toUpperCase()} ${url} | Error ${status} ${message}`
      );

      // Global 401 handler: auto logout and redirect to login page
      if (status === 401) {
        LocalStorage.removeToken();
        // Avoid infinite redirect if already on login page
        const loginPath = "/login";
        if (!window.location.pathname.endsWith(loginPath)) {
          window.location.href = loginPath;
        }
        // Return a rejected promise to stop further processing
        return Promise.reject(error);
      }

      switch (status) {
        case 403: {
          // "Permission denied"
          break;
        }
        case 404: {
          // "Invalid request"
          break;
        }
        case 500: {
          // "Server error"
          break;
        }
        default: {
          // "Unknown error occurred"
          break;
        }
      }

      if (status === 401) {
        // Delete Token & Go To Login Page if you required.
        sessionStorage.removeItem("token");
      }
    } else {
      this.logOnDev(`🚨 [API] | Error ${error.message}`);
    }

    return Promise.reject(error);
  };
}

export class BaseApiService {
  protected http: ApiClient;
  protected BASE_URL: string = "";

  constructor(baseURL: string = (import.meta as any).env?.VITE_API_URL || "") {
    this.http = new ApiClient(baseURL);
  }
}

