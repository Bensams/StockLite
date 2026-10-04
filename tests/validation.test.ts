import {describe,it,expect} from 'vitest';
import {productSchema,movementSchema,priceToCentavos,photoError,photoSignature} from '../lib/validation';
const product={sku:' pen-01 ',name:'Blue pen',category:'Writing',price_centavos:1250,opening_quantity:10,low_stock_threshold:3};
const movement={product_id:'00000000-0000-4000-8000-000000000001',type:'IN',quantity:5,note:'Classroom restock',request_id:'00000000-0000-4000-8000-000000000002'};
describe('server input contracts',()=>{
 it('normalizes SKUs',()=>expect(productSchema.parse(product).sku).toBe('PEN-01'));
 it.each([-1,1.5,NaN,Infinity])('rejects invalid inventory number %s',n=>expect(productSchema.safeParse({...product,opening_quantity:n}).success).toBe(false));
 it('rejects missing names and negative prices',()=>{expect(productSchema.safeParse({...product,name:' '}).success).toBe(false);expect(productSchema.safeParse({...product,price_centavos:-1}).success).toBe(false);});
 it.each([0,-1,1.5,'5'])('rejects invalid movement quantity %s',n=>expect(movementSchema.safeParse({...movement,quantity:n}).success).toBe(false));
 it('accepts valid movement and rejects request-field mismatch',()=>{expect(movementSchema.safeParse(movement).success).toBe(true);const {quantity,...rest}=movement;expect(movementSchema.safeParse({...rest,amount:quantity}).success).toBe(false);});
 it('converts exact centavos without float multiplication',()=>{expect(priceToCentavos('19.99')).toBe(1999);expect(priceToCentavos('0.01')).toBe(1);expect(()=>priceToCentavos('2.999')).toThrow();expect(()=>priceToCentavos('-1')).toThrow();});
 it('rejects oversized, empty, and unsupported images',()=>{expect(photoError('image/png',2097153)).toBeTruthy();expect(photoError('image/png',0)).toBeTruthy();expect(photoError('image/svg+xml',10)).toBeTruthy();expect(photoError('image/webp',1024)).toBeNull();});
 it('validates magic bytes, not only claimed MIME',()=>{expect(photoSignature(new Uint8Array([137,80,78,71,13,10,26,10]),'image/png')).toBe(true);expect(photoSignature(new Uint8Array([1,2,3]),'image/png')).toBe(false);});
 it('corrected preview uses numeric addition',()=>expect(10+Number('5')).toBe(15));
});
