const C='"Alibaba PuHuiTi", sans-serif',m=[{labelKey:"alibaba",label:"阿里巴巴普惠体",value:C,aliases:["Alibaba PuHuiTi, sans-serif",'"Alibaba PuHuiTi", sans-serif'],sources:[{family:"Alibaba PuHuiTi",url:"/fonts/AlibabaPuHuiTi-3-55-Regular.ttf",format:"truetype",weight:"400",style:"normal"},{family:"Alibaba PuHuiTi",url:"/fonts/AlibabaPuHuiTi-3-85-Bold.ttf",format:"truetype",weight:"700",style:"normal"}]},{labelKey:"misans",label:"小米 MiSans",value:'"MiSans", sans-serif',aliases:['"MiSans", "Microsoft YaHei", "微软雅黑", sans-serif','"Microsoft YaHei", "微软雅黑", sans-serif','"Microsoft YaHei Local", "Microsoft YaHei", "微软雅黑", sans-serif','"MiSans", sans-serif',"MiSans, sans-serif","Microsoft YaHei, sans-serif"],sources:[{family:"MiSans",url:"/fonts/MiSans-Normal.ttf",format:"truetype",weight:"400",style:"normal"},{family:"MiSans",url:"/fonts/MiSans-Medium.ttf",format:"truetype",weight:"700",style:"normal"}]},{labelKey:"notosanssc",label:"思源黑体",value:'"Noto Sans SC", "Noto Sans CJK SC", sans-serif',aliases:['"Noto Sans SC", "Noto Sans CJK SC", sans-serif',"Noto Sans SC, sans-serif"],sources:[{family:"Noto Sans SC",url:"/fonts/NotoSansSC-Regular.otf",format:"opentype",weight:"400",style:"normal"},{family:"Noto Sans SC",url:"/fonts/NotoSansSC-Medium.otf",format:"opentype",weight:"500",style:"normal"},{family:"Noto Sans SC",url:"/fonts/NotoSansSC-Bold.otf",format:"opentype",weight:"700",style:"normal"}]},{labelKey:"sourcehanserifsc",label:"思源宋体",value:'"Source Han Serif SC", "Noto Serif SC", serif',aliases:['"Source Han Serif SC", "Noto Serif SC", serif','"Noto Serif SC", "Source Han Serif SC", serif',"Source Han Serif SC, serif","Noto Serif SC, serif"],sources:[{family:"Source Han Serif SC",url:"/fonts/SourceHanSerifSC-Regular.otf",format:"opentype",weight:"400",style:"normal"},{family:"Source Han Serif SC",url:"/fonts/SourceHanSerifSC-Medium.otf",format:"opentype",weight:"500",style:"normal"},{family:"Source Han Serif SC",url:"/fonts/SourceHanSerifSC-Bold.otf",format:"opentype",weight:"700",style:"normal"}]}],y=new Map,D=e=>"/orange-resume/"+e.replace(/^\//,""),P=async e=>{const t=D(e);return y.has(e)||y.set(e,fetch(t).then(n=>{if(!n.ok)throw new Error(`Failed to load font: ${e}`);return n.blob()}).then(n=>new Promise((r,s)=>{const o=new FileReader;o.onloadend=()=>r(o.result),o.onerror=()=>s(new Error(`Failed to read font: ${e}`)),o.readAsDataURL(n)}))),y.get(e)},N=e=>{const t=e?.trim();return t&&m.find(n=>n.value===t||n.aliases.includes(t)||n.aliases.some(r=>t.includes(r.replace(/"/g,""))))||m[0]},H=(e,t)=>`@font-face {
  font-family: "${e.family}";
  src: url("${t}") format("${e.format}");
  font-weight: ${e.weight};
  font-style: ${e.style};
  font-display: swap;
}`,$=e=>N(e).value,L=e=>m.map(t=>({value:t.value,label:t.label})),_=async(e,t=!1)=>{const n=N(e);return(await Promise.all(n.sources.map(async s=>{const o=t?await P(s.url):D(s.url);return H(s,o)}))).join(`
`)},A={baseFontSize:14,basePagePadding:20,baseLineHeight:1.5,baseModuleSpacing:10,paragraphSpacing:10,titleFontSize:16,subTitleFontSize:14,themeColor:"#111827",fontFamily:C,autoOnePage:!1},V={templateId:"classic",title:"未命名简历",createdAt:Date.now(),updatedAt:null,basic:{name:"陈下饭",position:"前端开发工程师",age:20,phone:"17311002299",address:"南京",email:"zhangsan@example.com",photo:"",photoConfig:{aspectRatio:"",width:90,height:120,visible:!0,borderRadius:5,customBorderRadius:0}},educations:[{id:"1",school:"清华大学",major:"软件工程",degree:"本科",dateRange:"2023-09-01 - 2027-06-30",visible:!0,gpa:"",description:`<ul>
  <li>
    <p>综合绩点：3.8/4.0，专业前15%</p>
  </li>
  <li>
    <p>主修课程：Web前端开发（92）、数据结构（88）、数据库设计（90）、人机交互（89）</p>
  </li>
  <li>
    <p>连续两年获得校二等奖学金</p>
  </li>
  <li>
    <p>2024 校极客杯网页设计大赛 一等奖</p>
  </li>
