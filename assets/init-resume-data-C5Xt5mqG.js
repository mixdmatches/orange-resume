const f='"Alibaba PuHuiTi", sans-serif',l=[{labelKey:"alibaba",label:"阿里巴巴普惠体",value:f,aliases:["Alibaba PuHuiTi, sans-serif",'"Alibaba PuHuiTi", sans-serif'],sources:[{family:"Alibaba PuHuiTi",url:"/fonts/AlibabaPuHuiTi-3-55-Regular.ttf",format:"truetype",weight:"400",style:"normal"},{family:"Alibaba PuHuiTi",url:"/fonts/AlibabaPuHuiTi-3-85-Bold.ttf",format:"truetype",weight:"700",style:"normal"}]},{labelKey:"misans",label:"小米 MiSans",value:'"MiSans", sans-serif',aliases:['"MiSans", "Microsoft YaHei", "微软雅黑", sans-serif','"Microsoft YaHei", "微软雅黑", sans-serif','"Microsoft YaHei Local", "Microsoft YaHei", "微软雅黑", sans-serif','"MiSans", sans-serif',"MiSans, sans-serif","Microsoft YaHei, sans-serif"],sources:[{family:"MiSans",url:"/fonts/MiSans-Normal.ttf",format:"truetype",weight:"400",style:"normal"},{family:"MiSans",url:"/fonts/MiSans-Medium.ttf",format:"truetype",weight:"700",style:"normal"}]},{labelKey:"notosanssc",label:"思源黑体",value:'"Noto Sans SC", "Noto Sans CJK SC", sans-serif',aliases:['"Noto Sans SC", "Noto Sans CJK SC", sans-serif',"Noto Sans SC, sans-serif"],sources:[{family:"Noto Sans SC",url:"/fonts/NotoSansSC-Regular.otf",format:"opentype",weight:"400",style:"normal"},{family:"Noto Sans SC",url:"/fonts/NotoSansSC-Medium.otf",format:"opentype",weight:"500",style:"normal"},{family:"Noto Sans SC",url:"/fonts/NotoSansSC-Bold.otf",format:"opentype",weight:"700",style:"normal"}]},{labelKey:"sourcehanserifsc",label:"思源宋体",value:'"Source Han Serif SC", "Noto Serif SC", serif',aliases:['"Source Han Serif SC", "Noto Serif SC", serif','"Noto Serif SC", "Source Han Serif SC", serif',"Source Han Serif SC, serif","Noto Serif SC, serif"],sources:[{family:"Source Han Serif SC",url:"/fonts/SourceHanSerifSC-Regular.otf",format:"opentype",weight:"400",style:"normal"},{family:"Source Han Serif SC",url:"/fonts/SourceHanSerifSC-Medium.otf",format:"opentype",weight:"500",style:"normal"},{family:"Source Han Serif SC",url:"/fonts/SourceHanSerifSC-Bold.otf",format:"opentype",weight:"700",style:"normal"}]}],n=new Map,u=e=>"/"+e.replace(/^\//,""),c=async e=>{const t=u(e);return n.has(e)||n.set(e,fetch(t).then(i=>i.ok?i.blob():(console.warn(`[fonts] 字体加载失败: ${e} (status=${i.status})`),null)).then(i=>new Promise((o,a)=>{if(i===null){o(null);return}const s=new FileReader;s.onloadend=()=>o(s.result),s.onerror=()=>a(new Error(`Failed to read font: ${e}`)),s.readAsDataURL(i)})).catch(i=>(console.warn(`[fonts] 字体转 base64 失败，将降级使用 URL: ${e}`,i),null))),n.get(e)},p=e=>{const t=e?.trim();return t&&l.find(i=>i.value===t||i.aliases.includes(t)||i.aliases.some(o=>t.includes(o.replace(/"/g,""))))||l[0]},r=(e,t)=>`@font-face {
  font-family: "${e.family}";
  src: url("${t}") format("${e.format}");
  font-weight: ${e.weight};
  font-style: ${e.style};
  font-display: swap;
}`,m=e=>p(e).value,d=e=>l.map(t=>({value:t.value,label:t.label})),g=async(e,t=!1)=>{const i=p(e);return(await Promise.all(i.sources.map(async a=>{if(t){const s=await c(a.url);return s?r(a,s):(console.warn(`[fonts] inline 失败，降级为 URL 引用: ${a.url}`),r(a,u(a.url)))}return r(a,u(a.url))}))).join(`
`)},S={baseFontSize:14,basePagePadding:20,baseLineHeight:1.5,baseModuleSpacing:10,paragraphSpacing:10,titleFontSize:16,subTitleFontSize:14,themeColor:"#111827",fontFamily:f,autoOnePage:!1},b={templateId:"classic",title:"我的简历",createdAt:Date.now(),updatedAt:null,basic:{name:"林小满",position:"全栈开发工程师",age:24,phone:"139-8800-6677",address:"杭州",email:"linxiaoman@gmail.com",photo:"",photoConfig:{aspectRatio:"",width:90,height:120,visible:!0,borderRadius:5,customBorderRadius:0}},educations:[{id:"edu-1",school:"浙江大学",major:"软件工程",degree:"硕士",dateRange:"2022-09 - 2025-03",visible:!0,gpa:"3.6 / 4.0",description:`<ul>
  <li><p>研究方向：可视化与人机交互，导师课题获省级研究生创新项目立项</p></li>
  <li><p>在 ACM CHI 中国分会发表关于「Web 端大规模图布局性能优化」的短文</p></li>
  <li><p>担任实验室前端技术负责人，主导 3 个课题组的科研可视化平台搭建</p></li>
