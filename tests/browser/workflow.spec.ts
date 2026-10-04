import {test,expect} from '@playwright/test';
// HTTP substitutes verify UI wiring, not PostgreSQL transactions, RLS, or real Storage.
test('create → photo upload → stock in → stock out → reload',async({page})=>{
 const products:Record<string,unknown>[]=[];const movements:Record<string,unknown>[]=[];
 await page.route('**/api/**',async route=>{const req=route.request(),url=new URL(req.url()),body=req.method()==='GET'||url.pathname.endsWith('/photos')?{}:req.postDataJSON();let data:unknown={};
 if(url.pathname.endsWith('/config'))data={configured:true,email:'fictional-group@example.test',defect:''};
 if(url.pathname.endsWith('/photos'))data={path:'owner/generated.png'};
 if(url.pathname.endsWith('/products')){if(req.method()==='POST'){products.push({...body,id:'product-1',quantity:body.opening_quantity,archived_at:null});movements.unshift({id:'opening',product_id:'product-1',type:'IN',quantity:body.opening_quantity,previous_balance:0,resulting_balance:body.opening_quantity,note:'Opening stock',created_at:new Date().toISOString()});data=products[0];}else data=products;}
 if(url.pathname.endsWith('/movements')){if(req.method()==='POST'){const p=products[0];const previous=Number(p.quantity);p.quantity=previous+(body.type==='IN'?body.quantity:-body.quantity);movements.unshift({...body,id:body.request_id,previous_balance:previous,resulting_balance:p.quantity,created_at:new Date().toISOString()});data=movements[0];}else data=movements;}
 await route.fulfill({json:{data}});
 });
 await page.goto('/');await page.getByRole('button',{name:'+ Add product'}).click();await page.getByLabel('SKU',{exact:true}).fill('DEMO-10');await page.getByLabel('Product name').fill('Blue ballpoint pens');await page.getByLabel('Category',{exact:true}).fill('Writing');await page.getByLabel('Unit price').fill('12.50');await page.getByLabel('Opening quantity').fill('10');
 await page.getByLabel('Optional product photo').setInputFiles({name:'pen.png',mimeType:'image/png',buffer:Buffer.from([137,80,78,71,13,10,26,10])});
 await page.getByRole('button',{name:'Save product',exact:true}).click();await page.getByRole('button',{name:'Blue ballpoint pens',exact:true}).click();
 await page.getByLabel('Quantity',{exact:true}).fill('5');await page.getByLabel('Reason / note').fill('Received five');await page.getByRole('button',{name:'Save movement',exact:true}).click();await expect(page.getByText('10 → 15',{exact:false})).toBeVisible();
 await page.getByLabel('Movement type').selectOption('OUT');await page.getByLabel('Quantity',{exact:true}).fill('3');await page.getByLabel('Reason / note').fill('Released three');await page.getByRole('button',{name:'Save movement',exact:true}).click();await expect(page.getByText('15 → 12',{exact:false})).toBeVisible();
 await page.reload();await page.getByRole('button',{name:'Blue ballpoint pens',exact:true}).click();await expect(page.getByText('15 → 12',{exact:false})).toBeVisible();expect(products[0].quantity).toBe(12);expect(products[0].image_path).toBe('owner/generated.png');expect(movements).toHaveLength(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Toggle color theme'}).focus();await page.keyboard.press('Enter');await expect(page.locator('.shell')).toHaveClass(/dark/);
});
test('unconfigured setup is honest and keyboard accessible',async({page})=>{await page.route('**/api/config',route=>route.fulfill({json:{data:{configured:false,email:null,defect:''}}}));await page.goto('/');await expect(page.getByText('Setup required:',{exact:false})).toBeVisible();await expect(page.getByRole('button',{name:'Sign in to inventory'})).toBeDisabled();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Toggle color theme'})).toBeFocused();});