</ul>
`}],skills:`
  <ul>
  <li>
    <p>语言基础：熟练掌握 HTML5/CSS3，JavaScript (ES6+)，TypeScript</p>
  </li>
  <li>
    <p>框架与库：React (Hooks, Router, Redux Toolkit)，Vue3 (基础使用)，Next.js (SSG/SSR
      了解)</p>
  </li>
  <li>
    <p>样式工具：TailwindCSS，Sass，Ant Design，Element Plus</p>
  </li>
  <li>
    <p>工程化/工具：Webpack，Vite，Git，ESLint，Prettier，Yarn/npm</p>
  </li>
  <li>
    <p>后端/其他：Node.js (Express 简单搭建)，RESTful API 调用，MySQL 基础</p>
  </li>
  <li>
    <p>开发环境：VS Code，Chrome DevTools，Postman，Figma（协作）</p>
  </li>
</ul>

  `,projects:[{id:"1",name:"校园助手",role:"前端开发",gitAddress:"github.com",dateRange:"2023-07-01 - 2024-06-30",visible:!0,description:`
      <p><strong>技术栈：</strong> React + Taro + TailwindCSS + 小程序云开发</p>
<ul>
  <li>
    <p>独立完成小程序前端界面设计与交互，包括周课表展示、按节次筛选空教室、考试倒计时三大模块。</p>
  </li>
  <li>
    <p>利用云函数爬取学校教务系统公开课表数据，进行清洗与缓存，实现课程实时同步与离线数据降级展示。</p>
  </li>
  <li>
    <p>使用 Taro UI + 自定义日历组件，支持周/日视图切换；数据存储采用本地缓存 + 云数据库双写。</p>
  </li>
  <li>
    <p>小程序累计被 600+ 本校同学使用，并完成两轮用户体验迭代（评分 4.8/5）。</p>
  </li>
</ul>

      `},{id:"2",name:"技术笔记系统",role:"前端开发",gitAddress:"github.com",dateRange:"2024-07-01 - 2025-06-30",visible:!0,description:`
      <p><strong>技术栈：</strong> Next.js + MDX + TailwindCSS + Vercel</p>
<p>搭建轻量级静态博客站，支持 Markdown/MDX 渲染、代码高亮、暗色主题切换。</p>
<ul>
  <li>
    <p>自定义文章目录生成、评论模块（基于 Giscus），以及标签分类聚合页面。</p>
  </li>
  <li>
    <p>通过 Next.js 的 SSG 生成超 30 篇前端学习笔记与项目复盘文章，月均访问量约 500 PV。</p>
  </li>
  <li>
    <p>引入 ESLint + Husky 规范 Git 提交，提高代码质量。</p>
  </li>
</ul>
      `}],internships:[{id:"1",companyName:"字节跳动",position:"前端开发工程师",department:"",dateRange:"2024-07-01 - 2025-06-30",visible:!0,description:`
      <ul>
  <li>
    <p>协助开发低代码表单生成器的迭代工作，负责维护 Form Render 组件，支持 JSON Schema
      动态渲染输入控件（输入框、下拉框、日期选择器等），提升了活动页表单配置效率。</p>
  </li>
  <li>
    <p>基于 Vue3 + Element Plus 完成 3 个内部运营工具页面的迁移，实现组件懒加载，首屏加载时间减少约 15%。</p>
  </li>
  <li>
    <p>参与设计系统的基础布局组件与动态路由权限控制（路由守卫 + 角色权限），为后续权限扩展打下基础。</p>
  </li>
