// Shared by Supplier, Customer and Promoflow previews. All money is in pence.
export function commonDelivery(catalog, selectedIds, priceId, quantity, subtotalPence) {
  const ids = new Set(selectedIds.map(Number));
  const variations = (catalog?.variations || []).filter(v => ids.has(Number(v.id)));
  const sources = variations.map(v => ({name:v.name, options:v.options || []}));
  const priceIds = new Set([Number(priceId)]);
  for (const variation of variations.filter(v => v.mode === 'variation')) {
    const tier = (catalog?.prices || []).find(p => Number(p.variationId) === Number(variation.id) && quantity >= p.min && (!p.max || quantity <= p.max));
    if (tier) priceIds.add(Number(tier.id));
  }
  for (const price of catalog?.prices || []) {
    if (!priceIds.has(Number(price.id)) || !ids.has(Number(price.variationId)) || quantity < price.min || (price.max && quantity > price.max)) continue;
    sources.push({name:`Quantity tier ${price.min}–${price.max || 'No limit'}`, options:price.options || []});
  }
  const configured = sources.filter(source => source.options.length);
  if (!configured.length) return {configured:false, options:[]};
  const days = configured[0].options.map(option => Number(option.days)).filter(day => configured.every(source => source.options.some(option => Number(option.days) === day)));
  const options = [...new Set(days)].sort((a,b)=>a-b).map(day => {
    const breakdown = configured.map(source => {
      const option = source.options.find(item => Number(item.days) === day);
      const pence = option.type === 'percentage' ? Math.round(subtotalPence * Number(option.value) / 100) : Math.round(Number(option.value) * 100);
      return {name:source.name, type:option.type, value:Number(option.value), pence};
    });
    return {days:day, pence:breakdown.reduce((sum,item)=>sum+item.pence,0), breakdown};
  });
  // A zero-surcharge result uses the shared 15-working-day preview policy.
  // Keep paid options keyed by their original day, even when that day is 15.
  const freeOption = options.find(option => option.pence === 0);
  const displayedOptions = options.filter(option => option.pence !== 0);
  if (freeOption) displayedOptions.unshift({...freeOption, days:15, key:'free-15'});
  return {configured:true, options:displayedOptions};
}

export function renderDelivery(container, result, selected) {
  if (!container) return null;
  const section = container.closest('.delivery-options');
  if (section) section.hidden = !result.configured;
  if (!result.configured) {
    container.replaceChildren();
    return null;
  }
  const chosen = result.options.find(option => String(option.key ?? option.days) === String(selected)) || result.options.find(option => option.pence === 0) || result.options[result.options.length-1] || null;
  const fragment = document.createDocumentFragment();
  if (!result.options.length) {
    const message = document.createElement('p');
    message.textContent = 'No common delivery option';
    fragment.appendChild(message);
  }
  for (const option of result.options) {
    const block = document.createElement('div');
    const label = document.createElement('label'); label.className='delivery-option';
    const radio = document.createElement('input');radio.type='radio';radio.name='delivery_option';radio.value=String(option.key ?? option.days);radio.checked=option===chosen;
    const text = document.createElement('strong');text.textContent=`${option.days} working days · +£${(option.pence/100).toFixed(2)}`;
    label.append(radio,text);block.appendChild(label);
    const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='View breakdown';details.appendChild(summary);
    for(const item of option.breakdown){const line=document.createElement('p');line.textContent=`${item.name}: ${item.type==='percentage'?item.value+'%':'£'+item.value.toFixed(2)} → £${(item.pence/100).toFixed(2)}`;details.appendChild(line);}
    block.appendChild(details);fragment.appendChild(block);
  }
  container.replaceChildren(fragment);
  return chosen;
}

// Reuse the authorized product snapshot instead of requesting extras after every selection.
export function variationExtras(catalog, ids, quantity) {
  if (!catalog || !Array.isArray(catalog.prices) || !Array.isArray(catalog.variations)
      || catalog.prices.some(price => !Object.prototype.hasOwnProperty.call(price, 'price'))) return null;
  const wanted = new Set(ids.map(Number));
  const extras = new Set(catalog.variations.filter(v => wanted.has(Number(v.id)) && v.mode === 'variation').map(v => Number(v.id)));
  const tiers = [...catalog.prices].sort((a,b) => Number(b.min)-Number(a.min) || Number(b.id)-Number(a.id));
  const prices = new Map(); const configured = new Set();
  for (const tier of tiers) {
    const id = Number(tier.variationId);
    if (!extras.has(id)) continue;
    if (Number(tier.price) > 0) configured.add(id);
    if (!prices.has(id) && quantity >= Number(tier.min) && (!(Number(tier.max) > 0) || quantity <= Number(tier.max))) {
      prices.set(id, {variation_id:id, price:Number(tier.price), price_display_mode:'variation'});
    }
  }
  return {success:true, prices:[...prices.values()], priced_variation_ids:[...configured]};
}
