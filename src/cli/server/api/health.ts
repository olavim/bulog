import express from 'express';
const router = express.Router();

router.get('/', (_req, res) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.status(200).json({ started: true });
});

export default router;
