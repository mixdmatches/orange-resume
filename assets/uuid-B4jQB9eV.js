const f='"Alibaba PuHuiTi", sans-serif',n=[{labelKey:"alibaba",label:"阿里巴巴普惠体",value:f,aliases:["Alibaba PuHuiTi, sans-serif",'"Alibaba PuHuiTi", sans-serif'],sources:[{family:"Alibaba PuHuiTi",url:"/fonts/AlibabaPuHuiTi-3-55-Regular.ttf",format:"truetype",weight:"400",style:"normal"},{family:"Alibaba PuHuiTi",url:"/fonts/AlibabaPuHuiTi-3-85-Bold.ttf",format:"truetype",weight:"700",style:"normal"}]},{labelKey:"misans",label:"小米 MiSans",value:'"MiSans", sans-serif',aliases:['"MiSans", "Microsoft YaHei", "微软雅黑", sans-serif','"Microsoft YaHei", "微软雅黑", sans-serif','"Microsoft YaHei Local", "Microsoft YaHei", "微软雅黑", sans-serif','"MiSans", sans-serif',"MiSans, sans-serif","Microsoft YaHei, sans-serif"],sources:[{family:"MiSans",url:"/fonts/MiSans-Normal.ttf",format:"truetype",weight:"400",style:"normal"},{family:"MiSans",url:"/fonts/MiSans-Medium.ttf",format:"truetype",weight:"700",style:"normal"}]},{labelKey:"notosanssc",label:"思源黑体",value:'"Noto Sans SC", "Noto Sans CJK SC", sans-serif',aliases:['"Noto Sans SC", "Noto Sans CJK SC", sans-serif',"Noto Sans SC, sans-serif"],sources:[{family:"Noto Sans SC",url:"/fonts/NotoSansSC-Regular.otf",format:"opentype",weight:"400",style:"normal"},{family:"Noto Sans SC",url:"/fonts/NotoSansSC-Medium.otf",format:"opentype",weight:"500",style:"normal"},{family:"Noto Sans SC",url:"/fonts/NotoSansSC-Bold.otf",format:"opentype",weight:"700",style:"normal"}]},{labelKey:"sourcehanserifsc",label:"思源宋体",value:'"Source Han Serif SC", "Noto Serif SC", serif',aliases:['"Source Han Serif SC", "Noto Serif SC", serif','"Noto Serif SC", "Source Han Serif SC", serif',"Source Han Serif SC, serif","Noto Serif SC, serif"],sources:[{family:"Source Han Serif SC",url:"/fonts/SourceHanSerifSC-Regular.otf",format:"opentype",weight:"400",style:"normal"},{family:"Source Han Serif SC",url:"/fonts/SourceHanSerifSC-Medium.otf",format:"opentype",weight:"500",style:"normal"},{family:"Source Han Serif SC",url:"/fonts/SourceHanSerifSC-Bold.otf",format:"opentype",weight:"700",style:"normal"}]}],l=new Map,u=e=>"/"+e.replace(/^\//,""),S=async e=>{const t=u(e);return l.has(e)||l.set(e,fetch(t).then(a=>a.ok?a.blob():(console.warn(`[fonts] 字体加载失败: ${e} (status=${a.status})`),null)).then(a=>new Promise((o,i)=>{if(a===null){o(null);return}const s=new FileReader;s.onloadend=()=>o(s.result),s.onerror=()=>i(new Error(`Failed to read font: ${e}`)),s.readAsDataURL(a)})).catch(a=>(console.warn(`[fonts] 字体转 base64 失败，将降级使用 URL: ${e}`,a),null))),l.get(e)},p=e=>{const t=e?.trim();return t&&n.find(a=>a.value===t||a.aliases.includes(t)||a.aliases.some(o=>t.includes(o.replace(/"/g,""))))||n[0]},r=(e,t)=>`@font-face {
  font-family: "${e.family}";
  src: url("${t}") format("${e.format}");
  font-weight: ${e.weight};
  font-style: ${e.style};
  font-display: swap;
}`,d=e=>p(e).value,m=e=>n.map(t=>({value:t.value,label:t.label})),y=async(e,t=!1)=>{const a=p(e);return(await Promise.all(a.sources.map(async i=>{if(t){const s=await S(i.url);return s?r(i,s):(console.warn(`[fonts] inline 失败，降级为 URL 引用: ${i.url}`),r(i,u(i.url)))}return r(i,u(i.url))}))).join(`
`)},c={baseFontSize:14,basePagePadding:20,baseLineHeight:1.5,baseModuleSpacing:10,paragraphSpacing:10,titleFontSize:16,subTitleFontSize:14,themeColor:"#111827",fontFamily:f,autoOnePage:!1},g={templateId:"classic",title:"未命名简历",createdAt:Date.now(),updatedAt:null,basic:{name:"陈下饭",position:"前端开发工程师",age:20,phone:"17311002299",address:"南京",email:"zhangsan@example.com",photo:"",photoConfig:{aspectRatio:"",width:90,height:120,visible:!0,borderRadius:5,customBorderRadius:0}},educations:[{id:"1",school:"清华大学",major:"软件工程",degree:"本科",dateRange:"2023-09-01 - 2027-06-30",visible:!0,gpa:"",description:`<ul>
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
      `}],customData:{},menuSections:[{id:"basic",title:"基本信息",order:"1"},{id:"education",title:"教育经历",order:"2"},{id:"internship",title:"实习经历",order:"3"},{id:"project",title:"项目经历",order:"4"},{id:"skills",title:"个人技能",order:"5"}],globalConfiguration:c};function b(){if(typeof crypto<"u"&&typeof crypto.randomUUID=="function")return crypto.randomUUID();if(typeof crypto<"u"&&typeof crypto.getRandomValues=="function"){const e="0123456789abcdef",t=crypto.getRandomValues(new Uint8Array(16));t[6]=t[6]&15|64,t[8]=t[8]&63|128;let a="";return t.forEach((o,i)=>{(i===4||i===6||i===8||i===10)&&(a+="-"),a+=e[o>>4]+e[o&15]}),a}return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,e=>{const t=Math.random()*16|0;return(e==="x"?t:t&3|8).toString(16)})}export{g as D,n as F,y as a,m as b,b as g,d as n};
