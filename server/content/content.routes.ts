import express from 'express';
import { upload } from '../util/multer';
import { authenticateJWT } from '../auth/auth.middleware';
import { uploadContent, getContentSignedUrl, toggleShare, getContentByUser, deleteContent } from './content.controller';

const router = express.Router();

// POST /content - upload a file and create a content record
router.post('/', authenticateJWT, upload.single('file'), uploadContent);

// GET /content - list content for the authenticated user
router.get('/', authenticateJWT, getContentByUser);

// GET /content/:id/url - return a signed url for the content
router.get('/:id/url', authenticateJWT, getContentSignedUrl);

// POST /content/:id/toggle-share - flip shared_with_network
router.post('/:id/toggle-share', authenticateJWT, toggleShare);

// DELETE /content/:id - delete the user's content
router.delete('/:id', authenticateJWT, deleteContent);

export default router;
