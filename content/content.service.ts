
import * as repo from './content.repository';
import { uploadProductImage } from '../util/uploadImage';

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

