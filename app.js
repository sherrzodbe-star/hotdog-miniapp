const tg = window.Telegram.WebApp;
tg.ready(); tg.expand();

const MENU = [
["classic_burger","Classic Burger",35000,"🍔","burger"],
["dabil_burger","Dabil Burger",45000,"🍔","burger"],
["chicken_burger","Chicken Burger",35000,"🍔","burger"],
["kofte_burger","Kofte Burger",45000,"🍔","burger"],
["ultra_hotdog","Ultra Hot Dog",38000,"🌭","hotdog"],
["bolshoy_hotdog","Bolshoy Hot Dog",33000,"🌭","hotdog"],
["sredniy_hotdog","Sredniy Hot Dog",25000,"🌭","hotdog"],
["malenkiy_hotdog","Malenkiy Hot Dog",15000,"🌭","hotdog"],
["clab_sendvich","Clab Sendvich",40000,"🥪","sandwich"],
["obichniy_hotdog","Obichniy Hot Dog",15000,"🌭","hotdog"],
["koroleviski_hotdog","Koroleviski Hot Dog",25000,"🌭","hotdog"],
["corn_hotdog_1","Corn Hot Dog (1 sosiska)",18000,"🌽","hotdog"],
["corn_hotdog_2","Corn Hot Dog (2 sosiska)",28000,"🌽","hotdog"]
];

let cart = {};

const money = n => n.toLocaleString("ru-RU").replaceAll(",", " ") + " so'm";
const item = id => MENU.find(x => x[0] === id);

function render(cat="all"){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.cat===cat));
  const list=MENU.filter(x=>cat==="all"||x[4]===cat);
  products.innerHTML=list.map(x=>`
    <div class="card">
      <div><div class="emoji">${x[3]}</div></div>
      <div style="flex:1;padding:0 12px"><div class="name">${x[1]}</div><div class="price">${money(x[2])}</div></div>
      <button class="add" onclick="add('${x[0]}')">➕</button>
    </div>`).join("");
}
function add(id){cart[id]=(cart[id]||0)+1;renderCart();tg.HapticFeedback?.impactOccurred("light")}
function change(id,d){cart[id]=(cart[id]||0)+d;if(cart[id]<=0)delete cart[id];renderCart()}
function renderCart(){
  const ids=Object.keys(cart), total=ids.reduce((s,id)=>s+item(id)[2]*cart[id],0);
  cartCount.textContent=ids.reduce((s,id)=>s+cart[id],0);
  if(!ids.length){cart.innerHTML="<p>Savat bo'sh.</p>";totalEl();return}
  cart.innerHTML=ids.map(id=>{let x=item(id);return `<div class="row"><span>${x[3]} ${x[1]}</span><span class="qty"><button onclick="change('${id}',-1)">−</button> ${cart[id]} <button onclick="change('${id}',1)">+</button></span></div>`}).join("");
  document.getElementById("total").textContent=money(total);
}
function totalEl(){document.getElementById("total").textContent="0 so'm"}
function openCheckout(){document.getElementById("checkout").classList.remove("hidden");document.getElementById("checkout").scrollIntoView({behavior:"smooth"});renderCart()}
function sendOrder(){
  const ids=Object.keys(cart); if(!ids.length)return alert("Savat bo'sh.");
  const name=document.getElementById("name").value.trim(), phone=document.getElementById("phone").value.trim();
  if(!name||!phone)return alert("Ism va telefonni kiriting.");
  const items=ids.map(id=>{let x=item(id);return {id,name:x[1],qty:cart[id],sum:x[2]*cart[id]}});
  const total=items.reduce((s,x)=>s+x.sum,0);
  tg.sendData(JSON.stringify({name,phone,payment:document.getElementById("payment").value,note:document.getElementById("note").value.trim(),items,total}));
}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>render(b.dataset.cat));
document.getElementById("cartTop").onclick=openCheckout;
document.getElementById("send").onclick=sendOrder;
render();
