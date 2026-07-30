(function(){
  const $=(sel,ctx=document)=>ctx.querySelector(sel);
  const $$=(sel,ctx=document)=>Array.from(ctx.querySelectorAll(sel));

  $$('.js-year').forEach(el=>el.textContent=new Date().getFullYear());

  function safe(v){return (v||'').toString().trim();}
  function formDataObject(form){
    const data={};
    new FormData(form).forEach((v,k)=>data[k]=safe(v));
    return data;
  }
  function textFromData(title,data){
    const lines=[title,'='.repeat(title.length),'Fecha de generación: '+new Date().toLocaleString('es-CO'),''];
    Object.entries(data).forEach(([k,v])=>lines.push(k.replace(/_/g,' ').toUpperCase()+':\n'+(v||'No informado')+'\n'));
    lines.push('Aviso: este archivo se genera localmente en el dispositivo. No se envía automáticamente a la Alcaldía.');
    return lines.join('\n');
  }
  function download(name,content,type='text/plain;charset=utf-8'){
    const blob=new Blob([content],{type});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
  }
  $$('.tool-form').forEach(form=>{
    const id=form.id;
    const saved=localStorage.getItem('participa_'+id);
    if(saved){
      try{const obj=JSON.parse(saved);Object.entries(obj).forEach(([k,v])=>{const field=form.elements[k];if(field)field.value=v;});}catch(e){}
    }
    form.addEventListener('input',()=>localStorage.setItem('participa_'+id,JSON.stringify(formDataObject(form))));
    $('.js-download',form)?.addEventListener('click',()=>{
      if(!form.reportValidity())return;
      const data=formDataObject(form);
      download((form.dataset.filename||id)+'.txt',textFromData(form.dataset.title||'Registro ciudadano',data));
      const ok=$('.success',form);if(ok){ok.style.display='block';ok.focus();}
    });
    $('.js-clear',form)?.addEventListener('click',()=>{
      form.reset();localStorage.removeItem('participa_'+id);const ok=$('.success',form);if(ok)ok.style.display='none';
    });
    $('.js-print',form)?.addEventListener('click',()=>window.print());
  });

  $$('.js-download-template').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const path=btn.dataset.template;
      if(path) window.location.href=path;
    });
  });
})();
