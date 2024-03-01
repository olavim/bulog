export async function register() {
    if (process.env.NEXT_MANUAL_SIG_HANDLE) {
        process.on('SIGTERM', () => process.exit(0));
        process.on('SIGINT', () => process.exit(0));
    }
}
