const R={baseFontSize:14,basePagePadding:20,baseLineHeight:1.5,baseModuleSpacing:10,paragraphSpacing:10,titleFontSize:16,subTitleFontSize:14,themeColor:"#111827",autoOnePage:!1},x={templateId:"classic",title:"未命名简历",createdAt:Date.now(),updatedAt:null,basic:{name:"陈下饭",position:"前端开发工程师",age:20,phone:"17311002299",address:"南京",email:"zhangsan@example.com",photo:"",photoConfig:{aspectRatio:"",width:90,height:120,visible:!0,borderRadius:5,customBorderRadius:0}},educations:[{id:"1",school:"清华大学",major:"软件工程",degree:"本科",dateRange:"2023-09-01 - 2027-06-30",visible:!0,gpa:"",description:`<ul>
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
      `}],customData:{},menuSections:[{id:"basic",title:"基本信息",order:"1"},{id:"education",title:"教育经历",order:"2"},{id:"internship",title:"实习经历",order:"3"},{id:"project",title:"项目经历",order:"4"},{id:"skills",title:"个人技能",order:"5"}],globalConfiguration:R},h="FileHandleDB",E=2,u="handles",d="config",w=()=>new Promise((e,t)=>{const n=indexedDB.open(h,E);n.onerror=()=>{t(new Error("打开数据库失败"))},n.onsuccess=()=>{e(n.result)},n.onupgradeneeded=s=>{const r=s.target.result;r.objectStoreNames.contains(u)||r.createObjectStore(u),r.objectStoreNames.contains(d)||r.createObjectStore(d)}}),O=async(e,t)=>{const n=await w();return new Promise((s,r)=>{const a=n.transaction(u,"readwrite").objectStore(u).put(t,e);a.onsuccess=()=>{s()},a.onerror=()=>{r(a.error)}})},y=async e=>{const t=await w();return new Promise((n,s)=>{const i=t.transaction(u,"readonly").objectStore(u).get(e);i.onsuccess=()=>{n(i.result)},i.onerror=()=>{s(i.error)}})},C=async(e,t)=>{const n=await w();return new Promise((s,r)=>{const a=n.transaction(d,"readwrite").objectStore(d).put(t,e);a.onsuccess=()=>{s()},a.onerror=()=>{r(a.error)}})},H=async e=>{const t=await w();return new Promise((n,s)=>{const i=t.transaction(d,"readonly").objectStore(d).get(e);i.onsuccess=()=>{n(i.result)},i.onerror=()=>{s(i.error)}})},D=async(e,t="readwrite")=>{if(!e)return!1;const n={mode:t};return await e.queryPermission(n)==="granted"||await e.requestPermission(n)==="granted"},P=e=>{if(!e||typeof e!="object")return!1;const t=e;return typeof t.id=="string"&&t.id.length>0},f=e=>{if(!e)return null;const t=new Date(e).getTime();return Number.isFinite(t)?t:null},j=(e,t,n)=>{const s=f(e.updatedAt),r=f(t.updatedAt),o=typeof n=="number"&&Number.isFinite(n)?n:null;return s!==null&&r!==null?s!==r?s>r:o!==null&&o>r+1e3:s!==null&&r===null?!0:s===null&&r!==null?o!==null&&o>r+1e3:o!==null},b=(e,t)=>{if(typeof t!="number"||!Number.isFinite(t))return e;const n=f(e.updatedAt);return n!==null&&n>=t?e:{...e,updatedAt:new Date(t).toISOString()}},A=async(e,t)=>{const n=await q(e.id);if(!n){const r=b(e,t);return await T(r),!0}if(!j(e,n,t))return!1;const s=b(e,t);return await k(s.id,s),!0},B=async(e,t)=>{try{const n=await y("syncDirectory");if(!n||!await D(n))return;const r=n;if(t&&t.id===e.id&&t.title!==e.title)try{await r.removeEntry(`${t.title}.json`)}catch(l){console.warn("删除旧文件失败",l)}const o=`${e.title}.json`,a=await(await r.getFileHandle(o,{create:!0})).createWritable();await a.write(JSON.stringify(e,null,2)),await a.close()}catch(n){console.warn("同步简历到文件失败",n)}};let m=null;const F=(e,t)=>{m&&clearTimeout(m),m=setTimeout(()=>{B(e,t),m=null},1500)},V=async()=>{const e={skipped:0,synced:0,failed:0};if(typeof window>"u"||typeof indexedDB>"u")return e;try{const t=await y("syncDirectory");if(!t||t.kind!=="directory"||!await D(t))return e;const s=[];for await(const r of t.values())s.push(r);if(!s)return e;for await(const r of s){if(r.kind!=="file"||!r.name.endsWith(".json")){e.skipped++;continue}try{const o=await r.getFile(),i=await o.text(),a=JSON.parse(i);if(!P(a)){e.skipped++;continue}await A(a,o.lastModified)?e.synced++:e.skipped++}catch(o){e.failed++,console.error(`读取文件失败"${r.name}":`,o)}}}catch(t){console.error("同步简历失败",t)}return e},N="resumeDB",I=2,c="resumes",p=()=>new Promise((e,t)=>{const n=indexedDB.open(N,I);n.onerror=()=>{t(new Error("打开数据库失败"))},n.onsuccess=()=>{e(n.result)},n.onupgradeneeded=s=>{const r=s.target.result;if(!r.objectStoreNames.contains(c)){const o=r.createObjectStore(c,{keyPath:"id"});o.createIndex("createdAt","createdAt",{unique:!1}),o.createIndex("updatedAt","updatedAt",{unique:!1})}}}),T=async e=>{const t=await p();return new Promise((n,s)=>{const o=t.transaction(c,"readwrite").objectStore(c),i={...e,createdAt:Date.now(),updatedAt:null},a=o.add(i);a.onsuccess=()=>{n(i.id)},a.onerror=()=>{s(new Error("添加简历失败"))}})},_=async()=>{const e=await p();return new Promise((t,n)=>{const o=e.transaction(c,"readonly").objectStore(c).getAll();o.onsuccess=()=>{t(o.result)},o.onerror=()=>{n(new Error("获取简历列表失败"))}})},q=async e=>{const t=await p();return new Promise((n,s)=>{const i=t.transaction(c,"readonly").objectStore(c).get(e);i.onsuccess=()=>{n(i.result||null)},i.onerror=()=>{s(new Error("获取简历失败"))}})},k=async(e,t)=>{const n=await p();return new Promise((s,r)=>{const i=n.transaction(c,"readwrite").objectStore(c),a=i.get(e);a.onsuccess=()=>{const l=a.result;if(!l){s(!1);return}const g={...l,...t,updatedAt:Date.now()};F(g,l);const S=i.put(g);S.onsuccess=()=>{s(!0)},S.onerror=()=>{r(new Error("更新简历失败"))}},a.onerror=()=>{r(new Error("获取简历失败"))}})},G=async e=>{const t=await p();return new Promise((n,s)=>{const i=t.transaction(c,"readwrite").objectStore(c).delete(e);i.onsuccess=()=>{n(!0)},i.onerror=()=>{s(new Error("删除简历失败"))}})};export{x as D,H as a,_ as b,T as c,G as d,C as e,V as f,y as g,q as h,R as i,O as s,k as u,D as v};
