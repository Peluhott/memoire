import prisma from "../prisma/prisma";

export async function createContent(
	userId: number,
	publicId: string,
	resourceType: string,
	type: string,
	title: string,
	description: string,
	sharedWithNetwork?: boolean
) {
	return await prisma.content.create({
		data: {
			user_id: userId,
			public_id: publicId,
			resource_type: resourceType,
			type,
			title,
			description,
			shared_with_network: sharedWithNetwork ?? false,
			// uploaded_at will default to now() as defined in the schema
		},
	});
}

export async function getContentByUser(userId: number) {
	return await prisma.content.findMany({
		where: { user_id: userId },
		orderBy: { uploaded_at: 'desc' },
	});
}

export async function getContentById(contentId: number) {
  return await prisma.content.findUnique({ where: { id: contentId } });
}

export async function getContentByIdForUser(contentId: number, userId: number) {
	return await prisma.content.findFirst({
		where: {
			id: contentId,
			user_id: userId,
		},
	});
}

export async function toggleSharedWithNetwork(contentId: number, userId: number) {
    const item = await prisma.content.findFirst({
        where: {
            id: contentId,
            user_id: userId,
        },
    });
	if (!item) return null;
	return await prisma.content.update({
		where: { id: contentId },
		data: { shared_with_network: !item.shared_with_network },
	});
}

export async function getContentCountByUser(userId: number) {
	return await prisma.content.count({ where: { user_id: userId } });
}

export async function deleteContentByIdForUser(contentId: number, userId: number) {
	return await prisma.content.deleteMany({
		where: {
			id: contentId,
			user_id: userId,
		},
	});
}

export async function getSharedContentIdsByUserIds(userIds: number[]) {
	if (userIds.length === 0) {
		return [];
	}

	const content = await prisma.content.findMany({
		where: {
			user_id: {
				in: userIds,
			},
			shared_with_network: true,
		},
		select: {
			id: true,
		},
		orderBy: {
			id: "asc",
		},
	});

	return content.map((item) => item.id);
}
