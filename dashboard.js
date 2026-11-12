/* Dashboard presentation and report exports. */
const escapeReport = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reportDate = () => new Date().toLocaleDateString('sv-SE');
function saveBlob(blob, name) { const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
function syncExportButton(){ const format=document.querySelector('[name=exportFormat]:checked').value; const button=document.getElementById('btnGenerateExport'); button.innerHTML='<i class="fa-solid fa-download"></i> Baixar '+({pdf:'PDF · A4',jpeg:'JPEG · imagem',csv:'CSV · planilha'}[format]); document.querySelectorAll('#exportModal input[type=checkbox]').forEach(input=>{input.disabled=format==='csv'; input.closest('label').style.opacity=format==='csv'?'.45':'1';}); }
const originalOpenExport = openExportModal;
openExportModal = function(){ originalOpenExport(); syncExportButton(); document.getElementById('btnGenerateExport').focus(); };
const originalCloseExport = closeExportModal;
closeExportModal = function(){ originalCloseExport(); document.querySelector('[onclick="openExportModal()"]').focus(); };
document.addEventListener('keydown', event=>{const modal=document.getElementById('exportModal'); if(modal.classList.contains('hidden'))return; if(event.key==='Escape'&&!document.getElementById('btnGenerateExport').disabled)closeExportModal(); if(event.key==='Tab'){const items=[...modal.querySelectorAll('button,input')].filter(el=>!el.disabled&&el.getClientRects().length); const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
document.querySelectorAll('[name=exportFormat]').forEach(input=>input.addEventListener('change',syncExportButton));
document.querySelector('[onclick="openExportModal()"]').classList.add('download-button');
['kpiTotalKg','kpiMediaTempo','kpiMediaBloco','kpiProdutoNome'].forEach((id,i)=>{const el=document.getElementById(id);el.parentElement.parentElement.classList.add('metric-card');el.parentElement.parentElement.style.setProperty('--accent',['#059669','#3b82f6','#d49a27','#7c63ba'][i]);});
document.querySelectorAll('main canvas').forEach(canvas=>{canvas.parentElement.parentElement.classList.add('chart-panel');canvas.setAttribute('role','img');canvas.setAttribute('aria-label',canvas.parentElement.parentElement.querySelector('h3')?.textContent||'Gráfico de adubação');});
if(typeof Chart!=='undefined'){
 Chart.defaults.font.family='Inter, Arial, sans-serif'; Chart.defaults.color='#60766b'; Chart.defaults.font.size=11;
 Chart.defaults.plugins.tooltip.backgroundColor='#123d2e'; Chart.defaults.plugins.tooltip.padding=12; Chart.defaults.plugins.tooltip.cornerRadius=9;
 Chart.defaults.plugins.legend.labels.usePointStyle=true; Chart.defaults.plugins.legend.labels.padding=18;
 Chart.defaults.datasets.bar.maxBarThickness=56; Chart.defaults.datasets.bar.borderRadius=6;
 Chart.register({id:'readableDashboard',beforeInit(chart){const options=chart.config.options; options.animation=false;options.locale='pt-BR'; if(chart.canvas.id!=='chartProdutoSetor' && options.plugins?.datalabels){options.plugins.datalabels.display=ctx=>ctx.chart.data.labels.length<=12&&ctx.chart.data.datasets.length<=4&&Number(ctx.dataset.data[ctx.dataIndex])>0;options.plugins.datalabels.clamp=true;} if(options.scales){Object.values(options.scales).forEach(axis=>{axis.ticks={...axis.ticks,maxRotation:35,autoSkip:axis.ticks?.autoSkip ?? true};});} },afterDraw(chart){if(!chart.data.datasets.some(dataset=>dataset.data.some(value=>Number(value)>0))){const {ctx,width,height}=chart;ctx.save();ctx.fillStyle='#60766b';ctx.font='13px Inter, Arial';ctx.textAlign='center';ctx.fillText('Sem dados para os filtros selecionados',width/2,height/2);ctx.restore();}}});
}
const exportItems=[['expChartMes','chartMes','Adubação total por mês · kg'],['expChartProdMes','chartProdMes','Aplicação por produto ao mês · kg'],['expChartProdutoSetor','chartProdutoSetor','Total por produto em cada setor · kg'],['expChartSemana','chartSemana','Total aplicado por semana · kg'],['expChartSetor','chartSetor','Distribuição por setor · %'],['expChartAplicador','chartAplicador','Participação por aplicador · %'],['expChartMeio','chartMeio','Total por meio de aplicação · kg']];
generateExport = async function(){
 const button=document.getElementById('btnGenerateExport'); if(button.disabled)return;
 const format=document.querySelector('[name=exportFormat]:checked').value;
 if(!filteredData.length){alert('Não há registros para exportar. Ajuste os filtros.');return;}
 if(format!=='csv'&&!document.querySelector('#exportModal input[type=checkbox]:checked')){alert('Selecione pelo menos um conteúdo para o relatório.');return;}
 if(format==='jpeg'&&document.getElementById('expTable').checked&&filteredData.length>150){alert('Para exportar mais de 150 registros, escolha PDF ou CSV.');return;}
 button.disabled=true;button.textContent='Preparando arquivo…';
 const closeButtons=[...document.querySelectorAll('#exportModal button[onclick="closeExportModal()"]')];closeButtons.forEach(b=>b.disabled=true);
 const root=document.getElementById('exportRenderContainer');
 const saved=root.innerHTML;
 try{
  if(format==='csv'){
   const columns=Object.keys(filteredData[0]); const cell=value=>'"'+String(value??'').replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';
   const csv=[columns.map(cell).join(';'),...filteredData.map(row=>columns.map(key=>cell(row[key])).join(';'))].join('\r\n');
   saveBlob(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}),'adubacao_'+reportDate()+'.csv');return;
  }
  await document.fonts.ready;
  const start=document.getElementById('dateStart').value,end=document.getElementById('dateEnd').value;
  const dateBR=value=>value?value.split('-').reverse().join('/'):'Todo o período';
  const filters=[['Setores',selectedSetores],['Produtos',selectedProdutos],['Aplicadores',selectedAplicadores],['Meios',selectedMeios]].filter(([,values])=>values.length).map(([label,values])=>label+': '+values.join(', ')).join(' · ');
  const header='<div style="border-bottom:3px solid #07815b;padding-bottom:20px;margin-bottom:24px"><p style="color:#07815b;font-size:13px;letter-spacing:2px;font-weight:700">AGROCONTROL / ADUBAÇÃO</p><h1 style="font-size:28px;font-weight:700;margin:10px 0">Relatório de aplicação</h1><p style="font-size:13px;color:#526e60">'+dateBR(start)+' até '+(end?dateBR(end):'último registro')+' · '+filteredData.length.toLocaleString('pt-BR')+' registros</p><p style="font-size:12px;color:#526e60;margin-top:8px">'+escapeReport(filters||'Todos os setores, produtos, aplicadores e meios')+'</p><p style="font-size:11px;color:#718579;margin-top:8px">Gerado em '+new Date().toLocaleString('pt-BR')+'</p></div>';
  const blocks=[];
  if(document.getElementById('expKpis').checked){const labels=['Total aplicado','Tempo médio por aplicação','Média por setor','Produto mais aplicado'];const ids=['kpiTotalKg','kpiMediaTempo','kpiMediaBloco','kpiProdutoNome'];blocks.push('<h2 style="font-size:20px;font-weight:700;margin-bottom:22px">Resumo do período</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">'+ids.map((id,i)=>'<div style="padding:28px;border:1px solid #dae6df;border-radius:14px;background:#f4f8f5"><p style="font-size:13px;color:#60776a">'+labels[i]+'</p><p style="font-size:30px;font-weight:700;color:#086546;margin-top:12px;overflow-wrap:anywhere">'+escapeReport(document.getElementById(id).textContent)+'</p></div>').join('')+'</div>');}
  for(const [check,id,title] of exportItems){if(!document.getElementById(check).checked)continue;const chart=chartInstances[id];if(!chart)continue;let image;try{chart.resize(1120,520);chart.update('none');image=chart.toBase64Image();}finally{chart.resize();chart.update('none');}blocks.push('<h2 style="font-size:20px;font-weight:700;margin-bottom:24px">'+title+'</h2><img style="width:100%;height:auto" src="'+image+'">');}
  if(document.getElementById('expTable').checked){const columns=['Data','Semana','Setor','Produto','Kg','Meio da aplicação','Aplicador'];for(let offset=0;offset<filteredData.length;offset+=22){blocks.push('<h2 style="font-size:20px;font-weight:700;margin-bottom:20px">Registros · '+(offset+1)+' a '+Math.min(offset+22,filteredData.length)+'</h2><table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed"><thead><tr>'+columns.map(c=>'<th style="background:#eaf4ed;padding:10px;border:1px solid #dae5df;text-align:left">'+escapeReport(c)+'</th>').join('')+'</tr></thead><tbody>'+filteredData.slice(offset,offset+22).map((row,i)=>'<tr style="background:'+(i%2?'#f4f7f5':'#fff')+'">'+columns.map(c=>'<td style="padding:9px;border:1px solid #dae5df;overflow-wrap:anywhere">'+escapeReport(row[c])+'</td>').join('')+'</tr>').join('')+'</tbody></table>');}}
  if(!blocks.length)throw new Error('Nenhum conteúdo disponível para exportar.');
  root.style.width='1280px';root.style.padding='48px';root.style.display='block';
  const capture=async content=>{root.innerHTML=content;await Promise.all([...root.querySelectorAll('img')].map(img=>img.decode()));return html2canvas(root,{scale:1.5,useCORS:true,allowTaint:false,backgroundColor:'#fff',logging:false});};
  if(format==='jpeg'){
   const canvas=await capture(header+blocks.map(block=>'<section style="padding:28px 0;border-bottom:1px solid #e2ebe5">'+block+'</section>').join(''));
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.94));if(!blob)throw new Error('Imagem muito grande. Escolha PDF.');saveBlob(blob,'adubacao_'+reportDate()+'.jpg');
  }else{
   const pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
   for(let index=0;index<blocks.length;index++){
    button.textContent='Gerando página '+(index+1)+' de '+blocks.length+'…';
    const canvas=await capture(header+blocks[index]); if(index)pdf.addPage();
    const width=186,height=canvas.height*width/canvas.width;const ratio=Math.min(1,258/height);
    pdf.addImage(canvas.toDataURL('image/jpeg',.94),'JPEG',12,12,width*ratio,height*ratio);
    pdf.setFontSize(9);pdf.setTextColor(95,115,104);pdf.text('AgroControl | '+(index+1)+' / '+blocks.length,12,287);
   }pdf.save('adubacao_'+reportDate()+'.pdf');
  }
  closeExportModal();
 }catch(error){console.error(error);alert('Não foi possível gerar o arquivo: '+error.message);}finally{root.innerHTML=saved;root.style.removeProperty('display');button.disabled=false;closeButtons.forEach(b=>b.disabled=false);syncExportButton();}
};


