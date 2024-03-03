import injectWhyDidYouRender from './scripts/why-did-you-render/index.js';

const config = {
    output: 'standalone',
    experimental: {
        instrumentationHook: true
    },
    webpack: (config, context) => {
        // injectWhyDidYouRender(config, context);
        return config;
    }
};

export default config;
