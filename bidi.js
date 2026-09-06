// Isolate mathematical expressions without changing their source wording.
const expressions=/\b\d{4}-\d{2}-\d{2}\b|\b(?:p|n|N|d|b|OR|R²)\s*(?:[=<>]|≤|≥)\s*[+\-−]?(?:\d[\d,]*(?:\.\d+)?|\.\d+)|[+\-−]?\d+(?:\.\d+)?\s*[–-]\s*[+\-−]?\d+(?:\.\d+)?(?:\s*%)?/g;
export function formatInlineBidi(root){
 root.querySelectorAll('[data-fact]').forEach(el=>el.setAttribute('dir','ltr'));
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
 while(walker.nextNode()){const node=walker.currentNode;if(!node.parentElement?.closest('bdi,script,style,svg')&&node.textContent.match(expressions))nodes.push(node);}
 for(const node of nodes){const text=node.textContent,fragment=document.createDocumentFragment();let end=0;
  for(const match of text.matchAll(expressions)){fragment.append(document.createTextNode(text.slice(end,match.index)));const token=document.createElement('bdi');token.dir='ltr';token.textContent=match[0];fragment.append(token);end=match.index+match[0].length;}
  fragment.append(document.createTextNode(text.slice(end)));node.replaceWith(fragment);
 }
}
