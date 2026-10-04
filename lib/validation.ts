import { z } from 'zod';
export const whole = z.number().int().min(0).max(1000000000);
export const productSchema = z.object({
  sku: z.string().trim().min(1).max(40).transform(v => v.toUpperCase()),
  name: z.string().trim().min(1).max(120), category: z.string().trim().min(1).max(60),
  price_centavos: whole, opening_quantity: whole.default(0), low_stock_threshold: whole,
  image_path: z.string().max(240).nullable().default(null),
}).strict();
export const movementSchema = z.object({product_id:z.uuid(),type:z.enum(['IN','OUT']),quantity:whole.refine(v=>v>0,'Enter a positive whole-number quantity.'),note:z.string().trim().min(1).max(200),request_id:z.uuid()}).strict();
export function priceToCentavos(value:string) { if(!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error('Use a nonnegative price with at most two decimal places.'); const [a,b='']=value.split('.'); const result=Number(a)*100+Number(b.padEnd(2,'0')); if(!Number.isSafeInteger(result)||result>1000000000) throw new Error('Price is too large.'); return result; }
export const MAX_PHOTO=2*1024*1024;
export function photoError(type:string,size:number){return !['image/jpeg','image/png','image/webp'].includes(type)?'Choose a JPEG, PNG, or WebP image.':size<=0||size>MAX_PHOTO?'Choose a nonempty image no larger than 2 MB.':null;}
export function photoSignature(bytes:Uint8Array,type:string){return type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:type==='image/png'?[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v):type==='image/webp'?String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP':false;}
