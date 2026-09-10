import * as THREE from './vendor/three.module.min.js';

export function createWorld(container,onSelect) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-20,20,20,-20,.1,180);
  let renderer;
  try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'}); }
  catch {container.querySelector('.world-fallback').hidden=false;return {select(){},flow(){},rotate(){},reset(){},pause(){}};}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setClearColor(0x101211,0); renderer.outputColorSpace=THREE.SRGBColorSpace;
  container.prepend(renderer.domElement);
  scene.add(new THREE.AmbientLight(0xdfe7d5,2.3));
  const light=new THREE.DirectionalLight(0xfff5d5,3); light.position.set(-12,24,16);scene.add(light);
  const fill=new THREE.DirectionalLight(0x869cc9,1);fill.position.set(18,8,-10);scene.add(fill);
  const root=new THREE.Group();scene.add(root);
  const serverRoot=new THREE.Group();scene.add(serverRoot);serverRoot.visible=false;
  const matCache=new Map(), objects=[], nodeMeshes=new Map();
  const colors={power:'#f7ce46',compute:'#75bd64',cooling:'#41b9ef',network:'#ee6252',operations:'#b59cde'};
  const nodes={power:[-10,3.4,-3.8],compute:[1,4.7,0],cooling:[5.8,3.5,-8.4],network:[7.8,3.2,7.8],operations:[-6.2,3,7.6]};
  function box(x,y,z,w,h,d,color,id,group=root){
    if(!matCache.has(color))matCache.set(color,new THREE.MeshStandardMaterial({color,roughness:1}));
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),matCache.get(color));mesh.position.set(x,y+h/2,z);group.add(mesh);
    if(id){mesh.userData.node=id;objects.push(mesh);if(!nodeMeshes.has(id))nodeMeshes.set(id,[]);nodeMeshes.get(id).push(mesh);}return mesh;
  }
  const line=(points,color,width=.055)=>{const g=new THREE.Group();root.add(g);for(let i=1;i<points.length;i++){const a=new THREE.Vector3(...points[i-1]),b=new THREE.Vector3(...points[i]);const m=new THREE.Mesh(new THREE.BoxGeometry(width,width,a.distanceTo(b)),new THREE.MeshBasicMaterial({color}));m.position.copy(a).add(b).multiplyScalar(.5);m.lookAt(b);g.add(m);}return g;};
  // A cutaway facility makes infrastructure paths visible without hiding the servers.
  box(0,-.9,0,28,.7,24,'#262d28');box(0,-.2,0,27.7,.15,23.7,'#424b3f');
  for(let x=-13;x<=13;x+=1)line([[x,-.025,-11.8],[x,-.025,11.8]],'#50584a',.014);
  for(let z=-11;z<=11;z+=1)line([[-13.8,-.025,z],[13.8,-.025,z]],'#50584a',.014);
  box(1,0,0,15,.25,13,'#6b7567');box(1,.25,0,14.5,.08,12.5,'#94988a');
  // Low walls and columns imply the hall while keeping a continuous cutaway.
  box(1,.33,-6.2,14.8,1.1,.22,'#a0a397');box(-6.3,.33,0,.22,1.1,12.5,'#a0a397');
  for(const x of [-6.25,8.25])for(const z of [-6.2,6.2])box(x,.33,z,.22,3.9,.22,'#a7aa9c');
  for(const x of [-6.25,8.25])box(x,4.23,0,.22,.18,12.6,'#858d7f');
  box(1,4.23,-6.2,14.7,.18,.22,'#858d7f');
  for(let r=0;r<3;r++)for(let n=0;n<5;n++){
    const x=-3.8+n*2.05,z=-3.7+r*3.65;
    box(x,.34,z,1.25,2.65,1.35,'#212923','compute');
    box(x,.35,z+.69,1.14,2.53,.06,'#101814','compute');
    box(x,2.99,z,1.29,.08,1.4,'#55604d','compute');
    for(let s=0;s<7;s++){
      box(x,.55+s*.3,z+.738,1.03,.19,.035,'#374334','compute');
      box(x-.35,.6+s*.3,z+.763,.065,.045,.025,s%3===0?'#f7ce46':'#7ecb62','compute');
      box(x+.2,.59+s*.3,z+.762,.32,.02,.025,'#101710','compute');
    }
    box(x+.52,.45,z+.73,.055,2.35,.045,'#708065','compute');
  }
  for(const z of [-2.15,1.5,5.05])box(1,.34,z,12,.018,.8,'#6895a1');
  // Overhead network trays and yellow power busways.
  for(const z of [-3.7,-.05,3.6]){box(.3,3.5,z,12.5,.13,.22,'#d9b54b','pdu');box(.3,3.75,z-.35,12.5,.14,.25,'#81564b','network');}
  // Incoming grid transformer, switchgear, UPS batteries, and standby generation.
  box(-10,0,-4,4.8,.2,7.2,'#757765','power');
  box(-10,.2,-5.3,2.55,1.75,2.3,'#7b8170','transformer');
  for(let x=-11.2;x<=-8.8;x+=.3)box(x,.35,-4.09,.12,1.35,.16,'#a3a486','transformer');
  for(const x of [-10.65,-10,-9.35]){box(x,1.95,-5.3,.16,.7,.16,'#d0c8a1','transformer');box(x,2.37,-5.3,.4,.1,.4,'#857c5b','transformer');}
  for(let i=0;i<3;i++){box(-11.35+i*1.13,.2,-1.8,.95,2.3,1.3,'#8d927d','switchgear');box(-11.35+i*1.13,1.35,-1.125,.43,.55,.035,'#2c3726','switchgear');box(-11.35+i*1.13,2.13,-1.115,.06,.06,.03,'#f7ce46','switchgear');}
  box(-10,0,3.6,4.8,.2,4.6,'#737763','generator');box(-10,.2,3.6,3.7,1.85,2.5,'#d1b752','generator');
  for(let i=0;i<7;i++)box(-10.9+i*.28,.5,4.87,.1,1.22,.06,'#5f6038','generator');
  box(-8.75,1.9,3.1,.18,1.3,.18,'#7b7b67','generator');box(-8.9,3.08,3.1,.5,.15,.25,'#555c4d','generator');
  for(let i=0;i<2;i++){box(-5.4,.34,-3+i*2,1.05,2.2,1.4,'#66725a','ups');for(let j=0;j<4;j++)box(-5.4,.55+j*.43,-2.28+i*2,.8,.25,.03,'#a1a889','ups');}
  // Roofless cooling plant and liquid-to-liquid interface at the hall edge.
  for(let i=0;i<3;i++){
    const x=-.2+i*4;
    box(x,0,-9,3.5,.25,3.5,'#737d70','cooling');box(x,.25,-9,3.25,1.65,3.15,'#93a69c','heat-rejection');
    box(x,1.9,-9,3.28,.12,3.18,'#c1c9b7','heat-rejection');
    for(const dz of [-.72,.72]){
      box(x,2.02,-9+dz,1.32,.12,1.17,'#394b47','heat-rejection');
      box(x,2.15,-9+dz,1.09,.045,.2,'#718c80','heat-rejection');box(x,2.15,-9+dz,.2,.045,.99,'#718c80','heat-rejection');
    }
    for(let j=0;j<6;j++)box(x-1.64,.42+j*.21,-9,.035,.08,2.8,'#627e71','heat-rejection');
  }
  for(const x of [1,5]){box(x,.34,-5.3,1.3,1.75,.8,'#73a0a5','cdu');box(x,1.4,-4.88,.62,.32,.03,'#23484c','cdu');}
  box(8.8,0,-.5,1.25,2.4,4,'#8ba59b','air-handler');for(let i=0;i<9;i++)box(8.8,.45+i*.2,1.52,1.03,.07,.05,'#364e43','air-handler');
  // Fiber entrance and network racks.
  box(7.2,0,8.4,6.3,.2,3.8,'#737865','network');
  for(let i=0;i<3;i++){box(5.4+i*1.75,.2,8.4,1.3,2.35,1.4,'#514e42','switch');for(let j=0;j<6;j++){box(5.4+i*1.75,.43+j*.32,9.12,1.1,.21,.04,'#84665a','switch');for(let k=0;k<4;k++)box(5.02+i*1.75+k*.23,.5+j*.32,9.15,.08,.05,.02,'#f59c62','switch');}}
  line([[12.5,.17,11.9],[12.5,.17,8.4],[9.5,.17,8.4]],'#ee6252',.12);
  // Operations, access gate, and small pixel people.
  box(-4.5,0,8.5,5.6,.2,3.5,'#7e806d','operations');box(-4.5,.2,7.1,5.6,1.7,.2,'#9b9e87','operations');box(-6.6,.2,8.45,.18,1.7,2.6,'#9b9e87','operations');
  box(-4.5,.2,7.8,3.8,1.1,.8,'#707861','monitoring');
  for(let i=0;i<3;i++){box(-5.65+i*1.12,1.3,7.85,.89,.68,.09,'#202e24','monitoring');box(-5.65+i*1.12,1.4,7.9,.74,.48,.035,'#7fa6a0','monitoring');}
  box(-2.3,0,11,.15,1.5,.15,'#c2c4a8','security');box(-5.8,0,11,.15,1.5,.15,'#c2c4a8','security');box(-4.05,1.3,11,3.5,.13,.13,'#ece7ca','security');
  for(let i=0;i<5;i++)box(-5.3+i*.62,1.29,11.08,.3,.15,.03,'#e0604a','security');
  function person(x,z,c){box(x,0,z,.35,.55,.28,'#36483b');box(x,.55,z,.55,.57,.3,c);box(x,1.12,z,.37,.37,.36,'#d9b791');box(x,1.45,z,.43,.12,.4,'#e5d36e');}
  person(-3.7,9,'#b5a1cb');person(5.7,5.4,'#609abb');person(-9.2,7,'#e17a55');
  function tree(x,z,size=1){box(x,0,z,.25,1,.25,'#726447');box(x,.75,z,1.4*size,1.1*size,1.4*size,'#48713d');box(x,1.4,z,1*size,.95*size,1*size,'#619149');box(x,2.1,z,.45*size,.45*size,.45*size,'#7d9f50');}
  for(const p of [[-12.7,9.5],[-12.7,-9.8],[12.6,-9.5],[12.8,3.5],[11.8,10.2],[-.2,11.1]])tree(...p,.8);
  for(let i=0;i<12;i++)box(-11.5+i*1.8,.01,11.6,.55,.06,.18,'#869e64');
  box(10.8,0,8.5,1.1,1.2,.8,'#bc6d59','fiber');
  box(-6.1,.34,5.1,.15,1,.4,'#d85349','fire');
  // A ground-level circuit visually binds the power yard to the hall.
  line([[-13.8,.06,-8],[-10,.06,-8],[-10,.06,-6]],'#c7ad4c',.12);
  // A separate open chassis makes the nested scale inspectable.
  const sb=(x,y,z,w,h,d,color,id)=>box(x,y,z,w,h,d,color,id,serverRoot);
  sb(0,0,0,16,.3,10,'#788680','server');sb(0,.3,-4.9,16,1.5,.2,'#aeb9b0','server');
  sb(-7.9,.3,0,.2,1.2,10,'#aeb9b0','server');sb(7.9,.3,0,.2,1.2,10,'#8a9990','server');
  sb(0,.3,0,15,.1,9,'#234d37','server');
  sb(-3.2,.4,-1.2,3,.25,3,'#aeb3a6','cpu');sb(-3.2,.65,-1.2,2.3,.15,2.3,'#424844','cpu');
  for(let i=0;i<9;i++)sb(-4.2+i*.25,.8,-1.2,.12,.65,2.25,'#bbc5b9','cpu');
  for(let i=0;i<4;i++){sb(-6.45+i*.48,.4,-1.2,.17,.85,3,'#448259','memory');for(let j=0;j<5;j++)sb(-6.34+i*.48,.63,-2.36+j*.52,.06,.42,.35,'#151e18','memory');}
  for(let i=0;i<3;i++){const x=.8+i*2.15;sb(x,.4,-.4,1.6,.45,5.4,'#547a9f','gpu');for(let k=0;k<7;k++)sb(x-.6+k*.2,.85,-.4,.1,.75,4.5,'#87a2b1','gpu');}
  for(let i=0;i<4;i++){sb(-5.7+i*1.5,.4,3.5,1.2,.6,1.8,'#cba94d','storage');sb(-5.7+i*1.5,.55,4.43,.86,.24,.03,'#393c29','storage');}
  for(let i=0;i<3;i++){sb(1.2+i*2.1,.4,3.45,1.5,1.4,1.5,'#536c62','server');sb(1.2+i*2.1,.65,4.23,1.17,.93,.05,'#263e35','server');sb(1.2+i*2.1,1.03,4.28,.8,.18,.04,'#759383','server');}
  sb(-5.7,.4,-3.9,3.4,1.1,1.5,'#9b9e85','server');sb(6.1,.4,-3.9,2.1,.6,1.3,'#b36f55','nic');
  for(let i=0;i<3;i++)sb(5.4+i*.5,.55,-4.59,.3,.25,.1,'#202d24','nic');
  sb(-.3,.4,-3.1,1.05,.28,1.2,'#6cb4c1','cold-plate');sb(-.3,.68,-3.1,.7,.16,.85,'#9cd6de','cold-plate');
  const serverNodes={cpu:[-3.2,2,-1.2],gpu:[3,2.3,-.4],memory:[-6.3,1.9,-1.2],storage:[-4,1.7,3.5],nic:[6.1,1.8,-3.9]};
  // Batch static boxes by material and equipment to retain picking with fewer draw calls.
  for(const group of [root,serverRoot]){
    const batches=new Map();
    for(const mesh of [...group.children]){if(!mesh.isMesh)continue;const key=mesh.material.uuid+':'+(mesh.userData.node||'');if(!batches.has(key))batches.set(key,[]);batches.get(key).push(mesh);}
    for(const meshes of batches.values()){
      const inst=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),meshes[0].material,meshes.length);inst.userData.node=meshes[0].userData.node;
      meshes.forEach((m,i)=>{m.updateMatrix();const p=m.geometry.parameters;const matrix=m.matrix.clone().multiply(new THREE.Matrix4().makeScale(p.width,p.height,p.depth));inst.setMatrixAt(i,matrix);group.remove(m);m.geometry.dispose();const oi=objects.indexOf(m);if(oi>=0)objects.splice(oi,1);});
      inst.computeBoundingBox();inst.computeBoundingSphere();group.add(inst);if(inst.userData.node)objects.push(inst);
    }
  }
  nodeMeshes.clear();objects.forEach(m=>{const id=m.userData.node;if(!nodeMeshes.has(id))nodeMeshes.set(id,[]);nodeMeshes.get(id).push(m);});
  const halo=new THREE.Group();scene.add(halo);halo.visible=false;
  const outlineMat=new THREE.MeshBasicMaterial({color:0xf7ce46});
  for(const [x,z,w,d] of [[0,-1.15,2.5,.045],[0,1.15,2.5,.045],[-1.25,0,.045,2.3],[1.25,0,.045,2.3]]){const m=new THREE.Mesh(new THREE.BoxGeometry(w,.04,d),outlineMat);m.position.set(x,.1,z);halo.add(m);}
  const hitNodes={transformer:'power',switchgear:'power',generator:'power',ups:'power',pdu:'power',cdu:'cooling','heat-rejection':'cooling','air-handler':'cooling','cold-plate':'cooling',switch:'network',fiber:'network',nic:'network',monitoring:'operations',security:'operations',fire:'operations',cpu:'compute',gpu:'compute',memory:'compute',storage:'compute',server:'compute'};
  const hotContainer=container.querySelector('#hotspots'), hotspots=[];
  for(const [entries,isServer] of [[nodes,false],[serverNodes,true]])Object.entries(entries).forEach(([id,pos],i)=>{const b=document.createElement('button');b.className='hotspot';b.textContent=isServer?({cpu:'CPU',gpu:'GPU',memory:'RAM',storage:'SSD',nic:'NIC'}[id]):String(i+2).padStart(2,'0');if(isServer)b.classList.add('chip-hotspot');b.style.setProperty('--node-color',colors[hitNodes[id]||id]);b.setAttribute('aria-label','Explore '+({compute:'servers',network:'connectivity',operations:'operations'}[id]||id));b.onclick=()=>onSelect(id);hotContainer.append(b);hotspots.push({id,isServer,el:b,position:new THREE.Vector3(...pos)});});
  let azimuth=.72,targetAzimuth=.72,zoom=1,targetZoom=1,selected='overview',paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let serverView=false,needsRender=true;
  const target=new THREE.Vector3(),lookAt=new THREE.Vector3();
  let flowId=null,flowGroup=null,flowPackets=[],flowTime=0;
  function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);const aspect=w/h;const v=aspect<1?21/aspect:19;camera.left=-v*aspect;camera.right=v*aspect;camera.top=v;camera.bottom=-v;camera.updateProjectionMatrix();needsRender=true;}
  new ResizeObserver(resize).observe(container);resize();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let start=null,dragged=false;
  container.addEventListener('pointerdown',e=>{if(e.target!==renderer.domElement)return;start={x:e.clientX,y:e.clientY,az:targetAzimuth,pointerId:e.pointerId};dragged=false;});
  container.addEventListener('pointermove',e=>{if(!start||start.pointerId!==e.pointerId)return;const dx=e.clientX-start.x;if(Math.hypot(dx,e.clientY-start.y)>5)dragged=true;if(Math.abs(dx)>5)targetAzimuth=start.az-dx*.008;});
  window.addEventListener('pointercancel',()=>{start=null;dragged=false;});
  window.addEventListener('pointerup',e=>{if(!start||start.pointerId!==e.pointerId)return;const click=!dragged;start=null;if(!click||e.target!==renderer.domElement)return;const rect=container.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(objects.filter(m=>m.parent.visible))[0];if(hit)onSelect(hit.object.userData.node);});
  container.addEventListener('wheel',e=>{e.preventDefault();targetZoom=THREE.MathUtils.clamp(targetZoom-e.deltaY*.001,0.7,1.7);},{passive:false});
  container.addEventListener('keydown',e=>{if(e.target!==container)return;if(e.key==='ArrowLeft'){targetAzimuth-=.2;e.preventDefault();}if(e.key==='ArrowRight'){targetAzimuth+=.2;e.preventDefault();}if(e.key==='+'||e.key==='='){targetZoom=Math.min(1.7,targetZoom+.1);e.preventDefault();}if(e.key==='-'){targetZoom=Math.max(.7,targetZoom-.1);e.preventDefault();}});
  const pathDefs={
    power:[{points:[[-13.5,.3,-8],[-10,.3,-8],[-10,2.6,-5.3],[-10,2.6,-1.8],[-5.4,2.6,-1],[-5.4,3.55,-3.7],[4.4,3.55,-3.7],[4.4,1.4,-3.7]],color:'#f7ce46'}],
    cooling:[{points:[[1,1.9,0],[1,2.6,-5.3],[1,2.6,-7],[4,2.6,-7],[4,2.6,-9],[4,4.7,-9]],color:'#ee6252'},{points:[[3.5,2.4,-9],[3.5,2.4,-7.4],[1.2,2.4,-7.4],[1.2,2.4,-5.8]],color:'#41b9ef'},{points:[[.7,2.4,-4.8],[.5,2.4,-3.8],[.5,1.8,0]],color:'#41b9ef'}],
    network:[{points:[[12.5,.4,11.8],[12.5,.4,8.4],[7.2,2.8,8.4],[7.2,3.95,3.25],[-3.8,3.95,3.25],[-3.8,1.4,3.6]],color:'#ee6252'}]
  };
  function setFlow(id){flowId=id;needsRender=true;if(flowGroup){root.remove(flowGroup);flowGroup.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}flowPackets=[];flowGroup=null;if(!id)return;
    flowGroup=new THREE.Group();root.add(flowGroup);
    for(const def of pathDefs[id]){const pts=def.points.map(p=>new THREE.Vector3(...p));const lengths=[0];for(let i=1;i<pts.length;i++)lengths.push(lengths.at(-1)+pts[i].distanceTo(pts[i-1]));
      for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];const tube=new THREE.Mesh(new THREE.BoxGeometry(.075,.075,a.distanceTo(b)),new THREE.MeshBasicMaterial({color:def.color,transparent:true,opacity:.5}));tube.position.copy(a).add(b).multiplyScalar(.5);tube.lookAt(b);flowGroup.add(tube);}
      for(let n=0;n<9;n++){const packet=new THREE.Mesh(new THREE.BoxGeometry(.25,.25,.25),new THREE.MeshBasicMaterial({color:def.color}));flowGroup.add(packet);flowPackets.push({mesh:packet,points:pts,lengths,total:lengths.at(-1),offset:n/9});}
    }
  }
  let last=0;
  function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;
    const moving=Math.abs(targetAzimuth-azimuth)>.0001||Math.abs(targetZoom-zoom)>.0001||target.distanceToSquared(lookAt)>.00001;
    if(!needsRender&&!moving&&(paused||!flowId||serverView))return;
    needsRender=false;const ease=matchMedia('(prefers-reduced-motion: reduce)').matches?1:.085;azimuth+=(targetAzimuth-azimuth)*ease;zoom+=(targetZoom-zoom)*ease;lookAt.lerp(target,ease);camera.position.set(lookAt.x+Math.sin(azimuth)*38,31,lookAt.z+Math.cos(azimuth)*38);camera.lookAt(lookAt);camera.zoom=zoom;camera.updateProjectionMatrix();
    if(!paused)flowTime+=dt;
    for(const p of flowPackets){const d=((flowTime*.095+p.offset)%1)*p.total;let s=1;while(s<p.lengths.length-1&&p.lengths[s]<d)s++;const t=(d-p.lengths[s-1])/(p.lengths[s]-p.lengths[s-1]);p.mesh.position.copy(p.points[s-1]).lerp(p.points[s],t);}
    scene.updateMatrixWorld();camera.updateMatrixWorld();
    for(const h of hotspots){h.el.hidden=h.isServer!==serverView;if(h.el.hidden)continue;const v=h.position.clone().project(camera);h.el.style.left=((v.x*.5+.5)*container.clientWidth)+'px';h.el.style.top=((-v.y*.5+.5)*container.clientHeight)+'px';h.el.classList.toggle('selected',selected===h.id||hitNodes[selected]===h.id);}
    renderer.render(scene,camera);
  }requestAnimationFrame(frame);
  return {select(id){selected=id;needsRender=true;serverView=['server','cpu','gpu','memory','storage','nic','cold-plate'].includes(id);root.visible=!serverView;serverRoot.visible=serverView;
    const ms=nodeMeshes.get(id)?.filter(m=>m.parent.visible);halo.visible=!!ms?.length;
    if(ms?.length){const bounds=new THREE.Box3();ms.forEach(m=>bounds.expandByObject(m));const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());halo.position.set(center.x,serverView?.45:.38,center.z);halo.scale.set(Math.max(size.x/2.4,.7),1,Math.max(size.z/2.2,.7));outlineMat.color.set(colors[hitNodes[id]||id]||'#f7ce46');}
    if(serverView){target.set(0,0,0);targetZoom=1.65;targetAzimuth=.45;}
    else if(id==='overview'){target.set(0,0,0);targetZoom=1;targetAzimuth=.72;}
    else {const p=nodes[hitNodes[id]||id]||[0,0,0];target.set(p[0]*.65,0,p[2]*.65);targetZoom=1.3;targetAzimuth=id==='cooling'||hitNodes[id]==='cooling'?1.05:.72;}
  },flow:setFlow,rotate(d){targetAzimuth+=d*.35;},reset(){targetAzimuth=.72;targetZoom=serverView?1.65:1;target.set(0,0,0);},pause(v){paused=v;needsRender=true;}};
}