</ul>
      `}],customData:{},menuSections:[{id:"basic",title:"基本信息",order:"1"},{id:"education",title:"教育经历",order:"2"},{id:"internship",title:"实习经历",order:"3"},{id:"project",title:"项目经历",order:"4"},{id:"skills",title:"个人技能",order:"5"}],globalConfiguration:A},E="FileHandleDB",T=2,u="handles",d="config",S=()=>new Promise((e,t)=>{const n=indexedDB.open(E,T);n.onerror=()=>{t(new Error("打开数据库失败"))},n.onsuccess=()=>{e(n.result)},n.onupgradeneeded=r=>{const s=r.target.result;s.objectStoreNames.contains(u)||s.createObjectStore(u),s.objectStoreNames.contains(d)||s.createObjectStore(d)}}),z=async(e,t)=>{const n=await S();return new Promise((r,s)=>{const i=n.transaction(u,"readwrite").objectStore(u).put(t,e);i.onsuccess=()=>{r()},i.onerror=()=>{s(i.error)}})},F=async e=>{const t=await S();return new Promise((n,r)=>{const a=t.transaction(u,"readonly").objectStore(u).get(e);a.onsuccess=()=>{n(a.result)},a.onerror=()=>{r(a.error)}})},G=async(e,t)=>{const n=await S();return new Promise((r,s)=>{const i=n.transaction(d,"readwrite").objectStore(d).put(t,e);i.onsuccess=()=>{r()},i.onerror=()=>{s(i.error)}})},Y=async e=>{const t=await S();return new Promise((n,r)=>{const a=t.transaction(d,"readonly").objectStore(d).get(e);a.onsuccess=()=>{n(a.result)},a.onerror=()=>{r(a.error)}})},R=async(e,t="readwrite")=>{if(!e)return!1;const n={mode:t};return await e.queryPermission(n)==="granted"||await e.requestPermission(n)==="granted"},j=e=>{if(!e||typeof e!="object")return!1;const t=e;return typeof t.id=="string"&&t.id.length>0},w=e=>{if(!e)return null;const t=new Date(e).getTime();return Number.isFinite(t)?t:null},B=(e,t,n)=>{const r=w(e.updatedAt),s=w(t.updatedAt),o=typeof n=="number"&&Number.isFinite(n)?n:null;return r!==null&&s!==null?r!==s?r>s:o!==null&&o>s+1e3:r!==null&&s===null?!0:r===null&&s!==null?o!==null&&o>s+1e3:o!==null},h=(e,t)=>{if(typeof t!="number"||!Number.isFinite(t))return e;const n=w(e.updatedAt);return n!==null&&n>=t?e:{...e,updatedAt:new Date(t).toISOString()}},I=async(e,t)=>{const n=await x(e.id);if(!n){const s=h(e,t);return await q(s),!0}if(!B(e,n,t))return!1;const r=h(e,t);return await U(r.id,r),!0},M=async(e,t)=>{try{const n=await F("syncDirectory");if(!n||!await R(n))return;const s=n;if(t&&t.id===e.id&&t.title!==e.title)try{await s.removeEntry(`${t.title}.json`)}catch(c){console.warn("删除旧文件失败",c)}const o=`${e.title}.json`,i=await(await s.getFileHandle(o,{create:!0})).createWritable();await i.write(JSON.stringify(e,null,2)),await i.close()}catch(n){console.warn("同步简历到文件失败",n)}};let p=null;const O=(e,t)=>{p&&clearTimeout(p),p=setTimeout(()=>{M(e,t),p=null},1500)},J=async()=>{const e={skipped:0,synced:0,failed:0};if(typeof window>"u"||typeof indexedDB>"u")return e;try{const t=await F("syncDirectory");if(!t||t.kind!=="directory"||!await R(t))return e;const r=[];for await(const s of t.values())r.push(s);if(!r)return e;for await(const s of r){if(s.kind!=="file"||!s.name.endsWith(".json")){e.skipped++;continue}try{const o=await s.getFile(),a=await o.text(),i=JSON.parse(a);if(!j(i)){e.skipped++;continue}await I(i,o.lastModified)?e.synced++:e.skipped++}catch(o){e.failed++,console.error(`读取文件失败"${s.name}":`,o)}}}catch(t){console.error("同步简历失败",t)}return e},v="resumeDB",k=2,l="resumes",f=()=>new Promise((e,t)=>{const n=indexedDB.open(v,k);n.onerror=()=>{t(new Error("打开数据库失败"))},n.onsuccess=()=>{e(n.result)},n.onupgradeneeded=r=>{const s=r.target.result;if(!s.objectStoreNames.contains(l)){const o=s.createObjectStore(l,{keyPath:"id"});o.createIndex("createdAt","createdAt",{unique:!1}),o.createIndex("updatedAt","updatedAt",{unique:!1})}}}),q=async e=>{const t=await f();return new Promise((n,r)=>{const o=t.transaction(l,"readwrite").objectStore(l),a={...e,createdAt:Date.now(),updatedAt:null},i=o.add(a);i.onsuccess=()=>{n(a.id)},i.onerror=()=>{r(new Error("添加简历失败"))}})},K=async()=>{const e=await f();return new Promise((t,n)=>{const o=e.transaction(l,"readonly").objectStore(l).getAll();o.onsuccess=()=>{t(o.result)},o.onerror=()=>{n(new Error("获取简历列表失败"))}})},x=async e=>{const t=await f();return new Promise((n,r)=>{const a=t.transaction(l,"readonly").objectStore(l).get(e);a.onsuccess=()=>{n(a.result||null)},a.onerror=()=>{r(new Error("获取简历失败"))}})},U=async(e,t)=>{const n=await f();return new Promise((r,s)=>{const a=n.transaction(l,"readwrite").objectStore(l),i=a.get(e);i.onsuccess=()=>{const c=i.result;if(!c){r(!1);return}const b={...c,...t,updatedAt:Date.now()};O(b,c);const g=a.put(b);g.onsuccess=()=>{r(!0)},g.onerror=()=>{s(new Error("更新简历失败"))}},i.onerror=()=>{s(new Error("获取简历失败"))}})},W=async e=>{const t=await f();return new Promise((n,r)=>{const a=t.transaction(l,"readwrite").objectStore(l).delete(e);a.onsuccess=()=>{n(!0)},a.onerror=()=>{r(new Error("删除简历失败"))}})};export{V as D,m as F,Y as a,K as b,q as c,W as d,G as e,J as f,F as g,_ as h,L as i,x as j,A as k,$ as n,z as s,U as u,R as v};
