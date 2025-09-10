export const initialGlobalConfiguration = {
  baseFontSize: 16,
  basePagePadding: 10,
  baseLineHeight: 1.5,
  baseModuleSpacing: 10,
  titleFontSize: 20,
  subTitleFontSize: 18,
  themeColor: '#000',
}

export const DEFAULT_RESUME = {
  title: '未命名简历',
  createDate: new Date().toISOString(),
  basic: {
    name: '陈下饭',
    position: '前端开发工程师',
    age: 20,
    phone: '1234567',
    address: '南京',
    email: '1919600547@qq.com',
    photo: '',
  },
  education: [
    {
      id: '1',
      school: '清华大学',
      major: '软件工程',
      degree: '本科',
      startDate: '2023-09',
      endDate: '2027-06',
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
      startDate: '2025-03',
      endDate: '2025-06',
      visible: true,
      description: '',
    },
  ],
  globalConfiguration: initialGlobalConfiguration,
}
