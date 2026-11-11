const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.events={};this.disabled=false;}
 appendChild(child){this.children.push(child);child.parent=this;}
 setAttribute(){}
 addEventListener(name,fn){this.events[name]=fn;}
 remove(){this.parent.children=this.parent.children.filter(c=>c!==this);}
 querySelectorAll(selector){return this.children.filter(c=>selector==='[data-option-field]'?!!c.dataset.optionField:c.className==='delivery-option-line');}
}
(async()=>{
 const status={textContent:''},events={},rowEvents={};
 const editor=new Element('div');editor.dataset.options=JSON.stringify([{days:8,value:'25',type:'percentage'},{days:10,value:'5',type:'amount'}]);
 const add=new Element('button'), controls=[add];
 const row={querySelector:s=>s==='.delivery-option-editor'?editor:s==='.delivery-add-option'?add:status,querySelectorAll:()=>controls,addEventListener:(n,h)=>rowEvents[n]=h};
 const form={id:'test',dataset:{kind:'price'},closest:()=>row,reportValidity:()=>true,addEventListener:(n,h)=>events[n]=h};
 let payload,response={success:true},ok=true,beforeUnload;
 const context={FormData:class{*[Symbol.iterator](){yield ['id_price','12'];yield ['sku','P'];yield ['sku_variation','V'];}},
 document:{createElement:tag=>new Element(tag),querySelectorAll:s=>s==='.delivery-edit-form'?[form]:[],getElementById:()=>({addEventListener(){}})},
 window:{headerAddProduct:{setCurrentHeader(){}},addEventListener:(n,h)=>beforeUnload=h},
 fetch:async(url,options)=>{payload=JSON.parse(options.body);assert.equal(add.disabled,true);return {ok,json:async()=>response};}};
 vm.runInNewContext(fs.readFileSync('view/delivery_times/delivery_times.js','utf8'),context);
 assert.equal(editor.children.length,2);
 rowEvents.change();await events.submit({preventDefault(){}});
 assert.equal(payload.action,'save_price');assert.equal(payload.options.length,2);assert.equal(payload.options[1].type,'amount');assert.equal(status.textContent,'Saved');
 add.events.click();assert.equal(editor.children.length,3);editor.children[2].children.at(-1).events.click();assert.equal(editor.children.length,2);
 let warned=false;beforeUnload({preventDefault(){warned=true;}});assert.equal(warned,true);
 ok=false;response={error:'Apply the migration first.'};await events.submit({preventDefault(){}});assert.equal(status.textContent,response.error);assert.equal(add.disabled,false);
 editor.children.slice().forEach(line=>line.children.at(-1).events.click());
 form.dataset.kind='variation';ok=true;response={success:true};await events.submit({preventDefault(){}});assert.equal(payload.action,'save_variation');assert.equal(payload.options.length,0);
 console.log('Delivery editor: multiple options, add/remove/clear, save payloads and recoverable errors passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
