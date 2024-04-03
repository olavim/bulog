import express from 'express';

const router = express.Router();
router.use(express.json());

router.post('/reset', (req, res) => {
	req.bulogComms.resetCache();
	res.status(200).json({ reset: true });
});

export default router;
