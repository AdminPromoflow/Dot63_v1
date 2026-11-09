const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
(async()=>{
 const status={textContent:''},unit={textContent:''},events={},rowEvents={};
 const controls=[{disabled:false},{disabled:false}];controls.delivery_price_type={value:'amount'};
 const row={querySelector:s=>s==='.delivery-unit'?unit:status,addEventListener:(n,h)=>rowEvents[n]=h};
 const form={dataset:{kind:'price'},elements:controls,closest:()=>row,reportValidity:()=>true,addEventListener:(n,h)=>events[n]=h};
 let payload, response={success:true}, ok=true, beforeUnload;
 const context={FormData:class{*[Symbol.iterator](){yield ['id_price','12'];yield ['sku','P'];yield ['sku_variation','V'];yield ['delivery_time_days','8'];yield ['delivery_price','25'];yield ['delivery_price_type','percentage'];}},
 document:{querySelectorAll:s=>s==='.delivery-edit-form'?[form]:[],getElementById:()=>({addEventListener(){}})},
 window:{headerAddProduct:{setCurrentHeader(){}},addEventListener:(n,h)=>beforeUnload=h},
 fetch:async(url,options)=>{payload=JSON.parse(options.body); assert.equal(controls[0].disabled,true); return {ok,json:async()=>response};}};
 vm.runInNewContext(fs.readFileSync('view/delivery_times/delivery_times.js','utf8'),context);
 rowEvents.change();assert.equal(unit.textContent,'£ (GBP)');assert.equal(status.textContent,'Unsaved changes');
 let warned=false;beforeUnload({preventDefault(){warned=true;}});assert.equal(warned,true);
 await events.submit({preventDefault(){}});
 assert.equal(payload.action,'save_price');assert.equal(payload.id_price,'12');assert.equal(payload.delivery_time_days,'8');assert.equal(status.textContent,'Saved');assert.equal(controls[0].disabled,false);
 warned=false;beforeUnload({preventDefault(){warned=true;}});assert.equal(warned,false);
 rowEvents.input();ok=false;response={error:'Apply the migration first.'};
 await events.submit({preventDefault(){}});assert.equal(status.textContent,response.error);assert.equal(controls[0].disabled,false);
 warned=false;beforeUnload({preventDefault(){warned=true;}});assert.equal(warned,true);
 form.dataset.kind='variation';ok=true;response={success:true};await events.submit({preventDefault(){}});assert.equal(payload.action,'save_variation');
 console.log('Delivery editor: save payloads, units, pending edits, success and recoverable errors passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
