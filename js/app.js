const db = window.supabaseClient;
const money = n => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n||0));
const qs = s => document.querySelector(s);
const params = new URLSearchParams(location.search);

function imgUrl(p){ return p?.image_url || p?.product_images?.find(x=>x.is_primary)?.image_url || p?.product_images?.[0]?.image_url || ""; }
function priceHtml(p){
  const sale = p.sale_price != null && Number(p.sale_price) < Number(p.price);
  return sale ? `<span class="old-price">${money(p.price)}</span><strong>${money(p.sale_price)}</strong>` : `<strong>${money(p.price)}</strong>`;
}
function productCard(p){
  const image=imgUrl(p);
  return `<article class="product-card">
    <a href="product.html?slug=${encodeURIComponent(p.slug)}" class="product-image">${image?`<img src="${image}" alt="${p.name}">`:`<span>Pelucinha</span>`}${p.sale_price?`<i>Oferta</i>`:""}</a>
    <div class="product-info"><p class="product-category">${p.categories?.name||""}</p><a href="product.html?slug=${encodeURIComponent(p.slug)}"><h3>${p.name}</h3></a><div class="price">${priceHtml(p)}</div></div>
  </article>`;
}
async function getProducts(){
  if(!db) return [];
  const {data,error}=await db.from("products").select("*, categories(name), product_images(image_url,is_primary,sort_order)").eq("published",true).eq("available",true).order("sort_order",{ascending:true}).order("created_at",{ascending:false});
  if(error){console.error(error);return []} return data||[];
}
async function getCategories(){
  if(!db)return [];
  const {data,error}=await db.from("categories").select("*").eq("active",true).order("sort_order");
  if(error){console.error(error);return []} return data||[];
}
function updateCartCount(){const c=JSON.parse(localStorage.getItem("pelu_cart")||"[]");document.querySelectorAll("#cartCount").forEach(x=>x.textContent=c.reduce((a,i)=>a+i.qty,0));}
async function home(){
  const cats=await getCategories(), ps=await getProducts();
  const ce=qs("#categories"), pe=qs("#featuredProducts");
  if(ce) ce.innerHTML=cats.length?cats.map(c=>`<a class="category-card" href="products.html?category=${encodeURIComponent(c.slug)}"><div>${c.image_url?`<img src="${c.image_url}" alt="${c.name}">`:"✦"}</div><span>${c.name}</span></a>`).join(""):`<div class="empty">Cadastre categorias no painel administrativo.</div>`;
  if(pe){const featured=ps.filter(p=>p.featured).slice(0,8);pe.innerHTML=(featured.length?featured:ps.slice(0,8)).map(productCard).join("")||`<div class="empty">Cadastre produtos no painel administrativo.</div>`}
}
async function listing(){
  const all=await getProducts(), search=qs("#search"), cat=qs("#category"), sort=qs("#sort"), box=qs("#products");
  const cats=await getCategories(); if(cat) cats.forEach(c=>cat.insertAdjacentHTML("beforeend",`<option value="${c.slug}">${c.name}</option>`));
  const wanted=params.get("category"), featured=params.get("featured")==="true"; if(wanted&&cat)cat.value=wanted;
  function render(){
    let arr=[...all], q=(search?.value||"").toLowerCase(), cv=cat?.value||"";
    if(q)arr=arr.filter(p=>p.name.toLowerCase().includes(q)||(p.description||"").toLowerCase().includes(q));
    if(cv)arr=arr.filter(p=>p.categories?.slug===cv);
    if(featured)arr=arr.filter(p=>p.featured);
    const s=sort?.value;if(s==="priceAsc")arr.sort((a,b)=>(a.sale_price??a.price)-(b.sale_price??b.price));if(s==="priceDesc")arr.sort((a,b)=>(b.sale_price??b.price)-(a.sale_price??a.price));
    box.innerHTML=arr.map(productCard).join("")||`<div class="empty">Nenhum produto encontrado.</div>`;
  }
  [search,cat,sort].filter(Boolean).forEach(x=>x.addEventListener("input",render)); render();
}
async function detail(){
  const slug=params.get("slug"), box=qs("#productDetail"); if(!db||!slug){box.innerHTML="<div class='empty'>Produto não encontrado.</div>";return}
  const {data:p,error}=await db.from("products").select("*, categories(name), product_images(image_url,is_primary,sort_order)").eq("slug",slug).eq("published",true).single();
  if(error||!p){box.innerHTML="<div class='empty'>Produto não encontrado.</div>";return}
  const images=(p.product_images||[]).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)); const main=imgUrl(p);
  box.innerHTML=`<div class="gallery"><div class="main-image">${main?`<img id="mainProductImage" src="${main}" alt="${p.name}">`:"Pelucinha"}</div><div class="thumbs">${images.map(i=>`<button onclick="document.querySelector('#mainProductImage').src='${i.image_url}'"><img src="${i.image_url}" alt=""></button>`).join("")}</div></div>
  <div class="detail-copy"><p class="eyebrow">${p.categories?.name||"ACESSÓRIO"}</p><h1>${p.name}</h1><div class="detail-price">${priceHtml(p)}</div><p>${p.description||""}</p><p class="${p.stock>0?"available":"unavailable"}">${p.stock>0?`${p.stock} disponível(is)`:"Produto esgotado"}</p><button class="btn" ${p.stock>0?"":"disabled"} onclick='addToCart(${JSON.stringify({id:p.id,name:p.name,price:p.sale_price??p.price,image:main,stock:p.stock})})'>Adicionar ao carrinho</button></div>`;
}
function addToCart(item){const c=JSON.parse(localStorage.getItem("pelu_cart")||"[]"),i=c.find(x=>x.id===item.id);if(i)i.qty++;else c.push({...item,qty:1});localStorage.setItem("pelu_cart",JSON.stringify(c));updateCartCount();alert("Produto adicionado ao carrinho.");}
function cartPage(){const box=qs("#cart");if(!box)return;const c=JSON.parse(localStorage.getItem("pelu_cart")||"[]");if(!c.length){box.innerHTML='<div class="empty">Seu carrinho está vazio.<br><a class="btn" href="products.html">Ver produtos</a></div>';return}const total=c.reduce((a,i)=>a+i.price*i.qty,0);box.innerHTML=`<div class="cart-list">${c.map((i,n)=>`<div class="cart-item"><div class="cart-thumb">${i.image?`<img src="${i.image}" alt="">`:""}</div><div><h3>${i.name}</h3><p>${money(i.price)} · quantidade ${i.qty}</p></div><button class="remove" onclick="removeCart(${n})">Remover</button></div>`).join("")}</div><div class="cart-summary"><span>Total</span><strong>${money(total)}</strong><button class="btn" onclick="checkout()">Finalizar pedido</button></div>`}
function removeCart(n){const c=JSON.parse(localStorage.getItem("pelu_cart")||"[]");c.splice(n,1);localStorage.setItem("pelu_cart",JSON.stringify(c));cartPage();updateCartCount()}
function checkout(){const c=JSON.parse(localStorage.getItem("pelu_cart")||"[]");const text=c.map(i=>`${i.name} x${i.qty} — ${money(i.price*i.qty)}`).join("%0A");const total=c.reduce((a,i)=>a+i.price*i.qty,0);const url=(window.STORE_WHATSAPP||"").replace(/\D/g,"");if(url)location.href=`https://wa.me/${url}?text=Olá!%20Quero%20fazer%20este%20pedido:%0A${text}%0A%0ATotal:%20${encodeURIComponent(money(total))}`;else alert("Configure o WhatsApp da loja no js/app.js.");}
function base(){updateCartCount();qs("#year")&&(qs("#year").textContent=new Date().getFullYear());qs("#menuBtn")?.addEventListener("click",()=>qs("#mainNav").classList.toggle("open"));if(location.pathname.endsWith("index.html")||location.pathname.endsWith("/"))home();if(qs("#products"))listing();if(qs("#productDetail"))detail();if(qs("#cart"))cartPage();}
document.addEventListener("DOMContentLoaded",base);