declare global {
	namespace Express {
		interface Request {
			wss: WebSocketServer;
		}
	}
}
export default global;
