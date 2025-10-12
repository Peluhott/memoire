import  cloudinary from './cloudinary';

export function getSignedImageUrl(publicId: string) {
  return cloudinary.url(publicId, {
    type: 'authenticated',
    resource_type: 'image',
    secure: true,
    sign_url: true,
    auth_token: {
      key: process.env.CLOUDINARY_URL_SIGNING_KEY!,
      expiration: Math.floor(Date.now() / 1000) + 60, // expires in 1 min
    },
  });
}
