import {endpoint,ApiError,defect} from '@/lib/server';
import {photoError,photoSignature,MAX_PHOTO} from '@/lib/validation';
export async function POST(req:Request){return endpoint(req,'photos.upload',async(db,owner)=>{
 if(defect()==='storage')throw new ApiError(503,'Teaching simulation: storage unavailable. Retry after the facilitator resets the exercise, or explicitly save without a photo.');
 if(Number(req.headers.get('content-length'))>MAX_PHOTO+65536)throw new ApiError(422,'Choose an image no larger than 2 MB.');
 const form=await req.formData();const file=form.get('file');if(!(file instanceof File))throw new ApiError(422,'Select a photo first.');
 const problem=photoError(file.type,file.size);if(problem)throw new ApiError(422,problem);
 const bytes=new Uint8Array(await file.arrayBuffer());if(!photoSignature(bytes,file.type))throw new ApiError(422,'The image contents do not match its type. Choose a valid JPEG, PNG, or WebP.');
 const extension={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];const path=`${owner}/${crypto.randomUUID()}.${extension}`;
 const {error}=await db.storage.from('product-photos').upload(path,bytes,{contentType:file.type,upsert:false});if(error)throw new ApiError(503,'Photo upload failed. Retry, or choose Save without selected photo.');return {path};
});}
export async function DELETE(req:Request){return endpoint(req,'photos.cleanup',async(db,owner)=>{const {path}=await req.json();if(typeof path!=='string'||!path.startsWith(owner+'/'))throw new ApiError(404,'Photo not found.');const {data:refs,error:readError}=await db.from('products').select('id').eq('image_path',path);if(readError)throw new ApiError(503,'Could not check photo references. Retry cleanup later.');if(refs?.length)throw new ApiError(409,'Photo is still in use. Save the new product reference first.');const {error}=await db.storage.from('product-photos').remove([path]);if(error)throw new ApiError(503,'The unused photo could not be removed. Record its path and ask the facilitator to retry cleanup.');return {ok:true};});}
