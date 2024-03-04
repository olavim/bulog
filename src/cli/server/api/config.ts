import express from 'express';
import { getBucketsConfig, saveBucketsConfig } from '../../config.js';

const router = express.Router();
router.use(express.json());

router.get('/buckets', async (_req, res) => {
    const buckets = await getBucketsConfig();
    res.status(200).send({ buckets });
});

router.post('/buckets', async (req, res) => {
    const buckets = req.body;
    await saveBucketsConfig(buckets);
    res.status(200).send({ buckets });
});

export default router;