/// <reference types="vite/client" />

import { StaticFrontendConfig } from '@/types';

declare global {
	interface Window {
		staticConfig: StaticFrontendConfig;
	}
}

export {};
