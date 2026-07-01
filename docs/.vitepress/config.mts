import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'To Be Better AIOps Engineer',
  description: 'AIOps 学习路线、实战项目、面试准备和天津求职记录',
  themeConfig: {
    nav: [
      { text: '学习路线', link: '/roadmap/README' },
      { text: '技术栈', link: '/tech-stack/README' },
      { text: '实战项目', link: '/projects/README' },
      { text: '面试', link: '/interview/' },
      { text: '天津求职', link: '/job-search/tianjin' }
    ],
    sidebar: [
      {
        text: '开始',
        items: [
          { text: '首页', link: '/' },
          { text: '资料清单', link: '/resources' }
        ]
      },
      {
        text: '教程',
        items: [
          { text: '从 0 开始', link: '/tutorials/0001-start-from-zero' }
        ]
      },
      {
        text: '技术栈',
        items: [
          { text: '总清单', link: '/tech-stack/README' },
          { text: '拆分进度', link: '/tech-stack/progress' }
        ]
      },
      {
        text: '基础工具',
        items: [
          { text: 'Linux', link: '/tech-stack/foundation/linux' },
          { text: 'Git', link: '/tech-stack/foundation/git' },
          { text: 'Python', link: '/tech-stack/foundation/python' },
          { text: 'Shell / PowerShell', link: '/tech-stack/foundation/shell-powershell' },
          { text: '基础工具总览', link: '/tech-stack/01-foundation' }
        ]
      },
      {
        text: '可观测性',
        items: [
          { text: 'Prometheus', link: '/tech-stack/observability/prometheus' },
          { text: 'Grafana', link: '/tech-stack/observability/grafana' },
          { text: 'OpenTelemetry', link: '/tech-stack/observability/opentelemetry' },
          { text: '可观测性总览', link: '/tech-stack/02-observability' }
        ]
      },
      {
        text: '云原生',
        items: [
          { text: 'Docker', link: '/tech-stack/cloud-native/docker' },
          { text: 'Docker Compose', link: '/tech-stack/cloud-native/docker-compose' },
          { text: '云原生总览', link: '/tech-stack/03-cloud-native' }
        ]
      },
      {
        text: '路线',
        items: [
          { text: '学习路线', link: '/roadmap/README' },
          { text: '能力地图', link: '/roadmap/00-skill-map' }
        ]
      },
      {
        text: '项目',
        items: [
          { text: '项目总览', link: '/projects/README' },
          { text: '可观测性实验室', link: '/projects/01-observability-lab' },
          { text: '指标异常检测器', link: '/projects/02-metric-anomaly-detector' },
          { text: '告警降噪器', link: '/projects/03-alert-noise-reducer' }
        ]
      },
      {
        text: '求职',
        items: [
          { text: '面试准备', link: '/interview/' },
          { text: '天津求职', link: '/job-search/tianjin' }
        ]
      }
    ]
  }
})
