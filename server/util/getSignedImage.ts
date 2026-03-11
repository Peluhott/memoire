import cloudinary from "./cloudinary";

export function getSignedImageUrl(publicId: string, resource_type: string) {
  return cloudinary.url(publicId, {
    type: "authenticated",
    resource_type: `${resource_type}`,
    secure: true,
    sign_url: true,
  });
}
