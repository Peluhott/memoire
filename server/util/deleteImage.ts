import cloudinary from './cloudinary';

export async function deleteProductImage(publicId: string, resourceType: string) {
  return cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: resourceType,
    type: 'authenticated',
  });
}
