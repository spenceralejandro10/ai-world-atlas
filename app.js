(function(){
  const VERSION='20260917-4';
  const scripts=['ranking.js','specialties.js','directory.js','ui.js','atlas-v2.js','atlas-copy.js','community.js'];
  let index=0;
  function loadNext(){
    if(index>=scripts.length){
      if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js?v='+VERSION).catch(()=>{});
      return;
    }
    const script=document.createElement('script');
    script.src=scripts[index]+'?v='+VERSION;
    script.async=false;
    script.onload=function(){index+=1;loadNext()};
    script.onerror=function(){console.error('No se pudo cargar:',scripts[index]);index+=1;loadNext()};
    document.body.appendChild(script);
  }
  loadNext();
})();