// Recalculate canvas dimensions after a previously hidden tab becomes visible.
const showDashboardTab = switchTab;
switchTab = function(tabId) {
    showDashboardTab(tabId);
    document.querySelectorAll('.tab-btn').forEach(button => button.setAttribute('aria-selected', String(button.id === 'btn-' + tabId)));
    requestAnimationFrame(() => {
        const panel = document.getElementById(tabId);
        Object.values(chartInstances).forEach(chart => {
            if (panel?.contains(chart.canvas)) { chart.resize(); chart.update('none'); }
        });
    });
};

function buildProductBlockSummary(map, products, blocks) {
    const orderedProducts = [...products].sort((a,b) => a.localeCompare(b, 'pt-BR', {numeric:true}));
    const orderedBlocks = [...blocks].sort((a,b) => a.localeCompare(b, 'pt-BR', {numeric:true}));
    const rows = orderedBlocks.map(block => ({
        block,
        values: orderedProducts.map(product => Number(map[product]?.[block]) || 0)
    }));
    return {products:orderedProducts, rows, totals:orderedProducts.map((_,index) => rows.reduce((sum,row) => sum + row.values[index],0))};
}

renderHorizontalStackedBarChart = function(canvasId, map, products, blocks) {
    const summary = buildProductBlockSummary(map, products, blocks);
    const number = value => value.toLocaleString('pt-BR', {maximumFractionDigits:2});
    const table = document.getElementById('productMatrix');
    const total = summary.totals.reduce((sum,value) => sum + value,0);
    document.getElementById('productMatrixSummary').textContent = summary.rows.length + ' blocos · ' + summary.products.length + ' produtos · ' + number(total) + ' kg';
    if (!summary.rows.length || !summary.products.length) {
        table.innerHTML = '<caption class="matrix-empty">Nenhuma aplicação para os filtros selecionados.</caption>';
    } else {
        table.innerHTML = '<caption class="sr-only">Quantidade aplicada em kg por bloco e produto</caption><thead><tr><th scope="col">Bloco</th>' + summary.products.map(product => '<th scope="col">' + escapeReport(product) + '</th>').join('') + '<th scope="col">Total · kg</th></tr></thead><tbody>' + summary.rows.map(row => '<tr><th scope="row">' + escapeReport(row.block) + '</th>' + row.values.map(value => '<td class="' + (value ? '' : 'matrix-zero') + '">' + (value ? number(value) : '—') + '</td>').join('') + '<td class="matrix-total">' + number(row.values.reduce((sum,value) => sum + value,0)) + '</td></tr>').join('') + '</tbody><tfoot><tr><th scope="row">Total · kg</th>' + summary.totals.map(value => '<td>' + number(value) + '</td>').join('') + '<td>' + number(total) + '</td></tr></tfoot>';
    }
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    canvas.parentElement.style.height = Math.max(360, summary.rows.length * 48 + Math.ceil(summary.products.length / 5) * 24 + 90) + 'px';
    const productNames = [...new Set(allData.map(row => (row.Produto || 'Sem nome').trim()))].sort((a,b) => a.localeCompare(b,'pt-BR',{numeric:true}));
    chartInstances[canvasId] = new Chart(canvas.getContext('2d'), {
        type:'bar',
        data:{labels:summary.rows.map(row=>row.block), datasets:summary.products.map((product,index)=>({
            label:product, data:summary.rows.map(row=>row.values[index]),
            backgroundColor:colorPalette[Math.max(0,productNames.indexOf(product)) % colorPalette.length],
            borderColor:'#ffffff', borderWidth:1, borderRadius:3, maxBarThickness:30
        }))},
        options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,animation:false,
            interaction:{mode:'nearest',intersect:true},
            layout:{padding:{right:16,top:8}},
            scales:{x:{stacked:true,beginAtZero:true,title:{display:true,text:'Quantidade aplicada · kg'},grid:{color:'#eaf0ec'},ticks:{callback:value=>number(Number(value))}},y:{stacked:true,grid:{display:false},ticks:{autoSkip:false,font:{weight:'600'}}}},
            plugins:{legend:{position:'bottom',labels:{boxWidth:10,padding:16,font:{size:11}}},
                tooltip:{callbacks:{label:context=>context.dataset.label + ': ' + number(context.raw) + ' kg',footer:items=>{const row=summary.rows[items[0]?.dataIndex];return row ? 'Total do bloco: '+number(row.values.reduce((sum,value)=>sum+value,0))+' kg' : '';}}},
                datalabels:{display:'auto',anchor:'center',align:'center',clamp:true,color:'#163f30',backgroundColor:'#ffffffeb',borderRadius:4,padding:3,font:{size:10,weight:'600'},formatter:value=>value>0 ? number(value) : ''}
            }
        }
    });
};
