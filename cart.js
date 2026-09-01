(function(){
const KEY='bholiSpicesCart';
function get(){try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return[]}}
function save(c){localStorage.setItem(KEY,JSON.stringify(c));update()}
function update(){const n=get().reduce((s,i)=>s+i.qty,0);document.querySelectorAll('[data-cart-count]').forEach(e=>{e.textContent=n;e.style.display=n?'inline-flex':'none'})}
function add(id,name,weight,price){let c=get(),k=id+'-'+weight,x=c.find(i=>i.key===k);if(x)x.qty++;else c.push({key:k,id,name,weight,price:Number(price),qty:1});save(c);toast(name+' ('+weight+') added to cart')}
function qty(k,d){let c=get(),x=c.find(i=>i.key===k);if(!x)return;x.qty+=d;save(c.filter(i=>i.qty>0));render()}
function remove(k){save(get().filter(i=>i.key!==k));render()}
function clear(){save([]);render()}
function money(n){return '₹'+Number(n).toLocaleString('en-IN')}
function totals(){let c=get(),s=c.reduce((a,i)=>a+i.price*i.qty,0),d=s===0||s>=599?0:60;return{s,d,t:s+d}}
function render(){let box=document.getElementById('cartItems');if(!box)return;let c=get(),empty=document.getElementById('emptyCart'),sum=document.getElementById('cartSummary');if(!c.length){box.innerHTML='';empty.style.display='block';sum.style.display='none';return}empty.style.display='none';sum.style.display='block';box.innerHTML=c.map(i=>`<div class="cart-item"><div><b>${esc(i.name)}</b><small>${esc(i.weight)} · ${money(i.price)}</small></div><div class="controls"><button onclick="BholiCart.qty('${i.key}',-1)">−</button><span>${i.qty}</span><button onclick="BholiCart.qty('${i.key}',1)">+</button></div><b>${money(i.price*i.qty)}</b><button class="remove" onclick="BholiCart.remove('${i.key}')">Remove</button></div>`).join('');let t=totals();document.getElementById('subtotal').textContent=money(t.s);document.getElementById('delivery').textContent=t.d?'₹60':'FREE';document.getElementById('grandTotal').textContent=money(t.t);document.getElementById('deliveryNote').textContent=t.s>=599?'🎉 Free delivery applied!':'Add '+money(599-t.s)+' more for free delivery.'}
function checkout(e){e.preventDefault();let c=get();if(!c.length){alert('Your cart is empty.');return}let f=new FormData(e.target),name=f.get('name').trim(),mobile=f.get('mobile').trim(),address=f.get('address').trim(),pin=f.get('pincode').trim();if(!name||!mobile||!address||!pin){alert('Please complete all details.');return}let t=totals(),msg='*Bholi Spices - New Order*%0A%0A'+`Name: ${enc(name)}%0AMobile: ${enc(mobile)}%0AAddress: ${enc(address)}%0APincode: ${enc(pin)}%0A%0A*Items*%0A`;
c.forEach((i,n)=>msg+=`${n+1}. ${enc(i.name)} - ${enc(i.weight)} x ${i.qty} = ${enc(money(i.price*i.qty))}%0A`);msg+=`%0ASubtotal: ${enc(money(t.s))}%0ADelivery: ${enc(t.d?'₹60':'FREE')}%0A*Total: ${enc(money(t.t))}*%0APayment: UPI%0AUPI ID: 7985201404@pzw`;
document.getElementById('paymentBox').style.display='block';document.getElementById('payAmount').textContent=money(t.t);document.getElementById('upiLink').href=`upi://pay?pa=7985201404@pzw&pn=Bholi%20Spices&am=${t.t.toFixed(2)}&cu=INR&tn=Bholi%20Spices%20Order`;document.getElementById('whatsappLink').href='https://wa.me/917068013290?text='+msg;document.getElementById('paymentBox').scrollIntoView({behavior:'smooth'})}
function enc(s){return encodeURIComponent(s)} function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function toast(t){let x=document.getElementById('toast');if(!x){x=document.createElement('div');x.id='toast';x.className='toast';document.body.appendChild(x)}x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),1800)}
window.BholiCart={add,qty,remove,clear,render,update,checkout};document.addEventListener('DOMContentLoaded',()=>{update();render()});
})();
