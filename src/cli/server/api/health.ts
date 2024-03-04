import express from 'express';
const router = express.Router();

router.get('/api/health', (_req, res) => {
    res.status(200).send({ started: true });
});

export default router;