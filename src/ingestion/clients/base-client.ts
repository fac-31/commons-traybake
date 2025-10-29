import axios from "axios";
import type { AxiosInstance, AxiosError } from "axios";
import { logger } from "../../utils/logger.js";

export interface BaseClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  userAgent?: string;
}

export abstract class BaseClient {
  protected client: AxiosInstance;
  protected config: Required<BaseClientConfig>;

  constructor(config: BaseClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      userAgent: "ParliamentRAG/0.1.0",
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
        "User-Agent": this.config.userAgent,
      },
    });

    this.setupRetryInterceptor();
  }

  private setupRetryInterceptor(): void {
    this.client.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        if (!axios.isAxiosError(error)) throw error;
        const config = error.config as any;

        if (!config || config.retry >= this.config.retries) {
          return Promise.reject(error);
        }

        config.retry = (config.retry || 0) + 1;
        const delay = Math.min(1000 * Math.pow(2, config.retry), 10000);

        logger.warn(
          `Retrying (${config.retry}/${this.config.retries}) after ${delay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));

        return this.client(config);
      }
    );
  }

  protected async safeGet<T>(url: string, params?: any): Promise<T | null> {
    try {
      const response = await this.client.get<T>(url, { params });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.debug(`Not found: ${url}`);
        return null;
      }
      logger.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }
}
