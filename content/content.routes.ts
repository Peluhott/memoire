import express from 'express';
import { upload } from '../util/multer';
import { authenticateJWT } from '../auth/auth.middleware';
import { uploadContent } from './content.controller';

const router = express.Router();

// POST /content - upload a file and create a content record
router.post('/', authenticateJWT, upload.single('file'), uploadContent);

export default router;
