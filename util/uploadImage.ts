
import cloudinary from './cloudinary'; 

export async function uploadProductImage(
  file: Express.Multer.File
) {
  
  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'memories',
    type: 'authenticated',          
    resource_type: 'image',
  });

  
  return {
    public_id: result.public_id,    // id to access the content
    resource_type: result.resource_type, // image, video, etc
    type: result.type,  //authenticated            
  };
}
