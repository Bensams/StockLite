import {login,ok} from './client.mjs';
const db=await login();
const items=[['PEN-BLUE','Blue ballpoint pens','Writing',1250,10,3],['PAPER-A4','A4 copy paper reams','Paper',24500,4,5],['CLIP-32','32 mm binder clips','Desk supplies',800,24,6],['NOTE-A5','A5 ruled notebooks','Paper',4500,0,5]];
for(const [sku,name,category,price_centavos,opening_quantity,low_stock_threshold] of items){const existing=ok(await db.from('products').select('id').eq('sku',sku));if(existing.length){console.log(`${sku}: retained existing record`);continue;}ok(await db.rpc('save_product',{p_id:null,p_data:{sku,name,category,price_centavos,opening_quantity,low_stock_threshold,image_path:null}}));console.log(`${sku}: seeded`);}
