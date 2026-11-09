const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
async function test(file) {
 const location = {search:'?case=10',href:'https://example.test/messages?case=10',assign(url){this.assigned=url;}};
 const context = {document:{addEventListener(){}},window:{prompt:()=>null,confirm:()=>false},location,URL,URLSearchParams};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(file,'utf8')+'\nthis.CaseActions=CaseActions;',context);
 const ui = {busy:false,revision:0,disableMessageForm(){this.disabled=true;},enableMessageForm(){this.disabled=false;},feedback(message){this.status=message;},setSelectedCaseHeader(name){this.title=name;}};
 let requests=0, result={response:true,name:'New title',message:'Case renamed.'};
 const owner={messagesSection:ui,cases:[{id_case:10,name:'Old title'},{id_case:20,name:'Other'}],drawCases(cases){this.drawn=cases;},async makeRequest(url,data){requests++;this.request=data;return result;}};
 const actions=Object.create(context.CaseActions.prototype);
 Object.assign(actions,{owner,endpoint:'/endpoint',item:owner.cases[0],close(){}});
 await actions.run('rename_case'); await actions.run('delete_case');assert.equal(requests,0,'Cancelled action sent');
 context.window.prompt=()=> '   '; await actions.run('rename_case');assert.equal(requests,0);
 context.window.prompt=()=> 'New title'; await actions.run('rename_case');assert.equal(owner.cases[0].name,'New title');assert.equal(ui.title,'New title');assert.equal(ui.disabled,false);
 context.window.confirm=()=>true;result={response:false,message:'Denied'};
 await actions.run('delete_case');assert.equal(owner.cases.length,2);assert.equal(location.assigned,undefined);assert.equal(ui.busy,false);
 result={response:true,message:'Case deleted.'};actions.item=owner.cases[1];await actions.run('delete_case');assert.equal(owner.cases.length,1);assert.equal(location.assigned,undefined);
 actions.item=owner.cases[0];await actions.run('delete_case');assert.equal(location.assigned,'https://example.test/messages');
 console.log('PASS '+file+': cancellation, validation, rename, denied deletion and selected/unselected deletion');
}
(async()=>{
 await test(path.resolve(__dirname,'../view/messages/messages_section/messages_section.js'));
 await test(path.resolve(__dirname,'../../Promoflow_v1/view/messages/messages_section/messages_section.js'));
})().catch(error=>{console.error(error);process.exit(1);});