</ul>`}],skills:`<ul>
  <li><p><strong>核心语言：</strong>JavaScript / TypeScript / Python / Go（了解）</p></li>
  <li><p><strong>前端框架：</strong>React（主力）、Vue 3、Svelte（个人偏好）、Next.js / Nuxt.js</p></li>
  <li><p><strong>可视化与动画：</strong>D3.js、ECharts、Three.js、Framer Motion、Canvas 2D / WebGL</p></li>
  <li><p><strong>后端与数据库：</strong>Node.js（NestJS、Fastify）、PostgreSQL、Redis、Prisma</p></li>
  <li><p><strong>DevOps：</strong>Docker、Kubernetes 基础、GitHub Actions、Vercel / Cloudflare Pages</p></li>
  <li><p><strong>其他：</strong>Electron、Tauri、Browser Extension、WebAssembly（入门）</p></li>
</ul>`,projects:[{id:"proj-1",name:"星图数据看板",role:"全栈开发",gitAddress:"github.com/linxm/starboard",dateRange:"2025-01 - 2025-08",visible:!0,description:`<p><strong>技术栈：</strong>React + ECharts + D3.js + NestJS + ClickHouse</p>
<ul>
  <li><p>面向数据分析师的自助式 BI 看板，支持拖拽搭建、SQL 编辑器、20+ 种图表类型</p></li>
  <li><p>用 D3.js 力导布局实现关系网络图，渲染万级节点时帧率稳定 30fps 以上</p></li>
  <li><p>后端用 NestJS + ClickHouse 做聚合查询，10 亿行数据下 P95 响应 < 800ms</p></li>
  <li><p>实现基于 WebSocket 的实时大盘推送，多端缩放联动、数据冻结与对比时间轴</p></li>
</ul>`},{id:"proj-2",name:"深色壁纸浏览器",role:"独立开发",gitAddress:"github.com/linxm/darkwall",dateRange:"2024-05 - 2024-11",visible:!0,description:`<p><strong>技术栈：</strong>Tauri + React + Rust + SQLite</p>
<ul>
  <li><p>用 Tauri 替代 Electron 重写桌面壁纸工具，安装包从 120MB 压缩到 8MB</p></li>
  <li><p>Rust 侧实现图片采集管线（Unsplash / Wallhaven API），多线程下载 + 去重哈希</p></li>
  <li><p>前端用虚拟列表渲染万张壁纸缩略图，滚动帧率稳定 60fps</p></li>
</ul>`},{id:"proj-3",name:"实验室文献管理插件",role:"独立开发",gitAddress:"github.com/linxm/lit-helper",dateRange:"2023-09 - 2024-03",visible:!0,description:`<p><strong>技术栈：</strong>TypeScript + Chrome Extension Manifest V3 + Vite</p>
<ul>
  <li><p>浏览器插件，在 Google Scholar / arXiv 上浮嵌快捷工具栏，一键导出 BibTeX</p></li>
  <li><p>用 OffscreenDocument + IndexedDB 实现批量文献去重与 PDF 元信息提取</p></li>
  <li><p>Chrome Web Store 上架，实验室 50+ 同学日常使用</p></li>
</ul>`}],internships:[{id:"int-1",companyName:"腾讯",position:"前端开发工程师",department:"CSIG · 数据可视化中台",dateRange:"2024-06 - 2024-10",visible:!0,description:`<ul>
  <li><p>参与腾讯云图编辑器的迭代，负责图表组件库的新增与重构，覆盖 40+ 种可视化类型</p></li>
  <li><p>用 Canvas 2D 重写热力图渲染层，大数据量场景下性能提升 5 倍，内存占用降低 40%</p></li>
  <li><p>推动团队引入 Figma Design Token 同步流程，设计与开发交付周期缩短 2 天/迭代</p></li>
</ul>`}],customData:{},menuSections:[{id:"basic",title:"基本信息",order:"1"},{id:"education",title:"教育经历",order:"2"},{id:"internship",title:"实习经历",order:"3"},{id:"project",title:"项目经历",order:"4"},{id:"skills",title:"个人技能",order:"5"}],globalConfiguration:S};export{b as D,l as F,d as a,g,m as n};
