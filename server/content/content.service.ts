
import * as repo from './content.repository';
import { uploadProductImage } from '../util/uploadImage';
import { getSignedImageUrl } from '../util/getSignedImage';

function withImageUrl<T extends { public_id: string; resource_type: string }>(content: T) {
	return {
		...content,
		imageUrl: getSignedImageUrl(content.public_id, content.resource_type),
	};
}

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
	const content = await repo.getContentByUser(userId);
	return content.map(withImageUrl);
}

export async function toggleShare(contentId: number) {
	return await repo.toggleSharedWithNetwork(contentId);
}

export async function getUserContentCount(userId: number) {
	return await repo.getContentCountByUser(userId);
}

// Return a signed URL for the content's image (or null if not found / not an image)
export async function getSignedUrlForContent(contentId: number, userId: number): Promise<string | null> {
	const content = await repo.getContentByIdForUser(contentId, userId);
	if (!content) return null;
	const publicId = content.public_id;
	const resourceType = content.resource_type;
	if (!publicId || !resourceType) return null;
	return getSignedImageUrl(publicId, resourceType);
}
// create a type for content
