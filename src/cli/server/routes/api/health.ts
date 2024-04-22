import express from 'express';

export const healthRouter = express.Router();

healthRouter.get('/', (req, res) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.status(200).json({ started: true, instance: req.bulogEnvironment.flags.instance });
});
