const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const API_URL = "https://hotdog-miniapp.onrender.com/api/order";

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

let cart = JSON.parse(localStorage.getItem("hotdog_cart") || "{}");
const $ = id => document.getElementById(id);
const money = n => n.toLocaleString("ru-RU").replaceAll(",", " ") + " so'm";
const item = id => MENU.find(x => x[0] === id);

function saveCart(){ localStorage.setItem("hotdog_cart", JSON.stringify(cart)); }

function render(cat="all"){
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.cat === cat));
  const list = MENU.filter(x => cat === "all" || x[4] === cat);
  $("products").innerHTML = list.map(x => {
    const q = cart[x[0]] || 0;
    return `<div class="card">
      <div class="emoji">${x[3]}</div>
      <div class="info"><div class="name">${x[1]}</div><div class="price">${money(x[2])}</div></div>
      <div class="controls">
        <button class="qtyBtn" onclick="change('${x[0]}',-1)">−</button>
        <b>${q}</b>
        <button class="qtyBtn" onclick="change('${x[0]}',1)">+</button>
      </div>
    </div>`;
  }).join("");
}

function add(id){ change(id, 1); }
function change(id, delta){
  cart[id] = (cart[id] || 0) + delta;
  if(cart[id] <= 0) delete cart[id];
  saveCart();
  render();
  renderCart();
  tg.HapticFeedback?.impactOccurred("light");
}

function cartTotal(){
  return Object.keys(cart).reduce((s,id) => s + item(id)[2] * cart[id], 0);
}

function renderCart(){
  const ids = Object.keys(cart);
  $("cartCount").textContent = ids.reduce((s,id) => s + cart[id], 0);
  $("total").textContent = money(cartTotal());
  if(!ids.length){ $("cart").innerHTML = "<p>Savat bo'sh.</p>"; return; }
  $("cart").innerHTML = ids.map(id => {
    const x = item(id);
    return `<div class="row">
      <span>${x[3]} ${x[1]}</span>
      <span class="qty"><button onclick="change('${id}',-1)">−</button><b>${cart[id]}</b><button onclick="change('${id}',1)">+</button></span>
    </div>`;
  }).join("");
}

function openCheckout(){
  if(!Object.keys(cart).length){
    tg.showAlert ? tg.showAlert("Avval mahsulot tanlang.") : alert("Avval mahsulot tanlang.");
    return;
  }
  $("checkout").classList.remove("hidden");
  $("checkout").scrollIntoView({behavior:"smooth", block:"start"});
  renderCart();
}

async function sendOrder(){
  const ids = Object.keys(cart);
  if(!ids.length) return alert("Savat bo'sh.");
  const name = $("name").value.trim();
  const phone = $("phone").value.trim();
  if(!name || !phone) return alert("Ism va telefonni kiriting.");

  const items = ids.map(id => {
    const x = item(id);
    return {id, name:x[1], qty:cart[id], sum:x[2]*cart[id]};
  });

  const payload = {
    initData: tg.initData,
    user: tg.initDataUnsafe?.user || null,
    name,
    phone,
    payment: $("payment").value,
    note: $("note").value.trim(),
    items,
    total: cartTotal()
  };

  const btn = $("send");
  btn.disabled = true;
  btn.textContent = "⏳ Yuborilmoqda...";

  try{
    const res = await fetch(API_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if(!res.ok || !data.ok) throw new Error(data.error || "Server xatosi");

    cart = {};
    saveCart();
    render();
    renderCart();
    $("checkout").classList.add("hidden");
    $("name").value = "";
    $("phone").value = "";
    $("note").value = "";
    tg.HapticFeedback?.notificationOccurred("success");
    tg.showPopup ? tg.showPopup({title:"Buyurtma qabul qilindi", message:"Tez orada siz bilan bog'lanamiz. 🌭", buttons:[{type:"ok"}]}) : alert("Buyurtma qabul qilindi!");
  }catch(err){
    console.error(err);
    tg.showAlert ? tg.showAlert("Buyurtma yuborilmadi. Server hali ulanmagan yoki xatolik yuz berdi.") : alert("Buyurtma yuborilmadi. Serverni tekshiring.");
  }finally{
    btn.disabled = false;
    btn.textContent = "✅ Buyurtmani yuborish";
  }
}

document.querySelectorAll(".tab").forEach(b => b.onclick = () => render(b.dataset.cat));
$("cartTop").onclick = openCheckout;
$("send").onclick = sendOrder;
render();
renderCart();
