import * as THREE from './vendor/three.module.min.js';

export function createWorld(container,onSelect) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-20,20,20,-20,.1,180);
  let renderer;
  try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'}); }
  catch {container.querySelector('.world-fallback').hidden=false;return {select(){},flow(){},journey(){},clearFocus(){},reset(){},pause(){}};}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setClearColor(0x080808,1); renderer.outputColorSpace=THREE.SRGBColorSpace;
  container.prepend(renderer.domElement);
  scene.add(new THREE.AmbientLight(0xffffff,1.1));
  const light=new THREE.DirectionalLight(0xffffff,2.1); light.position.set(-12,24,16);scene.add(light);
  const fill=new THREE.DirectionalLight(0xbecbdf,.45);fill.position.set(18,8,-10);scene.add(fill);
  const root=new THREE.Group();scene.add(root);
  const serverRoot=new THREE.Group();scene.add(serverRoot);serverRoot.position.set(38,0,-4);
  const matCache=new Map(), objects=[], nodeMeshes=new Map();
  const colors={power:'#f7ce46',compute:'#75bd64',cooling:'#41b9ef',network:'#ee6252',operations:'#b59cde'};
  const nodes={power:[-10,3.4,-3.8],compute:[1,4.7,0],cooling:[5.8,3.5,-8.4],network:[7.8,3.2,7.8],operations:[-6.2,3,7.6]};
  function box(x,y,z,w,h,d,color,id,group=root){
    if(!matCache.has(color))matCache.set(color,new THREE.MeshLambertMaterial({color}));
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),matCache.get(color));mesh.position.set(x,y+h/2,z);group.add(mesh);
    if(id){mesh.userData.node=id;objects.push(mesh);if(!nodeMeshes.has(id))nodeMeshes.set(id,[]);nodeMeshes.get(id).push(mesh);}return mesh;
  }
  const line=(points,color,width=.055)=>{const g=new THREE.Group();root.add(g);for(let i=1;i<points.length;i++){const a=new THREE.Vector3(...points[i-1]),b=new THREE.Vector3(...points[i]);const m=new THREE.Mesh(new THREE.BoxGeometry(width,width,a.distanceTo(b)),new THREE.MeshBasicMaterial({color}));m.position.copy(a).add(b).multiplyScalar(.5);m.lookAt(b);g.add(m);}return g;};
  // A cutaway facility makes infrastructure paths visible without hiding the servers.
  box(0,-.9,0,28,.7,24,'#161616');box(0,-.2,0,27.7,.15,23.7,'#242424');
  for(let x=-13;x<=13;x+=1)line([[x,-.025,-11.8],[x,-.025,11.8]],'#383838',.014);
  for(let z=-11;z<=11;z+=1)line([[-13.8,-.025,z],[13.8,-.025,z]],'#383838',.014);
  box(1,0,0,15,.25,13,'#424242');box(1,.25,0,14.5,.08,12.5,'#555555');
  // Low walls and columns imply the hall while keeping a continuous cutaway.
  box(1,.33,-6.2,14.8,1.1,.22,'#9b9b9b');box(-6.3,.33,0,.22,1.1,12.5,'#9b9b9b');
  for(const x of [-6.25,8.25])for(const z of [-6.2,6.2])box(x,.33,z,.22,3.9,.22,'#bdbdbd');
  for(const x of [-6.25,8.25])box(x,4.23,0,.22,.18,12.6,'#858585');
  box(1,4.23,-6.2,14.7,.18,.22,'#858585');
  for(let r=0;r<3;r++)for(let n=0;n<5;n++){
    const x=-3.8+n*2.05,z=-3.7+r*3.65;
    box(x,.34,z,1.25,2.65,1.35,'#1a1a1a','compute');
    box(x,.35,z+.69,1.14,2.53,.06,'#080808','compute');
    box(x,2.99,z,1.29,.08,1.4,'#525252','compute');
    for(let s=0;s<7;s++){
      box(x,.55+s*.3,z+.738,1.03,.19,.035,'#3c3c3c','compute');
      box(x-.35,.6+s*.3,z+.763,.065,.045,.025,s%3===0?'#f7ce46':'#32bb43','compute');
      box(x+.2,.59+s*.3,z+.762,.32,.02,.025,'#101710','compute');
    }
    box(x+.52,.45,z+.73,.055,2.35,.045,'#777777','compute');
  }
  for(const z of [-2.15,1.5,5.05])box(1,.34,z,12,.018,.8,'#256e94');
  // Overhead network trays and yellow power busways.
  for(const z of [-3.7,-.05,3.6]){box(.3,3.5,z,12.5,.13,.22,'#eccc37','pdu');box(.3,3.75,z-.35,12.5,.14,.25,'#bb392b','network');}
  // Incoming grid transformer, switchgear, UPS batteries, and standby generation.
  box(-10,0,-4,4.8,.2,7.2,'#555555','power');
  box(-10,.2,-5.3,2.55,1.75,2.3,'#777777','transformer');
  for(let x=-11.2;x<=-8.8;x+=.3)box(x,.35,-4.09,.12,1.35,.16,'#aaaaaa','transformer');
  for(const x of [-10.65,-10,-9.35]){box(x,1.95,-5.3,.16,.7,.16,'#cccccc','transformer');box(x,2.37,-5.3,.4,.1,.4,'#8a8a8a','transformer');}
  for(let i=0;i<3;i++){box(-11.35+i*1.13,.2,-1.8,.95,2.3,1.3,'#8d8d8d','switchgear');box(-11.35+i*1.13,1.35,-1.125,.43,.55,.035,'#1f1f1f','switchgear');box(-11.35+i*1.13,2.13,-1.115,.06,.06,.03,'#f7ce46','switchgear');}
  box(-10,0,3.6,4.8,.2,4.6,'#555555','generator');box(-10,.2,3.6,3.7,1.85,2.5,'#dcbe37','generator');
  for(let i=0;i<7;i++)box(-10.9+i*.28,.5,4.87,.1,1.22,.06,'#595137','generator');
  box(-8.75,1.9,3.1,.18,1.3,.18,'#777777','generator');box(-8.9,3.08,3.1,.5,.15,.25,'#555555','generator');
  for(let i=0;i<2;i++){box(-5.4,.34,-3+i*2,1.05,2.2,1.4,'#656565','ups');for(let j=0;j<4;j++)box(-5.4,.55+j*.43,-2.28+i*2,.8,.25,.03,'#9d9d9d','ups');}
  // Roofless cooling plant and liquid-to-liquid interface at the hall edge.
  for(let i=0;i<3;i++){
    const x=-.2+i*4;
    box(x,0,-9,3.5,.25,3.5,'#666666','cooling');box(x,.25,-9,3.25,1.65,3.15,'#999999','heat-rejection');
    box(x,1.9,-9,3.28,.12,3.18,'#b8b8b8','heat-rejection');
    for(const dz of [-.72,.72]){
      box(x,2.02,-9+dz,1.32,.12,1.17,'#282828','heat-rejection');
      box(x,2.15,-9+dz,1.09,.045,.2,'#666666','heat-rejection');box(x,2.15,-9+dz,.2,.045,.99,'#666666','heat-rejection');
    }
    for(let j=0;j<6;j++)box(x-1.64,.42+j*.21,-9,.035,.08,2.8,'#525252','heat-rejection');
  }
  for(const x of [1,5]){box(x,.34,-5.3,1.3,1.75,.8,'#278aba','cdu');box(x,1.4,-4.88,.62,.32,.03,'#163540','cdu');}
  box(8.8,0,-.5,1.25,2.4,4,'#aaaaaa','air-handler');for(let i=0;i<9;i++)box(8.8,.45+i*.2,1.52,1.03,.07,.05,'#505050','air-handler');
  // Fiber entrance and network racks.
  box(7.2,0,8.4,6.3,.2,3.8,'#555555','network');
  for(let i=0;i<3;i++){box(5.4+i*1.75,.2,8.4,1.3,2.35,1.4,'#353535','switch');for(let j=0;j<6;j++){box(5.4+i*1.75,.43+j*.32,9.12,1.1,.21,.04,'#64504c','switch');for(let k=0;k<4;k++)box(5.02+i*1.75+k*.23,.5+j*.32,9.15,.08,.05,.02,'#f2693c','switch');}}
  line([[12.5,.17,11.9],[12.5,.17,8.4],[9.5,.17,8.4]],'#ee6252',.12);
  // Operations, access gate, and small pixel people.
  box(-4.5,0,8.5,5.6,.2,3.5,'#555555','operations');box(-4.5,.2,7.1,5.6,1.7,.2,'#888888','operations');box(-6.6,.2,8.45,.18,1.7,2.6,'#888888','operations');
  box(-4.5,.2,7.8,3.8,1.1,.8,'#555555','monitoring');
  for(let i=0;i<3;i++){box(-5.65+i*1.12,1.3,7.85,.89,.68,.09,'#202e24','monitoring');box(-5.65+i*1.12,1.4,7.9,.74,.48,.035,'#278fb9','monitoring');}
  box(-2.3,0,11,.15,1.5,.15,'#999999','security');box(-5.8,0,11,.15,1.5,.15,'#999999','security');box(-4.05,1.3,11,3.5,.13,.13,'#ddd','security');
  for(let i=0;i<5;i++)box(-5.3+i*.62,1.29,11.08,.3,.15,.03,'#e0604a','security');
  function person(x,z,c){box(x,0,z,.35,.55,.28,'#36483b');box(x,.55,z,.55,.57,.3,c);box(x,1.12,z,.37,.37,.36,'#d9b791');box(x,1.45,z,.43,.12,.4,'#e5d36e');}
  person(-3.7,9,'#b5a1cb');person(5.7,5.4,'#609abb');person(-9.2,7,'#e17a55');
  function tree(x,z,size=1){box(x,0,z,.25,1,.25,'#726447');box(x,.75,z,1.4*size,1.1*size,1.4*size,'#1b7032');box(x,1.4,z,1*size,.95*size,1*size,'#279340');box(x,2.1,z,.45*size,.45*size,.45*size,'#3cad42');}
  for(const p of [[-12.7,9.5],[-12.7,-9.8],[12.6,-9.5],[12.8,3.5],[11.8,10.2],[-.2,11.1]])tree(...p,.8);
  for(let i=0;i<12;i++)box(-11.5+i*1.8,.01,11.6,.55,.06,.18,'#258e32');
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

  // The title and landmarks inhabit the same ground as the machines.
  const glyphs={A:['01110','11011','11011','11111','11011','11011','11011'],B:['11110','11011','11011','11110','11011','11011','11110'],C:['01111','11000','11000','11000','11000','11000','01111'],D:['11110','11011','11011','11011','11011','11011','11110'],E:['11111','11000','11000','11110','11000','11000','11111'],F:['11111','11000','11000','11110','11000','11000','11000'],G:['01111','11000','11000','11011','11011','11011','01111'],H:['11011','11011','11011','11111','11011','11011','11011'],I:['11111','00100','00100','00100','00100','00100','11111'],K:['11011','11011','11110','11100','11110','11011','11011'],L:['11000','11000','11000','11000','11000','11000','11111'],M:['10001','11011','11111','10101','10101','10001','10001'],N:['10001','11001','11101','11111','10111','10011','10001'],O:['01110','11011','11011','11011','11011','11011','01110'],P:['11110','11011','11011','11110','11000','11000','11000'],R:['11110','11011','11011','11110','11100','11010','11011'],S:['01111','11000','11000','01110','00011','00011','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['11011','11011','11011','11011','11011','11011','01110'],V:['11011','11011','11011','11011','01010','01010','00100'],W:['10001','10001','10101','10101','11111','11011','10001'],'0':['01110','11011','11011','11011','11011','11011','01110'],'1':['00100','01100','00100','00100','00100','00100','11111'],'2':['01110','11011','00011','00110','01100','11000','11111'],'3':['11110','00011','00011','01110','00011','00011','11110'],'4':['11011','11011','11011','11111','00011','00011','00011'],'5':['11111','11000','11000','11110','00011','00011','11110'],'6':['01110','11000','11000','11110','11011','11011','01110']};
  function voxelText(text,x,z,scale=.5,color='#727272',accent=false){let cursor=x;for(const char of text){const rows=glyphs[char];if(rows)rows.forEach((row,r)=>[...row].forEach((v,c)=>{if(v==='1'){const signal=accent&&(r*17+c*3+Math.round(cursor*10))%31===0;box(cursor+c*scale,.04,z+r*scale,scale*.93,scale*.5,scale*.93,signal?['#e83329','#e0c82c','#238cbf','#228c39'][(c+r)%4]:color);}}));cursor+=scale*6;}}
  voxelText('DATA',-17,15,1.0,'#888888',true);voxelText('CENTER',-17,24,1.0,'#888888',true);
  voxelText('POWER',-21,-13,.38,'#c2ac34');voxelText('COMPUTE',-4,7.2,.27,'#53a957');voxelText('COOLING',-3,-14,.3,'#328abd');
  voxelText('NETWORK',7,13,.29,'#ba4234');voxelText('PEOPLE',-13,12,.3,'#888888');
  voxelText('INSIDE',29,-12,.45,'#888888');voxelText('A SERVER',29,-8,.32,'#888888');
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(170,140),new THREE.MeshLambertMaterial({color:'#080808'}));ground.rotation.x=-Math.PI/2;ground.position.set(7,-.1,10);scene.add(ground);
  const tileGeometry=new THREE.BoxGeometry(.22,.075,.22),tileMaterial=new THREE.MeshLambertMaterial({color:'#242424'}),tiles=new THREE.InstancedMesh(tileGeometry,tileMaterial,170*135);
  const tm=new THREE.Matrix4();let ti=0;for(let x=0;x<170;x++)for(let z=0;z<135;z++){tm.makeTranslation((x-85)*.8,.003,(z-55)*.8);tiles.setMatrixAt(ti++,tm);}tiles.computeBoundingSphere();scene.add(tiles);
  // Pixel groves create depth and frame the journey without a floating model plinth.
  for(let i=0;i<34;i++){const x=-31+(i%5)*2.7,z=-10+Math.floor(i/5)*5.5;tree(x,z,.55+(i%3)*.16);}
  for(let i=0;i<24;i++){const x=17+(i%4)*2.7,z=-21+Math.floor(i/4)*4;tree(x,z,.55+(i%3)*.16);}
  for(let i=0;i<12;i++)tree(-25+i*4.8,38+((i*7)%4),.7);
  for(let i=0;i<130;i++){const x=((i*37)%111)-47,z=((i*19)%81)-29;if(Math.abs(x)<15&&Math.abs(z)<13)continue;if(x>-23&&x<22&&z>14&&z<33)continue;box(x,0,z,.18,.13,.6,'#1f682c');box(x+.25,0,z+.15,.18,.3,.18,'#278438');}
  for(let i=0;i<29;i++){const x=((i*23)%84)-39,z=((i*31)%75)-23;if(Math.abs(x)<16&&Math.abs(z)<13)continue;box(x,.1,z,.5,.5,.5,['#d52c24','#d5bb30','#2586b2','#278e39'][i%4]);}
  // A utility corridor approaches the transformer yard.
  for(const z of [-18,-1,17]){
    const x=-20;line([[x-1.2,0,z-.8],[x-.4,8,z-.3],[x+.4,8,z-.3],[x+1.2,0,z-.8]],'#777777',.13);
    line([[x-1.2,0,z+.8],[x-.4,8,z+.3],[x+.4,8,z+.3],[x+1.2,0,z+.8]],'#777777',.13);
    for(let y=0;y<7;y+=1.4){const w=1.2-y*.1;line([[x-w,y,z+.7],[x+w-.14,y+1.4,z+.6]],'#666666',.08);line([[x+w,y,z+.7],[x-w+.14,y+1.4,z+.6]],'#666666',.08);}
    box(x,6.5,z,5.4,.19,.25,'#888888');box(x,8,z,3.5,.19,.25,'#999999');for(const dx of [-2.4,2.4])box(x+dx,6.1,z,.16,.4,.16,'#bfbfbf');
  }
  for(const x of [-22.4,-17.6])line([[x,6.15,-18],[x,5.2,-9.5],[x,6.15,-1],[x,5.2,8],[x,6.15,17]],'#787878',.035);
  line([[-20,.2,-18],[-20,.2,-6],[-12,.2,-6]],'#d4b931',.1);
  // A small service vehicle moves through the same landscape.
  const van=new THREE.Group();root.add(van);
  box(0,.4,0,1.5,1.4,2.8,'#cb3027',null,van);box(0,.4,1.8,1.5,1.1,.9,'#cb3027',null,van);box(0,1.05,2.27,1.2,.35,.025,'#318eb8',null,van);
  for(const x of [-.8,.8])for(const z of [-.7,1.5])box(x,.1,z,.25,.55,.6,'#292929',null,van);
  const fanGroups=[];for(const x of [-.2,3.8,7.8])for(const z of [-9.72,-8.28]){const f=new THREE.Group();f.position.set(x,2.24,z);root.add(f);box(0,0,0,1.05,.06,.14,'#a9a9a9',null,f);box(0,0,0,.14,.06,1.05,'#a9a9a9',null,f);fanGroups.push(f);}

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
  const labels={power:'02 / POWER',compute:'03 / COMPUTE',cooling:'04 / COOLING',network:'05 / NETWORK',operations:'06 / PEOPLE',cpu:'CPU',gpu:'GPU',memory:'RAM',storage:'STORAGE',nic:'NETWORK'};
  const hotContainer=container.querySelector('#hotspots'),hotspots=[];
  for(const [entries,isServer] of [[nodes,false],[serverNodes,true]])Object.entries(entries).forEach(([id,pos])=>{const b=document.createElement('button');b.className='hotspot';b.textContent=labels[id];b.style.setProperty('--node-color',colors[hitNodes[id]||id]);b.setAttribute('aria-label','Explore '+id);b.onclick=()=>onSelect(id);hotContainer.append(b);hotspots.push({id,isServer,el:b,position:new THREE.Vector3(...pos).add(isServer?serverRoot.position:new THREE.Vector3())});});
  const stops=[{x:0,z:14,zoom:1,angle:.42,elevation:36},{x:-9,z:-4,zoom:2,angle:.9,elevation:29},{x:1,z:0,zoom:2,angle:.5,elevation:27},{x:4,z:-8,zoom:2.15,angle:1.03,elevation:32},{x:8,z:7.5,zoom:2.35,angle:.72,elevation:27},{x:-5,z:8,zoom:2.7,angle:.34,elevation:26}];
  let progress=0,focusId=null,selected='overview',needsRender=true,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let azimuth=.42,targetAzimuth=.42,zoom=1,targetZoom=1,elevation=36,targetElevation=36,orbit=0;
  const target=new THREE.Vector3(0,0,14),lookAt=target.clone();
  let flowId=null,flowGroup=null,flowPackets=[],flowTime=0;
  function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);const aspect=w/h,v=aspect<1?23/aspect:22;camera.left=-v*aspect;camera.right=v*aspect;camera.top=v;camera.bottom=-v;camera.updateProjectionMatrix();needsRender=true;updatePose();}
  function updatePose(){const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const t=reduced?Math.round(progress):progress;const index=Math.min(4,Math.floor(t)),a=stops[index],b=stops[index+1],q=t-index,u=q*q*(3-2*q);target.set(THREE.MathUtils.lerp(a.x,b.x,u),0,THREE.MathUtils.lerp(a.z,b.z,u));targetZoom=THREE.MathUtils.lerp(a.zoom,b.zoom,u);targetAzimuth=THREE.MathUtils.lerp(a.angle,b.angle,u)+orbit;targetElevation=THREE.MathUtils.lerp(a.elevation,b.elevation,u);
    if(focusId){const meshes=nodeMeshes.get(focusId);if(meshes?.length){scene.updateMatrixWorld(true);const bounds=new THREE.Box3();meshes.forEach(m=>bounds.expandByObject(m));const center=bounds.getCenter(new THREE.Vector3());target.copy(center);target.y=0;const isServer=['server','cpu','gpu','memory','storage','nic','cold-plate'].includes(focusId);targetZoom=isServer?2.1:2.5;targetAzimuth=.6+orbit;targetElevation=29;}}
    // Keep the subject above the reading area on narrow screens and left of it on wide ones.
    if(container.clientWidth<701){target.x+=2.8;target.z+=5.4;}else{target.x+=3.2;target.z-=2.5;}
    needsRender=true;
  }
  new ResizeObserver(resize).observe(container);resize();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let start=null,dragged=false;
  container.addEventListener('pointerdown',e=>{if(e.target!==renderer.domElement)return;start={x:e.clientX,y:e.clientY,orbit,pointerId:e.pointerId};dragged=false;});
  container.addEventListener('pointermove',e=>{if(!start||start.pointerId!==e.pointerId)return;const dx=e.clientX-start.x;if(Math.hypot(dx,e.clientY-start.y)>5)dragged=true;if(Math.abs(dx)>5){orbit=start.orbit-dx*.006;updatePose();}});
  window.addEventListener('pointercancel',()=>{start=null;dragged=false;});
  window.addEventListener('pointerup',e=>{if(!start||start.pointerId!==e.pointerId)return;const click=!dragged;start=null;if(!click||e.target!==renderer.domElement)return;const rect=container.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(objects)[0];if(hit)onSelect(hit.object.userData.node);});
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
    const moving=Math.abs(targetAzimuth-azimuth)>.0001||Math.abs(targetZoom-zoom)>.0001||target.distanceToSquared(lookAt)>.00001||Math.abs(targetElevation-elevation)>.0001;
    if(!needsRender&&!moving&&paused)return;
    needsRender=false;const ease=matchMedia('(prefers-reduced-motion: reduce)').matches?1:.09;azimuth+=(targetAzimuth-azimuth)*ease;zoom+=(targetZoom-zoom)*ease;elevation+=(targetElevation-elevation)*ease;lookAt.lerp(target,ease);camera.position.set(lookAt.x+Math.sin(azimuth)*42,elevation,lookAt.z+Math.cos(azimuth)*42);camera.lookAt(lookAt);camera.zoom=zoom;camera.updateProjectionMatrix();
    if(!paused){flowTime+=dt;fanGroups.forEach(f=>f.rotation.y=flowTime*1.8);van.position.set(14,0,((flowTime*1.9)%62)-26);}
    for(const p of flowPackets){const d=((flowTime*.095+p.offset)%1)*p.total;let i=1;while(i<p.lengths.length-1&&p.lengths[i]<d)i++;p.mesh.position.copy(p.points[i-1]).lerp(p.points[i],(d-p.lengths[i-1])/(p.lengths[i]-p.lengths[i-1]));}
    scene.updateMatrixWorld();camera.updateMatrixWorld();
    const isServer=['server','cpu','gpu','memory','storage','nic','cold-plate'].includes(focusId);const chapter=['overview','power','compute','cooling','network','operations'][Math.round(progress)];
    for(const h of hotspots){const v=h.position.clone().project(camera);h.el.hidden=h.isServer!==isServer||(!isServer&&(progress<.55||h.id!==chapter))||v.x<-.85||v.x>.82||v.y<-.45||v.y>.82||v.z<-1||v.z>1;if(h.el.hidden)continue;h.el.style.left=((v.x*.5+.5)*container.clientWidth)+'px';h.el.style.top=((-v.y*.5+.5)*container.clientHeight)+'px';h.el.classList.toggle('selected',selected===h.id);}
    renderer.render(scene,camera);
  }
  updatePose();requestAnimationFrame(frame);
  return {journey(value){progress=THREE.MathUtils.clamp(value,0,5);if(!focusId)updatePose();},select(id){focusId=id;selected=id;const ms=nodeMeshes.get(id);halo.visible=!!ms?.length;if(ms?.length){scene.updateMatrixWorld(true);const bounds=new THREE.Box3();ms.forEach(m=>bounds.expandByObject(m));const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());halo.position.set(center.x,.45,center.z);halo.scale.set(Math.max(size.x/2.4,.7),1,Math.max(size.z/2.2,.7));outlineMat.color.set(colors[hitNodes[id]||id]||'#f7ce46');}updatePose();},clearFocus(){focusId=null;halo.visible=false;updatePose();},flow:setFlow,reset(){orbit=0;updatePose();},pause(v){paused=v;needsRender=true;}};
}
