import sys
s=open('index.html').read();v=open('tools/viewer.js').read()
early="<script>window.__E=[];addEventListener('error',e=>{__E.push(e.message+' @'+(e.lineno||''))});</script>"
s=s.replace('<head>','<head>'+early,1)
v=v.replace("document.title='VIEWER ERR '+e.message","document.title='VIEWER ERR '+e.message+' | '+__E.join(' ; ')")
i=s.rindex('</body>');out=s[:i]+'<script>'+v+'</script>'+s[i:]
open('tools/viewer.html','w').write(out)
open('/tmp/mv/v.html','w').write(out.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','three.min.js'))
