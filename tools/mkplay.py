import sys
s=open('index.html').read()
s=s.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','three.min.js')
s=s.replace('<head>','<head><script>window.__RW_TEST=1;</script>',1)
open('/tmp/mv/play.html','w').write(s)
