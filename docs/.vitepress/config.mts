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
          { text: 'GitHub', link: '/tech-stack/foundation/github' },
          { text: 'Markdown', link: '/tech-stack/foundation/markdown' },
          { text: 'VitePress', link: '/tech-stack/foundation/vitepress' },
          { text: 'Python', link: '/tech-stack/foundation/python' },
          { text: 'Shell / PowerShell', link: '/tech-stack/foundation/shell-powershell' },
          { text: 'systemd', link: '/tech-stack/foundation/systemd' },
          { text: '网络基础', link: '/tech-stack/foundation/networking' },
          { text: '基础工具总览', link: '/tech-stack/01-foundation' }
        ]
      },
      {
        text: '可观测性',
        items: [
          { text: 'Prometheus', link: '/tech-stack/observability/prometheus' },
          { text: 'Grafana', link: '/tech-stack/observability/grafana' },
          { text: 'OpenTelemetry', link: '/tech-stack/observability/opentelemetry' },
          { text: 'Alertmanager', link: '/tech-stack/observability/alertmanager' },
          { text: 'Loki', link: '/tech-stack/observability/loki' },
          { text: 'Elasticsearch', link: '/tech-stack/observability/elasticsearch' },
          { text: '可观测性总览', link: '/tech-stack/02-observability' }
        ]
      },
      {
        text: '云原生',
        items: [
          { text: 'Docker', link: '/tech-stack/cloud-native/docker' },
          { text: 'Docker Compose', link: '/tech-stack/cloud-native/docker-compose' },
          { text: 'Kubernetes', link: '/tech-stack/cloud-native/kubernetes' },
          { text: 'Helm', link: '/tech-stack/cloud-native/helm' },
          { text: 'NGINX / Ingress', link: '/tech-stack/cloud-native/nginx-ingress' },
          { text: '云原生总览', link: '/tech-stack/03-cloud-native' }
        ]
      },
      {
        text: '自动化',
        items: [
          { text: 'Ansible', link: '/tech-stack/automation/ansible' },
          { text: 'Terraform', link: '/tech-stack/automation/terraform' },
          { text: 'GitHub Actions', link: '/tech-stack/automation/github-actions' },
          { text: 'CI/CD', link: '/tech-stack/automation/cicd' },
          { text: 'Runbook Automation', link: '/tech-stack/automation/runbook-automation' },
          { text: '自动化总览', link: '/tech-stack/04-automation-ci' }
        ]
      },
      {
        text: '数据与 AI',
        items: [
          { text: 'MySQL / SQL', link: '/tech-stack/data-ai/mysql-sql' },
          { text: 'Redis', link: '/tech-stack/data-ai/redis' },
          { text: 'Kafka', link: '/tech-stack/data-ai/kafka' },
          { text: 'pandas', link: '/tech-stack/data-ai/pandas' },
          { text: 'scikit-learn', link: '/tech-stack/data-ai/scikit-learn' },
          { text: 'FastAPI', link: '/tech-stack/data-ai/fastapi' },
          { text: 'LLM / OpenAI API', link: '/tech-stack/data-ai/llm-openai' },
          { text: 'RAG', link: '/tech-stack/data-ai/rag' },
          { text: '向量数据库', link: '/tech-stack/data-ai/vector-database' },
          { text: '数据与 AI 总览', link: '/tech-stack/05-data-ai' }
        ]
      },
      {
        text: 'SRE/AIOps 实践',
        items: [
          { text: 'SLI / SLO / SLA', link: '/tech-stack/sre-aiops/sli-slo-sla' },
          { text: '告警治理', link: '/tech-stack/sre-aiops/alert-governance' },
          { text: '事件响应', link: '/tech-stack/sre-aiops/incident-response' },
          { text: 'Runbook', link: '/tech-stack/sre-aiops/runbook' },
          { text: 'RCA 根因分析', link: '/tech-stack/sre-aiops/rca' },
          { text: '变更管理', link: '/tech-stack/sre-aiops/change-management' },
          { text: 'AIOps 闭环', link: '/tech-stack/sre-aiops/aiops-loop' },
          { text: 'SRE/AIOps 总览', link: '/tech-stack/06-sre-aiops-practices' }
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
