let DATA = [];
const COLORS = ['#0f2747','#159a9c','#607080','#7b8fa1','#2f6f8f'];

function num(v){
  if(v === null || v === undefined || v === '' || v === 'null' || v === 'NaN' || v === 'nan') return 0;
  const n = Number(String(v).replace(/,/g,'').trim());
  return Number.isFinite(n) ? n : 0;
}
function parseCSV(text){
  const rows=[]; let row=[], cell='', quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], next=text[i+1];
    if(c === '"' && quoted && next === '"'){cell+='"'; i++; continue}
    if(c === '"'){quoted=!quoted; continue}
    if(c === ',' && !quoted){row.push(cell); cell=''; continue}
    if((c === '\n' || c === '\r') && !quoted){
      if(c === '\r' && next === '\n') i++;
      row.push(cell); cell='';
      if(row.some(x=>x.trim()!=='')) rows.push(row);
      row=[]; continue;
    }
    cell+=c;
  }
  if(cell!=='' || row.length){row.push(cell); rows.push(row)}
  const headers=rows.shift().map(x=>x.trim());
  return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]??'').trim()])));
}
function unique(field){
  return [...new Set(DATA.map(d=>d[field]).filter(v=>v!=='' && v!=null))].sort();
}
function fillSelect(id, values){
  const el=document.getElementById(id);
  el.innerHTML=values.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function selected(id){
  return [...document.getElementById(id).selectedOptions].map(o=>o.value);
}
function dateValue(d){
  return d.Order_Date ? new Date(d.Order_Date+'T00:00:00') : null;
}
function filtered(){
  const cats=selected('category'), statuses=selected('status'), payments=selected('payment'), states=selected('state');
  const from=document.getElementById('dateFrom').value;
  const to=document.getElementById('dateTo').value;

  // Compare YYYY-MM strings instead of browser-dependent date parsing.
  const fromMonth = from ? from.slice(0,7) : '';
  const toMonth = to ? to.slice(0,7) : '';

  return DATA.filter(d=>{
    if(cats.length && !cats.includes(d.Category)) return false;
    if(statuses.length && !statuses.includes(d.Order_Status)) return false;
    if(payments.length && !payments.includes(d.Payment_Mode)) return false;
    if(states.length && !(states.includes(d.State)||states.includes(d.City))) return false;

    const orderMonth = String(d.Order_Date || '').trim().slice(0,7);
    if(fromMonth && orderMonth && orderMonth < fromMonth) return false;
    if(toMonth && orderMonth && orderMonth > toMonth) return false;

    return true;
  });
}
function money(v){return '₹'+Math.round(v).toLocaleString('en-IN')}
function baseLayout(){
  return {
    margin:{l:48,r:20,t:10,b:45},
    paper_bgcolor:'#fff', plot_bgcolor:'#fff',
    font:{family:'Inter, Segoe UI, Arial',size:10,color:'#1d2939'},
    colorway:COLORS,
    hoverlabel:{font:{size:11}}
  };
}
function commonConfig(){return {responsive:true,displaylogo:false,modeBarButtonsToRemove:['lasso2d','select2d']};}

function render(){
  const rows=filtered();
  document.getElementById('filterInfo').textContent=`Showing ${rows.length} of ${DATA.length} records`;

  const sales=rows.reduce((s,d)=>s+num(d.Sales),0);
  const net=rows.reduce((s,d)=>s+num(d.Net_Amount),0);
  const profit=rows.reduce((s,d)=>s+num(d.Profit),0);
  const orders=new Set(rows.map(d=>d.Order_ID).filter(Boolean)).size;
  const discounts=rows.filter(d=>d.Discount!=='').map(d=>num(d.Discount));
  const avgDiscount=discounts.length?discounts.reduce((a,b)=>a+b,0)/discounts.length:0;
  const returned=new Set(rows.filter(d=>d.Order_Status==='Returned').map(d=>d.Order_ID)).size;

  document.getElementById('kSales').textContent=money(sales);
  document.getElementById('kNet').textContent=money(net);
  document.getElementById('kProfit').textContent=money(profit);
  document.getElementById('kOrders').textContent=orders.toLocaleString('en-IN');
  document.getElementById('kDiscount').textContent=avgDiscount.toFixed(1)+'%';
  document.getElementById('returnRate').textContent='Return Rate: '+(orders?((returned/orders)*100).toFixed(1):0)+'%';

  const months={};
  rows.filter(d=>d.Order_Date).forEach(d=>{
    const m=d.Order_Date.slice(0,7);
    months[m]=(months[m]||0)+num(d.Sales);
  });
  const monthKeys=Object.keys(months).sort();
  Plotly.react('trend',[{
    x:monthKeys.map(m=>new Date(m+'-01')),
    y:monthKeys.map(m=>months[m]),
    type:'scatter',mode:'lines+markers',
    line:{color:'#159a9c',width:3},
    marker:{size:7},
    hovertemplate:'%{x|%b %Y}<br>Sales: ₹%{y:,.0f}<extra></extra>'
  }],{...baseLayout(),xaxis:{title:'Month'},yaxis:{title:'Sales (₹)',tickformat:',.0f'}},commonConfig());

  const statusMap={};
  rows.forEach(d=>statusMap[d.Order_Status]=(statusMap[d.Order_Status]||0)+1);
  Plotly.react('statusChart',[{
    labels:Object.keys(statusMap),values:Object.values(statusMap),type:'pie',hole:.58,
    marker:{colors:COLORS},textinfo:'label+percent',hovertemplate:'%{label}: %{value} orders<extra></extra>'
  }],{...baseLayout(),margin:{l:10,r:10,t:10,b:10},showlegend:false},commonConfig());

  const catMap={};
  rows.forEach(d=>catMap[d.Category]=(catMap[d.Category]||0)+num(d.Sales));
  const cats=Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  Plotly.react('categoryChart',[{
    x:cats.map(x=>x[0]),y:cats.map(x=>x[1]),type:'bar',
    marker:{color:'#159a9c'},hovertemplate:'%{x}<br>Sales: ₹%{y:,.0f}<extra></extra>'
  }],{...baseLayout(),xaxis:{title:'Category'},yaxis:{title:'Sales (₹)',tickformat:',.0f'}},commonConfig());

  const prodMap={};
  rows.forEach(d=>prodMap[d.Product]=(prodMap[d.Product]||0)+num(d.Sales));
  const products=Object.entries(prodMap).sort((a,b)=>b[1]-a[1]).slice(0,5).reverse();
  Plotly.react('productChart',[{
    x:products.map(x=>x[1]),y:products.map(x=>x[0]),type:'bar',orientation:'h',
    marker:{color:'#0f2747'},hovertemplate:'%{y}<br>Sales: ₹%{x:,.0f}<extra></extra>'
  }],{...baseLayout(),xaxis:{title:'Sales (₹)',tickformat:',.0f'},yaxis:{automargin:true}},commonConfig());

  const stateMap={};
  rows.forEach(d=>stateMap[d.State]=(stateMap[d.State]||0)+num(d.Sales));
  const coords={
    'Delhi':[28.6139,77.2090],'Maharashtra':[19.7515,75.7139],
    'Rajasthan':[27.0238,74.2179],'Karnataka':[15.3173,75.7139],
    'Uttar Pradesh':[26.8467,80.9462],'Tamil Nadu':[11.1271,78.6569],
    'Gujarat':[22.2587,71.1924],'West Bengal':[22.9868,87.8550]
  };
  const states=Object.entries(stateMap).filter(([s])=>coords[s]);
  Plotly.react('mapChart',[{
    type:'scattergeo',lat:states.map(x=>coords[x[0]][0]),lon:states.map(x=>coords[x[0]][1]),
    text:states.map(x=>x[0]),mode:'markers',
    marker:{size:states.map(x=>Math.max(12,Math.sqrt(x[1])/18)),color:'#159a9c',opacity:.78},
    customdata:states.map(x=>x[1]),
    hovertemplate:'%{text}<br>Sales: ₹%{customdata:,.0f}<extra></extra>'
  }],{
    ...baseLayout(),geo:{scope:'asia',center:{lat:22.5,lon:79},projection:{type:'mercator'},
    showcountries:true,countrycolor:'#d8dee7',showland:true,landcolor:'#f4f7fa',
    lonaxis:{range:[67,98]},lataxis:{range:[6,36]}}
  },commonConfig());

  const payMap={};
  rows.forEach(d=>payMap[d.Payment_Mode]=(payMap[d.Payment_Mode]||0)+1);
  Plotly.react('paymentChart',[{
    labels:Object.keys(payMap),values:Object.values(payMap),type:'pie',hole:.45,
    marker:{colors:COLORS},textinfo:'label+percent',hovertemplate:'%{label}: %{value} orders<extra></extra>'
  }],{...baseLayout(),margin:{l:10,r:10,t:10,b:10},showlegend:false},commonConfig());

  Plotly.react('scatterChart',[{
    x:rows.map(d=>num(d.Discount)),y:rows.map(d=>num(d.Profit)),type:'scatter',mode:'markers',
    marker:{size:8,color:'#159a9c',opacity:.7},
    customdata:rows.map(d=>[d.Order_ID,d.Customer_Name,num(d.Sales)]),
    hovertemplate:'Discount: %{x:.1f}%<br>Profit: ₹%{y:,.0f}<br>Order: %{customdata[0]}<br>Customer: %{customdata[1]}<br>Sales: ₹%{customdata[2]:,.0f}<extra></extra>'
  }],{...baseLayout(),xaxis:{title:'Discount (%)'},yaxis:{title:'Profit (₹)',tickformat:',.0f'}},commonConfig());

  const profitMap={};
  rows.forEach(d=>profitMap[d.Category]=(profitMap[d.Category]||0)+num(d.Profit));
  const prof=Object.entries(profitMap).sort((a,b)=>b[1]-a[1]);
  Plotly.react('profitChart',[{
    x:prof.map(x=>x[0]),y:prof.map(x=>x[1]),type:'bar',
    marker:{color:'#0f2747'},hovertemplate:'%{x}<br>Profit: ₹%{y:,.0f}<extra></extra>'
  }],{...baseLayout(),xaxis:{title:'Category'},yaxis:{title:'Profit (₹)',tickformat:',.0f'}},commonConfig());
}

function showDetail(category){
  const rows=filtered().filter(d=>d.Category===category);
  const map={};
  rows.forEach(d=>{
    const p=d.Product||'Unknown';
    if(!map[p]) map[p]={orders:new Set(),sales:0,net:0,profit:0,discount:[]};
    if(d.Order_ID) map[p].orders.add(d.Order_ID);
    map[p].sales+=num(d.Sales); map[p].net+=num(d.Net_Amount); map[p].profit+=num(d.Profit);
    if(d.Discount!=='') map[p].discount.push(num(d.Discount));
  });
  const body=document.getElementById('detailBody');
  body.innerHTML=Object.entries(map).sort((a,b)=>b[1].sales-a[1].sales).map(([p,x])=>{
    const avg=x.discount.length?x.discount.reduce((a,b)=>a+b,0)/x.discount.length:0;
    return `<tr><td>${escapeHtml(p)}</td><td>${x.orders.size}</td><td>${money(x.sales)}</td><td>${money(x.net)}</td><td>${money(x.profit)}</td><td>${avg.toFixed(1)}%</td></tr>`;
  }).join('');
  document.getElementById('detailTitle').textContent=`Product Detail — ${category}`;
  document.getElementById('dashboard').style.display='none';
  document.getElementById('detail').style.display='block';
  window.scrollTo({top:0,behavior:'smooth'});
}
function closeDetail(){
  document.getElementById('detail').style.display='none';
  document.getElementById('dashboard').style.display='grid';
}

function setupFilters(){
  fillSelect('category',unique('Category'));
  fillSelect('status',unique('Order_Status'));
  fillSelect('payment',unique('Payment_Mode'));
  const states=[...new Set([...DATA.map(d=>d.State),...DATA.map(d=>d.City)].filter(Boolean))].sort();
  fillSelect('state',states);

  const dates=DATA.map(d=>String(d.Order_Date || '').trim()).filter(Boolean).sort();
  const months=[...new Set(dates.map(d=>d.slice(0,7)))].sort();
  const opts=months.map(m=>{
    const [y,mo]=m.split('-').map(Number);
    const label=new Date(y,mo-1,1).toLocaleString('en-US',{month:'short',year:'numeric'});
    return {value:m,label};
  });
  document.getElementById('dateFrom').innerHTML=opts.map(o=>`<option value="${o.value}-01">${o.label}</option>`).join('');
  document.getElementById('dateTo').innerHTML=opts.map(o=>`<option value="${o.value}-31">${o.label}</option>`).join('');
  if(opts.length){
    document.getElementById('dateFrom').value=opts[0].value+'-01';
    document.getElementById('dateTo').value=opts[opts.length-1].value+'-31';
  }

  document.querySelectorAll('select').forEach(el=>el.addEventListener('change',render));
  document.getElementById('reset').addEventListener('click',()=>{
    document.querySelectorAll('select[multiple] option').forEach(o=>o.selected=false);
    if(opts.length){
      document.getElementById('dateFrom').value=opts[0].value+'-01';
      document.getElementById('dateTo').value=opts[opts.length-1].value+'-31';
    }
    render();
  });
  document.getElementById('backBtn').addEventListener('click',closeDetail);
  document.getElementById('categoryChart').on('plotly_click',ev=>{
    if(ev.points && ev.points[0]) showDetail(ev.points[0].x);
  });
}

fetch('./Final_Clean_Ecommerce.csv')
  .then(r=>{
    if(!r.ok) throw new Error(`CSV request failed: ${r.status}`);
    return r.text();
  })
  .then(text=>{
    DATA=parseCSV(text);
    if(!DATA.length) throw new Error('CSV contains no data rows');
    setupFilters();
    render();
  })
  .catch(err=>{
    document.getElementById('filterInfo').textContent='Dashboard data could not be loaded. Check that Final_Clean_Ecommerce.csv is in the same folder as index.html.';
    console.error('Dashboard error:', err);
  });
