
import * as repo from './content.repository';
import { uploadProductImage } from '../util/uploadImage';
import { getSignedImageUrl } from '../util/getSignedImage';

// Create content after optionally checking a per-user limit (limit optional)
export async function createContent(
	userId: number,
	publicId: string,
	resourceType: string,
	type: string,
	title: string,
	description: string,
	sharedWithNetwork?: boolean,
	limit?: number
) {
	if (typeof limit === 'number') {
		const count = await repo.getContentCountByUser(userId);
		if (count >= limit) {
			throw new Error('content_limit_reached');
		}
	}

	return await repo.createContent(
		userId,
		publicId,
		resourceType,
		type,
		title,
		description,
		sharedWithNetwork
	);
}



	// Upload file and return normalized upload info
	export async function uploadImageAndGetInfo(file: Express.Multer.File) {
		const uploaded = await uploadProductImage(file);
		return {
			publicId: uploaded.public_id,
			resourceType: uploaded.resource_type,
			uploadType: uploaded.type,
		};
	}



export async function listContentByUser(userId: number) {
	return await repo.getContentByUser(userId);
}

export async function toggleShare(contentId: number) {
	return await repo.toggleSharedWithNetwork(contentId);
}

export async function getUserContentCount(userId: number) {
	return await repo.getContentCountByUser(userId);
}

// Return a signed URL for the content's image (or null if not found / not an image)
export async function getSignedUrlForContent(contentId: number): Promise<string | null> {
	const content = await repo.getContentById(contentId);
	if (!content) return null;
	const publicId = (content as any).public_id as string | undefined;
	const resourceType = (content as any).resource_type as string | undefined;
	if (!publicId || !resourceType) return null;
	return getSignedImageUrl(publicId, resourceType);
}
// create a type for content
