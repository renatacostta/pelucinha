const db=window.supabaseClient;
const qs=s=>document.querySelector(s);
let products=[], categories=[];
function money(n){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(n||0))}
async function isAdmin(){if(!db)return false;const {data:{user}}=await db.auth.getUser();if(!user)return false;const {data}=await db.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();return !!data}
async function boot(){if(!db){qs("#loginMsg").textContent="Configure js/config.js com seu Supabase.";return}if(await isAdmin())showDash();else qs("#dashboard").hidden=true}
function showDash(){qs("#authBox").hidden=true;qs("#dashboard").hidden=false;load()}
async function load(){const pr=await db.from("products").select("*,categories(name),product_images(image_url,is_primary)").order("created_at",{ascending:false});products=pr.data||[];const ca=await db.from("categories").select("*").order("sort_order");categories=ca.data||[];render()}
function render(){qs("#stats").innerHTML=[["Produtos",products.length],["Publicados",products.filter(p=>p.published).length],["Sem estoque",products.filter(p=>p.stock<=0).length],["Categorias",categories.length]].map(x=>`<div class="stat"><small>${x[0]}</small><strong>${x[1]}</strong></div>`).join("");renderProducts();renderCats()}
function renderProducts(){const q=(qs("#adminSearch")?.value||"").toLowerCase();const arr=products.filter(p=>p.name.toLowerCase().includes(q));qs("#adminProducts").innerHTML=arr.map(p=>`<div class="admin-row"><div><b>${p.name}</b><small>${p.categories?.name||"Sem categoria"} · ${money(p.sale_price??p.price)} · estoque ${p.stock}</small></div><span class="status ${p.published?"on":""}">${p.published?"Publicado":"Rascunho"}</span><button onclick="editProduct('${p.id}')">Editar</button><button class="danger" onclick="deleteProduct('${p.id}')">Excluir</button></div>`).join("")||"<p>Nenhum produto.</p>"}
function renderCats(){qs("#adminCategories").innerHTML=categories.map(c=>`<div class="admin-row"><div><b>${c.name}</b><small>${c.slug}</small></div><span class="status ${c.active?"on":""}">${c.active?"Ativa":"Inativa"}</span><button onclick="editCategory('${c.id}')">Editar</button><button class="danger" onclick="deleteCategory('${c.id}')">Excluir</button></div>`).join("")||"<p>Nenhuma categoria.</p>"}
function openModal(html){qs("#modalContent").innerHTML=html;qs("#modal").hidden=false}
function closeModal(){qs("#modal").hidden=true}
async function saveProduct(id){
  const f=qs("#productForm");
  const data={
    name:f.name.value.trim(),slug:f.slug.value.trim(),description:f.description.value,
    price:Number(f.price.value),sale_price:f.sale_price.value?Number(f.sale_price.value):null,
    category_id:f.category_id.value||null,stock:Number(f.stock.value),
    available:f.available.checked,published:f.published.checked,featured:f.featured.checked,
    sort_order:Number(f.sort_order.value||0)
  };
  let productId=id;
  let result;
  if(id) result=await db.from("products").update(data).eq("id",id).select().single();
  else result=await db.from("products").insert(data).select().single();
  if(result.error){alert(result.error.message);return}
  productId=result.data.id;

  const files=[...(qs("#imageFiles")?.files||[])];
  if(files.length){
    for(let i=0;i<files.length;i++){
      const file=files[i];
      const ext=(file.name.split(".").pop()||"jpg").toLowerCase();
      const path=`${productId}/${crypto.randomUUID()}.${ext}`;
      const up=await db.storage.from("product-images").upload(path,file,{upsert:false});
      if(up.error){alert("Produto salvo, mas uma imagem não foi enviada: "+up.error.message);continue}
      const pub=db.storage.from("product-images").getPublicUrl(path);
      const ins=await db.from("product_images").insert({
        product_id:productId,image_url:pub.data.publicUrl,
        alt_text:data.name,sort_order:i,is_primary:i===0
      });
      if(ins.error) alert("Produto salvo, mas o registro de uma imagem falhou: "+ins.error.message);
    }
  }
  closeModal();load();
}
function productForm(p={}){
  const imgs=(p.product_images||[]).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  openModal(`<h2>${p.id?"Editar":"Novo"} produto</h2><form id="productForm" class="form-grid">
<label>Nome<input name="name" required value="${p.name||""}"></label>
<label>Slug<input name="slug" required value="${p.slug||""}"></label>
<label>Preço<input name="price" type="number" step="0.01" required value="${p.price??""}"></label>
<label>Preço promocional<input name="sale_price" type="number" step="0.01" value="${p.sale_price??""}"></label>
<label>Categoria<select name="category_id"><option value="">Sem categoria</option>${categories.map(c=>`<option value="${c.id}" ${p.category_id===c.id?"selected":""}>${c.name}</option>`).join("")}</select></label>
<label>Estoque<input name="stock" type="number" min="0" value="${p.stock??0}"></label>
<label>Ordem<input name="sort_order" type="number" value="${p.sort_order??0}"></label>
<label class="check"><input name="available" type="checkbox" ${p.available!==false?"checked":""}> Disponível</label>
<label class="check"><input name="published" type="checkbox" ${p.published?"checked":""}> Publicado</label>
<label class="check"><input name="featured" type="checkbox" ${p.featured?"checked":""}> Destaque</label>
<label class="full">Descrição<textarea name="description">${p.description||""}</textarea></label>
<label class="full">Adicionar imagens<input id="imageFiles" type="file" accept="image/*" multiple></label>
${imgs.length?`<div class="full"><small>Imagens atuais: ${imgs.length}. Para substituir, adicione novas imagens e remova as antigas pelo banco até a próxima versão do uploader.</small></div>`:""}
<div class="full form-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn">Salvar</button></div></form>`);
  qs("#productForm").addEventListener("submit",e=>{e.preventDefault();saveProduct(p.id)})
}
async function editProduct(id){productForm(products.find(p=>p.id===id))}
async function deleteProduct(id){if(!confirm("Excluir este produto?"))return;const {error}=await db.from("products").delete().eq("id",id);if(error)alert(error.message);else load()}
async function saveCategory(id){const f=qs("#categoryForm"),data={name:f.name.value.trim(),slug:f.slug.value.trim(),description:f.description.value,active:f.active.checked,sort_order:Number(f.sort_order.value||0)};const {error}=id?await db.from("categories").update(data).eq("id",id):await db.from("categories").insert(data);if(error)alert(error.message);else{closeModal();load()}}
function categoryForm(c={}){openModal(`<h2>${c.id?"Editar":"Nova"} categoria</h2><form id="categoryForm" class="form-grid"><label>Nome<input name="name" required value="${c.name||""}"></label><label>Slug<input name="slug" required value="${c.slug||""}"></label><label>Ordem<input name="sort_order" type="number" value="${c.sort_order??0}"></label><label class="check"><input name="active" type="checkbox" ${c.active!==false?"checked":""}> Ativa</label><label class="full">Descrição<textarea name="description">${c.description||""}</textarea></label><div class="full form-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancelar</button><button class="btn">Salvar</button></div></form>`);qs("#categoryForm").addEventListener("submit",e=>{e.preventDefault();saveCategory(c.id)})}
function editCategory(id){categoryForm(categories.find(c=>c.id===id))}
async function deleteCategory(id){if(products.some(p=>p.category_id===id)){alert("Esta categoria possui produtos. Mova os produtos antes de excluir.");return}if(!confirm("Excluir esta categoria?"))return;const {error}=await db.from("categories").delete().eq("id",id);if(error)alert(error.message);else load()}
document.addEventListener("DOMContentLoaded",async()=>{qs("#loginForm")?.addEventListener("submit",async e=>{e.preventDefault();const {error}=await db.auth.signInWithPassword({email:qs("#email").value,password:qs("#password").value});qs("#loginMsg").textContent=error?error.message:"Entrando...";if(!error)showDash()});qs("#logoutBtn")?.addEventListener("click",async()=>{await db.auth.signOut();location.reload()});qs("#newProductBtn")?.addEventListener("click",()=>productForm());qs("#newCategoryBtn")?.addEventListener("click",()=>categoryForm());qs("#closeModal")?.addEventListener("click",closeModal);qs("#adminSearch")?.addEventListener("input",renderProducts);boot()});