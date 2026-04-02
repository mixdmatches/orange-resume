// 初始全局设置
export const initialGlobalConfiguration = {
  baseFontSize: 16, // 基础字体大小
  basePagePadding: 10, // 基础页面内边距
  baseLineHeight: 1.5, // 基础行高
  baseModuleSpacing: 10, // 基础模块间距
  paragraphSpacing: 10, // 段落间距
  titleFontSize: 20, // 标题字体大小
  subTitleFontSize: 18, // 子标题字体大小
  themeColor: '#000', // 主题颜色
}

// 初始默认简历内容
export const DEFAULT_RESUME = {
  title: '未命名简历',
  createDate: new Date().toISOString(),
  updateDate: new Date().toISOString(),
  basic: {
    name: '陈下饭',
    position: '前端开发工程师',
    age: 20,
    phone: '17343691959',
    address: '南京',
    email: '1919600547@qq.com',
    photo: '',
  },
  educations: [
    {
      id: '1',
      school: '清华大学',
      major: '软件工程',
      degree: '本科',
      dateRange: [],
      visible: true,
      gpa: '',
      description: ``,
    },
  ],
  skills: ``,
  projects: [
    {
      id: '1',
      name: '中后台管理系统',
      role: '前端开发工程师',
      gitAddress: 'github.com',
      dateRange: [],
      visible: true,
      description: '',
    },
  ],
  internships: [
    {
      id: '1',
      companyName: '字节跳动',
      position: '前端开发工程师',
      department: '研发部',
      dateRange: [],
      visible: true,
      description: '',
    },
  ],
  globalConfiguration: initialGlobalConfiguration,
}
