import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.status(200).json({ started: true, instance: req.bulogEnvironment.instance.value });
});

export default router;
