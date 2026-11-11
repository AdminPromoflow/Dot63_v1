const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 const context=vm.createContext({console});
 vm.runInContext(fs.readFileSync('view/preview_product_customers/variations/variations.js','utf8').replaceAll('export ','').replaceAll('import.meta.url', JSON.stringify('https://preview.test/variations.js'))+'\nthis.VariationsController=VariationsController;',context);
 const controller=Object.create(context.VariationsController.prototype);
 let calls=0,refreshes=0;
 Object.assign(controller,{api:{previewUrl:'/test'},rowCache:new Map(),nodeCache:new Map(),generation:1,requestControllers:new Map(),store:{setRootVariation(){},setGroupSelection(){}},
 prices:{async refreshVariationExtras(){refreshes++;}},startRequest:()=>({version:1,controller:{signal:null}}),isRequestCurrent:()=>true,
 renderPath(){},removeDescendantsOfVariation(){},setEmptyState(){},onError:message=>{throw Error(message);},
 makeRequest:async()=>{calls++;return {current:{variation:{variation_id:2}},children:[],types:[]};}});
 controller.rowCache.set('1',{variation:{variation_id:1,has_children:'0'},prices:[]});
 assert.equal(await controller.loadNode(1,1,{generation:1}),true);assert.equal(calls,0,'Known leaf needs no network request');
 await controller.loadNode(2,1,{generation:1});await controller.loadNode(2,1,{generation:1});
 assert.equal(calls,1,'Previously fetched node is reused');assert.equal(refreshes,3);
 vm.runInContext(fs.readFileSync('view/global/delivery_options/common_delivery.js','utf8').replaceAll('export ','')+'\nthis.variationExtras=variationExtras;',context);
 const catalog={variations:[{id:1,mode:'prices'},{id:2,mode:'variation'},{id:3,mode:'variation'}],prices:[{id:1,variationId:1,min:1,max:null,price:100},{id:2,variationId:2,min:1,max:9,price:2},{id:3,variationId:2,min:10,max:null,price:1},{id:4,variationId:3,min:20,max:50,price:3}]};
 const prices=context.variationExtras(catalog,[1,2,3],10);
 assert.equal(prices.prices.length,1);assert.equal(prices.prices[0].variation_id,2);assert.equal(prices.prices[0].price,1);
 assert.ok(prices.priced_variation_ids.includes(3),'Paid options without a matching tier remain unavailable');
 assert.equal(context.variationExtras({variations:[],prices:[{id:1}]},[],10),null,'Older responses retain network fallback');
 console.log('Preview performance: cached leaf/node requests avoided; local extras match quantity and availability rules.');
})().catch(error=>{console.error(error);process.exitCode=1;});
